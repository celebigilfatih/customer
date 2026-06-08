import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username)
      // Update password to 'admin'
      const hashedPassword = await bcrypt.hash('admin', 12)
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword },
      })
      console.log('Password updated to: admin')
      return
    }

    // Check if oguz user exists and update it
    const oguzUser = await prisma.user.findUnique({
      where: { username: 'oguz' },
    })

    if (oguzUser) {
      const hashedPassword = await bcrypt.hash('admin', 12)
      await prisma.user.update({
        where: { id: oguzUser.id },
        data: {
          role: 'ADMIN',
          password: hashedPassword,
        },
      })
      console.log('Oguz user updated to ADMIN with password: admin')
      return
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin', 12)
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
        isActive: true,
      },
    })

    console.log('Admin user created:', adminUser.username)
    console.log('Password: admin')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
