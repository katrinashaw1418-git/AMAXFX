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
import StripePaymentForm from '@/components/stripe-payment-form';

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
  const [stripeLoading, setStripeLoading] = useState(false);
  const [payerAccountNumber, setPayerAccountNumber] = useState('');
  const [payerBsb, setPayerBsb] = useState('');
  const [internalTransferEmail, setInternalTransferEmail] = useState('');
  const [internalTransferAmount, setInternalTransferAmount] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawBsb, setWithdrawBsb] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawPayId, setWithdrawPayId] = useState('');
  const [withdrawPayIdName, setWithdrawPayIdName] = useState('');
  const [depositSubmitted, setDepositSubmitted] = useState<{ referenceCode: string; currency: string; amount: string; method: string } | null>(null);
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  const { data: stripeStatus } = useQuery<{ configured: boolean; publishableKey: string | null }>({
    queryKey: ['/api/stripe/status'],
  });
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

  // Stripe Checkout return handler — runs once on mount.
  // Stripe redirects back with ?stripe=success&session_id=cs_xxx or ?stripe=cancel.
  // The actual balance credit happens via Stripe webhook (server-side), not here.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get('stripe');

    if (stripeStatus === 'cancel') {
      window.history.replaceState({}, '', '/wallets');
      toast({
        title: "Payment Cancelled",
        description: "Your card payment was not completed. No funds were charged.",
        variant: "destructive",
      });
      return;
    }

    if (stripeStatus === 'success') {
      window.history.replaceState({}, '', '/wallets');
      toast({
        title: "✅ Payment Received by Stripe",
        description: "Your card payment was successful. Funds will appear in your wallet shortly once confirmed.",
      });
      // Refresh transactions so the user sees the incoming credit
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
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

  // Deposit mutation — used for bank_transfer and payid channels only.
  // Card deposits go via Stripe checkout (handleStripeCheckout below).
  const depositMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string; method: string }) => {
      const response = await apiRequest("POST", "/api/wallets/deposit", data);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Deposit failed: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });

      if (data?.status === 'pending') {
        setDepositSubmitted({
          referenceCode: data.referenceCode ?? `AMAX-${data.id}`,
          currency: selectedWallet?.currency ?? '',
          amount: amount,
          method: depositMethod,
        });
        narrateSuccess("Deposit submitted, awaiting AMAX confirmation");
      } else {
        const msg = `${amount} ${selectedWallet?.currency} has been added to your wallet.`;
        toast({ title: "✅ Deposit Successful", description: msg });
        narrateSuccess(msg);
        setDepositModalOpen(false);
        setAmount('');
        setDepositMethod('');
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Please try again later.";
      narrateError(`Deposit failed: ${errorMessage}`);
      toast({
        title: "Deposit Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Stripe Checkout — called for card deposits.
  // Creates a Stripe Checkout Session and redirects to Stripe's hosted payment page.
  // Balance is credited ONLY after Stripe fires the webhook (server-side).
  const handleStripeCheckout = async () => {
    if (!selectedWallet || !amount) {
      toast({ title: "Missing Information", description: "Please enter an amount.", variant: "destructive" });
      return;
    }
    setStripeLoading(true);
    try {
      const res = await apiRequest('POST', '/api/stripe/create-checkout-session', {
        walletId: selectedWallet.id,
        amount,
        currency: selectedWallet.currency,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to start checkout');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Card Payment Error", description: err.message, variant: "destructive" });
      setStripeLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!selectedWallet || !amount) {
      toast({ title: "Missing Information", description: "Please enter an amount.", variant: "destructive" });
      return;
    }
    setCardLoading(true);
    try {
      const res = await apiRequest('POST', '/api/stripe/create-payment-intent', {
        walletId: selectedWallet.id,
        amount,
        currency: selectedWallet.currency,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to initialise payment');
      }
      const { clientSecret } = await res.json();
      setCardClientSecret(clientSecret);
    } catch (err: any) {
      toast({ title: "Card Payment Error", description: err.message, variant: "destructive" });
    } finally {
      setCardLoading(false);
    }
  };

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string }) => {
      const response = await apiRequest("POST", "/api/wallets/withdraw", data);
      if (!response.ok) throw new Error(`Withdrawal failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      const successMessage = `Your ${amount} ${selectedWallet?.currency} withdrawal is under review. AMAX will process it within 1 business day.`;
      
      toast({
        title: "⏳ Withdrawal Submitted",
        description: successMessage,
      });
      
      narrateSuccess("Withdrawal submitted and under review");
      
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setWithdrawModalOpen(false);
      setAmount('');
      setWithdrawMethod('');
      setWithdrawBankName('');
      setWithdrawBsb('');
      setWithdrawAccountNumber('');
      setWithdrawPayId('');
      setWithdrawPayIdName('');
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

  const internalTransferMutation = useMutation({
    mutationFn: async (data: { currency: string; amount: number; recipientEmail: string }) => {
      const response = await apiRequest("POST", "/api/transfer/internal", data);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Transfer failed");
      return json;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Transfer Sent",
        description: `${internalTransferAmount} ${selectedWallet?.currency} transferred to ${internalTransferEmail}. Reference: ${data.referenceId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setWithdrawModalOpen(false);
      setInternalTransferEmail('');
      setInternalTransferAmount('');
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
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

    // Card deposits are handled by the inline Stripe Elements form — not this path.
    if (depositMethod === 'card') {
      handleCardPayment();
      return;
    }

    narrateTransaction('deposit', amount, selectedWallet.currency);
    depositMutation.mutate({
      type: "deposit",
      currency: selectedWallet.currency,
      amount: amount,
      method: depositMethod, // 'bank_transfer' | 'payid'
    });
  };

  const handleWithdraw = () => {
    if (!selectedWallet || !amount || !withdrawMethod) {
      toast({ title: "Missing Information", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    if (withdrawMethod === 'bank_transfer') {
      if (!withdrawBankName || !withdrawAccountNumber) {
        toast({ title: "Missing Bank Details", description: "Please enter account holder name and account number.", variant: "destructive" });
        return;
      }
    }

    if (withdrawMethod === 'payid') {
      if (!withdrawPayId) {
        toast({ title: "Missing PayID", description: "Please enter your PayID email or phone number.", variant: "destructive" });
        return;
      }
    }

    narrateTransaction('withdraw', amount, selectedWallet.currency);

    withdrawMutation.mutate({
      type: "withdraw",
      currency: selectedWallet.currency,
      amount: amount,
      withdrawMethod,
      ...(withdrawMethod === 'bank_transfer' ? {
        bankAccountName: withdrawBankName,
        bankBsb: withdrawBsb,
        bankAccountNumber: withdrawAccountNumber,
      } : {}),
      ...(withdrawMethod === 'payid' ? {
        payid: withdrawPayId,
        payidAccountName: withdrawPayIdName,
      } : {}),
    } as any);
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
      <Dialog open={depositModalOpen} onOpenChange={(open) => { setDepositModalOpen(open); if (!open) { setDepositSubmitted(null); setCardClientSecret(null); setAmount(''); setDepositMethod(''); } }}>
        <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Deposit {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Add funds to your {selectedWallet?.currency} wallet using multiple payment methods
            </DialogDescription>
          </DialogHeader>

          {depositSubmitted ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <span className="text-xl">⏳</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Deposit Submitted — Awaiting Funds</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Your balance will be credited once AMAX confirms receipt.</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Your Unique Reference Code</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200">{depositSubmitted.referenceCode}</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => { navigator.clipboard.writeText(depositSubmitted.referenceCode); toast({ title: "Copied", description: "Reference code copied to clipboard" }); }}>Copy</Button>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">Include this reference in your transfer so AMAX can match your payment.</p>
              </div>

              {depositSubmitted.method === 'payid' && (
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <p className="text-xs font-semibold">Send to AMAX PayID:</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs">info@amaxglobal.com.au</p>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { navigator.clipboard.writeText('info@amaxglobal.com.au'); toast({ title: "Copied" }); }}>Copy</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Account Name: AMAX Global Pty Ltd</p>
                </div>
              )}

              {depositSubmitted.method === 'bank_transfer' && (
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <p className="text-xs font-semibold">Transfer to AMAX Bank Account:</p>
                  <p className="text-xs">Bank: Westpac Banking Corporation</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs">BSB: 032-000</p>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { navigator.clipboard.writeText('032000'); toast({ title: "Copied" }); }}>Copy</Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs">Account: 123456789</p>
                    <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { navigator.clipboard.writeText('123456789'); toast({ title: "Copied" }); }}>Copy</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Account Name: AMAX Global Pty Ltd · SWIFT: WPACAU2S</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                Amount: <strong>{depositSubmitted.amount} {depositSubmitted.currency}</strong>
              </div>

              <Button className="w-full h-8 text-sm" onClick={() => {
                setDepositSubmitted(null);
                setDepositModalOpen(false);
                setAmount('');
                setDepositMethod('');
              }}>Done</Button>
            </div>
          ) : (
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
                      <SelectItem value="payid">🏦 PayID / NPP</SelectItem>
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
                    {stripeStatus && !stripeStatus.configured && (
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-xs font-semibold text-red-900 dark:text-red-100">Card payments temporarily unavailable</p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">Please use PayID or Bank Transfer instead, or contact AMAX support at info@amaxglobal.com.au.</p>
                      </div>
                    )}

                    {cardClientSecret && stripeStatus?.publishableKey ? (
                      <div className="space-y-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            Paying <strong>{amount} {selectedWallet?.currency}</strong> — enter your card details below
                          </p>
                        </div>
                        <StripePaymentForm
                          publishableKey={stripeStatus.publishableKey}
                          clientSecret={cardClientSecret}
                          onSuccess={() => {
                            setCardClientSecret(null);
                            queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
                            queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
                            toast({ title: "✅ Payment Submitted", description: "Your card payment is processing. Your balance will be updated shortly." });
                            setDepositModalOpen(false);
                            setAmount('');
                            setDepositMethod('');
                          }}
                          onError={(msg) => {
                            toast({ title: "Payment Failed", description: msg, variant: "destructive" });
                          }}
                        />
                        <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={() => setCardClientSecret(null)}>
                          ← Back
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2 text-sm">💳 Card Payment via Stripe</h4>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Visa, Mastercard, American Express accepted</p>
                            <p>• Processed by Stripe — PCI DSS Level 1 certified</p>
                            <p>• Card details secured by Stripe — never stored by AMAX</p>
                            <p>• Fee: 2.9% + $0.30 per transaction</p>
                            <p>• Funds credited after payment confirmation</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Enter the amount above, then click <strong>Pay Now</strong> to enter your card details securely.
                        </p>
                      </>
                    )}
                  </div>
                )}
                
                {depositMethod === 'payid' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">⚡ PayID / NPP Deposit</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Instant bank transfer via Australia's NPP / Osko network</p>
                        <p>• Available to all Australian bank account holders</p>
                        <p>• No transfer fees — free from your banking app</p>
                        <p>• Funds credited within 1–2 business hours of receipt</p>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Send to AMAX Global PayID:</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">PayID:</span> info@amaxglobal.com.au</p>
                        <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { navigator.clipboard.writeText('info@amaxglobal.com.au'); toast({ title: "Copied", description: "PayID copied to clipboard" }); }}>Copy</Button>
                      </div>
                      <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">Account Name:</span> AMAX Global Pty Ltd</p>
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 pt-1 border-t border-blue-200 dark:border-blue-700">Or pay by BSB (manual transfer fallback):</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">Bank:</span> Westpac Banking Corporation</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">BSB:</span> 032-000</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">Account:</span> 123456789</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">SWIFT:</span> WPACAU2S</p>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                      ⏳ Click Submit to record your deposit. A unique reference code will be generated — include it with your transfer so AMAX can match your payment.
                    </p>
                  </div>
                )}
                
                {depositMethod === 'bank_transfer' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">🏦 International Bank Transfer</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• SWIFT international transfers accepted</p>
                        <p>• Processing time: 1–3 business days</p>
                        <p>• Include your registered email as payment reference</p>
                        <p>• Balance credited once AMAX confirms receipt</p>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-1">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">AMAX Global Bank Details:</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">Bank:</span> Westpac Banking Corporation</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">BSB:</span> 032-000</p>
                        <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { navigator.clipboard.writeText('032000'); toast({ title: "Copied", description: "BSB copied" }); }}>Copy</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">Account:</span> 123456789</p>
                        <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { navigator.clipboard.writeText('123456789'); toast({ title: "Copied", description: "Account number copied" }); }}>Copy</Button>
                      </div>
                      <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">Account Name:</span> AMAX Global Pty Ltd</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200"><span className="font-medium">SWIFT:</span> WPACAU2S</p>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                      ⏳ Click Submit to record your deposit. A unique reference code will be generated — include it in your bank transfer description so AMAX can identify your payment.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  {depositMethod === 'card' ? (
                    !cardClientSecret && (
                      <Button
                        onClick={handleCardPayment}
                        disabled={cardLoading || !amount || !stripeStatus?.configured}
                        className="flex-1 h-8 text-sm"
                      >
                        {cardLoading ? "Preparing payment..." : "💳 Pay Now"}
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={handleDeposit}
                      disabled={depositMutation.isPending || !depositMethod || !amount}
                      className="flex-1 h-8 text-sm"
                    >
                      {depositMutation.isPending ? "Submitting..." : "Submit Deposit Request"}
                    </Button>
                  )}
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
          )}
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
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">🔗 Option 1 — Withdraw to External Wallet Address</p>
                  <p className="text-xs text-muted-foreground">
                    Send {selectedWallet?.currency} to any external wallet (Coinbase, Binance, Ledger, MetaMask, etc.). Enter your destination address below.
                  </p>
                  <div>
                    <Label htmlFor="crypto-withdraw-address" className="text-xs">Destination Wallet Address</Label>
                    <Input
                      id="crypto-withdraw-address"
                      placeholder={selectedWallet?.currency === 'BTC' ? '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf...' : '0x742d35Cc6634C0532925a3b8D4C9b8f...'}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="crypto-withdraw-network" className="text-xs">Network</Label>
                    <Select>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedWallet?.currency === 'BTC' && <SelectItem value="bitcoin">Bitcoin (BTC)</SelectItem>}
                        {(selectedWallet?.currency === 'ETH' || selectedWallet?.currency === 'USDT' || selectedWallet?.currency === 'USDC') && <SelectItem value="erc20">Ethereum (ERC-20)</SelectItem>}
                        {(selectedWallet?.currency === 'USDT' || selectedWallet?.currency === 'USDC') && <SelectItem value="trc20">Tron (TRC-20)</SelectItem>}
                        {selectedWallet?.currency === 'LTC' && <SelectItem value="litecoin">Litecoin (LTC)</SelectItem>}
                        {selectedWallet?.currency === 'XRP' && <SelectItem value="xrp">XRP Ledger</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                    ⏳ Blockchain withdrawals are reviewed by AMAX compliance before execution. Network fees apply.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-1 h-8 text-sm"
                    onClick={() => window.location.href = `mailto:info@amaxglobal.com.au?subject=Crypto Withdrawal Request - ${selectedWallet?.currency}&body=Please process my withdrawal request. Currency: ${selectedWallet?.currency}. I have entered my wallet address above.`}
                  >
                    Submit Withdrawal Request
                  </Button>
                </div>

                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">🔄 Option 2 — Internal Transfer (Instant, Zero Fees)</p>
                  <p className="text-xs text-muted-foreground">
                    Send {selectedWallet?.currency} instantly to another AMAX user by their registered email address. No blockchain fees — settled on the AMAX internal ledger.
                  </p>
                  <div>
                    <Label htmlFor="internal-transfer-amount" className="text-xs">Amount ({selectedWallet?.currency})</Label>
                    <Input
                      id="internal-transfer-amount"
                      type="number"
                      value={internalTransferAmount}
                      onChange={(e) => setInternalTransferAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-8 text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="crypto-internal-email" className="text-xs">Recipient AMAX Email</Label>
                    <Input
                      id="crypto-internal-email"
                      type="email"
                      value={internalTransferEmail}
                      onChange={(e) => setInternalTransferEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    className="w-full mt-1 h-8 text-sm"
                    disabled={internalTransferMutation.isPending || !internalTransferEmail || !internalTransferAmount}
                    onClick={() => {
                      if (!selectedWallet || !internalTransferEmail || !internalTransferAmount) {
                        toast({ title: "Missing fields", description: "Enter amount and recipient email.", variant: "destructive" });
                        return;
                      }
                      internalTransferMutation.mutate({
                        currency: selectedWallet.currency,
                        amount: parseFloat(internalTransferAmount),
                        recipientEmail: internalTransferEmail,
                      });
                    }}
                  >
                    {internalTransferMutation.isPending ? "Transferring..." : `⚡ Send ${selectedWallet?.currency} Instantly`}
                  </Button>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">💱 Option 3 — Convert to AUD, then bank withdraw</p>
                  <p className="text-xs text-muted-foreground">
                    Use the Crypto Exchange to convert {selectedWallet?.currency} to AUD, then withdraw to your bank account via Bank Transfer or PayID.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full mt-2 h-8 text-sm"
                    onClick={() => { setWithdrawModalOpen(false); navigate('/crypto'); }}
                  >
                    Go to Crypto Exchange
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
                    <SelectItem value="payid">⚡ PayID / NPP (AUD instant)</SelectItem>
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
              {withdrawMethod === 'payid' && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">⚡ PayID / NPP Withdrawal</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Instant payout via Australia's NPP / Osko network</p>
                      <p>• Settlement: seconds to minutes (business hours)</p>
                      <p>• AUD wallets only — receive funds at your PayID</p>
                      <p>• No fees charged by AMAX for PayID payouts</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="withdraw-payid" className="text-xs">Your PayID (email or phone)</Label>
                      <Input
                        id="withdraw-payid"
                        type="text"
                        placeholder="you@example.com or +61400000000"
                        className="h-8 text-sm"
                        value={withdrawPayId}
                        onChange={(e) => setWithdrawPayId(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="withdraw-payid-name" className="text-xs">Account Holder Name</Label>
                      <Input
                        id="withdraw-payid-name"
                        placeholder="John Chen"
                        className="h-8 text-sm"
                        value={withdrawPayIdName}
                        onChange={(e) => setWithdrawPayIdName(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                    ⏳ Withdrawal requests are reviewed by AMAX before payout. Funds will be sent once approved (typically within 1 business day).
                  </p>
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
                        value={withdrawBankName}
                        onChange={(e) => setWithdrawBankName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="withdraw-bsb" className="text-xs">BSB (if Australian)</Label>
                      <Input
                        id="withdraw-bsb"
                        placeholder="123-456"
                        className="h-8 text-sm"
                        value={withdrawBsb}
                        onChange={(e) => setWithdrawBsb(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="withdraw-account-number" className="text-xs">Account Number</Label>
                      <Input
                        id="withdraw-account-number"
                        placeholder="12345678"
                        className="h-8 text-sm"
                        value={withdrawAccountNumber}
                        onChange={(e) => setWithdrawAccountNumber(e.target.value)}
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