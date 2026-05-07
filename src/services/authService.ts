import { post } from '../api/client'
import type { AdminUser } from '../types'

// POST /auth/login returns { success, token, user } — no { success, data } wrapper
// so unwrap() returns the full object as-is
interface LoginResponse {
  success: boolean
  token: string
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

export async function adminLogin(email: string, password: string): Promise<AdminUser | null> {
  try {
    const response = await post<LoginResponse>('/auth/login', { email, password })

    if (!response.success || !response.token) return null

    // Only allow Admin role
    if (response.user.role !== 'Admin') return null

    localStorage.setItem('admin_token', response.token)

    return {
      id: response.user.id,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      role: response.user.role,
      avatar: null,
      balance: 0,
      currency: 'USD',
    }
  } catch {
    return null
  }
}
