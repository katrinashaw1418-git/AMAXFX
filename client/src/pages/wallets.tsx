import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWallets } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, MinusCircle, ArrowUpDown, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import StablecoinCard from "@/components/wallets/stablecoin-card";

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

export default function Wallets() {
  const { data: wallets, isLoading, error } = useWallets();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [targetCurrency, setTargetCurrency] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: (data: { currency: string; amount: number }) => api.createDeposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Deposit Successful",
        description: "Your deposit has been processed.",
      });
      setDepositModalOpen(false);
      setAmount("");
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
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal is being processed.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Transfer Successful",
        description: "Your currency exchange has been completed.",
      });
      setTransferModalOpen(false);
      setAmount("");
      setTargetCurrency("");
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
    if (!amount || !selectedWallet) return;
    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
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
                ${wallets?.filter(w => w.walletType === 'crypto')
                  .reduce((sum, w) => sum + (parseFloat(w.balance) * 43500), 0) // Mock BTC price
                  .toLocaleString()}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Add funds to your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
                className="flex-1"
              >
                {depositMutation.isPending ? "Processing..." : "Confirm Deposit"}
              </Button>
              <Button variant="outline" onClick={() => setDepositModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Withdraw funds from your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="flex space-x-2">
              <Button 
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="flex-1"
              >
                {withdrawMutation.isPending ? "Processing..." : "Confirm Withdrawal"}
              </Button>
              <Button variant="outline" onClick={() => setWithdrawModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Exchange {selectedWallet?.currency} to another currency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transfer-amount">Amount</Label>
              <Input
                id="transfer-amount"
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
            <div>
              <Label htmlFor="target-currency">Target Currency</Label>
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger>
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
            <div className="flex space-x-2">
              <Button 
                onClick={handleTransfer}
                disabled={transferMutation.isPending}
                className="flex-1"
              >
                {transferMutation.isPending ? "Processing..." : "Confirm Transfer"}
              </Button>
              <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
