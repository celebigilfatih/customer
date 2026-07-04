import { NextRequest, NextResponse } from 'next/server'
import { PaymentStatus, Prisma, ProposalStatus, SubscriptionStatus } from '@/generated/prisma'
import { prisma } from '@/lib/prisma'
import { requireAdminApi } from '@/lib/api-auth'
import { handleApiError } from '@/lib/error-handler'

type MoneyBucket = {
  count: number
  totals: Record<string, Prisma.Decimal>
}

const createMoneyBucket = (): MoneyBucket => ({
  count: 0,
  totals: {},
})

const addMoney = (bucket: MoneyBucket, amount: Prisma.Decimal, currency: string) => {
  bucket.count += 1
  bucket.totals[currency] = (bucket.totals[currency] || new Prisma.Decimal(0)).plus(amount)
}

const serializeMoneyBucket = (bucket: MoneyBucket) => ({
  count: bucket.count,
  totals: Object.entries(bucket.totals)
    .sort(([leftCurrency], [rightCurrency]) => leftCurrency.localeCompare(rightCurrency))
    .map(([currency, amount]) => ({
      currency,
      amount: amount.toString(),
    })),
})

const startOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

const isSameDay = (date: Date | null | undefined, reference: Date) => {
  if (!date) return false
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  )
}

const isInRange = (date: Date | null | undefined, start: Date, end: Date) => {
  if (!date) return false
  return date >= start && date <= end
}

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

const toIso = (date: Date | null | undefined) => (date ? date.toISOString() : null)

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const today = startOfToday()
    const tomorrow = addDays(today, 1)
    const upcomingEnd = addDays(today, 30)

    const [
      customerCount,
      subscriptions,
      domains,
      hosting,
      proposals,
      payments,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.subscription.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          endDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.domain.findMany({
        select: {
          id: true,
          name: true,
          renewDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hosting.findMany({
        select: {
          id: true,
          name: true,
          endDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.proposal.findMany({
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        select: {
          id: true,
          amount: true,
          currency: true,
          dueDate: true,
          paidDate: true,
          date: true,
          status: true,
          createdAt: true,
          invoice: {
            select: {
              subtotal: true,
              total: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const finance = {
      collected: createMoneyBucket(),
      collectedToday: createMoneyBucket(),
      open: createMoneyBucket(),
      late: createMoneyBucket(),
    }

    for (const payment of payments) {
      const taxExcludedAmount = calculateTaxExcludedPaymentAmount(payment)
      const paidAt = payment.paidDate || payment.date

      if (payment.status === PaymentStatus.PAID) {
        addMoney(finance.collected, taxExcludedAmount, payment.currency)
        if (paidAt >= today && paidAt < tomorrow) {
          addMoney(finance.collectedToday, taxExcludedAmount, payment.currency)
        }
        continue
      }

      addMoney(finance.open, taxExcludedAmount, payment.currency)
      if (payment.status === PaymentStatus.LATE) {
        addMoney(finance.late, taxExcludedAmount, payment.currency)
      }
    }

    const upcomingSubscriptions = subscriptions.filter((item) => isInRange(item.endDate, today, upcomingEnd))
    const upcomingDomains = domains.filter((item) => isInRange(item.renewDate, today, upcomingEnd))
    const upcomingHosting = hosting.filter((item) => isInRange(item.endDate, today, upcomingEnd))
    const openProposalStatuses: ProposalStatus[] = [
      ProposalStatus.DRAFT,
      ProposalStatus.SENT,
      ProposalStatus.PENDING,
    ]
    const openProposalCount = proposals.filter((item) => openProposalStatuses.includes(item.status)).length

    const recentActivities = [
      ...payments.map((item) => {
        const taxExcludedAmount = calculateTaxExcludedPaymentAmount(item)

        return {
          id: `payment-${item.id}`,
          kind: 'payment' as const,
          title: `${taxExcludedAmount.toString()} ${item.currency}`,
          description: item.status === PaymentStatus.PAID ? 'Tahsilat kaydı' : 'Ödeme planı',
          status: item.status,
          href: '/admin/finance',
          createdAt: item.createdAt,
        }
      }),
      ...domains.map((item) => ({
        id: `domain-${item.id}`,
        kind: 'domain' as const,
        title: item.name,
        description: 'Domain kaydı',
        href: '/admin/domains',
        createdAt: item.createdAt,
      })),
      ...hosting.map((item) => ({
        id: `hosting-${item.id}`,
        kind: 'hosting' as const,
        title: item.name,
        description: 'Hosting kaydı',
        href: '/admin/hosting',
        createdAt: item.createdAt,
      })),
      ...subscriptions.map((item) => ({
        id: `subscription-${item.id}`,
        kind: 'subscription' as const,
        title: item.name,
        description: 'Abonelik kaydı',
        status: item.status,
        href: '/admin/subscriptions',
        createdAt: item.createdAt,
      })),
      ...proposals.map((item) => ({
        id: `proposal-${item.id}`,
        kind: 'proposal' as const,
        title: item.title || item.number,
        description: `Teklif: ${item.number}`,
        status: item.status,
        href: '/admin/proposals',
        createdAt: item.createdAt,
      })),
    ]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 5)
      .map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      metrics: {
        customers: customerCount,
        activeSubscriptions: subscriptions.filter((item) => item.status === SubscriptionStatus.ACTIVE).length,
        domains: domains.length,
        hosting: hosting.length,
        openProposals: openProposalCount,
        upcomingExpirations: upcomingSubscriptions.length + upcomingDomains.length + upcomingHosting.length,
      },
      finance: {
        collected: serializeMoneyBucket(finance.collected),
        collectedToday: serializeMoneyBucket(finance.collectedToday),
        open: serializeMoneyBucket(finance.open),
        late: serializeMoneyBucket(finance.late),
      },
      reminders: {
        paymentsDueToday: payments.filter((item) => item.status !== PaymentStatus.PAID && isSameDay(item.dueDate, today)).length,
        domainsRenewToday: domains.filter((item) => isSameDay(item.renewDate, today)).length,
        subscriptionsExpireToday: subscriptions.filter((item) => isSameDay(item.endDate, today)).length,
        hostingExpireToday: hosting.filter((item) => isSameDay(item.endDate, today)).length,
      },
      serviceSummary: {
        subscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter((item) => item.status === SubscriptionStatus.ACTIVE).length,
        domains: domains.length,
        hosting: hosting.length,
        proposals: proposals.length,
        approvedProposals: proposals.filter((item) => item.status === ProposalStatus.APPROVED).length,
      },
      upcomingExpirations: [
        ...upcomingSubscriptions.map((item) => ({
          id: item.id,
          kind: 'subscription' as const,
          label: item.name,
          date: toIso(item.endDate),
          href: '/admin/subscriptions',
        })),
        ...upcomingDomains.map((item) => ({
          id: item.id,
          kind: 'domain' as const,
          label: item.name,
          date: toIso(item.renewDate),
          href: '/admin/domains',
        })),
        ...upcomingHosting.map((item) => ({
          id: item.id,
          kind: 'hosting' as const,
          label: item.name,
          date: toIso(item.endDate),
          href: '/admin/hosting',
        })),
      ]
        .sort((left, right) => new Date(left.date || '').getTime() - new Date(right.date || '').getTime())
        .slice(0, 4),
      recentActivities,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
