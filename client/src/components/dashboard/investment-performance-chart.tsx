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
  const { data: performanceData, isLoading } = useQuery<InvestmentPerformanceResponse>({
    queryKey: ["/api/investment-performance", { timeframe: "1Y" }],
    queryFn: () => api.getInvestmentPerformance({ timeframe: "1Y" }),
    refetchInterval: 5000, // Refresh every 5 seconds to track investment changes
  });

  const { data: userInvestments } = useQuery({
    queryKey: ["/api/user-investments"],
    queryFn: () => api.getUserInvestments(),
    refetchInterval: 5000,
  });

  const { data: products } = useQuery({
    queryKey: ["/api/investment-products"],
    queryFn: () => api.getInvestmentProducts(),
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

  if (!performanceData || !performanceData.data || !performanceData.predictions) {
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
  const combinedData = [...(performanceData.data || []), ...(performanceData.predictions || [])];

  // Format data for chart display with compact quarterly formatting
  const chartData = combinedData.map((point, index) => {
    const date = new Date(point.date);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    const formattedDate = `Q${Math.floor(date.getMonth() / 3) + 1}'${year}`;
    
    return {
      ...point,
      formattedDate,
      quarter: `Q${Math.floor(date.getMonth() / 3) + 1} ${year}`,
      valueFormatted: `$${point.value.toLocaleString()}`,
      returnFormatted: `${(point.weightedReturn || 0) >= 0 ? '+' : ''}${(point.weightedReturn || 0).toFixed(2)}%`,
      // For predictions, use the new format with currentInvestment and totalReturn
      currentInvestment: point.isPrediction ? (point.currentInvestment || 0) : (point.investedAmount || 0),
      totalReturn: point.isPrediction ? (point.totalReturn || 0) : Math.max(0, point.value - (point.investedAmount || 0)),
      sortIndex: index // Add sort index for proper ordering
    };
  });

  const totalReturnValue = parseFloat(performanceData.totalReturn);
  const totalReturnPercent = parseFloat(performanceData.totalReturnPercent);
  const isPositiveReturn = totalReturnPercent >= 0;

  // Calculate term expiry projections using the same methodology as Investment Breakdown by Product
  const calculateTermExpiryProjections = () => {
    if (!userInvestments || !products) return { termExpiryValue: 0, termExpiryReturn: 0, termExpiryPercent: 0 };

    const productIRRMapping: Record<number, { midpointIRR: number; termYears: number }> = {
      1: { midpointIRR: 0.104, termYears: 4.25 }, // Real Estate Equity Fund
      2: { midpointIRR: 0.11, termYears: 0.85 },  // Real Estate Credit Fund
      3: { midpointIRR: 0.09, termYears: 0.78 },  // Real Estate First Mortgage Fund
      4: { midpointIRR: 0.11, termYears: 2.5 },   // Cash Flow-Based Corporate Credit Fund
      5: { midpointIRR: 0.135, termYears: 2.875 }, // Security-Backed Corporate Credit Fund
      6: { midpointIRR: 0.18, termYears: 6 },     // VC / Growth Equity Fund
    };

    let totalInvested = 0;
    let totalTermExpiryValue = 0;

    userInvestments.forEach((investment: any) => {
      const productData = productIRRMapping[investment.productId];
      if (productData) {
        const investedAmount = parseFloat(investment.investedAmount);
        totalInvested += investedAmount;
        
        const termExpiryGrowthFactor = Math.pow(1 + productData.midpointIRR, productData.termYears);
        const termExpiryValue = investedAmount * termExpiryGrowthFactor;
        totalTermExpiryValue += termExpiryValue;
      }
    });

    const termExpiryReturn = totalTermExpiryValue - totalInvested;
    const termExpiryPercent = totalInvested > 0 ? (termExpiryReturn / totalInvested) * 100 : 0;

    return { termExpiryValue: totalTermExpiryValue, termExpiryReturn, termExpiryPercent };
  };

  const { termExpiryValue, termExpiryReturn, termExpiryPercent } = calculateTermExpiryProjections();
  const isTermExpiryPositive = termExpiryPercent >= 0;

  const chartColor = "#8b5cf6"; // Purple for quarterly display

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Performance by Period
        </CardTitle>
        
        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Current Investment Value</p>
            <p className="text-2xl font-bold">${performanceData.currentValue.toLocaleString()}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Return</p>
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
            <p className="text-sm text-gray-600">Term Expiry Projection</p>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  ${termExpiryValue.toLocaleString()}
                </p>
                <Badge variant={isTermExpiryPositive ? "default" : "destructive"} className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
                  {isTermExpiryPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  +${termExpiryReturn.toLocaleString()} ({termExpiryPercent.toFixed(1)}%)
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
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
        
        {/* Performance by Period Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Performance uses consistent midpoint IRR methodology as Investment Breakdown</p>
            <p>• Term expiry projections based on actual product investment terms (0.78-4.25 years)</p>
            <p>• Current values update automatically when new investments are added</p>
            <p>• Each product matures at different times based on real terms</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}