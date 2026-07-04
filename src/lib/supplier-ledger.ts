import { Prisma, SupplierTransactionType } from "@/generated/prisma"

type SupplierLedgerTx = Prisma.TransactionClient

type SupplierLedgerInput = {
  supplierId: string
  type: SupplierTransactionType
  debit?: Prisma.Decimal.Value
  credit?: Prisma.Decimal.Value
  description?: string | null
  purchaseId?: string | null
  paymentId?: string | null
}

function decimal(value: Prisma.Decimal.Value | undefined) {
  return new Prisma.Decimal(value ?? 0)
}

export async function createSupplierAccountTransaction(
  tx: SupplierLedgerTx,
  input: SupplierLedgerInput
) {
  const debit = decimal(input.debit)
  const credit = decimal(input.credit)
  const latest = await tx.supplierAccountTransaction.findFirst({
    where: { supplierId: input.supplierId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { balance: true },
  })
  const balance = (latest?.balance ?? new Prisma.Decimal(0)).plus(credit).minus(debit)

  return tx.supplierAccountTransaction.create({
    data: {
      supplierId: input.supplierId,
      type: input.type,
      debit,
      credit,
      balance,
      description: input.description ?? undefined,
      purchaseId: input.purchaseId ?? undefined,
      paymentId: input.paymentId ?? undefined,
    },
  })
}

export async function rebuildSupplierLedgerBalances(tx: SupplierLedgerTx, supplierId: string) {
  const transactions = await tx.supplierAccountTransaction.findMany({
    where: { supplierId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      debit: true,
      credit: true,
      balance: true,
    },
  })

  let balance = new Prisma.Decimal(0)
  for (const transaction of transactions) {
    balance = balance.plus(transaction.credit).minus(transaction.debit)
    if (!transaction.balance.equals(balance)) {
      await tx.supplierAccountTransaction.update({
        where: { id: transaction.id },
        data: { balance },
      })
    }
  }
}

export async function createSupplierPurchaseDebtTransaction(
  tx: SupplierLedgerTx,
  purchase: {
    id: string
    supplierId: string
    total: Prisma.Decimal
    description: string
  }
) {
  return createSupplierAccountTransaction(tx, {
    supplierId: purchase.supplierId,
    type: SupplierTransactionType.PURCHASE_DEBT,
    debit: 0,
    credit: purchase.total,
    purchaseId: purchase.id,
    description: `Alış borcu: ${purchase.description}`,
  })
}

export async function createSupplierPaymentTransaction(
  tx: SupplierLedgerTx,
  payment: {
    id: string
    supplierId: string
    purchaseId?: string | null
    amount: Prisma.Decimal
    note?: string | null
  }
) {
  return createSupplierAccountTransaction(tx, {
    supplierId: payment.supplierId,
    type: SupplierTransactionType.SUPPLIER_PAYMENT,
    debit: payment.amount,
    credit: 0,
    purchaseId: payment.purchaseId ?? undefined,
    paymentId: payment.id,
    description: payment.note ? `Tedarikçi ödemesi: ${payment.note}` : "Tedarikçi ödemesi",
  })
}

export async function createSupplierPurchaseCancellationTransaction(
  tx: SupplierLedgerTx,
  purchase: {
    id: string
    supplierId: string
    total: Prisma.Decimal
    description: string
  }
) {
  return createSupplierAccountTransaction(tx, {
    supplierId: purchase.supplierId,
    type: SupplierTransactionType.PURCHASE_CANCELLATION,
    debit: purchase.total,
    credit: 0,
    purchaseId: purchase.id,
    description: `Alış iptali: ${purchase.description}`,
  })
}
