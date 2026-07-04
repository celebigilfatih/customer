import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma"
import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const supplierUpdateSchema = z.object({
  name: z.string().min(1, "Tedarikçi adı gereklidir").optional(),
  email: z.string().email("E-posta geçerli olmalıdır").optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  taxNumber: z.string().max(80).optional(),
  address: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

function normalizeSupplierInput(input: z.infer<typeof supplierUpdateSchema>) {
  return {
    ...input,
    email: input.email || undefined,
    phone: input.phone || undefined,
    taxNumber: input.taxNumber || undefined,
    address: input.address || undefined,
    notes: input.notes || undefined,
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id } = await context.params
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { createdAt: "desc" },
          include: {
            invoice: { select: { id: true, number: true, customerId: true } },
            invoiceItem: { select: { id: true, description: true } },
            product: { select: { id: true, name: true, code: true, type: true } },
          },
        },
        payments: {
          orderBy: { paidDate: "desc" },
          include: {
            purchase: { select: { id: true, description: true } },
          },
        },
        accountTransactions: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          include: {
            purchase: { select: { id: true, description: true } },
            payment: { select: { id: true, amount: true } },
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: "Tedarikçi bulunamadı" }, { status: 404 })
    }

    const latestBalance = supplier.accountTransactions[0]?.balance ?? new Prisma.Decimal(0)
    return NextResponse.json({ ...supplier, balance: latestBalance })
  } catch (error) {
    console.error("Tedarikçi alınırken hata:", error)
    return NextResponse.json({ error: "Tedarikçi alınamadı" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id } = await context.params
    const body = await request.json()
    const validatedData = supplierUpdateSchema.parse(body)

    const supplier = await prisma.supplier.update({
      where: { id },
      data: normalizeSupplierInput(validatedData),
    })

    return NextResponse.json(supplier)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 })
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Tedarikçi bulunamadı" }, { status: 404 })
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Bu tedarikçi adı zaten kullanılıyor" }, { status: 400 })
    }

    console.error("Tedarikçi güncellenirken hata:", error)
    return NextResponse.json({ error: "Tedarikçi güncellenemedi" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id } = await context.params
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Tedarikçi pasife alındı", supplier })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Tedarikçi bulunamadı" }, { status: 404 })
    }

    console.error("Tedarikçi pasife alınırken hata:", error)
    return NextResponse.json({ error: "Tedarikçi pasife alınamadı" }, { status: 500 })
  }
}
