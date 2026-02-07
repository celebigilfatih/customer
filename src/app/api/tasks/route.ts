import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TaskStatus } from '@/generated/prisma'
import { taskCreateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const search = sanitizeInput(searchParams.get('search') || '')
    const customerId = sanitizeInput(searchParams.get('customerId') || '')

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? { title: { contains: search, mode: 'insensitive' as const } } : {},
        customerId ? { customerId } : {},
      ].filter((c) => Object.keys(c).length > 0),
    }

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where: Object.keys(where.AND).length > 0 ? where : undefined,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({
        where: Object.keys(where.AND).length > 0 ? where : undefined,
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
      title: sanitizeInput(body.title),
      description: sanitizeInput(body.description),
    }
    const validated = taskCreateSchema.parse(sanitized)
    const created = await prisma.task.create({
      data: {
        ...validated,
        status: validated.status as TaskStatus,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}