import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { proposalUpdateSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, fullName: true, club: true, phoneNumber: true, city: true, district: true, address: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('GET /api/proposals/[id] error:', error)
    return NextResponse.json({ error: 'Teklif getirilemedi' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = proposalUpdateSchema.parse(body)

    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.type !== undefined && { type: validated.type as 'SUBSCRIPTION' | 'PROJECT' | 'MAINTENANCE' | 'RENEWAL' }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.amount !== undefined && { amount: validated.amount }),
        ...(validated.currency !== undefined && { currency: validated.currency }),
        ...(validated.validUntil !== undefined && { validUntil: new Date(validated.validUntil) }),
        ...(validated.notes !== undefined && { notes: validated.notes }),
        ...(validated.status !== undefined && { status: validated.status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' }),
      },
      include: {
        customer: {
          select: { id: true, fullName: true, club: true },
        },
      },
    })

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('PATCH /api/proposals/[id] error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Teklif güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.proposal.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/proposals/[id] error:', error)
    return NextResponse.json({ error: 'Teklif silinemedi' }, { status: 500 })
  }
}
