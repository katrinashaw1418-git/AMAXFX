import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useFxRate } from "@/hooks/use-fx-rates";
import {
  ArrowRightLeft, Wallet, Shield, Phone,
  MessageSquare, X, RefreshCw, Bitcoin,
} from "lucide-react";
import YtdRateChart from "@/components/fx/ytd-rate-chart";
import CurrencyBalances from "@/components/dashboard/currency-balances";
import TransactionHistory from "@/components/dashboard/transaction-history";

const CHART_CURRENCIES = [
  { code: "AUD",  label: "🇦🇺 AUD – Australian Dollar" },
  { code: "USD",  label: "🇺🇸 USD – US Dollar"          },
  { code: "EUR",  label: "🇪🇺 EUR – Euro"               },
  { code: "GBP",  label: "🇬🇧 GBP – British Pound"      },
  { code: "JPY",  label: "🇯🇵 JPY – Japanese Yen"       },
  { code: "CNY",  label: "🇨🇳 CNY – Chinese Yuan"       },
  { code: "HKD",  label: "🇭🇰 HKD – Hong Kong Dollar"   },
  { code: "SGD",  label: "🇸🇬 SGD – Singapore Dollar"   },
  { code: "CAD",  label: "🇨🇦 CAD – Canadian Dollar"    },
  { code: "KRW",  label: "🇰🇷 KRW – South Korean Won"   },
  { code: "BTC",  label: "₿  BTC – Bitcoin"             },
  { code: "ETH",  label: "Ξ  ETH – Ethereum"            },
  { code: "USDT", label: "💵 USDT – Tether"             },
  { code: "USDC", label: "🪙 USDC – USD Coin"           },
];

export default function Dashboard() {
  const [showAdvisorBox, setShowAdvisorBox] = useState(true);
  const [chartFrom, setChartFrom] = useState("AUD");
  const [chartTo,   setChartTo]   = useState("USD");

  const { data: fxRate,  isLoading: rateLoading  } = useFxRate("AUD", "USD");
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
                <p className="text-xs text-gray-500">Balances &amp; deposits</p>
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
                <p className="font-semibold text-gray-900">Crypto Exchange</p>
                <p className="text-xs text-gray-500">Digital assets (DCE) conversion</p>
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
                <p className="text-xs text-gray-500">KYC &amp; documents</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Balances + YTD Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CurrencyBalances />
        </div>

        <div className="lg:col-span-2 space-y-3">
          {/* Chart pair selectors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-700">YTD Exchange Rate Chart</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <p className="text-xs text-gray-500 mb-1">From</p>
                  <Select value={chartFrom} onValueChange={setChartFrom}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_CURRENCIES.filter(c => c.code !== chartTo).map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-1 text-gray-400 font-bold mt-5">→</div>
                <div className="flex-1 min-w-[140px]">
                  <p className="text-xs text-gray-500 mb-1">To</p>
                  <Select value={chartTo} onValueChange={setChartTo}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHART_CURRENCIES.filter(c => c.code !== chartFrom).map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!chartLoading && chartRateValue > 0 && (
                  <div className="flex items-end pb-1 mt-5">
                    <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      = {chartRateValue < 0.001
                          ? chartRateValue.toFixed(8)
                          : chartRateValue < 1
                          ? chartRateValue.toFixed(6)
                          : chartRateValue.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <YtdRateChart
            fromCurrency={chartFrom}
            toCurrency={chartTo}
            currentRate={chartRateValue}
            isLoading={chartLoading}
          />
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
    </div>
  );
}
