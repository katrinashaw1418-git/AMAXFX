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
  
  if (amount && amount !== '') {
    const parsedAmount = parseFloat(amount);
    console.log('Parsed amount:', parsedAmount);
    
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      const calculatedAmount = parsedAmount * rate;
      console.log('Calculated amount before fee:', calculatedAmount);
      
      // Apply 0.5% fee
      const fee = calculatedAmount * 0.005;
      const finalAmount = calculatedAmount - fee;
      
      console.log('Fee:', fee, 'Final amount:', finalAmount);
      
      convertedAmount = finalAmount.toFixed(2);
      sendingAmount = parsedAmount.toFixed(2);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Exchange Rate:</span>
        <span className="font-medium">1 {fromCurrency} = {displayRate} {toCurrency}</span>
      </div>
      
      {amount && amount !== '' && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
          <div className="text-center space-y-2">
            <div className="text-sm text-gray-600">What You'll Receive</div>
            <div className="text-2xl font-bold text-green-600">
              {CurrencyConfig[toCurrency as keyof typeof CurrencyConfig]?.symbol}{convertedAmount} {toCurrency}
            </div>
            <div className="text-xs text-gray-500">
              Converting {CurrencyConfig[fromCurrency as keyof typeof CurrencyConfig]?.symbol}{sendingAmount} {fromCurrency} • Fee: 0.5%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Wallets() {
  const { data: wallets = [], isLoading } = useWallets();
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const [fromCurrency, setFromCurrency] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  
  // Form fields for deposit/withdraw
  const [payerPayId, setPayerPayId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerAccountNumber, setPayerAccountNumber] = useState('');
  const [payerBsb, setPayerBsb] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const { toast } = useToast();
  
  // Always call this hook at the top level to avoid hooks order issues
  const { data: fxRateData } = useFxRate(fromCurrency || 'USD', toCurrency || 'EUR');

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string; method: string }) => {
      const response = await apiRequest("POST", "/api/wallets/deposit", data);
      if (!response.ok) {
        throw new Error('Deposit failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Successful",
        description: `${amount} ${selectedWallet?.currency} added to your wallet`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      setDepositModalOpen(false);
      resetForms();
      
      // Auto-refresh every 5 seconds
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      }, 5000);
    },
    onError: () => {
      toast({
        title: "Deposit Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string; method: string }) => {
      const response = await apiRequest("POST", "/api/wallets/withdraw", data);
      if (!response.ok) {
        throw new Error('Withdrawal failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Successful",
        description: `${amount} ${selectedWallet?.currency} withdrawn from your wallet`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      setWithdrawModalOpen(false);
      resetForms();
      
      // Auto-refresh every 5 seconds
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      }, 5000);
    },
    onError: () => {
      toast({
        title: "Withdrawal Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number }) => {
      console.log('Transfer API call:', data);
      const response = await apiRequest("POST", "/api/fx-exchange", data);
      console.log('Transfer response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transfer error response:', errorText);
        throw new Error('Transfer failed: ' + errorText);
      }
      const result = await response.json();
      console.log('Transfer result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Transfer success data:', data);
      toast({
        title: "Transfer Successful",
        description: `Converted ${amount} ${fromCurrency} to ${data.convertedAmount?.toFixed(2) || 'N/A'} ${toCurrency}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      setTransferModalOpen(false);
      resetForms();
      
      // Auto-refresh every 5 seconds
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      }, 5000);
    },
    onError: (error) => {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const resetForms = () => {
    setAmount('');
    setDepositMethod('');
    setWithdrawMethod('');
    setToCurrency('');
    setFromCurrency('');
    setPayerPayId('');
    setPayerName('');
    setPayerAccountNumber('');
    setPayerBsb('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
  };

  const handleDeposit = () => {
    if (!selectedWallet || !amount || !depositMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    depositMutation.mutate({
      type: "deposit",
      currency: selectedWallet.currency,
      amount: amount,
      method: depositMethod
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
      amount: amount,
      method: withdrawMethod
    });
  };

  const handleTransfer = () => {
    console.log('handleTransfer called', { fromCurrency, toCurrency, amount });
    
    if (!fromCurrency || !amount || !toCurrency) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      fromCurrency,
      toCurrency,
      amount: parsedAmount
    });
  };

  // Component to display wallet balance in selected currency
  function WalletValueDisplay({ wallet, displayCurrency }: { wallet: any, displayCurrency: string }) {
    const { data: fxRate } = useFxRate(wallet.currency, displayCurrency);
    
    if (!fxRate || wallet.currency === displayCurrency) {
      const config = CurrencyConfig[displayCurrency as keyof typeof CurrencyConfig];
      const balance = wallet.balance ? parseFloat(wallet.balance) : 0;
      const formattedBalance = balance > 1 ? balance.toLocaleString() : balance.toFixed(6);
      
      return (
        <div>
          <div className="text-muted-foreground">
            {config?.symbol}{formattedBalance}
          </div>
        </div>
      );
    }

    const balance = wallet.balance ? parseFloat(wallet.balance) : 0;
    const rate = parseFloat(fxRate.rate);
    const convertedBalance = balance * rate;
    const config = CurrencyConfig[displayCurrency as keyof typeof CurrencyConfig];
    const formattedBalance = convertedBalance > 1 ? convertedBalance.toLocaleString() : convertedBalance.toFixed(6);
    
    return (
      <div>
        <div className="text-muted-foreground">
          {config?.symbol}{formattedBalance}
        </div>
      </div>
    );
  }

  // Filter out zero-balance wallets and sort with crypto currencies at bottom
  const walletsWithRegions = wallets
    .filter(wallet => parseFloat(wallet.balance || '0') > 0)
    .map(wallet => ({
      ...wallet,
      config: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig],
      region: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig]?.region || 'Other'
    }))
    .sort((a, b) => {
      const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC'];
      const aIsCrypto = cryptoCurrencies.includes(a.currency);
      const bIsCrypto = cryptoCurrencies.includes(b.currency);
      
      if (aIsCrypto && !bIsCrypto) return 1;
      if (!aIsCrypto && bIsCrypto) return -1;
      
      if (aIsCrypto && bIsCrypto) {
        return cryptoCurrencies.indexOf(a.currency) - cryptoCurrencies.indexOf(b.currency);
      }
      
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
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Wallet Table */}
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
                              setSelectedWallet(wallet);
                              setDepositModalOpen(true);
                            }}
                          >
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
                    Rate Alerts
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Currency Rate Alerts</DialogTitle>
                    <DialogDescription>
                      Get notified when exchange rates reach your target
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>From Currency</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(CurrencyConfig).map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {CurrencyConfig[currency as keyof typeof CurrencyConfig]?.flag} {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>To Currency</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(CurrencyConfig).map((currency) => (
                              <SelectItem key={currency} value={currency}>
                                {CurrencyConfig[currency as keyof typeof CurrencyConfig]?.flag} {currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Target Rate</Label>
                      <Input type="number" placeholder="Enter target rate" />
                    </div>
                    <div>
                      <Label>Alert Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Above target rate</SelectItem>
                          <SelectItem value="below">Below target rate</SelectItem>
                          <SelectItem value="exact">Reaches target rate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">Set Alert</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Professional Banking Interface */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border">
            <div className="grid md:grid-cols-2 gap-8">
              {/* From Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Minus className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">You Send</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-2xl font-bold h-14 pr-20"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                          <SelectTrigger className="w-16 border-0 bg-transparent p-0 h-auto">
                            <SelectValue placeholder="USD" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2 text-xs font-medium text-gray-500">My Balances</div>
                            {walletsWithRegions.map((wallet) => (
                              <SelectItem key={wallet.currency} value={wallet.currency}>
                                <div className="flex items-center gap-2">
                                  <span>{wallet.config?.flag}</span>
                                  <div>
                                    <div className="font-medium">{wallet.currency}</div>
                                    <div className="text-xs text-gray-500">
                                      {wallet.config?.symbol}{parseFloat(wallet.balance || '0').toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {fromCurrency && (
                      <p className="text-xs text-gray-500 mt-1">
                        Available: {CurrencyConfig[fromCurrency as keyof typeof CurrencyConfig]?.symbol}{walletsWithRegions.find(w => w.currency === fromCurrency)?.balance || '0'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* To Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Recipient Gets</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <div className="relative">
                      <div className="h-14 bg-gray-50 border rounded-md flex items-center px-4">
                        <span className="text-2xl font-bold text-gray-900">
                          {fromCurrency && toCurrency && amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && fxRateData ? (
                            (() => {
                              const rate = parseFloat(fxRateData.rate);
                              const convertedAmount = parseFloat(amount) * rate * 0.995; // 0.5% fee
                              return convertedAmount.toFixed(2);
                            })()
                          ) : "0.00"}
                        </span>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Select value={toCurrency} onValueChange={setToCurrency}>
                          <SelectTrigger className="w-16 border-0 bg-transparent p-0 h-auto">
                            <SelectValue placeholder="EUR" />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2 text-xs font-medium text-gray-500">All Currencies</div>
                            {Object.entries(CurrencyRegions).map(([region, currencies]) => (
                              <div key={region}>
                                <div className="px-2 py-1 text-xs font-medium text-gray-500">{region}</div>
                                {currencies.map((currency) => {
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
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Exchange Rate Info */}
            {fromCurrency && toCurrency && fromCurrency !== toCurrency && (
              <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Exchange Rate</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      1 {fromCurrency} = {(() => {
                        if (fxRateData) {
                          const rate = parseFloat(fxRateData.rate);
                          return rate > 1 ? rate.toFixed(2) : rate.toFixed(6);
                        }
                        return "Loading...";
                      })()} {toCurrency}
                    </div>
                    <div className="text-xs text-gray-500">Mid-market rate • Fee: 0.5%</div>
                  </div>
                </div>
                
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>You send</span>
                        <span>{CurrencyConfig[fromCurrency as keyof typeof CurrencyConfig]?.symbol}{parseFloat(amount).toFixed(2)} {fromCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transfer fee</span>
                        <span>0.5%</span>
                      </div>
                      <div className="flex justify-between font-medium text-gray-900 pt-1 border-t border-gray-100 mt-1">
                        <span>Recipient gets</span>
                        <span>
                          {(() => {
                            if (fxRateData) {
                              const rate = parseFloat(fxRateData.rate);
                              const convertedAmount = parseFloat(amount) * rate * 0.995;
                              return `${CurrencyConfig[toCurrency as keyof typeof CurrencyConfig]?.symbol}${convertedAmount.toFixed(2)} ${toCurrency}`;
                            }
                            return "Calculating...";
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Transfer Button */}
            <div className="mt-6 flex gap-3">
              <Button 
                onClick={handleTransfer}
                disabled={!fromCurrency || !amount || !toCurrency || transferMutation.isPending}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {transferMutation.isPending ? "Processing Transfer..." : "Continue"}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-12 w-12">
                      <Info className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <div>• Instant transfers</div>
                      <div>• Bank-level security</div>
                      <div>• 24/7 support</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Additional Features */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium text-sm">Rate Alerts</span>
              </div>
              <p className="text-xs text-gray-600">Get notified when rates improve</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">Mid-Market Rates</span>
              </div>
              <p className="text-xs text-gray-600">Always get the real exchange rate</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-sm">Instant Processing</span>
              </div>
              <p className="text-xs text-gray-600">Most transfers complete in seconds</p>
            </div>
          </div>
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
                <Label htmlFor="deposit-amount">Amount ({selectedWallet?.currency})</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            )}

            {depositMethod === 'blockchain' && !['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border mx-auto w-fit mb-3">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded flex items-center justify-center text-xs font-mono text-gray-600 p-2">
                      <div className="text-center">QR CODE</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Scan QR code with your wallet app</p>
                </div>
                
                <div>
                  <Label>Wallet Address ({selectedWallet?.currency} Network)</Label>
                  <div className="flex space-x-2">
                    <Input 
                      value={selectedWallet?.currency === "BTC" 
                        ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" 
                        : "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2"
                      } 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={() => {
                      const address = selectedWallet?.currency === "BTC" 
                        ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" 
                        : "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2";
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
            )}

            {/* PayID Form for Australia */}
            {depositMethod === 'payid' && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="payer-payid">Your PayID (Email or Mobile)</Label>
                  <Input
                    id="payer-payid"
                    value={payerPayId}
                    onChange={(e) => setPayerPayId(e.target.value)}
                    placeholder="yourname@email.com or +61412345678"
                  />
                </div>
                <div>
                  <Label htmlFor="payer-name">Full Name</Label>
                  <Input
                    id="payer-name"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Your full name as registered"
                  />
                </div>
              </div>
            )}

            {/* Bank Transfer Form */}
            {depositMethod === 'bank_transfer' && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="payer-name-bank">Account Holder Name</Label>
                  <Input
                    id="payer-name-bank"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="payer-bsb">BSB (Australia) or Sort Code</Label>
                  <Input
                    id="payer-bsb"
                    value={payerBsb}
                    onChange={(e) => setPayerBsb(e.target.value)}
                    placeholder="123-456 or 12-34-56"
                  />
                </div>
                <div>
                  <Label htmlFor="payer-account">Account Number</Label>
                  <Input
                    id="payer-account"
                    value={payerAccountNumber}
                    onChange={(e) => setPayerAccountNumber(e.target.value)}
                    placeholder="Your account number"
                  />
                </div>
              </div>
            )}

            {/* Credit/Debit Card Form */}
            {depositMethod === 'card' && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cardholder-name">Cardholder Name</Label>
                  <Input
                    id="cardholder-name"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Name on card"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>• Fee: 2.9% + $0.30 AUD per transaction</p>
                  <p>• Limits: $50 - $10,000 AUD per transaction</p>
                  <p>• Supported: Visa, Mastercard, American Express</p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleDeposit} 
              disabled={depositMutation.isPending}
              className="w-full mt-4"
            >
              {depositMutation.isPending ? "Processing..." : "Confirm Deposit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-4">
          <DialogHeader>
            <DialogTitle>Withdraw {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Withdraw funds from your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="withdraw-method">Withdraw Method</Label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select withdrawal method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  <SelectItem value="payid">📱 PayID (Australia Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="withdraw-amount">Amount ({selectedWallet?.currency})</Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
              {selectedWallet && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {selectedWallet.config?.symbol}{selectedWallet.availableBalance} {selectedWallet.currency}
                </p>
              )}
            </div>

            {/* PayID Form for Australia */}
            {withdrawMethod === 'payid' && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="withdraw-payid">Recipient PayID</Label>
                  <Input
                    id="withdraw-payid"
                    value={payerPayId}
                    onChange={(e) => setPayerPayId(e.target.value)}
                    placeholder="recipient@email.com or +61412345678"
                  />
                </div>
                <div>
                  <Label htmlFor="withdraw-name">Recipient Name</Label>
                  <Input
                    id="withdraw-name"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Recipient's full name"
                  />
                </div>
              </div>
            )}

            {/* Bank Transfer Form */}
            {withdrawMethod === 'bank_transfer' && (
              <div className="space-y-2">
                <div>
                  <Label htmlFor="withdraw-name-bank">Account Holder Name</Label>
                  <Input
                    id="withdraw-name-bank"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Recipient's full name"
                  />
                </div>
                <div>
                  <Label htmlFor="withdraw-bsb">BSB or Sort Code</Label>
                  <Input
                    id="withdraw-bsb"
                    value={payerBsb}
                    onChange={(e) => setPayerBsb(e.target.value)}
                    placeholder="123-456 or 12-34-56"
                  />
                </div>
                <div>
                  <Label htmlFor="withdraw-account">Account Number</Label>
                  <Input
                    id="withdraw-account"
                    value={payerAccountNumber}
                    onChange={(e) => setPayerAccountNumber(e.target.value)}
                    placeholder="Recipient's account number"
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleWithdraw} 
              disabled={withdrawMutation.isPending}
              className="w-full mt-4"
            >
              {withdrawMutation.isPending ? "Processing..." : "Confirm Withdrawal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-4">
          <DialogHeader>
            <DialogTitle>Transfer {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Convert your {selectedWallet?.currency} to another currency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="transfer-amount">Amount ({selectedWallet?.currency})</Label>
              <Input
                id="transfer-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label htmlFor="to-currency">Convert To</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target currency" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CurrencyConfig).map((currency) => {
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

            {/* Exchange Rate Display */}
            {selectedWallet && toCurrency && amount && (
              <div className="mt-4">
                <ExchangeRateDisplay 
                  fromCurrency={selectedWallet.currency}
                  toCurrency={toCurrency}
                  amount={amount}
                />
              </div>
            )}

            <Button 
              onClick={() => {
                if (selectedWallet) {
                  setFromCurrency(selectedWallet.currency);
                  handleTransfer();
                }
              }} 
              disabled={transferMutation.isPending}
              className="w-full mt-4"
            >
              {transferMutation.isPending ? "Converting..." : "Confirm Transfer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}