import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFxRates, useFxRate } from "@/hooks/use-fx-rates";
import { useWallets } from "@/hooks/use-portfolio";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft, Wallet, Phone, MessageSquare, X, RefreshCw } from "lucide-react";
import YtdRateChart from "@/components/fx/ytd-rate-chart";
import RateSparkline from "@/components/fx/rate-sparkline";

const currencies = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰" },
  { code: "BTC", name: "Bitcoin", flag: "₿" },
  { code: "ETH", name: "Ethereum", flag: "Ξ" },
  { code: "USDT", name: "Tether", flag: "💵" },
  { code: "USDC", name: "USD Coin", flag: "🪙" },
];

export default function FxExchange() {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("CAD");
  const [amount, setAmount] = useState("10000");
  const [showAdvisorBox, setShowAdvisorBox] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wallets = [] } = useWallets();
  const { data: fxRates, isLoading: ratesLoading } = useFxRates();
  const { data: fxRate, isLoading: rateLoading } = useFxRate(fromCurrency, toCurrency);

  const exchangeMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/fx-exchange", data);
      if (!response.ok) throw new Error("Exchange failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exchange Successful",
        description: `Successfully exchanged ${amount} ${fromCurrency} to ${data.convertedAmount?.toLocaleString()} ${toCurrency}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: () => {
      toast({
        title: "Exchange Failed",
        description: "There was an error processing your exchange. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExchange = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to exchange.",
        variant: "destructive",
      });
      return;
    }
    exchangeMutation.mutate({ fromCurrency, toCurrency, amount: parseFloat(amount) });
  };

  const exchangeRate = fxRate ? parseFloat((fxRate as any).rate) : 1;
  const spread = fxRate ? parseFloat((fxRate as any).spread) : 0.005;
  const grossConverted = parseFloat(amount || "0") * exchangeRate;
  const fee = grossConverted * spread;
  const convertedAmount = grossConverted - fee;

  const fromWallet = wallets.find((w: any) => w.currency === fromCurrency);
  const toWallet = wallets.find((w: any) => w.currency === toCurrency);
  const fromBalance = fromWallet ? parseFloat(fromWallet.balance) : 0;
  const toBalance = toWallet ? parseFloat(toWallet.balance) : 0;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FX Exchange</h1>
          <p className="text-gray-600">Exchange currencies at competitive interbank rates</p>
        </div>
      </div>

      {/* YTD Rate Chart — shown first, before spot rate */}
      <YtdRateChart
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        currentRate={exchangeRate}
        isLoading={rateLoading}
      />

      {/* Spot Rate Banner */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-0">
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Live Spot Rate</p>
              <p className="text-2xl font-bold">
                {rateLoading ? (
                  <span className="text-slate-400 text-base">Loading...</span>
                ) : (
                  <>
                    1 {fromCurrency} = <span className="text-amber-400">{exchangeRate.toFixed(4)}</span> {toCurrency}
                  </>
                )}
              </p>
            </div>
            {(fxRate as any)?.isStale && (
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs">
                ⚠ Rate data {(fxRate as any).rateAgeMinutes}m old
              </Badge>
            )}
            {!(fxRate as any)?.isStale && !rateLoading && (
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <RefreshCw className="w-3 h-3" />
                <span>
                  {(fxRate as any)?.rateAgeMinutes !== null && (fxRate as any)?.rateAgeMinutes !== undefined
                    ? `Updated ${(fxRate as any).rateAgeMinutes}m ago`
                    : "Live rate"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exchange Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Currency Exchange</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>From</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            {currency.flag} {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Wallet className="w-3.5 h-3.5 mr-1" />
                      <span>Available: {fromBalance.toLocaleString()} {fromCurrency}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>To</Label>
                      <Select value={toCurrency} onValueChange={setToCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.flag} {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="mb-0.5 flex-shrink-0"
                      onClick={swapCurrencies}
                      title="Swap currencies"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Wallet className="w-3.5 h-3.5 mr-1" />
                      <span>Available: {toBalance.toLocaleString()} {toCurrency}</span>
                    </div>
                    <Label className="mt-2 block">You'll receive</Label>
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-semibold text-gray-900">
                      {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Spot Rate</span>
                  <span className="font-medium">
                    {rateLoading ? "Loading..." : `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Processing Fee (0.5%)</span>
                  <span className="font-medium">{fee.toFixed(2)} {toCurrency}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-gray-600">Net Amount</span>
                  <span className="font-semibold text-gray-900">
                    {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Settlement</span>
                  <span className="font-medium text-green-600">Instant</span>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                onClick={handleExchange}
                disabled={exchangeMutation.isPending || rateLoading}
              >
                {exchangeMutation.isPending ? "Processing..." : "Exchange Now"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Rates Panel */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Live Exchange Rates</CardTitle>
              <p className="text-xs text-gray-500">Click a pair to view its YTD chart above</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {ratesLoading ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading rates...</p>
                ) : (
                  fxRates?.map((rate: any) => {
                    const rateValue = parseFloat(rate.rate);
                    const isSelected =
                      fromCurrency === rate.baseCurrency && toCurrency === rate.targetCurrency;

                    return (
                      <div
                        key={`${rate.baseCurrency}-${rate.targetCurrency}`}
                        className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors border ${
                          isSelected
                            ? "bg-amber-50 border-amber-300"
                            : "bg-gray-50 border-transparent hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setFromCurrency(rate.baseCurrency);
                          setToCurrency(rate.targetCurrency);
                        }}
                      >
                        {/* Pair label */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-xs ${isSelected ? "text-amber-700" : "text-gray-800"}`}>
                            {rate.baseCurrency}/{rate.targetCurrency}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {currencies.find((c) => c.code === rate.baseCurrency)?.name}
                          </p>
                        </div>

                        {/* Mini sparkline */}
                        <div className="flex-shrink-0">
                          <RateSparkline
                            fromCurrency={rate.baseCurrency}
                            toCurrency={rate.targetCurrency}
                            currentRate={rateValue}
                          />
                        </div>

                        {/* Rate + freshness */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm text-gray-900">{rateValue.toFixed(4)}</p>
                          {rate.isStale ? (
                            <span className="text-xs text-amber-600">⚠ {rate.rateAgeMinutes}m</span>
                          ) : (
                            <span className="text-xs text-green-600">
                              {rate.rateAgeMinutes !== null ? `${rate.rateAgeMinutes}m` : "Live"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Advisor Box */}
      {showAdvisorBox && (
        <div className="fixed top-4 right-4 z-50 w-80">
          <Card className="backdrop-blur-sm bg-white/95 border-purple-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">FX Support</h3>
                    <p className="text-xs text-gray-600">Advisory Team</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvisorBox(false)}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-700 mb-3">
                Need help with your exchange or a large transfer? Contact our team.
              </p>
              <div className="flex items-center space-x-2 text-purple-600 mb-3">
                <Phone className="w-3 h-3" />
                <span className="font-medium text-xs">+61 3 9654 1000</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("tel:+61396541000", "_self")}
                  className="flex-1 text-xs h-8"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </Button>
                <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs h-8">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
