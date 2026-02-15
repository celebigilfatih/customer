import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    let settings
    if (key) {
      settings = await prisma.setting.findMany({
        where: { 
          key: { contains: key },
          isActive: true 
        },
        orderBy: { key: 'asc' },
      })
    } else {
      settings = await prisma.setting.findMany({
        where: { isActive: true },
        orderBy: { key: 'asc' },
      })
    }

    return new NextResponse(JSON.stringify(settings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Ayarlar getirilemedi' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.key || !body.value) {
      return NextResponse.json({ error: 'Key ve value alanları zorunludur' }, { status: 400 })
    }

    // Check if key already exists
    const existing = await prisma.setting.findUnique({ where: { key: body.key } })
    if (existing) {
      return NextResponse.json({ error: 'Bu ayar anahtarı zaten mevcut' }, { status: 400 })
    }

    const setting = await prisma.setting.create({
      data: {
        key: body.key,
        value: body.value,
        type: body.type || 'string',
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    })

    return new NextResponse(JSON.stringify(setting), {
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('POST /api/settings error:', error)
    return NextResponse.json({ error: 'Ayar oluşturulamadı' }, { status: 500 })
  }
}
