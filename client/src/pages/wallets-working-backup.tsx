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
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
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
                          <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFromCurrency(wallet.currency)}
                              >
                                Transfer
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Transfer / Convert Currency</DialogTitle>
                                <DialogDescription>
                                  Convert between different currencies with real-time exchange rates
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="from-currency">From</Label>
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
                                              <span className="text-muted-foreground">
                                                ({wallet.config?.symbol}{wallet.balance})
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="to-currency">To</Label>
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
                                </div>

                                <div>
                                  <Label htmlFor="amount">Amount</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                  />
                                  {fromCurrency && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Available: {CurrencyConfig[fromCurrency as keyof typeof CurrencyConfig]?.symbol}{walletsWithRegions.find(w => w.currency === fromCurrency)?.balance || '0'} {fromCurrency}
                                    </p>
                                  )}
                                </div>

                                {fromCurrency && toCurrency && amount && (
                                  <div className="border-t pt-4">
                                    <ExchangeRateDisplay 
                                      fromCurrency={fromCurrency}
                                      toCurrency={toCurrency}
                                      amount={amount}
                                    />
                                  </div>
                                )}

                                <Button 
                                  onClick={handleTransfer}
                                  disabled={!fromCurrency || !amount || !toCurrency || transferMutation.isPending}
                                  className="w-full"
                                  size="lg"
                                >
                                  {transferMutation.isPending ? "Converting..." : "Convert Now"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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
    </div>
  );
}