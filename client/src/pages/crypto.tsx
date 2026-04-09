import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFxRates, useFxRate } from "@/hooks/use-fx-rates";
import { useWallets } from "@/hooks/use-portfolio";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, Shield, RefreshCw,
  AlertTriangle, Info, Phone, MessageSquare, X,
  ArrowDown, Send, Mail,
} from "lucide-react";
import YtdRateChart from "@/components/fx/ytd-rate-chart";
import RateSparkline from "@/components/fx/rate-sparkline";

// ── Constants ─────────────────────────────────────────────────────────────────

const FIAT_CURRENCIES = [
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
  { base: "AUD",  target: "BTC"  },
  { base: "AUD",  target: "ETH"  },
  { base: "AUD",  target: "USDT" },
  { base: "AUD",  target: "USDC" },
  { base: "BTC",  target: "AUD"  },
  { base: "ETH",  target: "AUD"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRateAge(minutes: number | null | undefined): string {
  if (minutes == null) return "Live rate";
  if (minutes === 0)   return "< 1 min ago";
  if (minutes === 1)   return "1 min ago";
  return `${minutes} min ago`;
}

function isValidWalletAddress(address: string, currency: string): boolean {
  const trimmed = address.trim();
  if (!trimmed) return false;
  if (["ETH", "USDT", "USDC"].includes(currency)) {
    return /^0x[0-9a-fA-F]{40}$/.test(trimmed);
  }
  if (currency === "BTC") {
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed) ||
           /^bc1[a-z0-9]{6,87}$/.test(trimmed);
  }
  return trimmed.length >= 20;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Crypto() {
  const [mode, setMode] = useState<"buy" | "sell">("buy");

  // BUY form state
  const [fromCurrency,     setFromCurrency]     = useState("AUD");
  const [toCurrency,       setToCurrency]       = useState("BTC");
  const [amount,           setAmount]           = useState("500");
  const [destinationWallet, setDestinationWallet] = useState("");
  const [complianceAgreed, setComplianceAgreed] = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);

  // SELL enquiry state
  const [sellCurrency, setSellCurrency] = useState("BTC");
  const [sellAmount,   setSellAmount]   = useState("");

  const [showAdvisor, setShowAdvisor] = useState(true);

  const { toast }       = useToast();
  const queryClient     = useQueryClient();
  const { data: wallets = [] }                     = useWallets();
  const { data: fxRates, isLoading: ratesLoading } = useFxRates();
  const { data: fxRate,  isLoading: rateLoading }  = useFxRate(fromCurrency, toCurrency);

  const exchangeMutation = useMutation({
    mutationFn: async (data: { fromCurrency: string; toCurrency: string; amount: number; destinationWallet: string }) => {
      const res = await apiRequest("POST", "/api/fx-exchange", data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Exchange failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Exchange Submitted",
        description: `${amount} ${fromCurrency} → ${data.convertedAmount?.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${toCurrency} — delivery to your wallet will be confirmed within 1 business day.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setDestinationWallet("");
      setComplianceAgreed(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Exchange Failed",
        description: error.message || "There was an error processing your exchange. Please try again.",
        variant: "destructive",
      });
    },
  });

  // ── Derived values ──────────────────────────────────────────────────────────
  const exchangeRate    = fxRate ? parseFloat((fxRate as any).rate) : 1;
  const spread          = fxRate ? parseFloat((fxRate as any).spread) : 0.005;
  const grossConverted  = parseFloat(amount || "0") * exchangeRate;
  const fee             = grossConverted * spread;
  const convertedAmount = grossConverted - fee;

  const fromWallet  = wallets.find((w: any) => w.currency === fromCurrency);
  const fromBalance = fromWallet ? parseFloat(fromWallet.balance) : 0;

  const rateIsStale = (fxRate as any)?.isStale || ((fxRate as any)?.rateAgeMinutes ?? 0) > 5;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    if (parseFloat(amount) > fromBalance) {
      toast({ title: "Insufficient Balance", description: `You only have ${fromBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${fromCurrency} available.`, variant: "destructive" });
      return;
    }
    if (!destinationWallet.trim()) {
      toast({ title: "Wallet Address Required", description: "You must provide an external wallet address. AMAX does not hold crypto — your digital assets are delivered directly to your wallet.", variant: "destructive" });
      return;
    }
    if (!isValidWalletAddress(destinationWallet, toCurrency)) {
      toast({ title: "Invalid Wallet Address", description: `The address entered does not appear to be a valid ${toCurrency} wallet address. Please check and try again.`, variant: "destructive" });
      return;
    }
    // Rate staleness block — consumer protection, AUSTRAC concern
    if (rateIsStale) {
      const rateAge = (fxRate as any)?.rateAgeMinutes ?? 0;
      toast({
        title: "Rate Expired — Please Wait",
        description: `The displayed rate is ${rateAge} minute${rateAge !== 1 ? "s" : ""} old. Rates must be within 5 minutes. A fresh rate will load automatically.`,
        variant: "destructive",
      });
      return;
    }
    if (!complianceAgreed) {
      toast({ title: "Compliance Confirmation Required", description: "Please confirm the AML/CTF declaration before proceeding.", variant: "destructive" });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    exchangeMutation.mutate({ fromCurrency, toCurrency, amount: parseFloat(amount), destinationWallet });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crypto Exchange</h1>
          <p className="text-gray-500 text-sm mt-1">DCE-registered fiat ↔ digital asset exchange</p>
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
        <div className="text-sm text-amber-800 space-y-1">
          <p>
            <span className="font-semibold">AUSTRAC DCE Registration — Exchange Only:</span>{" "}
            AMAX Financial Pty Ltd (ABN 54 690 827 608) is registered as a Digital Currency Exchange (DCE) with AUSTRAC.
            AMAX provides fiat ↔ crypto exchange services only. AMAX does not hold, store, or custody digital assets
            on your behalf and does not maintain crypto accounts for users.
          </p>
          <p className="text-xs text-amber-700">
            Purchased crypto is delivered to your nominated external wallet address.
            All transactions are subject to AML/CTF monitoring under the <em>Anti-Money Laundering and
            Counter-Terrorism Financing Act 2006</em> (Cth).
          </p>
        </div>
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
              rateIsStale ? (
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
            <CardContent className="pt-5 space-y-0">
              <Tabs value={mode} onValueChange={(v) => setMode(v as "buy" | "sell")}>
                <TabsList className="w-full mb-5">
                  <TabsTrigger value="buy" className="flex-1">Buy Crypto</TabsTrigger>
                  <TabsTrigger value="sell" className="flex-1">Sell Crypto</TabsTrigger>
                </TabsList>

                {/* ── BUY TAB ── */}
                <TabsContent value="buy" className="space-y-5 mt-0">

                  {/* DCE Delivery Notice */}
                  <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Exchange &amp; Deliver Only:</strong> AMAX exchanges your fiat for digital assets and
                      delivers them directly to your nominated external wallet address. AMAX does not maintain a
                      crypto account on your behalf. You must provide a valid external wallet address below.
                    </span>
                  </div>

                  {/* FROM — Fiat */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">You Pay (Fiat)</Label>
                    <div className="flex gap-3">
                      <div className="w-36">
                        <Select value={fromCurrency} onValueChange={setFromCurrency}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FIAT_CURRENCIES.map(c => (
                              <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="h-10" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> Available: {fromBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fromCurrency}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                      <ArrowDown className="w-3 h-3" /> Exchange
                    </div>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>

                  {/* TO — Crypto selector only, no balance */}
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500 uppercase tracking-wide">You Receive (Digital Asset)</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIGITAL_ASSETS.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Send className="w-3 h-3" /> Delivered to your external wallet — see field below
                    </p>
                  </div>

                  {/* Destination Wallet Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="dest-wallet" className="text-xs text-gray-700 font-medium">
                      Destination External Wallet Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dest-wallet"
                      value={destinationWallet}
                      onChange={e => setDestinationWallet(e.target.value)}
                      placeholder={
                        toCurrency === "BTC"
                          ? "bc1q… or 1A1z…"
                          : "0x742d35Cc6634C0532925a3b8D4C9b8f3F4FA08..."
                      }
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Your {toCurrency} will be delivered to this address. AMAX does not hold or store crypto — delivery is to
                      your external wallet only (Coinbase, Binance, Ledger, MetaMask, etc.). Double-check this address:
                      deliveries cannot be reversed.
                    </p>
                    {destinationWallet && !isValidWalletAddress(destinationWallet, toCurrency) && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Address format does not appear valid for {toCurrency}
                      </p>
                    )}
                    {destinationWallet && isValidWalletAddress(destinationWallet, toCurrency) && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        ✓ Address format looks valid for {toCurrency}
                      </p>
                    )}
                  </div>

                  {/* Breakdown */}
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between font-medium text-gray-800 text-base pb-1 border-b">
                      <span>You pay</span>
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
                      <span>Delivery</span>
                      <span className="font-medium text-blue-700 truncate max-w-[220px]">
                        {destinationWallet ? `→ ${destinationWallet.slice(0, 12)}…` : "External wallet address required"}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t text-base">
                      <span>You receive</span>
                      <span>{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {toCurrency}</span>
                    </div>
                  </div>

                  {/* AML disclosure */}
                  <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      This exchange is arranged by AMAX Financial Pty Ltd (ABN 54 690 827 608) under its AUSTRAC DCE registration.
                      AMAX does not hold, store, or custody digital assets. Upon execution, the purchased {toCurrency} will be
                      delivered to your specified external wallet address. AMAX does not maintain crypto accounts on your behalf.
                      Digital assets are not legal tender, are subject to significant price volatility, and exchanges are
                      irreversible once confirmed.
                    </span>
                  </div>

                  {/* $10K TTR notice */}
                  {parseFloat(amount) >= 10000 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-orange-50 border border-orange-200 text-orange-800">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        Transactions of {fromCurrency} 10,000 or more are subject to mandatory reporting obligations under
                        the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) §43. AMAX is required
                        to submit a Threshold Transaction Report (TTR) to AUSTRAC.
                      </span>
                    </div>
                  )}

                  {/* Compliance confirmation */}
                  <div className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <Checkbox
                      id="compliance-agreed"
                      checked={complianceAgreed}
                      onCheckedChange={(v) => setComplianceAgreed(v === true)}
                      className="mt-0.5 shrink-0"
                    />
                    <label htmlFor="compliance-agreed" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                      I confirm the destination wallet address is correct and belongs to me or an authorised recipient.
                      I acknowledge this exchange is subject to KYC, AML/CTF monitoring, and AUSTRAC recordkeeping obligations.
                      I understand digital asset exchanges are irreversible once confirmed.
                    </label>
                  </div>

                  <Button
                    className="w-full"
                    onClick={openConfirm}
                    disabled={exchangeMutation.isPending || rateLoading || rateIsStale}
                    title={rateIsStale ? "Rate is stale — waiting for refresh" : undefined}
                  >
                    {exchangeMutation.isPending
                      ? "Processing…"
                      : rateIsStale
                      ? "⚠ Rate Expired — Refreshing…"
                      : "Review & Confirm Exchange"}
                  </Button>
                </TabsContent>

                {/* ── SELL TAB ── */}
                <TabsContent value="sell" className="space-y-5 mt-0">
                  <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>SELL / CONVERT to AUD:</strong> To sell digital assets for AUD, contact our compliance team.
                      We will provide you with a one-time exchange deposit address for your specific transaction.
                      AUD proceeds will be credited to your nominated bank account or AMAX fiat wallet within
                      1 business day of confirmed receipt.
                    </span>
                  </div>

                  {/* Sell enquiry form */}
                  <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-800">Sell Enquiry — Step 1</p>
                    <p className="text-xs text-gray-500">Tell us what you want to sell. We will confirm rates and provide a deposit address.</p>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Digital Asset to Sell</Label>
                      <Select value={sellCurrency} onValueChange={setSellCurrency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIGITAL_ASSETS.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Approximate Amount ({sellCurrency})</Label>
                      <Input
                        type="number"
                        value={sellAmount}
                        onChange={e => setSellAmount(e.target.value)}
                        placeholder="0.00000000"
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        const subject = encodeURIComponent(`AMAX Crypto SELL Enquiry — ${sellAmount || "?"} ${sellCurrency}`);
                        const body = encodeURIComponent(
                          `Hello AMAX Compliance Team,\n\nI would like to sell the following digital assets:\n\nAsset: ${sellCurrency}\nAmount: ${sellAmount || "TBD"}\n\nPlease provide me with a one-time deposit address and confirm the current rate and AUD proceeds.\n\nThank you.`
                        );
                        window.open(`mailto:info@amaxglobal.com.au?subject=${subject}&body=${body}`, "_self");
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Sell Enquiry to Compliance
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Or call us: +61 2 1234 5678</p>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 text-sm">
                    <p className="font-medium text-gray-800">How the SELL process works:</p>
                    <ol className="space-y-2 text-xs text-gray-600 list-none">
                      <li className="flex items-start gap-2"><span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span><span>Contact compliance team with the asset and amount you wish to sell.</span></li>
                      <li className="flex items-start gap-2"><span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span><span>We confirm the current rate and provide a one-time exchange deposit address for your transaction.</span></li>
                      <li className="flex items-start gap-2"><span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span><span>You send your crypto to the provided address. AML/CTF monitoring applies to all inbound transactions.</span></li>
                      <li className="flex items-start gap-2"><span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span><span>Upon confirmed receipt, AMAX executes the exchange and credits AUD to your nominated account within 1 business day.</span></li>
                    </ol>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      SELL transactions are processed by AMAX's compliance team (Compliance Officer: Qin Xiong).
                      Do not send crypto to any address without first receiving written confirmation from AMAX.
                      AMAX does not maintain standing crypto wallets for users — each sell transaction uses a
                      one-time exchange address. All transactions are subject to AML/CTF monitoring and may be
                      reported to AUSTRAC.
                    </span>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Live Rates Panel */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Crypto Rates vs AUD</CardTitle>
              <p className="text-xs text-gray-500">Click a pair to load into the BUY form</p>
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
                        onClick={() => {
                          if (mode === "buy") {
                            setFromCurrency(base);
                            setToCurrency(target);
                          }
                        }}
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
          Digital currency exchange services provided by AMAX Financial Pty Ltd (ABN 54 690 827 608), registered as a
          Digital Currency Exchange (DCE) with AUSTRAC. AMAX does not hold, control, or custody digital assets at any
          point and does not maintain crypto accounts on behalf of users. Purchased digital assets are delivered to
          your nominated external wallet address upon exchange execution. Transactions are subject to AML/CTF monitoring
          under the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) and FATF Travel Rule
          obligations. Digital assets are not legal tender, not backed by government guarantee, and subject to
          significant price risk. Past performance is not indicative of future results.
        </p>
      </div>

      {/* Confirm Modal (BUY only) */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Confirm Exchange
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-xs px-3 py-1.5 rounded-full font-medium w-fit bg-amber-100 text-amber-800">
              Buy — Fiat → Digital Asset
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">You pay</span>
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
              <div className="flex justify-between border-t pt-3 text-base">
                <span className="font-semibold text-gray-900">You receive</span>
                <span className="font-bold text-gray-900">
                  {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {toCurrency}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600 text-xs">Delivery address</span>
                <span className="text-xs font-mono text-blue-700 break-all text-right max-w-[220px]">
                  {destinationWallet}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                I confirm the delivery wallet address is correct. Deliveries to incorrect addresses cannot be recovered.
                AMAX will arrange this exchange under its AUSTRAC DCE registration. AMAX does not custody digital assets.
              </span>
            </div>
            <p className="text-xs text-gray-500 text-center">
              By confirming, you authorise AMAX Financial Pty Ltd (ABN 54 690 827 608) to exchange the above fiat
              amount for digital assets and deliver them to your specified wallet address under its AUSTRAC DCE
              registration. AMAX does not custody or store digital assets. This transaction is subject to AML/CTF
              monitoring and may be reported to AUSTRAC.
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
                    <p className="text-xs text-gray-600">DCE Compliance Team</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAdvisor(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-700 mb-3">Questions about digital asset exchange or compliance? Our team can assist.</p>
              <div className="flex items-center space-x-2 text-amber-600 mb-3">
                <Phone className="w-3 h-3" />
                <span className="font-medium text-xs">+61 2 1234 5678</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.open("tel:+61212345678", "_self")} className="flex-1 text-xs h-8">
                  <Phone className="w-3 h-3 mr-1" /> Call
                </Button>
                <Button size="sm" onClick={() => window.open("mailto:info@amaxglobal.com.au", "_self")} className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs h-8">
                  <Mail className="w-3 h-3 mr-1" /> Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
