import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import { customerCreateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'
import { isAdminApiUser, requireAdminApi, requireAuthenticatedApi } from '@/lib/api-auth'

function sanitizeMaybeString(value: unknown) {
  return typeof value === 'string' ? sanitizeInput(value) : value
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedApi(request)
    if (auth.response) return auth.response

    if (!isAdminApiUser(auth.user)) {
      return NextResponse.json(
        { error: 'Bu işlem için yetki yok' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100 items per page
    const search = sanitizeInput(searchParams.get('search') || '')
    const city = sanitizeInput(searchParams.get('city') || '')
    const club = sanitizeInput(searchParams.get('club') || '')

    const skip = (page - 1) * limit

    const filters: Prisma.CustomerWhereInput[] = []

    if (search) {
      filters.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { sportsSchoolOfficial: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { district: { contains: search, mode: 'insensitive' as const } },
          { club: { contains: search, mode: 'insensitive' as const } },
        ]
      })
    }

    if (city) {
      filters.push({ city: { contains: city, mode: 'insensitive' as const } })
    }

    if (club) {
      filters.push({ club: { contains: club, mode: 'insensitive' as const } })
    }

    const where: Prisma.CustomerWhereInput | undefined =
      filters.length > 0 ? { AND: filters } : undefined

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { notes: true }
          }
        }
      }),
      prisma.customer.count({
        where,
      })
    ])

    const customerIds = customers.map((customer) => customer.id)
    const accountTotals = customerIds.length > 0
      ? await prisma.accountTransaction.groupBy({
          by: ['customerId'],
          where: { customerId: { in: customerIds } },
          _sum: {
            debit: true,
            credit: true,
          },
        })
      : []

    const accountTotalsByCustomer = new Map(
      accountTotals.map((total) => {
        const totalDebit = Number(total._sum.debit || 0)
        const totalCredit = Number(total._sum.credit || 0)

        return [
          total.customerId,
          {
            totalDebit,
            totalCredit,
            balance: totalDebit - totalCredit,
          },
        ]
      })
    )

    const data = customers.map((customer) => ({
      ...customer,
      accountingSummary: accountTotalsByCustomer.get(customer.id) || {
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
      },
    }))

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const body = await request.json() as Record<string, unknown>

    // Sanitize string inputs
    const sanitizedBody = {
      ...body,
      fullName: sanitizeMaybeString(body.fullName),
      firmaAdi: sanitizeMaybeString(body.firmaAdi),
      phoneNumber: sanitizeMaybeString(body.phoneNumber),
      city: sanitizeMaybeString(body.city),
      district: sanitizeMaybeString(body.district),
      club: sanitizeMaybeString(body.club),
      sportsSchoolOfficial: sanitizeMaybeString(body.sportsSchoolOfficial),
      address: sanitizeMaybeString(body.address),
      price: sanitizeMaybeString(body.price),
    }

    const validatedData = customerCreateSchema.parse(sanitizedBody)

    const createData = {
      ...validatedData,
      hosting: "",
      duration: "",
      startDate: "",
      endDate: "",
      offer: "",
    }

    const customer = await prisma.customer.create({
      data: createData,
      include: {
        notes: true,
        _count: {
          select: { notes: true }
        }
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
