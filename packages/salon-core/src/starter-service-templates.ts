export type StarterServiceTemplate = {
  name: string
  duration: number
  price: number
  color: string
  kind?: 'standard' | 'combo'
}

export type StarterServiceFamilyTemplate = {
  name: string
  services: readonly StarterServiceTemplate[]
}

export type StarterServiceCategoryTemplate = {
  category: string
  families: readonly StarterServiceFamilyTemplate[]
}

export const PERSIAN_STARTER_SERVICE_TEMPLATES: readonly StarterServiceCategoryTemplate[] = [
  {
    category: 'ناخن',
    families: [
      {
        name: 'کاشت ناخن',
        services: [
          { name: 'کاشت با پودر', duration: 90, price: 800000, color: 'rose' },
          { name: 'کاشت با لاک ژل', duration: 90, price: 850000, color: 'violet' },
          { name: 'کاشت دست و پا', duration: 150, price: 1300000, color: 'gold', kind: 'combo' },
        ],
      },
      {
        name: 'ترمیم ناخن',
        services: [{ name: 'ترمیم ساده', duration: 75, price: 550000, color: 'mint' }],
      },
    ],
  },
  {
    category: 'مو',
    families: [
      {
        name: 'کوتاهی و براشینگ',
        services: [
          { name: 'کوتاهی مو', duration: 45, price: 350000, color: 'coral' },
          { name: 'براشینگ مو', duration: 45, price: 400000, color: 'gold' },
        ],
      },
      {
        name: 'رنگ مو',
        services: [
          { name: 'رنگ ریشه', duration: 90, price: 900000, color: 'violet' },
          { name: 'رنگ کامل مو', duration: 150, price: 1800000, color: 'rose' },
        ],
      },
    ],
  },
  {
    category: 'پوست',
    families: [
      {
        name: 'پاکسازی',
        services: [
          { name: 'پاکسازی صورت', duration: 60, price: 650000, color: 'mint' },
          { name: 'آبرسانی پوست', duration: 45, price: 500000, color: 'coral' },
        ],
      },
    ],
  },
] as const
