import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CurrencyConfig } from '@/lib/types';
import { Plus, Minus, ArrowRightLeft } from 'lucide-react';
import { useFxRate } from '@/hooks/use-fx-rates';
import { useWallets } from '@/hooks/use-portfolio';

export default function Wallets() {
  const { data: wallets = [], isLoading, refetch: refetchWallets } = useWallets();
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [toCurrency, setToCurrency] = useState('');
  const { toast } = useToast();

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string }) => {
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
      setAmount('');
      setDepositMethod('');
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
    mutationFn: async (data: { type: string; currency: string; amount: string }) => {
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
      setAmount('');
      setWithdrawMethod('');
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
      const response = await apiRequest("POST", "/api/fx-exchange", data);
      if (!response.ok) {
        throw new Error('Transfer failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer Successful",
        description: `${amount} ${selectedWallet?.currency} converted to ${toCurrency}. Received ${data.convertedAmount?.toLocaleString()} ${toCurrency}`,
      });
      // Invalidate all relevant caches and force refresh
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/allocation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/investment-breakdown'] });
      // Force immediate refetch to bypass cache
      setTimeout(() => {
        refetchWallets();
      }, 100);
      setTransferModalOpen(false);
      setAmount('');
      setToCurrency('');
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "Please try again later.",
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

    withdrawMutation.mutate({
      type: "withdraw",
      currency: selectedWallet.currency,
      amount: amount
    });
  };

  const handleTransfer = () => {
    if (!selectedWallet || !amount || !toCurrency) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate({
      fromCurrency: selectedWallet.currency,
      toCurrency,
      amount: parseFloat(amount)
    });
  };

  // Group wallets by category
  const fiatWallets = wallets.filter(w => ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(w.currency));
  const stablecoinWallets = wallets.filter(w => ['USDT', 'USDC'].includes(w.currency));
  const cryptoWallets = wallets.filter(w => ['BTC', 'ETH'].includes(w.currency));

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallets</h1>
          <p className="text-muted-foreground">Manage your multi-currency accounts</p>
        </div>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Wallet
        </Button>
      </div>

      {/* Fiat Assets Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-blue-600">💵</span>
          Fiat Assets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fiatWallets.map((wallet) => {
            const balance = parseFloat(wallet.balance);
            const config = CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig];
            
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
                    <span className="text-xs text-muted-foreground">Available</span>
                    <span className="text-xs text-muted-foreground">
                      {config?.symbol || '$'}{parseFloat(wallet.availableBalance).toLocaleString()}
                    </span>
                  </div>
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
                    <Plus className="w-3 h-3 mr-1" />
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
                    <Minus className="w-3 h-3 mr-1" />
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
                    <ArrowRightLeft className="w-3 h-3 mr-1" />
                    Transfer
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Stablecoins Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-green-600">🟢</span>
          Stablecoins
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stablecoinWallets.map((wallet) => {
            const balance = parseFloat(wallet.balance);
            const config = CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig];
            
            return (
              <Card key={wallet.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 ${config?.color || 'bg-green-500'} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {config?.flag || wallet.currency}
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
                      ${balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Available</span>
                    <span className="text-xs text-muted-foreground">
                      ${parseFloat(wallet.availableBalance).toLocaleString()}
                    </span>
                  </div>
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
                    <Plus className="w-3 h-3 mr-1" />
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
                    <Minus className="w-3 h-3 mr-1" />
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
                    <ArrowRightLeft className="w-3 h-3 mr-1" />
                    Transfer
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Crypto Assets Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-orange-600">₿</span>
          Crypto Assets
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoWallets.map((wallet) => {
            const balance = parseFloat(wallet.balance);
            const config = CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig];
            
            return (
              <Card key={wallet.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 ${config?.color || 'bg-orange-500'} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {config?.flag || wallet.currency}
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
                      {wallet.currency === 'BTC' ? '₿' : 'Ξ'}{balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Available</span>
                    <span className="text-xs text-muted-foreground">
                      {wallet.currency === 'BTC' ? '₿' : 'Ξ'}{parseFloat(wallet.availableBalance).toLocaleString()}
                    </span>
                  </div>
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
                    <Plus className="w-3 h-3 mr-1" />
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
                    <Minus className="w-3 h-3 mr-1" />
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
                    <ArrowRightLeft className="w-3 h-3 mr-1" />
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Deposit {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Add funds to your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-method">Deposit Method</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deposit method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                  {selectedWallet?.walletType === 'crypto' && (
                    <SelectItem value="blockchain">🔗 Blockchain Transfer</SelectItem>
                  )}
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
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleDeposit}
                disabled={depositMutation.isPending || !depositMethod || !amount}
                className="flex-1"
              >
                {depositMutation.isPending ? "Processing..." : "Deposit"}
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Withdraw {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Withdraw funds from your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="flex space-x-2">
              <Button 
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || !withdrawMethod || !amount}
                className="flex-1"
              >
                {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Transfer {selectedWallet?.currency}</DialogTitle>
            <DialogDescription>
              Convert to other currencies or send internationally
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
              <Label htmlFor="transfer-to-currency">Convert To</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target currency" />
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
            <div className="flex space-x-2">
              <Button 
                onClick={handleTransfer}
                disabled={transferMutation.isPending || !amount || !toCurrency}
                className="flex-1"
              >
                {transferMutation.isPending ? "Processing..." : "Convert"}
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