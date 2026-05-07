import { get, patch, post, put } from '../api/client'
import { API } from '../api/endpoints'
import type { Purchase, Holding } from '../types'

export async function getAllPurchases(): Promise<Purchase[]> {
  return get<Purchase[]>(API.purchases)
}

export async function approvePurchase(purchase: Purchase): Promise<void> {
  const totalCost = purchase.totalCost
  // 1. Check balance
  const user = await get<{ balance: number }>(`/users/${purchase.userId}`)
  if (user.balance < totalCost) throw new Error('Insufficient balance')
  // 2. Deduct balance
  await patch(`/users/${purchase.userId}`, { balance: user.balance - totalCost })
  // 3. Update or create holding
  const holdings = await get<Holding[]>(`${API.holdings}?userId=${purchase.userId}`)
  const assetType = purchase.type === 'buy_stock' ? 'stock' : 'crypto'
  const existing = holdings.find(h => h.symbol === purchase.symbol && h.type === assetType)
  if (existing) {
    const newQty = existing.quantity + purchase.quantity
    const newAvg = ((existing.quantity * existing.avgBuyPrice) + (purchase.quantity * purchase.price)) / newQty
    await put(API.holding(existing.id), { ...existing, quantity: newQty, avgBuyPrice: newAvg, currentPrice: purchase.price })
  } else {
    await post(API.holdings, {
      userId: purchase.userId, type: assetType, symbol: purchase.symbol,
      name: purchase.name, color: purchase.color, quantity: purchase.quantity,
      avgBuyPrice: purchase.price, currentPrice: purchase.price,
    })
  }
  // 4. Mark purchase completed
  await patch(API.purchase(purchase.id), { status: 'completed', rejectionReason: null })
  await post(API.adminActions, {
    adminId: 1, action: 'approve_purchase', targetUserId: purchase.userId,
    targetId: purchase.txId,
    details: `Approved ${purchase.type} of ${purchase.quantity} ${purchase.symbol} for $${purchase.totalCost}`,
    timestamp: new Date().toISOString(),
  })
}

export async function rejectPurchase(purchase: Purchase, reason: string): Promise<void> {
  await patch(API.purchase(purchase.id), { status: 'cancelled', rejectionReason: reason })
  await post(API.adminActions, {
    adminId: 1, action: 'reject_purchase', targetUserId: purchase.userId,
    targetId: purchase.txId,
    details: `Rejected ${purchase.type} of ${purchase.quantity} ${purchase.symbol}. Reason: ${reason}`,
    timestamp: new Date().toISOString(),
  })
}
