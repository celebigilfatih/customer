import { PaymentStatus, Prisma, TransactionType } from '@/generated/prisma'

type AccountingTx = Prisma.TransactionClient

type LedgerInput = {
  customerId: string
  type: TransactionType
  debit?: Prisma.Decimal.Value
  credit?: Prisma.Decimal.Value
  description?: string | null
  proposalId?: string | null
  invoiceId?: string | null
  paymentId?: string | null
}

type LedgerPayment = {
  id: string
  customerId: string
  invoiceId?: string | null
  amount: Prisma.Decimal
  status: PaymentStatus
  note?: string | null
}

function decimal(value: Prisma.Decimal.Value | undefined) {
  return new Prisma.Decimal(value ?? 0)
}

export async function createAccountTransaction(tx: AccountingTx, input: LedgerInput) {
  const debit = decimal(input.debit)
  const credit = decimal(input.credit)
  const latest = await tx.accountTransaction.findFirst({
    where: { customerId: input.customerId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { balance: true },
  })
  const balance = (latest?.balance ?? new Prisma.Decimal(0)).plus(debit).minus(credit)

  return tx.accountTransaction.create({
    data: {
      customerId: input.customerId,
      type: input.type,
      debit,
      credit,
      balance,
      description: input.description ?? undefined,
      proposalId: input.proposalId ?? undefined,
      invoiceId: input.invoiceId ?? undefined,
      paymentId: input.paymentId ?? undefined,
    },
  })
}

export async function rebuildCustomerLedgerBalances(tx: AccountingTx, customerId: string) {
  const transactions = await tx.accountTransaction.findMany({
    where: { customerId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      debit: true,
      credit: true,
      balance: true,
    },
  })

  let balance = new Prisma.Decimal(0)
  for (const transaction of transactions) {
    balance = balance.plus(transaction.debit).minus(transaction.credit)
    if (!transaction.balance.equals(balance)) {
      await tx.accountTransaction.update({
        where: { id: transaction.id },
        data: { balance },
      })
    }
  }
}

export async function syncPaymentCreditTransaction(
  tx: AccountingTx,
  payment: LedgerPayment,
  previousCustomerId?: string
) {
  const affectedCustomerIds = new Set<string>()
  if (previousCustomerId) affectedCustomerIds.add(previousCustomerId)

  const existingTransactions = await tx.accountTransaction.findMany({
    where: { paymentId: payment.id },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, customerId: true },
  })
  const [existing, ...duplicates] = existingTransactions

  for (const transaction of existingTransactions) {
    affectedCustomerIds.add(transaction.customerId)
  }

  if (duplicates.length > 0) {
    await tx.accountTransaction.deleteMany({
      where: { id: { in: duplicates.map((transaction) => transaction.id) } },
    })
  }

  if (payment.status === PaymentStatus.PAID) {
    affectedCustomerIds.add(payment.customerId)

    if (existing) {
      await tx.accountTransaction.update({
        where: { id: existing.id },
        data: {
          customerId: payment.customerId,
          invoiceId: payment.invoiceId ?? null,
          type: TransactionType.PAYMENT_CREDIT,
          debit: new Prisma.Decimal(0),
          credit: payment.amount,
          description: payment.note ? `Tahsilat: ${payment.note}` : 'Tahsilat kaydı',
        },
      })
    } else {
      await createAccountTransaction(tx, {
        customerId: payment.customerId,
        type: TransactionType.PAYMENT_CREDIT,
        debit: 0,
        credit: payment.amount,
        paymentId: payment.id,
        invoiceId: payment.invoiceId ?? undefined,
        description: payment.note ? `Tahsilat: ${payment.note}` : 'Tahsilat kaydı',
      })
    }
  } else if (existing) {
    await tx.accountTransaction.delete({ where: { id: existing.id } })
  }

  for (const customerId of affectedCustomerIds) {
    await rebuildCustomerLedgerBalances(tx, customerId)
  }
}
