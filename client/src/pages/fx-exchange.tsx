import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useFxRates, useFxRate } from "@/hooks/use-fx-rates";
import { useWallets } from "@/hooks/use-portfolio";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowRightLeft, Wallet, Phone, MessageSquare, X, RefreshCw, Shield, Info } from "lucide-react";
import YtdRateChart from "@/components/fx/ytd-rate-chart";
import RateSparkline from "@/components/fx/rate-sparkline";

const FIAT_CURRENCIES = [
  { code: "AUD",  name: "Australian Dollar",  flag: "🇦🇺" },
  { code: "NZD",  name: "New Zealand Dollar", flag: "🇳🇿" },
  { code: "USD",  name: "US Dollar",          flag: "🇺🇸" },
  { code: "EUR",  name: "Euro",               flag: "🇪🇺" },
  { code: "CAD",  name: "Canadian Dollar",    flag: "🇨🇦" },
  { code: "GBP",  name: "British Pound",      flag: "🇬🇧" },
  { code: "CNY",  name: "Chinese Yuan",       flag: "🇨🇳" },
  { code: "HKD",  name: "Hong Kong Dollar",   flag: "🇭🇰" },
  { code: "SGD",  name: "Singapore Dollar",   flag: "🇸🇬" },
  { code: "JPY",  name: "Japanese Yen",       flag: "🇯🇵" },
  { code: "KRW",  name: "South Korean Won",   flag: "🇰🇷" },
];

function formatRateAge(minutes: number | null | undefined): string {
  if (minutes == null) return "Live rate";
  if (minutes === 0)   return "< 1 min ago";
  if (minutes === 1)   return "1 min ago";
  return `${minutes} min ago`;
}


export default function FxExchange() {
  const [fromCurrency, setFromCurrency] = useState("AUD");
  const [toCurrency,   setToCurrency]   = useState("USD");
  const [amount, setAmount]             = useState("1000");
  const [showAdvisorBox, setShowAdvisorBox] = useState(true);
  const [showConfirm, setShowConfirm]       = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wallets = [] }                      = useWallets();
  const { data: fxRates, isLoading: ratesLoading }  = useFxRates();
  const { data: fxRate,  isLoading: rateLoading }   = useFxRate(fromCurrency, toCurrency);

  const displayedPairs = FIAT_CURRENCIES
    .filter(c => c.code !== fromCurrency)
    .map(c => ({ base: fromCurrency, target: c.code }));

  const exchangeMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/fx-exchange", data);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Exchange failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exchange Successful",
        description: `${amount} ${fromCurrency} → ${data.convertedAmount?.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toCurrency}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Exchange Failed",
        description: error.message || "There was an error processing your exchange. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openConfirm = () => {
    if (fromCurrency === toCurrency) {
      toast({ title: "Invalid Selection", description: "From and To currencies must be different.", variant: "destructive" });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    if (parseFloat(amount) > fromBalance) {
      toast({ title: "Insufficient Balance", description: `You only have ${fromBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${fromCurrency} available.`, variant: "destructive" });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    exchangeMutation.mutate({ fromCurrency, toCurrency, amount: parseFloat(amount) });
  };

  const exchangeRate    = fxRate ? parseFloat((fxRate as any).rate) : 1;
  const spread          = fxRate ? parseFloat((fxRate as any).spread) : 0.005;
  const grossConverted  = parseFloat(amount || "0") * exchangeRate;
  const fee             = grossConverted * spread;
  const convertedAmount = grossConverted - fee;

  const fromWallet  = wallets.find((w: any) => w.currency === fromCurrency);
  const toWallet    = wallets.find((w: any) => w.currency === toCurrency);
  const fromBalance = fromWallet ? parseFloat(fromWallet.balance) : 0;
  const toBalance   = toWallet   ? parseFloat(toWallet.balance)   : 0;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FX Exchange</h1>
          <p className="text-gray-500 text-sm mt-1">Fiat currency exchange and international remittance</p>
        </div>
        {!rateLoading && (
          <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
            <span className="text-slate-400">Live:</span>
            <span className="font-bold">1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}</span>
            {(fxRate as any)?.isStale ? (
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs">
                ⚠ {formatRateAge((fxRate as any).rateAgeMinutes)}
              </Badge>
            ) : (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <RefreshCw className="w-3 h-3" />
                {formatRateAge((fxRate as any)?.rateAgeMinutes)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* YTD Chart */}
      <YtdRateChart fromCurrency={fromCurrency} toCurrency={toCurrency} currentRate={exchangeRate} isLoading={rateLoading} />

      {/* Spot Rate Banner */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-700 text-white border-0">
        <CardContent className="py-4 px-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Live Spot Rate</p>
              <p className="text-2xl font-bold">
                {rateLoading ? (
                  <span className="text-slate-400 text-base">Loading…</span>
                ) : (
                  <>1 {fromCurrency} = <span className="text-amber-400">{exchangeRate.toFixed(4)}</span> {toCurrency}</>
                )}
              </p>
            </div>
            {!rateLoading && (
              (fxRate as any)?.isStale ? (
                <span className="flex items-center gap-1.5 text-xs text-amber-400">
                  <RefreshCw className="w-3 h-3" />
                  ⚠ {formatRateAge((fxRate as any)?.rateAgeMinutes)}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <RefreshCw className="w-3 h-3" />
                  {formatRateAge((fxRate as any)?.rateAgeMinutes)}
                </span>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exchange Form + Rates Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Currency Exchange</CardTitle>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                  Fiat → Fiat
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* FROM */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wide">From</Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FIAT_CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Available: {fromBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fromCurrency}
                    </p>
                  </div>
                  <div className="w-40">
                    <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="h-10" />
                  </div>
                </div>
              </div>

              {/* Swap */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-dashed border-gray-200" />
                <Button variant="outline" size="sm" onClick={swapCurrencies} className="rounded-full px-3 gap-1.5 text-xs">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Swap
                </Button>
                <div className="flex-1 border-t border-dashed border-gray-200" />
              </div>

              {/* TO */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wide">To</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIAT_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Available: {toBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency}
                </p>
              </div>

              {/* Breakdown */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between font-medium text-gray-800 text-base pb-1 border-b">
                  <span>You send</span>
                  <span>{parseFloat(amount || "0").toLocaleString()} {fromCurrency}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Spot Rate</span>
                  <span className="font-medium">{rateLoading ? "Loading…" : `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Processing Fee (0.5%)</span>
                  <span className="font-medium">{fee.toFixed(4)} {toCurrency}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Settlement</span>
                  <span className="font-medium text-green-600">Instant (T+0)</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Liquidity Source</span>
                  <span className="font-medium">External provider</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t text-base">
                  <span>You receive</span>
                  <span>{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toCurrency}</span>
                </div>
              </div>

              {/* Disclosure */}
              <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-blue-50 border border-blue-200 text-blue-800">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>Foreign exchange transactions are executed at prevailing market rates. Settlement is T+0 for internal transfers. AMAX is registered with AUSTRAC for remittance and FX services.</span>
              </div>

              <Button className="w-full" onClick={openConfirm} disabled={exchangeMutation.isPending || rateLoading}>
                {exchangeMutation.isPending ? "Processing…" : "Review & Confirm Exchange"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Rates Panel */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {FIAT_CURRENCIES.find(c => c.code === fromCurrency)?.flag} {fromCurrency} Exchange Rates
              </CardTitle>
              <p className="text-xs text-gray-500">Click a pair to select it above</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {ratesLoading ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading rates…</p>
                ) : (
                  displayedPairs.map(({ base, target }) => {
                    const rate      = (fxRates as any[])?.find((r: any) => r.baseCurrency === base && r.targetCurrency === target);
                    const rateValue = rate ? parseFloat(rate.rate) : null;
                    const isSelected = toCurrency === target;
                    const targetMeta = FIAT_CURRENCIES.find(c => c.code === target);

                    return (
                      <div
                        key={`${base}-${target}`}
                        className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors border ${
                          isSelected ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-transparent hover:bg-gray-100"
                        }`}
                        onClick={() => setToCurrency(target)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-xs ${isSelected ? "text-amber-700" : "text-gray-800"}`}>
                            {targetMeta?.flag} {base}/{target}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{targetMeta?.name}</p>
                        </div>
                        <div className="flex-shrink-0">
                          {rateValue != null && <RateSparkline fromCurrency={base} toCurrency={target} currentRate={rateValue} />}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {rateValue !== null ? (
                            <>
                              <p className="font-bold text-sm text-gray-900">{rateValue.toFixed(4)}</p>
                              <span className={`text-xs ${rate?.isStale ? "text-amber-600" : "text-green-600"}`}>
                                {rate?.isStale ? `⚠ ${rate.rateAgeMinutes}m` : rate?.rateAgeMinutes != null ? formatRateAge(rate.rateAgeMinutes) : "Live"}
                              </span>
                            </>
                          ) : <span className="text-xs text-gray-300">—</span>}
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

      {/* Regulatory Footer */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Currency exchange and international payment services provided by AMAX Financial Pty Ltd (ABN 54 690 827 608). Registered with AUSTRAC for remittance and foreign exchange services. Exchange rates are indicative and subject to change. All transactions are subject to AML/CTF monitoring obligations under the Anti-Money Laundering and Counter-Terrorism Financing Act 2006.
        </p>
      </div>

      {/* Confirm Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Confirm Exchange
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-xs px-3 py-1.5 rounded-full font-medium w-fit bg-blue-100 text-blue-800">
              FX Conversion — Fiat → Fiat
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">You send</span>
                <span className="font-semibold">{parseFloat(amount || "0").toLocaleString()} {fromCurrency}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Spot Rate</span>
                <div className="text-right">
                  <div className="font-medium">1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}</div>
                  <div className={`text-xs mt-0.5 flex items-center justify-end gap-1 ${(fxRate as any)?.isStale ? "text-amber-500" : "text-green-500"}`}>
                    <RefreshCw className="w-3 h-3" />
                    {(fxRate as any)?.isStale ? "⚠ " : ""}{formatRateAge((fxRate as any)?.rateAgeMinutes)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee (0.5%)</span>
                <span className="font-medium">{fee.toFixed(4)} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Settlement</span>
                <span className="font-medium text-green-600">Instant (T+0)</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base">
                <span className="font-semibold text-gray-900">You receive</span>
                <span className="font-bold text-gray-900">
                  {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toCurrency}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-blue-50 border border-blue-200 text-blue-800">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Foreign exchange transactions are executed at prevailing market rates. Settlement is T+0 for internal transfers.</span>
            </div>
            <p className="text-xs text-gray-500 text-center">
              By confirming, you authorise AMAX Financial Pty Ltd (ABN 54 690 827 608) to process this foreign exchange transaction.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleConfirm} disabled={exchangeMutation.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {exchangeMutation.isPending ? "Processing…" : "Confirm Exchange"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advisor Box */}
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
                <Button variant="ghost" size="sm" onClick={() => setShowAdvisorBox(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-700 mb-3">Need help with your exchange or a large transfer? Contact our team.</p>
              <div className="flex items-center space-x-2 text-purple-600 mb-3">
                <Phone className="w-3 h-3" />
                <span className="font-medium text-xs">+61 3 9654 1000</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.open("tel:+61396541000", "_self")} className="flex-1 text-xs h-8">
                  <Phone className="w-3 h-3 mr-1" /> Call
                </Button>
                <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-xs h-8">
                  <MessageSquare className="w-3 h-3 mr-1" /> Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
