const { PrismaClient } = require('../src/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createUsers() {
  const users = [
    {
      username: 'oguz',
      password: 'ou+-2018',
      fullName: 'Oğuz Kullanıcı',
      email: 'oguz@example.com'
    },
    {
      username: 'celebigil',
      password: 'kopgel77788',
      fullName: 'Celebi Gil',
      email: 'celebigil@example.com'
    }
  ]

  try {
    for (const userData of users) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username },
      })

      if (existingUser) {
        console.log(`Kullanıcı zaten mevcut: ${userData.username}`)
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          fullName: userData.fullName,
          email: userData.email,
          isActive: true,
        },
      })

      console.log(`Kullanıcı başarıyla oluşturuldu: ${user.username}`)
    }
  } catch (error) {
    console.error('Kullanıcı oluşturulurken hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUsers()