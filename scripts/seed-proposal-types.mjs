import { saveProposalTypes } from '../src/lib/settings.js'

const defaultTypes = [
  { id: 'SUBSCRIPTION', name: 'SUBSCRIPTION', label: 'Abonelik', isActive: true },
  { id: 'PROJECT', name: 'PROJECT', label: 'Proje', isActive: true },
  { id: 'MAINTENANCE', name: 'MAINTENANCE', label: 'Bakım Anlaşması', isActive: true },
  { id: 'RENEWAL', name: 'RENEWAL', label: 'Yenileme', isActive: true },
]

await saveProposalTypes(defaultTypes)
console.log('✅ Proposal types seeded successfully')
