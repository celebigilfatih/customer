import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().optional(),
});

// POST /api/proposals/[id]/reject - Teklifi reddet
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = rejectSchema.parse(body);

    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Teklif bulunamadı" },
        { status: 404 }
      );
    }

    if (proposal.status !== "SENT" && proposal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Bu teklif reddedilemez. Durum: " + proposal.status },
        { status: 400 }
      );
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectReason: validatedData.reason,
      },
    });

    return NextResponse.json({
      message: "Teklif reddedildi",
      proposal: updatedProposal,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasyon hatası", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Teklif reddedilirken hata:", error);
    return NextResponse.json(
      { error: "Teklif reddedilemedi" },
      { status: 500 }
    );
  }
}
