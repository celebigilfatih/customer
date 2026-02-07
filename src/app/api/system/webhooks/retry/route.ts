import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'
import crypto from 'crypto'
import { getWebhookConfig, appendWebhookLog, enqueueWebhookRetry, startWebhookRetryProcessor } from '@/lib/webhook-config'

type EventType = 'daily-summary' | 'due-payments' | 'expiring-services'

async function buildPayload(event: EventType) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next7 = new Date(today)
  next7.setDate(next7.getDate() + 7)

  const [paymentsDueSoon, domainsRenewSoon, subsEndSoon, hostingEndSoon] = await Promise.all([
    prisma.payment.findMany({ where: { status: { in: ['DUE', 'LATE'] }, dueDate: { gte: today as unknown as string, lte: next7 as unknown as string } }, orderBy: { dueDate: 'asc' } }),
    prisma.domain.findMany({ where: { renewDate: { gte: today as unknown as string, lte: next7 as unknown as string } }, orderBy: { renewDate: 'asc' } }),
    prisma.subscription.findMany({ where: { endDate: { gte: today as unknown as string, lte: next7 as unknown as string } }, orderBy: { endDate: 'asc' } }),
    prisma.hosting.findMany({ where: { endDate: { gte: today as unknown as string, lte: next7 as unknown as string } }, orderBy: { endDate: 'asc' } }),
  ])

  if (event === 'daily-summary') {
    return {
      event,
      timestamp: new Date().toISOString(),
      data: {
        updated: { paymentsLate: 0, subscriptionsExpired: 0 },
        upcoming7Days: {
          payments: paymentsDueSoon.length,
          domains: domainsRenewSoon.length,
          subscriptions: subsEndSoon.length,
          hosting: hostingEndSoon.length,
        },
      },
    }
  }
  if (event === 'due-payments') {
    return {
      event,
      timestamp: new Date().toISOString(),
      data: paymentsDueSoon.map(p => ({ id: p.id, customerId: p.customerId, dueDate: p.dueDate, amount: p.amount, currency: p.currency, status: p.status })),
    }
  }
  return {
    event,
    timestamp: new Date().toISOString(),
    data: [
      ...subsEndSoon.map(s => ({ type: 'subscription', id: s.id, customerId: s.customerId, name: s.name, endDate: s.endDate })),
      ...domainsRenewSoon.map(d => ({ type: 'domain', id: d.id, customerId: d.customerId, name: d.name, renewDate: d.renewDate })),
      ...hostingEndSoon.map(h => ({ type: 'hosting', id: h.id, customerId: h.customerId, package: h.package, endDate: h.endDate })),
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = String(body.url || '')
    const event = String(body.event || '') as EventType
    if (!url || !['daily-summary', 'due-payments', 'expiring-services'].includes(event)) {
      return NextResponse.json({ message: 'Invalid url/event' }, { status: 400 })
    }

    const payload = await buildPayload(event)
    const json = JSON.stringify(payload)
    const { secret } = getWebhookConfig()
    const signature = secret ? crypto.createHmac('sha256', secret).update(json).digest('hex') : ''

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(signature ? { 'X-Webhook-Signature': signature } : {}) },
        body: json,
      })
      await appendWebhookLog({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, event, url, ok: res.ok, statusCode: res.status, attempt: 1, timestamp: new Date() })
      if (!res.ok) await enqueueWebhookRetry({ event, url, body: json, secret, attempt: 2 })
    } catch (e) {
      await appendWebhookLog({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, event, url, ok: false, error: e instanceof Error ? e.message : String(e), attempt: 1, timestamp: new Date() })
      await enqueueWebhookRetry({ event, url, body: json, secret, attempt: 2 })
    }

    startWebhookRetryProcessor()

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}