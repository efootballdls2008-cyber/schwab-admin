export interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  avatar: string | null
  balance: number
  currency: string
  phone?: string
  dateOfBirth?: string
  country?: string
  address?: string
  memberSince?: string
  depositBankName?: string
  depositAccountName?: string
  depositAccountNumber?: string
  depositRoutingNumber?: string
  depositAccountType?: string
  withdrawBankName?: string
  withdrawAccountName?: string
  withdrawAccountNumber?: string
  withdrawRoutingNumber?: string
  withdrawAccountType?: string
  withdrawSwiftCode?: string
  kycVerified?: boolean
  accountStatus?: 'active' | 'suspended' | 'banned'
}

export interface Deposit {
  id: number
  userId: number
  type: 'deposit' | 'withdraw'
  method: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'rejected' | 'cancelled'
  date: string
  time: string
  txId: string
  note: string
  rejectionReason: string | null
}

export interface Purchase {
  id: number
  userId: number
  type: 'buy_stock' | 'buy_crypto'
  symbol: string
  name: string
  color: string
  quantity: number
  price: number
  totalCost: number
  date: string
  time: string
  txId: string
  status: 'pending' | 'completed' | 'cancelled'
  rejectionReason: string | null
}

export interface Holding {
  id: number
  userId: number
  type: 'stock' | 'crypto'
  symbol: string
  name: string
  color: string
  quantity: number
  avgBuyPrice: number
  currentPrice: number
}

export interface PlatformAccount {
  id: number
  accountName: string
  bankName: string
  accountNumber: string
  routingNumber: string
  accountType: string
  swiftCode: string
  isDefault: boolean
  status: 'active' | 'inactive'
}

export interface PlatformSettings {
  id: number
  // Deposit / Withdrawal limits
  minDepositAmount: number
  maxDepositAmount: number
  minWithdrawalAmount: number
  maxWithdrawalAmount: number
  // Fees
  tradingFeePercent: number
  withdrawalFeePercent: number
  // Feature flags
  depositsEnabled: boolean
  withdrawalsEnabled: boolean
  tradingEnabled: boolean
  kycRequired: boolean
  maintenanceMode: boolean
  registrationEnabled: boolean
  botTradingEnabled: boolean
  // User defaults
  defaultStartingBalance: number
  welcomeBonusAmount: number
  welcomeBonusEnabled: boolean
  // Bot defaults
  botDefaultStrategy: string
  botDefaultRiskLevel: string
  botMaxOpenTrades: number
  // Security
  maxLoginAttempts: number
  sessionTimeoutMinutes: number
  // Notifications
  notifyOnNewDeposit: boolean
  notifyOnNewWithdrawal: boolean
  notifyOnNewUser: boolean
  notifyOnNewOrder: boolean
  // Branding
  platformName: string
  supportEmail: string
  supportPhone: string
}

export interface AdminAction {
  id: number
  adminId: number
  action: string
  targetUserId: number
  targetId: string
  details: string
  timestamp: string
}
