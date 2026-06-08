import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const openingBalanceSchema = z.object({
  amount: z.number(),
  date: z.string().datetime(),
  description: z.string().optional(),
});

// GET /api/accounting/customers/[id] - Müşteri cari detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Tüm hareketleri al
    const transactions = await prisma.accountTransaction.findMany({
      where: { customerId: params.id },
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
          },
        },
        payment: {
          select: {
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

    return NextResponse.json({
      customer,
      transactions,
      summary: {
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = openingBalanceSchema.parse(body);

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Müşteri bulunamadı" },
        { status: 404 }
      );
    }

    // Açılış bakiyesi hareketi oluştur
    const transaction = await prisma.accountTransaction.create({
      data: {
        customerId: params.id,
        type: "OPENING_BALANCE",
        debit: validatedData.amount > 0 ? validatedData.amount : 0,
        credit: validatedData.amount < 0 ? Math.abs(validatedData.amount) : 0,
        balance: validatedData.amount,
        description:
          validatedData.description ||
          `Açılış bakiyesi: ${validatedData.amount}`,
      },
    });

    // Müşteriyi güncelle
    await prisma.customer.update({
      where: { id: params.id },
      data: {
        openingBalance: validatedData.amount,
        openingBalanceDate: new Date(validatedData.date),
      },
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
