import { NextResponse } from 'next/server'
import { getWebhookQueueStats } from '@/lib/webhook-config'

export async function GET() {
  const stats = await getWebhookQueueStats()
  return NextResponse.json(stats)
}