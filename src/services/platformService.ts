import { get, patch, post, del } from '../api/client'
import { API } from '../api/endpoints'
import type { PlatformAccount, PlatformSettings } from '../types'

export async function getPlatformAccounts(): Promise<PlatformAccount[]> {
  return get<PlatformAccount[]>(API.platformAccounts)
}

export async function createPlatformAccount(data: Omit<PlatformAccount, 'id'>): Promise<PlatformAccount> {
  return post<PlatformAccount>(API.platformAccounts, data)
}

export async function updatePlatformAccount(id: number, data: Partial<PlatformAccount>): Promise<PlatformAccount> {
  return patch<PlatformAccount>(API.platformAccount(id), data)
}

export async function deletePlatformAccount(id: number): Promise<void> {
  await del(API.platformAccount(id))
}

export async function getDefaultPlatformAccount(): Promise<PlatformAccount | null> {
  const accounts = await getPlatformAccounts()
  return accounts.find(a => a.isDefault && a.status === 'active') ?? null
}

/**
 * GET /platformSettings returns a single object (not an array).
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  return get<PlatformSettings>(API.platformSettings)
}

/**
 * PATCH /platformSettings — no id needed, backend updates the single row.
 * Strip id and updatedAt before sending so they don't cause SQL errors.
 */
export async function updatePlatformSettings(_id: number, data: Partial<PlatformSettings>): Promise<PlatformSettings> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _stripId, ...payload } = data as PlatformSettings & { id?: number }
  return patch<PlatformSettings>(API.platformSettings, payload)
}
