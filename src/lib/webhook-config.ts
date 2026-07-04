import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

type WebhookConfig = { urls: string[]; secret: string }

let current: WebhookConfig | null = null
let processorStarted = false
const WEBHOOK_TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS || 10_000)
const MAX_RETRY_ATTEMPTS = 3

const getRetryDelayMs = (attempt: number) => {
  if (attempt <= 1) return 30_000
  if (attempt === 2) return 300_000
  return 1_800_000
}

const createQueueDedupeKey = (item: { event: string; url: string; body: string }) =>
  crypto.createHash('sha256').update(`${item.event}|${item.url}|${item.body}`).digest('hex')

const createLogId = (jobId: string, attempt: number) =>
  `${jobId}-${attempt}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export function getWebhookConfig(): WebhookConfig {
  if (current) return current
  const urls = (process.env.WEBHOOK_URLS || '').split(',').map(s => s.trim()).filter(Boolean)
  const secret = process.env.WEBHOOK_SECRET || ''
  current = { urls, secret }
  return current
}

export function setWebhookConfig(cfg: Partial<WebhookConfig>): WebhookConfig {
  const prev = getWebhookConfig()
  current = { urls: cfg.urls ?? prev.urls, secret: cfg.secret ?? prev.secret }
  return current
}

export async function postWebhook(url: string, body: string, secret: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)
  const signature = secret ? crypto.createHmac('sha256', secret).update(body).digest('hex') : ''

  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature ? { 'X-Webhook-Signature': signature } : {}),
      },
      body,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function appendWebhookLog(entry: { id: string; event: string; url: string; ok: boolean; statusCode?: number; error?: string; attempt: number; timestamp: number | Date }) {
  const ts = typeof entry.timestamp === 'number' ? new Date(entry.timestamp) : entry.timestamp
  await prisma.webhookLog.create({
    data: {
      id: entry.id,
      event: entry.event,
      url: entry.url,
      ok: entry.ok,
      statusCode: entry.statusCode,
      error: entry.error,
      attempt: entry.attempt,
      timestamp: ts,
    },
  })
}

export async function getWebhookLogs(limit = 50) {
  const items = await prisma.webhookLog.findMany({ orderBy: { timestamp: 'desc' }, take: limit })
  return items
}

export async function getWebhookQueueStats() {
  const pending = await prisma.webhookQueue.count()
  const next = await prisma.webhookQueue.findMany({ select: { nextAt: true }, orderBy: { nextAt: 'asc' }, take: 1 })
  const nextAt = next.length ? next[0].nextAt.getTime() : 0
  const nextInMs = nextAt ? Math.max(nextAt - Date.now(), 0) : 0
  return { pending, nextInMs }
}

export async function enqueueWebhookRetry(item: { event: string; url: string; body: string; secret: string; attempt: number }) {
  const dedupeKey = createQueueDedupeKey(item)
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const nextAt = new Date(Date.now() + getRetryDelayMs(item.attempt))
  const existing = await prisma.webhookQueue.findUnique({ where: { dedupeKey } })

  if (existing) {
    await prisma.webhookQueue.update({
      where: { dedupeKey },
      data: {
        secret: item.secret,
        nextAt: existing.nextAt < nextAt ? existing.nextAt : nextAt,
      },
    })
    return
  }

  await prisma.webhookQueue.create({
    data: {
      id,
      dedupeKey,
      event: item.event,
      url: item.url,
      body: item.body,
      secret: item.secret,
      attempt: item.attempt,
      nextAt,
    },
  })
}

export function startWebhookRetryProcessor() {
  if (processorStarted) return
  processorStarted = true
  setInterval(async () => {
    const now = new Date()
    const ready = await prisma.webhookQueue.findMany({ where: { nextAt: { lte: now } }, orderBy: { nextAt: 'asc' }, take: 20 })
    for (const job of ready) {
      try {
        const res = await postWebhook(job.url, job.body, job.secret || '')
        await appendWebhookLog({ id: createLogId(job.id, job.attempt), event: job.event, url: job.url, ok: res.ok, statusCode: res.status, attempt: job.attempt, timestamp: new Date() })
        if (res.ok) {
          await prisma.webhookQueue.delete({ where: { id: job.id } })
        } else {
          if (job.attempt >= MAX_RETRY_ATTEMPTS) {
            await prisma.webhookQueue.delete({ where: { id: job.id } })
          } else {
            const nextDelay = getRetryDelayMs(job.attempt + 1)
            await prisma.webhookQueue.update({ where: { id: job.id }, data: { attempt: job.attempt + 1, nextAt: new Date(Date.now() + nextDelay) } })
          }
        }
      } catch (e) {
        await appendWebhookLog({ id: createLogId(job.id, job.attempt), event: job.event, url: job.url, ok: false, error: e instanceof Error ? e.message : String(e), attempt: job.attempt, timestamp: new Date() })
        if (job.attempt >= MAX_RETRY_ATTEMPTS) {
          await prisma.webhookQueue.delete({ where: { id: job.id } })
        } else {
          const nextDelay = getRetryDelayMs(job.attempt + 1)
          await prisma.webhookQueue.update({ where: { id: job.id }, data: { attempt: job.attempt + 1, nextAt: new Date(Date.now() + nextDelay) } })
        }
      }
    }
  }, 5_000)
}
