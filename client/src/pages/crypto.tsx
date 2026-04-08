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
import {
  ArrowRightLeft, Wallet, Shield, RefreshCw,
  AlertTriangle, Info, Phone, MessageSquare, X,
} from "lucide-react";
import YtdRateChart from "@/components/fx/ytd-rate-chart";
import RateSparkline from "@/components/fx/rate-sparkline";

const FIAT_ENTRY = [
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "USD", name: "US Dollar",         flag: "🇺🇸" },
];

const DIGITAL_ASSETS = [
  { code: "BTC",  name: "Bitcoin",   flag: "₿"  },
  { code: "ETH",  name: "Ethereum",  flag: "Ξ"  },
  { code: "USDT", name: "Tether",    flag: "💵" },
  { code: "USDC", name: "USD Coin",  flag: "🪙" },
];

const DISPLAYED_PAIRS = [
  { base: "BTC",  target: "AUD" },
  { base: "ETH",  target: "AUD" },
  { base: "USDT", target: "AUD" },
  { base: "USDC", target: "AUD" },
  { base: "AUD",  target: "BTC" },
  { base: "AUD",  target: "ETH" },
];

type AssetClass = "fiat" | "crypto";

function getConversionLabel(fromClass: AssetClass, toClass: AssetClass) {
  if (fromClass === "fiat"   && toClass === "crypto") return { text: "Buy — Fiat → Digital Asset",         color: "bg-amber-100 text-amber-800"   };
  if (fromClass === "crypto" && toClass === "fiat")   return { text: "Sell — Digital Asset → Fiat",        color: "bg-orange-100 text-orange-800" };
  return                                                     { text: "Swap — Digital Asset → Digital Asset", color: "bg-purple-100 text-purple-800" };
}

function formatRateAge(minutes: number | null | undefined): string {
  if (minutes == null) return "Live rate";
  if (minutes === 0)   return "< 1 min ago";
  if (minutes === 1)   return "1 min ago";
  return `${minutes} min ago`;
}

function getDisclosure(fromClass: AssetClass, toClass: AssetClass): string {
  if (fromClass === "fiat" && toClass === "crypto")
    return "You are purchasing a digital asset. Digital assets are not legal tender and are subject to significant price volatility. Once executed, crypto transactions are irreversible.";
  if (fromClass === "crypto" && toClass === "fiat")
    return "You are selling a digital asset for fiat currency. Proceeds will be credited to your fiat wallet. Rates are indicative and subject to market conditions at time of execution.";
  return "You are swapping one digital asset for another. Both assets are classified as digital currencies under your AUSTRAC DCE registration. Market rates apply.";
}

export default function Crypto() {
  const [fromClass, setFromClass] = useState<AssetClass>("fiat");
  const [toClass,   setToClass]   = useState<AssetClass>("crypto");
  const [fromCurrency, setFromCurrency] = useState("AUD");
  const [toCurrency,   setToCurrency]   = useState("BTC");
  const [amount, setAmount]             = useState("500");
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showAdvisor, setShowAdvisor]   = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wallets = [] }                      = useWallets();
  const { data: fxRates, isLoading: ratesLoading }  = useFxRates();
  const { data: fxRate,  isLoading: rateLoading }   = useFxRate(fromCurrency, toCurrency);

  const exchangeMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/fx-exchange", data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Exchange failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exchange Successful",
        description: `${amount} ${fromCurrency} → ${data.convertedAmount?.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${toCurrency}`,
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
      toast({ title: "Invalid Selection", description: "From and To assets must be different.", variant: "destructive" });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    if (parseFloat(amount) > fromBalance) {
      toast({ title: "Insufficient Balance", description: `You only have ${fromBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${fromCurrency} available.`, variant: "destructive" });
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

  const fromList = fromClass === "fiat" ? FIAT_ENTRY : DIGITAL_ASSETS;
  const toList   = toClass   === "fiat" ? FIAT_ENTRY : DIGITAL_ASSETS;

  const handleFromClass = (c: AssetClass) => {
    setFromClass(c);
    const list = c === "fiat" ? FIAT_ENTRY : DIGITAL_ASSETS;
    if (!list.find(x => x.code === fromCurrency)) setFromCurrency(list[0].code);
  };
  const handleToClass = (c: AssetClass) => {
    setToClass(c);
    const list = c === "fiat" ? FIAT_ENTRY : DIGITAL_ASSETS;
    if (!list.find(x => x.code === toCurrency)) setToCurrency(list[0].code);
  };
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromClass(toClass);
    setToClass(fromClass);
  };

  const convLabel  = getConversionLabel(fromClass, toClass);
  const disclosure = getDisclosure(fromClass, toClass);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crypto Exchange</h1>
          <p className="text-gray-500 text-sm mt-1">Buy, sell and swap digital assets</p>
        </div>
        {!rateLoading && (
          <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
            <span className="text-slate-400">Live:</span>
            <span className="font-bold">{fromCurrency}/{toCurrency} = {exchangeRate.toFixed(exchangeRate < 0.001 ? 8 : 4)}</span>
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

      {/* DCE Registration Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">AUSTRAC DCE Registration:</span> AMAX Financial Pty Ltd (ABN 54 690 827 608) is registered as a Digital Currency Exchange (DCE) provider with AUSTRAC. Crypto transactions are subject to AML/CTF monitoring obligations.
        </p>
      </div>

      {/* YTD Chart */}
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
              <p className="text-2xl font-bold text-white">
                {rateLoading ? (
                  <span className="text-slate-400 text-base">Loading…</span>
                ) : (
                  <>1 {fromCurrency} = {exchangeRate.toFixed(exchangeRate < 0.001 ? 8 : 4)} {toCurrency}</>
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Digital Asset Exchange</CardTitle>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${convLabel.color}`}>
                  {convLabel.text}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* FROM */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wide">From · Asset Class</Label>
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                  <button onClick={() => handleFromClass("fiat")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${fromClass === "fiat" ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
                    Fiat Entry
                  </button>
                  <button onClick={() => handleFromClass("crypto")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${fromClass === "crypto" ? "bg-white shadow text-amber-700" : "text-gray-500 hover:text-gray-700"}`}>
                    Digital Asset
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fromList.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Available: {fromBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {fromCurrency}
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
                <Label className="text-xs text-gray-500 uppercase tracking-wide">To · Asset Class</Label>
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                  <button onClick={() => handleToClass("fiat")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${toClass === "fiat" ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
                    Fiat Entry
                  </button>
                  <button onClick={() => handleToClass("crypto")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${toClass === "crypto" ? "bg-white shadow text-amber-700" : "text-gray-500 hover:text-gray-700"}`}>
                    Digital Asset
                  </button>
                </div>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {toList.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Available: {toBalance.toLocaleString(undefined, { maximumFractionDigits: 8 })} {toCurrency}
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
                  <span className="font-medium">{rateLoading ? "Loading…" : `1 ${fromCurrency} = ${exchangeRate.toFixed(8)} ${toCurrency}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Processing Fee (0.5%)</span>
                  <span className="font-medium">{fee.toFixed(8)} {toCurrency}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Settlement</span>
                  <span className="font-medium text-green-600">Instant (T+0)</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Network</span>
                  <span className="font-medium">Internal ledger</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t text-base">
                  <span>You receive</span>
                  <span>{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {toCurrency}</span>
                </div>
              </div>

              {/* Disclosure */}
              <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{disclosure}</span>
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
              <CardTitle className="text-sm">Crypto Rates vs AUD</CardTitle>
              <p className="text-xs text-gray-500">Click a pair to view its chart</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {ratesLoading ? (
                  <p className="text-sm text-gray-400 text-center py-4">Loading rates…</p>
                ) : (
                  DISPLAYED_PAIRS.map(({ base, target }) => {
                    const rate      = fxRates?.find((r: any) => r.baseCurrency === base && r.targetCurrency === target);
                    const rateValue = rate ? parseFloat(rate.rate) : null;
                    const isSelected = fromCurrency === base && toCurrency === target;
                    const allMeta: Record<string, { flag: string }> = {
                      AUD: { flag: "🇦🇺" }, USD: { flag: "🇺🇸" },
                      BTC: { flag: "₿" }, ETH: { flag: "Ξ" },
                      USDT: { flag: "💵" }, USDC: { flag: "🪙" },
                    };

                    return (
                      <div
                        key={`${base}-${target}`}
                        className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors border ${
                          isSelected ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-transparent hover:bg-gray-100"
                        }`}
                        onClick={() => { setFromCurrency(base); setToCurrency(target); }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-xs ${isSelected ? "text-amber-700" : "text-gray-800"}`}>
                            {allMeta[base]?.flag} {base}/{target}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {rateValue && <RateSparkline fromCurrency={base} toCurrency={target} currentRate={rateValue} />}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {rateValue !== null ? (
                            <>
                              <p className="font-bold text-sm text-gray-900">
                                {rateValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </p>
                              <span className={`text-xs ${rate?.isStale ? "text-amber-600" : "text-green-600"}`}>
                                {rate?.isStale ? `⚠ ${rate.rateAgeMinutes}m` : rate?.rateAgeMinutes != null ? `${rate.rateAgeMinutes}m` : "Live"}
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

      {/* DCE Footer */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          Digital currency exchange services provided by AMAX Financial Pty Ltd (ABN 54 690 827 608). AMAX holds DCE registration with AUSTRAC. Digital assets are not legal tender, not backed by government guarantee, and subject to significant price risk. Past performance is not indicative of future results.
        </p>
      </div>

      {/* Confirm Modal */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Confirm Exchange
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className={`text-xs px-3 py-1.5 rounded-full font-medium w-fit ${convLabel.color}`}>
              {convLabel.text}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">You send</span>
                <span className="font-semibold">{parseFloat(amount || "0").toLocaleString()} {fromCurrency}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Spot Rate</span>
                <div className="text-right">
                  <div className="font-medium">1 {fromCurrency} = {exchangeRate.toFixed(8)} {toCurrency}</div>
                  <div className={`text-xs mt-0.5 flex items-center justify-end gap-1 ${(fxRate as any)?.isStale ? "text-amber-500" : "text-green-500"}`}>
                    <RefreshCw className="w-3 h-3" />
                    {(fxRate as any)?.isStale ? "⚠ " : ""}{formatRateAge((fxRate as any)?.rateAgeMinutes)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee (0.5%)</span>
                <span className="font-medium">{fee.toFixed(8)} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Settlement</span>
                <span className="font-medium text-green-600">Instant (T+0)</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base">
                <span className="font-semibold text-gray-900">You receive</span>
                <span className="font-bold text-gray-900">
                  {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {toCurrency}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{disclosure}</span>
            </div>
            <p className="text-xs text-gray-500 text-center">
              By confirming, you authorise AMAX Financial Pty Ltd (ABN 54 690 827 608) to process this digital asset exchange under its AUSTRAC DCE registration.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleConfirm} disabled={exchangeMutation.isPending} className="flex-1 bg-amber-600 hover:bg-amber-700">
              {exchangeMutation.isPending ? "Processing…" : "Confirm Exchange"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advisor Box */}
      {showAdvisor && (
        <div className="fixed top-4 right-4 z-50 w-80">
          <Card className="backdrop-blur-sm bg-white/95 border-amber-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Crypto Support</h3>
                    <p className="text-xs text-gray-600">DCE Advisory Team</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAdvisor(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-700 mb-3">Questions about digital assets or large trades? Our team can assist.</p>
              <div className="flex items-center space-x-2 text-amber-600 mb-3">
                <Phone className="w-3 h-3" />
                <span className="font-medium text-xs">+61 3 9654 1000</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.open("tel:+61396541000", "_self")} className="flex-1 text-xs h-8">
                  <Phone className="w-3 h-3 mr-1" /> Call
                </Button>
                <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs h-8">
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
