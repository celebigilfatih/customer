import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

const stockAdjustmentSchema = z.object({
  quantity: z.number(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  description: z.string().optional(),
});

// POST /api/products/[id]/stock - Stok düzeltme
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = stockAdjustmentSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    // Negatif stok kontrolü
    let newQuantity = product.stockQuantity;
    if (validatedData.type === "IN") {
      newQuantity = product.stockQuantity.plus(validatedData.quantity);
    } else if (validatedData.type === "OUT") {
      newQuantity = product.stockQuantity.minus(validatedData.quantity);
      if (newQuantity.lessThan(0)) {
        return NextResponse.json(
          { error: "Yetersiz stok", currentStock: product.stockQuantity.toString() },
          { status: 400 }
        );
      }
    } else if (validatedData.type === "ADJUSTMENT") {
      newQuantity = new Decimal(validatedData.quantity);
    }

    // Transaction ile stok güncelleme ve hareket kaydı
    const result = await prisma.$transaction(async (tx) => {
      // Stok hareketi oluştur
      const movement = await tx.stockMovement.create({
        data: {
          productId: params.id,
          type: validatedData.type,
          quantity:
            validatedData.type === "OUT"
              ? -validatedData.quantity
              : validatedData.quantity,
          description: validatedData.description,
        },
      });

      // Ürün stoğunu güncelle
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: { stockQuantity: newQuantity },
      });

      return { movement, product: updatedProduct };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Stok düzeltme hatası:", error);
    return NextResponse.json(
      { error: "Stok düzeltme başarısız" },
      { status: 500 }
    );
  }
}

// GET /api/products/[id]/stock - Stok hareketleri
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Ürün bulunamadı" },
        { status: 404 }
      );
    }

    const movements = await prisma.stockMovement.findMany({
      where: { productId: params.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        proposal: {
          select: {
            number: true,
            customer: {
              select: {
                fullName: true,
              },
            },
          },
        },
        invoice: {
          select: {
            number: true,
            customer: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.stockMovement.count({
      where: { productId: params.id },
    });

    return NextResponse.json({
      movements,
      product,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Stok hareketleri alınırken hata:", error);
    return NextResponse.json(
      { error: "Stok hareketleri alınamadı" },
      { status: 500 }
    );
  }
}
