import { get, patch, del } from '../api/client'
import { API } from '../api/endpoints'
import type { AdminUser } from '../types'

export async function getAllUsers(): Promise<AdminUser[]> {
  return get<AdminUser[]>(API.users)
}

export async function getAllUsersWithPasswords(): Promise<AdminUser[]> {
  return get<AdminUser[]>(`${API.users}?showPasswords=true`)
}

export async function resetUserPassword(userId: number, newPassword: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/auth/admin-reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
    },
    body: JSON.stringify({ userId, newPassword }),
  })
  return response.json()
}

export async function getUserById(id: number): Promise<AdminUser> {
  return get<AdminUser>(API.user(id))
}

export async function updateUser(id: number, fields: Partial<AdminUser>): Promise<AdminUser> {
  return patch<AdminUser>(API.user(id), fields)
}

export async function adjustBalance(id: number, newBalance: number): Promise<AdminUser> {
  return patch<AdminUser>(API.user(id), { balance: newBalance })
}

export async function suspendUser(id: number): Promise<AdminUser> {
  return patch<AdminUser>(API.user(id), { accountStatus: 'suspended' })
}

export async function activateUser(id: number): Promise<AdminUser> {
  return patch<AdminUser>(API.user(id), { accountStatus: 'active' })
}

export async function deleteUser(id: number): Promise<void> {
  return del<void>(API.user(id))
}
