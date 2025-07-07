import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useWallets } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CurrencyConfig } from "@/lib/types";
import { useFxRate } from "@/hooks/use-fx-rates";

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

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data: { type: string; currency: string; amount: string; method: string }) => {
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
      resetForms();
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
    mutationFn: async (data: { type: string; currency: string; amount: string; method: string }) => {
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
      resetForms();
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
        description: `Converted ${amount} ${selectedWallet?.currency} to ${data.convertedAmount.toFixed(2)} ${toCurrency}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      setTransferModalOpen(false);
      resetForms();
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const resetForms = () => {
    setAmount('');
    setDepositMethod('');
    setWithdrawMethod('');
    setToCurrency('');
    setPayerPayId('');
    setPayerName('');
    setPayerAccountNumber('');
    setPayerBsb('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
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

    depositMutation.mutate({
      type: "deposit",
      currency: selectedWallet.currency,
      amount: amount,
      method: depositMethod
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
      amount: amount,
      method: withdrawMethod
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
            <span>Your Wallets</span>
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
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedWallet(wallet);
                              setTransferModalOpen(true);
                            }}
                          >
                            Transfer
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
                <Label htmlFor="deposit-amount">Amount ({selectedWallet?.currency})</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            )}

            {depositMethod === 'blockchain' && !['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'HKD', 'SGD'].includes(selectedWallet?.currency) && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border mx-auto w-fit mb-3">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded flex items-center justify-center text-xs font-mono text-gray-600 p-2">
                      <div className="text-center">QR CODE</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Scan QR code with your wallet app</p>
                </div>
                
                <div>
                  <Label>Wallet Address ({selectedWallet?.currency} Network)</Label>
                  <div className="flex space-x-2">
                    <Input 
                      value={selectedWallet?.currency === "BTC" 
                        ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" 
                        : "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2"
                      } 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={() => {
                      const address = selectedWallet?.currency === "BTC" 
                        ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" 
                        : "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2";
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
            )}

            <Button 
              onClick={handleDeposit} 
              disabled={depositMutation.isPending}
              className="w-full mt-4"
            >
              {depositMutation.isPending ? "Processing..." : "Confirm Deposit"}
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
            </div>

            <div>
              <Label htmlFor="to-currency">Convert To</Label>
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

            <Button 
              onClick={handleTransfer} 
              disabled={transferMutation.isPending}
              className="w-full mt-4"
            >
              {transferMutation.isPending ? "Converting..." : "Confirm Transfer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}