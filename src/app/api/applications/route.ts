import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const applicationSchema = z.object({
  teamName: z.string().min(1, 'Takım adı gereklidir'),
  coachName: z.string().min(1, 'Antrenör adı gereklidir'),
  phoneNumber: z.string().min(1, 'Telefon numarası gereklidir'),
  website: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  stage: z.enum(['STAGE_1', 'STAGE_2']),
  ageGroups: z.array(z.enum(['Y2012', 'Y2013', 'Y2014', 'Y2015', 'Y2016', 'Y2017', 'Y2018', 'Y2019', 'Y2020', 'Y2021', 'Y2022'])),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = applicationSchema.parse(body)

    const application = await prisma.teamApplication.create({
      data: validatedData,
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Geçersiz veri', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Başvuru oluşturma hatası:', error)
    return NextResponse.json(
      { error: 'Başvuru oluşturulamadı' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const applications = await prisma.teamApplication.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { message: "Başvurular getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}