import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  CustomerStatus,
  InvoiceStatus,
  InvoiceType,
  PaymentStatus,
  PaymentType,
  Prisma,
  ProductType,
  SupplierPurchaseStatus,
  TransactionType,
} from "@/generated/prisma"
import { createAccountTransaction, syncPaymentCreditTransaction } from "@/lib/accounting-ledger"
import { requireAdminApi } from "@/lib/api-auth"
import {
  createSupplierPaymentTransaction,
  createSupplierPurchaseDebtTransaction,
} from "@/lib/supplier-ledger"
import { z } from "zod"

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih geçerli olmalıdır")

const supplierPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Tedarikçi gereklidir"),
  unitCost: z.coerce.number().positive("Alış tutarı pozitif olmalıdır"),
  taxRate: z.coerce.number().min(0).max(100).default(20),
  purchaseDate: dateSchema,
  dueDate: dateSchema.optional(),
  status: z.enum(["DUE", "PAID"]).default("DUE"),
  paymentType: z.enum(["CASH", "TRANSFER", "CREDIT_CARD"]).default("TRANSFER"),
  supplierInvoiceNo: z.string().max(120).optional(),
  note: z.string().max(1000).optional(),
})

const operationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("DOMAIN"),
    name: z.string().min(1, "Domain adı gereklidir"),
    registerDate: dateSchema,
    renewDate: dateSchema,
    autoRenew: z.boolean().default(false),
    whoisNote: z.string().max(1000).optional(),
  }),
  z.object({
    type: z.literal("HOSTING"),
    name: z.string().min(1, "Hosting hizmet adı gereklidir"),
    endDate: dateSchema,
    notes: z.string().max(1000).optional(),
  }),
])

const saleItemSchema = z.object({
  productId: z.string().min(1).optional(),
  description: z.string().min(1, "Açıklama gereklidir"),
  quantity: z.coerce.number().positive("Miktar pozitif olmalıdır"),
  unitPrice: z.coerce.number().positive("Birim fiyat pozitif olmalıdır"),
  purchase: supplierPurchaseSchema.optional(),
  operation: operationSchema.optional(),
})

const directSaleSchema = z.object({
  idempotencyKey: z.string().min(8).max(120),
  customerId: z.string().min(1, "Müşteri gereklidir"),
  dueDate: dateSchema,
  taxRate: z.coerce.number().min(0).max(100).default(20),
  notes: z.string().max(2000).optional(),
  paymentMode: z.enum(["CREDIT", "PARTIAL", "PAID"]),
  paymentType: z.enum(["CASH", "TRANSFER", "CREDIT_CARD"]).default("CASH"),
  paidAmount: z.coerce.number().min(0).optional(),
  paymentNote: z.string().max(1000).optional(),
  items: z.array(saleItemSchema).min(1, "En az bir satış kalemi gereklidir"),
})

class DirectSaleError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

type DirectSaleInput = z.infer<typeof directSaleSchema>
type SaleItemInput = DirectSaleInput["items"][number]

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value)
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

function calculateLineTotal(item: SaleItemInput) {
  return decimal(item.quantity).mul(item.unitPrice)
}

function normalizeText(value: string | null | undefined) {
  return (value || "").toLocaleLowerCase("tr-TR")
}

function inferOperationType(product?: {
  name: string
  group?: { name: string } | null
}) {
  const groupName = normalizeText(product?.group?.name)
  const productName = normalizeText(product?.name)
  if (groupName.includes("domain") || productName.includes("domain")) return "DOMAIN"
  if (groupName.includes("hosting") || productName.includes("hosting")) return "HOSTING"
  return null
}

function calculatePurchaseTotals(item: SaleItemInput) {
  if (!item.purchase) return null

  const subtotal = decimal(item.quantity).mul(item.purchase.unitCost)
  const taxRate = decimal(item.purchase.taxRate)
  const taxAmount = subtotal.mul(taxRate).div(100)
  return {
    subtotal,
    taxRate,
    taxAmount,
    total: subtotal.plus(taxAmount),
  }
}

function calculateSubtotal(items: SaleItemInput[]) {
  return items.reduce((sum, item) => sum.plus(calculateLineTotal(item)), new Prisma.Decimal(0))
}

function calculatePaidAmount(input: DirectSaleInput, total: Prisma.Decimal) {
  if (input.paymentMode === "CREDIT") return new Prisma.Decimal(0)
  if (input.paymentMode === "PAID") return total

  const paidAmount = decimal(input.paidAmount ?? 0)
  if (paidAmount.lessThanOrEqualTo(0)) {
    throw new DirectSaleError(400, "Kısmi satışta tahsilat tutarı 0'dan büyük olmalıdır")
  }
  if (paidAmount.greaterThanOrEqualTo(total)) {
    throw new DirectSaleError(400, "Kısmi tahsilat toplam tutardan küçük olmalıdır")
  }
  return paidAmount
}

function getInvoiceStatus(input: DirectSaleInput) {
  if (input.paymentMode === "PAID") return InvoiceStatus.PAID
  if (input.paymentMode === "PARTIAL") return InvoiceStatus.PARTIAL
  return InvoiceStatus.ISSUED
}

async function generateInvoiceNumber(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear()
  const lastInvoice = await tx.invoice.findFirst({
    where: { number: { startsWith: `F-${year}` } },
    orderBy: { number: "desc" },
    select: { number: true },
  })
  const sequence = lastInvoice ? parseInt(lastInvoice.number.split("-")[2], 10) + 1 : 1
  return `F-${year}-${sequence.toString().padStart(6, "0")}`
}

async function loadIdempotentResult(idempotencyKey: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { idempotencyKey },
    include: {
      customer: { select: { id: true, fullName: true } },
      items: true,
      payments: true,
      accountTransactions: true,
      stockMovements: true,
      supplierPurchases: true,
      domains: true,
      hostings: true,
    },
  })

  if (!invoice) return null

  return {
    idempotent: true,
    invoice,
    payment: invoice.payments[0] ?? null,
    summary: {
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      paidAmount: invoice.payments.reduce(
        (sum, payment) => sum.plus(payment.amount),
        new Prisma.Decimal(0)
      ),
      remainingAmount: invoice.total.minus(
        invoice.payments.reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0))
      ),
    },
  }
}

export async function POST(request: NextRequest) {
  let requestIdempotencyKey: string | null = null

  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const body = await request.json()
    const input = directSaleSchema.parse(body)
    requestIdempotencyKey = input.idempotencyKey

    const existing = await loadIdempotentResult(input.idempotencyKey)
    if (existing) return NextResponse.json(existing, { status: 200 })

    const result = await prisma.$transaction(async (tx) => {
      const existingInTransaction = await tx.invoice.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: {
          customer: { select: { id: true, fullName: true } },
          items: true,
          payments: true,
          accountTransactions: true,
          stockMovements: true,
          supplierPurchases: true,
          domains: true,
          hostings: true,
        },
      })
      if (existingInTransaction) {
        return {
          idempotent: true,
          invoice: existingInTransaction,
          payment: existingInTransaction.payments[0] ?? null,
          summary: {
            subtotal: existingInTransaction.subtotal,
            taxAmount: existingInTransaction.taxAmount,
            total: existingInTransaction.total,
            paidAmount: existingInTransaction.payments.reduce(
              (sum, payment) => sum.plus(payment.amount),
              new Prisma.Decimal(0)
            ),
            remainingAmount: existingInTransaction.total.minus(
              existingInTransaction.payments.reduce(
                (sum, payment) => sum.plus(payment.amount),
                new Prisma.Decimal(0)
              )
            ),
          },
        }
      }

      const customer = await tx.customer.findUnique({
        where: { id: input.customerId },
        select: { id: true },
      })
      if (!customer) throw new DirectSaleError(404, "Müşteri bulunamadı")

      await tx.customer.updateMany({
        where: {
          id: input.customerId,
          status: CustomerStatus.POTENTIAL,
        },
        data: {
          status: CustomerStatus.ACTIVE,
        },
      })

      const productIds = Array.from(
        new Set(input.items.map((item) => item.productId).filter((id): id is string => Boolean(id)))
      )
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
          stockQuantity: true,
          group: { select: { name: true } },
        },
      })
      const productsById = new Map(products.map((product) => [product.id, product]))

      for (const productId of productIds) {
        const product = productsById.get(productId)
        if (!product) throw new DirectSaleError(400, "Satış kalemindeki ürün bulunamadı")
        if (!product.isActive) throw new DirectSaleError(400, `${product.name} aktif değil`)
      }

      const supplierIds = Array.from(
        new Set(
          input.items
            .map((item) => item.purchase?.supplierId)
            .filter((id): id is string => Boolean(id))
        )
      )
      const suppliers = await tx.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, name: true, isActive: true },
      })
      const suppliersById = new Map(suppliers.map((supplier) => [supplier.id, supplier]))
      for (const supplierId of supplierIds) {
        const supplier = suppliersById.get(supplierId)
        if (!supplier) throw new DirectSaleError(400, "Tedarikçi bulunamadı")
        if (!supplier.isActive) throw new DirectSaleError(400, `${supplier.name} aktif değil`)
      }

      for (const item of input.items) {
        const product = item.productId ? productsById.get(item.productId) : undefined
        const expectedOperationType = inferOperationType(product)
        if (expectedOperationType && !item.operation) {
          throw new DirectSaleError(
            400,
            `${product?.name ?? item.description} için operasyon bilgisi gereklidir`
          )
        }
        if (expectedOperationType && item.operation?.type !== expectedOperationType) {
          throw new DirectSaleError(
            400,
            `${product?.name ?? item.description} operasyon türü katalog grubuyla uyumsuz`
          )
        }
      }

      const subtotal = calculateSubtotal(input.items)
      const taxRate = decimal(input.taxRate)
      const taxAmount = subtotal.mul(taxRate).div(100)
      const total = subtotal.plus(taxAmount)
      const paidAmount = calculatePaidAmount(input, total)
      const remainingAmount = total.minus(paidAmount)
      const invoiceNumber = await generateInvoiceNumber(tx)
      const issueDate = new Date()
      const dueDate = parseDate(input.dueDate)

      const invoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          idempotencyKey: input.idempotencyKey,
          customerId: input.customerId,
          type: InvoiceType.SALE,
          status: getInvoiceStatus(input),
          subtotal,
          taxRate,
          taxAmount,
          total,
          issueDate,
          dueDate,
          notes: input.notes,
        },
        include: {
          customer: { select: { id: true, fullName: true } },
        },
      })

      const invoiceItems = []
      const supplierPurchases = []
      const supplierPayments = []
      const domains = []
      const hostings = []

      for (const item of input.items) {
        const invoiceItem = await tx.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: item.productId,
            description: item.description,
            quantity: decimal(item.quantity),
            unitPrice: decimal(item.unitPrice),
            totalPrice: calculateLineTotal(item),
          },
        })
        invoiceItems.push(invoiceItem)

        if (item.operation?.type === "DOMAIN") {
          domains.push(
            await tx.domain.create({
              data: {
                customerId: input.customerId,
                invoiceId: invoice.id,
                invoiceItemId: invoiceItem.id,
                name: item.operation.name,
                registerDate: parseDate(item.operation.registerDate),
                renewDate: parseDate(item.operation.renewDate),
                autoRenew: item.operation.autoRenew,
                whoisNote: item.operation.whoisNote,
              },
            })
          )
        } else if (item.operation?.type === "HOSTING") {
          hostings.push(
            await tx.hosting.create({
              data: {
                customerId: input.customerId,
                invoiceId: invoice.id,
                invoiceItemId: invoiceItem.id,
                name: item.operation.name,
                endDate: parseDate(item.operation.endDate),
                notes: item.operation.notes,
              },
            })
          )
        }

        const purchaseTotals = calculatePurchaseTotals(item)
        if (item.purchase && purchaseTotals) {
          const supplierPurchase = await tx.supplierPurchase.create({
            data: {
              supplierId: item.purchase.supplierId,
              invoiceId: invoice.id,
              invoiceItemId: invoiceItem.id,
              productId: item.productId,
              description: item.description,
              quantity: decimal(item.quantity),
              unitCost: decimal(item.purchase.unitCost),
              taxRate: purchaseTotals.taxRate,
              taxAmount: purchaseTotals.taxAmount,
              total: purchaseTotals.total,
              purchaseDate: parseDate(item.purchase.purchaseDate),
              dueDate: item.purchase.dueDate ? parseDate(item.purchase.dueDate) : undefined,
              status:
                item.purchase.status === "PAID"
                  ? SupplierPurchaseStatus.PAID
                  : SupplierPurchaseStatus.DUE,
              supplierInvoiceNo: item.purchase.supplierInvoiceNo,
              note: item.purchase.note,
            },
          })
          supplierPurchases.push(supplierPurchase)

          await createSupplierPurchaseDebtTransaction(tx, {
            id: supplierPurchase.id,
            supplierId: supplierPurchase.supplierId,
            total: supplierPurchase.total,
            description: supplierPurchase.description,
          })

          if (supplierPurchase.status === SupplierPurchaseStatus.PAID) {
            const supplierPayment = await tx.supplierPayment.create({
              data: {
                supplierId: supplierPurchase.supplierId,
                purchaseId: supplierPurchase.id,
                type: item.purchase.paymentType as PaymentType,
                amount: supplierPurchase.total,
                currency: supplierPurchase.currency,
                paidDate: parseDate(item.purchase.purchaseDate),
                note:
                  item.purchase.note ||
                  `Direkt satış alış ödemesi: ${invoice.number} / ${supplierPurchase.description}`,
              },
            })
            supplierPayments.push(supplierPayment)
            await createSupplierPaymentTransaction(tx, supplierPayment)
          }
        }
      }

      const debtTransaction = await createAccountTransaction(tx, {
        customerId: input.customerId,
        type: TransactionType.INVOICE_DEBT,
        debit: total,
        credit: 0,
        invoiceId: invoice.id,
        description: `Direkt satış faturası: ${invoice.number}`,
      })

      for (const item of input.items) {
        if (!item.productId) continue

        const quantity = decimal(item.quantity)
        const product = productsById.get(item.productId)
        if (product?.type === ProductType.SERVICE) continue

        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: { gte: quantity },
          },
          data: {
            stockQuantity: { decrement: quantity },
          },
        })

        if (updateResult.count !== 1) {
          throw new DirectSaleError(400, `Yetersiz stok: ${product?.name ?? item.description}`)
        }

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "OUT",
            quantity,
            invoiceId: invoice.id,
            description: `Direkt satış faturası: ${invoice.number}`,
          },
        })
      }

      const payment =
        paidAmount.greaterThan(0)
          ? await tx.payment.create({
              data: {
                customerId: input.customerId,
                invoiceId: invoice.id,
                type: input.paymentType as PaymentType,
                amount: paidAmount,
                currency: "TRY",
                date: issueDate,
                dueDate,
                paidDate: issueDate,
                status: PaymentStatus.PAID,
                note: input.paymentNote || `Direkt satış tahsilatı: ${invoice.number}`,
              },
            })
          : null

      if (payment) {
        await syncPaymentCreditTransaction(tx, payment)
      }

      return {
        idempotent: false,
        invoice: { ...invoice, items: invoiceItems },
        payment,
        debtTransaction,
        supplierPurchases,
        supplierPayments,
        domains,
        hostings,
        summary: {
          subtotal,
          taxAmount,
          total,
          paidAmount,
          remainingAmount,
        },
      }
    })

    return NextResponse.json(result, { status: result.idempotent ? 200 : 201 })
  } catch (error) {
    if (error instanceof DirectSaleError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      )
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      if (requestIdempotencyKey) {
        const existing = await loadIdempotentResult(requestIdempotencyKey)
        if (existing) return NextResponse.json(existing, { status: 200 })
      }
    }

    console.error("Direkt satış oluşturulurken hata:", error)
    return NextResponse.json({ error: "Direkt satış oluşturulamadı" }, { status: 500 })
  }
}
