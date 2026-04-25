const NEXT_BUILD_ID_PATTERNS = [/"b":"([^"]+)"/, /\\"b\\":\\"([^\\"]+)\\"/]

export function extractNextBuildId(source: string) {
  for (const pattern of NEXT_BUILD_ID_PATTERNS) {
    const buildId = source.match(pattern)?.[1]
    if (buildId) {
      return buildId
    }
  }

  return null
}
