const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'oguz' },
    })

    if (existingUser) {
      console.log('Kullanıcı zaten mevcut:', existingUser.username)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('ou+-2018', 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: 'oguz',
        password: hashedPassword,
        fullName: 'Oğuz Kullanıcı',
        email: 'oguz@example.com',
        isActive: true,
      },
    })

    console.log('Kullanıcı başarıyla oluşturuldu:', user.username)
  } catch (error) {
    console.error('Kullanıcı oluşturulurken hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()