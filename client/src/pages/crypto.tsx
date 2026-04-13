import { useState, useEffect } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const [sellEmail,               setSellEmail]               = useState("");
  // Travel Rule — SELL side (AMAX is beneficiary VASP, must collect originator wallet info)
  const [originatorWallet,        setOriginatorWallet]        = useState("");
  const [originatorWalletType,    setOriginatorWalletType]    = useState<"" | "custodial" | "self_hosted">("");
  const [originatorCustodianName, setOriginatorCustodianName] = useState("");
  // Travel Rule — beneficiary/originator legal names + physical addresses (FATF R.16 mandatory elements)
  const [beneficiaryName,    setBeneficiaryName]    = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [originatorName,     setOriginatorName]     = useState("");
  const [originatorAddress,  setOriginatorAddress]  = useState("");

  // SELL acknowledgements — 5 discrete checkboxes
  const [sellAck, setSellAck] = useState({
    wallet: false, walletType: false, notConfirmed: false, amlCtf: false, irreversible: false,
  });
  const [showDisclosure, setShowDisclosure] = useState(false);

  const [showAdvisor, setShowAdvisor] = useState(true);

  const { toast }       = useToast();
  const queryClient     = useQueryClient();
  const { data: wallets = [] }                     = useWallets();
  const { data: fxRates, isLoading: ratesLoading } = useFxRates();
  const { data: fxRate,  isLoading: rateLoading }  = useFxRate(fromCurrency, toCurrency);
  // Sell-side: indicative rate for sellCurrency → AUD (e.g. BTC/AUD)
  const { data: sellFxRate, isLoading: sellRateLoading } = useFxRate(sellCurrency, "AUD");

  // Fetch KYC profile to auto-populate FATF R.16 beneficiary/originator name fields
  const { data: kycProfile } = useQuery<{ fullLegalName?: string }>({ queryKey: ["/api/kyc/profile"] });
  useEffect(() => {
    if (kycProfile?.fullLegalName) {
      setBeneficiaryName(prev => prev || kycProfile.fullLegalName!);
      setOriginatorName(prev => prev || kycProfile.fullLegalName!);
    }
  }, [kycProfile?.fullLegalName]);

  const exchangeMutation = useMutation({
    mutationFn: async (data: {
      fromCurrency: string; toCurrency: string; amount: number;
      destinationWallet: string; walletType?: string; custodianName?: string;
      beneficiaryFullName?: string;
    }) => {
      const res = await apiRequest("POST", "/api/fx-exchange", data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Exchange failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const isCryptoBuy = !["AUD","USD","EUR","GBP","SGD","HKD","JPY","NZD","CAD","CNY","KRW"].includes(toCurrency);
      toast({
        title: "Order Submitted",
        description: isCryptoBuy
          ? `Exchange instruction submitted. ${toCurrency} will be delivered by Independent Reserve to your nominated wallet once on-chain delivery is confirmed — typically within 1 business day.`
          : `Exchange instruction submitted. ${toCurrency} proceeds will be transferred to your nominated account by our external regulated partner once settlement is confirmed — typically within 1 business day.`,
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

  // ── Derived values — BUY side ───────────────────────────────────────────────
  const exchangeRate    = fxRate ? parseFloat((fxRate as any).rate) : 1;
  const spread          = fxRate ? parseFloat((fxRate as any).spread) : 0.005;
  const grossConverted  = parseFloat(amount || "0") * exchangeRate;
  const fee             = grossConverted * spread;
  const convertedAmount = grossConverted - fee;

  const fromWallet  = wallets.find((w: any) => w.currency === fromCurrency);
  const fromBalance = fromWallet ? parseFloat(fromWallet.balance) : 0;

  const rateIsStale = (fxRate as any)?.isStale || ((fxRate as any)?.rateAgeMinutes ?? 0) > 5;

  // ── Derived values — SELL side (crypto → AUD indicative) ────────────────────
  const sellRate        = sellFxRate ? parseFloat((sellFxRate as any).rate) : 0;
  const sellSpread      = sellFxRate ? parseFloat((sellFxRate as any).spread) : 0.005;
  const sellAmountNum   = parseFloat(sellAmount || "0");
  const sellGrossAud    = sellAmountNum * sellRate;
  const sellFee         = sellGrossAud * sellSpread;
  const sellNetAud      = sellGrossAud - sellFee;
  const sellRateIsStale = (sellFxRate as any)?.isStale || ((sellFxRate as any)?.rateAgeMinutes ?? 0) > 5;
  const sellAllAcksOk   = Object.values(sellAck).every(Boolean);

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
    if (!beneficiaryName.trim()) {
      toast({ title: "Beneficiary Name Required", description: "Please enter the full legal name of the person who will receive the digital assets. This is required under the FATF Travel Rule.", variant: "destructive" });
      return;
    }
    if (!beneficiaryAddress.trim()) {
      toast({ title: "Beneficiary Address Required", description: "Please enter the physical address of the beneficiary. FATF Recommendation 16 requires a physical address, date of birth, or unique identification number.", variant: "destructive" });
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
      beneficiaryFullName: beneficiaryName.trim() || undefined,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital Asset Exchange</h1>
          <p className="text-gray-500 text-sm mt-1">Fiat ↔ digital asset exchange facilitated via Independent Reserve (external regulated partner)</p>
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
            AMAX Global Pty Ltd (ABN 54 690 827 608) is registered as a Digital Currency Exchange (DCE) with AUSTRAC.
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
                      <Wallet className="w-3 h-3" /> Indicative available (external): {fromBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fromCurrency}
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
                      Independent Reserve delivers {toCurrency} directly to your nominated wallet as part
                      of the exchange arranged by AMAX. Deliveries to incorrect addresses cannot be
                      reversed by AMAX or Independent Reserve.
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
                    {/* FATF R.16 — Beneficiary full legal name (mandatory Travel Rule element) */}
                    <div className="space-y-1 pt-1 border-t border-blue-200">
                      <Label htmlFor="beneficiary-name" className="text-xs text-blue-800 font-medium">
                        Beneficiary Full Legal Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="beneficiary-name"
                        value={beneficiaryName}
                        onChange={e => setBeneficiaryName(e.target.value)}
                        placeholder="Full legal name of the person receiving the digital assets"
                        className="text-sm h-9"
                      />
                      <p className="text-xs text-blue-700">
                        Under FATF Recommendation 16, AMAX must record the beneficiary's full legal name alongside
                        the destination wallet address. If you are sending to your own wallet, enter your full legal
                        name as it appears on your government-issued ID.
                      </p>
                    </div>

                    {/* FATF R.16 — Beneficiary physical address (mandatory Travel Rule element) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="beneficiary-address" className="text-xs text-blue-800 font-medium">
                        Beneficiary Physical Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="beneficiary-address"
                        value={beneficiaryAddress}
                        onChange={e => setBeneficiaryAddress(e.target.value)}
                        placeholder="Street address, city, state/province, country"
                        className="text-sm h-9"
                      />
                      <p className="text-xs text-blue-700">
                        FATF Recommendation 16 requires either a physical address, date of birth, or unique
                        identification number for the beneficiary. Physical address is the preferred identifier
                        for international transfers. Enter the address of the person receiving the digital assets.
                      </p>
                    </div>
                  </div>

                  {/* ─── Breakdown ─── */}
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between font-medium text-gray-800 text-base pb-1 border-b">
                      <span>You pay</span>
                      <span>{parseFloat(amount || "0").toLocaleString()} {fromCurrency}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Spot Rate</span>
                      <div className="text-right">
                        <span className="font-medium block">{rateLoading ? "Loading…" : `1 ${fromCurrency} = ${exchangeRate.toFixed(8)} ${toCurrency}`}</span>
                        {!rateLoading && (
                          <span className={`flex items-center justify-end gap-0.5 text-xs mt-0.5 ${rateIsStale ? "text-amber-500" : "text-green-500"}`}>
                            <RefreshCw className="w-2.5 h-2.5" />
                            {rateIsStale ? "⚠ Rate stale — refresh before confirming" : `Rate updated ${formatRateAge((fxRate as any)?.rateAgeMinutes)}`}
                          </span>
                        )}
                      </div>
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
                      This exchange is arranged by AMAX Global Pty Ltd (ABN 54 690 827 608) under its AUSTRAC DCE
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
                      : "Review & Confirm Order"}
                  </Button>
                </TabsContent>

                {/* ─────────── SELL TAB ─────────── */}
                <TabsContent value="sell" className="space-y-5 mt-0">

                  {/* Amber custody notice strip */}
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      <strong>Digital assets are transferred directly to Independent Reserve (external regulated partner).</strong>{" "}
                      AMAX does not receive, hold, or control digital assets at any stage of the transaction.
                      AUD proceeds are remitted by Independent Reserve to your nominated account via our external regulated banking partner within 1 business day of on-chain confirmation.
                      Execution timing is determined by the external regulated partner and network confirmation conditions.
                    </span>
                  </div>

                  {/* ── Sell Enquiry Form ── */}
                  <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">

                    <div>
                      <p className="text-sm font-semibold text-gray-800">Sell Enquiry</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Complete all fields below. Our compliance team will confirm your rate and provide
                        Independent Reserve's one-time deposit address in writing before you send anything.{" "}
                        <strong>Do not send crypto until you receive written confirmation.</strong>
                      </p>
                    </div>

                    {/* Asset selector */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Digital Asset to Sell</Label>
                      <Select value={sellCurrency} onValueChange={(v) => { setSellCurrency(v); setOriginatorWallet(""); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIGITAL_ASSETS.map(c => (
                            <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} – {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Approximate Amount ({sellCurrency})</Label>
                      <Input
                        type="number"
                        value={sellAmount}
                        onChange={e => setSellAmount(e.target.value)}
                        placeholder="0.00000000"
                        className="font-mono"
                      />
                    </div>

                    {/* Indicative rate + live AUD estimate */}
                    <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Indicative Rate</span>
                        {sellRateLoading ? (
                          <span className="text-xs text-gray-400">Loading…</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              1 {sellCurrency} ≈ {sellRate > 0
                                ? `AUD ${sellRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                : "—"}
                            </span>
                            <span className={`flex items-center gap-0.5 text-xs ${sellRateIsStale ? "text-amber-500" : "text-green-500"}`}>
                              <RefreshCw className="w-2.5 h-2.5" />
                              {sellRateIsStale ? "⚠ Stale" : formatRateAge((sellFxRate as any)?.rateAgeMinutes)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 italic">
                        Indicative only — your confirmed rate is locked in writing before you send anything.
                        The rate shown is not binding until written confirmation is issued.
                      </p>
                      {/* Live AUD proceeds estimate */}
                      {sellAmountNum > 0 && sellRate > 0 && (
                        <div className="border-t pt-2 mt-1 space-y-1 text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>You send</span>
                            <span className="font-mono">{sellAmountNum.toLocaleString(undefined, { maximumFractionDigits: 8 })} {sellCurrency}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Rate</span>
                            <span>1 {sellCurrency} ≈ AUD {sellRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Processing fee (0.5%)</span>
                            <span>− AUD {sellFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-gray-800 border-t pt-1">
                            <span>Est. you receive</span>
                            <span>AUD {sellNetAud.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </div>
                          <p className="text-gray-400 italic">Final amount confirmed in writing. Not binding until written confirmation issued.</p>
                        </div>
                      )}
                    </div>

                    {/* SELL — $10K TTR Notice */}
                    {sellNetAud >= 10000 && (
                      <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-orange-50 border border-orange-200 text-orange-800">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>
                          The estimated AUD proceeds exceed AUD 10,000. Transactions of this value are subject to
                          mandatory reporting obligations under the{" "}
                          <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) §43.
                          AMAX is required to submit a Threshold Transaction Report (TTR) to AUSTRAC.
                        </span>
                      </div>
                    )}

                    {/* Sending wallet address (Travel Rule) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="orig-wallet" className="text-xs font-medium">
                        Sending Wallet Address <span className="text-red-500">*</span>{" "}
                        <span className="text-gray-400 font-normal">(FATF Travel Rule)</span>
                      </Label>
                      <Input
                        id="orig-wallet"
                        value={originatorWallet}
                        onChange={e => setOriginatorWallet(e.target.value)}
                        placeholder={sellCurrency === "BTC" ? "bc1q… or 1A1z…" : "0x742d35Cc6634C0532925..."}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        The wallet address you will send {sellCurrency} from. Required under the FATF Travel Rule
                        (AML/CTF Amendment Act 2024, effective 1 July 2026). AMAX must collect and transmit originator
                        wallet information to Independent Reserve before your transaction is processed.
                      </p>
                    </div>

                    {/* Sending wallet type (Travel Rule) */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                      <p className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Sending Wallet Type <span className="text-red-500">*</span>
                        <span className="font-normal text-blue-600 ml-1">(FATF Travel Rule)</span>
                      </p>
                      <RadioGroup
                        value={originatorWalletType}
                        onValueChange={(v) => { setOriginatorWalletType(v as "custodial" | "self_hosted"); setOriginatorCustodianName(""); }}
                        className="space-y-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <RadioGroupItem value="self_hosted" id="ot-self" className="mt-0.5" />
                          <label htmlFor="ot-self" className="text-xs text-blue-900 cursor-pointer leading-relaxed">
                            <span className="font-medium">Self-hosted</span> — I personally control the private key
                            <span className="text-blue-600"> (e.g. Ledger, Trezor, MetaMask, Trust Wallet)</span>
                          </label>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <RadioGroupItem value="custodial" id="ot-custodial" className="mt-0.5" />
                          <label htmlFor="ot-custodial" className="text-xs text-blue-900 cursor-pointer leading-relaxed">
                            <span className="font-medium">Custodial</span> — held at an exchange or financial institution
                            <span className="text-blue-600"> (e.g. Coinbase, Binance, Kraken, CoinSpot)</span>
                          </label>
                        </div>
                      </RadioGroup>
                      {originatorWalletType === "custodial" && (
                        <div className="space-y-1 pt-1">
                          <Label className="text-xs text-blue-800 font-medium">
                            Custodial Institution Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={originatorCustodianName}
                            onChange={e => setOriginatorCustodianName(e.target.value)}
                            placeholder="e.g. Coinbase, Binance, Kraken, CoinSpot"
                            className="text-sm h-9"
                          />
                          <p className="text-xs text-blue-700">
                            AMAX is required to transmit the institution name to Independent Reserve as part of Travel
                            Rule compliance. Providing inaccurate information may delay or prevent your transaction.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* FATF R.16 — Originator full legal name (mandatory Travel Rule element) */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                      <Label htmlFor="originator-name" className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Originator Full Legal Name <span className="text-red-500">*</span>
                        <span className="font-normal text-blue-600 ml-1">(FATF Travel Rule)</span>
                      </Label>
                      <Input
                        id="originator-name"
                        value={originatorName}
                        onChange={e => setOriginatorName(e.target.value)}
                        placeholder="Your full legal name as it appears on your government-issued ID"
                        className="text-sm h-9"
                      />
                      <p className="text-xs text-blue-700">
                        Under FATF Recommendation 16, AMAX must record the originator's full legal name alongside
                        the sending wallet address before transmitting Travel Rule data to Independent Reserve.
                      </p>
                    </div>

                    {/* FATF R.16 — Originator physical address (mandatory Travel Rule element) */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                      <Label htmlFor="originator-address" className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Originator Physical Address <span className="text-red-500">*</span>
                        <span className="font-normal text-blue-600 ml-1">(FATF Travel Rule)</span>
                      </Label>
                      <Input
                        id="originator-address"
                        value={originatorAddress}
                        onChange={e => setOriginatorAddress(e.target.value)}
                        placeholder="Street address, city, state/province, country"
                        className="text-sm h-9"
                      />
                      <p className="text-xs text-blue-700">
                        FATF Recommendation 16 requires a physical address, date of birth, or unique identification
                        number to accompany the originator's name. Physical address is the preferred identifier for
                        cross-border transfers. This information will be transmitted to Independent Reserve.
                      </p>
                    </div>

                    {/* Email field for written confirmation */}
                    <div className="space-y-1.5">
                      <Label htmlFor="sell-email" className="text-xs font-medium">
                        Your Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="sell-email"
                        type="email"
                        value={sellEmail}
                        onChange={e => setSellEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Written confirmation with Independent Reserve's one-time deposit address will be
                        sent here. Do not send crypto until you have received this confirmation.
                      </p>
                    </div>

                    {/* 5 discrete acknowledgement checkboxes */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700">Acknowledgements <span className="text-red-500">*</span> (all required)</p>
                      {([
                        { key: "wallet",       text: `I confirm the sending wallet address above is the wallet I will use to send ${sellCurrency}. I understand providing an incorrect address may cause my transaction to be rejected or flagged.` },
                        { key: "walletType",   text: "I confirm my wallet type declaration is accurate. I understand this information is transmitted to Independent Reserve under FATF Travel Rule obligations." },
                        { key: "notConfirmed", text: "I understand this enquiry is not a confirmed exchange. My rate and deposit address will be provided in a separate written confirmation before I send any crypto." },
                        { key: "amlCtf",       text: "I acknowledge this exchange is subject to KYC, AML/CTF monitoring, and AUSTRAC recordkeeping obligations. High-value or suspicious transactions may be reported to AUSTRAC." },
                        { key: "irreversible", text: "I understand that once I send crypto to the confirmed deposit address, the transaction is irreversible." },
                      ] as { key: keyof typeof sellAck; text: string }[]).map(({ key, text }) => (
                        <div key={key} className="flex items-start gap-2.5 p-2.5 bg-white border border-gray-200 rounded-lg">
                          <Checkbox
                            id={`sell-ack-${key}`}
                            checked={sellAck[key]}
                            onCheckedChange={(v) => setSellAck(prev => ({ ...prev, [key]: v === true }))}
                            className="mt-0.5 shrink-0"
                          />
                          <label htmlFor={`sell-ack-${key}`} className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                            {text}
                          </label>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full"
                      disabled={!sellAllAcksOk}
                      title={!sellAllAcksOk ? "Please confirm all acknowledgements above" : undefined}
                      onClick={() => {
                        if (!sellAmount || parseFloat(sellAmount) <= 0) {
                          toast({ title: "Amount Required", description: "Please enter the amount of crypto you wish to sell.", variant: "destructive" });
                          return;
                        }
                        if (!originatorWallet.trim()) {
                          toast({ title: "Sending Wallet Address Required", description: "Your sending wallet address is required under the FATF Travel Rule. Please enter it above.", variant: "destructive" });
                          return;
                        }
                        if (!originatorWalletType) {
                          toast({ title: "Wallet Type Required", description: "Please declare whether your sending wallet is self-hosted or custodial (FATF Travel Rule).", variant: "destructive" });
                          return;
                        }
                        if (originatorWalletType === "custodial" && !originatorCustodianName.trim()) {
                          toast({ title: "Institution Name Required", description: "Please enter the name of the exchange or institution holding your sending wallet.", variant: "destructive" });
                          return;
                        }
                        if (!originatorName.trim()) {
                          toast({ title: "Originator Name Required", description: "Your full legal name is required under the FATF Travel Rule. Please enter it above.", variant: "destructive" });
                          return;
                        }
                        if (!originatorAddress.trim()) {
                          toast({ title: "Originator Address Required", description: "Your physical address is required under FATF Recommendation 16. Please enter it above.", variant: "destructive" });
                          return;
                        }
                        if (!sellEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sellEmail)) {
                          toast({ title: "Valid Email Required", description: "A valid email address is required so we can send your written rate confirmation and deposit address.", variant: "destructive" });
                          return;
                        }
                        const walletTypeStr = originatorWalletType === "self_hosted"
                          ? "Self-hosted wallet (I personally control the private key)"
                          : `Custodial wallet at: ${originatorCustodianName}`;
                        const estProceeds = sellNetAud > 0
                          ? `AUD ${sellNetAud.toLocaleString(undefined, { maximumFractionDigits: 2 })} (indicative — not binding)`
                          : "TBD";
                        const subject = encodeURIComponent(`AMAX Crypto SELL Enquiry — ${sellAmount} ${sellCurrency}`);
                        const body = encodeURIComponent(
                          `Hello AMAX Compliance Team,\n\nI would like to sell the following digital assets via Independent Reserve:\n\nAsset: ${sellCurrency}\nAmount: ${sellAmount}\nIndicative AUD proceeds: ${estProceeds}\n\nFATF Travel Rule Information (FATF R.16):\nOriginator full legal name: ${originatorName.trim()}\nOriginator physical address: ${originatorAddress.trim()}\nSending wallet address: ${originatorWallet}\nSending wallet type: ${walletTypeStr}\n\nPlease confirm the rate, verify my KYC, and instruct Independent Reserve to provide a one-time deposit address for my transaction.\n\nI understand this is an enquiry only. I will not send any crypto until I receive written confirmation from AMAX with Independent Reserve's deposit address.\n\nReply to: ${sellEmail}\n\nThank you.`
                        );
                        window.open(`mailto:info@amaxglobal.com.au?subject=${subject}&body=${body}`, "_self");
                      }}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Submit Sell Enquiry →
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Or call our compliance team: <strong>02 8320 1908</strong>
                    </p>
                  </div>

                  {/* Process steps */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-amber-600" /> How the SELL process works
                    </p>
                    <div className="space-y-3 text-xs text-gray-600">
                      {[
                        {
                          step: "Step 1 — Submit this enquiry",
                          detail: `Provide the asset, amount, sending wallet address, and wallet type. We verify your KYC status before proceeding.`,
                        },
                        {
                          step: "Step 2 — Rate confirmation and deposit address",
                          detail: "Our compliance team confirms your KYC, locks your rate, and instructs Independent Reserve to generate a one-time deposit address for your transaction. You receive written confirmation by email — typically within 2 business hours.",
                        },
                        {
                          step: `Step 3 — Send your ${sellCurrency} to Independent Reserve`,
                          detail: `Only after receiving written confirmation should you send ${sellCurrency} — directly to Independent Reserve's one-time deposit address. Do not send to any other address. AMAX does not maintain crypto wallets and will never ask you to send crypto to an AMAX address.`,
                        },
                        {
                          step: "Step 4 — AUD credited to your account",
                          detail: `Independent Reserve confirms receipt on-chain${sellCurrency === "BTC" ? " (typically 3+ BTC confirmations)" : ""}, executes the exchange at your confirmed rate, and remits AUD proceeds to our regulated banking partner. Your account is credited within 1 business day of on-chain confirmation.`,
                        },
                      ].map(({ step, detail }) => (
                        <div key={step} className="flex gap-3">
                          <div className="w-1 bg-amber-400 rounded-full flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-gray-700">{step}</p>
                            <p className="mt-0.5 leading-relaxed">{detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Collapsible full disclosure */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-3 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors text-left"
                      onClick={() => setShowDisclosure(v => !v)}
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-gray-400" />
                        View full compliance disclosure
                      </span>
                      <span className="text-gray-400">{showDisclosure ? "▲" : "▾"}</span>
                    </button>
                    {showDisclosure && (
                      <div className="p-4 text-xs text-gray-600 space-y-3 leading-relaxed border-t bg-white">
                        <p>
                          This sell transaction is arranged by AMAX Global Pty Ltd (ABN 54 690 827 608), registered as a
                          Digital Currency Exchange (DCE) with AUSTRAC. The exchange is executed by Independent Reserve
                          Pty Ltd (AUSTRAC DCE-100461150-001), which acts as the independent exchange and settlement
                          counterparty.
                        </p>
                        <p>
                          AMAX does not hold, receive, control, or custody your digital assets at any point in this
                          process. Your crypto is sent directly to Independent Reserve. AUD proceeds are remitted by
                          Independent Reserve to our regulated banking partner and credited to your account. AMAX acts
                          as program manager only — funds are held by the regulated partner, not by AMAX Global Pty Ltd.
                        </p>
                        <p>
                          This transaction is subject to AML/CTF monitoring under the{" "}
                          <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) and the FATF
                          Travel Rule as implemented through the <em>AML/CTF Amendment Act 2024</em> (Cth), effective
                          1 July 2026. Originator wallet information collected above will be transmitted to Independent
                          Reserve as required. Threshold transactions of AUD 10,000 or more, and all suspicious
                          transactions regardless of value, may be reported to AUSTRAC. AMAX retains transaction
                          records for 7 years as required under AUSTRAC recordkeeping obligations.
                        </p>
                        <p>
                          Digital assets are not legal tender, are not backed by any government guarantee, and are
                          subject to significant price volatility. Exchanges are irreversible once executed. Past
                          performance is not indicative of future results.
                        </p>
                        <p>
                          Rates shown are indicative only. Your confirmed rate is provided in writing prior to
                          execution and is binding only from the time of written confirmation. AMAX reserves the
                          right to decline any transaction that does not pass KYC or AML/CTF screening.
                        </p>
                      </div>
                    )}
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
          All digital asset exchange transactions are facilitated through external regulated partners. AMAX acts as a
          non-custodial platform and does not hold client funds or digital assets. AMAX Global Pty Ltd (ABN 54 690 827 608)
          is registered as a Digital Currency Exchange (DCE) with AUSTRAC. Execution and delivery is performed by
          Independent Reserve Pty Ltd (ABN 46 164 681 443, AUSTRAC DCE-100461150-001, ISO 27001 certified), an
          Australian-domiciled institutional exchange with 1:1 asset segregation and no rehypothecation. Purchased
          digital assets are delivered by Independent Reserve directly to your nominated external wallet address. All
          transactions are subject to AML/CTF monitoring under the <em>Anti-Money Laundering and Counter-Terrorism
          Financing Act 2006</em> (Cth) and FATF Travel Rule obligations (effective 1 July 2026). Digital assets are
          not legal tender, not backed by government guarantee, and subject to significant price risk. Past performance
          is not indicative of future results.
        </p>
      </div>

      {/* Confirm Modal (BUY only) */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Confirm Order
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
                Delivery to incorrect addresses cannot be reversed. By confirming, you authorise AMAX Global
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
              {exchangeMutation.isPending ? "Processing…" : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advisor Box */}
      {showAdvisor && (
        <div className="fixed top-4 right-4 z-50 w-80">
          <Card className="backdrop-blur-sm bg-white/95 border-green-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
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
              <div className="flex items-center space-x-2 text-green-600 mb-3">
                <Phone className="w-3 h-3" />
                <span className="font-medium text-xs">+61 2 7257 9750</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.open("tel:+61272579750", "_self")} className="flex-1 text-xs h-8">
                  <Phone className="w-3 h-3 mr-1" /> Call
                </Button>
                <Button size="sm" onClick={() => window.open("mailto:info@amaxglobal.com.au", "_self")} className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8">
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
