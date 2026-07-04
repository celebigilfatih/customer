import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { userCreateSchema } from '@/lib/validations'
import { requireAdminApi } from '@/lib/api-auth'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function userSelect() {
  return {
    id: true,
    username: true,
    fullName: true,
    email: true,
    role: true,
    customerId: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    customer: {
      select: {
        id: true,
        club: true,
        fullName: true,
      },
    },
  } as const
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const users = await prisma.user.findMany({
      select: userSelect(),
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Kullanıcılar getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const body = await request.json()
    
    // Validate input
    const validation = userCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { username, password, fullName, email, role, customerId, isActive } = validation.data
    const displayName = fullName || username
    const normalizedCustomerId = role === 'CUSTOMER' ? customerId : null

    if (role === 'CUSTOMER' && !normalizedCustomerId) {
      return NextResponse.json(
        { error: 'Müşteri portal kullanıcısı için müşteri bağlantısı zorunludur' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı zaten kullanılıyor' },
        { status: 409 }
      )
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 409 }
      )
    }

    if (normalizedCustomerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: normalizedCustomerId },
        select: { id: true },
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'Bağlanacak müşteri bulunamadı' },
          { status: 404 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName: displayName,
        email,
        role,
        customerId: normalizedCustomerId,
        isActive,
      },
      select: userSelect(),
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}
