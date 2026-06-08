const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding proposal types...')
  
  const proposalTypes = [
    { id: 'SUBSCRIPTION', name: 'SUBSCRIPTION', label: 'Abonelik', isActive: true },
    { id: 'PROJECT', name: 'PROJECT', label: 'Proje', isActive: true },
    { id: 'MAINTENANCE', name: 'MAINTENANCE', label: 'Bakım Anlaşması', isActive: true },
    { id: 'RENEWAL', name: 'RENEWAL', label: 'Yenileme', isActive: true },
  ]

  const key = 'proposal_types'
  
  // Check if already exists
  const existing = await prisma.setting.findUnique({
    where: { key }
  })
  
  if (existing) {
    console.log(`⏭️  Setting ${key} already exists, updating...`)
    await prisma.setting.update({
      where: { key },
      data: {
        value: JSON.stringify(proposalTypes),
        type: 'json',
        isActive: true,
      }
    })
    console.log(`✅ Updated ${key}`)
  } else {
    await prisma.setting.create({
      data: {
        key,
        value: JSON.stringify(proposalTypes),
        type: 'json',
        isActive: true,
      }
    })
    console.log(`✅ Created ${key}`)
  }
  
  console.log('✅ Proposal types seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding proposal types:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
