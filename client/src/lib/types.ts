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
  // Major Fiat Currencies
  USD: { name: "US Dollar", symbol: "$", color: "bg-blue-500", flag: "🇺🇸", region: "Americas" },
  CAD: { name: "Canadian Dollar", symbol: "$", color: "bg-red-500", flag: "🇨🇦", region: "Americas" },
  EUR: { name: "Euro", symbol: "€", color: "bg-blue-600", flag: "🇪🇺", region: "Europe" },
  GBP: { name: "British Pound", symbol: "£", color: "bg-green-600", flag: "🇬🇧", region: "Europe" },
  AUD: { name: "Australian Dollar", symbol: "$", color: "bg-purple-500", flag: "🇦🇺", region: "Oceania" },
  HKD: { name: "Hong Kong Dollar", symbol: "$", color: "bg-pink-500", flag: "🇭🇰", region: "Asia" },
  SGD: { name: "Singapore Dollar", symbol: "$", color: "bg-yellow-500", flag: "🇸🇬", region: "Asia" },
  
  // Additional Wise-supported currencies
  JPY: { name: "Japanese Yen", symbol: "¥", color: "bg-red-500", flag: "🇯🇵", region: "Asia" },
  CHF: { name: "Swiss Franc", symbol: "Fr", color: "bg-slate-500", flag: "🇨🇭", region: "Europe" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$", color: "bg-lime-500", flag: "🇳🇿", region: "Oceania" },
  SEK: { name: "Swedish Krona", symbol: "kr", color: "bg-blue-400", flag: "🇸🇪", region: "Europe" },
  NOK: { name: "Norwegian Krone", symbol: "kr", color: "bg-red-400", flag: "🇳🇴", region: "Europe" },
  DKK: { name: "Danish Krone", symbol: "kr", color: "bg-red-300", flag: "🇩🇰", region: "Europe" },
  PLN: { name: "Polish Zloty", symbol: "zł", color: "bg-white", flag: "🇵🇱", region: "Europe" },
  CZK: { name: "Czech Koruna", symbol: "Kč", color: "bg-blue-300", flag: "🇨🇿", region: "Europe" },
  HUF: { name: "Hungarian Forint", symbol: "Ft", color: "bg-green-300", flag: "🇭🇺", region: "Europe" },
  TRY: { name: "Turkish Lira", symbol: "₺", color: "bg-red-300", flag: "🇹🇷", region: "Europe" },
  ZAR: { name: "South African Rand", symbol: "R", color: "bg-yellow-400", flag: "🇿🇦", region: "Africa" },
  INR: { name: "Indian Rupee", symbol: "₹", color: "bg-orange-400", flag: "🇮🇳", region: "Asia" },
  CNY: { name: "Chinese Yuan", symbol: "¥", color: "bg-red-400", flag: "🇨🇳", region: "Asia" },
  KRW: { name: "South Korean Won", symbol: "₩", color: "bg-blue-500", flag: "🇰🇷", region: "Asia" },
  TWD: { name: "Taiwan Dollar", symbol: "NT$", color: "bg-indigo-400", flag: "🇹🇼", region: "Asia" },
  THB: { name: "Thai Baht", symbol: "฿", color: "bg-yellow-300", flag: "🇹🇭", region: "Asia" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM", color: "bg-red-300", flag: "🇲🇾", region: "Asia" },
  IDR: { name: "Indonesian Rupiah", symbol: "Rp", color: "bg-red-300", flag: "🇮🇩", region: "Asia" },
  PHP: { name: "Philippine Peso", symbol: "₱", color: "bg-blue-300", flag: "🇵🇭", region: "Asia" },
  VND: { name: "Vietnamese Dong", symbol: "₫", color: "bg-red-300", flag: "🇻🇳", region: "Asia" },
  BRL: { name: "Brazilian Real", symbol: "R$", color: "bg-green-300", flag: "🇧🇷", region: "Americas" },
  MXN: { name: "Mexican Peso", symbol: "$", color: "bg-green-300", flag: "🇲🇽", region: "Americas" },
  AED: { name: "UAE Dirham", symbol: "د.إ", color: "bg-green-300", flag: "🇦🇪", region: "Middle East" },
  SAR: { name: "Saudi Riyal", symbol: "﷼", color: "bg-green-300", flag: "🇸🇦", region: "Middle East" },
  ILS: { name: "Israeli Shekel", symbol: "₪", color: "bg-blue-300", flag: "🇮🇱", region: "Middle East" },
  EGP: { name: "Egyptian Pound", symbol: "E£", color: "bg-yellow-300", flag: "🇪🇬", region: "Africa" },
  NGN: { name: "Nigerian Naira", symbol: "₦", color: "bg-green-300", flag: "🇳🇬", region: "Africa" },
  
  // Crypto Currencies
  BTC: { name: "Bitcoin", symbol: "₿", color: "bg-gray-900", flag: "₿", region: "Crypto" },
  ETH: { name: "Ethereum", symbol: "Ξ", color: "bg-purple-500", flag: "Ξ", region: "Crypto" },
  USDT: { name: "Tether", symbol: "$", color: "bg-green-500", flag: "🟢", region: "Stablecoins" },
  USDC: { name: "USD Coin", symbol: "$", color: "bg-blue-400", flag: "🔵", region: "Stablecoins" },
} as const;

export const SupportedCurrencies = Object.keys(CurrencyConfig);

export const CurrencyRegions = {
  'Americas': ['USD', 'CAD', 'BRL', 'MXN'],
  'Europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'TRY'],
  'Asia': ['HKD', 'SGD', 'JPY', 'INR', 'CNY', 'KRW', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  'Oceania': ['AUD', 'NZD'],
  'Middle East': ['AED', 'SAR', 'ILS'],
  'Africa': ['ZAR', 'EGP', 'NGN'],
  'Crypto': ['BTC', 'ETH'],
  'Stablecoins': ['USDT', 'USDC']
};

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
