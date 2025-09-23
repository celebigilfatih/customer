import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { noteCreateSchema } from '@/lib/validations'
import { handleApiError, validateId, sanitizeInput } from '@/lib/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    validateId(resolvedParams.id)

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const notes = await prisma.note.findMany({
      where: { customerId: resolvedParams.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notes)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    validateId(resolvedParams.id)

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Sanitize string inputs
    const sanitizedBody = {
      ...body,
      content: body.content ? sanitizeInput(body.content) : undefined,
    }

    const validatedData = noteCreateSchema.parse(sanitizedBody)

    const note = await prisma.note.create({
      data: {
        ...validatedData,
        customerId: resolvedParams.id
      }
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}