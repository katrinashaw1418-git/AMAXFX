import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from "recharts";

interface RateSparklineProps {
  fromCurrency: string;
  toCurrency: string;
  currentRate: number;
}

async function fetchFxHistory(base: string, target: string) {
  const res = await fetch(`/api/fx-history/${base}/${target}`);
  if (!res.ok) throw new Error("unavailable");
  const data = await res.json() as { points: { date: string; rate: number }[] };
  return data.points;
}

export default function RateSparkline({ fromCurrency, toCurrency, currentRate }: RateSparklineProps) {
  const { data: points } = useQuery({
    queryKey: ["/api/fx-history", fromCurrency, toCurrency],
    queryFn: () => fetchFxHistory(fromCurrency, toCurrency),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  if (!points || points.length < 2) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] text-gray-300 leading-none">—</span>
        <div className="w-16 h-7 bg-gray-50 rounded" />
      </div>
    );
  }

  const first = points[0].rate;
  const last = currentRate || points[points.length - 1].rate;
  const pctChange = first > 0 ? ((last - first) / first) * 100 : 0;
  const isPositive = pctChange >= 0;
  const color = isPositive ? "#16a34a" : "#dc2626";

  const yMin = Math.min(...points.map((d) => d.rate)) * 0.998;
  const yMax = Math.max(...points.map((d) => d.rate)) * 1.002;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`text-[10px] font-semibold leading-none ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {pctChange.toFixed(2)}%
      </span>

      <div className="w-16 h-7">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 1, right: 0, bottom: 1, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${fromCurrency}-${toCurrency}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis domain={[yMin, yMax]} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const isCrypto = ["BTC", "ETH"].includes(fromCurrency);
                  return (
                    <div className="bg-white border border-gray-200 rounded shadow px-2 py-1 text-xs">
                      {parseFloat(String(payload[0].value)).toFixed(isCrypto ? 2 : 4)}
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
