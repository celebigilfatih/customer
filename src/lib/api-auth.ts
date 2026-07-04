import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export type ApiUser = {
  id: string
  role: string
  isActive: boolean
  customerId: string | null
}

export function isAdminApiUser(user: Pick<ApiUser, 'role'>) {
  return user.role === 'ADMIN' || user.role === 'SUPPORT'
}

export async function requireAuthenticatedApi(
  request: NextRequest
): Promise<{ user: ApiUser; response?: never } | { user?: never; response: NextResponse }> {
  const userId = request.cookies.get('auth-token')?.value

  if (!userId) {
    return {
      response: NextResponse.json({ error: 'Oturum gerekli' }, { status: 401 }),
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      isActive: true,
      customerId: true,
    },
  })

  if (!user || !user.isActive) {
    return {
      response: NextResponse.json({ error: 'Geçersiz veya pasif oturum' }, { status: 401 }),
    }
  }

  return { user }
}

export async function requireAdminApi(
  request: NextRequest
): Promise<{ user: ApiUser; response?: never } | { user?: never; response: NextResponse }> {
  const auth = await requireAuthenticatedApi(request)
  if (auth.response) return auth

  if (!isAdminApiUser(auth.user)) {
    return {
      response: NextResponse.json({ error: 'Bu işlem için yetki yok' }, { status: 403 }),
    }
  }

  return auth
}
