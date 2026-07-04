import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { requireAdminApi } from "@/lib/api-auth";

// GET /api/accounting/customers - Cari hesap listesi
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Prisma.CustomerWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const balances = await prisma.accountTransaction.groupBy({
      by: ["customerId"],
      where: { customerId: { in: customers.map((customer) => customer.id) } },
      _sum: {
        debit: true,
        credit: true,
      },
    });
    const balanceMap = new Map(
      balances.map((balance) => [
        balance.customerId,
        (balance._sum.debit ?? new Prisma.Decimal(0))
          .minus(balance._sum.credit ?? new Prisma.Decimal(0))
          .toString(),
      ])
    );

    const customersWithBalance = customers.map((customer) => ({
      ...customer,
      currentBalance: balanceMap.get(customer.id) ?? "0",
    }));

    return NextResponse.json(customersWithBalance);
  } catch (error) {
    console.error("Cari hesap listesi alınırken hata:", error);
    return NextResponse.json(
      { error: "Cari hesap listesi alınamadı" },
      { status: 500 }
    );
  }
}
