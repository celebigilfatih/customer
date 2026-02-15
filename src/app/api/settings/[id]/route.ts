import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const setting = await prisma.setting.findUnique({ where: { id } })

    if (!setting) {
      return NextResponse.json({ error: 'Ayar bulunamadı' }, { status: 404 })
    }

    return new NextResponse(JSON.stringify(setting), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('GET /api/settings/[id] error:', error)
    return NextResponse.json({ error: 'Ayar getirilemedi' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const setting = await prisma.setting.update({
      where: { id },
      data: {
        ...(body.key !== undefined && { key: body.key }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    return new NextResponse(JSON.stringify(setting), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('PATCH /api/settings/[id] error:', error)
    return NextResponse.json({ error: 'Ayar güncellenemedi' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Soft delete
    await prisma.setting.update({
      where: { id },
      data: { isActive: false },
    })

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('DELETE /api/settings/[id] error:', error)
    return NextResponse.json({ error: 'Ayar silinemedi' }, { status: 500 })
  }
}
