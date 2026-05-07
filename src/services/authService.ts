import { post } from '../api/client'
import type { AdminUser } from '../types'

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
    
    // Check if user is an admin
    if (response.user.role !== 'Admin') return null
    
    // Store the JWT token
    localStorage.setItem('admin_token', response.token)
    
    return {
      id: response.user.id,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      role: response.user.role,
    }
  } catch {
    return null
  }
}
