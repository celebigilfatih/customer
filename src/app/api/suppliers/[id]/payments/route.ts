import { NextRequest, NextResponse } from "next/server"
import { PaymentType, Prisma, SupplierPurchaseStatus } from "@/generated/prisma"
import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { createSupplierPaymentTransaction } from "@/lib/supplier-ledger"
import { z } from "zod"

const supplierPaymentSchema = z.object({
  purchaseId: z.string().min(1, "Alış kaydı gereklidir"),
  amount: z.coerce.number().positive("Ödeme tutarı pozitif olmalıdır"),
  type: z.enum(["CASH", "TRANSFER", "CREDIT_CARD"]).default("TRANSFER"),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ödeme tarihi geçerli olmalıdır"),
  note: z.string().max(1000).optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id: supplierId } = await context.params
    const body = await request.json()
    const input = supplierPaymentSchema.parse(body)
    const amount = new Prisma.Decimal(input.amount)

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.supplierPurchase.findFirst({
        where: {
          id: input.purchaseId,
          supplierId,
        },
      })

      if (!purchase) {
        return { error: "Alış kaydı bulunamadı", status: 404 as const }
      }

      if (purchase.status === SupplierPurchaseStatus.PAID) {
        return { error: "Bu alış kaydı zaten ödenmiş", status: 400 as const }
      }

      if (!amount.equals(purchase.total)) {
        return {
          error: "V1 tedarikçi ödemesi tam borç kapatma olarak çalışır",
          status: 400 as const,
        }
      }

      const payment = await tx.supplierPayment.create({
        data: {
          supplierId,
          purchaseId: purchase.id,
          amount,
          type: input.type as PaymentType,
          paidDate: parseDate(input.paidDate),
          note: input.note || `Alış ödemesi: ${purchase.description}`,
        },
      })

      await createSupplierPaymentTransaction(tx, payment)
      await tx.supplierPurchase.update({
        where: { id: purchase.id },
        data: { status: SupplierPurchaseStatus.PAID },
      })

      return { payment, status: 201 as const }
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.payment, { status: result.status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 })
    }

    console.error("Tedarikçi ödemesi oluşturulurken hata:", error)
    return NextResponse.json({ error: "Tedarikçi ödemesi oluşturulamadı" }, { status: 500 })
  }
}
