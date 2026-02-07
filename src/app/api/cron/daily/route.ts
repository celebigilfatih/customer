import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'
import crypto from 'crypto'
import { getWebhookConfig, appendWebhookLog, enqueueWebhookRetry, startWebhookRetryProcessor } from '@/lib/webhook-config'

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [updatedPaymentsLate, updatedSubsExpired] = await Promise.all([
      prisma.payment.updateMany({
        where: {
          status: { not: 'PAID' },
          dueDate: { lt: today as unknown as string },
        },
        data: { status: 'LATE' },
      }),
      prisma.subscription.updateMany({
        where: {
          status: 'ACTIVE',
          endDate: { lt: today as unknown as string },
        },
        data: { status: 'EXPIRED' },
      }),
    ])

    const next7 = new Date(today)
    next7.setDate(next7.getDate() + 7)

    const [paymentsDueSoon, domainsRenewSoon, subsEndSoon, hostingEndSoon] = await Promise.all([
      prisma.payment.findMany({ where: { status: { in: ['DUE', 'LATE'] }, dueDate: { gte: today as unknown as string, lte: next7 as unknown as string } }, orderBy: { dueDate: 'asc' } }),
      prisma.domain.findMany({ where: { renewDate: { gte: today as unknown as string, lte: next7 as unknown as string } }, orderBy: { renewDate: 'asc' } }),
      prisma.subscription.findMany({ where: { endDate: { gte: today as unknown as string, lte: next7 as unknown as string } }, orderBy: { endDate: 'asc' } }),
      prisma.hosting.findMany({ where: { endDate: { gte: today as unknown as string, lte: next7 as unknown as string } }, orderBy: { endDate: 'asc' } }),
    ])

    const summary = {
      updated: {
        paymentsLate: updatedPaymentsLate.count,
        subscriptionsExpired: updatedSubsExpired.count,
      },
      upcoming7Days: {
        payments: paymentsDueSoon.length,
        domains: domainsRenewSoon.length,
        subscriptions: subsEndSoon.length,
        hosting: hostingEndSoon.length,
      },
    }

    const { urls, secret } = getWebhookConfig()
    startWebhookRetryProcessor()
    if (urls.length > 0) {
      const payload = { event: 'daily-summary', timestamp: new Date().toISOString(), data: summary }
      const body = JSON.stringify(payload)
      const signature = secret ? crypto.createHmac('sha256', secret).update(body).digest('hex') : ''
      await Promise.all(urls.map(async (u) => {
        try {
          const res = await fetch(u, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(signature ? { 'X-Webhook-Signature': signature } : {}),
            },
            body,
          })
          await appendWebhookLog({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, event: 'daily-summary', url: u, ok: res.ok, statusCode: res.status, attempt: 1, timestamp: new Date() })
          if (!res.ok) await enqueueWebhookRetry({ event: 'daily-summary', url: u, body, secret, attempt: 2 })
        } catch (e) {
          await appendWebhookLog({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, event: 'daily-summary', url: u, ok: false, error: e instanceof Error ? e.message : String(e), attempt: 1, timestamp: new Date() })
          await enqueueWebhookRetry({ event: 'daily-summary', url: u, body, secret, attempt: 2 })
        }
      }))

      const duePaymentsPayload = {
        event: 'due-payments',
        timestamp: new Date().toISOString(),
        data: paymentsDueSoon.map(p => ({ id: p.id, customerId: p.customerId, dueDate: p.dueDate, amount: p.amount, currency: p.currency, status: p.status }))
      }
      const dueBody = JSON.stringify(duePaymentsPayload)
      const dueSig = secret ? crypto.createHmac('sha256', secret).update(dueBody).digest('hex') : ''
      await Promise.all(urls.map(async (u) => {
        try {
          const res = await fetch(u, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(dueSig ? { 'X-Webhook-Signature': dueSig } : {}),
            },
            body: dueBody,
          })
          await appendWebhookLog({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, event: 'due-payments', url: u, ok: res.ok, statusCode: res.status, attempt: 1, timestamp: new Date() })
          if (!res.ok) await enqueueWebhookRetry({ event: 'due-payments', url: u, body: dueBody, secret, attempt: 2 })
        } catch (e) {
          await appendWebhookLog({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, event: 'due-payments', url: u, ok: false, error: e instanceof Error ? e.message : String(e), attempt: 1, timestamp: new Date() })
          await enqueueWebhookRetry({ event: 'due-payments', url: u, body: dueBody, secret, attempt: 2 })
        }
      }))

      const expiringServicesPayload = {
        event: 'expiring-services',
        timestamp: new Date().toISOString(),
        data: [
          ...subsEndSoon.map(s => ({ type: 'subscription', id: s.id, customerId: s.customerId, name: s.name, endDate: s.endDate })),
          ...domainsRenewSoon.map(d => ({ type: 'domain', id: d.id, customerId: d.customerId, name: d.name, renewDate: d.renewDate })),
          ...hostingEndSoon.map(h => ({ type: 'hosting', id: h.id, customerId: h.customerId, package: h.package, endDate: h.endDate })),
        ]
      }
      const expBody = JSON.stringify(expiringServicesPayload)
      const expSig = secret ? crypto.createHmac('sha256', secret).update(expBody).digest('hex') : ''
      await Promise.all(urls.map(async (u) => {
        try {
          const res = await fetch(u, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(expSig ? { 'X-Webhook-Signature': expSig } : {}),
            },
            body: expBody,
          })
          await appendWebhookLog({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, event: 'expiring-services', url: u, ok: res.ok, statusCode: res.status, attempt: 1, timestamp: new Date() })
          if (!res.ok) await enqueueWebhookRetry({ event: 'expiring-services', url: u, body: expBody, secret, attempt: 2 })
        } catch (e) {
          await appendWebhookLog({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, event: 'expiring-services', url: u, ok: false, error: e instanceof Error ? e.message : String(e), attempt: 1, timestamp: new Date() })
          await enqueueWebhookRetry({ event: 'expiring-services', url: u, body: expBody, secret, attempt: 2 })
        }
      }))
    }

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}