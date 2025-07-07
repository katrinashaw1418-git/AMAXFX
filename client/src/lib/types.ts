export interface PortfolioData {
  totalValue: number;
  cryptoValue: number;
  fiatValue: number;
  monthlyPnl: number;
  monthlyPnlPercent: number;
}

export interface WalletBalance {
  id: number;
  currency: string;
  balance: number;
  availableBalance: number;
  walletType: 'fiat' | 'crypto';
  displayName: string;
  symbol: string;
  color: string;
}

export const CurrencyConfig = {
  USD: { name: "US Dollar", symbol: "$", color: "bg-blue-500", flag: "🇺🇸" },
  CAD: { name: "Canadian Dollar", symbol: "$", color: "bg-red-500", flag: "🇨🇦" },
  EUR: { name: "Euro", symbol: "€", color: "bg-blue-600", flag: "🇪🇺" },
  GBP: { name: "British Pound", symbol: "£", color: "bg-green-600", flag: "🇬🇧" },
  AUD: { name: "Australian Dollar", symbol: "$", color: "bg-orange-500", flag: "🇦🇺" },
  HKD: { name: "Hong Kong Dollar", symbol: "$", color: "bg-pink-500", flag: "🇭🇰" },
  SGD: { name: "Singapore Dollar", symbol: "$", color: "bg-red-600", flag: "🇸🇬" },
  BTC: { name: "Bitcoin", symbol: "₿", color: "bg-yellow-500", flag: "₿" },
  ETH: { name: "Ethereum", symbol: "Ξ", color: "bg-purple-500", flag: "Ξ" },
  USDT: { name: "Tether", symbol: "$", color: "bg-green-500", flag: "🟢" },
  USDC: { name: "USD Coin", symbol: "$", color: "bg-blue-400", flag: "🔵" },
} as const;

export interface TransactionData {
  id: number;
  type: string;
  date: string;
  description: string;
  amount: string;
  status: string;
  fromCurrency?: string;
  toCurrency?: string;
  fee: number;
}

export interface FxExchangeData {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  exchangeRate: number;
  fee: number;
  convertedAmount: number;
}

export interface AiRecommendationData {
  id: number;
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'alert';
  isRead: boolean;
  createdAt: string;
}
