import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceData {
  date: string;
  value: number;
  investedAmount?: number;
  totalReturn?: number;
  currentInvestment?: number;
  weightedReturn: number;
  isPrediction?: boolean;
  timestamp: number;
}

interface InvestmentPerformanceResponse {
  timeframe: string;
  data: PerformanceData[];
  predictions: PerformanceData[];
  currentValue: number;
  totalReturn: string;
  totalReturnPercent: string;
  portfolioAllocation: Record<string, { value: number; annualReturn: number }>;
}

export function InvestmentPerformanceChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1M" | "3M" | "1Y">("1Y");

  const { data: performanceData, isLoading } = useQuery<InvestmentPerformanceResponse>({
    queryKey: ["/api/investment-performance", { timeframe: selectedTimeframe }],
    queryFn: () => api.getInvestmentPerformance({ timeframe: selectedTimeframe }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance by Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance by Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No investment performance data available</p>
        </CardContent>
      </Card>
    );
  }

  // Combine historical data with predictions for chart display
  const combinedData = [...performanceData.data, ...performanceData.predictions];

  // Format data for chart display
  const chartData = combinedData.map((point) => ({
    ...point,
    formattedDate: new Date(point.date).toLocaleDateString('en-US', { 
      month: 'short', 
      year: selectedTimeframe === '1Y' ? '2-digit' : undefined,
      day: selectedTimeframe === '1M' ? 'numeric' : undefined
    }),
    valueFormatted: `$${point.value.toLocaleString()}`,
    returnFormatted: `${point.weightedReturn >= 0 ? '+' : ''}${point.weightedReturn.toFixed(2)}%`,
    // For predictions, use the new format with currentInvestment and totalReturn
    currentInvestment: point.isPrediction ? (point.currentInvestment || 0) : (point.investedAmount || 0),
    totalReturn: point.isPrediction ? (point.totalReturn || 0) : Math.max(0, point.value - (point.investedAmount || 0))
  }));

  const totalReturnValue = parseFloat(performanceData.totalReturn);
  const totalReturnPercent = parseFloat(performanceData.totalReturnPercent);
  const isPositiveReturn = totalReturnPercent >= 0;

  // Calculate predicted 7-year return (final prediction in array)
  const predicted7YearReturn = performanceData.predictions[performanceData.predictions.length - 1]?.weightedReturn || 0;
  const isPredictionPositive = predicted7YearReturn >= 0;

  // Get timeframe colors
  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case "1M": return isPositiveReturn ? "#22c55e" : "#ef4444"; // Green/Red
      case "3M": return "#3b82f6"; // Blue
      case "1Y": return "#8b5cf6"; // Purple
      default: return "#6b7280";
    }
  };

  const chartColor = getTimeframeColor(selectedTimeframe);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance by Period
          </CardTitle>
          <div className="flex gap-1">
            {["1M", "3M", "1Y"].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe as "1M" | "3M" | "1Y")}
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Current Investment Value</p>
            <p className="text-2xl font-bold">${performanceData.currentValue.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Return ({selectedTimeframe})</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${isPositiveReturn ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalReturnValue).toLocaleString()}
              </p>
              <Badge variant={isPositiveReturn ? "default" : "destructive"} className="flex items-center gap-1">
                {isPositiveReturn ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {totalReturnPercent >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">7-Year Projection</p>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <Badge variant={isPredictionPositive ? "default" : "destructive"} className="flex items-center gap-1">
                {isPredictionPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {predicted7YearReturn >= 0 ? '+' : ''}{predicted7YearReturn.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === "Current Investment" || name === "Total Return") {
                    return [`$${Number(value).toLocaleString()}`, name];
                  }
                  if (name === "Weighted Return") {
                    return [`${Number(value).toFixed(2)}%`, name];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              
              {/* Current Investment Value (Blue) */}
              <Bar
                dataKey="currentInvestment"
                stackId="investment"
                fill="#3b82f6"
                name="Current Investment"
              />
              
              {/* Total Return (Purple) */}
              <Bar
                dataKey="totalReturn"
                stackId="investment"
                fill="#8b5cf6"
                name="Total Return"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Portfolio Allocation Summary */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Current Investment Allocation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(performanceData.portfolioAllocation).map(([category, allocation]) => {
              const percentage = (allocation.value / performanceData.currentValue) * 100;
              const categoryLabel = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <div key={category} className="space-y-1">
                  <p className="text-xs text-gray-600">{categoryLabel}</p>
                  <p className="text-sm font-medium">${allocation.value.toLocaleString()}</p>
                  <Badge variant="outline" className="text-xs">
                    {percentage.toFixed(1)}% • {(allocation.annualReturn * 100).toFixed(0)}% target
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}