export type ProposalTypeSetting = {
  id: string
  name: string
  label: string
  isActive: boolean
}

const PROPOSAL_TYPES_KEY = 'proposal_types'

export async function getProposalTypes(): Promise<ProposalTypeSetting[]> {
  try {
    const res = await fetch(`/api/settings?key=${PROPOSAL_TYPES_KEY}`)
    if (!res.ok) throw new Error('Failed to fetch')
    
    const settings = await res.json()
    if (!settings || settings.length === 0) {
      // Return default types if not found
      return [
        { id: 'SUBSCRIPTION', name: 'SUBSCRIPTION', label: 'Abonelik', isActive: true },
        { id: 'PROJECT', name: 'PROJECT', label: 'Proje', isActive: true },
        { id: 'MAINTENANCE', name: 'MAINTENANCE', label: 'Bakım Anlaşması', isActive: true },
        { id: 'RENEWAL', name: 'RENEWAL', label: 'Yenileme', isActive: true },
      ]
    }
    
    const setting = settings[0]
    return JSON.parse(setting.value) as ProposalTypeSetting[]
  } catch (error) {
    console.error('Error getting proposal types:', error)
    return []
  }
}

export async function getAllProposalTypes(): Promise<ProposalTypeSetting[]> {
  // Same as getProposalTypes for now - returns all
  return getProposalTypes()
}

export async function saveProposalTypes(types: ProposalTypeSetting[]): Promise<boolean> {
  try {
    // First check if setting exists
    const res = await fetch(`/api/settings?key=${PROPOSAL_TYPES_KEY}`)
    const settings = await res.json()
    
    if (settings && settings.length > 0) {
      // Update existing
      const settingId = settings[0].id
      const updateRes = await fetch(`/api/settings/${settingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: JSON.stringify(types) }),
      })
      return updateRes.ok
    } else {
      // Create new
      const createRes = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: PROPOSAL_TYPES_KEY,
          value: JSON.stringify(types),
          type: 'json',
        }),
      })
      return createRes.ok
    }
  } catch (error) {
    console.error('Error saving proposal types:', error)
    return false
  }
}

export async function addProposalType(type: Omit<ProposalTypeSetting, 'id'>): Promise<ProposalTypeSetting | null> {
  try {
    const types = await getProposalTypes()
    const newType = {
      ...type,
      id: type.name,
    }
    
    // Check if type already exists (case-insensitive)
    const existingType = types.find(t => t.name.toLowerCase() === type.name.toLowerCase())
    if (existingType) {
      return null
    }

    types.push(newType)
    const result = await saveProposalTypes(types)
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
    
    if (filtered.length === types.length) return false
    
    await saveProposalTypes(filtered)
    return true
  } catch (error) {
    console.error('Error deleting proposal type:', error)
    return false
  }
}
