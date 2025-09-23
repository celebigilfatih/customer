import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { customerCreateSchema } from '@/lib/validations'
import { handleApiError, sanitizeInput } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100 items per page
    const search = sanitizeInput(searchParams.get('search') || '')
    const city = sanitizeInput(searchParams.get('city') || '')
    const club = sanitizeInput(searchParams.get('club') || '')

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
            { district: { contains: search, mode: 'insensitive' as const } },
          ]
        } : {},
        city ? { city: { contains: city, mode: 'insensitive' as const } } : {},
        club ? { club: { contains: club, mode: 'insensitive' as const } } : {},
      ].filter(condition => Object.keys(condition).length > 0)
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: Object.keys(where.AND).length > 0 ? where : undefined,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { notes: true }
          }
        }
      }),
      prisma.customer.count({
        where: Object.keys(where.AND).length > 0 ? where : undefined,
      })
    ])

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Sanitize string inputs
    const sanitizedBody = {
      ...body,
      fullName: sanitizeInput(body.fullName),
      city: sanitizeInput(body.city),
      district: sanitizeInput(body.district),
      club: body.club ? sanitizeInput(body.club) : null,
      sportsSchoolOfficial: body.sportsSchoolOfficial ? sanitizeInput(body.sportsSchoolOfficial) : null,
      hosting: body.hosting ? sanitizeInput(body.hosting) : null,
      duration: body.duration ? sanitizeInput(body.duration) : null,
      startDate: body.startDate ? sanitizeInput(body.startDate) : null,
      endDate: body.endDate ? sanitizeInput(body.endDate) : null,
      offer: body.offer ? sanitizeInput(body.offer) : null,
      address: body.address ? sanitizeInput(body.address) : null,
    }

    const validatedData = customerCreateSchema.parse(sanitizedBody)

    const customer = await prisma.customer.create({
      data: validatedData,
      include: {
        notes: true,
        _count: {
          select: { notes: true }
        }
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}