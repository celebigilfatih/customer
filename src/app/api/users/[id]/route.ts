import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { userUpdateSchema, UserUpdate } from '@/lib/validations'
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect(),
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Kullanıcı getirilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const body = await request.json()
    
    // Validate input
    const validation = userUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { username, password, fullName, email, role, customerId, isActive } = validation.data
    const { id } = await params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Check if username is already taken by another user
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id },
        },
      })

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Bu kullanıcı adı zaten kullanılıyor' },
          { status: 409 }
        )
      }
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id },
        },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi zaten kullanılıyor' },
          { status: 409 }
        )
      }
    }

    const targetRole = role || existingUser.role
    const targetCustomerId = targetRole === 'CUSTOMER'
      ? (customerId === undefined ? existingUser.customerId : customerId)
      : null

    if (targetRole === 'CUSTOMER' && !targetCustomerId) {
      return NextResponse.json(
        { error: 'Müşteri portal kullanıcısı için müşteri bağlantısı zorunludur' },
        { status: 400 }
      )
    }

    if (targetCustomerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: targetCustomerId },
        select: { id: true },
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'Bağlanacak müşteri bulunamadı' },
          { status: 404 }
        )
      }
    }

    // Prepare update data
    const updateData: Partial<UserUpdate> & { customerId?: string | null } = {
      fullName,
      email,
      role,
      isActive,
    }

    if (role !== undefined || customerId !== undefined) {
      updateData.customerId = targetCustomerId
    }

    if (username) {
      updateData.username = username
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect(),
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Kullanıcı güncellenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request)
    if (auth.response) return auth.response

    const { id } = await params
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 404 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Kullanıcı başarıyla silindi' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Kullanıcı silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
