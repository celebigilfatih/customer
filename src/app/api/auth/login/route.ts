import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/prisma'
import { loginSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { username, password } = validation.data

    const totalUsers = await prisma.user.count()
    if (totalUsers === 0) {
      const hashed = await bcrypt.hash('admin', 12)
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashed,
          fullName: 'Admin Kullanıcı',
          email: 'admin@example.com',
          role: Role.ADMIN,
          isActive: true,
        },
      })
    }

    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Kullanıcı hesabı devre dışı' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı adı veya şifre' },
        { status: 401 }
      )
    }

    // Return user data (without password)
    const userData = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      role: user.role,
      customerId: user.customerId,
    }

    return NextResponse.json({
      message: 'Giriş başarılı',
      user: userData,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
