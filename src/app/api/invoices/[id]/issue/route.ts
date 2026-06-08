import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/invoices/[id]/issue - Faturayı kes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Fatura bulunamadı" },
        { status: 404 }
      );
    }

    if (invoice.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Sadece taslak faturalar kesilebilir" },
        { status: 400 }
      );
    }

    // 1. Fatura durumunu güncelle
    const updatedInvoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "ISSUED",
        issueDate: new Date(),
      },
    });

    // 2. Cari hesaba borç kaydı oluştur
    await prisma.accountTransaction.create({
      data: {
        customerId: invoice.customerId,
        type: "INVOICE_DEBT",
        debit: invoice.total,
        credit: 0,
        balance: invoice.total,
        invoiceId: invoice.id,
        description: `Fatura: ${invoice.number}`,
      },
    });

    // 3. Stok hareketi oluştur (ürünler için)
    for (const item of invoice.items) {
      if (item.productId && item.product) {
        const newStock = item.product.stockQuantity.minus(item.quantity);

        // Negatif stok kontrolü
        if (newStock.lessThan(0)) {
          return NextResponse.json(
            { error: `Yetersiz stok: ${item.product.name}` },
            { status: 400 }
          );
        }

        // Stok hareketi oluştur
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity,
            invoiceId: invoice.id,
            description: `Fatura: ${invoice.number}`,
          },
        });

        // Ürün stoğunu güncelle
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newStock },
        });
      }
    }

    return NextResponse.json({
      message: "Fatura kesildi ve cari borç oluşturuldu",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Fatura kesilirken hata:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fatura kesilemedi" },
      { status: 500 }
    );
  }
}
