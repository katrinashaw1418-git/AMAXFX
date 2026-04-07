import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useFxRates, useFxRate } from "@/hooks/use-fx-rates";
import { useWallets } from "@/hooks/use-portfolio";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRightLeft, Wallet, Shield, Phone,
  MessageSquare, X, RefreshCw, AlertTriangle, Info,
} from "lucide-react";
import YtdRateChart from "@/components/fx/ytd-rate-chart";
import RateSparkline from "@/components/fx/rate-sparkline";
import CurrencyBalances from "@/components/dashboard/currency-balances";
import TransactionHistory from "@/components/dashboard/transaction-history";

const FIAT_CURRENCIES = [
  { code: "AUD",  name: "Australian Dollar",  flag: "🇦🇺" },
  { code: "USD",  name: "US Dollar",          flag: "🇺🇸" },
  { code: "CAD",  name: "Canadian Dollar",    flag: "🇨🇦" },
  { code: "EUR",  name: "Euro",               flag: "🇪🇺" },
  { code: "GBP",  name: "British Pound",      flag: "🇬🇧" },
  { code: "HKD",  name: "Hong Kong Dollar",   flag: "🇭🇰" },
  { code: "SGD",  name: "Singapore Dollar",   flag: "🇸🇬" },
  { code: "JPY",  name: "Japanese Yen",       flag: "🇯🇵" },
  { code: "KRW",  name: "South Korean Won",   flag: "🇰🇷" },
  { code: "CNY",  name: "Chinese Yuan",       flag: "🇨🇳" },
];

const CRYPTO_CURRENCIES = [
  { code: "BTC",  name: "Bitcoin",   flag: "₿"  },
  { code: "ETH",  name: "Ethereum",  flag: "Ξ"  },
  { code: "USDT", name: "Tether",    flag: "💵" },
  { code: "USDC", name: "USD Coin",  flag: "🪙" },
];

type AssetType = "fiat" | "crypto";

function getConversionType(fromType: AssetType, toType: AssetType) {
  if (fromType === "fiat"   && toType === "fiat")   return { label: "Fiat → Fiat",                  badge: "FX Conversion",      color: "bg-blue-100 text-blue-800"   };
  if (fromType === "fiat"   && toType === "crypto")  return { label: "Fiat → Digital Asset",         badge: "Crypto Purchase",    color: "bg-amber-100 text-amber-800"  };
  if (fromType === "crypto" && toType === "fiat")    return { label: "Digital Asset → Fiat",         badge: "Crypto Sale",        color: "bg-orange-100 text-orange-800" };
  return                                                    { label: "Digital Asset → Digital Asset", badge: "Crypto Swap",        color: "bg-purple-100 text-purple-800" };
}

function getComplianceDisclosure(fromType: AssetType, toType: AssetType): { text: string; icon: "info" | "warn" } {
  if (fromType === "fiat" && toType === "fiat") {
    return { icon: "info", text: "Foreign exchange transactions are executed at prevailing market rates. Settlement is T+0 for internal transfers." };
  }
  if (fromType === "fiat" && toType === "crypto") {
    return { icon: "warn", text: "Digital assets are not legal tender and are subject to significant price volatility. Transactions are irreversible once executed. AMAX holds DCE registration with AUSTRAC." };
  }
  if (fromType === "crypto" && toType === "fiat") {
    return { icon: "warn", text: "Digital asset sales are subject to market conditions and liquidity availability. Proceeds credited to your fiat account upon completion." };
  }
  return { icon: "warn", text: "Crypto-to-crypto swaps are subject to market volatility. Both assets are classified as digital assets under AUSTRAC DCE registration." };
}

const DISPLAYED_PAIRS = [
  { base: "AUD", target: "USD"  },
  { base: "AUD", target: "CAD"  },
  { base: "AUD", target: "EUR"  },
  { base: "AUD", target: "GBP"  },
  { base: "AUD", target: "HKD"  },
  { base: "AUD", target: "SGD"  },
  { base: "AUD", target: "JPY"  },
  { base: "AUD", target: "KRW"  },
  { base: "AUD", target: "CNY"  },
  { base: "AUD", target: "BTC"  },
  { base: "AUD", target: "ETH"  },
  { base: "AUD", target: "USDT" },
  { base: "AUD", target: "USDC" },
];

export default function Dashboard() {
  const [fromAssetType, setFromAssetType] = useState<AssetType>("fiat");
  const [toAssetType,   setToAssetType]   = useState<AssetType>("fiat");
  const [fromCurrency, setFromCurrency]   = useState("AUD");
  const [toCurrency, setToCurrency]       = useState("USD");
  const [amount, setAmount]               = useState("1000");
  const [showAdvisorBox, setShowAdvisorBox]   = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wallets = [] }                          = useWallets();
  const { data: fxRates, isLoading: ratesLoading }      = useFxRates();
  const { data: fxRate,  isLoading: rateLoading }       = useFxRate(fromCurrency, toCurrency);

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

  const openConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmedExchange = () => {
    setShowConfirmModal(false);
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
    setFromAssetType(toAssetType);
    setToAssetType(fromAssetType);
  };

  const conversionInfo  = getConversionType(fromAssetType, toAssetType);
  const disclosure      = getComplianceDisclosure(fromAssetType, toAssetType);
  const fromCurrencies  = fromAssetType === "fiat" ? FIAT_CURRENCIES : CRYPTO_CURRENCIES;
  const toCurrencies    = toAssetType   === "fiat" ? FIAT_CURRENCIES : CRYPTO_CURRENCIES;

  // Keep selected currency valid when toggling asset type
  const handleFromAssetType = (t: AssetType) => {
    setFromAssetType(t);
    const list = t === "fiat" ? FIAT_CURRENCIES : CRYPTO_CURRENCIES;
    if (!list.find(c => c.code === fromCurrency)) setFromCurrency(list[0].code);
  };
  const handleToAssetType = (t: AssetType) => {
    setToAssetType(t);
    const list = t === "fiat" ? FIAT_CURRENCIES : CRYPTO_CURRENCIES;
    if (!list.find(c => c.code === toCurrency)) setToCurrency(list[0].code);
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Live FX rates, exchange &amp; account overview</p>
        </div>

        {/* Live spot rate badge */}
        {!rateLoading && (
          <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
            <span className="text-slate-400">Live:</span>
            <span className="font-semibold">
              1 {fromCurrency} = <span className="text-white font-bold">{exchangeRate.toFixed(4)}</span> {toCurrency}
            </span>
            {(fxRate as any)?.isStale ? (
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs">
                ⚠ {(fxRate as any).rateAgeMinutes}m old
              </Badge>
            ) : (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <RefreshCw className="w-3 h-3" />
                {(fxRate as any)?.rateAgeMinutes != null ? `${(fxRate as any).rateAgeMinutes}m ago` : "Live"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/wallets">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-100 hover:border-blue-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">eWallet</p>
                <p className="text-xs text-gray-500">Manage balances</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/compliance">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-emerald-100 hover:border-emerald-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Compliance</p>
                <p className="text-xs text-gray-500">KYC &amp; documents</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── YTD Chart + Currency Balances ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CurrencyBalances />
        </div>
        <div className="lg:col-span-2">
          <YtdRateChart
            fromCurrency={fromCurrency}
            toCurrency={toCurrency}
            currentRate={exchangeRate}
            isLoading={rateLoading}
          />
        </div>
      </div>

      {/* ── Exchange Form + Live Rates Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exchange Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Currency Exchange</CardTitle>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${conversionInfo.color}`}>
                  {conversionInfo.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* FROM row */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wide">From · Asset Type</Label>
                {/* Asset toggle */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                  <button onClick={() => handleFromAssetType("fiat")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${fromAssetType === "fiat" ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
                    Fiat
                  </button>
                  <button onClick={() => handleFromAssetType("crypto")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${fromAssetType === "crypto" ? "bg-white shadow text-amber-700" : "text-gray-500 hover:text-gray-700"}`}>
                    Digital Assets
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fromCurrencies.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Available: {fromBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {fromCurrency}
                    </p>
                  </div>
                  <div className="w-40">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Swap button */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-dashed border-gray-200" />
                <Button variant="outline" size="sm" onClick={swapCurrencies} className="rounded-full px-3 gap-1.5 text-xs">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Swap
                </Button>
                <div className="flex-1 border-t border-dashed border-gray-200" />
              </div>

              {/* TO row */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wide">To · Asset Type</Label>
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
                  <button onClick={() => handleToAssetType("fiat")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${toAssetType === "fiat" ? "bg-white shadow text-blue-700" : "text-gray-500 hover:text-gray-700"}`}>
                    Fiat
                  </button>
                  <button onClick={() => handleToAssetType("crypto")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${toAssetType === "crypto" ? "bg-white shadow text-amber-700" : "text-gray-500 hover:text-gray-700"}`}>
                    Digital Assets
                  </button>
                </div>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toCurrencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Available: {toBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {toCurrency}
                </p>
              </div>

              {/* Exchange details */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between font-medium text-gray-800 text-base pb-1 border-b">
                  <span>You send</span>
                  <span>{parseFloat(amount || "0").toLocaleString()} {fromCurrency}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Spot Rate</span>
                  <span className="font-medium">{rateLoading ? "Loading…" : `1 ${fromCurrency} = ${exchangeRate.toFixed(6)} ${toCurrency}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Processing Fee (0.5%)</span>
                  <span className="font-medium">{fee.toFixed(6)} {toCurrency}</span>
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
                  <span>{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {toCurrency}</span>
                </div>
              </div>

              {/* Compliance disclosure */}
              <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${disclosure.icon === "warn" ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
                {disclosure.icon === "warn"
                  ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  : <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                <span>{disclosure.text}</span>
              </div>

              <Button
                className="w-full"
                onClick={openConfirm}
                disabled={exchangeMutation.isPending || rateLoading}
              >
                {exchangeMutation.isPending ? "Processing…" : "Review & Confirm Exchange"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Rates Panel */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Live Exchange Rates</CardTitle>
              <p className="text-xs text-gray-500">Click a pair to update the chart &amp; form</p>
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
                    const targetMeta = currencies.find((c) => c.code === target);
                    const baseMeta   = currencies.find((c) => c.code === base);
                    const formatRate = (v: number) =>
                      v < 0.0001 ? v.toFixed(8) :
                      v < 0.01   ? v.toFixed(6) :
                      v < 1      ? v.toFixed(4) :
                      v > 1000   ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) :
                      v.toFixed(4);

                    return (
                      <div
                        key={`${base}-${target}`}
                        className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors border ${
                          isSelected
                            ? "bg-amber-50 border-amber-300"
                            : "bg-gray-50 border-transparent hover:bg-gray-100"
                        }`}
                        onClick={() => { setFromCurrency(base); setToCurrency(target); }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-xs ${isSelected ? "text-amber-700" : "text-gray-800"}`}>
                            {baseMeta?.flag} {base}/{targetMeta?.flag} {target}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{targetMeta?.name}</p>
                        </div>

                        <div className="flex-shrink-0">
                          {rateValue && (
                            <RateSparkline fromCurrency={base} toCurrency={target} currentRate={rateValue} />
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          {rateValue !== null ? (
                            <>
                              <p className="font-bold text-sm text-gray-900">
                                {formatRate(rateValue)}
                              </p>
                              {rate?.isStale ? (
                                <span className="text-xs text-amber-600">⚠ {rate.rateAgeMinutes}m</span>
                              ) : (
                                <span className="text-xs text-green-600">
                                  {rate?.rateAgeMinutes != null ? `${rate.rateAgeMinutes}m` : "Live"}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
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

      {/* ── Recent Transactions ── */}
      <TransactionHistory />

      {/* ── Floating Advisor Box ── */}
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

      {/* ── Confirm Exchange Modal ── */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Confirm Exchange
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Conversion type */}
            <div className={`text-xs px-3 py-1.5 rounded-full font-medium w-fit ${conversionInfo.color}`}>
              {conversionInfo.badge} — {conversionInfo.label}
            </div>

            {/* Summary table */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">You send</span>
                <span className="font-semibold">{parseFloat(amount || "0").toLocaleString()} {fromCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Spot Rate</span>
                <span className="font-medium">1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processing Fee (0.5%)</span>
                <span className="font-medium">{fee.toFixed(6)} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Settlement</span>
                <span className="font-medium text-green-600">Instant (T+0)</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-base">
                <span className="font-semibold text-gray-900">You receive</span>
                <span className="font-bold text-gray-900">
                  {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {toCurrency}
                </span>
              </div>
            </div>

            {/* Compliance note */}
            <div className={`flex items-start gap-2 p-3 rounded-lg text-xs ${disclosure.icon === "warn" ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-blue-50 border border-blue-200 text-blue-800"}`}>
              {disclosure.icon === "warn"
                ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                : <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
              <span>{disclosure.text}</span>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By confirming, you authorise AMAX Financial Pty Ltd (ABN 54 690 827 608) to process this transaction.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirmedExchange}
              disabled={exchangeMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {exchangeMutation.isPending ? "Processing…" : "Confirm Exchange"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
