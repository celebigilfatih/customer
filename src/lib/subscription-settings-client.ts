export interface SubscriptionTypeSetting {
  id: string;
  name: string;
  label: string;
  isActive: boolean;
}

// Hardcoded default subscription types for now until we can implement dynamic ones
const DEFAULT_SUBSCRIPTION_TYPES: SubscriptionTypeSetting[] = [
  { id: 'SOFTWARE_RENTAL', name: 'SOFTWARE_RENTAL', label: 'Yazılım Kiralama', isActive: true },
  { id: 'CUSTOM_PROJECT', name: 'CUSTOM_PROJECT', label: 'Özel Proje', isActive: true },
  { id: 'MAINTENANCE', name: 'MAINTENANCE', label: 'Bakım Anlaşması', isActive: true },
  { id: 'NEXT_GEN_COACHING', name: 'NEXT_GEN_COACHING', label: 'Next Gen Coaching', isActive: true },
  { id: 'AIDAT_TAKIP', name: 'AIDAT_TAKIP', label: 'Aidat Takip', isActive: true },
  { id: 'FOOTBALL_CMS', name: 'FOOTBALL_CMS', label: 'Football Cms', isActive: true },
  { id: 'DOMAIN', name: 'DOMAIN', label: 'Domain', isActive: true },
  { id: 'HOSTING', name: 'HOSTING', label: 'Hosting', isActive: true },
];

export async function getSubscriptionTypes(): Promise<SubscriptionTypeSetting[]> {
  // In the future, this will fetch from the API
  // For now, return the default types
  return DEFAULT_SUBSCRIPTION_TYPES.filter(t => t.isActive);
}