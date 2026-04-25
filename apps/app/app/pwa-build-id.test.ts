import { describe, expect, it } from 'vitest'
import { extractNextBuildId } from '@/lib/pwa-build-id'

describe('extractNextBuildId', () => {
  it('reads the build id from live script content', () => {
    expect(extractNextBuildId('{"b":"live-build-id"}')).toBe('live-build-id')
  })

  it('reads the build id from fetched html markup', () => {
    expect(extractNextBuildId('\\"b\\":\\"fetched-build-id\\"')).toBe(
      'fetched-build-id'
    )
  })

  it('returns null when the build id is missing', () => {
    expect(extractNextBuildId('<html></html>')).toBeNull()
  })
})
