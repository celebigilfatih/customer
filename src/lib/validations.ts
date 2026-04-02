import { z } from 'zod'

// Customer validation schemas
export const customerCreateSchema = z.object({
  fullName: z.string()
    .min(2, "Ad soyad en az 2 karakter olmalıdır")
    .max(100, "Ad soyad 100 karakterden az olmalıdır"),
  firmaAdi: z.string()
    .min(2, "Firma adı en az 2 karakter olmalıdır")
    .max(100, "Firma adı 100 karakterden az olmalıdır")
    .optional(),
  
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
    .min(2, "Firma en az 2 karakter olmalıdır")
    .max(100, "Firma 100 karakterden az olmalıdır"),
  
  sportsSchoolOfficial: z.string()
    .min(2, "Yetkili en az 2 karakter olmalıdır")
    .max(100, "Yetkili 100 karakterden az olmalıdır"),
  
  
  
  
  
  
  address: z.string()
    .min(10, "Adres en az 10 karakter olmalıdır")
    .max(500, "Adres 500 karakterden az olmalıdır"),
  
  
  
  price: z.string()
    .regex(/^[0-9]+$/, "Fiyat sadece sayı olmalıdır")
    .max(10, "Fiyat çok büyük olamaz")
    .optional()
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

// User validation schemas
export const userCreateSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır').max(50, 'Kullanıcı adı en fazla 50 karakter olmalıdır'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır').max(100, 'Ad soyad en fazla 100 karakter olmalıdır').optional(),
  email: z.string().email('Geçerli bir e-posta adresi girin').optional(),
  isActive: z.boolean().optional().default(true),
})

export const userUpdateSchema = userCreateSchema.partial()

export const loginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı boş bırakılamaz'),
  password: z.string().min(1, 'Şifre boş bırakılamaz'),
})

export type CustomerCreate = z.infer<typeof customerCreateSchema>
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>
export type NoteCreate = z.infer<typeof noteCreateSchema>
export type NoteUpdate = z.infer<typeof noteUpdateSchema>
export type CustomerFilters = z.infer<typeof customerFiltersSchema>
export type UserCreate = z.infer<typeof userCreateSchema>
export type UserUpdate = z.infer<typeof userUpdateSchema>
export type Login = z.infer<typeof loginSchema>

const subscriptionBaseSchema = z.object({
  customerId: z.string().min(1, 'Müşteri seçilmelidir'),
  name: z.string().min(2, 'Ad en az 2 karakter').max(200, 'Ad 200 karakteri aşamaz').optional(),
  types: z.array(z.string()).min(1, 'Tür seçilmelidir'),
  period: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Başlangıç tarihi geçerli olmalıdır'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Bitiş tarihi geçerli olmalıdır'),
  autoRenew: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELED']).default('ACTIVE'),
  price: z.string()
    .regex(/^[0-9]+$/, 'Tutar TL ve sadece sayı olmalıdır')
    .refine((v) => parseInt(v, 10) > 0, 'Tutar 0\'dan büyük olmalıdır')
    .max(9, 'Tutar çok yüksek'),
  installmentCount: z.coerce.number().int().min(1).optional(),
  proposalType: z.string().optional(),
})

export const subscriptionCreateSchema = subscriptionBaseSchema.refine((data) => {
  // If proposalType is provided, it should not be empty
  if (data.proposalType !== undefined && data.proposalType.trim() === '') {
    return false;
  }
  return true;
}, {
  message: 'Teklif türü boş olamaz',
  path: ['proposalType'],
});

export const subscriptionUpdateSchema = subscriptionBaseSchema.partial().refine((data) => {
  // If proposalType is provided, it should not be empty
  if (data.proposalType !== undefined && data.proposalType.trim() === '') {
    return false;
  }
  return true;
}, {
  message: 'Teklif türü boş olamaz',
  path: ['proposalType'],
})

export const domainCreateSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(3).max(253),
  registerDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  renewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  whoisNote: z.string().max(1000).optional(),
  autoRenew: z.boolean().default(false),
})
export const domainUpdateSchema = domainCreateSchema.partial()

export const hostingCreateSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1).max(200),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(1000).optional(),
})
export const hostingUpdateSchema = hostingCreateSchema.partial()

export const taskCreateSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(4000),
  status: z.enum(['OPEN', 'PENDING', 'DONE']).default('OPEN'),
  assigneeId: z.string().optional(),
})
export const taskUpdateSchema = taskCreateSchema.partial()

export const paymentCreateSchema = z.object({
  customerId: z.string().min(1),
  subscriptionId: z.string().optional(),
  amount: z.string().regex(/^[0-9]+$/),
  currency: z.string().min(1).max(10),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['DUE', 'LATE', 'PAID']).default('DUE'),
  note: z.string().max(1000).optional(),
})
export const paymentUpdateSchema = paymentCreateSchema.partial()

export type SubscriptionCreate = z.infer<typeof subscriptionCreateSchema>
export type SubscriptionUpdate = z.infer<typeof subscriptionUpdateSchema>
export type DomainCreate = z.infer<typeof domainCreateSchema>
export type DomainUpdate = z.infer<typeof domainUpdateSchema>
export type HostingCreate = z.infer<typeof hostingCreateSchema>
export type HostingUpdate = z.infer<typeof hostingUpdateSchema>
export type TaskCreate = z.infer<typeof taskCreateSchema>
export type TaskUpdate = z.infer<typeof taskUpdateSchema>
export type PaymentCreate = z.infer<typeof paymentCreateSchema>
export type PaymentUpdate = z.infer<typeof paymentUpdateSchema>

export const proposalItemSchema = z.object({
  productId: z.string().min(1, 'Ürün seçilmelidir'),
  description: z.string().min(1, 'Açıklama gereklidir'),
  quantity: z.string().regex(/^[0-9]+$/, 'Miktar sayı olmalıdır'),
  unitPrice: z.string().regex(/^[0-9]+$/, 'Birim fiyat sayı olmalıdır'),
  totalPrice: z.string().regex(/^[0-9]+$/, 'Toplam fiyat sayı olmalıdır'),
})

export type ProposalItem = z.infer<typeof proposalItemSchema>

const proposalBaseSchema = z.object({
  customerId: z.string().min(1, 'Müşteri seçilmelidir'),
  title: z.string().min(2, 'Başlık en az 2 karakter').max(200, 'Başlık 200 karakteri aşamaz'),
  type: z.string().min(1, 'Teklif türü seçilmelidir'),
  description: z.string().max(5000, 'Açıklama 5000 karakteri aşamaz').optional(),
  amount: z.string()
    .regex(/^[0-9]+$/, 'Tutar TL ve sadece sayı olmalıdır')
    .max(9, 'Tutar çok yüksek'),
  currency: z.string().min(1).max(10).default('TRY'),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli tarih formatı YYYY-MM-DD olmalıdır'),
  notes: z.string().max(2000, 'Notlar 2000 karakteri aşamaz').optional(),
  items: z.array(proposalItemSchema).optional(),
})

export const proposalCreateSchema = proposalBaseSchema.refine((data) => {
  const amount = parseInt(data.amount, 10);
  return amount > 0;
}, {
  message: 'Tutar 0\'dan büyük olmalıdır',
  path: ['amount'],
})

export const proposalUpdateSchema = proposalBaseSchema.partial().extend({
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
}).refine((data) => {
  if (data.amount !== undefined) {
    const amount = parseInt(data.amount, 10);
    return amount > 0;
  }
  return true;
}, {
  message: 'Tutar 0\'dan büyük olmalıdır',
  path: ['amount'],
})

export const proposalApprovalSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']),
  notes: z.string().max(2000, 'Notlar 2000 karakteri aşamaz').optional(),
})

export type ProposalCreate = z.infer<typeof proposalCreateSchema>
export type ProposalUpdate = z.infer<typeof proposalUpdateSchema>
export type ProposalApproval = z.infer<typeof proposalApprovalSchema>
