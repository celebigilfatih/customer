import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { customerUpdateSchema } from '@/lib/validations'
import { handleApiError, validateId, sanitizeInput } from '@/lib/error-handler'
import { isAdminApiUser, requireAdminApi, requireAuthenticatedApi } from '@/lib/api-auth'

function sanitizeMaybeString(value: unknown) {
  return typeof value === 'string' ? sanitizeInput(value) : value
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthenticatedApi(request)
    if (auth.response) return auth.response

    const resolvedParams = await params
    if (!validateId(resolvedParams.id)) {
      return NextResponse.json(
        { error: 'Geçersiz müşteri ID' },
        { status: 400 }
      )
    }

    if (!isAdminApiUser(auth.user) && auth.user.customerId !== resolvedParams.id) {
      return NextResponse.json(
        { error: 'Bu işlem için yetki yok' },
        { status: 403 }
      )
    }

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
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const resolvedParams = await params
    if (!validateId(resolvedParams.id)) {
      return NextResponse.json(
        { error: 'Geçersiz müşteri ID' },
        { status: 400 }
      )
    }

    const body = await request.json() as Record<string, unknown>

    // Sanitize string inputs
    const sanitizedBody = {
      ...body,
      fullName: sanitizeMaybeString(body.fullName),
      firmaAdi: sanitizeMaybeString(body.firmaAdi),
      phoneNumber: sanitizeMaybeString(body.phoneNumber),
      city: sanitizeMaybeString(body.city),
      district: sanitizeMaybeString(body.district),
      club: sanitizeMaybeString(body.club),
      sportsSchoolOfficial: sanitizeMaybeString(body.sportsSchoolOfficial),
      hosting: sanitizeMaybeString(body.hosting),
      duration: sanitizeMaybeString(body.duration),
      startDate: sanitizeMaybeString(body.startDate),
      endDate: sanitizeMaybeString(body.endDate),
      offer: sanitizeMaybeString(body.offer),
      address: sanitizeMaybeString(body.address),
      price: sanitizeMaybeString(body.price),
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
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const resolvedParams = await params
    if (!validateId(resolvedParams.id)) {
      return NextResponse.json(
        { error: 'Geçersiz müşteri ID' },
        { status: 400 }
      )
    }

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
    return handleApiError(error)
  }
}
