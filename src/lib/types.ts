import { Customer, Note } from '@/generated/prisma'

export type CustomerWithNotes = Customer & {
  notes: Note[]
}

export type CustomerListItem = Pick<Customer, 
  'id' | 'fullName' | 'phoneNumber' | 'club' | 'city' | 'district'
>

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CustomerFilters {
  search?: string
  city?: string
  club?: string
  startDate?: string
  endDate?: string
}
