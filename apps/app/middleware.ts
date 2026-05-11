import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HEADERS = 'Content-Type, Authorization, Accept'
const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'

function applyCors(response: NextResponse, origin: string | null) {
  response.headers.set('Access-Control-Allow-Origin', origin ?? '*')
  response.headers.set('Vary', 'Origin')
  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS)
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return applyCors(new NextResponse(null, { status: 204 }), origin)
  }

  return applyCors(NextResponse.next(), origin)
}

export const config = {
  matcher: '/api/:path*',
}
