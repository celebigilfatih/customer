import { prisma } from '@/lib/prisma'

type WebhookConfig = { urls: string[]; secret: string }

let current: WebhookConfig | null = null
let processorStarted = false

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
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const delayMs = item.attempt === 1 ? 30_000 : item.attempt === 2 ? 300_000 : 1_800_000
  const nextAt = new Date(Date.now() + delayMs)
  await prisma.webhookQueue.create({
    data: {
      id,
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
        const signature = job.secret ? (await import('crypto')).default.createHmac('sha256', job.secret).update(job.body).digest('hex') : ''
        const res = await fetch(job.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature ? { 'X-Webhook-Signature': signature } : {}),
          },
          body: job.body,
        })
        await appendWebhookLog({ id: job.id, event: job.event, url: job.url, ok: res.ok, statusCode: res.status, attempt: job.attempt, timestamp: new Date() })
        if (res.ok) {
          await prisma.webhookQueue.delete({ where: { id: job.id } })
        } else {
          if (job.attempt >= 3) {
            await prisma.webhookQueue.delete({ where: { id: job.id } })
          } else {
            const nextDelay = job.attempt === 1 ? 300_000 : 1_800_000
            await prisma.webhookQueue.update({ where: { id: job.id }, data: { attempt: job.attempt + 1, nextAt: new Date(Date.now() + nextDelay) } })
          }
        }
      } catch (e) {
        await appendWebhookLog({ id: job.id, event: job.event, url: job.url, ok: false, error: e instanceof Error ? e.message : String(e), attempt: job.attempt, timestamp: new Date() })
        if (job.attempt >= 3) {
          await prisma.webhookQueue.delete({ where: { id: job.id } })
        } else {
          const nextDelay = job.attempt === 1 ? 300_000 : 1_800_000
          await prisma.webhookQueue.update({ where: { id: job.id }, data: { attempt: job.attempt + 1, nextAt: new Date(Date.now() + nextDelay) } })
        }
      }
    }
  }, 5_000)
}