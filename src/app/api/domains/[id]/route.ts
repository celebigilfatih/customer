import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { domainCreateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'

// GET /api/domains/[id] - Domain detay
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const domain = await prisma.domain.findUnique({
      where: { id },
    })
    if (!domain) {
      return NextResponse.json({ error: "Domain bulunamadı" }, { status: 404 })
    }
    return NextResponse.json(domain)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

// PUT /api/domains/[id] - Domain güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const sanitized = {
      ...body,
      customerId: body.customerId ? sanitizeInput(body.customerId) : undefined,
      name: body.name ? sanitizeInput(body.name) : undefined,
      whoisNote: body.whoisNote ? sanitizeInput(body.whoisNote) : undefined,
    }
    const validated = domainCreateSchema.partial().parse(sanitized)
    const updated = await prisma.domain.update({
      where: { id },
      data: {
        ...validated,
        registerDate: validated.registerDate ? new Date(validated.registerDate) : undefined,
        renewDate: validated.renewDate ? new Date(validated.renewDate) : undefined,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

// DELETE /api/domains/[id] - Domain sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.domain.delete({
      where: { id },
    })
    return NextResponse.json({ message: "Domain silindi" })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}
