import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface YtdRateChartProps {
  fromCurrency: string;
  toCurrency: string;
  currentRate: number;
  isLoading?: boolean;
}

interface HistoryPoint {
  date: string;
  rate: number;
  label: string;
}

async function fetchFxHistory(base: string, target: string): Promise<HistoryPoint[]> {
  const res = await fetch(`/api/fx-history/${base}/${target}`);
  if (!res.ok) throw new Error(`History unavailable for ${base}/${target}`);
  const data = await res.json() as { points: { date: string; rate: number }[] };

  return data.points.map((p) => ({
    date: p.date,
    rate: p.rate,
    label: new Date(p.date + "T12:00:00Z").toLocaleDateString("en-AU", { month: "short", day: "numeric" }),
  }));
}

const CustomTooltip = ({ active, payload, fromCurrency, toCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="text-gray-500 mb-1">{payload[0]?.payload?.label}</p>
        <p className="font-semibold text-gray-900">
          1 {fromCurrency} = {parseFloat(payload[0].value).toFixed(fromCurrency === "BTC" || fromCurrency === "ETH" ? 2 : 4)} {toCurrency}
        </p>
      </div>
    );
  }
  return null;
};

export default function YtdRateChart({ fromCurrency, toCurrency, currentRate, isLoading: rateLoading }: YtdRateChartProps) {
  const now = new Date();
  const year = now.getFullYear();

  const { data: points, isLoading, error } = useQuery<HistoryPoint[]>({
    queryKey: ["/api/fx-history", fromCurrency, toCurrency],
    queryFn: () => fetchFxHistory(fromCurrency, toCurrency),
    staleTime: 60 * 60 * 1000, // historical daily data doesn't change
    retry: 1,
  });

  if (isLoading || rateLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64 mb-2" />
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (error || !points || points.length < 2) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Historical data unavailable for {fromCurrency}/{toCurrency}
          </p>
          <p className="text-xs text-gray-400 mt-1">This pair may not have ECB/CoinGecko coverage</p>
        </CardContent>
      </Card>
    );
  }

  const startRate = points[0].rate;
  const ytdChange = currentRate - startRate;
  const ytdChangePct = startRate > 0 ? (ytdChange / startRate) * 100 : 0;
  const ytdHigh = Math.max(...points.map((p) => p.rate));
  const ytdLow = Math.min(...points.map((p) => p.rate));

  const isPositive = ytdChange >= 0;
  const chartColor = isPositive ? "#16a34a" : "#dc2626";

  const isCrypto = ["BTC", "ETH"].includes(fromCurrency) || ["BTC", "ETH"].includes(toCurrency);
  const precision = isCrypto ? 2 : 4;

  const yMin = ytdLow * 0.998;
  const yMax = ytdHigh * 1.002;

  // Thin out tick labels so they don't crowd
  const tickInterval = Math.max(1, Math.floor(points.length / 6));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              YTD Exchange Rate — {fromCurrency}/{toCurrency}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Jan 1, {year} — {now.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}
              <span className="ml-2 text-gray-400">· ECB / CoinGecko market data</span>
            </p>
          </div>
          <Badge
            className={
              isPositive
                ? "bg-green-100 text-green-800 flex items-center gap-1"
                : "bg-red-100 text-red-800 flex items-center gap-1"
            }
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? "+" : ""}
            {ytdChangePct.toFixed(2)}% YTD
          </Badge>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">YTD Open</p>
            <p className="text-sm font-semibold">{startRate.toFixed(precision)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">YTD High</p>
            <p className="text-sm font-semibold text-green-700">{ytdHigh.toFixed(precision)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">YTD Low</p>
            <p className="text-sm font-semibold text-red-700">{ytdLow.toFixed(precision)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`ytdGradient-${fromCurrency}-${toCurrency}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              interval={tickInterval}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v) => v.toFixed(precision)}
              axisLine={false}
              tickLine={false}
              width={isCrypto ? 64 : 52}
            />
            <Tooltip content={<CustomTooltip fromCurrency={fromCurrency} toCurrency={toCurrency} />} />
            <ReferenceLine y={startRate} stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={1} />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#ytdGradient-${fromCurrency}-${toCurrency})`}
              dot={false}
              activeDot={{ r: 4, fill: chartColor }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Source: ECB via Frankfurter.app · CoinGecko for crypto · Daily closing rates
        </p>
      </CardContent>
    </Card>
  );
}
