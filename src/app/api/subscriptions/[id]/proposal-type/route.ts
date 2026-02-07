import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handler'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { proposalType } = body

    // Validate input
    if (typeof proposalType !== 'string' && proposalType !== null && proposalType !== undefined) {
      return NextResponse.json(
        { error: 'proposalType must be a string, null, or undefined' },
        { status: 400 }
      )
    }

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id }
    })

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Update the proposal type using raw SQL since Prisma client hasn't been regenerated yet
    const updatedSubscription = await prisma.$executeRaw`
      UPDATE subscriptions 
      SET proposal_type = ${proposalType || null}, updated_at = NOW()
      WHERE id = ${id}
    `

    // Fetch the updated subscription
    const result = await prisma.subscription.findUnique({
      where: { id }
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: handleApiError(error).status })
  }
}