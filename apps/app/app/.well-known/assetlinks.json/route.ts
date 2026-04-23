import { NextResponse } from 'next/server'

const DEFAULT_RELATION = 'delegate_permission/common.handle_all_urls'

function parseFingerprints(rawFingerprints: string | undefined) {
  if (!rawFingerprints) {
    return []
  }

  return rawFingerprints
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)
}

export function GET() {
  const packageName = process.env.ANDROID_TWA_PACKAGE_NAME?.trim()
  const relation = process.env.ANDROID_TWA_RELATION?.trim() || DEFAULT_RELATION
  const sha256CertFingerprints = parseFingerprints(
    process.env.ANDROID_TWA_SHA256_CERT_FINGERPRINTS
  )

  if (!packageName || sha256CertFingerprints.length === 0) {
    return new NextResponse('Not Found', { status: 404 })
  }

  return NextResponse.json(
    [
      {
        relation: [relation],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: sha256CertFingerprints,
        },
      },
    ],
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
      },
    }
  )
}
