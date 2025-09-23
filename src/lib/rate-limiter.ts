import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (in production, use Redis or similar)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export const defaultRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
}

export const strictRateLimit: RateLimitConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10 // 10 requests per 5 minutes
}

export function rateLimit(config: RateLimitConfig = defaultRateLimit) {
  return (request: NextRequest) => {
    const ip = getClientIP(request)
    const key = `rate_limit:${ip}`
    const now = Date.now()

    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }

    // Check if within rate limit
    if (store[key].count >= config.maxRequests) {
      const resetIn = Math.ceil((store[key].resetTime - now) / 1000)
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: store[key].resetTime,
        resetIn
      }
    }

    // Increment counter
    store[key].count++

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - store[key].count,
      resetTime: store[key].resetTime,
      resetIn: Math.ceil((store[key].resetTime - now) / 1000)
    }
  }
}

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to a default IP if none found
  return '127.0.0.1'
}

export const apiRateLimit = rateLimit(defaultRateLimit)
export const authRateLimit = rateLimit(strictRateLimit)