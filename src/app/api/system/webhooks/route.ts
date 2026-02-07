import { NextRequest, NextResponse } from 'next/server'
import { getWebhookConfig, setWebhookConfig } from '@/lib/webhook-config'
import { handleApiError } from '@/lib/error-handler'

export async function GET() {
  try {
    const cfg = getWebhookConfig()
    return NextResponse.json({ urls: cfg.urls, secret: cfg.secret ? true : false })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls.map((s: unknown) => String(s)).filter(Boolean)
      : String(body.urls || '').split(',').map(s => s.trim()).filter(Boolean)
    const secret = typeof body.secret === 'string' ? body.secret : ''
    const cfg = setWebhookConfig({ urls, secret })
    return NextResponse.json({ urls: cfg.urls, secret: cfg.secret ? true : false })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}