import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@/generated/prisma'
import { paymentCreateSchema, paymentUpdateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const customerId = sanitizeInput(searchParams.get('customerId') || '')
    const subscriptionId = sanitizeInput(searchParams.get('subscriptionId') || '')
    const status = sanitizeInput(searchParams.get('status') || '')
    const currency = sanitizeInput(searchParams.get('currency') || '')
    const dueDateFrom = sanitizeInput(searchParams.get('dueDateFrom') || '')
    const dueDateTo = sanitizeInput(searchParams.get('dueDateTo') || '')

    const skip = (page - 1) * limit

    const where = {
      AND: [
        customerId ? { customerId } : {},
        subscriptionId ? { subscriptionId } : {},
        status ? { status: status as PaymentStatus } : {},
        currency ? { currency } : {},
        dueDateFrom ? { dueDate: { gte: new Date(dueDateFrom) } } : {},
        dueDateTo ? { dueDate: { lte: new Date(dueDateTo) } } : {},
      ].filter((c) => Object.keys(c).length > 0),
    }

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where: where.AND.length > 0 ? where : undefined,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.payment.count({
        where: where.AND.length > 0 ? where : undefined,
      }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sanitized = {
      ...body,
      amount: sanitizeInput(body.amount),
      currency: sanitizeInput(body.currency),
      note: body.note ? sanitizeInput(body.note) : undefined,
    }
    const validated = paymentCreateSchema.parse(sanitized)
    const created = await prisma.payment.create({
      data: {
        ...validated,
        dueDate: new Date(validated.dueDate),
        paidDate: validated.paidDate ? new Date(validated.paidDate) : undefined,
        status: validated.status as PaymentStatus,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = sanitizeInput(searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'id gerekli', status: 400 }, { status: 400 })
    await prisma.payment.delete({ where: { id } })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = sanitizeInput(searchParams.get('id') || '')
    if (!id) return NextResponse.json({ error: 'id gerekli', status: 400 }, { status: 400 })
    const body = await request.json()
    const sanitized = {
      ...body,
      amount: body.amount ? sanitizeInput(body.amount) : undefined,
      currency: body.currency ? sanitizeInput(body.currency) : undefined,
      note: body.note ? sanitizeInput(body.note) : undefined,
    }
    const validated = paymentUpdateSchema.parse(sanitized)
    const updated = await prisma.payment.update({
      where: { id },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        paidDate: validated.paidDate ? new Date(validated.paidDate) : undefined,
        status: validated.status ? (validated.status as PaymentStatus) : undefined,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}
