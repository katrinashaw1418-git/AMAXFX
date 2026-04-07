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
  USD: { name: "US Dollar",         symbol: "$",    color: "#3b82f6", flag: "🇺🇸", region: "Americas"    },
  CAD: { name: "Canadian Dollar",   symbol: "$",    color: "#ef4444", flag: "🇨🇦", region: "Americas"    },
  EUR: { name: "Euro",              symbol: "€",    color: "#2563eb", flag: "🇪🇺", region: "Europe"      },
  GBP: { name: "British Pound",     symbol: "£",    color: "#16a34a", flag: "🇬🇧", region: "Europe"      },
  AUD: { name: "Australian Dollar", symbol: "$",    color: "#a855f7", flag: "🇦🇺", region: "Oceania"     },
  HKD: { name: "Hong Kong Dollar",  symbol: "$",    color: "#ec4899", flag: "🇭🇰", region: "Asia"        },
  SGD: { name: "Singapore Dollar",  symbol: "$",    color: "#eab308", flag: "🇸🇬", region: "Asia"        },

  // Additional Wise-supported currencies
  JPY: { name: "Japanese Yen",          symbol: "¥",    color: "#ef4444", flag: "🇯🇵", region: "Asia"        },
  CHF: { name: "Swiss Franc",           symbol: "Fr",   color: "#64748b", flag: "🇨🇭", region: "Europe"      },
  NZD: { name: "New Zealand Dollar",    symbol: "NZ$",  color: "#84cc16", flag: "🇳🇿", region: "Oceania"     },
  SEK: { name: "Swedish Krona",         symbol: "kr",   color: "#60a5fa", flag: "🇸🇪", region: "Europe"      },
  NOK: { name: "Norwegian Krone",       symbol: "kr",   color: "#f87171", flag: "🇳🇴", region: "Europe"      },
  DKK: { name: "Danish Krone",          symbol: "kr",   color: "#fca5a5", flag: "🇩🇰", region: "Europe"      },
  PLN: { name: "Polish Zloty",          symbol: "zł",   color: "#e2e8f0", flag: "🇵🇱", region: "Europe"      },
  CZK: { name: "Czech Koruna",          symbol: "Kč",   color: "#93c5fd", flag: "🇨🇿", region: "Europe"      },
  HUF: { name: "Hungarian Forint",      symbol: "Ft",   color: "#86efac", flag: "🇭🇺", region: "Europe"      },
  TRY: { name: "Turkish Lira",          symbol: "₺",    color: "#fca5a5", flag: "🇹🇷", region: "Europe"      },
  ZAR: { name: "South African Rand",    symbol: "R",    color: "#facc15", flag: "🇿🇦", region: "Africa"      },
  INR: { name: "Indian Rupee",          symbol: "₹",    color: "#fb923c", flag: "🇮🇳", region: "Asia"        },
  CNY: { name: "Chinese Yuan",          symbol: "¥",    color: "#f87171", flag: "🇨🇳", region: "Asia"        },
  KRW: { name: "South Korean Won",      symbol: "₩",    color: "#3b82f6", flag: "🇰🇷", region: "Asia"        },
  TWD: { name: "Taiwan Dollar",         symbol: "NT$",  color: "#818cf8", flag: "🇹🇼", region: "Asia"        },
  THB: { name: "Thai Baht",             symbol: "฿",    color: "#fde047", flag: "🇹🇭", region: "Asia"        },
  MYR: { name: "Malaysian Ringgit",     symbol: "RM",   color: "#fca5a5", flag: "🇲🇾", region: "Asia"        },
  IDR: { name: "Indonesian Rupiah",     symbol: "Rp",   color: "#f87171", flag: "🇮🇩", region: "Asia"        },
  PHP: { name: "Philippine Peso",       symbol: "₱",    color: "#93c5fd", flag: "🇵🇭", region: "Asia"        },
  VND: { name: "Vietnamese Dong",       symbol: "₫",    color: "#fca5a5", flag: "🇻🇳", region: "Asia"        },
  BRL: { name: "Brazilian Real",        symbol: "R$",   color: "#86efac", flag: "🇧🇷", region: "Americas"    },
  MXN: { name: "Mexican Peso",          symbol: "$",    color: "#4ade80", flag: "🇲🇽", region: "Americas"    },
  AED: { name: "UAE Dirham",            symbol: "د.إ",  color: "#4ade80", flag: "🇦🇪", region: "Middle East" },
  SAR: { name: "Saudi Riyal",           symbol: "﷼",    color: "#4ade80", flag: "🇸🇦", region: "Middle East" },
  ILS: { name: "Israeli Shekel",        symbol: "₪",    color: "#93c5fd", flag: "🇮🇱", region: "Middle East" },
  EGP: { name: "Egyptian Pound",        symbol: "E£",   color: "#fde047", flag: "🇪🇬", region: "Africa"      },
  NGN: { name: "Nigerian Naira",        symbol: "₦",    color: "#4ade80", flag: "🇳🇬", region: "Africa"      },

  // Crypto Currencies
  BTC:  { name: "Bitcoin",   symbol: "₿", color: "#111827", flag: "₿",  region: "Crypto"      },
  ETH:  { name: "Ethereum",  symbol: "Ξ", color: "#a855f7", flag: "Ξ",  region: "Crypto"      },
  USDT: { name: "Tether",    symbol: "$", color: "#22c55e", flag: "🟢", region: "Stablecoins" },
  USDC: { name: "USD Coin",  symbol: "$", color: "#60a5fa", flag: "🔵", region: "Stablecoins" },
} as const;

export const SupportedCurrencies = Object.keys(CurrencyConfig);

export const CurrencyRegions = {
  'Americas':    ['USD', 'CAD', 'BRL', 'MXN'],
  'Europe':      ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'TRY'],
  'Asia':        ['HKD', 'SGD', 'JPY', 'INR', 'CNY', 'KRW', 'TWD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
  'Oceania':     ['AUD', 'NZD'],
  'Middle East': ['AED', 'SAR', 'ILS'],
  'Africa':      ['ZAR', 'EGP', 'NGN'],
  'Crypto':      ['BTC', 'ETH'],
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
