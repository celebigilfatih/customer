import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus, Prisma } from '@/generated/prisma'
import { paymentCreateSchema, paymentUpdateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'
import { isAdminApiUser, requireAdminApi, requireAuthenticatedApi } from '@/lib/api-auth'
import { rebuildCustomerLedgerBalances, syncPaymentCreditTransaction } from '@/lib/accounting-ledger'

type PaymentSummaryBucket = {
  count: number
  totals: Record<string, Prisma.Decimal>
}

const createSummaryBucket = (): PaymentSummaryBucket => ({
  count: 0,
  totals: {},
})

const addToSummaryBucket = (
  bucket: PaymentSummaryBucket,
  amount: Prisma.Decimal,
  currency: string,
) => {
  bucket.count += 1
  bucket.totals[currency] = (bucket.totals[currency] || new Prisma.Decimal(0)).plus(amount)
}

const serializeSummaryBucket = (bucket: PaymentSummaryBucket) => ({
  count: bucket.count,
  totals: Object.entries(bucket.totals)
    .sort(([leftCurrency], [rightCurrency]) => leftCurrency.localeCompare(rightCurrency))
    .map(([currencyCode, amount]) => ({
      currency: currencyCode,
      amount: amount.toString(),
    })),
})

const calculateTaxExcludedPaymentAmount = (payment: {
  amount: Prisma.Decimal
  invoice?: {
    subtotal: Prisma.Decimal
    total: Prisma.Decimal
  } | null
}) => {
  if (!payment.invoice || payment.invoice.total.equals(0)) {
    return payment.amount
  }

  return payment.amount.mul(payment.invoice.subtotal).div(payment.invoice.total)
}

const calculateTaxPaymentAmount = (payment: {
  amount: Prisma.Decimal
  invoice?: {
    subtotal: Prisma.Decimal
    total: Prisma.Decimal
  } | null
}) => payment.amount.minus(calculateTaxExcludedPaymentAmount(payment))

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedApi(request)
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const customerId = sanitizeInput(searchParams.get('customerId') || '')
    const subscriptionId = sanitizeInput(searchParams.get('subscriptionId') || '')
    const status = sanitizeInput(searchParams.get('status') || '')
    const currency = sanitizeInput(searchParams.get('currency') || '')
    const dueDateFrom = sanitizeInput(searchParams.get('dueDateFrom') || '')
    const dueDateTo = sanitizeInput(searchParams.get('dueDateTo') || '')
    const summary = searchParams.get('summary') === 'true'

    const skip = (page - 1) * limit

    const filters: Prisma.PaymentWhereInput[] = []

    if (auth.user.role === 'CUSTOMER') {
      if (!auth.user.customerId) {
        return NextResponse.json({ error: 'Müşteri oturumu eksik' }, { status: 403 })
      }
      if (customerId && customerId !== auth.user.customerId) {
        return NextResponse.json({ error: 'Bu müşteri için yetki yok' }, { status: 403 })
      }
      filters.push({ customerId: auth.user.customerId })
    } else if (isAdminApiUser(auth.user)) {
      if (customerId) filters.push({ customerId })
    } else {
      return NextResponse.json({ error: 'Bu işlem için yetki yok' }, { status: 403 })
    }

    if (subscriptionId) filters.push({ subscriptionId })
    if (status) filters.push({ status: status as PaymentStatus })
    if (currency) filters.push({ currency })
    if (dueDateFrom) filters.push({ dueDate: { gte: new Date(dueDateFrom) } })
    if (dueDateTo) filters.push({ dueDate: { lte: new Date(dueDateTo) } })

    const where: Prisma.PaymentWhereInput | undefined = filters.length > 0 ? { AND: filters } : undefined

    if (summary) {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const nextMonthStart = new Date(monthStart)
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1)

      const payments = await prisma.payment.findMany({
        where,
        select: {
          amount: true,
          currency: true,
          date: true,
          paidDate: true,
          status: true,
          invoice: {
            select: {
              subtotal: true,
              total: true,
            },
          },
        },
      })

      const paid = createSummaryBucket()
      const paidTax = createSummaryBucket()
      const open = createSummaryBucket()
      const due = createSummaryBucket()
      const late = createSummaryBucket()
      const paidThisMonth = createSummaryBucket()

      for (const payment of payments) {
        const taxExcludedAmount = calculateTaxExcludedPaymentAmount(payment)
        if (payment.status === PaymentStatus.PAID) {
          addToSummaryBucket(paid, taxExcludedAmount, payment.currency)
          addToSummaryBucket(paidTax, calculateTaxPaymentAmount(payment), payment.currency)
          const paidAt = payment.paidDate || payment.date
          if (paidAt >= monthStart && paidAt < nextMonthStart) {
            addToSummaryBucket(paidThisMonth, taxExcludedAmount, payment.currency)
          }
          continue
        }

        addToSummaryBucket(open, taxExcludedAmount, payment.currency)
        if (payment.status === PaymentStatus.LATE) {
          addToSummaryBucket(late, taxExcludedAmount, payment.currency)
        } else if (payment.status === PaymentStatus.DUE) {
          addToSummaryBucket(due, taxExcludedAmount, payment.currency)
        }
      }

      return NextResponse.json({
        totalCount: payments.length,
        paid: serializeSummaryBucket(paid),
        paidTax: serializeSummaryBucket(paidTax),
        open: serializeSummaryBucket(open),
        due: serializeSummaryBucket(due),
        late: serializeSummaryBucket(late),
        paidThisMonth: serializeSummaryBucket(paidThisMonth),
      })
    }

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          invoice: {
            select: {
              subtotal: true,
              total: true,
              taxAmount: true,
            },
          },
        },
      }),
      prisma.payment.count({
        where,
      }),
    ])

    return NextResponse.json({
      data: items.map((payment) => ({
        ...payment,
        taxExcludedAmount: calculateTaxExcludedPaymentAmount(payment).toString(),
        taxAmount: payment.invoice?.taxAmount.toString() || null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
      invoiceId: body.invoiceId ? sanitizeInput(body.invoiceId) : undefined,
      amount: sanitizeInput(body.amount),
      currency: sanitizeInput(body.currency),
      note: body.note ? sanitizeInput(body.note) : undefined,
    }
    const validated = paymentCreateSchema.parse(sanitized)
    const created = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          ...validated,
          date: new Date(validated.dueDate),
          dueDate: new Date(validated.dueDate),
          paidDate: validated.paidDate ? new Date(validated.paidDate) : undefined,
          status: validated.status as PaymentStatus,
        },
      })
      await syncPaymentCreditTransaction(tx, payment)
      return payment
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const id = sanitizeInput(searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'id gerekli', status: 400 }, { status: 400 })
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        select: { id: true, customerId: true },
      })
      if (!payment) return

      await tx.accountTransaction.deleteMany({ where: { paymentId: payment.id } })
      await tx.payment.delete({ where: { id } })
      await rebuildCustomerLedgerBalances(tx, payment.customerId)
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const id = sanitizeInput(searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'id gerekli', status: 400 }, { status: 400 })
    const body = await request.json()
    const sanitized = {
      ...body,
      invoiceId: body.invoiceId ? sanitizeInput(body.invoiceId) : undefined,
      amount: body.amount ? sanitizeInput(body.amount) : undefined,
      currency: body.currency ? sanitizeInput(body.currency) : undefined,
      note: body.note ? sanitizeInput(body.note) : undefined,
    }
    const validated = paymentUpdateSchema.parse(sanitized)
    const updated = await prisma.$transaction(async (tx) => {
      const previous = await tx.payment.findUnique({
        where: { id },
        select: { customerId: true },
      })
      if (!previous) {
        throw new Error('Ödeme bulunamadı')
      }

      const payment = await tx.payment.update({
        where: { id },
        data: {
          ...validated,
          dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
          paidDate: validated.paidDate ? new Date(validated.paidDate) : undefined,
          status: validated.status ? (validated.status as PaymentStatus) : undefined,
        },
      })
      await syncPaymentCreditTransaction(tx, payment, previous.customerId)
      return payment
    })
    return NextResponse.json(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
