import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CustomerStatus } from '@/generated/prisma'
import { customerUpdateSchema } from '@/lib/validations'
import { handleApiError, validateId, sanitizeInput } from '@/lib/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    validateId(resolvedParams.id)

    const customer = await prisma.customer.findUnique({
      where: { id: resolvedParams.id },
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { notes: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    validateId(resolvedParams.id)

    const body = await request.json()
    
    // Sanitize string inputs
    const sanitizedBody = {
      ...body,
      fullName: body.fullName ? sanitizeInput(body.fullName) : undefined,
      city: body.city ? sanitizeInput(body.city) : undefined,
      district: body.district ? sanitizeInput(body.district) : undefined,
      club: body.club ? sanitizeInput(body.club) : undefined,
      sportsSchoolOfficial: body.sportsSchoolOfficial ? sanitizeInput(body.sportsSchoolOfficial) : undefined,
      hosting: body.hosting ? sanitizeInput(body.hosting) : undefined,
      duration: body.duration ? sanitizeInput(body.duration) : undefined,
      offer: body.offer ? sanitizeInput(body.offer) : undefined,
      address: body.address ? sanitizeInput(body.address) : undefined,
    }

    const validatedData = customerUpdateSchema.parse(sanitizedBody)

    // Convert status to Prisma enum if present
    const updateData = {
      ...validatedData,
    }

    const customer = await prisma.customer.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    validateId(resolvedParams.id)

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: resolvedParams.id },
      include: { _count: { select: { notes: true } } }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Delete customer (notes will be deleted due to cascade)
    await prisma.customer.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ 
      message: 'Customer deleted successfully',
      deletedNotesCount: existingCustomer._count.notes
    })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}
