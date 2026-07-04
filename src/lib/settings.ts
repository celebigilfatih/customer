import { prisma } from './prisma'

export const PROPOSAL_TYPES_KEY = 'proposal_types'

export type ProposalTypeSetting = {
  id: string
  name: string
  label: string
  isActive: boolean
}

export async function getAllProposalTypes(): Promise<ProposalTypeSetting[]> {
  try {
    console.log('Getting ALL proposal types from database (including inactive)...')
    const setting = await prisma.setting.findUnique({
      where: { key: PROPOSAL_TYPES_KEY },
    })

    console.log('Database response:', setting)

    if (!setting) {
      return []
    }

    const parsed = JSON.parse(setting.value) as ProposalTypeSetting[]
    console.log('All types (including inactive):', parsed)
    return parsed
  } catch (error) {
    console.error('Error getting all proposal types:', error)
    return []
  }
}

export async function getProposalTypes(): Promise<ProposalTypeSetting[]> {
  try {
    console.log('Getting proposal types from database...')
    const setting = await prisma.setting.findUnique({
      where: { key: PROPOSAL_TYPES_KEY },
    })

    console.log('Database response:', setting)

    if (!setting) {
      // Return default types if not found
      const defaultTypes = [
        { id: 'SUBSCRIPTION', name: 'SUBSCRIPTION', label: 'Abonelik', isActive: true },
        { id: 'PROJECT', name: 'PROJECT', label: 'Proje', isActive: true },
        { id: 'MAINTENANCE', name: 'MAINTENANCE', label: 'Bakım Anlaşması', isActive: true },
        { id: 'RENEWAL', name: 'RENEWAL', label: 'Yenileme', isActive: true },
      ]
      console.log('Returning default types:', defaultTypes)
      return defaultTypes
    }

    const parsed = JSON.parse(setting.value) as ProposalTypeSetting[]
    console.log('Parsed types:', parsed)
    return parsed
  } catch (error) {
    console.error('Error getting proposal types:', error)
    return []
  }
}

export async function saveProposalTypes(types: ProposalTypeSetting[]): Promise<boolean> {
  try {
    const existing = await prisma.setting.findUnique({
      where: { key: PROPOSAL_TYPES_KEY },
    })

    if (existing) {
      await prisma.setting.update({
        where: { key: PROPOSAL_TYPES_KEY },
        data: { value: JSON.stringify(types) },
      })
    } else {
      await prisma.setting.create({
        data: {
          key: PROPOSAL_TYPES_KEY,
          value: JSON.stringify(types),
          type: 'json',
        },
      })
    }

    return true
  } catch (error) {
    console.error('Error saving proposal types:', error)
    return false
  }
}

export async function addProposalType(type: Omit<ProposalTypeSetting, 'id'>): Promise<ProposalTypeSetting | null> {
  try {
    console.log('Adding proposal type:', type)
    const types = await getProposalTypes()
    console.log('Current types:', types)
    const newType = {
      ...type,
      id: type.name, // Use name as ID
    }
    
    // Check if type already exists (case-insensitive)
    const existingType = types.find(t => t.name.toLowerCase() === type.name.toLowerCase())
    if (existingType) {
      console.log('Type already exists:', existingType)
      return null
    }

    types.push(newType)
    console.log('Saving updated types:', types)
    const result = await saveProposalTypes(types)
    console.log('Save result:', result)
    return result ? newType : null
  } catch (error) {
    console.error('Error adding proposal type:', error)
    return null
  }
}

export async function updateProposalType(id: string, updates: Partial<Omit<ProposalTypeSetting, 'id'>>): Promise<ProposalTypeSetting | null> {
  try {
    const types = await getProposalTypes()
    const index = types.findIndex(t => t.id === id)
    
    if (index === -1) return null

    types[index] = { ...types[index], ...updates }
    await saveProposalTypes(types)
    return types[index]
  } catch (error) {
    console.error('Error updating proposal type:', error)
    return null
  }
}

export async function deleteProposalType(id: string): Promise<boolean> {
  try {
    const types = await getProposalTypes()
    const filtered = types.filter(t => t.id !== id)
    
    if (filtered.length === types.length) return false // Not found
    
    await saveProposalTypes(filtered)
    return true
  } catch (error) {
    console.error('Error deleting proposal type:', error)
    return false
  }
}
