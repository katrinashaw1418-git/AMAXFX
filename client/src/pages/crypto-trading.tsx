import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, ExternalLink, ArrowUpDown, ChevronRight, Minus, Plus } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// Available base currencies from wallet system
const BASE_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

// VirgoCX Cryptocurrencies (base prices in USD, will be converted based on selected currency)
const VIRGOCX_CRYPTOCURRENCIES = [
  // Major Cryptocurrencies
  { symbol: 'BTC', name: 'Bitcoin', usdPrice: 97250.00, change: 2.34, volume: 45678.12, marketCap: 2.58e12 },
  { symbol: 'ETH', name: 'Ethereum', usdPrice: 3420.00, change: 1.89, volume: 234567.89, marketCap: 5.48e11 },
  { symbol: 'BCH', name: 'Bitcoin Cash', usdPrice: 508.90, change: -1.23, volume: 5432.10, marketCap: 1.34e10 },
  { symbol: 'LTC', name: 'Litecoin', usdPrice: 109.12, change: 0.78, volume: 8765.43, marketCap: 1.08e10 },
  { symbol: 'XRP', name: 'Ripple', usdPrice: 2.17, change: -0.45, volume: 12345.67, marketCap: 1.65e11 },
  
  // Stablecoins
  { symbol: 'USDC', name: 'USD Coin', usdPrice: 1.00, change: 0.01, volume: 234567.89, marketCap: 5.56e10 },
  
  // DeFi Ecosystem
  { symbol: 'UNI', name: 'Uniswap', usdPrice: 14.58, change: 4.23, volume: 8765.43, marketCap: 1.46e10 },
  { symbol: 'LINK', name: 'Chainlink', usdPrice: 21.68, change: 1.56, volume: 6789.01, marketCap: 1.70e10 },
  { symbol: 'AAVE', name: 'Aave', usdPrice: 342.56, change: 2.67, volume: 3456.78, marketCap: 6.85e9 },
  { symbol: 'COMP', name: 'Compound', usdPrice: 92.56, change: 1.89, volume: 2345.67, marketCap: 1.24e9 },
  { symbol: 'CRV', name: 'Curve', usdPrice: 0.67, change: 3.12, volume: 5678.90, marketCap: 6.7e8 },
  { symbol: 'MKR', name: 'Maker', usdPrice: 1418.45, change: 1.23, volume: 1234.56, marketCap: 1.85e9 },
  { symbol: 'SNX', name: 'Synthetix', usdPrice: 3.42, change: 2.34, volume: 3456.78, marketCap: 1.5e9 },
  { symbol: 'KNC', name: 'Kyber Network', usdPrice: 0.58, change: 1.45, volume: 2345.67, marketCap: 1.3e8 },
  { symbol: 'ZRX', name: '0x', usdPrice: 0.50, change: 2.78, volume: 4567.89, marketCap: 5.6e8 },
  { symbol: 'DYDX', name: 'dYdX', usdPrice: 1.75, change: -1.56, volume: 7890.12, marketCap: 1.8e9 },
  { symbol: 'SUSHI', name: 'SushiSwap', usdPrice: 0.92, change: 0.89, volume: 5678.90, marketCap: 1.6e8 },
  { symbol: 'LRC', name: 'Loopring', usdPrice: 0.34, change: 3.45, volume: 9876.54, marketCap: 5.8e8 },
  { symbol: 'CVX', name: 'Convex Finance', usdPrice: 2.58, change: 1.78, volume: 2345.67, marketCap: 7.4e8 },
  { symbol: 'LDO', name: 'Lido', usdPrice: 2.08, change: 2.45, volume: 6789.01, marketCap: 2.5e9 },
  { symbol: 'BLUR', name: 'Blur', usdPrice: 0.42, change: 4.56, volume: 12345.67, marketCap: 3.4e8 },
  { symbol: 'PENDLE', name: 'Pendle', usdPrice: 5.92, change: 6.78, volume: 8765.43, marketCap: 1.9e9 },
  { symbol: 'AERO', name: 'Aerodrome Finance', usdPrice: 1.75, change: 8.90, volume: 5432.10, marketCap: 8.7e8 },
  
  // Layer 1 & Layer 2
  { symbol: 'ADA', name: 'Cardano', usdPrice: 0.92, change: 3.45, volume: 23456.78, marketCap: 4.31e10 },
  { symbol: 'DOT', name: 'Polkadot', usdPrice: 9.25, change: 2.10, volume: 9876.54, marketCap: 1.75e10 },
  { symbol: 'SOL', name: 'Solana', usdPrice: 175.89, change: 5.67, volume: 34567.89, marketCap: 1.1e11 },
  { symbol: 'MATIC', name: 'Polygon', usdPrice: 1.09, change: 5.67, volume: 34567.89, marketCap: 1.44e10 },
  { symbol: 'POL', name: 'Polygon Ecosystem Token', usdPrice: 0.67, change: 4.32, volume: 23456.78, marketCap: 8.9e9 },
  { symbol: 'AVAX', name: 'Avalanche', usdPrice: 50.89, change: 3.21, volume: 12345.67, marketCap: 2.71e10 },
  { symbol: 'ATOM', name: 'Cosmos', usdPrice: 7.40, change: 2.45, volume: 7890.12, marketCap: 3.8e9 },
  { symbol: 'NEAR', name: 'Near Protocol', usdPrice: 6.68, change: 1.78, volume: 6789.01, marketCap: 9.5e9 },
  { symbol: 'ICP', name: 'Internet Computer', usdPrice: 11.75, change: 0.89, volume: 4567.89, marketCap: 7.3e9 },
  { symbol: 'FTM', name: 'Fantom', usdPrice: 0.84, change: 3.56, volume: 8765.43, marketCap: 3.1e9 },
  { symbol: 'ALGO', name: 'Algorand', usdPrice: 0.26, change: 2.78, volume: 12345.67, marketCap: 2.7e9 },
  { symbol: 'XTZ', name: 'Tezos', usdPrice: 1.34, change: 1.45, volume: 5678.90, marketCap: 1.8e9 },
  { symbol: 'HBAR', name: 'Hedera', usdPrice: 0.21, change: 4.56, volume: 23456.78, marketCap: 1.0e10 },
  { symbol: 'LUNA2', name: 'Terra 2.0', usdPrice: 0.67, change: -2.34, volume: 7890.12, marketCap: 5.8e8 },
  { symbol: 'OP', name: 'Optimism', usdPrice: 2.59, change: 3.78, volume: 9876.54, marketCap: 3.6e9 },
  { symbol: 'ARB', name: 'Arbitrum', usdPrice: 0.92, change: 2.90, volume: 15678.90, marketCap: 4.9e9 },
  { symbol: 'CELO', name: 'Celo', usdPrice: 1.09, change: 1.67, volume: 4567.89, marketCap: 7.3e8 },
  { symbol: 'TIA', name: 'Celestia', usdPrice: 6.68, change: 6.78, volume: 6789.01, marketCap: 1.9e9 },
  { symbol: 'INJ', name: 'Injective', usdPrice: 25.93, change: 4.32, volume: 3456.78, marketCap: 3.3e9 },
  { symbol: 'OSMO', name: 'Osmosis', usdPrice: 1.34, change: 2.45, volume: 5678.90, marketCap: 9.4e8 },
  { symbol: 'APT', name: 'Aptos', usdPrice: 11.75, change: 3.21, volume: 7890.12, marketCap: 6.7e9 },
  { symbol: 'TON', name: 'Toncoin', usdPrice: 5.92, change: 2.78, volume: 9876.54, marketCap: 1.9e10 },
  { symbol: 'BERA', name: 'Berachain', usdPrice: 0.50, change: 12.45, volume: 4567.89, marketCap: 6.7e8 },
  
  // Gaming & Metaverse
  { symbol: 'MANA', name: 'Decentraland', usdPrice: 0.58, change: 5.67, volume: 12345.67, marketCap: 1.5e9 },
  { symbol: 'SAND', name: 'The Sandbox', usdPrice: 0.67, change: 4.32, volume: 8765.43, marketCap: 2.0e9 },
  { symbol: 'AXS', name: 'Axie Infinity', usdPrice: 6.68, change: 1.78, volume: 6789.01, marketCap: 1.3e9 },
  { symbol: 'GALA', name: 'Gala', usdPrice: 0.034, change: 6.78, volume: 15678.90, marketCap: 1.5e9 },
  { symbol: 'CHZ', name: 'Chiliz', usdPrice: 0.090, change: 3.45, volume: 23456.78, marketCap: 1.0e9 },
  { symbol: 'IMX', name: 'Immutable X', usdPrice: 1.75, change: 4.56, volume: 7890.12, marketCap: 3.5e9 },
  { symbol: 'ILV', name: 'Illuvium', usdPrice: 50.89, change: 2.90, volume: 2345.67, marketCap: 6.8e8 },
  { symbol: 'PRIME', name: 'Echelon Prime', usdPrice: 9.25, change: 8.90, volume: 4567.89, marketCap: 3.1e8 },
  { symbol: 'RUNE', name: 'THORChain', usdPrice: 5.09, change: 1.45, volume: 5678.90, marketCap: 2.3e9 },
  
  // Meme Coins
  { symbol: 'DOGE', name: 'Dogecoin', usdPrice: 0.34, change: 12.34, volume: 56789.01, marketCap: 6.63e10 },
  { symbol: 'SHIB', name: 'Shiba Inu', usdPrice: 0.000026, change: 8.90, volume: 123456.78, marketCap: 2.01e10 },
  { symbol: 'PEPE', name: 'Pepe', usdPrice: 0.000014, change: 15.67, volume: 89012.34, marketCap: 7.9e9 },
  { symbol: 'BONK', name: 'BONK', usdPrice: 0.000034, change: 23.45, volume: 67890.12, marketCap: 3.4e9 },
  { symbol: 'WIF', name: 'Dogwifhat', usdPrice: 2.59, change: 18.90, volume: 34567.89, marketCap: 3.5e9 },
  { symbol: 'MEW', name: 'Cat in a Dog\'s World', usdPrice: 0.0092, change: 25.67, volume: 23456.78, marketCap: 1.2e9 },
  { symbol: 'POPCAT', name: 'Popcat', usdPrice: 1.42, change: 19.78, volume: 12345.67, marketCap: 1.9e9 },
  { symbol: 'MOG', name: 'Mog', usdPrice: 0.00000176, change: 34.56, volume: 45678.90, marketCap: 9.3e8 },
  { symbol: 'FLOKI', name: 'Floki', usdPrice: 0.000176, change: 12.78, volume: 56789.01, marketCap: 2.2e9 },
  { symbol: 'GOAT', name: 'Goat', usdPrice: 0.593, change: 28.90, volume: 23456.78, marketCap: 7.9e8 },
  { symbol: 'NEIRO', name: 'First Neiro on Ethereum', usdPrice: 0.00117, change: 45.67, volume: 34567.89, marketCap: 1.6e9 },
  { symbol: 'TRUMP', name: 'Official Trump', usdPrice: 50.89, change: 89.12, volume: 123456.78, marketCap: 1.4e10 },
  { symbol: 'MELANIA', name: 'Melania Meme', usdPrice: 3.42, change: 156.78, volume: 89012.34, marketCap: 9.1e8 },
  { symbol: 'FARTCOIN', name: 'Fartcoin', usdPrice: 0.67, change: 78.90, volume: 67890.12, marketCap: 8.9e8 },
  
  // Storage & Infrastructure
  { symbol: 'FIL', name: 'Filecoin', usdPrice: 5.92, change: 2.34, volume: 6789.01, marketCap: 3.5e9 },
  { symbol: 'STORJ', name: 'Storj', usdPrice: 0.58, change: 1.45, volume: 4567.89, marketCap: 3.1e8 },
  { symbol: 'GRT', name: 'The Graph', usdPrice: 0.26, change: 3.78, volume: 12345.67, marketCap: 3.2e9 },
  { symbol: 'ANKR', name: 'Ankr', usdPrice: 0.050, change: 2.90, volume: 8765.43, marketCap: 6.7e8 },
  { symbol: 'LPT', name: 'Livepeer', usdPrice: 17.59, change: 4.32, volume: 3456.78, marketCap: 7.8e8 },
  { symbol: 'RENDER', name: 'Render', usdPrice: 6.68, change: 6.78, volume: 9876.54, marketCap: 3.6e9 },
  { symbol: 'HNT', name: 'Helium', usdPrice: 7.40, change: 1.56, volume: 5678.90, marketCap: 1.6e9 },
  { symbol: 'IOTX', name: 'IoTeX', usdPrice: 0.067, change: 4.56, volume: 12345.67, marketCap: 8.2e8 },
  
  // AI & Technology
  { symbol: 'FET', name: 'Fetch', usdPrice: 1.42, change: 7.89, volume: 7890.12, marketCap: 2.4e9 },
  { symbol: 'TAO', name: 'Bittensor', usdPrice: 509.23, change: 5.67, volume: 1234.56, marketCap: 4.9e9 },
  { symbol: 'VIRTUAL', name: 'Virtuals Protocol', usdPrice: 2.59, change: 12.34, volume: 5678.90, marketCap: 3.4e9 },
  { symbol: 'KAITO', name: 'Kaito', usdPrice: 0.176, change: 8.90, volume: 9876.54, marketCap: 2.3e8 },
  { symbol: 'WLD', name: 'Worldcoin', usdPrice: 2.84, change: 4.56, volume: 6789.01, marketCap: 1.9e9 },
  { symbol: 'ONDO', name: 'Ondo Finance', usdPrice: 1.25, change: 6.78, volume: 8765.43, marketCap: 2.3e9 },
  
  // Other Notable Tokens
  { symbol: 'EOS', name: 'EOS', usdPrice: 0.92, change: 0.89, volume: 4567.89, marketCap: 1.2e9 },
  { symbol: 'XLM', name: 'Stellar', usdPrice: 0.176, change: 2.45, volume: 12345.67, marketCap: 7.2e9 },
  { symbol: 'BAT', name: 'Basic Attention Token', usdPrice: 0.26, change: 1.78, volume: 6789.01, marketCap: 5.1e8 },
  { symbol: 'ETC', name: 'Ethereum Classic', usdPrice: 25.93, change: 2.90, volume: 3456.78, marketCap: 5.1e9 },
  { symbol: 'KSM', name: 'Kusama', usdPrice: 34.26, change: 1.45, volume: 2345.67, marketCap: 4.0e8 },
  { symbol: 'QNT', name: 'Quant', usdPrice: 92.56, change: 3.78, volume: 1234.56, marketCap: 1.5e9 },
  { symbol: 'API3', name: 'API3', usdPrice: 1.75, change: 4.56, volume: 4567.89, marketCap: 3.5e8 },
  { symbol: 'ENS', name: 'Ethereum Name Service', usdPrice: 25.93, change: 2.78, volume: 3456.78, marketCap: 1.1e9 },
  { symbol: 'ACH', name: 'Alchemy Pay', usdPrice: 0.034, change: 6.78, volume: 8765.43, marketCap: 3.0e8 },
  { symbol: 'APE', name: 'ApeCoin', usdPrice: 1.42, change: 3.45, volume: 7890.12, marketCap: 5.7e8 },
  { symbol: 'ETHW', name: 'EthereumPoW', usdPrice: 3.42, change: -1.23, volume: 2345.67, marketCap: 3.8e8 },
  { symbol: 'JUP', name: 'Jupiter', usdPrice: 0.92, change: 8.90, volume: 9876.54, marketCap: 1.8e9 },
  { symbol: 'TNSR', name: 'Tensor', usdPrice: 0.67, change: 12.34, volume: 4567.89, marketCap: 8.9e8 },
];

const MARKET_TRENDS = [
  { category: 'Trending Up', coins: ['TRUMP', 'MELANIA', 'FARTCOIN', 'VIRTUAL', 'PEPE', 'BONK'] },
  { category: 'Top Gainers', coins: ['MELANIA', 'TRUMP', 'FARTCOIN', 'NEIRO', 'GOAT', 'MOG'] },
  { category: 'Top Volume', coins: ['BTC', 'ETH', 'TRUMP', 'USDC', 'DOGE', 'SHIB'] },
  { category: 'DeFi Leaders', coins: ['UNI', 'AAVE', 'COMP', 'LINK', 'CRV', 'MKR'] },
  { category: 'Layer 1s', coins: ['SOL', 'ADA', 'DOT', 'AVAX', 'NEAR', 'TON'] },
  { category: 'Meme Coins', coins: ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'POPCAT'] },
];

export default function CryptoTrading() {
  const [selectedPair, setSelectedPair] = useState('BTC/USD');
  const [selectedCoin, setSelectedCoin] = useState(VIRGOCX_CRYPTOCURRENCIES[0]); // Default to first coin (BTC)
  const [baseCurrency, setBaseCurrency] = useState('USD'); // Default to USD
  const [marketTrendsCurrency, setMarketTrendsCurrency] = useState('USD'); // Separate currency for market trends
  const [orderType, setOrderType] = useState('market');
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Currency conversion rates (example rates, in real app would come from API)
  const currencyRates = {
    USD: 1.00,
    CAD: 1.33,
    EUR: 0.85,
    GBP: 0.75,
    AUD: 1.42,
    HKD: 7.80,
    SGD: 1.35,
  };

  // Convert USD price to selected currency
  const convertPrice = (usdPrice, targetCurrency) => {
    return (usdPrice * currencyRates[targetCurrency]).toFixed(usdPrice < 1 ? 6 : 2);
  };

  // Create trading pairs with converted prices for trading panel
  const VIRGOCX_TRADING_PAIRS = VIRGOCX_CRYPTOCURRENCIES.map(crypto => ({
    ...crypto,
    pair: `${crypto.symbol}/${baseCurrency}`,
    price: parseFloat(convertPrice(crypto.usdPrice, baseCurrency))
  }));

  // Create trading pairs with converted prices for market trends
  const MARKET_TRENDS_TRADING_PAIRS = VIRGOCX_CRYPTOCURRENCIES.map(crypto => ({
    ...crypto,
    pair: `${crypto.symbol}/${marketTrendsCurrency}`,
    price: parseFloat(convertPrice(crypto.usdPrice, marketTrendsCurrency))
  }));

  // Filter coins based on search (for trading pairs list)
  const filteredCoins = MARKET_TRENDS_TRADING_PAIRS.filter(coin =>
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sample price chart data
  const priceData = Array.from({ length: 30 }, (_, i) => ({
    time: `${i + 1}d`,
    price: selectedCoin?.price * (0.95 + Math.random() * 0.1),
  }));

  const handleTradeOnVirgoCX = (symbol: string) => {
    // Open VirgoCX trading page in new tab
    window.open(`https://virgocx.com/trade/${symbol.toLowerCase()}`, '_blank');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cryptocurrency Trading</h1>
          <p className="text-muted-foreground mt-1">Trade cryptocurrencies directly on VirgoCX</p>
        </div>
        <Button onClick={() => window.open('https://virgocx.com', '_blank')} className="gap-2">
          <ExternalLink className="w-4 h-4" />
          Open VirgoCX
        </Button>
      </div>

      {/* Market Trends Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Market Trends on VirgoCX
              </CardTitle>
              <CardDescription>
                Live market data and trending cryptocurrencies
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Display Currency:</label>
              <Select value={marketTrendsCurrency} onValueChange={setMarketTrendsCurrency}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-xs text-muted-foreground">{currency.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {MARKET_TRENDS.map((trend) => (
              <div key={trend.category} className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">{trend.category}</h4>
                <div className="space-y-1">
                  {trend.coins.slice(0, 5).map((symbol) => {
                    const coin = MARKET_TRENDS_TRADING_PAIRS.find(c => c.symbol === symbol);
                    return coin ? (
                      <div key={symbol} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{coin.symbol}</span>
                        <div className="flex items-center gap-1">
                          <span>{BASE_CURRENCIES.find(c => c.code === marketTrendsCurrency)?.symbol || '$'}{coin.price.toFixed(coin.price < 1 ? 6 : 2)}</span>
                          <span className={`text-xs flex items-center gap-1 ${
                            coin.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {coin.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {coin.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coin List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>VirgoCX Trading Pairs</CardTitle>
              <div className="text-sm text-muted-foreground">
                Prices in {BASE_CURRENCIES.find(c => c.code === marketTrendsCurrency)?.symbol || '$'} {marketTrendsCurrency}
              </div>
            </div>
            <div className="relative">
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCoins.map((coin) => (
                <div
                  key={coin.symbol}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPair === coin.pair
                      ? 'bg-blue-50 border-blue-200 border'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  onClick={() => {
                    setSelectedPair(coin.pair);
                    setSelectedCoin(coin);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{coin.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {marketTrendsCurrency}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{coin.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{BASE_CURRENCIES.find(c => c.code === marketTrendsCurrency)?.symbol || '$'}{coin.price.toFixed(coin.price < 1 ? 6 : 2)}</div>
                      <div className={`text-sm flex items-center gap-1 ${
                        coin.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {coin.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {coin.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>



        {/* Trading Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Trade on VirgoCX</CardTitle>
            <CardDescription>
              Execute trades directly on VirgoCX platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Base Currency Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Currency</label>
                <Select value={baseCurrency} onValueChange={(value) => {
                  setBaseCurrency(value);
                  setSelectedPair(`${selectedCoin?.symbol || 'BTC'}/${value}`);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select base currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE_CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-sm text-muted-foreground">{currency.symbol}</span>
                          <span className="text-sm text-muted-foreground">{currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertDescription>
                  Trades will be executed on VirgoCX.com. You'll be redirected to complete the transaction.
                </AlertDescription>
              </Alert>

              <Tabs value={tradeType} onValueChange={setTradeType}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy" className="text-green-600">Buy</TabsTrigger>
                  <TabsTrigger value="sell" className="text-red-600">Sell</TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Cryptocurrency</label>
                    <Select value={selectedCoin?.symbol} onValueChange={(value) => {
                      const coin = VIRGOCX_TRADING_PAIRS.find(c => c.symbol === value);
                      setSelectedCoin(coin || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a cryptocurrency" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {VIRGOCX_TRADING_PAIRS.map((coin) => (
                          <SelectItem key={coin.symbol} value={coin.symbol}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{coin.symbol}</span>
                              <span className="text-muted-foreground">- {coin.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {BASE_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || '$'}{coin.price.toFixed(coin.price < 1 ? 6 : 2)} {baseCurrency}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order Type</label>
                    <Select value={orderType} onValueChange={setOrderType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market Order</SelectItem>
                        <SelectItem value="limit">Limit Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount ({selectedCoin?.symbol})</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  {orderType === 'limit' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price ({baseCurrency})</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  )}

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleTradeOnVirgoCX(selectedCoin?.symbol || 'BTC')}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Buy {selectedCoin?.symbol} on VirgoCX
                  </Button>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Cryptocurrency</label>
                    <Select value={selectedCoin?.symbol} onValueChange={(value) => {
                      const coin = VIRGOCX_TRADING_PAIRS.find(c => c.symbol === value);
                      setSelectedCoin(coin || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a cryptocurrency" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {VIRGOCX_TRADING_PAIRS.map((coin) => (
                          <SelectItem key={coin.symbol} value={coin.symbol}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{coin.symbol}</span>
                              <span className="text-muted-foreground">- {coin.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {BASE_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || '$'}{coin.price.toFixed(coin.price < 1 ? 6 : 2)} {baseCurrency}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Order Type</label>
                    <Select value={orderType} onValueChange={setOrderType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market Order</SelectItem>
                        <SelectItem value="limit">Limit Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount ({selectedCoin?.symbol})</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  {orderType === 'limit' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price ({baseCurrency})</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                  )}

                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => handleTradeOnVirgoCX(selectedCoin?.symbol || 'BTC')}
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Sell {selectedCoin?.symbol} on VirgoCX
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Total:</span>
                  <span className="font-medium">
                    {BASE_CURRENCIES.find(c => c.code === baseCurrency)?.symbol || '$'}{amount && selectedCoin ? (parseFloat(amount) * selectedCoin.price).toFixed(2) : '0.00'} {baseCurrency}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}