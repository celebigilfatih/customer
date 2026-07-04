import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/notes/[id] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Not içeriği boş olamaz' },
        { status: 400 }
      )
    }

    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { id },
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      )
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { content },
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error('Update note error:', error)
    return NextResponse.json(
      { error: 'Not güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if note exists
    const existingNote = await prisma.note.findUnique({
      where: { id },
    })

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Not bulunamadı' },
        { status: 404 }
      )
    }

    await prisma.note.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete note error:', error)
    return NextResponse.json(
      { error: 'Not silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
