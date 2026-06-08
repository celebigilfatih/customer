require('dotenv').config()
const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function main() {
  console.log('DATABASE_URL=', process.env.DATABASE_URL)
  const count = await prisma.customer.count()
  if (count > 0) {
    console.log(`Customers already exist: ${count}. Skipping seed.`)
    return
  }
  await prisma.customer.createMany({
    data: [
      {
        fullName: 'Ali Veli',
        phoneNumber: '5551234567',
        city: 'İstanbul',
        district: 'Kadıköy',
        club: 'ACME Spor Kulübü',
        sportsSchoolOfficial: 'Mehmet Yılmaz',
        hosting: 'Basic Hosting',
        duration: '12 Ay',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        offer: '5000',
        address: 'Moda Mah. Örnek Cad. No:1 Kadıköy/İstanbul',
        status: 'POTENTIAL',
        price: '5000',
      },
      {
        fullName: 'Ayşe Demir',
        phoneNumber: '5329876543',
        city: 'Ankara',
        district: 'Çankaya',
        club: 'Çankaya Spor Kulübü',
        sportsSchoolOfficial: 'Zeynep Kara',
        hosting: 'Pro Hosting',
        duration: '6 Ay',
        startDate: '2025-02-01',
        endDate: '2025-07-31',
        offer: '3500',
        address: 'Tunalı Hilmi Cad. No:12 Çankaya/Ankara',
        status: 'ACTIVE',
        price: '3500',
      },
      {
        fullName: 'Burak Şahin',
        phoneNumber: '5301112233',
        city: 'İzmir',
        district: 'Konak',
        club: 'Ege Spor Kulübü',
        sportsSchoolOfficial: 'Ahmet Aksoy',
        hosting: 'Enterprise Hosting',
        duration: '24 Ay',
        startDate: '2025-03-15',
        endDate: '2027-03-14',
        offer: '12000',
        address: 'Gazi Bulvarı No:45 Konak/İzmir',
        status: 'INACTIVE',
        price: '12000',
      },
    ],
  })
  console.log('Seed completed: customers inserted.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
