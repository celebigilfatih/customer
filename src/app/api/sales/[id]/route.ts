import { NextRequest, NextResponse } from "next/server"
import { InvoiceStatus, InvoiceType, Prisma } from "@/generated/prisma"
import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { saleInclude, serializeSale } from "@/lib/sales-read-model"
import { z } from "zod"

const salePatchSchema = z
  .object({
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict()

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id } = await params
    const invoice = await prisma.invoice.findFirst({
      where: { id, type: InvoiceType.SALE },
      include: saleInclude,
    })

    if (!invoice) {
      return NextResponse.json({ error: "Satış bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(serializeSale(invoice))
  } catch (error) {
    console.error("Satış detayı alınırken hata:", error)
    return NextResponse.json({ error: "Satış detayı alınamadı" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id } = await params
    const body = salePatchSchema.parse(await request.json())

    const existing = await prisma.invoice.findFirst({
      where: { id, type: InvoiceType.SALE },
      select: { id: true, status: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Satış bulunamadı" }, { status: 404 })
    }

    if (existing.status === InvoiceStatus.CANCELLED) {
      return NextResponse.json({ error: "İptal edilmiş satış düzenlenemez" }, { status: 409 })
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(body.dueDate ? { dueDate: parseDate(body.dueDate) } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      },
      include: saleInclude,
    })

    return NextResponse.json(serializeSale(invoice))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Yalnızca vade tarihi ve not düzenlenebilir", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Satış bulunamadı" }, { status: 404 })
    }

    console.error("Satış güncellenirken hata:", error)
    return NextResponse.json({ error: "Satış güncellenemedi" }, { status: 500 })
  }
}
