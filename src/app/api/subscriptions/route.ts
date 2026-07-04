import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BillingPeriod, PaymentStatus, SubscriptionStatus, Prisma } from '@/generated/prisma'
import { subscriptionCreateSchema, subscriptionUpdateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'
import { requireAdminApi } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = sanitizeInput(searchParams.get('search') || '')
    const customerId = sanitizeInput(searchParams.get('customerId') || '')
    const all = searchParams.get('all') === 'true'

    if (all) {
      const auth = await requireAdminApi(request)
      if (auth.response) return auth.response
    }

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
        ...(all ? {} : { skip, take: limit }),
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { fullName: true } } },
      }),
      prisma.subscription.count({
        where: Object.keys(where.AND).length > 0 ? where : undefined,
      }),
    ])

    return NextResponse.json({
      data: items,
      pagination: {
        page: all ? 1 : page,
        limit: all ? total : limit,
        total,
        totalPages: all ? 1 : Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const body = await request.json()
    const sanitized = {
      ...body,
      name: body.name ? sanitizeInput(body.name) : undefined,
      price: body.price ? sanitizeInput(body.price) : undefined,
      paymentAmount: body.paymentAmount ? sanitizeInput(body.paymentAmount) : undefined,
    }
    const validated = subscriptionCreateSchema.parse(sanitized)
    const { types, yearlyPlan, paymentAmount, paymentDueDate, ...rest } = validated
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
    const created = await prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          ...rest,
          installmentCount:
            validated.period === 'YEARLY' && yearlyPlan === 'installments'
              ? 12
              : rest.installmentCount,
          name: finalName,
          type: types as Prisma.SubscriptionUncheckedCreateInput['type'],
          period: validated.period as BillingPeriod,
          startDate: new Date(validated.startDate),
          endDate: new Date(validated.endDate),
          status: validated.status as SubscriptionStatus,
        },
      })

      const payments: Prisma.PaymentCreateManyInput[] = []
      const startDate = new Date(validated.startDate)

      if (validated.period === 'YEARLY') {
        if (yearlyPlan === 'installments') {
          const annual = parseInt(validated.price, 10)
          const base = Math.floor(annual / 12)
          const rem = annual % 12
          for (let index = 0; index < 12; index += 1) {
            const dueDate = new Date(startDate)
            dueDate.setMonth(dueDate.getMonth() + index)
            payments.push({
              customerId: validated.customerId,
              subscriptionId: subscription.id,
              amount: String(base + (index < rem ? 1 : 0)),
              currency: 'TRY',
              date: dueDate,
              dueDate,
              status: PaymentStatus.DUE,
            })
          }
        } else {
          const dueDate = new Date(paymentDueDate ?? validated.startDate)
          payments.push({
            customerId: validated.customerId,
            subscriptionId: subscription.id,
            amount: paymentAmount ?? validated.price,
            currency: 'TRY',
            date: dueDate,
            dueDate,
            status: PaymentStatus.DUE,
          })
        }
      }

      if (validated.period === 'MONTHLY' && validated.installmentCount) {
        for (let index = 0; index < validated.installmentCount; index += 1) {
          const dueDate = new Date(startDate)
          dueDate.setMonth(dueDate.getMonth() + index)
          payments.push({
            customerId: validated.customerId,
            subscriptionId: subscription.id,
            amount: validated.price,
            currency: 'TRY',
            date: dueDate,
            dueDate,
            status: PaymentStatus.DUE,
          })
        }
      }

      if (payments.length > 0) {
        await tx.payment.createMany({ data: payments })
      }

      return subscription
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const body = await request.json()
    const id = body.id
    if (!id || typeof id !== 'string' || id.length < 1) {
      return NextResponse.json({ message: 'Invalid ID', status: 400 }, { status: 400 })
    }
    const sanitized = {
      ...body,
      name: body.name ? sanitizeInput(body.name) : undefined,
      price: body.price ? sanitizeInput(body.price) : undefined,
    }
    const validated = subscriptionUpdateSchema.parse(sanitized)
    const { types, yearlyPlan, paymentAmount, paymentDueDate, ...rest } = validated
    void yearlyPlan
    void paymentAmount
    void paymentDueDate
    const data: Prisma.SubscriptionUncheckedUpdateInput = { ...rest }
    if (types) data.type = types as Prisma.SubscriptionUncheckedUpdateInput['type']
    if (validated.period) data.period = validated.period as BillingPeriod
    if (validated.startDate) data.startDate = new Date(validated.startDate)
    if (validated.endDate) data.endDate = new Date(validated.endDate)
    if (validated.status) data.status = validated.status as SubscriptionStatus
    const updated = await prisma.subscription.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

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
    return handleApiError(error)
  }
}
