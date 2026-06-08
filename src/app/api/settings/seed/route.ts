import { NextRequest, NextResponse } from 'next/server'
import { saveProposalTypes } from '@/lib/settings'

export async function POST() {
  try {
    const defaultTypes = [
      { id: 'SUBSCRIPTION', name: 'SUBSCRIPTION', label: 'Abonelik', isActive: true },
      { id: 'PROJECT', name: 'PROJECT', label: 'Proje', isActive: true },
      { id: 'MAINTENANCE', name: 'MAINTENANCE', label: 'Bakım Anlaşması', isActive: true },
      { id: 'RENEWAL', name: 'RENEWAL', label: 'Yenileme', isActive: true },
    ]

    await saveProposalTypes(defaultTypes)
    
    return NextResponse.json({ success: true, message: 'Proposal types seeded' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 })
  }
}
