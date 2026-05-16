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

export const PERSIAN_STARTER_SERVICE_TEMPLATES: readonly StarterServiceCategoryTemplate[] =
  [
    {
      category: 'ناخن',
      families: [
        {
          name: 'کاشت و ترمیم',
          services: [
            { name: 'کاشت پودری', duration: 120, price: 0, color: 'rose' },
            { name: 'کاشت ژل', duration: 120, price: 0, color: 'violet' },
            { name: 'ترمیم کاشت', duration: 90, price: 0, color: 'mint' },
            {
              name: 'پکیج کاشت دست و پا',
              duration: 180,
              price: 0,
              color: 'gold',
              kind: 'combo',
            },
          ],
        },
        {
          name: 'مانیکور و پدیکور',
          services: [
            { name: 'مانیکور', duration: 45, price: 0, color: 'coral' },
            { name: 'پدیکور', duration: 60, price: 0, color: 'gold' },
            { name: 'لاک ژل دست', duration: 45, price: 0, color: 'rose' },
            { name: 'لاک ژل پا', duration: 45, price: 0, color: 'violet' },
          ],
        },
      ],
    },
    {
      category: 'مو',
      families: [
        {
          name: 'کوتاهی و براشینگ',
          services: [
            { name: 'کوتاهی مو', duration: 45, price: 0, color: 'coral' },
            { name: 'براشینگ مو', duration: 45, price: 0, color: 'gold' },
            { name: 'شینیون', duration: 90, price: 0, color: 'rose' },
          ],
        },
        {
          name: 'رنگ و لایت',
          services: [
            { name: 'رنگ ریشه', duration: 90, price: 0, color: 'violet' },
            { name: 'رنگ کامل مو', duration: 150, price: 0, color: 'rose' },
            { name: 'مش و هایلایت', duration: 180, price: 0, color: 'gold' },
            { name: 'آمبره و بالیاژ', duration: 210, price: 0, color: 'mint' },
            {
              name: 'رنگ و براشینگ',
              duration: 180,
              price: 0,
              color: 'coral',
              kind: 'combo',
            },
          ],
        },
        {
          name: 'احیا و صافی',
          services: [
            { name: 'کراتین مو', duration: 180, price: 0, color: 'coral' },
            {
              name: 'پروتئین تراپی مو',
              duration: 180,
              price: 0,
              color: 'violet',
            },
          ],
        },
      ],
    },
    {
      category: 'پوست',
      families: [
        {
          name: 'فیشیال و مراقبت',
          services: [
            { name: 'فیشیال صورت', duration: 75, price: 0, color: 'mint' },
            { name: 'پاکسازی پوست', duration: 60, price: 0, color: 'coral' },
            { name: 'آبرسانی پوست', duration: 45, price: 0, color: 'gold' },
          ],
        },
      ],
    },
    {
      category: 'مژه',
      families: [
        {
          name: 'اکستنشن مژه',
          services: [
            {
              name: 'اکستنشن کلاسیک مژه',
              duration: 120,
              price: 0,
              color: 'rose',
            },
            {
              name: 'اکستنشن والیوم مژه',
              duration: 150,
              price: 0,
              color: 'violet',
            },
            {
              name: 'ترمیم اکستنشن مژه',
              duration: 75,
              price: 0,
              color: 'mint',
            },
          ],
        },
        {
          name: 'لیفت و لمینت',
          services: [
            { name: 'لیفت و لمینت مژه', duration: 75, price: 0, color: 'gold' },
          ],
        },
      ],
    },
    {
      category: 'ابرو',
      families: [
        {
          name: 'اصلاح و فرم دهی',
          services: [
            {
              name: 'اصلاح صورت و ابرو',
              duration: 30,
              price: 0,
              color: 'coral',
            },
            { name: 'رنگ ابرو', duration: 30, price: 0, color: 'gold' },
            { name: 'لیفت ابرو', duration: 60, price: 0, color: 'mint' },
          ],
        },
        {
          name: 'آرایش دائم ابرو',
          services: [
            { name: 'فیبروز ابرو', duration: 150, price: 0, color: 'rose' },
            {
              name: 'میکروبلیدینگ ابرو',
              duration: 150,
              price: 0,
              color: 'violet',
            },
          ],
        },
      ],
    },
    {
      category: 'آرایش دائم',
      families: [
        {
          name: 'چشم و لب',
          services: [
            { name: 'بن مژه', duration: 120, price: 0, color: 'rose' },
            { name: 'خط چشم دائم', duration: 120, price: 0, color: 'violet' },
            { name: 'شیدینگ لب', duration: 150, price: 0, color: 'coral' },
          ],
        },
        {
          name: 'ریموو',
          services: [
            { name: 'ریموو تاتو', duration: 90, price: 0, color: 'mint' },
          ],
        },
      ],
    },
    {
      category: 'اپیلاسیون',
      families: [
        {
          name: 'وکس و اپیلاسیون',
          services: [
            { name: 'وکس صورت', duration: 30, price: 0, color: 'gold' },
            { name: 'اپیلاسیون بدن', duration: 90, price: 0, color: 'coral' },
          ],
        },
      ],
    },
  ] as const
