import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/api-auth";
import { z } from "zod";

const approveSchema = z.object({
  approvedBy: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
});

// POST /api/proposals/[id]/approve - Teklifi onayla
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminApi(request);
    if (auth.response) return auth.response;
    const { id } = await params;

    const body = await request.json();
    const validatedData = approveSchema.parse(body);

    // Teklifi kontrol et
    const proposal = await prisma.proposal.findUnique({
      where: { id },
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

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: validatedData.approvedBy || auth.user.id,
        approvedAt: new Date(),
        notes: validatedData.notes ?? proposal.notes,
      },
    });

    return NextResponse.json({
      message: "Teklif onaylandı",
      proposal: updatedProposal,
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
