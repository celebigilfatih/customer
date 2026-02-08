import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApplicationStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const application = await prisma.teamApplication.findUnique({
      where: { id },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Başvuru bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error('Başvuru getirme hatası:', error)
    return NextResponse.json(
      { error: 'Başvuru getirilemedi' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    // Convert action to status
    let status: ApplicationStatus;
    if (action === 'approve') {
      status = ApplicationStatus.APPROVED;
    } else if (action === 'reject') {
      status = ApplicationStatus.REJECTED;
    } else {
      return NextResponse.json(
        { error: 'Geçersiz işlem' },
        { status: 400 }
      )
    }

    const application = await prisma.teamApplication.findUnique({
      where: { id },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Başvuru bulunamadı' },
        { status: 404 }
      )
    }

    const updatedApplication = await prisma.teamApplication.update({
      where: { id },
      data: { status },
    })

    // Eğer onaylandıysa, Team tablosuna ekle
    if (status === ApplicationStatus.APPROVED) {
      await prisma.team.create({
        data: {
          teamName: application.teamName,
          coachName: application.coachName,
          phoneNumber: application.phoneNumber,
          stage: application.stage,
          ageGroups: application.ageGroups,
          description: application.description,
          logoUrl: application.logoUrl,
          applicationId: application.id,
        },
      })
    }

    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error('Başvuru güncelleme hatası:', error)
    return NextResponse.json(
      { error: 'Başvuru güncellenemedi' },
      { status: 500 }
    )
  }
}