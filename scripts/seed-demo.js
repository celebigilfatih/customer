/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, $Enums } = require('../src/generated/prisma')

async function main() {
  const prisma = new PrismaClient()
  try {
    let customer = await prisma.customer.findFirst({ where: { fullName: 'Demo Customer' } })
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: 'Demo Customer',
          phoneNumber: '5555555555',
          city: 'Istanbul',
          district: 'Kadikoy',
          club: 'Demo Club',
          sportsSchoolOfficial: 'Yetkili',
          hosting: 'Shared plan',
          duration: '1',
          startDate: '2025-01-01',
          endDate: '2026-01-01',
          offer: 'Demo offer',
          address: 'Test address 12345',
          status: $Enums.CustomerStatus.CONVERTED,
          price: '1000',
        },
      })
    }

    const existing = await prisma.subscription.findFirst({ where: { name: 'Demo Multi Type', customerId: customer.id } })
    if (!existing) {
      await prisma.subscription.create({
        data: {
          customerId: customer.id,
          name: 'Demo Multi Type',
          type: [
            $Enums.SubscriptionType.SOFTWARE_RENTAL,
            $Enums.SubscriptionType.DOMAIN,
            $Enums.SubscriptionType.HOSTING,
          ],
          period: $Enums.BillingPeriod.MONTHLY,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2026-01-01'),
          autoRenew: false,
          status: $Enums.SubscriptionStatus.ACTIVE,
          price: '100',
        },
      })
    }

    const today = new Date()
    today.setHours(0,0,0,0)
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x }

    const soonSub = await prisma.subscription.findFirst({ where: { name: 'Demo Soon End', customerId: customer.id } })
    if (!soonSub) {
      await prisma.subscription.create({
        data: {
          customerId: customer.id,
          name: 'Demo Soon End',
          type: [$Enums.SubscriptionType.SOFTWARE_RENTAL],
          period: $Enums.BillingPeriod.MONTHLY,
          startDate: addDays(today, -20),
          endDate: addDays(today, 10),
          autoRenew: false,
          status: $Enums.SubscriptionStatus.ACTIVE,
          price: '500',
        },
      })
    }

    const demoDomain = await prisma.domain.findFirst({ where: { name: 'demo-example.com', customerId: customer.id } })
    if (!demoDomain) {
      await prisma.domain.create({
        data: {
          customerId: customer.id,
          name: 'demo-example.com',
          registrar: 'Demo Registrar',
          registerDate: addDays(today, -300),
          renewDate: addDays(today, 8),
          whoisNote: 'Demo',
          autoRenew: true,
        },
      })
    }

    const demoHosting = await prisma.hosting.findFirst({ where: { customerId: customer.id, package: 'Demo Plan' } })
    if (!demoHosting) {
      await prisma.hosting.create({
        data: {
          customerId: customer.id,
          package: 'Demo Plan',
          server: 'srv-1',
          ip: '192.168.1.100',
          panelUrl: 'https://panel.example',
          panelUser: 'demo',
          panelPass: 'secret',
          endDate: addDays(today, 6),
          notes: 'Demo hosting',
        },
      })
    }

    const payToday = await prisma.payment.findFirst({ where: { customerId: customer.id, amount: '300', currency: 'TRY', status: $Enums.PaymentStatus.DUE } })
    if (!payToday) {
      await prisma.payment.create({
        data: {
          customerId: customer.id,
          amount: '300',
          currency: 'TRY',
          dueDate: today,
          status: $Enums.PaymentStatus.DUE,
          note: 'Bugün vade',
        },
      })
    }

    const paySoon = await prisma.payment.findFirst({ where: { customerId: customer.id, amount: '1500', currency: 'TRY', status: $Enums.PaymentStatus.DUE } })
    if (!paySoon) {
      await prisma.payment.create({
        data: {
          customerId: customer.id,
          amount: '1500',
          currency: 'TRY',
          dueDate: addDays(today, 7),
          status: $Enums.PaymentStatus.DUE,
          note: 'Yakın vade',
        },
      })
    }

    const payLate = await prisma.payment.findFirst({ where: { customerId: customer.id, amount: '750', currency: 'TRY', status: $Enums.PaymentStatus.LATE } })
    if (!payLate) {
      await prisma.payment.create({
        data: {
          customerId: customer.id,
          amount: '750',
          currency: 'TRY',
          dueDate: addDays(today, -3),
          status: $Enums.PaymentStatus.LATE,
          note: 'Gecikmiş',
        },
      })
    }

    console.log('Seed completed. Customer:', customer.id)
  } catch (e) {
    console.error('Seed error', e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

main()
