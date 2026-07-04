import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/generated/prisma"
import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const supplierSchema = z.object({
  name: z.string().min(1, "Tedarikçi adı gereklidir"),
  email: z.string().email("E-posta geçerli olmalıdır").optional().or(z.literal("")),
  phone: z.string().max(50).optional(),
  taxNumber: z.string().max(80).optional(),
  address: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
})

function normalizeSupplierInput(input: z.infer<typeof supplierSchema>) {
  return {
    ...input,
    email: input.email || undefined,
    phone: input.phone || undefined,
    taxNumber: input.taxNumber || undefined,
    address: input.address || undefined,
    notes: input.notes || undefined,
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const isActive = searchParams.get("isActive")

    const where: Prisma.SupplierWhereInput = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }
    if (isActive !== null) {
      where.isActive = isActive === "true"
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        purchases: {
          select: { total: true, status: true },
        },
        payments: {
          select: { amount: true },
        },
        accountTransactions: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 1,
          select: { balance: true },
        },
      },
    })

    return NextResponse.json(
      suppliers.map((supplier) => ({
        ...supplier,
        balance: supplier.accountTransactions[0]?.balance ?? new Prisma.Decimal(0),
      }))
    )
  } catch (error) {
    console.error("Tedarikçi listesi alınırken hata:", error)
    return NextResponse.json({ error: "Tedarikçi listesi alınamadı" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const body = await request.json()
    const validatedData = supplierSchema.parse(body)

    const supplier = await prisma.supplier.create({
      data: normalizeSupplierInput(validatedData),
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validasyon hatası", details: error.issues }, { status: 400 })
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Bu tedarikçi adı zaten kullanılıyor" }, { status: 400 })
    }

    console.error("Tedarikçi oluşturulurken hata:", error)
    return NextResponse.json({ error: "Tedarikçi oluşturulamadı" }, { status: 500 })
  }
}
