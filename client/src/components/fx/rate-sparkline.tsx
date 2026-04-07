import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface RateSparklineProps {
  fromCurrency: string;
  toCurrency: string;
  currentRate: number;
}

function generateSparklineData(currentRate: number, fromCurrency: string, toCurrency: string) {
  const now = new Date();
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

  const dayCount = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const volatility = 0.008;

  let rate = currentRate;
  for (let d = dayCount; d >= 1; d--) {
    const change = (rng(d) - 0.5) * 2 * volatility * rate;
    rate -= change;
    if (rate < 0) rate = Math.abs(rate);
  }

  const points: { rate: number }[] = [];
  const step = Math.max(1, Math.floor(dayCount / 20));
  for (let d = 0; d <= dayCount; d += step) {
    const change = (rng(d + 1000) - 0.48) * 2 * volatility * rate;
    rate += change;
    points.push({ rate: parseFloat(rate.toFixed(6)) });
  }

  if (points.length > 0) {
    points[points.length - 1].rate = currentRate;
  }

  return points;
}

export default function RateSparkline({ fromCurrency, toCurrency, currentRate }: RateSparklineProps) {
  const data = useMemo(
    () => generateSparklineData(currentRate, fromCurrency, toCurrency),
    [currentRate, fromCurrency, toCurrency]
  );

  if (!currentRate || data.length < 2) return null;

  const first = data[0].rate;
  const last = data[data.length - 1].rate;
  const pctChange = first > 0 ? ((last - first) / first) * 100 : 0;
  const isPositive = pctChange >= 0;
  const color = isPositive ? "#16a34a" : "#dc2626";

  const yMin = Math.min(...data.map((d) => d.rate)) * 0.998;
  const yMax = Math.max(...data.map((d) => d.rate)) * 1.002;

  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Percentage change label */}
      <span
        className={`text-[10px] font-semibold leading-none ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {pctChange.toFixed(2)}%
      </span>

      {/* Sparkline */}
      <div className="w-16 h-7">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${fromCurrency}-${toCurrency}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-gray-200 rounded shadow px-2 py-1 text-xs">
                      {parseFloat(String(payload[0].value)).toFixed(4)}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#spark-${fromCurrency}-${toCurrency})`}
              dot={false}
              isAnimationActive={false}
              domain={[yMin, yMax]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
