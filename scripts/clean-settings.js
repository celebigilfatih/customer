/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.setting.deleteMany({
    where: {
      key: {
        startsWith: 'proposal_types'
      }
    }
  })
  console.log(`Deleted ${result.count} records`)
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
