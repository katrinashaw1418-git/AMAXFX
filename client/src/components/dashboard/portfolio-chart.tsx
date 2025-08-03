import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

type Timeframe = '1M' | '3M' | '1Y';

interface HistoricalDataPoint {
  date: string;
  value: number;
  timestamp: number;
}

interface PortfolioHistoryResponse {
  timeframe: string;
  data: HistoricalDataPoint[];
  currentValue: number;
  totalReturn: string;
  totalReturnPercent: string;
  startValue: string;
  endValue: string;
}

export default function PortfolioChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');
  
  const { data: historyData, isLoading } = useQuery<PortfolioHistoryResponse>({
    queryKey: ['/api/portfolio/history', selectedTimeframe],
    queryFn: async () => {
      const response = await fetch(`/api/portfolio/history?timeframe=${selectedTimeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio history');
      }
      return response.json();
    },
  });

  // Format chart data for display
  const formatChartData = (data: HistoricalDataPoint[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map((point, index) => {
      const date = new Date(point.date);
      let label = '';
      
      if (selectedTimeframe === '1Y') {
        // For 1Y, show month and year (monthly intervals)
        label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else if (selectedTimeframe === '3M') {
        // For 3M, show month and day
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // For 1M, show month and day
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      return {
        date: label,
        value: point.value,
        fullDate: point.date
      };
    });
  };

  const chartData = historyData ? formatChartData(historyData.data) : [];
  const totalReturnPercent = historyData ? parseFloat(historyData.totalReturnPercent) : 0;
  const isPositive = totalReturnPercent >= 0;
  
  // Get color based on timeframe
  const getChartColor = () => {
    switch (selectedTimeframe) {
      case '3M':
        return '#3b82f6'; // Blue
      case '1Y':
        return '#8b5cf6'; // Purple
      case '1M':
      default:
        return isPositive ? "#22c55e" : "#ef4444"; // Green/Red for 1M
    }
  };
  
  const chartColor = getChartColor();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Performance</CardTitle>
            {historyData && (
              <div className="flex items-center gap-4 mt-2">
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}${historyData.totalReturn} ({isPositive ? '+' : ''}{historyData.totalReturnPercent}%)
                </span>
                <span className="text-sm text-muted-foreground">
                  {selectedTimeframe}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {(['1M', '3M', '1Y'] as const).map((timeframe) => (
              <Button 
                key={timeframe}
                size="sm" 
                variant={selectedTimeframe === timeframe ? "default" : "outline"}
                onClick={() => setSelectedTimeframe(timeframe)}
                disabled={isLoading}
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={selectedTimeframe === '1Y' ? "h-80" : "h-64"}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading portfolio data...</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: selectedTimeframe === '1Y' ? 50 : 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  fontSize={12}
                  interval={selectedTimeframe === '1Y' ? 0 : 'preserveStartEnd'}
                  tick={{ fontSize: selectedTimeframe === '1Y' ? 10 : 12 }}
                  angle={selectedTimeframe === '1Y' ? -45 : 0}
                  textAnchor={selectedTimeframe === '1Y' ? 'end' : 'middle'}
                  height={selectedTimeframe === '1Y' ? 60 : 40}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                  labelFormatter={(label) => `Date: ${label}`}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={chartColor}
                  strokeWidth={3}
                  dot={{ fill: chartColor, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: chartColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
