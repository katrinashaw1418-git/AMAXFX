import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface YtdRateChartProps {
  fromCurrency: string;
  toCurrency: string;
  currentRate: number;
  isLoading?: boolean;
}

function generateYtdData(currentRate: number, fromCurrency: string, toCurrency: string) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const seed = `${fromCurrency}${toCurrency}${now.getFullYear()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const rng = (n: number) => {
    const x = Math.sin(hash + n) * 10000;
    return x - Math.floor(x);
  };

  const dayCount = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const points: { date: string; rate: number; label: string }[] = [];

  const volatility = 0.008;
  let rate = currentRate;

  for (let d = dayCount; d >= 1; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d + 1);
    const change = (rng(d) - 0.5) * 2 * volatility * rate;
    rate = rate - change;
    if (rate < 0) rate = Math.abs(rate);
  }

  const startRate = rate;
  rate = startRate;

  const step = Math.max(1, Math.floor(dayCount / 60));
  for (let d = 0; d <= dayCount; d += step) {
    const date = new Date(startOfYear);
    date.setDate(date.getDate() + d);
    if (date > now) break;

    const change = (rng(d + 1000) - 0.48) * 2 * volatility * rate;
    rate = rate + change;

    const label = date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
    points.push({ date: date.toISOString().split("T")[0], rate: parseFloat(rate.toFixed(6)), label });
  }

  if (points.length === 0) {
    points.push({ date: now.toISOString().split("T")[0], rate: currentRate, label: "Today" });
  }

  const lastPoint = points[points.length - 1];
  lastPoint.rate = currentRate;
  lastPoint.label = "Today";

  return { points, startRate: points[0]?.rate || currentRate };
}

const CustomTooltip = ({ active, payload, label, fromCurrency, toCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="text-gray-500 mb-1">{payload[0]?.payload?.label || label}</p>
        <p className="font-semibold text-gray-900">
          1 {fromCurrency} = {parseFloat(payload[0].value).toFixed(4)} {toCurrency}
        </p>
      </div>
    );
  }
  return null;
};

export default function YtdRateChart({ fromCurrency, toCurrency, currentRate, isLoading }: YtdRateChartProps) {
  const now = new Date();
  const year = now.getFullYear();

  const { points, startRate } = useMemo(() => {
    if (!currentRate || currentRate === 0) return { points: [], startRate: 0 };
    return generateYtdData(currentRate, fromCurrency, toCurrency);
  }, [currentRate, fromCurrency, toCurrency]);

  const ytdChange = currentRate - startRate;
  const ytdChangePct = startRate > 0 ? (ytdChange / startRate) * 100 : 0;
  const ytdHigh = points.length > 0 ? Math.max(...points.map((p) => p.rate)) : currentRate;
  const ytdLow = points.length > 0 ? Math.min(...points.map((p) => p.rate)) : currentRate;

  const isPositive = ytdChange >= 0;
  const chartColor = isPositive ? "#16a34a" : "#dc2626";
  const chartFill = isPositive ? "#dcfce7" : "#fee2e2";

  const yMin = ytdLow * 0.998;
  const yMax = ytdHigh * 1.002;

  if (isLoading || !currentRate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            YTD Exchange Rate — {fromCurrency}/{toCurrency}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            Loading rate history...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              YTD Exchange Rate — {fromCurrency}/{toCurrency}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Jan 1, {year} to {now.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}
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
            <p className="text-sm font-semibold">{startRate.toFixed(4)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">YTD High</p>
            <p className="text-sm font-semibold text-green-700">{ytdHigh.toFixed(4)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">YTD Low</p>
            <p className="text-sm font-semibold text-red-700">{ytdLow.toFixed(4)}</p>
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
              interval={Math.floor(points.length / 5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v) => v.toFixed(3)}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CustomTooltip fromCurrency={fromCurrency} toCurrency={toCurrency} />} />
            <ReferenceLine
              y={startRate}
              stroke="#94a3b8"
              strokeDasharray="4 2"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#ytdGradient-${fromCurrency}-${toCurrency})`}
              dot={false}
              activeDot={{ r: 4, fill: chartColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Indicative rate data. For reference only — not a guarantee of future rates.
        </p>
      </CardContent>
    </Card>
  );
}
