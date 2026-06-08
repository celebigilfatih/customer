import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/proposals/[id]/send - Teklifi gönder
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Teklif bulunamadı" },
        { status: 404 }
      );
    }

    if (proposal.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Sadece taslak teklifler gönderilebilir" },
        { status: 400 }
      );
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Teklif gönderildi",
      proposal: updatedProposal,
    });
  } catch (error) {
    console.error("Teklif gönderilirken hata:", error);
    return NextResponse.json(
      { error: "Teklif gönderilemedi" },
      { status: 500 }
    );
  }
}
