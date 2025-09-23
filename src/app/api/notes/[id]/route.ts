import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { noteUpdateSchema } from '@/lib/validations'
import { handleApiError, validateId, sanitizeInput } from '@/lib/error-handler'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params
    validateId(resolvedParams.id)

    const note = await prisma.note.findUnique({
      where: { id: resolvedParams.id },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params
    validateId(resolvedParams.id)

    const body = await request.json()
    
    // Sanitize string inputs
    const sanitizedBody = {
      ...body,
      content: body.content ? sanitizeInput(body.content) : undefined,
    }

    const validatedData = noteUpdateSchema.parse(sanitizedBody)

    const note = await prisma.note.update({
      where: { id: resolvedParams.id },
      data: validatedData,
    })

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params
    validateId(resolvedParams.id)

    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    await prisma.note.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ message: 'Note deleted successfully' })
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}