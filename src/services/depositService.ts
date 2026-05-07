import { get, patch, post } from '../api/client'
import { API } from '../api/endpoints'
import type { Deposit } from '../types'

export async function getAllDeposits(): Promise<Deposit[]> {
  return get<Deposit[]>(API.deposits)
}

export async function getDepositsByUser(userId: number): Promise<Deposit[]> {
  return get<Deposit[]>(`${API.deposits}?userId=${userId}`)
}

export async function approveDeposit(deposit: Deposit): Promise<void> {
  // 1. Mark deposit completed
  await patch(API.deposit(deposit.id), { status: 'completed', rejectionReason: null })
  // 2. Credit user balance
  const user = await get<{ balance: number; id: number }>(`/users/${deposit.userId}`)
  await patch(`/users/${deposit.userId}`, { balance: user.balance + deposit.amount })
  // 3. Log admin action
  await post(API.adminActions, {
    adminId: 1,
    action: 'approve_deposit',
    targetUserId: deposit.userId,
    targetId: deposit.txId,
    details: `Approved deposit of $${deposit.amount} (${deposit.txId})`,
    timestamp: new Date().toISOString(),
  })
}

export async function rejectDeposit(deposit: Deposit, reason: string): Promise<void> {
  await patch(API.deposit(deposit.id), { status: 'rejected', rejectionReason: reason })
  await post(API.adminActions, {
    adminId: 1,
    action: 'reject_deposit',
    targetUserId: deposit.userId,
    targetId: deposit.txId,
    details: `Rejected deposit of $${deposit.amount}. Reason: ${reason}`,
    timestamp: new Date().toISOString(),
  })
}

export async function approveWithdrawal(deposit: Deposit): Promise<void> {
  // 1. Deduct balance
  const user = await get<{ balance: number }>(`/users/${deposit.userId}`)
  if (user.balance < deposit.amount) throw new Error('Insufficient balance')
  await patch(`/users/${deposit.userId}`, { balance: user.balance - deposit.amount })
  // 2. Mark completed
  await patch(API.deposit(deposit.id), { status: 'completed', rejectionReason: null })
  await post(API.adminActions, {
    adminId: 1,
    action: 'approve_withdrawal',
    targetUserId: deposit.userId,
    targetId: deposit.txId,
    details: `Approved withdrawal of $${deposit.amount} (${deposit.txId})`,
    timestamp: new Date().toISOString(),
  })
}

export async function rejectWithdrawal(deposit: Deposit, reason: string): Promise<void> {
  await patch(API.deposit(deposit.id), { status: 'rejected', rejectionReason: reason })
  await post(API.adminActions, {
    adminId: 1,
    action: 'reject_withdrawal',
    targetUserId: deposit.userId,
    targetId: deposit.txId,
    details: `Rejected withdrawal of $${deposit.amount}. Reason: ${reason}`,
    timestamp: new Date().toISOString(),
  })
}
