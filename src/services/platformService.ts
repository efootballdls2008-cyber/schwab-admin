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

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const settings = await get<PlatformSettings[]>(API.platformSettings)
  return settings[0]
}

export async function updatePlatformSettings(id: number, data: Partial<PlatformSettings>): Promise<PlatformSettings> {
  return patch<PlatformSettings>(API.platformSetting(id), data)
}
