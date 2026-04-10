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
import { TrendingUp, TrendingDown, Plus, Minus, ArrowUpDown, Send, Repeat, Info, DollarSign, AlertCircle, Volume2, Settings, ExternalLink, Shield } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useFxRate } from '@/hooks/use-fx-rates';
import { useWallets } from '@/hooks/use-portfolio';
import RateSparkline from '@/components/fx/rate-sparkline';
import { useVoiceNarration } from '@/hooks/use-voice-narration';
import VoiceSettings from '@/components/voice/voice-settings';
import { useAuth } from '@/contexts/auth';

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
  const { user } = useAuth();
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
  const [withdrawTransferType, setWithdrawTransferType] = useState<'domestic' | 'international'>('domestic');
  const [depositTransferType, setDepositTransferType] = useState<'domestic' | 'international'>('domestic');
  const [payerName, setPayerName] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [payerAccountNumber, setPayerAccountNumber] = useState('');
  const [payerBsb, setPayerBsb] = useState('');
  const [internalTransferEmail, setInternalTransferEmail] = useState('');
  const [internalTransferAmount, setInternalTransferAmount] = useState('');
  const [internalTransferPurpose, setInternalTransferPurpose] = useState('personal');
  const [recipientVerified, setRecipientVerified] = useState<{ maskedName: string } | null>(null);
  const [recipientVerifyPending, setRecipientVerifyPending] = useState(false);
  const [recipientVerifyError, setRecipientVerifyError] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawBsb, setWithdrawBsb] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawPayId, setWithdrawPayId] = useState('');
  const [withdrawPayIdName, setWithdrawPayIdName] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('');
  const [beneficiaryPhysicalAddress, setBeneficiaryPhysicalAddress] = useState('');
  const [withdrawPurpose, setWithdrawPurpose] = useState('');
  const [isSelfHosted, setIsSelfHosted] = useState(false);
  const [vaspName, setVaspName] = useState('');
  const [depositSubmitted, setDepositSubmitted] = useState<{ referenceCode: string; currency: string; amount: string; method: string } | null>(null);

  // Coinbase Commerce — crypto deposit / withdrawal
  const [coinbaseCharge, setCoinbaseCharge] = useState<{
    chargeCode: string; hostedUrl: string; address: string | null;
    networkKey: string; expiresAt: string; allAddresses: Record<string, string>;
  } | null>(null);
  const [coinbaseLoading, setCoinbaseLoading] = useState(false);
  const [cryptoWithdrawNetwork, setCryptoWithdrawNetwork] = useState('');
  const [cryptoWithdrawAmount, setCryptoWithdrawAmount] = useState('');

  const { data: checkoutStatus } = useQuery<{ configured: boolean }>({
    queryKey: ['/api/checkout/status'],
  });
  const { data: coinbaseStatus } = useQuery<{ configured: boolean }>({
    queryKey: ['/api/crypto/coinbase/status'],
  });

  const { data: depositInstructions } = useQuery<{
    payid: { identifier: string; accountName: string };
    bank: { bank: string; bsb: string; account: string; accountName: string; swift: string };
  }>({
    queryKey: ['/api/deposit/instructions'],
  });

  const { data: pendingTransactions } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
    select: (txns) => txns.filter((t) => t.status === 'pending'),
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

  // Checkout.com return handler — runs once on mount.
  // Checkout.com redirects back with ?checkout=success or ?checkout=cancel/failed.
  // The actual balance credit happens via the Checkout.com webhook (server-side), not here.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutResult = params.get('checkout');

    if (checkoutResult === 'cancel' || checkoutResult === 'failed') {
      window.history.replaceState({}, '', '/wallets');
      toast({
        title: checkoutResult === 'failed' ? "Payment Failed" : "Payment Cancelled",
        description: checkoutResult === 'failed'
          ? "Your card payment was declined. Please try again or use a different payment method."
          : "Your card payment was not completed. No funds were charged.",
        variant: "destructive",
      });
      return;
    }

    if (checkoutResult === 'success') {
      window.history.replaceState({}, '', '/wallets');
      toast({
        title: "✅ Payment Received",
        description: "Your card payment was successful. Funds will appear in your wallet shortly once confirmed by Checkout.com.",
      });
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
  // Card deposits go via Checkout.com hosted payment (handleCheckoutPayment below).
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
        toast({ title: "✅ Transfer In Submitted", description: msg });
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
        title: "Transfer In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Coinbase Commerce — generate deposit address for crypto/stablecoin wallet
  // Coinbase holds the assets; AMAX credits on charge:confirmed webhook.
  const handleCoinbaseDeposit = async () => {
    if (!selectedWallet) return;
    setCoinbaseLoading(true);
    setCoinbaseCharge(null);
    try {
      const res = await apiRequest('POST', '/api/crypto/deposit-charge', {
        currency: selectedWallet.currency,
        walletId: selectedWallet.id,
      });
      const data = await res.json();
      setCoinbaseCharge(data);
    } catch (err: any) {
      toast({ title: 'Transfer Address Error', description: err.message, variant: 'destructive' });
    } finally {
      setCoinbaseLoading(false);
    }
  };

  // Coinbase Commerce — crypto withdrawal (pending, processed via Coinbase account by admin)
  const cryptoWithdrawMutation = useMutation({
    mutationFn: async (data: {
      currency: string; walletId: number; amount: string;
      destinationAddress: string; beneficiaryName: string;
      beneficiaryAddress: string; network: string;
      isSelfHosted?: boolean; vaspName?: string;
    }) => {
      const response = await apiRequest('POST', '/api/crypto/withdraw', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: '✅ Transfer Out Submitted',
        description: `Ref: ${data.referenceCode} — ${data.message}`,
      });
      setWithdrawModalOpen(false);
      setBeneficiaryAddress('');
      setBeneficiaryName('');
      setBeneficiaryPhysicalAddress('');
      setCryptoWithdrawNetwork('');
      setCryptoWithdrawAmount('');
    },
    onError: (error: any) => {
      toast({ title: 'Transfer Failed', description: 'The transfer could not be processed by our banking partner. Please try again or contact support.', variant: 'destructive' });
    },
  });

  // Checkout.com Hosted Payments — called for card deposits.
  // Creates a Checkout.com Hosted Payment Link and redirects to the secure payment page.
  // Balance is credited ONLY after Checkout.com fires the webhook (server-side).
  const handleCheckoutPayment = async () => {
    if (!selectedWallet || !amount) {
      toast({ title: "Missing Information", description: "Please enter an amount.", variant: "destructive" });
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await apiRequest('POST', '/api/checkout/create-payment-link', {
        walletId: selectedWallet.id,
        amount,
        currency: selectedWallet.currency,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || 'Failed to create payment link');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Card Payment Error", description: err.message, variant: "destructive" });
      setCheckoutLoading(false);
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
      const successMessage = `Your transfer-out request for ${amount} ${selectedWallet?.currency} has been submitted. Funds will be released by our regulated banking partner and sent to your nominated account — typically within 1 business day.`;
      
      toast({
        title: "⏳ Transfer Submitted",
        description: successMessage,
      });
      
      narrateSuccess("Transfer submitted and under review");
      
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setWithdrawModalOpen(false);
      setAmount('');
      setWithdrawMethod('');
      setWithdrawPurpose('');
      setWithdrawBankName('');
      setWithdrawBsb('');
      setWithdrawAccountNumber('');
      setWithdrawPayId('');
      setWithdrawPayIdName('');
      setBeneficiaryName('');
      setBeneficiaryAddress('');
      setBeneficiaryPhysicalAddress('');
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Please try again later.";
      
      // Voice narration
      narrateError(`Transfer could not be processed: ${errorMessage}`);
      
      toast({
        title: "Transfer Failed",
        description: `The transfer could not be processed by our regulated banking partner. ${errorMessage}`,
        variant: "destructive",
      });
    }
  });

  const internalTransferMutation = useMutation({
    mutationFn: async (data: { currency: string; amount: number; recipientEmail: string; purpose: string }) => {
      const response = await apiRequest("POST", "/api/transfer/internal", data);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Transfer failed");
      return json;
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer Sent",
        description: `${internalTransferAmount} ${selectedWallet?.currency} transferred to ${internalTransferEmail}. Reference: ${data.referenceId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setWithdrawModalOpen(false);
      setInternalTransferEmail('');
      setInternalTransferAmount('');
      setInternalTransferPurpose('personal');
      setRecipientVerified(null);
      setRecipientVerifyError('');
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyRecipient = async () => {
    if (!internalTransferEmail.trim()) return;
    setRecipientVerifyPending(true);
    setRecipientVerified(null);
    setRecipientVerifyError('');
    try {
      const response = await apiRequest("GET", `/api/users/verify-recipient?email=${encodeURIComponent(internalTransferEmail.trim())}`);
      const json = await response.json();
      if (json.valid) {
        setRecipientVerified({ maskedName: json.maskedName });
      } else {
        setRecipientVerifyError(json.error || "Recipient could not be verified.");
      }
    } catch {
      setRecipientVerifyError("Verification failed. Please try again.");
    } finally {
      setRecipientVerifyPending(false);
    }
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

    // Card deposits are handled by Checkout.com hosted payment redirect — not this path.
    if (depositMethod === 'card') {
      handleCheckoutPayment();
      return;
    }

    narrateTransaction('deposit', amount, selectedWallet.currency);
    depositMutation.mutate({
      type: "deposit",
      currency: selectedWallet.currency,
      amount: amount,
      method: depositMethod, // 'bank_transfer' | 'payid'
      // AML/CTF originator information — retained for 7 years per AML/CTF Act 2006 s.106
      ...(payerName ? { payerName } : {}),
      ...(payerBsb ? { payerBsb } : {}),
      ...(payerAccountNumber ? { payerAccountNumber } : {}),
    });
  };

  const handleWithdraw = () => {
    if (!selectedWallet || !amount || !withdrawMethod) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    // Purpose of transfer is mandatory under AML/CTF Act 2006 (Cth) — Part B §15
    if (!withdrawPurpose) {
      toast({ title: "Purpose of Transfer Required", description: "Please select a purpose of transfer. This is required under Australia's AML/CTF obligations.", variant: "destructive" });
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
      purposeOfTransfer: withdrawPurpose,
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

  // DCE compliance model (post-1 April 2026): AMAX does not maintain crypto accounts
  // for users. Only fiat wallets are displayed here. Crypto exchange is handled via
  // the Crypto Exchange page — purchased crypto is delivered to users' external wallets.
  const CRYPTO_CURRENCIES = ['BTC', 'ETH', 'USDT', 'USDC'];

  const walletsWithRegions = wallets
    .filter((wallet: any) => !CRYPTO_CURRENCIES.includes(wallet.currency)) // Fiat only — no crypto accounts
    .map((wallet: any) => ({
      ...wallet,
      config: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig],
      region: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig]?.region || 'Other'
    }))
    .sort((a: any, b: any) => {
      // AUD always first
      if (a.currency === 'AUD') return -1;
      if (b.currency === 'AUD') return 1;
      // Otherwise alphabetical
      return a.currency.localeCompare(b.currency);
    });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  // KYC gate — block wallet access until fully verified.
  // API enforces this too via requireKyc(); the UI gate prevents confusing
  // partial states where balances show but all actions throw 403.
  if (user && user.kycStatus !== "verified") {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold">KYC Verification Required</h2>
          <p className="text-sm text-muted-foreground">
            You must complete identity verification before accessing your wallets or performing any transactions. This is required under Australian AML/CTF law.
          </p>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-800 dark:text-yellow-300 text-left space-y-1">
            <p className="font-medium">Status: <span className="capitalize">{user.kycStatus ?? "not started"}</span></p>
            <p>Complete all 4 steps in the Compliance Centre to unlock your account.</p>
          </div>
          <Link href="/compliance">
            <Button className="mt-2">Go to Compliance Centre →</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transfer In / Transfer Out</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Move money between your external accounts and convert currencies.</p>
        </div>
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
        </div>
      </div>

      {/* Non-custodial disclosure */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-700 flex-shrink-0" />
          <p className="text-xs font-semibold text-blue-900">Important Information</p>
        </div>
        <p className="text-xs text-blue-800">
          AMAX Global Pty Ltd (ABN 54 690 827 608) is a <strong>non-custodial platform</strong>.
          Funds and digital assets are held with external regulated partners, including banking institutions
          and digital asset exchanges.
        </p>
        <p className="text-xs text-blue-800">
          AMAX does not hold or control client funds or digital assets. All transactions are executed via
          external partners and are subject to AML/CTF screening and KYC verification.
        </p>
        <div className="pt-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-blue-700">
          <div className="bg-white/60 rounded p-2 border border-blue-100">
            <p className="font-semibold mb-0.5">Transfer In</p>
            <p className="text-blue-600">From your external bank account to your nominated account with our external partner.</p>
          </div>
          <div className="bg-white/60 rounded p-2 border border-blue-100">
            <p className="font-semibold mb-0.5">Transfer Out</p>
            <p className="text-blue-600">To your external bank account via our external partner.</p>
          </div>
          <div className="bg-white/60 rounded p-2 border border-blue-100">
            <p className="font-semibold mb-0.5">Convert Currency</p>
            <p className="text-blue-600">Currency conversion executed via external liquidity providers.</p>
          </div>
        </div>
      </div>

      {/* Section 1: Your Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-base font-semibold">Balances (External Holdings)</span>
                <span className="text-xs font-normal text-muted-foreground ml-1">held with regulated partners · not controlled by AMAX</span>
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
                    <th className="text-left p-4 font-medium">Indicative Amount</th>
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
                            Eligible for transfer instruction: {wallet.config?.symbol}{wallet.availableBalance ? parseFloat(wallet.availableBalance).toLocaleString() : '0.00'}
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
                            title="Transfer In"
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
                            title="Transfer Out"
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


      {/* Pending Transactions Panel */}
      {pendingTransactions && pendingTransactions.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Transactions ({pendingTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {pendingTransactions.map((tx: any) => {
                let meta: any = {};
                try { meta = JSON.parse(tx.description ?? '{}'); } catch { /* ignore */ }
                const isDeposit = tx.type === 'deposit';
                const isWithdrawal = tx.type === 'withdrawal';
                const ref = meta.referenceCode ?? tx.referenceId ?? `#${tx.id}`;
                const method = meta.method ?? (isDeposit ? 'bank_transfer' : '');
                const amount = parseFloat(tx.amount ?? 0).toLocaleString('en-AU', { maximumFractionDigits: 8 });
                const currency = isDeposit ? tx.toCurrency ?? tx.fromCurrency : tx.fromCurrency;
                const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-AU', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '';

                return (
                  <div key={tx.id} className="flex items-start justify-between bg-white dark:bg-zinc-900 border border-amber-100 dark:border-amber-900 rounded-lg px-3 py-2 text-xs">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isDeposit ? 'text-green-700 dark:text-green-400' : isWithdrawal ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                          {isDeposit ? '↓ Incoming Transfer' : isWithdrawal ? '↑ Outgoing Transfer' : '⇄ Currency Conversion'}
                        </span>
                        <span className="text-muted-foreground capitalize">{method.replace(/_/g,' ')}</span>
                        <span className="ml-auto text-amber-700 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-[10px]">Pending</span>
                      </div>
                      <div className="text-muted-foreground truncate">
                        <span className="font-medium text-foreground">{amount} {currency}</span>
                        {ref && <> · Ref: <span className="font-mono">{ref}</span></>}
                      </div>
                      {date && <div className="text-[10px] text-muted-foreground">{date}</div>}
                      {isWithdrawal && meta.accountNumber && (
                        <div className="text-muted-foreground">To: {meta.accountName ?? ''} {meta.bsb ? `BSB ${meta.bsb}` : ''} {meta.accountNumber}</div>
                      )}
                      {isWithdrawal && meta.payid && (
                        <div className="text-muted-foreground">To PayID: {meta.payid} ({meta.accountName ?? ''})</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Transactions are processed by external regulated partners and will be updated once confirmation is received. For enquiries, contact: <strong>info@amaxglobal.com.au</strong></p>
          </CardContent>
        </Card>
      )}

      {/* Deposit Modal */}
      <Dialog open={depositModalOpen} onOpenChange={(open) => { setDepositModalOpen(open); if (!open) { setDepositSubmitted(null); setAmount(''); setDepositMethod(''); } }}>
        <DialogContent className="sm:max-w-[450px] max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Transfer In — {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Instruct an incoming transfer to your nominated {selectedWallet?.currency} account with our external partner
            </DialogDescription>
          </DialogHeader>

          {depositSubmitted ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                <span className="text-xl">⏳</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Transfer In Submitted — Awaiting Funds</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Your transfer instruction is completed once the external regulated banking partner confirms receipt of funds.</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Your Unique Reference Code</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-mono font-bold text-blue-800 dark:text-blue-200">{depositSubmitted.referenceCode}</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-3" onClick={() => { navigator.clipboard.writeText(depositSubmitted.referenceCode); toast({ title: "Copied", description: "Reference code copied to clipboard" }); }}>Copy</Button>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300">Include this reference code in your transfer so our team can match your payment.</p>
              </div>

              {(depositSubmitted.method === 'payid' || depositSubmitted.method === 'bank_transfer') && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    {depositSubmitted.method === 'payid' ? '⚡ Next Step — Receive Your Account Details' : '🏦 Next Step — Receive Your Account Details'}
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Your request has been recorded. Our team will send you the account details issued by our regulated banking partner. <strong>Do not send funds until you receive these details.</strong>
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Funds go directly to your designated account at our regulated partner — not to AMAX. AMAX does not receive or hold your funds.
                  </p>
                  <a
                    href={`mailto:info@amaxglobal.com.au?subject=Fund%20Account%20Request%20%E2%80%94%20Ref%20${depositSubmitted.referenceCode}&body=Hello%20AMAX%20Team%2C%0A%0AI%20have%20submitted%20a%20deposit%20request%20(Ref%3A%20${depositSubmitted.referenceCode})%20and%20would%20like%20to%20receive%20my%20designated%20account%20details%20from%20your%20regulated%20banking%20partner.%0A%0AMethod%3A%20${depositSubmitted.method === 'payid' ? 'PayID%20%2F%20NPP' : 'Bank%20Transfer'}%0AAmount%3A%20${depositSubmitted.amount}%20${depositSubmitted.currency}%0A%0AThank%20you.`}
                    className="block w-full text-center text-xs py-2 px-3 rounded bg-blue-700 hover:bg-blue-800 text-white font-medium"
                  >
                    ✉ Email us to receive your account details
                  </a>
                  <p className="text-xs text-blue-600 dark:text-blue-400 text-center">Or call: <strong>+61 2 1234 5678</strong></p>
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

            {/* ── Transfer Type selector — fiat wallets only ── */}
            {selectedWallet?.walletType === 'fiat' && (
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Transfer Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setDepositTransferType('domestic'); setDepositMethod(''); }}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all ${
                      depositTransferType === 'domestic'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-semibold">🇦🇺 Domestic</span>
                    <span className="text-xs text-gray-500 mt-0.5">Australia only · BSB / PayID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDepositTransferType('international'); setDepositMethod(''); }}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all ${
                      depositTransferType === 'international'
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-semibold">🌍 International</span>
                    <span className="text-xs mt-0.5 text-amber-600 font-medium">Coming Soon</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── International Coming Soon panel ── */}
            {selectedWallet?.walletType === 'fiat' && depositTransferType === 'international' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-blue-500 text-lg leading-none">🌐</span>
                  <div>
                    <p className="font-semibold text-blue-800 text-sm">International Transfer In — Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      International transfers are facilitated via external regulated partners.
                      This feature is not yet enabled in the current environment.
                    </p>
                  </div>
                </div>
                <div className="border-t border-blue-200 pt-3 space-y-1.5 text-xs text-blue-700">
                  <p className="font-medium text-blue-800">Planned capabilities:</p>
                  <p>• SWIFT / IBAN inbound wires from 50+ countries</p>
                  <p>• Facilitated via external regulated payment partners</p>
                  <p>• Full AML/CTF screening on all cross-border transfers</p>
                  <p>• FATF Travel Rule compliance for applicable transactions</p>
                </div>
                <p className="text-xs text-blue-600 italic">
                  To register interest in international transfers, contact{" "}
                  <a href="mailto:info@amaxglobal.com.au" className="underline font-medium">
                    info@amaxglobal.com.au
                  </a>
                </p>
              </div>
            )}

            {/* ── Domestic / Crypto deposit method selector ── */}
            {(selectedWallet?.walletType !== 'fiat' || depositTransferType === 'domestic') && (
              <div>
                <Label htmlFor="deposit-method-type">Transfer In Method</Label>
                <Select value={depositMethod} onValueChange={setDepositMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transfer method" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedWallet?.walletType === 'fiat' ? (
                      <>
                        <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                        <SelectItem value="payid">⚡ PayID / NPP (instant)</SelectItem>
                        <SelectItem value="bank_transfer">🏦 Australian Bank Transfer</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="blockchain">🔗 Blockchain Transfer</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                {parseFloat(amount) >= 10000 && (
                  <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-300">
                    <span className="flex-shrink-0">⚖️</span>
                    <span>
                      Transactions of {selectedWallet?.currency ?? ""} 10,000 or more are subject to mandatory reporting obligations under the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) §43. AMAX is required to submit a Threshold Transaction Report (TTR) to AUSTRAC.
                    </span>
                  </div>
                )}
              </div>
            )}

            {depositMethod === 'blockchain' && !['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) ? (
              <div className="space-y-3">
                {/* Coinbase Commerce — live deposit address generation */}
                {coinbaseStatus?.configured ? (
                  <>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                      <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">🔗 Blockchain Transfer In via Coinbase Commerce</p>
                      <p>Generate a secure, KYC-verified transfer address for your {selectedWallet?.currency} wallet. Custody is held by Coinbase — funds are credited automatically after blockchain confirmation.</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">⚠️ Only send <strong>{selectedWallet?.currency}</strong> to this address. Sending unsupported assets will result in permanent loss.</p>
                    </div>

                    {!coinbaseCharge ? (
                      <Button
                        className="w-full"
                        onClick={handleCoinbaseDeposit}
                        disabled={coinbaseLoading}
                      >
                        {coinbaseLoading ? 'Generating address…' : `Generate ${selectedWallet?.currency} Transfer Address`}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        {/* Primary address for selected currency */}
                        <div className="rounded-lg border bg-muted p-3 space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transfer Address ({coinbaseCharge.networkKey})</p>
                          {coinbaseCharge.address ? (
                            <>
                              <p className="text-xs font-mono break-all text-foreground select-all">{coinbaseCharge.address}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                                  onClick={() => { navigator.clipboard.writeText(coinbaseCharge.address!); toast({ title: 'Address Copied' }); }}>
                                  Copy Address
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs px-3"
                                  onClick={() => window.open(coinbaseCharge.hostedUrl, '_blank')}>
                                  <ExternalLink className="h-3 w-3 mr-1" /> Coinbase Page
                                </Button>
                              </div>
                              {/* QR code via public service */}
                              <div className="flex justify-center pt-1">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(coinbaseCharge.address)}`}
                                  alt="Transfer address QR code"
                                  className="rounded border"
                                  width={140}
                                  height={140}
                                />
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">Address not available for {selectedWallet?.currency} — use the Coinbase-hosted page instead.</p>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground bg-muted rounded p-2 space-y-1">
                          <p>• Charge expires: <strong>{new Date(coinbaseCharge.expiresAt).toLocaleString()}</strong></p>
                          <p>• Funds credit automatically after blockchain confirmation (typically 3–6 confirmations)</p>
                          <p>• Charge ref: <span className="font-mono">{coinbaseCharge.chargeCode}</span></p>
                        </div>

                        <Button variant="outline" size="sm" className="w-full h-7 text-xs"
                          onClick={() => { setCoinbaseCharge(null); }}>
                          Generate New Address
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Coinbase Commerce API key not yet configured */
                  <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4 space-y-3">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Crypto Transfer In — {selectedWallet?.currency} Wallet Address</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      A unique {selectedWallet?.currency} transfer address will be assigned to your account upon request. This address is linked to your verified identity and ensures compliance with AUSTRAC AML/CTF obligations and the FATF Travel Rule.
                    </p>
                    <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <p>• Your transfer address is unique to your account — do not share it</p>
                      <p>• Only send {selectedWallet?.currency} — other assets cannot be credited</p>
                      <p>• Funds are credited after network confirmation and AML screening</p>
                      <p>• All transfers are subject to blockchain analytics review</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full"
                      onClick={() => window.location.href = `mailto:info@amaxglobal.com.au?subject=Crypto Transfer Address Request - ${selectedWallet?.currency}`}>
                      Request my {selectedWallet?.currency} transfer address
                    </Button>
                  </div>
                )}
              </div>
            ) : depositMethod && depositMethod !== 'blockchain' && (
              <>
                {depositMethod === 'card' && (
                  <div className="space-y-3">
                    {checkoutStatus && !checkoutStatus.configured && (
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-xs font-semibold text-red-900 dark:text-red-100">Card payments temporarily unavailable</p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">Please use PayID or Bank Transfer instead, or contact AMAX support at info@amaxglobal.com.au.</p>
                      </div>
                    )}
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">💳 Card Payment via Checkout.com</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Visa, Mastercard, American Express accepted</p>
                        <p>• Processed by Checkout.com — PCI DSS Level 1 certified</p>
                        <p>• Card details secured by Checkout.com — never stored by AMAX</p>
                        <p>• Payment is settled to an external regulated partner — AMAX does not receive funds</p>
                        <p>• You will be redirected to Checkout.com's secure payment page</p>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                      ⏳ Once payment is confirmed by the external payment provider, the transfer instruction will be completed.
                    </p>
                  </div>
                )}
                
                {depositMethod === 'payid' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">⚡ PayID / NPP Transfer In</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Instant transfer via Australia's NPP / Osko network</p>
                        <p>• Available to Australian bank account holders</p>
                        <p>• No transfer fees (from your bank)</p>
                        <p>• Typically processed within 1–2 business hours after partner confirmation</p>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">⚡ How it works</p>
                      <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                        <p>1. Submit this request — a unique reference code will be generated.</p>
                        <p>2. You will receive PayID details issued by our regulated banking partner.</p>
                        <p>3. Send funds to that partner-issued PayID.</p>
                        <p>4. The external partner confirms receipt.</p>
                        <p>5. Your transfer instruction is marked as completed.</p>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 pt-1 border-t border-blue-200 dark:border-blue-700">
                        Funds are held with the external regulated banking partner at all times. AMAX does not receive or hold client funds.
                      </p>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                      ⏳ Click Submit to record your request. You will receive your partner-issued PayID details by email before sending funds.
                    </p>
                  </div>
                )}
                
                {depositMethod === 'bank_transfer' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">🏦 Australian Bank Transfer (BSB)</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Transfer via BSB + account number from your Australian bank</p>
                        <p>• Processing time: 1–3 business days</p>
                        <p>• Include your unique reference code in the transfer description</p>
                        <p>• Instruction completed once partner confirms receipt</p>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">🏦 How it works</p>
                      <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1.5">
                        <p>1. Submit this request — a unique reference code will be generated.</p>
                        <p>2. You will receive partner-issued bank details (BSB + account number).</p>
                        <p>3. Send funds to that external partner.</p>
                        <p>4. The external partner confirms receipt.</p>
                        <p>5. Your transfer instruction is completed (typically 1–3 business days).</p>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 pt-1 border-t border-blue-200 dark:border-blue-700">
                        Funds are held with the external regulated banking partner at all times. AMAX does not receive or hold client funds.
                      </p>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                      ⏳ Click Submit to record your request. You will receive your partner-issued bank details by email before sending funds.
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  {depositMethod === 'card' ? (
                    <Button
                      onClick={handleCheckoutPayment}
                      disabled={checkoutLoading || !amount || !checkoutStatus?.configured}
                      className="flex-1 h-8 text-sm"
                    >
                      {checkoutLoading ? "Redirecting to Checkout.com..." : "💳 Pay Now"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleDeposit}
                      disabled={depositMutation.isPending || !depositMethod || !amount}
                      className="flex-1 h-8 text-sm"
                    >
                      {depositMutation.isPending ? "Submitting..." : "Submit Transfer Request"}
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
            <DialogTitle>Transfer Out — {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Instruct our regulated banking partner to send {selectedWallet?.currency} funds to your nominated account
            </DialogDescription>
          </DialogHeader>

          {/* Global AML/CTF compliance notice */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-700 p-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
            <p className="font-semibold text-gray-800 dark:text-gray-200">🛡️ AML / Travel Rule Compliance</p>
            <p>All transfer-out instructions are subject to: identity verification (KYC) · beneficiary information collection (FATF Travel Rule) · sanctions and PEP screening · ongoing transaction monitoring for suspicious activity. By proceeding, you confirm all information provided is accurate and complete. Transactions may be reported to AUSTRAC where required by law.</p>
          </div>

          {/* ── CRYPTO WALLET — cannot withdraw directly to bank ── */}
          {selectedWallet?.walletType === 'crypto' ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-sm font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Digital assets cannot be transferred out directly to a bank account</p>
                    <p className="text-sm text-amber-800 mt-1">
                      {selectedWallet?.currency} must be converted to a fiat currency first, then transferred out via bank transfer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border p-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium">🔗 Option 1 — Transfer Out to External Wallet Address</p>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <p>Instruct a transfer of {selectedWallet?.currency} to any verified external wallet. All fields below are mandatory under the AUSTRAC Travel Rule (FATF Rec. 16):</p>
                      <p className="mt-1">• Destination wallet address · Beneficiary full legal name</p>
                      <p>• Beneficiary physical/postal address · Wallet type (self-hosted or VASP)</p>
                      <p>• Receiving exchange / VASP name (if not self-hosted)</p>
                      <p className="mt-1 text-amber-700 dark:text-amber-400">Transfer-out requests are reviewed by our compliance team within 1 business day. High-risk transactions may require additional verification.</p>
                    </div>
                  </div>

                  {/* AUSTRAC Travel Rule disclosure */}
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800">
                    <span className="flex-shrink-0 mt-0.5">🛡️</span>
                    <span>
                      <strong>FATF Travel Rule (AUSTRAC):</strong> For all crypto transfers, AMAX is required to collect and transmit originator and beneficiary information to the receiving VASP. Your details and the recipient's name must be provided below.
                    </span>
                  </div>

                  <div>
                    <Label htmlFor="crypto-withdraw-address" className="text-xs">Destination Wallet Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="crypto-withdraw-address"
                      value={beneficiaryAddress}
                      onChange={e => setBeneficiaryAddress(e.target.value)}
                      placeholder={selectedWallet?.currency === 'BTC' ? '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf...' : '0x742d35Cc6634C0532925a3b8D4C9b8f...'}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="crypto-beneficiary-name" className="text-xs">Beneficiary Full Legal Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="crypto-beneficiary-name"
                      value={beneficiaryName}
                      onChange={e => setBeneficiaryName(e.target.value)}
                      placeholder="Full legal name of the wallet owner"
                      className="h-8 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">Full legal name of the person or entity that owns the destination wallet (required — FATF Travel Rule).</p>
                  </div>
                  <div>
                    <Label htmlFor="crypto-beneficiary-physical" className="text-xs">Beneficiary Physical / Postal Address <span className="text-red-500">*</span></Label>
                    <Input
                      id="crypto-beneficiary-physical"
                      value={beneficiaryPhysicalAddress}
                      onChange={e => setBeneficiaryPhysicalAddress(e.target.value)}
                      placeholder="Street address, suburb, state, postcode, country"
                      className="h-8 text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">Physical or registered address of the beneficiary — required under AUSTRAC AML/CTF Rule 77B.</p>
                  </div>

                  {/* Travel Rule — wallet type (mandatory from 1 Jul 2026 per FATF / AUSTRAC) */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2.5">
                    <p className="text-xs font-semibold text-blue-900">Wallet Type Declaration — AUSTRAC Travel Rule (effective 1 Jul 2026)</p>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelfHosted}
                        onChange={e => { setIsSelfHosted(e.target.checked); setVaspName(''); }}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-600 flex-shrink-0"
                      />
                      <span className="text-xs text-blue-800 leading-relaxed">
                        This is a <strong>self-hosted wallet</strong> (hardware wallet, software wallet, or non-custodial address) not held with a regulated exchange or VASP.
                      </span>
                    </label>
                    {isSelfHosted ? (
                      <div className="rounded bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
                        ⚠️ Self-hosted wallet transfers must be reported to the AUSTRAC CEO within 10 business days from 1 July 2026. AMAX Compliance will process this report on your behalf.
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="vasp-name" className="text-xs">Receiving Exchange / VASP Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="vasp-name"
                          value={vaspName}
                          onChange={e => setVaspName(e.target.value)}
                          placeholder="e.g. Coinbase, Binance, Kraken, Independent Reserve"
                          className="h-8 text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-0.5">Name of the regulated exchange or VASP that controls the destination wallet — required to transmit Travel Rule data to the receiving institution.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="crypto-withdraw-amount" className="text-xs">Amount ({selectedWallet?.currency}) <span className="text-red-500">*</span></Label>
                    <Input
                      id="crypto-withdraw-amount"
                      type="number"
                      value={cryptoWithdrawAmount}
                      onChange={e => setCryptoWithdrawAmount(e.target.value)}
                      placeholder="0.00000000"
                      className="h-8 text-sm font-mono"
                      min="0"
                    />
                    {selectedWallet && (
                      <p className="text-xs text-muted-foreground mt-0.5">Available for transfer: {selectedWallet.balance} {selectedWallet.currency}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="crypto-withdraw-network" className="text-xs">Network <span className="text-red-500">*</span></Label>
                    <Select value={cryptoWithdrawNetwork} onValueChange={setCryptoWithdrawNetwork}>
                      <SelectTrigger className="h-8 text-sm" id="crypto-withdraw-network">
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
                    ⏳ Transfer-out requests are processed via Coinbase by our compliance team (Compliance Officer: Qin Xiong) within 1 business day after review. Network fees apply.
                  </p>
                  <Button
                    className="w-full mt-1 h-8 text-sm"
                    disabled={cryptoWithdrawMutation.isPending}
                    onClick={() => {
                      if (!beneficiaryAddress || !beneficiaryName || !beneficiaryPhysicalAddress || !cryptoWithdrawAmount || !cryptoWithdrawNetwork) {
                        toast({ title: "Fields Required", description: "All fields are required under the AUSTRAC Travel Rule (destination address, beneficiary name, beneficiary address, amount, network).", variant: "destructive" });
                        return;
                      }
                      if (!isSelfHosted && !vaspName.trim()) {
                        toast({ title: "VASP Name Required", description: "Please enter the name of the receiving exchange or VASP, or declare this as a self-hosted wallet.", variant: "destructive" });
                        return;
                      }
                      if (!selectedWallet) return;
                      cryptoWithdrawMutation.mutate({
                        currency: selectedWallet.currency,
                        walletId: selectedWallet.id,
                        amount: cryptoWithdrawAmount,
                        destinationAddress: beneficiaryAddress,
                        beneficiaryName,
                        beneficiaryAddress: beneficiaryPhysicalAddress,
                        network: cryptoWithdrawNetwork,
                        isSelfHosted,
                        ...(vaspName.trim() ? { vaspName: vaspName.trim() } : {}),
                      });
                    }}
                  >
                    {cryptoWithdrawMutation.isPending ? 'Submitting…' : 'Submit Transfer Request'}
                  </Button>
                </div>

                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-sm font-medium">💱 Option 2 — Convert to AUD, then instruct a bank transfer out</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Convert {selectedWallet?.currency} to AUD via the Digital Asset Exchange, then instruct a transfer out to your verified Australian bank account via Bank Transfer or PayID.</p>
                    <p className="mt-1">• Bank account must be registered in your KYC-verified legal name — third-party transfers are not permitted</p>
                    <p>• All fiat transfers are monitored for AML/CTF compliance and are auditable under AUSTRAC regulations</p>
                  </div>
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

              {/* ── Transfer Type selector ── */}
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Transfer Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawTransferType('domestic')}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all ${
                      withdrawTransferType === 'domestic'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-semibold">🇦🇺 Domestic</span>
                    <span className="text-xs text-gray-500 mt-0.5">Australia only · BSB / PayID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawTransferType('international')}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all ${
                      withdrawTransferType === 'international'
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-semibold">🌍 International</span>
                    <span className="text-xs mt-0.5 text-amber-600 font-medium">Coming Soon</span>
                  </button>
                </div>
              </div>

              {/* ── International: info panel only — no fields ── */}
              {withdrawTransferType === 'international' && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-blue-500 text-lg leading-none">🌐</span>
                    <div>
                      <p className="font-semibold text-blue-800 text-sm">International Transfer — Coming Soon</p>
                      <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        International transfers are facilitated via external regulated partners.
                        This feature is not yet enabled in the current environment.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-blue-200 pt-3 space-y-1.5 text-xs text-blue-700">
                    <p className="font-medium text-blue-800">Planned capabilities:</p>
                    <p>• SWIFT / IBAN wire transfers to 50+ countries</p>
                    <p>• Facilitated via external regulated payment partners</p>
                    <p>• Full AML/CTF screening on all cross-border transfers</p>
                    <p>• FATF Travel Rule compliance for applicable transactions</p>
                  </div>
                  <p className="text-xs text-blue-600 italic">
                    To register interest in international transfers, contact{" "}
                    <a href="mailto:info@amaxglobal.com.au" className="underline font-medium">
                      info@amaxglobal.com.au
                    </a>
                  </p>
                </div>
              )}

              {/* ── Domestic: existing transfer form ── */}
              {withdrawTransferType === 'domestic' && (<>
              <div>
                <Label htmlFor="withdraw-method">Transfer Method</Label>
                <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transfer method" />
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
                    Indicative available amount (external): {selectedWallet.availableBalance} {selectedWallet.currency}
                  </p>
                )}
                {parseFloat(amount) >= 10000 && (
                  <div className="flex items-start gap-2 mt-2 p-2.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-300">
                    <span className="flex-shrink-0">⚖️</span>
                    <span>
                      Transactions of {selectedWallet?.currency ?? ""} 10,000 or more are subject to mandatory reporting obligations under the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) §43. AMAX is required to submit a Threshold Transaction Report (TTR) to AUSTRAC.
                    </span>
                  </div>
                )}
              </div>

              {/* Purpose of Transfer — mandatory under AML/CTF Act 2006 (Cth) Part B §15 */}
              <div>
                <Label htmlFor="withdraw-purpose" className="text-xs font-medium">
                  Purpose of Transfer <span className="text-red-500">*</span>{" "}
                  <span className="text-gray-400 font-normal">(AML/CTF required)</span>
                </Label>
                <Select value={withdrawPurpose} onValueChange={setWithdrawPurpose}>
                  <SelectTrigger id="withdraw-purpose" className="mt-1">
                    <SelectValue placeholder="Select purpose of transfer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_savings">Personal savings / living expenses</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="business_payment">Business / commercial payment</SelectItem>
                    <SelectItem value="remittance">International remittance</SelectItem>
                    <SelectItem value="property_purchase">Property purchase</SelectItem>
                    <SelectItem value="education">Education / study fees</SelectItem>
                    <SelectItem value="medical">Medical / healthcare</SelectItem>
                    <SelectItem value="salary_wages">Salary / wages</SelectItem>
                    <SelectItem value="loan_repayment">Loan repayment</SelectItem>
                    <SelectItem value="other">Other (specify in notes)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Required under AUSTRAC AML/CTF obligations. This information is collected for compliance monitoring.
                </p>
              </div>

              {withdrawMethod === 'payid' && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">⚡ PayID / NPP Transfer Out</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Transfer instruction processed via Australia's NPP / Osko network</p>
                      <p>• Typically settled seconds to minutes (business hours)</p>
                      <p>• AUD accounts only — instruction sent to your PayID via external partner</p>
                      <p>• No AMAX fees for PayID transfer instructions</p>
                      <p>• PayID must be registered in your KYC-verified legal name</p>
                      <p>• Third-party PayID transfers are not permitted</p>
                      <p>• All transfer-out instructions are subject to AML/CTF monitoring and may be reported to AUSTRAC</p>
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
                        placeholder="Ken Lancaster"
                        className="h-8 text-sm"
                        value={withdrawPayIdName}
                        onChange={(e) => setWithdrawPayIdName(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                    ⏳ Transfer instructions are subject to review before being processed by the external regulated partner. The transaction will be completed once the partner confirms execution — typically within 1 business day.
                  </p>
                </div>
              )}

              {withdrawMethod === 'bank_transfer' && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">🏦 Australian Bank Transfer (BSB)</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Transfer will be executed by our external regulated banking partner</p>
                      <p>• Processing time: typically 1–3 business days after partner confirmation</p>
                      <p>• Transfer fee may apply (see fee schedule)</p>
                      <p>• The receiving account must be in your KYC-verified legal name — third-party transfers are not permitted</p>
                      <p>• All transfers are subject to AML/CTF monitoring and may be reported to AUSTRAC</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="withdraw-bank-name" className="text-xs">Bank Account Holder Name</Label>
                      <Input
                        id="withdraw-bank-name"
                        placeholder="Ken Lancaster"
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
              {withdrawMethod === 'bank_transfer' && (
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                  ⏳ Transfer instructions are subject to review before being processed by the external regulated partner. The transaction will be completed once the partner confirms execution — typically 1–3 business days.
                </p>
              )}
              </>)}
              {/* Domestic: Confirm + Cancel; International: Close only */}
              <div className="flex space-x-2 pt-2">
                {withdrawTransferType === 'domestic' && (
                  <Button
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending}
                    className="flex-1 h-8 text-sm"
                  >
                    {withdrawMutation.isPending ? "Processing..." : "Confirm Transfer"}
                  </Button>
                )}
                <Button variant="outline" className="h-8 text-sm flex-1" onClick={() => setWithdrawModalOpen(false)}>
                  {withdrawTransferType === 'international' ? 'Close' : 'Cancel'}
                </Button>
              </div>
              {/* Modal footer persistent disclosure (Item 1) */}
              <p className="text-xs text-center text-muted-foreground pt-1 border-t">
                Transfers are executed by regulated financial partners. AMAX does not hold client funds.
              </p>
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
                <span className="text-sm text-gray-600">Eligible for transfer instruction</span>
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
                Eligible for transfer instruction: {selectedWallet?.availableBalance} {selectedWallet?.currency}
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