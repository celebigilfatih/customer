import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validasyon hatası', details: error.issues },
      { status: 400 }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: 'Bilinmeyen bir hata oluştu' },
    { status: 500 }
  )
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function validateId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id)
}
