import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productGroupUpdateSchema = z.object({
  name: z.string().min(1, "Grup adı gereklidir").optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/product-groups/[id] - Grup detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.productGroup.findUnique({
      where: { id: params.id },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grup bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Grup detayı alınırken hata:", error);
    return NextResponse.json(
      { error: "Grup detayı alınamadı" },
      { status: 500 }
    );
  }
}

// PUT /api/product-groups/[id] - Grup güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = productGroupUpdateSchema.parse(body);

    const group = await prisma.productGroup.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Grup güncellenirken hata:", error);
    return NextResponse.json(
      { error: "Grup güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE /api/product-groups/[id] - Grup sil (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.productGroup.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grup bulunamadı" },
        { status: 404 }
      );
    }

    // Ürünleri olan grubu silme
    if (group._count.products > 0) {
      return NextResponse.json(
        { error: "Bu grupta ürünler var. Önce ürünleri başka gruba taşıyın." },
        { status: 400 }
      );
    }

    await prisma.productGroup.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Grup silindi" });
  } catch (error) {
    console.error("Grup silinirken hata:", error);
    return NextResponse.json(
      { error: "Grup silinemedi" },
      { status: 500 }
    );
  }
}
