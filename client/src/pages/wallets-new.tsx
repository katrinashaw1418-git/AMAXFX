import { useState, useEffect } from 'react';
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
import { TrendingUp, TrendingDown, Plus, Minus, ArrowUpDown, Send, Repeat, Info, DollarSign, AlertCircle, Volume2, Settings, ExternalLink } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useFxRate } from '@/hooks/use-fx-rates';
import { useWallets } from '@/hooks/use-portfolio';
import RateSparkline from '@/components/fx/rate-sparkline';
import { useVoiceNarration } from '@/hooks/use-voice-narration';
import VoiceSettings from '@/components/voice/voice-settings';

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
  
  if (amount && String(amount).trim() !== '') {
    const amountNumber = parseFloat(String(amount));
    const rateNumber = rate;
    
    if (!isNaN(amountNumber) && !isNaN(rateNumber) && amountNumber > 0) {
      const grossConverted = amountNumber * rateNumber;
      const transactionFee = grossConverted * 0.005;
      const netConverted = grossConverted - transactionFee;
      convertedAmount = netConverted.toFixed(2);
      sendingAmount = amountNumber.toFixed(2);
    }
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

const FIAT_DISPLAY_CURRENCIES = ['AUD', 'NZD', 'USD', 'EUR', 'CAD', 'GBP', 'CNY', 'HKD', 'SGD', 'JPY', 'KRW'];

function WalletSparkline({ currency, displayCurrency }: { currency: string; displayCurrency: string }) {
  const skipSparkline = currency === displayCurrency;
  const { data: fxRate } = useFxRate(currency, displayCurrency);
  if (skipSparkline) return <div className="w-16 h-8" />;
  const currentRate = fxRate ? parseFloat(fxRate.rate) : 0;
  return <RateSparkline fromCurrency={currency} toCurrency={displayCurrency} currentRate={currentRate} />;
}

// Currencies supported by PayPal's standard merchant accounts.
// CNY and KRW are not supported — those wallets will not show PayPal as a deposit option.
const PAYPAL_SUPPORTED_CURRENCIES = ['AUD', 'NZD', 'USD', 'EUR', 'CAD', 'GBP', 'HKD', 'SGD', 'JPY'];

export default function Wallets() {
  const { data: wallets = [], isLoading } = useWallets();
  const [toCurrency, setToCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [displayCurrency, setDisplayCurrency] = useState('USD'); // New state for balance display currency
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  // Voice narration hook
  const {
    narrateTransaction,
    narrateBalance,
    narrateSuccess,
    narrateError,
    narrateNavigation,
    isSupported: isVoiceSupported,
    settings: voiceSettings,
  } = useVoiceNarration();
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [payerName, setPayerName] = useState('');
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [payerAccountNumber, setPayerAccountNumber] = useState('');
  const [payerBsb, setPayerBsb] = useState('');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Voice narration on page load
  useEffect(() => {
    if (wallets.length > 0 && voiceSettings.autoNarrate) {
      const totalBalance = wallets.reduce((sum: number, wallet: any) => {
        return sum + parseFloat(wallet.balance || '0');
      }, 0);
      
      setTimeout(() => {
        narrateNavigation(`Your wallets page with ${wallets.length} currencies`);
        narrateBalance("USD", totalBalance.toFixed(2));
      }, 500);
    }
  }, [wallets, voiceSettings.autoNarrate, narrateNavigation, narrateBalance]);

  // PayPal return URL handler — runs once on mount
  // PayPal appends ?paypal=success&walletId=X&token=ORDER_TOKEN&PayerID=PAYER_ID
  // or ?paypal=cancel when the user closes PayPal without paying.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paypalStatus = params.get('paypal');
    const orderId = params.get('token'); // PayPal uses 'token' for the order ID
    const walletId = params.get('walletId');

    if (paypalStatus === 'cancel') {
      toast({ title: "PayPal Cancelled", description: "Your PayPal deposit was not completed.", variant: "destructive" });
      window.history.replaceState({}, '', '/wallets');
      return;
    }

    if (paypalStatus === 'success' && orderId && walletId) {
      // Remove params from URL immediately to prevent re-capture on refresh
      window.history.replaceState({}, '', '/wallets');

      setPaypalLoading(true);
      apiRequest('POST', '/api/paypal/capture-order', { orderId, walletId: Number(walletId) })
        .then(async (r) => {
          if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.error || 'Capture failed');
          }
          return r.json();
        })
        .then((data) => {
          toast({
            title: "✅ PayPal Deposit Successful",
            description: `${data.amount} ${data.currency} has been added to your wallet.`,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
          queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
          queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        })
        .catch((err) => {
          toast({ title: "PayPal Capture Failed", description: err.message, variant: "destructive" });
        })
        .finally(() => setPaypalLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transferMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/fx-exchange", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Transfer failed: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      const successMessage = `Converted ${amount} ${selectedWallet?.currency || ''} to ${data.convertedAmount.toFixed(2)} ${toCurrency}`;
      
      toast({
        title: "✅ Transfer Successful",
        description: successMessage,
      });
      
      // Voice narration
      narrateSuccess(successMessage);
      
      // Immediately invalidate and refetch wallet data
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setTransferModalOpen(false);
      setAmount('');
      setToCurrency('');
    },
    onError: (error: any) => {
      let errorMessage = "Please try again later.";
      if (error.message && error.message.includes("400")) {
        errorMessage = "Insufficient balance. Please check your available funds.";
      } else if (error.message) {
        errorMessage = error.message.replace("Transfer failed: 400", "Insufficient balance");
      }
      
      // Voice narration
      narrateError(errorMessage);
      
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
      const response = await apiRequest("POST", "/api/wallets/deposit", data);
      if (!response.ok) throw new Error(`Deposit failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      const successMessage = `${amount} ${selectedWallet?.currency} has been added to your wallet`;
      
      toast({
        title: "✅ Deposit Successful",
        description: successMessage,
      });
      
      // Voice narration
      narrateSuccess(successMessage);
      
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setDepositModalOpen(false);
      setAmount('');
      setDepositMethod('');
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Please try again later.";
      
      // Voice narration
      narrateError(`Deposit failed: ${errorMessage}`);
      
      toast({
        title: "Deposit Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string }) => {
      const response = await apiRequest("POST", "/api/wallets/withdraw", data);
      if (!response.ok) throw new Error(`Withdrawal failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      const successMessage = `${amount} ${selectedWallet?.currency} has been withdrawn from your wallet`;
      
      toast({
        title: "✅ Withdrawal Successful", 
        description: successMessage,
      });
      
      // Voice narration
      narrateSuccess(successMessage);
      
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setWithdrawModalOpen(false);
      setAmount('');
      setWithdrawMethod('');
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Please try again later.";
      
      // Voice narration
      narrateError(`Withdrawal failed: ${errorMessage}`);
      
      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleDeposit = () => {
    if (!selectedWallet || !amount || !depositMethod) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    narrateTransaction('deposit', amount, selectedWallet.currency);
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

    // Voice narration
    narrateTransaction('withdraw', amount, selectedWallet.currency);

    withdrawMutation.mutate({
      type: "withdraw",
      currency: selectedWallet.currency,
      amount: amount
    });
  };

  const handleTransfer = () => {
    const sourceCurrency = selectedWallet?.currency;

    if (!sourceCurrency || !toCurrency || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (sourceCurrency === toCurrency) {
      toast({
        title: "Invalid Transfer",
        description: "Please select different currencies.",
        variant: "destructive",
      });
      return;
    }

    narrateTransaction('transfer', amount, `${sourceCurrency} to ${toCurrency}`);
    transferMutation.mutate({
      fromCurrency: sourceCurrency,
      toCurrency,
      amount: parseFloat(amount)
    });
  };

  // Filter out zero-balance wallets and sort with crypto currencies at bottom
  const walletsWithRegions = wallets
    .filter((wallet: any) => parseFloat(wallet.balance || '0') > 0) // Hide zero-balance wallets
    .map((wallet: any) => ({
      ...wallet,
      config: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig],
      region: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig]?.region || 'Other'
    }))
    .sort((a: any, b: any) => {
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
      
      // AUD always first
      if (a.currency === 'AUD') return -1;
      if (b.currency === 'AUD') return 1;
      
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
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Wallets</h1>
        <div className="flex items-center gap-2">
          {isVoiceSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceSettings(true)}
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Voice Settings
            </Button>
          )}
          <Badge variant="secondary" className="text-sm">
            Multi-Currency Management
          </Badge>
        </div>
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
                  {FIAT_DISPLAY_CURRENCIES.map(currency => {
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
                    <th className="text-center p-4 font-medium">YTD vs {displayCurrency}</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {walletsWithRegions.map((wallet: any) => (
                    <tr key={wallet.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: wallet.config?.color || '#9ca3af' }}>
                            {wallet.config?.flag}
                          </div>
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
                      <td className="p-4">
                        <div className="flex justify-center">
                          <WalletSparkline currency={wallet.currency} displayCurrency={displayCurrency} />
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="outline" 
                            size="icon"
                            title="Deposit"
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setDepositModalOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            title="Withdraw"
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setWithdrawModalOpen(true);
                            }}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            title={wallet.walletType === 'crypto' ? 'Exchange on Crypto page' : 'Exchange on FX Exchange page'}
                            onClick={() => {
                              navigate(wallet.walletType === 'crypto' ? '/crypto' : '/fx-exchange');
                            }}
                          >
                            <ArrowUpDown className="w-4 h-4" />
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
                  {selectedWallet?.walletType === 'fiat' ? (
                    <>
                      <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                      {PAYPAL_SUPPORTED_CURRENCIES.includes(selectedWallet?.currency) && (
                        <SelectItem value="paypal">🅿️ PayPal</SelectItem>
                      )}
                      <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="blockchain">🔗 Blockchain Transfer</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {depositMethod && depositMethod !== 'blockchain' && (
              <div>
                <Label htmlFor="deposit-amount">
                  {!['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) && (depositMethod === 'paypal' || depositMethod === 'bank_transfer')
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
                  </p>
                )}
              </div>
            )}

            {depositMethod === 'blockchain' && !['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-amber-600 text-sm font-bold">!</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Crypto Deposit — Contact Required</p>
                      <p className="text-sm text-amber-800 mt-1">
                        To deposit {selectedWallet?.currency}, please contact our team directly. We will provide you with a verified deposit address specific to your account.
                      </p>
                      <p className="text-sm text-amber-800 mt-2">
                        <span className="font-medium">Email:</span> info@amaxglobal.com.au
                      </p>
                      <p className="text-xs text-amber-700 mt-2">
                        Do not send funds to any address not personally confirmed by AMAX Global in writing. AMAX Global will never display deposit addresses directly in the portal.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = "mailto:info@amaxglobal.com.au?subject=Crypto Deposit Request - " + selectedWallet?.currency}
                >
                  Email us to arrange deposit
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Live blockchain deposit processing is not enabled in this environment.
                </p>
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
                
                {depositMethod === 'paypal' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">🅿️ PayPal Deposit</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• You will be redirected to PayPal to log in and confirm</p>
                        <p>• After approval, you are returned here automatically</p>
                        <p>• Funds credited instantly once PayPal confirms</p>
                        <p>• Standard PayPal fees may apply</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the amount above, then click <strong>Continue to PayPal</strong>. You will be redirected to PayPal's secure login page.
                    </p>
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

          {/* ── CRYPTO WALLET — cannot withdraw directly to bank ── */}
          {selectedWallet?.walletType === 'crypto' ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Digital assets cannot be withdrawn directly to a bank account</p>
                    <p className="text-sm text-amber-800 mt-1">
                      {selectedWallet?.currency} must be converted to a fiat currency first, then withdrawn via bank transfer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">Option 1 — Convert to AUD, then withdraw</p>
                  <p className="text-xs text-muted-foreground">
                    Use the Crypto Exchange to convert your {selectedWallet?.currency} to AUD. Once in your AUD wallet, you can withdraw to your bank account as usual.
                  </p>
                  <Button
                    className="w-full mt-2 h-8 text-sm"
                    onClick={() => { setWithdrawModalOpen(false); navigate('/crypto'); }}
                  >
                    Go to Crypto Exchange
                  </Button>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">Option 2 — Blockchain withdrawal to external wallet</p>
                  <p className="text-xs text-muted-foreground">
                    To send {selectedWallet?.currency} to an external blockchain address, contact our team. We will verify and process your request securely.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-2 h-8 text-sm"
                    onClick={() => window.location.href = `mailto:info@amaxglobal.com.au?subject=Crypto Withdrawal Request - ${selectedWallet?.currency}`}
                  >
                    Email us to arrange withdrawal
                  </Button>
                </div>
              </div>

              <Button variant="outline" className="w-full h-8 text-sm" onClick={() => setWithdrawModalOpen(false)}>
                Close
              </Button>
            </div>

          ) : (
            /* ── FIAT WALLET — standard bank transfer ── */
            <div className="space-y-3">
              <div>
                <Label htmlFor="withdraw-method">Withdrawal Method</Label>
                <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select withdrawal method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                    <SelectItem value="paypal">🅿️ PayPal</SelectItem>
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
              {withdrawMethod === 'paypal' && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">🅿️ PayPal Withdrawal</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Funds sent directly to your PayPal account</p>
                      <p>• Processing time: same day to 1 business day</p>
                      <p>• PayPal account required</p>
                      <p>• Standard PayPal fees may apply</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="withdraw-paypal-email" className="text-xs">PayPal Email Address</Label>
                      <Input
                        id="withdraw-paypal-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="withdraw-paypal-name" className="text-xs">Account Holder Name</Label>
                      <Input
                        id="withdraw-paypal-name"
                        placeholder="John Chen"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {withdrawMethod === 'bank_transfer' && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">🏦 Bank Transfer Instructions</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Funds transferred to your registered bank account</p>
                      <p>• Processing time: 1-3 business days</p>
                      <p>• Withdrawal fee applies (see fee schedule)</p>
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
              )}
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
          )}
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

      {/* Voice Settings Modal */}
      <Dialog open={showVoiceSettings} onOpenChange={setShowVoiceSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Voice Settings</DialogTitle>
            <DialogDescription>
              Configure voice narration for transaction feedback and accessibility
            </DialogDescription>
          </DialogHeader>
          <VoiceSettings />
        </DialogContent>
      </Dialog>

    </div>
  );
}