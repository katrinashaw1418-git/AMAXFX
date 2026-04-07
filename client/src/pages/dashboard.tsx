import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useFxRate, useFxRates } from "@/hooks/use-fx-rates";
import {
  ArrowRightLeft, Wallet, Shield, Phone,
  MessageSquare, X, RefreshCw, Bitcoin, TrendingUp,
} from "lucide-react";
import YtdRateChart from "@/components/fx/ytd-rate-chart";
import RateSparkline from "@/components/fx/rate-sparkline";
import CurrencyBalances from "@/components/dashboard/currency-balances";
import TransactionHistory from "@/components/dashboard/transaction-history";

const RATE_PAIRS = [
  { base: "AUD", target: "USD" },
  { base: "AUD", target: "EUR" },
  { base: "AUD", target: "GBP" },
  { base: "AUD", target: "JPY" },
  { base: "AUD", target: "CNY" },
  { base: "AUD", target: "BTC" },
  { base: "AUD", target: "ETH" },
];

const ALL_META: Record<string, { flag: string; name: string }> = {
  AUD:  { flag: "🇦🇺", name: "Australian Dollar" },
  USD:  { flag: "🇺🇸", name: "US Dollar"          },
  EUR:  { flag: "🇪🇺", name: "Euro"               },
  GBP:  { flag: "🇬🇧", name: "British Pound"      },
  JPY:  { flag: "🇯🇵", name: "Japanese Yen"       },
  CNY:  { flag: "🇨🇳", name: "Chinese Yuan"       },
  BTC:  { flag: "₿",   name: "Bitcoin"            },
  ETH:  { flag: "Ξ",   name: "Ethereum"           },
};

export default function Dashboard() {
  const [showAdvisorBox, setShowAdvisorBox] = useState(true);
  const [chartFrom, setChartFrom] = useState("AUD");
  const [chartTo,   setChartTo]   = useState("USD");

  const { data: fxRate,  isLoading: rateLoading  } = useFxRate("AUD", "USD");
  const { data: fxRates, isLoading: ratesLoading } = useFxRates();
  const audUsdRate = fxRate ? parseFloat((fxRate as any).rate) : 0;

  const { data: chartRate, isLoading: chartLoading } = useFxRate(chartFrom, chartTo);
  const chartRateValue = chartRate ? parseFloat((chartRate as any).rate) : 1;

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Account overview and portfolio summary</p>
        </div>
        {!rateLoading && audUsdRate > 0 && (
          <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
            <span className="text-slate-400">AUD/USD</span>
            <span className="font-bold">{audUsdRate.toFixed(4)}</span>
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

      {/* ── 4 CTA Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/wallets">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-100 hover:border-blue-300 h-full">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">eWallet</p>
                <p className="text-xs text-gray-500">Balances & deposits</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/fx-exchange">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-purple-100 hover:border-purple-300 h-full">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">FX Exchange</p>
                <p className="text-xs text-gray-500">Fiat conversions</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/crypto">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-100 hover:border-amber-300 h-full">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bitcoin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Crypto</p>
                <p className="text-xs text-gray-500">Digital assets (DCE)</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/compliance">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-emerald-100 hover:border-emerald-300 h-full">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Compliance</p>
                <p className="text-xs text-gray-500">KYC & documents</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Currency Balances + YTD Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CurrencyBalances />
        </div>
        <div className="lg:col-span-2">
          <YtdRateChart
            fromCurrency={chartFrom}
            toCurrency={chartTo}
            currentRate={chartRateValue}
            isLoading={chartLoading}
          />
        </div>
      </div>

      {/* ── Live Rate Overview ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Live Rate Overview</CardTitle>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="w-3.5 h-3.5" />
              Click a pair to view its chart
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {ratesLoading ? (
              <p className="text-sm text-gray-400 col-span-7 py-4 text-center">Loading rates…</p>
            ) : (
              RATE_PAIRS.map(({ base, target }) => {
                const rate      = fxRates?.find((r: any) => r.baseCurrency === base && r.targetCurrency === target);
                const rateValue = rate ? parseFloat(rate.rate) : null;
                const isSelected = chartFrom === base && chartTo === target;
                const meta      = ALL_META[target] ?? { flag: target, name: target };
                const isCrypto  = target === "BTC" || target === "ETH";

                return (
                  <div
                    key={`${base}-${target}`}
                    onClick={() => { setChartFrom(base); setChartTo(target); }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                      isSelected ? "bg-amber-50 border-amber-300" : "bg-gray-50 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-0.5">{meta.flag} {base}/{target}</p>
                    {rateValue !== null ? (
                      <>
                        <p className="font-bold text-sm text-gray-900">
                          {isCrypto
                            ? rateValue.toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : rateValue.toFixed(4)}
                        </p>
                        <div className="mt-1">
                          <RateSparkline fromCurrency={base} toCurrency={target} currentRate={rateValue} />
                        </div>
                        <p className={`text-xs mt-0.5 ${rate?.isStale ? "text-amber-600" : "text-green-600"}`}>
                          {rate?.isStale ? `⚠ ${rate.rateAgeMinutes}m` : rate?.rateAgeMinutes != null ? `${rate.rateAgeMinutes}m` : "Live"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-300">—</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
