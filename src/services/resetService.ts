import { get, del, patch } from '../api/client'
import { API } from '../api/endpoints'

interface Identifiable { id: number | string }
interface UserRecord { id: number; role: string }

/** Delete all records from a collection */
async function clearCollection(endpoint: string, itemEndpoint: (id: number | string) => string): Promise<void> {
  const items = await get<Identifiable[]>(endpoint)
  await Promise.all(items.map((item) => del(itemEndpoint(item.id))))
}

/**
 * Reset all transactional data for a specific user:
 * - Zero out balance
 * - Delete their deposits, purchases, holdings, botTrades, tradeHistory, notifications, profitOverview
 */
export async function resetUserData(userId: number): Promise<void> {
  // Zero balance
  await patch(API.user(userId), { balance: 0 })

  // Fetch and delete user-scoped records
  const [deposits, purchases, holdings, botTrades, tradeHistory, notifications, profitOverview] = await Promise.all([
    get<Identifiable[]>(`${API.deposits}?userId=${userId}`),
    get<Identifiable[]>(`${API.purchases}?userId=${userId}`),
    get<Identifiable[]>(`${API.holdings}?userId=${userId}`),
    get<Identifiable[]>(`${API.botTrades}?userId=${userId}`),
    get<Identifiable[]>(`${API.tradeHistory}?userId=${userId}`),
    get<Identifiable[]>(`${API.notifications}?userId=${userId}`),
    get<Identifiable[]>(`${API.profitOverview}?userId=${userId}`),
  ])

  await Promise.all([
    ...deposits.map((r) => del(API.deposit(r.id as number))),
    ...purchases.map((r) => del(API.purchase(r.id as number))),
    ...holdings.map((r) => del(API.holding(r.id as number))),
    ...botTrades.map((r) => del(API.botTrade(r.id))),
    ...tradeHistory.map((r) => del(API.tradeHistoryItem(r.id as number))),
    ...notifications.map((r) => del(API.notification(r.id as number))),
    ...profitOverview.map((r) => del(API.profitOverviewItem(r.id as number))),
  ])
}

/**
 * Reset ALL platform data:
 * - Zero all user balances
 * - Clear deposits, purchases, holdings, botTrades, tradeHistory, notifications, profitOverview, adminActions
 */
export async function resetAllData(): Promise<void> {
  // Zero all user balances
  const users = await get<UserRecord[]>(API.users)
  await Promise.all(users.map((u) => patch(API.user(u.id), { balance: 0 })))

  // Clear all transactional collections
  await Promise.all([
    clearCollection(API.deposits, API.deposit),
    clearCollection(API.purchases, API.purchase),
    clearCollection(API.holdings, API.holding),
    clearCollection(API.botTrades, API.botTrade),
    clearCollection(API.tradeHistory, API.tradeHistoryItem),
    clearCollection(API.notifications, API.notification),
    clearCollection(API.adminActions, API.adminAction),
    clearCollection(API.profitOverview, API.profitOverviewItem),
  ])
}

/**
 * Delete ALL non-Admin users and all their associated data.
 * Admin accounts (role === 'Admin') are preserved.
 */
export async function deleteAllUsers(): Promise<{ deleted: number }> {
  const users = await get<UserRecord[]>(API.users)
  const memberUsers = users.filter((u) => u.role !== 'Admin')

  // Delete all data for each member user first
  await Promise.all(memberUsers.map((u) => resetUserData(u.id)))

  // Then delete the user accounts themselves
  await Promise.all(memberUsers.map((u) => del(API.user(u.id))))

  // Also clear admin action logs
  await clearCollection(API.adminActions, API.adminAction)

  return { deleted: memberUsers.length }
}
