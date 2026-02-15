import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  code: z.string().min(1, "Ürün kodu gereklidir"),
  name: z.string().min(1, "Ürün adı gereklidir"),
  description: z.string().optional(),
  groupId: z.string().optional(),
  stockQuantity: z.number().default(0),
  minStockLevel: z.number().default(0),
  costPrice: z.number().optional(),
  profitMargin: z.number().optional(),
  unitPrice: z.number().positive("Birim fiyat pozitif olmalıdır"),
  currency: z.string().default("TRY"),
});

// GET /api/products - Ürün listesi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== null) {
      where.isActive = isActive === "true";
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
    const body = await request.json();
    const validatedData = productSchema.parse(body);

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
      data: validatedData,
    });

    // Stok giriş hareketi oluştur
    if (validatedData.stockQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: validatedData.stockQuantity,
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
