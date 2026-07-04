import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductType } from "@/generated/prisma";
import { requireAdminApi } from "@/lib/api-auth";
import { z } from "zod";

const productUpdateSchema = z.object({
  code: z.string().min(1, "Ürün kodu gereklidir").optional(),
  name: z.string().min(1, "Ürün adı gereklidir").optional(),
  type: z.enum(["PRODUCT", "SERVICE"]).optional(),
  description: z.string().optional(),
  groupId: z.string().nullable().optional(),
  minStockLevel: z.coerce.number().optional(),
  costPrice: z.coerce.number().nullable().optional(),
  profitMargin: z.coerce.number().nullable().optional(),
  unitPrice: z.coerce.number().positive("Birim fiyat pozitif olmalıdır").optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
});

function normalizeGroupId(groupId: string | null | undefined) {
  return groupId && groupId !== "ungrouped" ? groupId : null;
}

// GET /api/products/[id] - Ürün detayı
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    const body = await request.json();
    const validatedData = productUpdateSchema.parse(body);

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            movements: true,
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

    if (validatedData.code && validatedData.code !== existingProduct.code) {
      const duplicate = await prisma.product.findUnique({
        where: { code: validatedData.code },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Bu ürün kodu zaten kullanılıyor" },
          { status: 400 }
        );
      }
    }

    const nextType = validatedData.type as ProductType | undefined;
    if (nextType && nextType !== existingProduct.type) {
      const hasHistory =
        existingProduct._count.movements > 0 ||
        existingProduct._count.proposalItems > 0 ||
        existingProduct._count.invoiceItems > 0;

      if (hasHistory || existingProduct.stockQuantity.greaterThan(0)) {
        return NextResponse.json(
          {
            error:
              "Kullanılmış veya stoklu katalog kaydının tipi değiştirilemez. Yeni ürün/hizmet kaydı oluşturun.",
          },
          { status: 400 }
        );
      }
    }

    const data = {
      ...validatedData,
      groupId:
        validatedData.groupId === undefined
          ? undefined
          : normalizeGroupId(validatedData.groupId),
      minStockLevel:
        nextType === ProductType.SERVICE ? 0 : validatedData.minStockLevel,
    };

    const product = await prisma.product.update({
      where: { id },
      data,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
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
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "Ürün pasif duruma getirildi",
        product,
      });
    }

    // Kullanılmayan ürünü tamamen sil
    await prisma.product.delete({
      where: { id },
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
