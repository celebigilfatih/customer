import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { proposalCreateSchema } from '@/lib/validations'
import { ProposalType } from '@/generated/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (type) where.type = type
    if (customerId) where.customerId = customerId
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          customer: {
            select: { id: true, fullName: true, club: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proposal.count({ where }),
    ])

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/proposals error:', error)
    return NextResponse.json({ error: 'Teklifler getirilemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = proposalCreateSchema.parse(body)

    // Generate proposal number
    const year = new Date().getFullYear()
    const lastProposal = await prisma.proposal.findFirst({
      where: { number: { startsWith: `T-${year}` } },
      orderBy: { number: 'desc' },
    })
    const sequence = lastProposal 
      ? parseInt(lastProposal.number.split('-')[2]) + 1 
      : 1
    const proposalNumber = `T-${year}-${String(sequence).padStart(6, '0')}`

    const proposal = await prisma.proposal.create({
      data: {
        customerId: validated.customerId,
        number: proposalNumber,
        title: validated.title,
        type: validated.type as ProposalType,
        description: validated.description,
        amount: validated.amount,
        currency: validated.currency,
        validUntil: new Date(validated.validUntil),
        notes: validated.notes,
        items: validated.items && validated.items.length > 0 ? {
          create: validated.items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.totalPrice),
          })),
        } : undefined,
      },
      include: {
        customer: {
          select: { id: true, fullName: true, club: true },
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

    return NextResponse.json(proposal, { status: 201 })
  } catch (error) {
    console.error('POST /api/proposals error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Teklif oluşturulamadı' }, { status: 500 })
  }
}
