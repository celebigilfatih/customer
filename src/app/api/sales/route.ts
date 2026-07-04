import { NextRequest, NextResponse } from "next/server"
import { InvoiceStatus, InvoiceType, Prisma } from "@/generated/prisma"
import { requireAdminApi } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { saleInclude, serializeSale } from "@/lib/sales-read-model"

function parsePageParam(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseDateParam(value: string | null) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const page = parsePageParam(searchParams.get("page"), 1)
    const limit = Math.min(parsePageParam(searchParams.get("limit"), 20), 100)
    const search = searchParams.get("search")?.trim()
    const customerId = searchParams.get("customerId") || undefined
    const status = searchParams.get("status") as InvoiceStatus | null
    const dateFrom = parseDateParam(searchParams.get("dateFrom"))
    const dateTo = parseDateParam(searchParams.get("dateTo"))

    const where: Prisma.InvoiceWhereInput = {
      type: InvoiceType.SALE,
      ...(customerId ? { customerId } : {}),
      ...(status && Object.values(InvoiceStatus).includes(status) ? { status } : {}),
      ...(dateFrom || dateTo
        ? {
            issueDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: new Date(dateTo.getTime() + 86_399_999) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: "insensitive" } },
              { notes: { contains: search, mode: "insensitive" } },
              { customer: { fullName: { contains: search, mode: "insensitive" } } },
              { customer: { club: { contains: search, mode: "insensitive" } } },
              { items: { some: { description: { contains: search, mode: "insensitive" } } } },
              { domains: { some: { name: { contains: search, mode: "insensitive" } } } },
              { hostings: { some: { name: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    }

    const [total, invoices, summaryInvoices] = await prisma.$transaction([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: saleInclude,
        orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.findMany({
        where,
        select: {
          status: true,
          total: true,
          payments: {
            select: {
              amount: true,
              status: true,
            },
          },
        },
      }),
    ])

    const serialized = invoices.map(serializeSale)
    const summary = summaryInvoices.reduce(
      (acc, sale) => {
        const totalAmount = new Prisma.Decimal(sale.total)
        const paidAmount = sale.payments
          .filter((payment) => payment.status === "PAID")
          .reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0))
        const remainingAmount =
          sale.status === InvoiceStatus.CANCELLED ? new Prisma.Decimal(0) : totalAmount.minus(paidAmount)

        if (sale.status === InvoiceStatus.CANCELLED) {
          acc.cancelledCount += 1
          acc.cancelledTotal = acc.cancelledTotal.plus(totalAmount)
        } else {
          acc.activeCount += 1
          acc.total = acc.total.plus(totalAmount)
          acc.paid = acc.paid.plus(paidAmount)
          acc.remaining = acc.remaining.plus(remainingAmount)
        }

        return acc
      },
      {
        activeCount: 0,
        cancelledCount: 0,
        total: new Prisma.Decimal(0),
        paid: new Prisma.Decimal(0),
        remaining: new Prisma.Decimal(0),
        cancelledTotal: new Prisma.Decimal(0),
      }
    )

    return NextResponse.json({
      data: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        activeCount: summary.activeCount,
        cancelledCount: summary.cancelledCount,
        total: summary.total.toString(),
        paid: summary.paid.toString(),
        remaining: summary.remaining.toString(),
        cancelledTotal: summary.cancelledTotal.toString(),
      },
    })
  } catch (error) {
    console.error("Satışlar listelenirken hata:", error)
    return NextResponse.json({ error: "Satışlar listelenemedi" }, { status: 500 })
  }
}
