import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { User } from './types'
import { getUserById, getUserByEmail } from './db'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  
  return token
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload.userId as string
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) return null
  
  const userId = await verifySession(token)
  if (!userId) return null
  
  const user = getUserById(userId)
  return user || null
}

export async function login(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const user = getUserByEmail(email.trim())
  if (!user) return null
  
  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) return null
  
  const token = await createSession(user.id)
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      color: user.color,
      phone: user.phone,
      createdAt: user.createdAt,
    },
    token,
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
