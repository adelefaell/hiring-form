export const WORKSHOP_IDS = [
  'web-development',
  'mobile-apps',
  'data-analysis',
  'ui-ux-design',
  'digital-marketing',
  'cybersecurity',
  'cloud-computing',
  'project-management',
  'public-speaking',
  'ai-fundamentals',
] as const

export type WorkshopId = (typeof WORKSHOP_IDS)[number]