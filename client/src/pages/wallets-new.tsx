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
import { TrendingUp, TrendingDown, Plus, Minus, ArrowRightLeft, ArrowUpDown, Send, Repeat, Info, DollarSign, AlertCircle } from 'lucide-react';
import { useFxRate } from '@/hooks/use-fx-rates';
import { useWallets } from '@/hooks/use-portfolio';

// Helper functions for exchange rate display
const useExchangeRateDisplay = (fromCurrency: string, toCurrency: string) => {
  const { data: fxRate } = useFxRate(fromCurrency, toCurrency);
  if (!fxRate) return "Loading...";
  
  const rate = parseFloat(fxRate.rate);
  const displayRate = rate > 1 ? rate.toFixed(2) : rate.toFixed(6);
  
  return `1 ${fromCurrency} = ${displayRate} ${toCurrency}`;
};

// Exchange Rate Display Component for Transfer Modal
function ExchangeRateDisplay({ fromCurrency, toCurrency, amount }: { fromCurrency: string; toCurrency: string; amount: string }) {
  const { data: fxRate } = useFxRate(fromCurrency, toCurrency);
  
  if (!fxRate) {
    return (
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Loading exchange rate...</span>
      </div>
    );
  }

  const rate = parseFloat(fxRate.rate);
  const displayRate = rate > 1 ? rate.toFixed(2) : rate.toFixed(6);
  
  let convertedAmount = '0.00';
  let sendingAmount = '0.00';
  
  console.log('ExchangeRateDisplay Debug:', { amount, rate, fromCurrency, toCurrency, hasAmount: !!amount });
  
  if (amount && String(amount).trim() !== '') {
    const amountNumber = parseFloat(String(amount));
    const rateNumber = parseFloat(rate);
    
    if (!isNaN(amountNumber) && !isNaN(rateNumber) && amountNumber > 0) {
      // Simple calculation: amount × exchange rate - 0.5% fee
      const grossConverted = amountNumber * rateNumber;
      const transactionFee = grossConverted * 0.005; // 0.5% fee
      const netConverted = grossConverted - transactionFee;
      
      convertedAmount = netConverted.toFixed(2);
      sendingAmount = amountNumber.toFixed(2);
      
      console.log('Calculation Result:', { 
        amountNumber, 
        rateNumber, 
        grossConverted, 
        transactionFee, 
        netConverted, 
        convertedAmount 
      });
    } else {
      console.log('Invalid numbers:', { amountNumber, rateNumber });
    }
  } else {
    console.log('No amount provided');
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Exchange Rate:</span>
        <span className="font-mono">1 {fromCurrency} = {displayRate} {toCurrency}</span>
      </div>
      
      {/* Conversion Summary Box */}
      <div className="bg-white rounded-lg border-2 border-green-200 p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">You're sending:</span>
          <span className="text-sm font-medium">{sendingAmount || '0.00'} {fromCurrency}</span>
        </div>
        
        <div className="border-t border-gray-100 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-gray-900">You'll receive:</span>
            <span className="text-xl font-bold text-green-600">{convertedAmount || '0.00'} {toCurrency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to display wallet balance in selected currency
function WalletValueDisplay({ wallet, displayCurrency }: { wallet: any, displayCurrency: string }) {
  const { data: fxRate } = useFxRate(wallet.currency, displayCurrency);
  
  if (!fxRate || wallet.currency === displayCurrency) {
    // Show original balance if same currency or no rate
    const config = CurrencyConfig[displayCurrency as keyof typeof CurrencyConfig];
    const balance = wallet.balance ? parseFloat(wallet.balance) : 0;
    const formattedBalance = balance > 1 ? balance.toLocaleString() : balance.toFixed(6);
    
    return (
      <div>
        <div className="text-muted-foreground">
          {config?.symbol}{formattedBalance}
        </div>
        {wallet.currency !== displayCurrency && (
          <div className="text-xs text-gray-500 mt-1">
            1 {wallet.currency} = 1 {displayCurrency}
          </div>
        )}
      </div>
    );
  }
  
  const rate = parseFloat(fxRate.rate);
  const convertedValue = parseFloat(wallet.balance || '0') * rate;
  const config = CurrencyConfig[displayCurrency as keyof typeof CurrencyConfig];
  
  // Format based on value size
  const formattedValue = convertedValue > 1 ? convertedValue.toLocaleString() : convertedValue.toFixed(6);
  const displayRate = rate > 1 ? rate.toFixed(2) : rate.toFixed(6);
  
  return (
    <div>
      <div className="text-muted-foreground">
        ≈ {config?.symbol}{formattedValue}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        1 {wallet.currency} = {displayRate} {displayCurrency}
      </div>
    </div>
  );
}

export default function Wallets() {
  const { data: wallets = [], isLoading } = useWallets();
  const [fromCurrency, setFromCurrency] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState('USD'); // New state for balance display currency
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [payerPayId, setPayerPayId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerAccountNumber, setPayerAccountNumber] = useState('');
  const [payerBsb, setPayerBsb] = useState('');
  const { toast } = useToast();
  
  // Exchange rate display helpers
  const exchangeRateText = useExchangeRateDisplay(fromCurrency, toCurrency);

  const transferMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number }) => {
      console.log("Making transfer API call with data:", data);
      const response = await apiRequest("POST", "/api/fx-exchange", data);
      console.log("Transfer API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Transfer API error:", errorData);
        throw new Error(errorData.error || `Transfer failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Transfer API result:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Transfer mutation onSuccess called with data:", data);
      toast({
        title: "✅ Transfer Successful",
        description: `${amount} ${fromCurrency} converted to ${toCurrency}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setTransferModalOpen(false);
      setAmount('');
      setFromCurrency('');
      setToCurrency('');
    },
    onError: (error: any) => {
      console.error("Transfer mutation onError called with error:", error);
      
      let errorMessage = "Please try again later.";
      if (error.message && error.message.includes("400")) {
        errorMessage = "Insufficient balance. Please check your available funds.";
      } else if (error.message) {
        errorMessage = error.message.replace("Transfer failed: 400", "Insufficient balance");
      }
      
      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string }) => {
      console.log("Making deposit API call with data:", data);
      const response = await apiRequest("POST", "/api/wallets/deposit", data);
      console.log("Deposit API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Deposit API error:", errorText);
        throw new Error(`Deposit failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Deposit API result:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Deposit mutation onSuccess called with data:", data);
      toast({
        title: "✅ Deposit Successful",
        description: `${amount} ${selectedWallet?.currency} has been added to your wallet`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setDepositModalOpen(false);
      setAmount('');
      setDepositMethod('');
    },
    onError: (error: any) => {
      console.error("Deposit mutation onError called with error:", error);
      toast({
        title: "Deposit Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string }) => {
      console.log("Making withdraw API call with data:", data);
      const response = await apiRequest("POST", "/api/wallets/withdraw", data);
      console.log("Withdraw API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Withdraw API error:", errorText);
        throw new Error(`Withdrawal failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Withdraw API result:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Withdraw mutation onSuccess called with data:", data);
      toast({
        title: "✅ Withdrawal Successful", 
        description: `${amount} ${selectedWallet?.currency} has been withdrawn from your wallet`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setWithdrawModalOpen(false);
      setAmount('');
      setWithdrawMethod('');
    },
    onError: (error: any) => {
      console.error("Withdraw mutation onError called with error:", error);
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleDeposit = () => {
    console.log("handleDeposit called with:", {
      selectedWallet: selectedWallet?.currency,
      amount,
      depositMethod
    });

    if (!selectedWallet || !amount || !depositMethod) {
      console.log("Validation failed - missing fields");
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting deposit mutation...");
    depositMutation.mutate({
      type: "deposit",
      currency: selectedWallet.currency,
      amount: amount
    });
  };

  const handleWithdraw = () => {
    if (!selectedWallet || !amount || !withdrawMethod) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      type: "withdraw",
      currency: selectedWallet.currency,
      amount: amount
    });
  };

  const handleTransfer = () => {
    const sourceWallet = selectedWallet;
    const sourceCurrency = sourceWallet?.currency || fromCurrency;
    
    console.log("handleTransfer called with:", {
      fromCurrency: sourceCurrency,
      toCurrency,
      amount
    });

    if (!sourceCurrency || !toCurrency || !amount) {
      console.log("Validation failed - missing fields");
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (sourceCurrency === toCurrency) {
      console.log("Validation failed - same currencies");
      toast({
        title: "Invalid Transfer",
        description: "Please select different currencies.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting transfer mutation...");
    transferMutation.mutate({
      fromCurrency: sourceCurrency,
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Your Balances
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-muted-foreground">Show values in:</span>
              <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD', 'BTC', 'ETH', 'USDT', 'USDC'].map(currency => {
                    const config = CurrencyConfig[currency as keyof typeof CurrencyConfig];
                    return (
                      <SelectItem key={currency} value={currency}>
                        <div className="flex items-center gap-2">
                          <span>{config?.flag}</span>
                          <span>{currency}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
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
                    <th className="text-left p-4 font-medium">Approx. Value ({displayCurrency})</th>
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
                            {wallet.config?.symbol}{wallet.balance ? parseFloat(wallet.balance).toLocaleString() : '0.00'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Available: {wallet.config?.symbol}{wallet.availableBalance ? parseFloat(wallet.availableBalance).toLocaleString() : '0.00'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <WalletValueDisplay wallet={wallet} displayCurrency={displayCurrency} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setDepositModalOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Deposit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setWithdrawModalOpen(true);
                            }}
                          >
                            <Minus className="w-4 h-4 mr-1" />
                            Withdraw
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setTransferModalOpen(true);
                            }}
                          >
                            <ArrowUpDown className="w-4 h-4 mr-1" />
                            Transfer
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-3 h-3 mr-1" />
                    Manage Currencies
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Manage Currencies</DialogTitle>
                    <DialogDescription>
                      Add or remove currencies from your wallet
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>Most-used currencies are pinned to the top of your transfer dropdown for easy access.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Available Currencies</h4>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {SupportedCurrencies.filter(curr => !walletsWithRegions.find(w => w.currency === curr)).map(currency => {
                          const config = CurrencyConfig[currency as keyof typeof CurrencyConfig];
                          return (
                            <Button
                              key={currency}
                              variant="outline"
                              size="sm"
                              className="justify-start"
                              onClick={() => {
                                // Create new wallet for this currency
                                alert(`Adding ${currency} wallet - This will create a new ${config?.name} balance`);
                              }}
                            >
                              <span className="mr-2">{config?.flag}</span>
                              {currency}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Additional Features Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <h4 className="font-medium text-sm">Local Account Details</h4>
              <p className="text-xs text-muted-foreground">Get IBAN, BSB, Sort Code for 10+ currencies</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
              <h4 className="font-medium text-sm">Push Notifications</h4>
              <p className="text-xs text-muted-foreground">Alerts for large transactions & rate changes</p>
            </div>
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
              <h4 className="font-medium text-sm">Instant Transfers</h4>
              <p className="text-xs text-muted-foreground">Send to Wise users & bank accounts instantly</p>
            </div>
          </div>
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
                  {/* Most-used currencies pinned to top */}
                  <div className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50">⭐ Most Used</div>
                  <SelectItem value="EUR">🇪🇺 EUR – Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP – British Pound</SelectItem>
                  <SelectItem value="JPY">🇯🇵 JPY – Japanese Yen</SelectItem>
                  <SelectItem value="AUD">🇦🇺 AUD – Australian Dollar</SelectItem>

                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Americas</div>
                  <SelectItem value="USD">🇺🇸 USD – US Dollar</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD – Canadian Dollar</SelectItem>
                  <SelectItem value="BRL">🇧🇷 BRL – Brazilian Real</SelectItem>
                  <SelectItem value="MXN">🇲🇽 MXN – Mexican Peso</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Europe</div>
                  <SelectItem value="CHF">🇨🇭 CHF – Swiss Franc</SelectItem>
                  <SelectItem value="SEK">🇸🇪 SEK – Swedish Krona</SelectItem>
                  <SelectItem value="NOK">🇳🇴 NOK – Norwegian Krone</SelectItem>
                  <SelectItem value="DKK">🇩🇰 DKK – Danish Krone</SelectItem>
                  <SelectItem value="PLN">🇵🇱 PLN – Polish Zloty</SelectItem>
                  <SelectItem value="CZK">🇨🇿 CZK – Czech Koruna</SelectItem>
                  <SelectItem value="HUF">🇭🇺 HUF – Hungarian Forint</SelectItem>
                  <SelectItem value="TRY" disabled>🇹🇷 TRY – Turkish Lira (Temporarily unavailable)</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Asia</div>
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
                  <span className="text-sm font-mono">{exchangeRateText}</span>
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
                  Loading...
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-2">
                    Create Alert
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Currency Rate Alert</DialogTitle>
                    <DialogDescription>
                      Get notified when {fromCurrency}/{toCurrency} reaches your target rate
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Rate</Label>
                      <div className="p-2 bg-gray-50 rounded text-sm">
                        1 {fromCurrency} = 1.23 {toCurrency}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Target Rate</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="e.g., 1.25"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alert Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Rate goes above target</SelectItem>
                          <SelectItem value="below">Rate goes below target</SelectItem>
                          <SelectItem value="reaches">Rate reaches target exactly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      Create Rate Alert
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Convert Button */}
          <Button 
            onClick={handleTransfer}
            disabled={!fromCurrency || !toCurrency || !amount || transferMutation.isPending}
            className="w-full text-lg py-6"
            size="lg"
          >
            {transferMutation.isPending ? "Converting..." : "Convert Now"}
          </Button>
        </CardContent>
      </Card>

      {/* Deposit Modal */}
      <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Deposit {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Add funds to your {selectedWallet?.currency} wallet using multiple payment methods
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="deposit-method-type">Deposit Method</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deposit method" />
                </SelectTrigger>
                <SelectContent>
                  {['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) ? (
                    <>
                      <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                      <SelectItem value="payid">📱 PayID (Australia Only)</SelectItem>
                      <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="blockchain">🔗 Blockchain Transfer</SelectItem>
                      <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                      <SelectItem value="payid">📱 PayID (Buy with AUD)</SelectItem>
                      <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {depositMethod && depositMethod !== 'blockchain' && (
              <div>
                <Label htmlFor="deposit-amount">
                  {!['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) && (depositMethod === 'payid' || depositMethod === 'bank_transfer')
                    ? 'Amount (AUD)'
                    : `Amount (${selectedWallet?.currency || ''})`
                  }
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={!['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) ? "Enter AUD amount" : "Enter amount"}
                />
                {selectedWallet && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current balance: {selectedWallet.balance} {selectedWallet.currency}
                    {!['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) && (
                      <span className="block">Exchange rate: 1 AUD ≈ {selectedWallet.currency === 'BTC' ? '0.000023 BTC' : selectedWallet.currency === 'ETH' ? '0.00031 ETH' : `0.98 ${selectedWallet.currency}`}</span>
                    )}
                  </p>
                )}
              </div>
            )}

            {depositMethod === 'blockchain' && !['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border mx-auto w-fit mb-3">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded flex flex-col items-center justify-center text-xs font-mono text-gray-600 p-2 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded"></div>
                      <div className="relative z-10 text-center leading-tight">
                        <div className="text-[6px] font-bold mb-1">QR CODE</div>
                        <div className="grid grid-cols-8 gap-[1px] mb-1">
                          {Array.from({length: 64}).map((_, i) => (
                            <div key={i} className={`w-1 h-1 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'} rounded-[1px]`}></div>
                          ))}
                        </div>
                        <div className="text-[5px] opacity-70 break-all">
                          {selectedWallet.currency === "BTC" 
                            ? "bc1qxy2k...0wlh" 
                            : selectedWallet.currency === "ETH"
                            ? "0x742d...f1a2"
                            : selectedWallet.currency === "USDT" 
                            ? "0x742d...f1a2"
                            : "0x456e...5D6e7"
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Scan QR code with your wallet app or copy address below</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label>Wallet Address ({selectedWallet.currency} Network)</Label>
                    <div className="flex space-x-2">
                      <Input 
                        value={selectedWallet.currency === "BTC" 
                          ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" 
                          : selectedWallet.currency === "ETH"
                          ? "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2"
                          : selectedWallet.currency === "USDT" 
                          ? "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2"
                          : "0x456e7B8F12C3d4e5F6a7B8c9D0e1F2a3B4c5D6e7"
                        } 
                        readOnly 
                        className="font-mono text-xs"
                      />
                      <Button variant="outline" size="sm" onClick={() => {
                        const address = selectedWallet.currency === "BTC" 
                          ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" 
                          : selectedWallet.currency === "ETH"
                          ? "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2"
                          : selectedWallet.currency === "USDT" 
                          ? "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2"
                          : "0x456e7B8F12C3d4e5F6a7B8c9D0e1F2a3B4c5D6e7";
                        navigator.clipboard.writeText(address);
                        toast({
                          title: "Address Copied",
                          description: "Wallet address copied to clipboard",
                        });
                      }}>
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    const demoAmount = selectedWallet.currency === "BTC" ? "0.1" : 
                                    selectedWallet.currency === "ETH" ? "1.0" : "1000.00";
                    depositMutation.mutate({
                      type: "deposit",
                      currency: selectedWallet.currency,
                      amount: demoAmount,
                    });
                  }} 
                  variant="outline" 
                  className="w-full"
                  disabled={depositMutation.isPending}
                >
                  {depositMutation.isPending ? "Processing..." : `Demo Deposit (${selectedWallet.currency})`}
                </Button>
              </div>
            ) : depositMethod && depositMethod !== 'blockchain' && (
              <>
                {depositMethod === 'card' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">💳 Credit/Debit Card</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Visa, Mastercard, American Express accepted</p>
                        <p>• Instant processing</p>
                        <p>• Fee: 2.9% + $0.30 AUD</p>
                        <p>• Limits: $50 - $10,000 AUD per transaction</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="card-number" className="text-xs">Card Number</Label>
                        <Input 
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-expiry" className="text-xs">Expiry Date</Label>
                        <Input 
                          id="card-expiry"
                          placeholder="MM/YY"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-cvv" className="text-xs">CVV</Label>
                        <Input 
                          id="card-cvv"
                          placeholder="123"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-name" className="text-xs">Cardholder Name</Label>
                        <Input 
                          id="card-name"
                          placeholder="John Doe"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {depositMethod === 'payid' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">📱 PayID (Australia Only)</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Available in Australia only</p>
                        <p>• Instant transfers via NPP</p>
                        <p>• Use your email or mobile number</p>
                        <p>• No fees for transfers</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="payid-identifier" className="text-xs">Your PayID</Label>
                        <Input 
                          id="payid-identifier"
                          placeholder="your.email@example.com or +61400000000"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="payid-name" className="text-xs">Full Name</Label>
                        <Input 
                          id="payid-name"
                          placeholder="John Chen"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {depositMethod === 'bank_transfer' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">🏦 Bank Transfer</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• International transfers accepted</p>
                        <p>• Processing time: 1-3 business days</p>
                        <p>• Include reference number in transfer</p>
                        <p>• SWIFT: VIRGOAU33</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="bank-name" className="text-xs">Your Name</Label>
                        <Input 
                          id="bank-name"
                          placeholder="John Chen"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank-bsb" className="text-xs">BSB (if Australian)</Label>
                        <Input 
                          id="bank-bsb"
                          placeholder="123-456"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank-account" className="text-xs">Account Number</Label>
                        <Input 
                          id="bank-account"
                          placeholder="12345678"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <Button 
                    onClick={handleDeposit}
                    disabled={depositMutation.isPending || !depositMethod || !amount}
                    className="flex-1 h-8 text-sm"
                  >
                    {depositMutation.isPending ? "Processing..." : 
                     !['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) ? `Purchase ${selectedWallet.currency}` : "Submit Deposit Request"}
                  </Button>
                  <Button variant="outline" className="h-8 text-sm" onClick={() => {
                    setDepositModalOpen(false);
                    setAmount("");
                    setDepositMethod("");
                  }}>
                    Close
                  </Button>
                </div>
              </>
            )}
            
            {(!depositMethod || depositMethod === 'blockchain') && (
              <Button variant="outline" className="w-full h-8 text-sm" onClick={() => {
                setDepositModalOpen(false);
                setAmount("");
                setDepositMethod("");
              }}>
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-[400px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Withdraw {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Withdraw funds from your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="withdraw-method">Withdrawal Method</Label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select withdrawal method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="withdraw-amount">Amount</Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
              {selectedWallet && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {selectedWallet.availableBalance} {selectedWallet.currency}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 text-sm">🏦 Bank Transfer Instructions</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Funds transferred to your registered bank account</p>
                  <p>• Processing time: 1-3 business days</p>
                  <p>• Withdrawal fee: $25.00</p>
                  <p>• Please ensure your bank details are up to date</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="withdraw-bank-name" className="text-xs">Bank Account Holder Name</Label>
                  <Input 
                    id="withdraw-bank-name"
                    placeholder="John Chen"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="withdraw-bsb" className="text-xs">BSB (if Australian)</Label>
                  <Input 
                    id="withdraw-bsb"
                    placeholder="123-456"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="withdraw-account-number" className="text-xs">Account Number</Label>
                  <Input 
                    id="withdraw-account-number"
                    placeholder="12345678"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <Button 
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="flex-1 h-8 text-sm"
              >
                {withdrawMutation.isPending ? "Processing..." : "Confirm Withdrawal"}
              </Button>
              <Button variant="outline" className="h-8 text-sm" onClick={() => setWithdrawModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-[420px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Transfer {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Transfer your {selectedWallet?.currency} balance to another currency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Current Balance Display */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Balance</span>
                <span className="font-medium">
                  {selectedWallet?.availableBalance} {selectedWallet?.currency}
                </span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="transfer-amount" className="text-sm">Amount to Transfer</Label>
              <Input
                id="transfer-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-8"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: {selectedWallet?.availableBalance} {selectedWallet?.currency}
              </p>
            </div>
            
            <div>
              <Label htmlFor="transfer-to-currency" className="text-sm">Transfer To</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select destination currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">🇺🇸 USD – US Dollar</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR – Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP – British Pound</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD – Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">🇦🇺 AUD – Australian Dollar</SelectItem>
                  <SelectItem value="HKD">🇭🇰 HKD – Hong Kong Dollar</SelectItem>
                  <SelectItem value="SGD">🇸🇬 SGD – Singapore Dollar</SelectItem>
                  <SelectItem value="BTC">₿ BTC – Bitcoin</SelectItem>
                  <SelectItem value="ETH">Ξ ETH – Ethereum</SelectItem>
                  <SelectItem value="USDT">🟢 USDT – Tether USD</SelectItem>
                  <SelectItem value="USDC">🔵 USDC – USD Coin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Exchange Rate & Conversion Preview */}
            {selectedWallet && toCurrency && amount && toCurrency !== selectedWallet.currency && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                <ExchangeRateDisplay fromCurrency={selectedWallet.currency} toCurrency={toCurrency} amount={amount} />
                <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                  <span>Transfer fee: 0.5%</span>
                  <span>Processing: Instant</span>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2 pt-2">
              <Button 
                onClick={() => {
                  if (selectedWallet?.currency && toCurrency && amount) {
                    setFromCurrency(selectedWallet.currency);
                    handleTransfer();
                  }
                }}
                disabled={transferMutation.isPending || !selectedWallet || !toCurrency || !amount || toCurrency === selectedWallet?.currency}
                className="flex-1 h-8 text-sm"
              >
                {transferMutation.isPending ? "Transferring..." : "Transfer Now"}
              </Button>
              <Button variant="outline" className="h-8 text-sm" onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}