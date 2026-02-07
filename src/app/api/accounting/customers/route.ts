import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/accounting/customers - Cari hesap listesi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: any = {};

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

    // Her müşteri için bakiye hesapla
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const transactions = await prisma.accountTransaction.findMany({
          where: { customerId: customer.id },
          orderBy: { createdAt: "desc" },
          take: 1,
        });

        const lastBalance =
          transactions.length > 0 
            ? transactions[0].balance.toString()
            : "0";

        return {
          ...customer,
          currentBalance: lastBalance,
        };
      })
    );

    return NextResponse.json(customersWithBalance);
  } catch (error) {
    console.error("Cari hesap listesi alınırken hata:", error);
    return NextResponse.json(
      { error: "Cari hesap listesi alınamadı" },
      { status: 500 }
    );
  }
}
