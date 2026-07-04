import { NextRequest, NextResponse } from "next/server"
import {
  InvoiceStatus,
  InvoiceType,
  MovementType,
  PaymentStatus,
  Prisma,
  SupplierPurchaseStatus,
  SupplierTransactionType,
  TransactionType,
} from "@/generated/prisma"
import { createAccountTransaction, rebuildCustomerLedgerBalances } from "@/lib/accounting-ledger"
import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { saleInclude, serializeSale } from "@/lib/sales-read-model"
import {
  createSupplierPurchaseCancellationTransaction,
  rebuildSupplierLedgerBalances,
} from "@/lib/supplier-ledger"

class SaleCancelError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
  }
}

function appendCancellationNote(value: string | null | undefined, invoiceNumber: string) {
  const note = `Satış iptal edildi: ${invoiceNumber}`
  if (value?.includes(note)) return value
  return value ? `${value}\n${note}` : note
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, type: InvoiceType.SALE },
        include: {
          payments: true,
          stockMovements: true,
          supplierPurchases: {
            include: {
              payments: true,
              accountTransactions: true,
            },
          },
          accountTransactions: true,
          domains: true,
          hostings: true,
        },
      })

      if (!invoice) throw new SaleCancelError(404, "Satış bulunamadı")

      if (invoice.status === InvoiceStatus.CANCELLED) {
        return { alreadyCancelled: true }
      }

      const paidSupplierPurchase = invoice.supplierPurchases.find(
        (purchase) =>
          purchase.status === SupplierPurchaseStatus.PAID || purchase.payments.length > 0
      )
      if (paidSupplierPurchase) {
        throw new SaleCancelError(
          409,
          "Tedarikçiye ödemesi yapılmış satışlar otomatik iptal edilemez"
        )
      }

      const hasInvoiceCancellation = invoice.accountTransactions.some(
        (transaction) => transaction.type === TransactionType.INVOICE_CANCELLATION_CREDIT
      )
      if (!hasInvoiceCancellation) {
        await createAccountTransaction(tx, {
          customerId: invoice.customerId,
          type: TransactionType.INVOICE_CANCELLATION_CREDIT,
          debit: 0,
          credit: invoice.total,
          invoiceId: invoice.id,
          description: `Satış iptali: ${invoice.number}`,
        })
      }

      for (const payment of invoice.payments) {
        if (payment.status !== PaymentStatus.PAID) continue

        const existingPaymentCancellation = await tx.accountTransaction.findFirst({
          where: {
            paymentId: payment.id,
            type: TransactionType.PAYMENT_CANCELLATION_DEBIT,
          },
          select: { id: true },
        })

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.CANCELLED },
        })

        if (!existingPaymentCancellation) {
          await createAccountTransaction(tx, {
            customerId: payment.customerId,
            type: TransactionType.PAYMENT_CANCELLATION_DEBIT,
            debit: payment.amount,
            credit: 0,
            invoiceId: invoice.id,
            paymentId: payment.id,
            description: `Tahsilat iptali: ${invoice.number}`,
          })
        }
      }

      for (const movement of invoice.stockMovements) {
        if (movement.type !== MovementType.OUT) continue

        await tx.product.update({
          where: { id: movement.productId },
          data: { stockQuantity: { increment: movement.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            productId: movement.productId,
            type: MovementType.IN,
            quantity: movement.quantity,
            invoiceId: invoice.id,
            description: `Satış iptali: ${invoice.number}`,
          },
        })
      }

      const affectedSupplierIds = new Set<string>()
      for (const purchase of invoice.supplierPurchases) {
        if (purchase.status !== SupplierPurchaseStatus.DUE) continue

        await tx.supplierPurchase.update({
          where: { id: purchase.id },
          data: { status: SupplierPurchaseStatus.CANCELLED },
        })

        const hasPurchaseCancellation = purchase.accountTransactions.some(
          (transaction) => transaction.type === SupplierTransactionType.PURCHASE_CANCELLATION
        )
        if (!hasPurchaseCancellation) {
          await createSupplierPurchaseCancellationTransaction(tx, {
            id: purchase.id,
            supplierId: purchase.supplierId,
            total: purchase.total,
            description: purchase.description,
          })
        }

        affectedSupplierIds.add(purchase.supplierId)
      }

      for (const domain of invoice.domains) {
        await tx.domain.update({
          where: { id: domain.id },
          data: { whoisNote: appendCancellationNote(domain.whoisNote, invoice.number) },
        })
      }

      for (const hosting of invoice.hostings) {
        await tx.hosting.update({
          where: { id: hosting.id },
          data: { notes: appendCancellationNote(hosting.notes, invoice.number) },
        })
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.CANCELLED },
      })

      await rebuildCustomerLedgerBalances(tx, invoice.customerId)
      for (const supplierId of affectedSupplierIds) {
        await rebuildSupplierLedgerBalances(tx, supplierId)
      }

      return { alreadyCancelled: false }
    })

    const sale = await prisma.invoice.findFirst({
      where: { id, type: InvoiceType.SALE },
      include: saleInclude,
    })

    if (!sale) {
      return NextResponse.json({ error: "Satış bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({
      ...serializeSale(sale),
      alreadyCancelled: result.alreadyCancelled,
    })
  } catch (error) {
    if (error instanceof SaleCancelError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Satış bulunamadı" }, { status: 404 })
    }

    console.error("Satış iptal edilirken hata:", error)
    return NextResponse.json({ error: "Satış iptal edilemedi" }, { status: 500 })
  }
}
