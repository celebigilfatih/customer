import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType, TransactionType } from "@/generated/prisma";
import { createAccountTransaction } from "@/lib/accounting-ledger";
import { requireAdminApi } from "@/lib/api-auth";

// POST /api/invoices/[id]/issue - Faturayı kes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!invoice) {
        return {
          status: 404,
          body: { error: "Fatura bulunamadı" },
        };
      }

      if (invoice.status !== "DRAFT") {
        return {
          status: 400,
          body: { error: "Sadece taslak faturalar kesilebilir" },
        };
      }

      for (const item of invoice.items) {
        if (item.productId && item.product?.type === ProductType.PRODUCT) {
          const newStock = item.product.stockQuantity.minus(item.quantity);
          if (newStock.lessThan(0)) {
            return {
              status: 400,
              body: { error: `Yetersiz stok: ${item.product.name}` },
            };
          }
        }
      }

      // 1. Fatura durumunu güncelle
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          status: "ISSUED",
          issueDate: new Date(),
        },
      });

      // 2. Cari hesaba borç kaydı oluştur
      await createAccountTransaction(tx, {
        customerId: invoice.customerId,
        type: TransactionType.INVOICE_DEBT,
        debit: invoice.total,
        credit: 0,
        invoiceId: invoice.id,
        description: `Fatura: ${invoice.number}`,
      });

      // 3. Stok hareketi oluştur (ürünler için)
      for (const item of invoice.items) {
        if (item.productId && item.product?.type === ProductType.PRODUCT) {
          const newStock = item.product.stockQuantity.minus(item.quantity);

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              invoiceId: invoice.id,
              description: `Fatura: ${invoice.number}`,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          });
        }
      }

      return {
        status: 200,
        body: {
          message: "Fatura kesildi ve cari borç oluşturuldu",
          invoice: updatedInvoice,
        },
      };
    });

    return NextResponse.json({
      ...result.body,
    }, { status: result.status });
  } catch (error) {
    console.error("Fatura kesilirken hata:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fatura kesilemedi" },
      { status: 500 }
    );
  }
}
