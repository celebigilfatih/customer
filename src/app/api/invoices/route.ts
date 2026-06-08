import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Açıklama gereklidir"),
  quantity: z.number().positive("Miktar pozitif olmalıdır"),
  unitPrice: z.number().positive("Birim fiyat pozitif olmalıdır"),
  totalPrice: z.number().positive("Toplam fiyat pozitif olmalıdır"),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Müşteri gereklidir"),
  proposalId: z.string().optional(),
  type: z.enum(["SALE", "RETURN"]),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  taxRate: z.number().default(20),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "En az bir ürün gerekli"),
});

// GET /api/invoices - Fatura listesi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        proposal: {
          select: {
            id: true,
            number: true,
          },
        },
        _count: {
          select: {
            payments: true,
            items: true,
          },
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Fatura listesi alınırken hata:", error);
    return NextResponse.json(
      { error: "Fatura listesi alınamadı" },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Yeni fatura oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // Fatura numarası oluştur (F-2024-000001 formatında)
    const year = new Date().getFullYear();
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        number: {
          startsWith: `F-${year}`,
        },
      },
      orderBy: { number: "desc" },
    });

    let sequence = 1;
    if (lastInvoice) {
      const parts = lastInvoice.number.split("-");
      sequence = parseInt(parts[2]) + 1;
    }
    const invoiceNumber = `F-${year}-${sequence.toString().padStart(6, "0")}`;

    // Toplam tutarları hesapla
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    const taxAmount = subtotal * (validatedData.taxRate / 100);
    const total = subtotal + taxAmount;

    // Transaction ile fatura oluştur
    const result = await prisma.$transaction(async (tx) => {
      // 1. Faturayı oluştur
      const invoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          customerId: validatedData.customerId,
          proposalId: validatedData.proposalId,
          type: validatedData.type,
          status: "DRAFT",
          subtotal,
          taxRate: validatedData.taxRate,
          taxAmount,
          total,
          issueDate: new Date(validatedData.issueDate),
          dueDate: new Date(validatedData.dueDate),
          notes: validatedData.notes,
          items: {
            create: validatedData.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // 2. Tekliften oluşturulduysa teklifi güncelle
      if (validatedData.proposalId) {
        await tx.proposal.update({
          where: { id: validatedData.proposalId },
          data: { status: "CONVERTED" },
        });
      }

      return invoice;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Fatura oluşturulurken hata:", error);
    return NextResponse.json(
      { error: "Fatura oluşturulamadı" },
      { status: 500 }
    );
  }
}
