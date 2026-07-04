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
    const status = sanitizeInput(searchParams.get('status') || '')
    const statusFilter = ['OPEN', 'PENDING', 'DONE'].includes(status) ? (status as TaskStatus) : undefined

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? { title: { contains: search, mode: 'insensitive' as const } } : {},
        customerId ? { customerId } : {},
        statusFilter ? { status: statusFilter } : {},
      ].filter((c) => Object.keys(c).length > 0),
    }

    const taskWhere = Object.keys(where.AND).length > 0 ? where : undefined

    const [items, total, statusGroups] = await Promise.all([
      prisma.task.findMany({
        where: taskWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              club: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.task.count({
        where: taskWhere,
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: { _all: true },
      }),
    ])

    const statusCounts = statusGroups.reduce(
      (acc, group) => ({
        ...acc,
        [group.status]: group._count._all,
      }),
      { OPEN: 0, PENDING: 0, DONE: 0 } as Record<TaskStatus, number>
    )

    return NextResponse.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        total,
        open: statusCounts.OPEN,
        pending: statusCounts.PENDING,
        done: statusCounts.DONE,
      },
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
