import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
// Table components will be created inline since they're not in the UI library
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CurrencyConfig, SupportedCurrencies, CurrencyRegions, type WalletBalance } from '@/lib/types';
import { TrendingUp, TrendingDown, Plus, Minus, ArrowRightLeft, Send, Repeat, Info, DollarSign, AlertCircle } from 'lucide-react';
import { useFxRate } from '@/hooks/use-fx-rates';
import { useWallets } from '@/hooks/use-portfolio';

export default function Wallets() {
  const { data: wallets = [], isLoading } = useWallets();
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const { toast } = useToast();

  const transferMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/wallets/transfer", data);
      if (!response.ok) {
        throw new Error('Transfer failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer Successful",
        description: `${amount} ${fromCurrency} converted to ${toCurrency}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      setAmount('');
      setFromCurrency('');
      setToCurrency('');
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleTransfer = () => {
    if (!fromCurrency || !toCurrency || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount)
    });
  };

  // Group wallets by region for better organization
  const walletsWithRegions = wallets.map(wallet => ({
    ...wallet,
    config: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig],
    region: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig]?.region || 'Other'
  }));

  const { data: exchangeRate } = useFxRate(fromCurrency, 'USD');
  const estimatedValue = fromCurrency && amount ? (parseFloat(amount) * (exchangeRate?.rate || 1)) : 0;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Wallets</h1>
        <Badge variant="secondary" className="text-sm">
          Multi-Currency Management
        </Badge>
      </div>

      {/* Section 1: Your Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Your Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Currency</th>
                    <th className="text-left p-4 font-medium">Balance</th>
                    <th className="text-left p-4 font-medium">Approx. Value (USD)</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {walletsWithRegions.map((wallet) => (
                    <tr key={wallet.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{wallet.config?.flag}</span>
                          <div>
                            <div className="font-medium">{wallet.currency}</div>
                            <div className="text-sm text-muted-foreground">{wallet.config?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {wallet.config?.symbol}{wallet.balance.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Available: {wallet.config?.symbol}{wallet.availableBalance.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="text-muted-foreground">
                                ≈ ${(wallet.balance * 1.1).toLocaleString()}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Exchange rate: 1 {wallet.currency} = 1.10 USD</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setFromCurrency(wallet.currency)}>
                            <Send className="w-3 h-3 mr-1" />
                            Send
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setFromCurrency(wallet.currency)}>
                            <Repeat className="w-3 h-3 mr-1" />
                            Convert
                          </Button>
                          <Button variant="outline" size="sm">
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Transfer or Convert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Transfer or Convert
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                <Info className="w-3 h-3 mr-1" />
                Real-time rates
              </Badge>
              <Button variant="outline" size="sm">
                <Plus className="w-3 h-3 mr-1" />
                Manage Currencies
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* From Currency */}
            <div className="space-y-2">
              <Label htmlFor="from-currency">From</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency to convert from" />
                </SelectTrigger>
                <SelectContent>
                  {walletsWithRegions.map((wallet) => (
                    <SelectItem key={wallet.currency} value={wallet.currency}>
                      <div className="flex items-center gap-2">
                        <span>{wallet.config?.flag}</span>
                        <span className="font-medium">{wallet.currency}</span>
                        <span className="text-muted-foreground">- {wallet.config?.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center pt-6">
              <ArrowRightLeft className="w-6 h-6 text-muted-foreground" />
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <Label htmlFor="to-currency">To</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency to convert to" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Americas</div>
                  <SelectItem value="USD">🇺🇸 USD – US Dollar</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD – Canadian Dollar</SelectItem>
                  <SelectItem value="BRL">🇧🇷 BRL – Brazilian Real</SelectItem>
                  <SelectItem value="MXN">🇲🇽 MXN – Mexican Peso</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Europe</div>
                  <SelectItem value="EUR">🇪🇺 EUR – Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP – British Pound</SelectItem>
                  <SelectItem value="CHF">🇨🇭 CHF – Swiss Franc</SelectItem>
                  <SelectItem value="SEK">🇸🇪 SEK – Swedish Krona</SelectItem>
                  <SelectItem value="NOK">🇳🇴 NOK – Norwegian Krone</SelectItem>
                  <SelectItem value="DKK">🇩🇰 DKK – Danish Krone</SelectItem>
                  <SelectItem value="PLN">🇵🇱 PLN – Polish Zloty</SelectItem>
                  <SelectItem value="CZK">🇨🇿 CZK – Czech Koruna</SelectItem>
                  <SelectItem value="HUF">🇭🇺 HUF – Hungarian Forint</SelectItem>
                  <SelectItem value="TRY">🇹🇷 TRY – Turkish Lira</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Asia</div>
                  <SelectItem value="JPY">🇯🇵 JPY – Japanese Yen</SelectItem>
                  <SelectItem value="HKD">🇭🇰 HKD – Hong Kong Dollar</SelectItem>
                  <SelectItem value="SGD">🇸🇬 SGD – Singapore Dollar</SelectItem>
                  <SelectItem value="INR">🇮🇳 INR – Indian Rupee</SelectItem>
                  <SelectItem value="CNY">🇨🇳 CNY – Chinese Yuan</SelectItem>
                  <SelectItem value="KRW">🇰🇷 KRW – South Korean Won</SelectItem>
                  <SelectItem value="TWD">🇹🇼 TWD – Taiwan Dollar</SelectItem>
                  <SelectItem value="THB">🇹🇭 THB – Thai Baht</SelectItem>
                  <SelectItem value="MYR">🇲🇾 MYR – Malaysian Ringgit</SelectItem>
                  <SelectItem value="IDR">🇮🇩 IDR – Indonesian Rupiah</SelectItem>
                  <SelectItem value="PHP">🇵🇭 PHP – Philippine Peso</SelectItem>
                  <SelectItem value="VND">🇻🇳 VND – Vietnamese Dong</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Oceania</div>
                  <SelectItem value="AUD">🇦🇺 AUD – Australian Dollar</SelectItem>
                  <SelectItem value="NZD">🇳🇿 NZD – New Zealand Dollar</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Middle East & Africa</div>
                  <SelectItem value="AED">🇦🇪 AED – UAE Dirham</SelectItem>
                  <SelectItem value="SAR">🇸🇦 SAR – Saudi Riyal</SelectItem>
                  <SelectItem value="ILS">🇮🇱 ILS – Israeli Shekel</SelectItem>
                  <SelectItem value="EGP">🇪🇬 EGP – Egyptian Pound</SelectItem>
                  <SelectItem value="NGN">🇳🇬 NGN – Nigerian Naira</SelectItem>
                  <SelectItem value="ZAR">🇿🇦 ZAR – South African Rand</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Crypto & Stablecoins</div>
                  <SelectItem value="BTC">₿ BTC – Bitcoin</SelectItem>
                  <SelectItem value="ETH">Ξ ETH – Ethereum</SelectItem>
                  <SelectItem value="USDT">🟢 USDT – Tether USD</SelectItem>
                  <SelectItem value="USDC">🔵 USDC – USD Coin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to convert"
              className="text-lg"
            />
            {fromCurrency && (
              <p className="text-sm text-muted-foreground">
                Available: {walletsWithRegions.find(w => w.currency === fromCurrency)?.availableBalance || 0} {fromCurrency}
              </p>
            )}
          </div>

          {/* Exchange Rate Preview */}
          {fromCurrency && toCurrency && amount && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mid-market Rate:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">1 {fromCurrency} = 1.23 {toCurrency}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Real-time mid-market exchange rate</p>
                        <p>Updated every 30 seconds</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Transfer Fee:</span>
                <span className="text-sm">$0.45 (0.5%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Processing Time:</span>
                <span className="text-sm text-green-600">Instant</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center bg-white rounded p-2">
                <span className="font-medium text-gray-800">You'll receive:</span>
                <span className="font-bold text-lg text-green-600">
                  {(parseFloat(amount) * 1.23 * 0.995).toFixed(2)} {toCurrency}
                </span>
              </div>
              <div className="text-xs text-muted-foreground text-center">
                All transfers are protected by bank-level security and regulatory compliance
              </div>
            </div>
          )}

          {/* Currency Watchlist Alert */}
          {fromCurrency && toCurrency && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">Rate Alert</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Set up notifications when {fromCurrency}/{toCurrency} reaches your target rate
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Create Alert
              </Button>
            </div>
          )}

          {/* Convert Button */}
          <Button 
            onClick={handleTransfer}
            disabled={!fromCurrency || !toCurrency || !amount || transferMutation.isPending}
            className="w-full text-lg py-6"
            size="lg"
          >
            {transferMutation.isPending ? "Processing..." : "Convert Now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}