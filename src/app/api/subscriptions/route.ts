import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BillingPeriod, SubscriptionStatus, SubscriptionType, Prisma } from '@/generated/prisma'
import { subscriptionCreateSchema, subscriptionUpdateSchema } from '@/lib/validations'
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

    const [items, total] = await Promise.all([
      prisma.subscription.findMany({
        where: Object.keys(where.AND).length > 0 ? where : undefined,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { fullName: true } } },
      }),
      prisma.subscription.count({
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
      name: sanitizeInput(body.name),
      price: sanitizeInput(body.price),
    }
    const validated = subscriptionCreateSchema.parse(sanitized)
    const { types, ...rest } = validated
    // Map type labels to their enum values for default naming
    const typeLabelMap: Record<string, string> = {
      SOFTWARE_RENTAL: 'Yazılım Kiralama',
      CUSTOM_PROJECT: 'Özel Proje',
      MAINTENANCE: 'Bakım Anlaşması',
      NEXT_GEN_COACHING: 'Next Gen Coaching',
      AIDAT_TAKIP: 'Aidat Takip',
      FOOTBALL_CMS: 'Football Cms',
      DOMAIN: 'Domain',
      HOSTING: 'Hosting',
    }
    const firstType = (types && types[0]) as string | undefined
    const autoName = firstType ? `Abonelik - ${typeLabelMap[firstType] || firstType}` : 'Abonelik'
    const finalName = rest.name && rest.name.length >= 2 ? rest.name : autoName
    const created = await prisma.subscription.create({
      data: {
        ...rest,
        name: finalName,
        type: types as any, // Temporary cast until Prisma client is regenerated
        period: validated.period as BillingPeriod,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        status: validated.status as SubscriptionStatus,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = body.id
    if (!id || typeof id !== 'string' || id.length < 1) {
      return NextResponse.json({ message: 'Invalid ID', status: 400 }, { status: 400 })
    }
    const sanitized = {
      ...body,
      name: sanitizeInput(body.name),
      price: sanitizeInput(body.price),
    }
    const validated = subscriptionUpdateSchema.parse(sanitized)
    const { types, ...rest } = validated
    const data: Prisma.SubscriptionUncheckedUpdateInput = { ...rest }
    if (types) data.type = types as any // Temporary cast until Prisma client is regenerated
    if (validated.period) data.period = validated.period as BillingPeriod
    if (validated.startDate) data.startDate = new Date(validated.startDate)
    if (validated.endDate) data.endDate = new Date(validated.endDate)
    if (validated.status) data.status = validated.status as SubscriptionStatus
    const updated = await prisma.subscription.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idFromQuery = searchParams.get('id')
    let id = idFromQuery
    if (!id) {
      try {
        const body = await request.json()
        id = body?.id
      } catch {}
    }
    if (!id || typeof id !== 'string' || id.length < 1) {
      return NextResponse.json({ message: 'Invalid ID', status: 400 }, { status: 400 })
    }
    const deleted = await prisma.subscription.delete({ where: { id } })
    return NextResponse.json(deleted)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}
