import { NextResponse } from 'next/server'
import { getWebhookLogs } from '@/lib/webhook-config'

export async function GET() {
  const items = await getWebhookLogs(100)
  const data = items.map(i => ({
    id: i.id,
    event: i.event,
    url: i.url,
    ok: i.ok,
    statusCode: i.statusCode ?? undefined,
    error: i.error ?? undefined,
    attempt: i.attempt,
    timestamp: i.timestamp.getTime(),
  }))
  return NextResponse.json({ data })
}