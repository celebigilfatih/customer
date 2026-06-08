import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, fullName: true, club: true, phoneNumber: true, city: true, district: true, address: true },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Teklif bulunamadı' }, { status: 404 })
    }

    const typeLabels: Record<string, string> = {
      SUBSCRIPTION: 'Abonelik',
      PROJECT: 'Proje',
      MAINTENANCE: 'Bakım Anlaşması',
      RENEWAL: 'Yenileme',
    }

    const statusLabels: Record<string, string> = {
      DRAFT: 'Taslak',
      PENDING: 'Beklemede',
      APPROVED: 'Onaylandı',
      REJECTED: 'Reddedildi',
      EXPIRED: 'Süresi Doldu',
    }

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Teklif - ${proposal.title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .title { font-size: 20px; color: #666; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 10px; }
    .row { display: flex; margin-bottom: 8px; }
    .label { font-weight: bold; width: 150px; }
    .value { flex: 1; }
    .amount { font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 20px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-draft { background: #e5e7eb; color: #374151; }
    .status-expired { background: #f3f4f6; color: #6b7280; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">TEKLİF</div>
    <div class="title">${proposal.title}</div>
  </div>

  <div class="section">
    <div class="section-title">Müşteri Bilgileri</div>
    <div class="row">
      <span class="label">Ad Soyad:</span>
      <span class="value">${proposal.customer.fullName}</span>
    </div>
    ${proposal.customer.club ? `<div class="row"><span class="label">Kulüp/Firma:</span><span class="value">${proposal.customer.club}</span></div>` : ''}
    ${proposal.customer.phoneNumber ? `<div class="row"><span class="label">Telefon:</span><span class="value">${proposal.customer.phoneNumber}</span></div>` : ''}
    ${proposal.customer.city ? `<div class="row"><span class="label">İl/İlçe:</span><span class="value">${proposal.customer.city} / ${proposal.customer.district}</span></div>` : ''}
    ${proposal.customer.address ? `<div class="row"><span class="label">Adres:</span><span class="value">${proposal.customer.address}</span></div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Teklif Detayları</div>
    <div class="row">
      <span class="label">Teklif Türü:</span>
      <span class="value">${typeLabels[proposal.type] || proposal.type}</span>
    </div>
    <div class="row">
      <span class="label">Geçerlilik:</span>
      <span class="value">${new Date(proposal.validUntil).toLocaleDateString('tr-TR')}</span>
    </div>
    <div class="row">
      <span class="label">Durum:</span>
      <span class="value"><span class="status status-${proposal.status.toLowerCase()}">${statusLabels[proposal.status]}</span></span>
    </div>
    ${proposal.description ? `<div class="row" style="margin-top: 15px;"><span class="label">Açıklama:</span></div><div style="background: #f9fafb; padding: 15px; border-radius: 4px; margin-top: 5px;">${proposal.description}</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">Teklif Tutarı</div>
    <div class="amount">${parseInt(proposal.amount).toLocaleString('tr-TR', { style: 'currency', currency: proposal.currency })}</div>
  </div>

  ${proposal.notes ? `<div class="section"><div class="section-title">Notlar</div><div style="background: #f9fafb; padding: 15px; border-radius: 4px;">${proposal.notes}</div></div>` : ''}

  <div class="footer">
    <div>Teklif Tarihi: ${new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</div>
    <div>Teklif No: ${proposal.id.slice(-8).toUpperCase()}</div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="teklif-${proposal.id.slice(-8)}.html"`,
      },
    })
  } catch (error) {
    console.error('GET /api/proposals/[id]/pdf error:', error)
    return NextResponse.json({ error: 'PDF oluşturulamadı' }, { status: 500 })
  }
}
