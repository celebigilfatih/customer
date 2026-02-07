import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productUpdateSchema = z.object({
  name: z.string().min(1, "Ürün adı gereklidir").optional(),
  description: z.string().optional(),
  minStockLevel: z.number().optional(),
  unitPrice: z.number().positive("Birim fiyat pozitif olmalıdır").optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/products/[id] - Ürün detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: {
            proposalItems: true,
            invoiceItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Ürün detayı alınırken hata:", error);
    return NextResponse.json(
      { error: "Ürün detayı alınamadı" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Ürün güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = productUpdateSchema.parse(body);

    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Ürün güncellenirken hata:", error);
    return NextResponse.json(
      { error: "Ürün güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Ürün sil (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            proposalItems: true,
            invoiceItems: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    // Kullanımda olan ürünü silme
    if (
      existingProduct._count.proposalItems > 0 ||
      existingProduct._count.invoiceItems > 0
    ) {
      // Soft delete - sadece pasif yap
      const product = await prisma.product.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Ürün pasif duruma getirildi",
        product,
      });
    }

    // Kullanılmayan ürünü tamamen sil
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Ürün silindi" });
  } catch (error) {
    console.error("Ürün silinirken hata:", error);
    return NextResponse.json(
      { error: "Ürün silinemedi" },
      { status: 500 }
    );
  }
}
