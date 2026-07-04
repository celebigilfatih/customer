import { InvoiceStatus, Prisma } from "@/generated/prisma"

export const saleInclude = {
  customer: {
    select: {
      id: true,
      fullName: true,
      club: true,
      phoneNumber: true,
    },
  },
  items: {
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      product: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      domain: {
        select: {
          id: true,
          name: true,
          registerDate: true,
          renewDate: true,
          autoRenew: true,
          whoisNote: true,
        },
      },
      hosting: {
        select: {
          id: true,
          name: true,
          endDate: true,
          notes: true,
        },
      },
      supplierPurchase: {
        select: {
          id: true,
          supplierId: true,
          description: true,
          total: true,
          status: true,
          supplierInvoiceNo: true,
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
            },
          },
        },
      },
    },
  },
  payments: {
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      paidDate: true,
      dueDate: true,
      note: true,
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  stockMovements: {
    select: {
      id: true,
      productId: true,
      type: true,
      quantity: true,
      description: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  supplierPurchases: {
    select: {
      id: true,
      supplierId: true,
      description: true,
      total: true,
      status: true,
      supplierInvoiceNo: true,
      supplier: {
        select: {
          id: true,
          name: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
        },
      },
    },
  },
  accountTransactions: {
    select: {
      id: true,
      type: true,
      debit: true,
      credit: true,
      balance: true,
      description: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
} satisfies Prisma.InvoiceInclude

export type SaleReadModel = Prisma.InvoiceGetPayload<{ include: typeof saleInclude }>

export function getSaleItemLabel(item: SaleReadModel["items"][number]) {
  if (item.domain) return `Domain: ${item.domain.name}`
  if (item.hosting) return `Hosting: ${item.hosting.name}`
  if (item.product?.type === "SERVICE") return `Hizmet: ${item.product.name}`
  if (item.product?.type === "PRODUCT") return `Ürün: ${item.product.name}`
  return `Kalem: ${item.description}`
}

export function serializeSale(invoice: SaleReadModel) {
  const paidAmount = invoice.payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0))
  const remainingAmount = invoice.status === InvoiceStatus.CANCELLED
    ? new Prisma.Decimal(0)
    : invoice.total.minus(paidAmount)
  const itemLabels = Array.from(new Set(invoice.items.map(getSaleItemLabel)))
  const supplierPurchases = invoice.supplierPurchases.length > 0
    ? invoice.supplierPurchases
    : invoice.items.flatMap((item) => item.supplierPurchase ? [item.supplierPurchase] : [])

  return {
    ...invoice,
    itemLabels,
    paidAmount: paidAmount.toString(),
    remainingAmount: remainingAmount.toString(),
    canCancel: invoice.status !== InvoiceStatus.CANCELLED,
    hasPaidSupplierPurchase: supplierPurchases.some((purchase) => purchase.payments.length > 0),
    supplierPurchases,
  }
}
