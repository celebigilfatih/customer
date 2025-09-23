import { ZodError } from 'zod'
import { Prisma } from '@/generated/prisma'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown): { message: string; status: number } {
  console.error('API Error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      message: 'Validation failed',
      status: 400
    }
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          message: 'A record with this data already exists',
          status: 409
        }
      case 'P2025':
        return {
          message: 'Record not found',
          status: 404
        }
      case 'P2003':
        return {
          message: 'Foreign key constraint failed',
          status: 400
        }
      default:
        return {
          message: 'Database operation failed',
          status: 500
        }
    }
  }

  // Custom app errors
  if (error instanceof AppError) {
    return {
      message: error.message,
      status: error.statusCode
    }
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 500
    }
  }

  // Unknown errors
  return {
    message: 'An unexpected error occurred',
    status: 500
  }
}

export function validateRequiredFields(data: Record<string, unknown>, fields: string[]): void {
  const missingFields = fields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    throw new AppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400,
      'MISSING_FIELDS'
    )
  }
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

export function validateId(id: string): void {
  if (!id || typeof id !== 'string' || id.length < 1) {
    throw new AppError('Invalid ID provided', 400, 'INVALID_ID')
  }
}