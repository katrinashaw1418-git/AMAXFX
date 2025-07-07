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
import StablecoinCard from "@/components/wallets/stablecoin-card";
import { useFxRate } from "@/hooks/use-fx-rates";

const currencyConfig = {
  USD: { name: "US Dollar", symbol: "$", color: "bg-blue-500", flag: "🇺🇸" },
  CAD: { name: "Canadian Dollar", symbol: "$", color: "bg-red-500", flag: "🇨🇦" },
  EUR: { name: "Euro", symbol: "€", color: "bg-blue-600", flag: "🇪🇺" },
  GBP: { name: "British Pound", symbol: "£", color: "bg-green-600", flag: "🇬🇧" },
  AUD: { name: "Australian Dollar", symbol: "$", color: "bg-orange-500", flag: "🇦🇺" },
  HKD: { name: "Hong Kong Dollar", symbol: "$", color: "bg-pink-500", flag: "🇭🇰" },
  SGD: { name: "Singapore Dollar", symbol: "$", color: "bg-red-600", flag: "🇸🇬" },
  BTC: { name: "Bitcoin", symbol: "₿", color: "bg-yellow-500", flag: "₿" },
  ETH: { name: "Ethereum", symbol: "Ξ", color: "bg-purple-500", flag: "Ξ" },
  USDT: { name: "Tether", symbol: "₮", color: "bg-green-500", flag: "💵" },
  USDC: { name: "USD Coin", symbol: "◎", color: "bg-blue-400", flag: "🪙" },
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    
    // For demo purposes, we'll process the deposit immediately
    // In production, deposits would be processed when the actual transfer is received
    depositMutation.mutate({ currency: selectedWallet.currency, amount: depositAmount });
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

  const totalBalance = wallets?.reduce((sum, wallet) => {
    if (wallet.walletType === 'fiat') {
      return sum + parseFloat(wallet.balance);
    }
    return sum;
  }, 0) || 0;

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
        <CardHeader>
          <CardTitle>Total Balance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary mb-4">
            ${totalBalance.toLocaleString()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Fiat Assets</p>
              <p className="text-lg font-semibold">
                ${wallets?.filter(w => w.walletType === 'fiat')
                  .reduce((sum, w) => sum + parseFloat(w.balance), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Crypto Assets</p>
              <p className="text-lg font-semibold">
                ${portfolio?.cryptoValue ? parseFloat(portfolio.cryptoValue).toLocaleString() : 'Loading...'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Wallets</p>
              <p className="text-lg font-semibold">{wallets?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stablecoins Section */}
      {wallets?.some(w => ["USDT", "USDC"].includes(w.currency)) && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Coins className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Stablecoins</h2>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Low Volatility • Cross-Border Ready
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {wallets
              ?.filter(w => ["USDT", "USDC"].includes(w.currency))
              .map((wallet) => {
                const config = currencyConfig[wallet.currency as keyof typeof currencyConfig];
                return (
                  <StablecoinCard
                    key={wallet.id}
                    currency={wallet.currency as "USDT" | "USDC"}
                    balance={wallet.balance}
                    availableBalance={wallet.availableBalance}
                    config={config}
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Traditional Wallet Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Wallets</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets?.map((wallet) => {
            const config = currencyConfig[wallet.currency as keyof typeof currencyConfig];
          const balance = parseFloat(wallet.balance);
          const availableBalance = parseFloat(wallet.availableBalance);
          const utilizationPercent = balance > 0 ? (availableBalance / balance) * 100 : 0;
          
          return (
            <Card key={wallet.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config?.color || 'bg-gray-500'}`}>
                      <span className="text-white font-bold text-sm">
                        {config?.flag || wallet.currency.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{config?.name || wallet.currency}</h3>
                      <Badge variant={wallet.walletType === 'crypto' ? 'secondary' : 'outline'}>
                        {wallet.walletType === 'crypto' ? 'Crypto' : 'Fiat'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Balance</span>
                    <span className="font-semibold">
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
                
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 px-2 text-xs"
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setDepositModalOpen(true);
                    }}
                  >
                    <PlusCircle className="w-3 h-3 mr-1" />
                    Deposit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 px-2 text-xs"
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setWithdrawModalOpen(true);
                    }}
                  >
                    <MinusCircle className="w-3 h-3 mr-1" />
                    Withdraw
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 px-2 text-xs"
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setTransferModalOpen(true);
                    }}
                  >
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    Transfer
                  </Button>
                </div>
              </CardContent>
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
            <div>
              <Label htmlFor="deposit-method">Deposit Method</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deposit method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payid">💳 PayID (Australia Only)</SelectItem>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
              {selectedWallet && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current balance: {selectedWallet.balance} {selectedWallet.currency}
                </p>
              )}
            </div>
            {depositMethod && (
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
            <div className="flex space-x-2 pt-2">
              <Button 
                onClick={handleDeposit}
                disabled={depositMutation.isPending || !depositMethod || !amount || 
                         (depositMethod === 'payid' && (!payerPayId || !payerName)) ||
                         (depositMethod === 'bank_transfer' && (!payerName || !payerAccountNumber || !payerBsb))}
                className="flex-1 h-8 text-sm"
              >
                {depositMutation.isPending ? "Processing..." : "Submit Deposit Request"}
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
              Exchange {selectedWallet?.currency} to another currency
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
                <SelectContent>
                  {Object.entries(currencyConfig)
                    .filter(([code]) => code !== selectedWallet?.currency)
                    .map(([code, config]) => (
                      <SelectItem key={code} value={code}>
                        {config.flag} {config.name} ({code})
                      </SelectItem>
                    ))}
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
