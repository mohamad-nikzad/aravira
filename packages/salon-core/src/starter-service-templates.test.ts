import { describe, expect, it } from 'vitest'
import { PERSIAN_STARTER_SERVICE_TEMPLATES } from './starter-service-templates'

describe('PERSIAN_STARTER_SERVICE_TEMPLATES', () => {
  it('includes the initial editable Persian catalog areas', () => {
    expect(PERSIAN_STARTER_SERVICE_TEMPLATES.map((template) => template.category)).toEqual([
      'ناخن',
      'مو',
      'پوست',
    ])
  })

  it('contains the required nail powder path', () => {
    const nails = PERSIAN_STARTER_SERVICE_TEMPLATES.find((template) => template.category === 'ناخن')
    const nailBuild = nails?.families.find((family) => family.name === 'کاشت ناخن')

    expect(nailBuild?.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'کاشت با پودر',
          duration: 90,
          price: 800000,
        }),
      ])
    )
  })

  it('uses stable unique category, family, and service names for idempotent imports', () => {
    const categories = new Set<string>()
    const familyPaths = new Set<string>()
    const serviceNames = new Set<string>()

    for (const category of PERSIAN_STARTER_SERVICE_TEMPLATES) {
      expect(categories.has(category.category)).toBe(false)
      categories.add(category.category)

      for (const family of category.families) {
        const familyPath = `${category.category}/${family.name}`
        expect(familyPaths.has(familyPath)).toBe(false)
        familyPaths.add(familyPath)

        for (const service of family.services) {
          expect(serviceNames.has(service.name)).toBe(false)
          serviceNames.add(service.name)
          expect(service.duration).toBeGreaterThan(0)
          expect(service.price).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })
})
