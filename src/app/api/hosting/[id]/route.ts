import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hostingCreateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'

// GET /api/hosting/[id] - Hosting detay
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const hosting = await prisma.hosting.findUnique({
      where: { id },
    })
    if (!hosting) {
      return NextResponse.json({ error: "Hosting bulunamadı" }, { status: 404 })
    }
    return NextResponse.json(hosting)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

// PUT /api/hosting/[id] - Hosting güncelle
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
      notes: body.notes ? sanitizeInput(body.notes) : undefined,
    }
    const validated = hostingCreateSchema.partial().parse(sanitized)
    const updated = await prisma.hosting.update({
      where: { id },
      data: {
        ...validated,
        endDate: validated.endDate ? new Date(validated.endDate) : undefined,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

// DELETE /api/hosting/[id] - Hosting sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.hosting.delete({
      where: { id },
    })
    return NextResponse.json({ message: "Hosting silindi" })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}
