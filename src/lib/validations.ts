import { z } from 'zod'

// Customer validation schemas
export const customerCreateSchema = z.object({
  fullName: z.string()
    .min(2, "Ad soyad en az 2 karakter olmalıdır")
    .max(100, "Ad soyad 100 karakterden az olmalıdır"),
  
  phoneNumber: z.string()
    .regex(/^[0-9+\-\s()]+$/, "Geçersiz telefon numarası formatı")
    .min(10, "Telefon numarası en az 10 haneli olmalıdır")
    .max(20, "Telefon numarası 20 karakterden az olmalıdır"),
  
  city: z.string()
    .min(2, "İl en az 2 karakter olmalıdır")
    .max(50, "İl 50 karakterden az olmalıdır"),
  
  district: z.string()
    .min(2, "İlçe en az 2 karakter olmalıdır")
    .max(50, "İlçe 50 karakterden az olmalıdır"),
  
  club: z.string()
    .min(2, "Kulüp en az 2 karakter olmalıdır")
    .max(100, "Kulüp 100 karakterden az olmalıdır"),
  
  sportsSchoolOfficial: z.string()
    .min(2, "Spor okulu yetkilisi en az 2 karakter olmalıdır")
    .max(100, "Spor okulu yetkilisi 100 karakterden az olmalıdır"),
  
  duration: z.string()
    .min(1, "Süre seçimi gereklidir")
    .regex(/^[1-5]$/, "Süre 1-5 yıl arasında olmalıdır"),
  
  startDate: z.string()
    .min(1, "Başlangıç tarihi gereklidir")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih formatı girin"),
  
  endDate: z.string()
    .min(1, "Bitiş tarihi gereklidir")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih formatı girin"),
  
  offer: z.string()
    .min(1, "Teklif gereklidir")
    .max(500, "Teklif 500 karakterden az olmalıdır"),
  
  hosting: z.string()
    .min(1, "Hosting bilgisi gereklidir")
    .max(200, "Hosting bilgisi 200 karakterden az olmalıdır"),
  
  address: z.string()
    .min(10, "Adres en az 10 karakter olmalıdır")
    .max(500, "Adres 500 karakterden az olmalıdır"),
  
  status: z.enum(['POTENTIAL', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'REJECTED', 'SOLD'])
    .default('POTENTIAL'),
  
  price: z.string()
    .min(1, "Fiyat gereklidir")
    .regex(/^[0-9]+$/, "Fiyat sadece sayı olmalıdır")
    .max(10, "Fiyat çok büyük olamaz")
})

export const customerUpdateSchema = customerCreateSchema.partial()

// Note validation schemas
export const noteCreateSchema = z.object({
  customerId: z.string()
    .min(1, "Müşteri ID gereklidir"),
  content: z.string()
    .min(1, "Not içeriği gereklidir")
    .max(2000, "Not 2000 karakterden az olmalıdır")
    .regex(/^[\s\S]*$/, "Not geçersiz karakter içeriyor")
})

export const noteUpdateSchema = noteCreateSchema.partial()

// Search and filter validation
export const customerFiltersSchema = z.object({
  search: z.string().max(100).optional(),
  city: z.string().max(50).optional(),
  district: z.string().max(50).optional(),
  club: z.string().max(100).optional(),
  status: z.enum(['POTENTIAL', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'REJECTED', 'SOLD']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10)
})

export type CustomerCreate = z.infer<typeof customerCreateSchema>
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>
export type NoteCreate = z.infer<typeof noteCreateSchema>
export type NoteUpdate = z.infer<typeof noteUpdateSchema>
export type CustomerFilters = z.infer<typeof customerFiltersSchema>