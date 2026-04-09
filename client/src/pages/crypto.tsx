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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFxRates, useFxRate } from "@/hooks/use-fx-rates";
import { useWallets } from "@/hooks/use-portfolio";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, Shield, RefreshCw,
  AlertTriangle, Info, Phone, X,
  ArrowDown, Send, Mail, Building2,
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
  const [fromCurrency,      setFromCurrency]      = useState("AUD");
  const [toCurrency,        setToCurrency]        = useState("BTC");
  const [amount,            setAmount]            = useState("500");
  const [destinationWallet, setDestinationWallet] = useState("");
  // Travel Rule — BUY side (AMAX is originator VASP, must collect destination wallet info)
  const [destWalletType,    setDestWalletType]    = useState<"" | "custodial" | "self_hosted">("");
  const [destCustodianName, setDestCustodianName] = useState("");
  const [complianceAgreed,  setComplianceAgreed]  = useState(false);
  const [showConfirm,       setShowConfirm]       = useState(false);

  // SELL enquiry state
  const [sellCurrency,            setSellCurrency]            = useState("BTC");
  const [sellAmount,              setSellAmount]              = useState("");
  // Travel Rule — SELL side (AMAX is beneficiary VASP, must collect originator wallet info)
  const [originatorWallet,        setOriginatorWallet]        = useState("");
  const [originatorWalletType,    setOriginatorWalletType]    = useState<"" | "custodial" | "self_hosted">("");
  const [originatorCustodianName, setOriginatorCustodianName] = useState("");

  const [showAdvisor, setShowAdvisor] = useState(true);

  const { toast }       = useToast();
  const queryClient     = useQueryClient();
  const { data: wallets = [] }                     = useWallets();
  const { data: fxRates, isLoading: ratesLoading } = useFxRates();
  const { data: fxRate,  isLoading: rateLoading }  = useFxRate(fromCurrency, toCurrency);

  const exchangeMutation = useMutation({
    mutationFn: async (data: {
      fromCurrency: string; toCurrency: string; amount: number;
      destinationWallet: string; walletType?: string; custodianName?: string;
    }) => {
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
        description: `${amount} ${fromCurrency} → ${data.convertedAmount?.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${toCurrency} — Independent Reserve will process and deliver to your wallet within 1 business day.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setDestinationWallet("");
      setDestWalletType("");
      setDestCustodianName("");
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
      toast({ title: "Wallet Address Required", description: "You must provide a destination wallet address. AMAX delivers crypto directly to your external wallet.", variant: "destructive" });
      return;
    }
    if (!isValidWalletAddress(destinationWallet, toCurrency)) {
      toast({ title: "Invalid Wallet Address", description: `The address entered does not appear to be a valid ${toCurrency} wallet address. Please check and try again.`, variant: "destructive" });
      return;
    }
    // Travel Rule: wallet type is mandatory from 1 July 2026 (AML/CTF Amendment Act 2024)
    if (!destWalletType) {
      toast({ title: "Wallet Type Required", description: "Please indicate whether the destination wallet is self-hosted or custodial. This is required under Australia's Travel Rule obligations.", variant: "destructive" });
      return;
    }
    if (destWalletType === "custodial" && !destCustodianName.trim()) {
      toast({ title: "Custodian Name Required", description: "Please enter the name of the exchange or institution that holds the destination wallet.", variant: "destructive" });
      return;
    }
    if (rateIsStale) {
      const rateAge = (fxRate as any)?.rateAgeMinutes ?? 0;
      toast({ title: "Rate Expired — Please Wait", description: `Rate is ${rateAge} minute${rateAge !== 1 ? "s" : ""} old. Rates must be within 5 minutes. A fresh rate will load automatically.`, variant: "destructive" });
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
    exchangeMutation.mutate({
      fromCurrency, toCurrency, amount: parseFloat(amount),
      destinationWallet,
      walletType: destWalletType,
      custodianName: destWalletType === "custodial" ? destCustodianName : undefined,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crypto Exchange</h1>
          <p className="text-gray-500 text-sm mt-1">DCE-registered fiat ↔ digital asset exchange via Independent Reserve</p>
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

      {/* DCE + Custody Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 space-y-1">
          <p>
            <span className="font-semibold">AUSTRAC DCE Registration — Exchange &amp; Delivery Only:</span>{" "}
            AMAX Financial Pty Ltd (ABN 54 690 827 608) is registered as a Digital Currency Exchange (DCE) with AUSTRAC.
            AMAX does not hold, store, or custody digital assets on your behalf and does not maintain crypto accounts
            for users.
          </p>
          <p className="text-xs text-amber-700">
            <span className="font-medium">Settlement custodian:</span>{" "}
            Exchange and delivery is executed via Independent Reserve Pty Ltd (ABN 46 164 681 443,
            AUSTRAC DCE-100461150-001), Australia's longest-running institutional exchange.
            Independent Reserve maintains 1:1 asset segregation with no rehypothecation.
            All transactions are subject to AML/CTF monitoring and FATF Travel Rule obligations.
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
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Live Spot Rate — Independent Reserve</p>
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

                {/* ─────────── BUY TAB ─────────── */}
                <TabsContent value="buy" className="space-y-5 mt-0">

                  {/* DCE Delivery Notice */}
                  <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Exchange &amp; Deliver Only:</strong> AMAX routes your exchange through
                      Independent Reserve and delivers digital assets to your nominated external wallet.
                      AMAX never holds crypto — no AMAX crypto account is maintained on your behalf.
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
                      <ArrowDown className="w-3 h-3" /> Exchange via Independent Reserve
                    </div>
                    <div className="flex-1 border-t border-dashed border-gray-200" />
                  </div>

                  {/* TO — Crypto selector */}
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
                      <Send className="w-3 h-3" /> Delivered by Independent Reserve to your external wallet — enter address below
                    </p>
                  </div>

                  {/* ─── Destination Wallet Address ─── */}
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
                      Independent Reserve will deliver {toCurrency} to this address on behalf of AMAX.
                      Neither AMAX nor Independent Reserve can reverse deliveries to incorrect addresses.
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

                  {/* ─── Travel Rule — Wallet Type Declaration ─── */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <div className="flex items-start gap-2">
                      <Shield className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-blue-800">
                          FATF Travel Rule — Destination Wallet Declaration <span className="text-red-500">*</span>
                        </p>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Required under the <em>AML/CTF Amendment Act 2024</em> (Cth), effective 1 July 2026.
                          As originator VASP, AMAX must collect and transmit this information to Independent Reserve.
                        </p>
                      </div>
                    </div>
                    <RadioGroup
                      value={destWalletType}
                      onValueChange={(v) => { setDestWalletType(v as "custodial" | "self_hosted"); setDestCustodianName(""); }}
                      className="space-y-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <RadioGroupItem value="self_hosted" id="wt-self" className="mt-0.5" />
                        <label htmlFor="wt-self" className="text-xs text-blue-900 cursor-pointer leading-relaxed">
                          <span className="font-medium">Self-hosted wallet</span> — I personally control the private key
                          for this wallet (e.g. Ledger, Trezor, MetaMask, Trust Wallet)
                        </label>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <RadioGroupItem value="custodial" id="wt-custodial" className="mt-0.5" />
                        <label htmlFor="wt-custodial" className="text-xs text-blue-900 cursor-pointer leading-relaxed">
                          <span className="font-medium">Custodial wallet</span> — This wallet is held at an
                          exchange or financial institution (e.g. Coinbase, Binance, Kraken)
                        </label>
                      </div>
                    </RadioGroup>
                    {destWalletType === "custodial" && (
                      <div className="space-y-1">
                        <Label htmlFor="dest-custodian" className="text-xs text-blue-800 font-medium">
                          Exchange / Institution Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dest-custodian"
                          value={destCustodianName}
                          onChange={e => setDestCustodianName(e.target.value)}
                          placeholder="e.g. Coinbase, Binance, Kraken, Independent Reserve"
                          className="text-sm h-9"
                        />
                      </div>
                    )}
                  </div>

                  {/* ─── Breakdown ─── */}
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
                      <span>Delivered to</span>
                      <span className="font-medium text-blue-700 truncate max-w-[200px] text-right">
                        {destinationWallet
                          ? `${destinationWallet.slice(0, 8)}…${destinationWallet.slice(-6)}`
                          : <span className="text-gray-400 italic">Wallet address required</span>}
                      </span>
                    </div>
                    {destWalletType && (
                      <div className="flex justify-between text-gray-600">
                        <span>Wallet type</span>
                        <span className="font-medium text-blue-700">
                          {destWalletType === "self_hosted"
                            ? "Self-hosted"
                            : `Custodial${destCustodianName ? ` — ${destCustodianName}` : ""}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t text-base">
                      <span>You receive</span>
                      <span>{convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {toCurrency}</span>
                    </div>
                  </div>

                  {/* AML disclosure */}
                  <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      This exchange is arranged by AMAX Financial Pty Ltd (ABN 54 690 827 608) under its AUSTRAC DCE
                      registration and executed via Independent Reserve Pty Ltd (DCE-100461150-001). AMAX does not hold,
                      store, or custody digital assets. Purchased {toCurrency} is delivered by Independent Reserve to
                      your specified external wallet address. AMAX does not maintain crypto accounts on your behalf.
                      Digital assets are not legal tender, are subject to significant price volatility, and exchanges
                      are irreversible once confirmed.
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
                      I confirm the wallet type declaration above is accurate.
                      I acknowledge this exchange is subject to KYC, AML/CTF monitoring, and AUSTRAC recordkeeping
                      obligations including the FATF Travel Rule.
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

                {/* ─────────── SELL TAB ─────────── */}
                <TabsContent value="sell" className="space-y-5 mt-0">

                  {/* How SELL works with IR */}
                  <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>SELL / CONVERT to AUD — Independent Reserve Custody Chain:</strong>{" "}
                      To sell digital assets, AMAX instructs Independent Reserve Pty Ltd (DCE-100461150-001)
                      to provide you with a one-time exchange deposit address. You send crypto directly to
                      Independent Reserve's address — <strong>AMAX never receives your crypto</strong>.
                      Independent Reserve executes the exchange and remits AUD proceeds to AMAX, which credits
                      your AMAX AUD wallet. Proceeds are credited within 1 business day of confirmed receipt.
                    </span>
                  </div>

                  {/* Sell enquiry form */}
                  <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Sell Enquiry — Step 1 of 4</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Provide details below. Our team will confirm rates and issue a written confirmation
                        with Independent Reserve's one-time deposit address before you send any crypto.
                        Do not send crypto without first receiving written confirmation.
                      </p>
                    </div>

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

                    {/* Travel Rule — originator wallet info (AMAX is beneficiary VASP) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="orig-wallet" className="text-xs font-medium">
                        Sending Wallet Address <span className="text-red-500">*</span>{" "}
                        <span className="text-gray-400 font-normal">(Travel Rule)</span>
                      </Label>
                      <Input
                        id="orig-wallet"
                        value={originatorWallet}
                        onChange={e => setOriginatorWallet(e.target.value)}
                        placeholder={sellCurrency === "BTC" ? "bc1q… or 1A1z…" : "0x742d35Cc6634C0532925..."}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        The wallet address you will be sending {sellCurrency} from. Required under the FATF Travel Rule —
                        Independent Reserve must verify originator information on inbound transfers.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                      <p className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Travel Rule — Sending Wallet Type <span className="text-red-500">*</span>
                      </p>
                      <RadioGroup
                        value={originatorWalletType}
                        onValueChange={(v) => { setOriginatorWalletType(v as "custodial" | "self_hosted"); setOriginatorCustodianName(""); }}
                        className="space-y-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <RadioGroupItem value="self_hosted" id="ot-self" className="mt-0.5" />
                          <label htmlFor="ot-self" className="text-xs text-blue-900 cursor-pointer">
                            <span className="font-medium">Self-hosted</span> — I control the private key
                          </label>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <RadioGroupItem value="custodial" id="ot-custodial" className="mt-0.5" />
                          <label htmlFor="ot-custodial" className="text-xs text-blue-900 cursor-pointer">
                            <span className="font-medium">Custodial</span> — held at an exchange/institution
                          </label>
                        </div>
                      </RadioGroup>
                      {originatorWalletType === "custodial" && (
                        <Input
                          value={originatorCustodianName}
                          onChange={e => setOriginatorCustodianName(e.target.value)}
                          placeholder="Exchange or institution name (e.g. Coinbase, Binance)"
                          className="text-sm h-9 mt-1"
                        />
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        const walletTypeStr = originatorWalletType === "self_hosted"
                          ? "Self-hosted wallet (I control the private key)"
                          : originatorWalletType === "custodial"
                          ? `Custodial wallet at: ${originatorCustodianName || "TBD"}`
                          : "TBD";
                        const subject = encodeURIComponent(`AMAX Crypto SELL Enquiry — ${sellAmount || "?"} ${sellCurrency}`);
                        const body = encodeURIComponent(
                          `Hello AMAX Compliance Team,\n\nI would like to sell the following digital assets via Independent Reserve:\n\nAsset: ${sellCurrency}\nAmount: ${sellAmount || "TBD"}\nSending wallet address: ${originatorWallet || "TBD"}\nSending wallet type: ${walletTypeStr}\n\nPlease confirm rates and provide Independent Reserve's one-time deposit address in writing before I send any crypto.\n\nThank you.`
                        );
                        window.open(`mailto:info@amaxglobal.com.au?subject=${subject}&body=${body}`, "_self");
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Sell Enquiry to Compliance
                    </Button>
                    <p className="text-xs text-gray-500 text-center">Or call: +61 2 1234 5678</p>
                  </div>

                  {/* Process steps — corrected for IR custody chain */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 text-sm">
                    <p className="font-medium text-gray-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-600" /> How the SELL process works:
                    </p>
                    <ol className="space-y-2.5 text-xs text-gray-600 list-none">
                      <li className="flex items-start gap-2">
                        <span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                        <span>Submit enquiry above with asset, amount, sending wallet address, and wallet type.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                        <span>AMAX compliance team verifies your KYC, confirms the rate, and instructs Independent Reserve to issue a one-time exchange deposit address for your transaction.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                        <span>You receive written confirmation with Independent Reserve's deposit address. Only then should you send your {sellCurrency || "crypto"} — directly to Independent Reserve, not to AMAX.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                        <span>Independent Reserve confirms receipt, executes the exchange, and remits AUD proceeds to AMAX. Your AMAX AUD wallet is credited within 1 business day.</span>
                      </li>
                    </ol>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Do not send crypto to any address without first receiving <strong>written confirmation</strong> from
                      AMAX specifying Independent Reserve's one-time deposit address for your transaction.
                      AMAX does not maintain standing crypto wallets and does not directly receive your crypto.
                      Each sell transaction uses a unique one-time address issued by Independent Reserve.
                      All transactions are subject to AML/CTF monitoring and FATF Travel Rule obligations
                      and may be reported to AUSTRAC.
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
                        onClick={() => { if (mode === "buy") { setFromCurrency(base); setToCurrency(target); } }}
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
          Digital Currency Exchange (DCE) with AUSTRAC. Exchange and delivery is executed via Independent Reserve Pty Ltd
          (ABN 46 164 681 443, AUSTRAC DCE-100461150-001, ISO 27001 certified), an Australian-domiciled institutional
          exchange with 1:1 asset segregation and no rehypothecation. AMAX does not hold, control, or custody digital
          assets at any point and does not maintain crypto accounts on behalf of users. Purchased digital assets are
          delivered by Independent Reserve to your nominated external wallet address. All transactions are subject to
          AML/CTF monitoring under the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth)
          and FATF Travel Rule obligations (effective 1 July 2026). Digital assets are not legal tender, not backed
          by government guarantee, and subject to significant price risk. Past performance is not indicative of
          future results.
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
              Buy — Fiat → Digital Asset via Independent Reserve
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
                <span className="text-xs font-mono text-blue-700 break-all text-right max-w-[200px]">
                  {destinationWallet}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-xs">Wallet type</span>
                <span className="text-xs text-blue-700">
                  {destWalletType === "self_hosted"
                    ? "Self-hosted"
                    : `Custodial — ${destCustodianName}`}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Delivery to incorrect addresses cannot be reversed. By confirming, you authorise AMAX Financial
                Pty Ltd (ABN 54 690 827 608) to route this exchange through Independent Reserve Pty Ltd
                (DCE-100461150-001) and deliver {toCurrency} to the specified wallet. AMAX does not custody
                digital assets. This transaction is subject to AML/CTF monitoring and Travel Rule reporting
                obligations and may be disclosed to AUSTRAC.
              </span>
            </div>
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
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Crypto Support</h3>
                    <p className="text-xs text-gray-600">AMAX Compliance Team</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAdvisor(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-gray-700 mb-3">Questions about crypto exchange or sell enquiries? Our team can help.</p>
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
