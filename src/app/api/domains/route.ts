import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import { domainCreateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = sanitizeInput(searchParams.get('search') || '')
    const customerId = sanitizeInput(searchParams.get('customerId') || '')

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? { name: { contains: search, mode: 'insensitive' as const } } : {},
        customerId ? { customerId } : {},
      ].filter((c) => Object.keys(c).length > 0),
    }
    const baseWhere: Prisma.DomainWhereInput | undefined = Object.keys(where.AND).length > 0 ? where : undefined
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysLater = new Date(today)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const withBaseWhere = (extra: Prisma.DomainWhereInput): Prisma.DomainWhereInput =>
      baseWhere ? { AND: [baseWhere, extra] } : extra

    const [items, total, expiringSoon, expired, linkedInvoice] = await Promise.all([
      prisma.domain.findMany({
        where: baseWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              club: true,
              fullName: true,
            },
          },
          invoice: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      }),
      prisma.domain.count({
        where: baseWhere,
      }),
      prisma.domain.count({
        where: withBaseWhere({ renewDate: { gte: today, lte: thirtyDaysLater } }),
      }),
      prisma.domain.count({
        where: withBaseWhere({ renewDate: { lt: today } }),
      }),
      prisma.domain.count({
        where: withBaseWhere({ invoiceId: { not: null } }),
      }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: { total, expiringSoon, expired, linkedInvoice },
    })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitized = {
      ...body,
      name: sanitizeInput(body.name),
      whoisNote: body.whoisNote ? sanitizeInput(body.whoisNote) : undefined,
    }
    const validated = domainCreateSchema.parse(sanitized)
    const created = await prisma.domain.create({
      data: {
        ...validated,
        registerDate: new Date(validated.registerDate),
        renewDate: new Date(validated.renewDate),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}
