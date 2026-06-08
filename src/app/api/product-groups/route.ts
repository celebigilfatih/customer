import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productGroupSchema = z.object({
  name: z.string().min(1, "Grup adı gereklidir"),
  description: z.string().optional(),
  color: z.string().default("#3b82f6"),
  sortOrder: z.number().default(0),
});

// GET /api/product-groups - Grup listesi
export async function GET(request: NextRequest) {
  try {
    const groups = await prisma.productGroup.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Grup listesi alınırken hata:", error);
    return NextResponse.json(
      { error: "Grup listesi alınamadı" },
      { status: 500 }
    );
  }
}

// POST /api/product-groups - Yeni grup oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = productGroupSchema.parse(body);

    const group = await prisma.productGroup.create({
      data: validatedData,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Grup oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Grup oluşturulamadı" },
      { status: 500 }
    );
  }
}
