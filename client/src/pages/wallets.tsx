import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Wallet, TrendingUp, ArrowUpDown, Download, Upload, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CurrencyConfig } from "@/lib/types";
import { useFxRate } from "@/hooks/use-fx-rates";
import { useWallets, usePortfolio } from "@/hooks/use-portfolio";

// Currency configuration from types
const currencyConfig = CurrencyConfig;

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
  
  if (amount && amount !== '') {
    const parsedAmount = parseFloat(amount);
    
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      const calculatedAmount = parsedAmount * rate;
      
      // Apply 0.5% fee
      const fee = calculatedAmount * 0.005;
      const finalAmount = calculatedAmount - fee;
      
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
  const { data: wallets = [], isLoading, error } = useWallets();
  const { data: portfolio } = usePortfolio();
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const { data: exchangeRate } = useFxRate("USD", selectedCurrency);
  
  // Modal states
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  
  // Form states
  const [amount, setAmount] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  
  // Payer information states
  const [payerPayId, setPayerPayId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerAccountNumber, setPayerAccountNumber] = useState("");
  const [payerBsb, setPayerBsb] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutations
  const depositMutation = useMutation({
    mutationFn: async (data: { currency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/wallets/deposit", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Deposit Request Submitted",
        description: "Your payer information has been recorded. Complete the transfer using the details shown.",
        duration: 5000,
      });
      setDepositModalOpen(false);
      resetForms();
    },
    onError: () => {
      toast({
        title: "Deposit Failed",
        description: "Unable to process deposit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { currency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/wallets/withdraw", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Withdrawal Successful",
        description: "Your withdrawal has been processed and balance updated.",
      });
      setWithdrawModalOpen(false);
      resetForms();
    },
    onError: () => {
      toast({
        title: "Withdrawal Failed",
        description: "Unable to process withdrawal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/fx-exchange", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      toast({
        title: "Transfer Successful",
        description: "Your currency exchange has been completed and balances updated.",
      });
      setTransferModalOpen(false);
      resetForms();
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "Unable to process transfer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper function to reset forms
  const resetForms = () => {
    setAmount("");
    setTargetCurrency("");
    setDepositMethod("");
    setWithdrawMethod("bank_transfer");
    setPayerPayId("");
    setPayerName("");
    setPayerAccountNumber("");
    setPayerBsb("");
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setCardholderName("");
  };

  // Handler functions
  const handleDeposit = () => {
    if (!amount || !selectedWallet || !depositMethod) {
      toast({
        title: "Missing Information",
        description: "Please enter amount and select deposit method.",
        variant: "destructive",
      });
      return;
    }

    // Skip payer validation for blockchain deposits
    if (depositMethod !== 'blockchain') {
      // Validate payer information based on method
      if (depositMethod === 'payid') {
        if (!payerPayId || !payerName) {
          toast({
            title: "Missing PayID Information",
            description: "Please enter your PayID and full name.",
            variant: "destructive",
          });
          return;
        }
      } else if (depositMethod === 'bank_transfer') {
        if (!payerName || !payerAccountNumber || !payerBsb) {
          toast({
            title: "Missing Bank Information",
            description: "Please enter your name, BSB, and account number.",
            variant: "destructive",
          });
          return;
        }
      } else if (depositMethod === 'card') {
        if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
          toast({
            title: "Missing Card Information",
            description: "Please complete all card fields.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    // For crypto purchases with fiat, convert AUD to crypto amount
    let finalAmount = depositAmount;
    if (selectedWallet.walletType === 'crypto' && (depositMethod === 'payid' || depositMethod === 'bank_transfer' || depositMethod === 'card')) {
      if (selectedWallet.currency === 'BTC') {
        finalAmount = depositAmount * 0.000023; // AUD to BTC
      } else if (selectedWallet.currency === 'ETH') {
        finalAmount = depositAmount * 0.00031; // AUD to ETH
      } else if (selectedWallet.currency === 'USDT' || selectedWallet.currency === 'USDC') {
        finalAmount = depositAmount * 0.98; // AUD to stablecoin
      }
    }
    
    depositMutation.mutate({ currency: selectedWallet.currency, amount: finalAmount });
  };

  const handleWithdraw = () => {
    if (!amount || !selectedWallet) return;
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0 || withdrawAmount > parseFloat(selectedWallet.availableBalance)) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0 and not exceed available balance.",
        variant: "destructive",
      });
      return;
    }
    withdrawMutation.mutate({ currency: selectedWallet.currency, amount: withdrawAmount });
  };

  const handleTransfer = () => {
    if (!amount || !selectedWallet || !targetCurrency) return;
    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0 || transferAmount > parseFloat(selectedWallet.availableBalance)) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be greater than 0 and not exceed available balance.",
        variant: "destructive",
      });
      return;
    }
    transferMutation.mutate({ 
      fromCurrency: selectedWallet.currency, 
      toCurrency: targetCurrency, 
      amount: transferAmount 
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Wallets</h1>
            <p className="text-gray-600">Manage your multi-currency accounts</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallets</h1>
          <p className="text-destructive">Failed to load wallet data</p>
        </div>
      </div>
    );
  }

  // Calculate total balance as fiat + crypto + stablecoins
  const totalBalanceUSD = portfolio ? 
    (parseFloat(portfolio.fiatValue) + parseFloat(portfolio.cryptoValue)) : 0;
  
  // Convert to selected currency
  const totalBalance = selectedCurrency === "USD" ? totalBalanceUSD : 
    (exchangeRate ? totalBalanceUSD * parseFloat(exchangeRate.rate) : totalBalanceUSD);
  
  // Convert individual asset values to selected currency
  const fiatValueUSD = portfolio ? parseFloat(portfolio.fiatValue) : 0;
  const cryptoValueUSD = portfolio ? parseFloat(portfolio.cryptoValue) : 0;
  
  const fiatValue = selectedCurrency === "USD" ? fiatValueUSD : 
    (exchangeRate ? fiatValueUSD * parseFloat(exchangeRate.rate) : fiatValueUSD);
  const cryptoValue = selectedCurrency === "USD" ? cryptoValueUSD : 
    (exchangeRate ? cryptoValueUSD * parseFloat(exchangeRate.rate) : cryptoValueUSD);
  
  // Get currency configuration for display
  const currencyInfo = currencyConfig[selectedCurrency as keyof typeof currencyConfig];
  const currencySymbol = currencyInfo?.symbol || selectedCurrency;

  // Filter wallets by category
  const fiatWallets = wallets?.filter(w => w.walletType === 'fiat') || [];
  const stablecoinWallets = wallets?.filter(w => ['USDT', 'USDC'].includes(w.currency)) || [];
  const cryptoWallets = wallets?.filter(w => w.walletType === 'crypto' && !['USDT', 'USDC'].includes(w.currency)) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallets</h1>
          <p className="text-gray-600">Manage your multi-currency accounts</p>
        </div>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Wallet
        </Button>
      </div>

      {/* Total Balance Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Total Balance Overview</CardTitle>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{currencyInfo?.flag || selectedCurrency}</span>
                  <span>{selectedCurrency}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(currencyConfig).map(([code, config]) => (
                <SelectItem key={code} value={code}>
                  <div className="flex items-center gap-2">
                    <span>{config.flag}</span>
                    <span>{code}</span>
                    <span className="text-sm text-gray-500">{config.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary mb-4">
            {currencySymbol}{totalBalance.toLocaleString()}
          </div>
          {selectedCurrency !== "USD" && exchangeRate && (
            <div className="text-sm text-gray-600 mb-4">
              ≈ ${totalBalanceUSD.toLocaleString()} USD • Rate: {parseFloat(exchangeRate.rate).toFixed(4)}
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Fiat Assets</p>
              <p className="text-lg font-semibold">
                {currencySymbol}{fiatValue.toLocaleString()}
              </p>
              {selectedCurrency !== "USD" && (
                <p className="text-xs text-gray-500">≈ ${fiatValueUSD.toLocaleString()} USD</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Crypto Assets</p>
              <p className="text-lg font-semibold">
                {currencySymbol}{cryptoValue.toLocaleString()}
              </p>
              {selectedCurrency !== "USD" && (
                <p className="text-xs text-gray-500">≈ ${cryptoValueUSD.toLocaleString()} USD</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Wallets</p>
              <p className="text-lg font-semibold">{wallets?.length || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-lg font-semibold text-green-600">
                {wallets?.filter(w => parseFloat(w.balance) > 0).length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiat Assets */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-600">💵</span>
          Fiat Assets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fiatWallets.map((wallet) => {
          const config = currencyConfig[wallet.currency as keyof typeof currencyConfig];
          const balance = parseFloat(wallet.balance);
          const availableBalance = parseFloat(wallet.availableBalance);
          const utilizationPercent = balance > 0 ? (availableBalance / balance) * 100 : 0;
          
          return (
            <Card key={wallet.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 ${config?.color || 'bg-gray-500'} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                  {config?.flag || wallet.currency.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-xl">{wallet.currency}</h3>
                  <p className="text-sm text-gray-600">{config?.name || wallet.currency}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Balance</span>
                  <span className="font-semibold text-lg">
                    {config?.symbol || '$'}{balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="font-semibold">
                    {config?.symbol || '$'}{availableBalance.toLocaleString()}
                  </span>
                </div>
                <Progress value={utilizationPercent} className="h-2" />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={() => {
                    setSelectedWallet({ ...wallet, config });
                    setDepositModalOpen(true);
                  }}
                >
                  Deposit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={() => {
                    setSelectedWallet({ ...wallet, config });
                    setWithdrawModalOpen(true);
                  }}
                >
                  Withdraw
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={() => {
                    setSelectedWallet({ ...wallet, config });
                    setTransferModalOpen(true);
                  }}
                >
                  Transfer
                </Button>
              </div>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Stablecoins */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-green-600">🟢</span>
          Stablecoins
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stablecoinWallets.map((wallet) => {
            const config = currencyConfig[wallet.currency as keyof typeof currencyConfig];
            const balance = parseFloat(wallet.balance);
            const availableBalance = parseFloat(wallet.availableBalance);
            const utilizationPercent = balance > 0 ? (availableBalance / balance) * 100 : 0;
            
            return (
              <Card key={wallet.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 ${config?.color || 'bg-gray-500'} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {config?.flag || wallet.currency.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">{wallet.currency}</h3>
                    <p className="text-sm text-gray-600">{config?.name || wallet.currency}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Balance</span>
                    <span className="font-semibold text-lg">
                      {config?.symbol || '$'}{balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="font-semibold">
                      {config?.symbol || '$'}{availableBalance.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={utilizationPercent} className="h-2" />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedWallet({ ...wallet, config });
                      setDepositModalOpen(true);
                    }}
                  >
                    Deposit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedWallet({ ...wallet, config });
                      setWithdrawModalOpen(true);
                    }}
                  >
                    Withdraw
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedWallet({ ...wallet, config });
                      setTransferModalOpen(true);
                    }}
                  >
                    Transfer
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Crypto Assets */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-orange-600">₿</span>
          Crypto Assets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoWallets.map((wallet) => {
            const config = currencyConfig[wallet.currency as keyof typeof currencyConfig];
            const balance = parseFloat(wallet.balance);
            const availableBalance = parseFloat(wallet.availableBalance);
            const utilizationPercent = balance > 0 ? (availableBalance / balance) * 100 : 0;
            
            return (
              <Card key={wallet.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 ${config?.color || 'bg-gray-500'} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {config?.flag || wallet.currency.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">{wallet.currency}</h3>
                    <p className="text-sm text-gray-600">{config?.name || wallet.currency}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Balance</span>
                    <span className="font-semibold text-lg">
                      {balance.toFixed(wallet.currency === 'BTC' ? 8 : 4)} {wallet.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="font-semibold">
                      {availableBalance.toFixed(wallet.currency === 'BTC' ? 8 : 4)} {wallet.currency}
                    </span>
                  </div>
                  <Progress value={utilizationPercent} className="h-2" />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedWallet({ ...wallet, config });
                      setDepositModalOpen(true);
                    }}
                  >
                    Deposit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedWallet({ ...wallet, config });
                      setWithdrawModalOpen(true);
                    }}
                  >
                    Withdraw
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedWallet({ ...wallet, config });
                      setTransferModalOpen(true);
                    }}
                  >
                    Transfer
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>



      {/* Deposit Modal */}
      <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-4">
          <DialogHeader>
            <DialogTitle>Deposit {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Add funds to your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="deposit-method">Deposit Method</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deposit method" />
                </SelectTrigger>
                <SelectContent>
                  {/* Blockchain option for crypto and stablecoins */}
                  {(selectedWallet?.walletType === 'crypto' || ['USDT', 'USDC'].includes(selectedWallet?.currency)) && (
                    <SelectItem value="blockchain">🔗 Blockchain Transfer</SelectItem>
                  )}
                  <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                  <SelectItem value="payid">📱 PayID (Australia Only)</SelectItem>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            {/* Blockchain Deposit Details */}
            {depositMethod === 'blockchain' && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium">Send {selectedWallet?.currency} to this address:</h4>
                <div className="bg-white p-3 rounded border">
                  <code className="text-sm break-all">
                    {selectedWallet?.currency === 'BTC' ? '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' :
                     selectedWallet?.currency === 'ETH' ? '0x742ba02c4c4b8ad0f3579a5fe8fcc456fa4a3924' :
                     ['USDT', 'USDC'].includes(selectedWallet?.currency) ? '0x742ba02c4c4b8ad0f3579a5fe8fcc456fa4a3924' : ''}
                  </code>
                </div>
                <div className="flex justify-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500">QR Code</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Network: {selectedWallet?.currency === 'BTC' ? 'Bitcoin (SegWit)' : 'Ethereum (ERC-20)'}
                </p>
              </div>
            )}

            {/* Card Payment Form */}
            {depositMethod === 'card' && (
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Card payments: 2.9% + $0.30 AUD fee • Limits: $50-$10,000 AUD
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="cardholder-name">Cardholder Name</Label>
                    <Input
                      id="cardholder-name"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="Full name on card"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PayID Form */}
            {depositMethod === 'payid' && (
              <div className="space-y-3">
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">PayID available for Australian residents only</p>
                </div>
                <div>
                  <Label htmlFor="payer-payid">Your PayID</Label>
                  <Input
                    id="payer-payid"
                    value={payerPayId}
                    onChange={(e) => setPayerPayId(e.target.value)}
                    placeholder="your.email@example.com or +61412345678"
                  />
                </div>
                <div>
                  <Label htmlFor="payer-name">Your Full Name</Label>
                  <Input
                    id="payer-name"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Full name as registered with PayID"
                  />
                </div>
              </div>
            )}

            {/* Bank Transfer Form */}
            {depositMethod === 'bank_transfer' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="payer-name-bank">Your Full Name</Label>
                  <Input
                    id="payer-name-bank"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="payer-bsb">Your BSB</Label>
                  <Input
                    id="payer-bsb"
                    value={payerBsb}
                    onChange={(e) => setPayerBsb(e.target.value)}
                    placeholder="123-456"
                  />
                </div>
                <div>
                  <Label htmlFor="payer-account">Your Account Number</Label>
                  <Input
                    id="payer-account"
                    value={payerAccountNumber}
                    onChange={(e) => setPayerAccountNumber(e.target.value)}
                    placeholder="Your account number"
                  />
                </div>
              </div>
            )}

            <Button 
              onClick={handleDeposit} 
              disabled={depositMutation.isPending}
              className="w-full mt-4"
            >
              {depositMutation.isPending ? "Processing..." : `Deposit ${selectedWallet?.currency}`}
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
              {selectedWallet && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {selectedWallet.config?.symbol}{selectedWallet.availableBalance} {selectedWallet.currency}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="target-currency">To Currency</Label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
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

            {selectedWallet && targetCurrency && amount && (
              <div className="p-3 bg-gray-50 rounded-md">
                <ExchangeRateDisplay 
                  fromCurrency={selectedWallet.currency}
                  toCurrency={targetCurrency}
                  amount={amount}
                />
              </div>
            )}

            <Button 
              onClick={() => handleTransfer()} 
              disabled={!targetCurrency || !amount || transferMutation.isPending}
              className="w-full mt-4"
            >
              {transferMutation.isPending ? "Converting..." : "Convert Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}