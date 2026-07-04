import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, ProductType } from "@/generated/prisma";
import { requireAdminApi } from "@/lib/api-auth";
import { z } from "zod";

const productSchema = z.object({
  code: z.string().min(1, "Ürün kodu gereklidir"),
  name: z.string().min(1, "Ürün adı gereklidir"),
  type: z.enum(["PRODUCT", "SERVICE"]).default("PRODUCT"),
  description: z.string().optional(),
  groupId: z.string().nullable().optional(),
  stockQuantity: z.coerce.number().default(0),
  minStockLevel: z.coerce.number().default(0),
  costPrice: z.coerce.number().optional(),
  profitMargin: z.coerce.number().optional(),
  unitPrice: z.coerce.number().positive("Birim fiyat pozitif olmalıdır"),
  currency: z.string().default("TRY"),
});

function normalizeGroupId(groupId: string | null | undefined) {
  return groupId && groupId !== "ungrouped" ? groupId : null;
}

// GET /api/products - Ürün listesi
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");
    const type = searchParams.get("type");

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
    }
    if (type && Object.values(ProductType).includes(type as ProductType)) {
      where.type = type as ProductType;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        group: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Ürün listesi alınırken hata:", error);
    return NextResponse.json(
      { error: "Ürün listesi alınamadı" },
      { status: 500 }
    );
  }
}

// POST /api/products - Yeni ürün oluştur
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const validatedData = productSchema.parse(body);
    const type = validatedData.type as ProductType;
    const stockQuantity = type === ProductType.SERVICE ? 0 : validatedData.stockQuantity;
    const minStockLevel = type === ProductType.SERVICE ? 0 : validatedData.minStockLevel;

    // Kodun benzersiz olduğunu kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { code: validatedData.code },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Bu ürün kodu zaten kullanılıyor" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        type,
        groupId: normalizeGroupId(validatedData.groupId),
        stockQuantity,
        minStockLevel,
      },
    });

    // Stok giriş hareketi oluştur
    if (type === ProductType.PRODUCT && stockQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: stockQuantity,
          description: "Açılış stoğu",
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Ürün oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Ürün oluşturulamadı" },
      { status: 500 }
    );
  }
}
