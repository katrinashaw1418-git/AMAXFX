import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFxRates, useFxRate } from "@/hooks/use-fx-rates";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft, TrendingUp, TrendingDown } from "lucide-react";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fxRates, isLoading: ratesLoading } = useFxRates();
  const { data: fxRate, isLoading: rateLoading } = useFxRate(fromCurrency, toCurrency);

  const exchangeMutation = useMutation({
    mutationFn: (data: { fromCurrency: string; toCurrency: string; amount: number }) =>
      api.createFxExchange(data),
    onSuccess: (data) => {
      toast({
        title: "Exchange Successful",
        description: `Successfully exchanged ${amount} ${fromCurrency} to ${data.convertedAmount.toFixed(2)} ${toCurrency}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
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

    exchangeMutation.mutate({
      fromCurrency,
      toCurrency,
      amount: parseFloat(amount),
    });
  };

  const exchangeRate = fxRate ? parseFloat(fxRate.rate) : 1;
  const spread = fxRate ? parseFloat(fxRate.spread) : 0.005;
  const fee = parseFloat(amount || "0") * spread;
  const convertedAmount = parseFloat(amount || "0") * exchangeRate;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FX Exchange</h1>
        <p className="text-gray-600">Exchange currencies with competitive rates</p>
      </div>

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
                    <Label htmlFor="from-currency">From</Label>
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
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="to-currency">To</Label>
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
                  <div>
                    <Label>You'll receive</Label>
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900">
                      {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Exchange Rate</span>
                  <span className="font-medium">
                    {rateLoading ? "Loading..." : `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-medium">
                    {(spread * 100).toFixed(1)}% ({fee.toFixed(2)} {fromCurrency})
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Estimated completion</span>
                  <span className="font-medium">Instant</span>
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

        {/* Live Rates */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Live Exchange Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fxRates?.map((rate) => {
                  const rateValue = parseFloat(rate.rate);
                  const isUp = Math.random() > 0.5; // Mock trend
                  
                  return (
                    <div key={`${rate.baseCurrency}-${rate.targetCurrency}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{rate.baseCurrency}/{rate.targetCurrency}</p>
                        <p className="text-sm text-gray-600">
                          {currencies.find(c => c.code === rate.baseCurrency)?.name} to {currencies.find(c => c.code === rate.targetCurrency)?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{rateValue.toFixed(4)}</p>
                        <div className="flex items-center space-x-1">
                          {isUp ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span className={`text-xs ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                            {isUp ? '+' : '-'}0.{Math.floor(Math.random() * 9) + 1}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
