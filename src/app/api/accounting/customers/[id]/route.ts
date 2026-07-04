import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, TransactionType } from "@/generated/prisma";
import { createAccountTransaction, rebuildCustomerLedgerBalances } from "@/lib/accounting-ledger";
import { requireAdminApi } from "@/lib/api-auth";
import { z } from "zod";

const openingBalanceSchema = z.object({
  amount: z.number(),
  date: z.string().datetime(),
  description: z.string().optional(),
});

type TransactionForDisplay = Awaited<
  ReturnType<typeof prisma.accountTransaction.findMany>
>[number] & {
  invoice?: {
    number: string;
    subtotal: Prisma.Decimal;
    total: Prisma.Decimal;
    items?: Array<{
      description: string;
      domain?: { name: string } | null;
      hosting?: { name: string } | null;
      product?: { name: string; type: string } | null;
    }>;
  } | null;
  payment?: {
    amount: Prisma.Decimal;
    type: string;
    date: Date;
  } | null;
};

function calculateTaxExcludedSide(
  amount: Prisma.Decimal,
  transaction: TransactionForDisplay
) {
  if (amount.equals(0)) return new Prisma.Decimal(0);

  if (transaction.invoice && transaction.invoice.total.greaterThan(0)) {
    return amount.mul(transaction.invoice.subtotal).div(transaction.invoice.total);
  }

  return amount;
}

function buildOperationalDescription(transaction: TransactionForDisplay) {
  const operationLabels =
    transaction.invoice?.items
      ?.map((item) => {
        if (item.domain) return `Domain: ${item.domain.name}`;
        if (item.hosting) return `Hosting: ${item.hosting.name}`;
        if (item.product?.type === "SERVICE") return `Hizmet: ${item.product.name}`;
        if (item.product?.type === "PRODUCT") return `Ürün: ${item.product.name}`;
        return `Kalem: ${item.description}`;
      })
      .filter(Boolean) || [];

  if (operationLabels.length > 0) {
    return Array.from(new Set(operationLabels)).join(", ");
  }

  return transaction.description || "";
}

// GET /api/accounting/customers/[id] - Müşteri cari detayı
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Tüm hareketleri al
    const transactions = await prisma.accountTransaction.findMany({
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        proposal: {
          select: {
            number: true,
            title: true,
          },
        },
        invoice: {
          select: {
            number: true,
            subtotal: true,
            total: true,
            items: {
              select: {
                description: true,
                domain: {
                  select: {
                    name: true,
                  },
                },
                hosting: {
                  select: {
                    name: true,
                  },
                },
                product: {
                  select: {
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
        payment: {
          select: {
            amount: true,
            type: true,
            date: true,
          },
        },
      },
    });

    // Özet istatistikler
    const totalDebit = transactions.reduce(
      (sum, t) => sum + (t.debit?.toNumber() || 0),
      0
    );
    const totalCredit = transactions.reduce(
      (sum, t) => sum + (t.credit?.toNumber() || 0),
      0
    );

    const transactionsAscending = [...transactions].reverse();
    let taxExcludedBalance = new Prisma.Decimal(0);
    const taxExcludedById = new Map<
      string,
      {
        debit: Prisma.Decimal;
        credit: Prisma.Decimal;
        balance: Prisma.Decimal;
      }
    >();

    for (const transaction of transactionsAscending) {
      const debit = calculateTaxExcludedSide(transaction.debit, transaction);
      const credit = calculateTaxExcludedSide(transaction.credit, transaction);
      taxExcludedBalance = taxExcludedBalance.plus(debit).minus(credit);
      taxExcludedById.set(transaction.id, {
        debit,
        credit,
        balance: taxExcludedBalance,
      });
    }

    const transactionsWithDisplay = transactions.map((transaction) => {
      const taxExcluded = taxExcludedById.get(transaction.id) || {
        debit: transaction.debit,
        credit: transaction.credit,
        balance: transaction.balance,
      };

      return {
        ...transaction,
        displayDescription: buildOperationalDescription(transaction),
        taxExcludedDebit: taxExcluded.debit.toString(),
        taxExcludedCredit: taxExcluded.credit.toString(),
        taxExcludedBalance: taxExcluded.balance.toString(),
      };
    });

    const taxExcludedTotalDebit = transactionsWithDisplay.reduce(
      (sum, transaction) => sum + Number(transaction.taxExcludedDebit || 0),
      0
    );
    const taxExcludedTotalCredit = transactionsWithDisplay.reduce(
      (sum, transaction) => sum + Number(transaction.taxExcludedCredit || 0),
      0
    );

    return NextResponse.json({
      customer,
      transactions: transactionsWithDisplay,
      summary: {
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
        taxExcludedTotalDebit,
        taxExcludedTotalCredit,
        taxExcludedBalance: taxExcludedTotalDebit - taxExcludedTotalCredit,
      },
    });
  } catch (error) {
    console.error("Cari detay alınırken hata:", error);
    return NextResponse.json(
      { error: "Cari detay alınamadı" },
      { status: 500 }
    );
  }
}

// POST /api/accounting/customers/[id]/opening-balance - Açılış bakiyesi ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    const body = await request.json();
    const validatedData = openingBalanceSchema.parse(body);

    const transaction = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        throw new Error("Müşteri bulunamadı");
      }

      const debit = validatedData.amount > 0 ? new Prisma.Decimal(validatedData.amount) : new Prisma.Decimal(0);
      const credit = validatedData.amount < 0 ? new Prisma.Decimal(Math.abs(validatedData.amount)) : new Prisma.Decimal(0);
      const description =
        validatedData.description ||
        `Açılış bakiyesi: ${validatedData.amount}`;

      const existing = await tx.accountTransaction.findFirst({
        where: {
          customerId: id,
          type: TransactionType.OPENING_BALANCE,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });

      const saved = existing
        ? await tx.accountTransaction.update({
            where: { id: existing.id },
            data: {
              debit,
              credit,
              description,
            },
          })
        : await createAccountTransaction(tx, {
            customerId: id,
            type: TransactionType.OPENING_BALANCE,
            debit,
            credit,
            description,
          });

      await tx.customer.update({
        where: { id },
        data: {
          openingBalance: validatedData.amount,
          openingBalanceDate: new Date(validatedData.date),
        },
      });

      await rebuildCustomerLedgerBalances(tx, id);

      return saved;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Açılış bakiyesi eklenirken hata:", error);
    return NextResponse.json(
      { error: "Açılış bakiyesi eklenemedi" },
      { status: 500 }
    );
  }
}
