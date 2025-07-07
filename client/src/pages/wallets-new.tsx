import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWallets, usePortfolio } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, MinusCircle, ArrowUpDown, Coins, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { useFxRate } from "@/hooks/use-fx-rates";

const currencyConfig = {
  USD: { name: "US Dollar", symbol: "$", color: "bg-blue-500", flag: "🇺🇸" },
  CAD: { name: "Canadian Dollar", symbol: "$", color: "bg-red-500", flag: "🇨🇦" },
  EUR: { name: "Euro", symbol: "€", color: "bg-blue-600", flag: "🇪🇺" },
  GBP: { name: "British Pound", symbol: "£", color: "bg-green-600", flag: "🇬🇧" },
  AUD: { name: "Australian Dollar", symbol: "$", color: "bg-orange-500", flag: "🇦🇺" },
  HKD: { name: "Hong Kong Dollar", symbol: "$", color: "bg-pink-500", flag: "🇭🇰" },
  SGD: { name: "Singapore Dollar", symbol: "$", color: "bg-red-600", flag: "🇸🇬" },
  BTC: { name: "Bitcoin", symbol: "₿", color: "bg-yellow-500", flag: "🟡" },
  ETH: { name: "Ethereum", symbol: "Ξ", color: "bg-purple-500", flag: "🟣" },
  USDT: { name: "Tether", symbol: "$", color: "bg-green-500", flag: "🟢" },
  USDC: { name: "USD Coin", symbol: "$", color: "bg-blue-400", flag: "🔵" },
};

// Exchange Rate Display Component
function ExchangeRateDisplay({ fromCurrency, toCurrency, amount }: { fromCurrency: string; toCurrency: string; amount: number }) {
  const { data: exchangeRate, isLoading, error } = useFxRate(fromCurrency, toCurrency);
  
  if (isLoading) {
    return (
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-center justify-center">
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }
  
  if (error || !exchangeRate || !exchangeRate.rate) {
    return (
      <div className="p-3 bg-muted rounded-lg">
        <div className="text-sm text-muted-foreground text-center">
          Exchange rate not available for {fromCurrency} → {toCurrency}
        </div>
      </div>
    );
  }
  
  const rate = Number(exchangeRate.rate) || 0;
  const convertedAmount = amount * rate;
  const fromConfig = currencyConfig[fromCurrency as keyof typeof currencyConfig];
  const toConfig = currencyConfig[toCurrency as keyof typeof currencyConfig];
  
  return (
    <div className="p-3 bg-muted rounded-lg border">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Exchange Rate:</span>
          <span className="font-mono">
            1 {fromCurrency} = {rate.toFixed(6)} {toCurrency}
          </span>
        </div>
        {amount > 0 && (
          <div className="flex items-center justify-center space-x-2 p-2 bg-background rounded border">
            <span className="font-mono text-sm">
              {fromConfig?.flag} {amount.toFixed(2)} {fromCurrency}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono text-sm font-medium">
              {toConfig?.flag} {convertedAmount.toFixed(6)} {toCurrency}
            </span>
          </div>
        )}
        {exchangeRate.updatedAt && (
          <div className="text-xs text-muted-foreground text-center">
            Rate updated: {new Date(exchangeRate.updatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Wallets() {
  const { data: wallets, isLoading, error } = useWallets();
  const { data: portfolio } = usePortfolio();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  const [payerPayId, setPayerPayId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerAccountNumber, setPayerAccountNumber] = useState("");
  const [payerBsb, setPayerBsb] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get exchange rate for selected currency
  const { data: exchangeRate } = useFxRate("USD", selectedCurrency);

  const depositMutation = useMutation({
    mutationFn: (data: { currency: string; amount: number }) => api.createDeposit(data),
    onSuccess: () => {
      // Force refetch all related data
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.refetchQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Deposit Request Submitted",
        description: "Your payer information has been recorded. Complete the transfer using the details shown.",
        duration: 5000,
      });
      setDepositModalOpen(false);
      setAmount("");
      setDepositMethod("");
      setPayerPayId("");
      setPayerName("");
      setPayerAccountNumber("");
      setPayerBsb("");
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
    mutationFn: (data: { currency: string; amount: number }) => api.createWithdrawal(data),
    onSuccess: () => {
      // Force refetch all related data
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.refetchQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Withdrawal Successful",
        description: "Your withdrawal has been processed and balance updated.",
      });
      setWithdrawModalOpen(false);
      setAmount("");
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
    mutationFn: (data: { fromCurrency: string; toCurrency: string; amount: number }) => api.createFxExchange(data),
    onSuccess: () => {
      // Force refetch all related data
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.refetchQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Transfer Successful",
        description: "Your currency exchange has been completed and balances updated.",
      });
      setTransferModalOpen(false);
      setAmount("");
      setTargetCurrency("");
      setDepositMethod("");
      setWithdrawMethod("bank_transfer");
      setPayerPayId("");
      setPayerName("");
      setPayerAccountNumber("");
      setPayerBsb("");
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "Unable to process transfer. Please try again.",
        variant: "destructive",
      });
    },
  });

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
        // Card deposits don't require additional validation - handled by card processor
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
    if (selectedWallet.walletType === 'crypto' && (depositMethod === 'payid' || depositMethod === 'bank_transfer')) {
      if (selectedWallet.currency === 'BTC') {
        finalAmount = depositAmount * 0.000023; // AUD to BTC
      } else if (selectedWallet.currency === 'ETH') {
        finalAmount = depositAmount * 0.00031; // AUD to ETH
      } else if (selectedWallet.currency === 'USDT' || selectedWallet.currency === 'USDC') {
        finalAmount = depositAmount * 0.98; // AUD to stablecoin
      }
    }
    
    // For demo purposes, we'll process the deposit immediately
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

  // Early returns after all hooks are defined
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

  // Calculate total balance as fiat + crypto + stablecoins (using portfolio data for accuracy)
  const totalBalanceUSD = portfolio ? 
    (parseFloat(portfolio.fiatValue) + parseFloat(portfolio.cryptoValue) + parseFloat(portfolio.stablecoinValue || "0")) : 0;
  
  // Convert to selected currency
  const totalBalance = selectedCurrency === "USD" ? totalBalanceUSD : 
    (exchangeRate ? totalBalanceUSD * parseFloat(exchangeRate.rate) : totalBalanceUSD);
  
  // Convert individual asset values to selected currency
  const fiatValueUSD = portfolio ? parseFloat(portfolio.fiatValue) : 0;
  const cryptoValueUSD = portfolio ? parseFloat(portfolio.cryptoValue) : 0;
  const stablecoinValueUSD = portfolio ? parseFloat(portfolio.stablecoinValue || "0") : 0;
  
  const fiatValue = selectedCurrency === "USD" ? fiatValueUSD : 
    (exchangeRate ? fiatValueUSD * parseFloat(exchangeRate.rate) : fiatValueUSD);
  const cryptoValue = selectedCurrency === "USD" ? cryptoValueUSD : 
    (exchangeRate ? cryptoValueUSD * parseFloat(exchangeRate.rate) : cryptoValueUSD);
  const stablecoinValue = selectedCurrency === "USD" ? stablecoinValueUSD : 
    (exchangeRate ? stablecoinValueUSD * parseFloat(exchangeRate.rate) : stablecoinValueUSD);
  
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
              <p className="text-sm text-gray-600">Stablecoins</p>
              <p className="text-lg font-semibold">
                {currencySymbol}{stablecoinValue.toLocaleString()}
              </p>
              {selectedCurrency !== "USD" && (
                <p className="text-xs text-gray-500">≈ ${stablecoinValueUSD.toLocaleString()} USD</p>
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
                    setSelectedWallet(wallet);
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
                    setSelectedWallet(wallet);
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
                    setSelectedWallet(wallet);
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
                      setSelectedWallet(wallet);
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
                      setSelectedWallet(wallet);
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
                      setSelectedWallet(wallet);
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
          <span className="text-yellow-600">₿</span>
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
                    {wallet.walletType === 'crypto' 
                      ? `${balance.toFixed(4)} ${wallet.currency}`
                      : `${config?.symbol || '$'}${balance.toLocaleString()}`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available</span>
                  <span className="font-semibold">
                    {wallet.walletType === 'crypto' 
                      ? `${availableBalance.toFixed(4)} ${wallet.currency}`
                      : `${config?.symbol || '$'}${availableBalance.toLocaleString()}`
                    }
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
                    setSelectedWallet(wallet);
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
                    setSelectedWallet(wallet);
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
                    setSelectedWallet(wallet);
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
        <DialogContent className="sm:max-w-[450px] max-h-[85vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle>Deposit {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Add funds to your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Deposit Method Selection */}
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

            {depositMethod === 'blockchain' && selectedWallet?.walletType === 'crypto' ? (
              // Blockchain deposit for crypto assets
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border mx-auto w-fit mb-3">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded flex flex-col items-center justify-center text-xs font-mono text-gray-600 p-2 relative">
                      {/* QR Code representation with the actual address */}
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">📱</span>
                        <span className="text-sm font-medium">Mobile Wallet</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Scan QR code with your mobile wallet app (MetaMask, Trust Wallet, etc.)
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💻</span>
                        <span className="text-sm font-medium">Desktop</span>
                      </div>
                      <p className="text-xs text-green-700">
                        Copy address and paste into your wallet application
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Only send {selectedWallet.currency} to this address. 
                    {selectedWallet.currency === "BTC" ? " Bitcoin network only." : 
                     selectedWallet.currency === "ETH" ? " Ethereum network only." :
                     " ERC-20 tokens on Ethereum network only."}
                    {" "}Minimum deposit: {selectedWallet.currency === "BTC" ? "0.001 BTC" : 
                                          selectedWallet.currency === "ETH" ? "0.01 ETH" : 
                                          `10 ${selectedWallet.currency}`}.
                  </p>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2">Deposit Methods Available</p>
                    <div className="flex justify-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        QR Code Scan
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Address Copy
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Mobile & Desktop
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      // Simulate a crypto deposit
                      const amount = selectedWallet.currency === "BTC" ? "0.1" : 
                                    selectedWallet.currency === "ETH" ? "1.0" : "1000.00";
                      depositMutation.mutate({
                        type: "deposit",
                        currency: selectedWallet.currency,
                        amount,
                      });
                    }} 
                    variant="outline" 
                    className="w-full"
                    disabled={depositMutation.isPending}
                  >
                    {depositMutation.isPending ? "Processing..." : `Simulate Demo Deposit (${selectedWallet.currency})`}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    For testing: adds demo {selectedWallet.currency} to your balance
                  </p>
                </div>
              </div>
            ) : depositMethod && (depositMethod === 'payid' || depositMethod === 'bank_transfer' || depositMethod === 'card') ? (
              // Traditional banking deposit for fiat currencies and stablecoin purchases
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💰</span>
                    <span className="text-sm font-medium">
                      {selectedWallet?.walletType === 'crypto' 
                        ? `Purchase ${selectedWallet.currency} with ${depositMethod === 'card' ? 'Card' : 'AUD'}`
                        : `Deposit ${selectedWallet?.currency}`
                      }
                    </span>
                  </div>
                  <p className="text-xs text-blue-700">
                    {selectedWallet?.walletType === 'crypto'
                      ? `Use your AUD to purchase ${selectedWallet.currency} stablecoins at current market rate`
                      : `Add funds directly to your ${selectedWallet?.currency} wallet`
                    }
                  </p>
                </div>
              </div>
            ) : null}
            {depositMethod === 'card' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <h4 className="font-medium text-sm">💳 Card Payment Details</h4>
                <div>
                  <Label htmlFor="card-number" className="text-xs">Card Number</Label>
                  <Input
                    id="card-number"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="h-8 text-sm"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="card-expiry" className="text-xs">Expiry Date</Label>
                    <Input
                      id="card-expiry"
                      type="text"
                      placeholder="MM/YY"
                      className="h-8 text-sm"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-cvv" className="text-xs">CVV</Label>
                    <Input
                      id="card-cvv"
                      type="text"
                      placeholder="123"
                      className="h-8 text-sm"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="card-name" className="text-xs">Cardholder Name</Label>
                  <Input
                    id="card-name"
                    type="text"
                    placeholder="John Smith"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="p-2 bg-white rounded text-xs text-gray-600">
                  <p><strong>Accepted:</strong> Visa, Mastercard, American Express</p>
                  <p><strong>Fee:</strong> 2.9% + $0.30 AUD | <strong>Processing:</strong> Instant (2-3 minutes)</p>
                </div>
              </div>
            )}
            {depositMethod && depositMethod !== 'blockchain' && (
              <div>
                <Label htmlFor="deposit-amount">
                  {selectedWallet?.walletType === 'crypto'
                    ? 'Amount (AUD)'
                    : `Amount (${selectedWallet?.currency || ''})`
                  }
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={selectedWallet?.walletType === 'crypto' ? "Enter AUD amount" : "Enter amount"}
                />
                {selectedWallet && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current balance: {selectedWallet.balance} {selectedWallet.currency}
                    {selectedWallet.walletType === 'crypto' && (
                      <span className="block">Exchange rate: 1 AUD ≈ {selectedWallet.currency === 'BTC' ? '0.000023 BTC' : selectedWallet.currency === 'ETH' ? '0.00031 ETH' : `0.98 ${selectedWallet.currency}`}</span>
                    )}
                  </p>
                )}
              </div>
            )}
            {depositMethod && depositMethod !== 'blockchain' && depositMethod !== 'card' && (
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg border">
                  <h4 className="font-medium mb-2 text-sm">
                    {depositMethod === 'payid' ? '📱 Your PayID Information' : '🏦 Your Bank Information'}
                  </h4>
                  {depositMethod === 'payid' ? (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="payer-payid" className="text-xs">Your PayID</Label>
                        <Input
                          id="payer-payid"
                          type="text"
                          value={payerPayId}
                          onChange={(e) => setPayerPayId(e.target.value)}
                          placeholder="email@example.com or 0412 345 678"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="payer-name" className="text-xs">Your Full Name</Label>
                        <Input
                          id="payer-name"
                          type="text"
                          value={payerName}
                          onChange={(e) => setPayerName(e.target.value)}
                          placeholder="As shown on your bank account"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="payer-name-bank" className="text-xs">Your Full Name</Label>
                        <Input
                          id="payer-name-bank"
                          type="text"
                          value={payerName}
                          onChange={(e) => setPayerName(e.target.value)}
                          placeholder="As shown on your bank account"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="payer-bsb" className="text-xs">Your BSB</Label>
                          <Input
                            id="payer-bsb"
                            type="text"
                            value={payerBsb}
                            onChange={(e) => setPayerBsb(e.target.value)}
                            placeholder="123-456"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="payer-account" className="text-xs">Your Account Number</Label>
                          <Input
                            id="payer-account"
                            type="text"
                            value={payerAccountNumber}
                            onChange={(e) => setPayerAccountNumber(e.target.value)}
                            placeholder="12345678"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-muted rounded-lg border">
                  <h4 className="font-medium mb-2 text-sm">
                    {depositMethod === 'payid' ? '📱 Send Payment To' : '🏦 Send Payment To'}
                  </h4>
                  {depositMethod === 'payid' ? (
                    <div className="space-y-1">
                      <div className="flex justify-between p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">PayID (Email):</span>
                        <span className="font-mono">support@wealthplatform.com.au</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">PayID (Mobile):</span>
                        <span className="font-mono">0412 345 678</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-mono">${amount || '0.00'} {selectedWallet?.currency}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="font-mono">Your Wealth Management Platform</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">BSB:</span>
                        <span className="font-mono">123-456</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="font-mono">987654321</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">Reference:</span>
                        <span className="font-mono text-xs">{selectedWallet?.currency}-DEPOSIT-{Date.now().toString().slice(-6)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded text-xs">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-mono">${amount || '0.00'} {selectedWallet?.currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {depositMethod && depositMethod !== 'blockchain' && (
              <div className="flex space-x-2 pt-2">
                <Button 
                  onClick={handleDeposit}
                  disabled={depositMutation.isPending || !depositMethod || !amount || 
                           (depositMethod === 'payid' && (!payerPayId || !payerName)) ||
                           (depositMethod === 'bank_transfer' && (!payerName || !payerAccountNumber || !payerBsb))}
                  className="flex-1 h-8 text-sm"
                >
                  {depositMutation.isPending ? "Processing..." : 
                   selectedWallet?.walletType === 'crypto' ? `Purchase ${selectedWallet.currency}` : "Submit Deposit Request"}
                </Button>
                <Button variant="outline" className="h-8 text-sm" onClick={() => {
                  setDepositModalOpen(false);
                  setAmount("");
                  setDepositMethod("");
                  setPayerPayId("");
                  setPayerName("");
                  setPayerAccountNumber("");
                  setPayerBsb("");
                }}>
                  Close
                </Button>
              </div>
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
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2 text-sm">🏦 Bank Transfer Instructions</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Funds transferred to your registered bank account</p>
                <p>• Processing time: 1-3 business days</p>
                <p>• Withdrawal fee: $25.00</p>
                <p>• Please ensure your bank details are up to date</p>
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
              Convert to 30+ global currencies or send internationally with Wise-like features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="transfer-amount" className="text-sm">Amount</Label>
              <Input
                id="transfer-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-8 text-sm"
              />
              {selectedWallet && (
                <p className="text-xs text-muted-foreground mt-1">
                  Available: {selectedWallet.availableBalance} {selectedWallet.currency}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="target-currency" className="text-sm">Target Currency</Label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select target currency" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Americas</div>
                  <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="BRL">🇧🇷 BRL - Brazilian Real</SelectItem>
                  <SelectItem value="MXN">🇲🇽 MXN - Mexican Peso</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Europe</div>
                  <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                  <SelectItem value="CHF">🇨🇭 CHF - Swiss Franc</SelectItem>
                  <SelectItem value="SEK">🇸🇪 SEK - Swedish Krona</SelectItem>
                  <SelectItem value="NOK">🇳🇴 NOK - Norwegian Krone</SelectItem>
                  <SelectItem value="DKK">🇩🇰 DKK - Danish Krone</SelectItem>
                  <SelectItem value="PLN">🇵🇱 PLN - Polish Zloty</SelectItem>
                  <SelectItem value="CZK">🇨🇿 CZK - Czech Koruna</SelectItem>
                  <SelectItem value="HUF">🇭🇺 HUF - Hungarian Forint</SelectItem>
                  <SelectItem value="TRY">🇹🇷 TRY - Turkish Lira</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Asia</div>
                  <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen</SelectItem>
                  <SelectItem value="HKD">🇭🇰 HKD - Hong Kong Dollar</SelectItem>
                  <SelectItem value="SGD">🇸🇬 SGD - Singapore Dollar</SelectItem>
                  <SelectItem value="INR">🇮🇳 INR - Indian Rupee</SelectItem>
                  <SelectItem value="CNY">🇨🇳 CNY - Chinese Yuan</SelectItem>
                  <SelectItem value="KRW">🇰🇷 KRW - South Korean Won</SelectItem>
                  <SelectItem value="TWD">🇹🇼 TWD - Taiwan Dollar</SelectItem>
                  <SelectItem value="THB">🇹🇭 THB - Thai Baht</SelectItem>
                  <SelectItem value="MYR">🇲🇾 MYR - Malaysian Ringgit</SelectItem>
                  <SelectItem value="IDR">🇮🇩 IDR - Indonesian Rupiah</SelectItem>
                  <SelectItem value="PHP">🇵🇭 PHP - Philippine Peso</SelectItem>
                  <SelectItem value="VND">🇻🇳 VND - Vietnamese Dong</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Oceania</div>
                  <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar</SelectItem>
                  <SelectItem value="NZD">🇳🇿 NZD - New Zealand Dollar</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Middle East & Africa</div>
                  <SelectItem value="AED">🇦🇪 AED - UAE Dirham</SelectItem>
                  <SelectItem value="SAR">🇸🇦 SAR - Saudi Riyal</SelectItem>
                  <SelectItem value="ILS">🇮🇱 ILS - Israeli Shekel</SelectItem>
                  <SelectItem value="EGP">🇪🇬 EGP - Egyptian Pound</SelectItem>
                  <SelectItem value="NGN">🇳🇬 NGN - Nigerian Naira</SelectItem>
                  <SelectItem value="ZAR">🇿🇦 ZAR - South African Rand</SelectItem>
                  
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Crypto & Stablecoins</div>
                  <SelectItem value="BTC">₿ BTC - Bitcoin</SelectItem>
                  <SelectItem value="ETH">Ξ ETH - Ethereum</SelectItem>
                  <SelectItem value="USDT">🟢 USDT - Tether USD</SelectItem>
                  <SelectItem value="USDC">🔵 USDC - USD Coin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Exchange Rate Display */}
            {selectedWallet && targetCurrency && selectedWallet.currency !== targetCurrency && (
              <ExchangeRateDisplay 
                fromCurrency={selectedWallet.currency} 
                toCurrency={targetCurrency} 
                amount={parseFloat(amount) || 0}
              />
            )}
            
            <div className="flex space-x-2 pt-2">
              <Button 
                onClick={handleTransfer}
                disabled={transferMutation.isPending}
                className="flex-1 h-8 text-sm"
              >
                {transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
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
