import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CurrencyConfig, SupportedCurrencies, type WalletBalance } from '@/lib/types';
import { ArrowRightLeft, Info } from 'lucide-react';
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
  
  if (amount && !isNaN(parseFloat(amount))) {
    const amountNumber = parseFloat(amount);
    const rateNumber = parseFloat(fxRate.rate);
    const grossConverted = amountNumber * rateNumber;
    const transactionFee = grossConverted * 0.005; // 0.5% transaction fee
    const netConverted = grossConverted - transactionFee;
    
    console.log('Calculation Result:', {
      amountNumber,
      rateNumber,
      grossConverted,
      transactionFee,
      netConverted,
      convertedAmount: netConverted.toFixed(2)
    });
    
    convertedAmount = netConverted.toFixed(2);
    sendingAmount = amountNumber.toFixed(2);
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

  // Convert balance to display currency
  const balance = wallet.balance ? parseFloat(wallet.balance) : 0;
  const rate = parseFloat(fxRate.rate);
  const convertedBalance = balance * rate;
  const config = CurrencyConfig[displayCurrency as keyof typeof CurrencyConfig];
  const formattedBalance = convertedBalance > 1 ? convertedBalance.toLocaleString() : convertedBalance.toFixed(6);
  const displayRate = rate > 1 ? rate.toFixed(2) : rate.toFixed(6);
  
  return (
    <div>
      <div className="text-muted-foreground">
        {config?.symbol}{formattedBalance}
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
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  const { toast } = useToast();
  
  // Exchange rate display helpers
  const exchangeRateText = useExchangeRateDisplay(fromCurrency, toCurrency);

  // Get exchange rate for transfer calculation
  const { data: transferFxRate } = useFxRate(fromCurrency, toCurrency);
  
  // Calculate transfer amount with fee
  const calculateTransferAmount = (amount: string, fromCurrency: string, toCurrency: string) => {
    if (!amount || !fromCurrency || !toCurrency) return '0.00';
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return '0.00';
    
    if (!transferFxRate) return 'Loading...';
    
    const rate = parseFloat(transferFxRate.rate);
    const grossConverted = amountNum * rate;
    const transactionFee = grossConverted * 0.005; // 0.5% fee
    const netConverted = grossConverted - transactionFee;
    
    return `${netConverted.toFixed(2)} ${toCurrency}`;
  };

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
        title: "Transfer Successful",
        description: `Converted ${amount} ${fromCurrency} to ${data.convertedAmount.toFixed(2)} ${toCurrency}`,
      });
      
      // Clear form
      setAmount("");
      setFromCurrency("");
      setToCurrency("");
      
      // Invalidate wallet cache to refresh balances
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
    onError: (error: any) => {
      console.error("Transfer mutation onError:", error);
      toast({
        title: "Transfer Failed",
        description: error.message || "An error occurred during the transfer",
        variant: "destructive",
      });
    },
  });

  const handleTransfer = () => {
    if (!fromCurrency || !toCurrency || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all transfer details.",
        variant: "destructive",
      });
      return;
    }

    if (fromCurrency === toCurrency) {
      toast({
        title: "Invalid Transfer",
        description: "Please select different currencies.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting transfer mutation...");
    transferMutation.mutate({
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount)
    });
  };

  // Filter out zero-balance wallets and sort with crypto currencies at bottom
  const walletsWithRegions = wallets
    .filter(wallet => parseFloat(wallet.balance || '0') > 0) // Hide zero-balance wallets
    .map(wallet => ({
      ...wallet,
      config: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig],
      region: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig]?.region || 'Other'
    }))
    .sort((a, b) => {
      // Define crypto currencies that should always be at bottom
      const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC'];
      const aIsCrypto = cryptoCurrencies.includes(a.currency);
      const bIsCrypto = cryptoCurrencies.includes(b.currency);
      
      // If one is crypto and other isn't, non-crypto comes first
      if (aIsCrypto && !bIsCrypto) return 1;
      if (!aIsCrypto && bIsCrypto) return -1;
      
      // If both are crypto, maintain the order: BTC, ETH, USDT, USDC
      if (aIsCrypto && bIsCrypto) {
        return cryptoCurrencies.indexOf(a.currency) - cryptoCurrencies.indexOf(b.currency);
      }
      
      // For non-crypto currencies, sort alphabetically
      return a.currency.localeCompare(b.currency);
    });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Section 1: Your Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Balances</span>
            <div className="flex items-center gap-2">
              <Label htmlFor="display-currency" className="text-sm">Display in:</Label>
              <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
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
                          <span className="text-lg flex items-center justify-center w-6 h-6">{wallet.config?.flag}</span>
                          <div className="flex-1">
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
                              setFromCurrency(wallet.currency);
                              setAmount("");
                            }}
                          >
                            <ArrowRightLeft className="w-4 h-4 mr-1" />
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
            <Badge variant="outline" className="text-xs">
              <Info className="w-3 h-3 mr-1" />
              Real-time rates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {walletsWithRegions.map((wallet) => (
                    <SelectItem key={wallet.currency} value={wallet.currency}>
                      <div className="flex items-center gap-2">
                        <span>{wallet.config?.flag}</span>
                        <span>{wallet.currency}</span>
                        <span className="text-sm text-muted-foreground">
                          {wallet.config?.symbol}{parseFloat(wallet.balance || '0').toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SupportedCurrencies.map((currency) => {
                    const config = CurrencyConfig[currency as keyof typeof CurrencyConfig];
                    return (
                      <SelectItem key={currency} value={currency}>
                        <div className="flex items-center gap-2">
                          <span>{config?.flag}</span>
                          <span>{currency}</span>
                          <span className="text-sm text-muted-foreground">{config?.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder={fromCurrency ? `Enter ${fromCurrency} amount` : "Select currency first"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!fromCurrency}
            />
            {fromCurrency && (
              <div className="text-sm text-muted-foreground">
                Available: {walletsWithRegions.find(w => w.currency === fromCurrency)?.availableBalance || '0'} {fromCurrency}
              </div>
            )}
          </div>

          {/* Exchange Rate Display */}
          {fromCurrency && toCurrency && fromCurrency !== toCurrency && (
            <ExchangeRateDisplay fromCurrency={fromCurrency} toCurrency={toCurrency} amount={amount} />
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
    </div>
  );
}