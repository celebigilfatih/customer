import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { noteCreateSchema } from '@/lib/validations'

// GET /api/notes?customerId=xxx - Get all notes for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId parametresi gerekli' },
        { status: 400 }
      )
    }

    const notes = await prisma.note.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Get notes error:', error)
    return NextResponse.json(
      { error: 'Notlar alınırken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = noteCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { customerId, content } = validation.data

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      )
    }

    const note = await prisma.note.create({
      data: {
        customerId,
        content,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json(
      { error: 'Not oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}
