import bcrypt from 'bcryptjs'
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

function requiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

async function createAdminUser() {
  try {
    const username = requiredEnv('ADMIN_USERNAME')
    const email = requiredEnv('ADMIN_EMAIL')
    const password = requiredEnv('ADMIN_PASSWORD')
    const fullName = process.env.ADMIN_FULL_NAME?.trim() || 'Admin User'

    if (password.length < 12) {
      throw new Error('ADMIN_PASSWORD must be at least 12 characters')
    }

    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { username: true, email: true },
    })

    if (existingAdmin) {
      console.log(`Admin user already exists: ${existingAdmin.username} (${existingAdmin.email}). No changes made.`)
      return
    }

    const existingIdentity = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: { username: true, email: true, role: true },
    })

    if (existingIdentity) {
      throw new Error(
        `A non-admin user already uses this username/email: ${existingIdentity.username} (${existingIdentity.email}, ${existingIdentity.role})`
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const adminUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        email,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        username: true,
        email: true,
        role: true,
      },
    })

    console.log(`Admin user created: ${adminUser.username} (${adminUser.email}, ${adminUser.role})`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
