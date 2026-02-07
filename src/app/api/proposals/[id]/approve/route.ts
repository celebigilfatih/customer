import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const approveSchema = z.object({
  approvedBy: z.string().min(1, "Onaylayan kişi gereklidir"),
});

// POST /api/proposals/[id]/approve - Teklifi onayla ve cari borç oluştur
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = approveSchema.parse(body);

    // Teklifi kontrol et
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Teklif bulunamadı" },
        { status: 404 }
      );
    }

    if (proposal.status !== "SENT" && proposal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Bu teklif onaylanamaz. Durum: " + proposal.status },
        { status: 400 }
      );
    }

    // Transaction başlat
    const result = await prisma.$transaction(async (tx) => {
      // 1. Teklif durumunu güncelle
      const updatedProposal = await tx.proposal.update({
        where: { id: params.id },
        data: {
          status: "APPROVED",
          approvedBy: validatedData.approvedBy,
          approvedAt: new Date(),
        },
      });

      // 2. Cari hesaba borç kaydı oluştur
      const transaction = await tx.accountTransaction.create({
        data: {
          customerId: proposal.customerId,
          type: "PROPOSAL_DEBT",
          debit: proposal.amount,
          credit: 0,
          balance: proposal.amount, // Önceki bakiye + borç (sadeleştirilmiş)
          proposalId: proposal.id,
          description: `Teklif onayı: ${proposal.title}`,
        },
      });

      // 3. Stoktan düşüm yap (ürün varsa)
      for (const item of proposal.items) {
        if (item.productId && item.product) {
          const newStock = item.product.stockQuantity.minus(item.quantity);

          // Negatif stok kontrolü
          if (newStock.lessThan(0)) {
            throw new Error(
              `Yetersiz stok: ${item.product.name} (Mevcut: ${item.product.stockQuantity}, İstenen: ${item.quantity})`
            );
          }

          // Stok hareketi oluştur
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              proposalId: proposal.id,
              description: `Teklif onayı: ${proposal.title}`,
            },
          });

          // Ürün stoğunu güncelle
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          });
        }
      }

      return { proposal: updatedProposal, transaction };
    });

    return NextResponse.json({
      message: "Teklif onaylandı ve cari borç oluşturuldu",
      ...result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Teklif onaylanırken hata:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Teklif onaylanamadı" },
      { status: 500 }
    );
  }
}
