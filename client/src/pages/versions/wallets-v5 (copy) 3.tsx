import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
// Table components will be created inline since they're not in the UI library
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CurrencyConfig,
  SupportedCurrencies,
  CurrencyRegions,
  type WalletBalance,
} from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  ArrowRightLeft,
  ArrowUpDown,
  Send,
  Repeat,
  Info,
  DollarSign,
  AlertCircle,
  Volume2,
  Settings,
} from "lucide-react";
import { useFxRate } from "@/hooks/use-fx-rates";
import { useWallets } from "@/hooks/use-portfolio";
import { useVoiceNarration } from "@/hooks/use-voice-narration";
import VoiceSettings from "@/components/voice/voice-settings";

// Helper functions for exchange rate display
const useExchangeRateDisplay = (fromCurrency: string, toCurrency: string) => {
  const { data: fxRate } = useFxRate(fromCurrency, toCurrency);
  if (!fxRate) return "Loading...";

  const rate = parseFloat(fxRate.rate);
  const displayRate = rate > 1 ? rate.toFixed(2) : rate.toFixed(6);

  return `1 ${fromCurrency} = ${displayRate} ${toCurrency}`;
};

// Exchange Rate Display Component for Transfer Modal
function ExchangeRateDisplay({
  fromCurrency,
  toCurrency,
  amount,
}: {
  fromCurrency: string;
  toCurrency: string;
  amount: string;
}) {
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

  let convertedAmount = "0.00";
  let sendingAmount = "0.00";

  console.log("ExchangeRateDisplay Debug:", {
    amount,
    rate,
    fromCurrency,
    toCurrency,
    hasAmount: !!amount,
  });

  if (amount && String(amount).trim() !== "") {
    const amountNumber = parseFloat(String(amount));
    const rateNumber = parseFloat(rate);

    if (!isNaN(amountNumber) && !isNaN(rateNumber)) {
      const grossConverted = amountNumber * rateNumber;
      const transactionFee = grossConverted * 0.005; // 0.5% fee
      const netConverted = grossConverted - transactionFee;

      console.log("Calculation:", {
        amountNumber,
        rateNumber,
        grossConverted,
        transactionFee,
        netConverted,
      });

      convertedAmount = `${netConverted.toFixed(2)} ${toCurrency}`;
      sendingAmount = `${amountNumber.toFixed(2)} ${fromCurrency}`;
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Exchange Rate</span>
        <span className="font-medium">
          1 {fromCurrency} = {displayRate} {toCurrency}
        </span>
      </div>

      {amount && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">
              What You'll Receive
            </div>
            <div className="text-2xl font-bold text-green-600">
              {convertedAmount}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Sending: {sendingAmount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wallet Value Display Component
function WalletValueDisplay({
  wallet,
  displayCurrency,
}: {
  wallet: any;
  displayCurrency: string;
}) {
  const { data: fxRate } = useFxRate(wallet.currency, displayCurrency);

  if (wallet.currency === displayCurrency) {
    const balance = parseFloat(wallet.balance || "0");
    const config =
      CurrencyConfig[displayCurrency as keyof typeof CurrencyConfig];
    const formattedBalance =
      balance > 1 ? balance.toLocaleString() : balance.toFixed(6);

    return (
      <div>
        <div className="text-muted-foreground">
          {config?.symbol}
          {formattedBalance}
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
  const convertedValue = parseFloat(wallet.balance || "0") * rate;
  const config = CurrencyConfig[displayCurrency as keyof typeof CurrencyConfig];

  // Format based on value size
  const formattedValue =
    convertedValue > 1
      ? convertedValue.toLocaleString()
      : convertedValue.toFixed(6);
  const displayRate = rate > 1 ? rate.toFixed(2) : rate.toFixed(6);

  return (
    <div>
      <div className="text-muted-foreground">
        ≈ {config?.symbol}
        {formattedValue}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        1 {wallet.currency} = {displayRate} {displayCurrency}
      </div>
    </div>
  );
}

export default function WalletsV5() {
  const { data: wallets = [], isLoading } = useWallets();
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState("USD"); // New state for balance display currency
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
  const [depositMethod, setDepositMethod] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [payerPayId, setPayerPayId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerAccountNumber, setPayerAccountNumber] = useState("");
  const [payerBsb, setPayerBsb] = useState("");
  const { toast } = useToast();

  // Voice narration on page load
  useEffect(() => {
    if (wallets.length > 0 && voiceSettings.autoNarrate) {
      const totalBalance = wallets.reduce((sum, wallet) => {
        return sum + parseFloat(wallet.balance || "0");
      }, 0);

      setTimeout(() => {
        narrateNavigation(
          `Your wallets page with ${wallets.length} currencies`,
        );
        narrateBalance(`Total portfolio value: ${totalBalance.toFixed(2)} USD`);
      }, 500);
    }
  }, [wallets, voiceSettings.autoNarrate, narrateNavigation, narrateBalance]);

  // Exchange rate display helpers
  const exchangeRateText = useExchangeRateDisplay(fromCurrency, toCurrency);

  // Get exchange rate for transfer calculation
  const { data: transferFxRate } = useFxRate(fromCurrency, toCurrency);

  // Calculate transfer amount with fee
  const calculateTransferAmount = (
    amount: string,
    fromCurrency: string,
    toCurrency: string,
  ) => {
    if (!amount || !fromCurrency || !toCurrency) return "0.00";

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return "0.00";

    if (!transferFxRate) return "Loading...";

    const rate = parseFloat(transferFxRate.rate);
    const grossConverted = amountNum * rate;
    const transactionFee = grossConverted * 0.005; // 0.5% fee
    const netConverted = grossConverted - transactionFee;

    return `${netConverted.toFixed(2)} ${toCurrency}`;
  };

  const transferMutation = useMutation({
    mutationFn: async (data: {
      fromCurrency: string;
      toCurrency: string;
      amount: number;
    }) => {
      console.log("Making transfer API call with data:", data);
      const response = await apiRequest("POST", "/api/fx-exchange", data);
      console.log("Transfer API response status:", response.status);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Transfer API error:", errorData);
        throw new Error(
          errorData.error || `Transfer failed: ${response.status}`,
        );
      }

      const result = await response.json();
      console.log("Transfer API result:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Transfer mutation onSuccess called with data:", data);
      const successMessage = `Converted ${amount} ${fromCurrency} to ${data.convertedAmount.toFixed(2)} ${toCurrency}`;

      toast({
        title: "✅ Transfer Successful",
        description: successMessage,
      });

      // Voice narration
      narrateSuccess(successMessage);

      // Immediately invalidate and refetch wallet data
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setTransferModalOpen(false);
      setAmount("");
      setFromCurrency("");
      setToCurrency("");
    },
    onError: (error: any) => {
      console.error("Transfer mutation onError called with error:", error);

      let errorMessage = "Please try again later.";
      if (error.message && error.message.includes("400")) {
        errorMessage =
          "Insufficient balance. Please check your available funds.";
      } else if (error.message) {
        errorMessage = error.message.replace(
          "Transfer failed: 400",
          "Insufficient balance",
        );
      }

      // Voice narration
      narrateError(errorMessage);

      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      currency: string;
      amount: string;
    }) => {
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

      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setDepositModalOpen(false);
      setAmount("");
      setDepositMethod("");
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
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      currency: string;
      amount: string;
    }) => {
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

      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setWithdrawModalOpen(false);
      setAmount("");
      setWithdrawMethod("");
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
    },
  });

  const handleDeposit = () => {
    console.log("handleDeposit called with:", {
      selectedWallet: selectedWallet?.currency,
      amount,
      depositMethod,
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
    narrateTransaction("deposit", amount, selectedWallet.currency);

    console.log("Starting deposit mutation...");
    depositMutation.mutate({
      type: "deposit",
      currency: selectedWallet.currency,
      amount: amount,
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
    narrateTransaction("withdraw", amount, selectedWallet.currency);

    withdrawMutation.mutate({
      type: "withdraw",
      currency: selectedWallet.currency,
      amount: amount,
    });
  };

  const handleTransfer = () => {
    const sourceWallet = selectedWallet;
    const sourceCurrency = sourceWallet?.currency || fromCurrency;

    console.log("handleTransfer called with:", {
      fromCurrency: sourceCurrency,
      toCurrency,
      amount,
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
    narrateTransaction(
      "transfer",
      amount,
      `${sourceCurrency} to ${toCurrency}`,
    );

    console.log("Starting transfer mutation...");
    transferMutation.mutate({
      fromCurrency: sourceCurrency,
      toCurrency,
      amount: parseFloat(amount),
    });
  };

  // Filter out zero-balance wallets and sort with crypto currencies at bottom
  const walletsWithRegions = wallets
    .filter((wallet) => parseFloat(wallet.balance || "0") > 0) // Hide zero-balance wallets
    .map((wallet) => ({
      ...wallet,
      config: CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig],
      region:
        CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig]
          ?.region || "Other",
    }))
    .sort((a, b) => {
      // Define crypto currencies that should always be at bottom
      const cryptoCurrencies = ["BTC", "ETH", "USDT", "USDC"];
      const aIsCrypto = cryptoCurrencies.includes(a.currency);
      const bIsCrypto = cryptoCurrencies.includes(b.currency);

      // If one is crypto and other isn't, non-crypto comes first
      if (aIsCrypto && !bIsCrypto) return 1;
      if (!aIsCrypto && bIsCrypto) return -1;

      // If both are crypto, maintain the order: BTC, ETH, USDT, USDC
      if (aIsCrypto && bIsCrypto) {
        return (
          cryptoCurrencies.indexOf(a.currency) -
          cryptoCurrencies.indexOf(b.currency)
        );
      }

      // For non-crypto currencies, sort alphabetically
      return a.currency.localeCompare(b.currency);
    });

  const { data: exchangeRate } = useFxRate(fromCurrency, "USD");
  const estimatedValue =
    fromCurrency && amount ? parseFloat(amount) * (exchangeRate?.rate || 1) : 0;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div
          className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Wallets - Version 5</h1>
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
              <span className="text-sm font-normal text-muted-foreground">
                Show values in:
              </span>
              <Select
                value={displayCurrency}
                onValueChange={setDisplayCurrency}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "USD",
                    "EUR",
                    "GBP",
                    "JPY",
                    "AUD",
                    "CAD",
                    "CHF",
                    "HKD",
                    "SGD",
                    "BTC",
                    "ETH",
                    "USDT",
                    "USDC",
                  ].map((currency) => {
                    const config =
                      CurrencyConfig[currency as keyof typeof CurrencyConfig];
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
                    <th className="text-left p-4 font-medium">
                      Approx. Value ({displayCurrency})
                    </th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {walletsWithRegions.map((wallet) => (
                    <tr key={wallet.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{wallet.config?.flag}</span>
                          <div>
                            <div className="font-medium">{wallet.currency}</div>
                            <div className="text-sm text-muted-foreground">
                              {wallet.config?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {wallet.config?.symbol}
                            {wallet.balance
                              ? parseFloat(wallet.balance).toLocaleString()
                              : "0.00"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Available: {wallet.config?.symbol}
                            {wallet.availableBalance
                              ? parseFloat(
                                  wallet.availableBalance,
                                ).toLocaleString()
                              : "0.00"}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <WalletValueDisplay
                          wallet={wallet}
                          displayCurrency={displayCurrency}
                        />
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
                            <Plus className="w-4 h-4 mr-1" />
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
                            <Minus className="w-4 h-4 mr-1" />
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
                            <ArrowUpDown className="w-4 h-4 mr-1" />
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
              Add funds to your {selectedWallet?.currency} wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Balance</span>
                <span className="font-medium">
                  {selectedWallet?.balance} {selectedWallet?.currency}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="deposit-amount" className="text-sm">
                Amount
              </Label>
              <Input
                id="deposit-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-8"
              />
            </div>

            <div>
              <Label htmlFor="deposit-method" className="text-sm">
                Payment Method
              </Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit-card">Credit/Debit Card</SelectItem>
                  <SelectItem value="payid">PayID (Australia Only)</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="qr-code">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
                className="flex-1 h-8 text-sm"
              >
                {depositMutation.isPending
                  ? "Processing..."
                  : "Confirm Deposit"}
              </Button>
              <Button
                variant="outline"
                className="h-8 text-sm"
                onClick={() => setDepositModalOpen(false)}
              >
                Cancel
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
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Balance</span>
                <span className="font-medium">
                  {selectedWallet?.availableBalance} {selectedWallet?.currency}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="withdraw-amount" className="text-sm">
                Amount
              </Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-8"
              />
            </div>

            <div>
              <Label htmlFor="withdraw-method" className="text-sm">
                Withdrawal Method
              </Label>
              <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select withdrawal method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payid">PayID (Australia Only)</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="flex-1 h-8 text-sm"
              >
                {withdrawMutation.isPending
                  ? "Processing..."
                  : "Confirm Withdrawal"}
              </Button>
              <Button
                variant="outline"
                className="h-8 text-sm"
                onClick={() => setWithdrawModalOpen(false)}
              >
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
              Transfer your {selectedWallet?.currency} balance to another
              currency
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Balance</span>
                <span className="font-medium">
                  {selectedWallet?.availableBalance} {selectedWallet?.currency}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="transfer-amount" className="text-sm">
                Amount to Transfer
              </Label>
              <Input
                id="transfer-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-8"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available: {selectedWallet?.availableBalance}{" "}
                {selectedWallet?.currency}
              </p>
            </div>

            <div>
              <Label htmlFor="transfer-to-currency" className="text-sm">
                Transfer To
              </Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select destination currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">🇺🇸 USD – US Dollar</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR – Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP – British Pound</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD – Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">
                    🇦🇺 AUD – Australian Dollar
                  </SelectItem>
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
            {selectedWallet &&
              toCurrency &&
              amount &&
              toCurrency !== selectedWallet.currency && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                  <ExchangeRateDisplay
                    fromCurrency={selectedWallet.currency}
                    toCurrency={toCurrency}
                    amount={amount}
                  />
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
                    setFromCurrency(selectedWallet.currency);
                    handleTransfer();
                  }
                }}
                disabled={
                  transferMutation.isPending ||
                  !selectedWallet ||
                  !toCurrency ||
                  !amount ||
                  toCurrency === selectedWallet?.currency
                }
                className="flex-1 h-8 text-sm"
              >
                {transferMutation.isPending
                  ? "Transferring..."
                  : "Transfer Now"}
              </Button>
              <Button
                variant="outline"
                className="h-8 text-sm"
                onClick={() => setTransferModalOpen(false)}
              >
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
              Configure voice narration for transaction feedback and
              accessibility
            </DialogDescription>
          </DialogHeader>
          <VoiceSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
}
