import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Timeframe = '1Y' | '3Y' | '7Y';

interface ChartRow {
  month: string;
  historical: number | null;
  projected: number | null;
}

interface PerfChartResponse {
  timeframe: string;
  anchorDate: string;
  openingValue: number;
  projectionRate: string;
  chartSource: 'historical_plus_forecast' | 'historical_estimate_plus_forecast';
  data: ChartRow[];
}

const TIMEFRAMES: Timeframe[] = ['1Y', '3Y', '7Y'];

function formatMoney(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

// For 1Y show every month, 3Y every quarter, 7Y every 6 months
function tickInterval(tf: Timeframe) {
  if (tf === '7Y') return 5;
  if (tf === '3Y') return 2;
  return 0; // every month
}

export default function PortfolioChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1Y');

  const { data, isLoading } = useQuery<PerfChartResponse>({
    queryKey: ['/api/portfolio/performance-chart', selectedTimeframe],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/performance-chart?timeframe=${selectedTimeframe}`);
      if (!res.ok) throw new Error('Failed to fetch performance chart');
      return res.json();
    },
  });

  const lastHistorical = data?.data.reduce<number | null>((acc, row) =>
    row.historical !== null ? row.historical : acc, null) ?? null;

  const projectedEnd = data?.data.at(-1)?.projected ?? null;

  const returnVsProjected = lastHistorical !== null && data?.openingValue
    ? ((lastHistorical - data.openingValue) / data.openingValue * 100).toFixed(2)
    : null;

  const totalProjectedReturn = projectedEnd && data?.openingValue
    ? ((projectedEnd - data.openingValue) / data.openingValue * 100).toFixed(1)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle>Portfolio Performance</CardTitle>
              <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                {data?.chartSource === 'historical_plus_forecast'
                  ? 'Historical data + forecast'
                  : 'Historical estimate + forecast'}
              </Badge>
            </div>
            {data && (
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {returnVsProjected !== null && (
                  <span className={`text-sm font-medium ${parseFloat(returnVsProjected) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Actual: {parseFloat(returnVsProjected) >= 0 ? '+' : ''}{returnVsProjected}%
                  </span>
                )}
                {totalProjectedReturn !== null && (
                  <span className="text-sm text-blue-600 font-medium">
                    Projected by end: +{totalProjectedReturn}% ({data.projectionRate})
                  </span>
                )}
                {data.openingValue > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Opening: {formatMoney(data.openingValue)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {TIMEFRAMES.map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={selectedTimeframe === tf ? 'default' : 'outline'}
                onClick={() => setSelectedTimeframe(tf)}
                disabled={isLoading}
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading portfolio data…</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data?.data ?? []}
                margin={{ top: 5, right: 20, left: 20, bottom: 55 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
                  stroke="#6B7280"
                  fontSize={11}
                  interval={tickInterval(selectedTimeframe)}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={formatMoney}
                  width={65}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'historical'
                      ? (data?.chartSource === 'historical_plus_forecast'
                          ? 'Historical'
                          : 'Historical estimate')
                      : `Forecast (${data?.projectionRate ?? '10% p.a.'})`,
                  ]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === 'historical'
                      ? (data?.chartSource === 'historical_plus_forecast'
                          ? 'Historical data'
                          : 'Historical estimate')
                      : `Forecast (${data?.projectionRate ?? '10% p.a.'})`
                  }
                  wrapperStyle={{ paddingTop: 8 }}
                />
                {/* Projected (dashed, blue) — full timeframe */}
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }}
                  connectNulls
                />
                {/* Historical (solid, red) — real data only */}
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#ef4444' }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
