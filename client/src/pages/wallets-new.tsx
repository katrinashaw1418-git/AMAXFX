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
  
  console.log('ExchangeRateDisplay Debug:', { amount, rate, fromCurrency, toCurrency, hasAmount: !!amount });
  
  if (amount && String(amount).trim() !== '') {
    const amountNumber = parseFloat(String(amount));
    const rateNumber = rate;
    
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
  const [payerPayId, setPayerPayId] = useState('');
  const [payerName, setPayerName] = useState('');
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
      console.error("Transfer mutation onError called with error:", error);
      
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
      console.error("Deposit mutation onError called with error:", error);
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
      console.error("Withdraw mutation onError called with error:", error);
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

    // Voice narration
    narrateTransaction('deposit', amount, selectedWallet.currency);

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

    // Voice narration
    narrateTransaction('withdraw', amount, selectedWallet.currency);

    withdrawMutation.mutate({
      type: "withdraw",
      currency: selectedWallet.currency,
      amount: amount
    });
  };

  const handleTransfer = () => {
    const sourceWallet = selectedWallet;
    const sourceCurrency = sourceWallet?.currency;
    
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

    // Voice narration
    narrateTransaction('transfer', amount, `${sourceCurrency} to ${toCurrency}`);

    console.log("Starting transfer mutation...");
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
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  Deposits unavailable
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