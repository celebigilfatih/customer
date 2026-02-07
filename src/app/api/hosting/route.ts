import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hostingCreateSchema } from '@/lib/validations'
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
        search ? { package: { contains: search, mode: 'insensitive' as const } } : {},
        customerId ? { customerId } : {},
      ].filter((c) => Object.keys(c).length > 0),
    }

    const [items, total] = await Promise.all([
      prisma.hosting.findMany({
        where: Object.keys(where.AND).length > 0 ? where : undefined,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hosting.count({
        where: Object.keys(where.AND).length > 0 ? where : undefined,
      }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
      package: sanitizeInput(body.package),
      server: sanitizeInput(body.server),
      ip: sanitizeInput(body.ip),
      panelUrl: body.panelUrl ? sanitizeInput(body.panelUrl) : undefined,
      panelUser: body.panelUser ? sanitizeInput(body.panelUser) : undefined,
      panelPass: body.panelPass ? sanitizeInput(body.panelPass) : undefined,
      notes: body.notes ? sanitizeInput(body.notes) : undefined,
    }
    const validated = hostingCreateSchema.parse(sanitized)
    const created = await prisma.hosting.create({
      data: {
        ...validated,
        endDate: new Date(validated.endDate),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}
