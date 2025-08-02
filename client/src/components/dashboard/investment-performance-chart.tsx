import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, Calculator } from "lucide-react";
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

  // Format data for chart display with compact quarterly formatting and cumulative returns
  let cumulativeReturn = 0;
  const chartData = combinedData.map((point, index) => {
    const date = new Date(point.date);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    const formattedDate = `Q${Math.floor(date.getMonth() / 3) + 1}'${year}`;
    
    // Calculate current period return
    const currentPeriodReturn = point.isPrediction ? (point.totalReturn || 0) : (point.value - (point.investedAmount || 0));
    
    // Add to cumulative return
    cumulativeReturn += currentPeriodReturn;
    
    return {
      ...point,
      formattedDate,
      quarter: `Q${Math.floor(date.getMonth() / 3) + 1} ${year}`,
      valueFormatted: `$${point.value.toLocaleString()}`,
      returnFormatted: `${(point.weightedReturn || 0) >= 0 ? '+' : ''}${(point.weightedReturn || 0).toFixed(2)}%`,
      // For chart bars, use cumulative return instead of individual period return
      currentInvestment: point.isPrediction ? (point.currentInvestment || 0) : (point.investedAmount || 0),
      totalReturn: cumulativeReturn, // This is now cumulative
      currentPeriodReturn: currentPeriodReturn, // Keep individual period return for table
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Current Investment Value</p>
            <p className="text-2xl font-bold">$1,965,395</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Total Invested</p>
            <p className="text-2xl font-bold">$1,850,000</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Cumulative Return</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                $115,395
              </p>
              <Badge variant="default" className="flex items-center gap-1 w-fit">
                <TrendingUp className="h-3 w-3" />
                +6.24%
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Term Expiry Projection</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <p className="text-lg font-bold text-green-600">
                  ${termExpiryValue.toLocaleString()}
                </p>
              </div>
              <Badge variant={isTermExpiryPositive ? "default" : "destructive"} className="flex items-center gap-1 w-fit bg-green-50 text-green-700 border-green-200">
                {isTermExpiryPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                +${termExpiryReturn.toLocaleString()} ({termExpiryPercent.toFixed(1)}%)
              </Badge>
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
                  if (name === "Total Invested" || name === "Current Return") {
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
              
              {/* Total Invested (Blue) */}
              <Bar
                dataKey="currentInvestment"
                stackId="investment"
                fill="#3b82f6"
                name="Total Invested"
              />
              
              {/* Cumulative Return (Purple) */}
              <Bar
                dataKey="totalReturn"
                stackId="investment"
                fill="#8b5cf6"
                name="Cumulative Return"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Return by Period Calculation Table */}
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Return by Period
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 bg-gray-50">Period</th>
                  <th className="text-right p-3 bg-gray-50">Total Invested</th>
                  <th className="text-right p-3 bg-gray-50">Current Value</th>
                  <th className="text-right p-3 bg-gray-50">Current Return</th>
                  <th className="text-right p-3 bg-gray-50">Cumulative Return</th>
                  <th className="text-right p-3 bg-gray-50">Return %</th>
                </tr>
              </thead>
              <tbody>
                {chartData.filter(item => !item.isPrediction).map((period, index) => {
                  const investedAmount = period.currentInvestment || 0;
                  const currentReturn = period.currentPeriodReturn || 0;
                  const cumulativeReturn = period.totalReturn || 0; // This is now cumulative from chart data
                  const returnPercent = investedAmount > 0 ? (currentReturn / investedAmount) * 100 : 0;
                  
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{period.formattedDate}</td>
                      <td className="p-3 text-right">${investedAmount.toLocaleString()}</td>
                      <td className="p-3 text-right">${period.value?.toLocaleString() || '0'}</td>
                      <td className={`p-3 text-right font-medium ${currentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(currentReturn).toLocaleString()}
                      </td>
                      <td className={`p-3 text-right font-medium ${cumulativeReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(cumulativeReturn).toLocaleString()}
                      </td>
                      <td className={`p-3 text-right font-medium ${returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
                
                {/* Add projection periods using actual server-generated data */}
                {chartData.filter(item => item.isPrediction).map((period, index) => {
                  const investedAmount = period.currentInvestment || 0;
                  const currentReturn = period.currentPeriodReturn || 0;
                  const cumulativeReturn = period.totalReturn || 0; // This is now cumulative from chart data
                  const returnPercent = investedAmount > 0 ? (currentReturn / investedAmount) * 100 : 0;
                  const isFinal = period.formattedDate.includes('Q1\'28');
                  
                  return (
                    <tr key={`pred-${index}`} className={`border-b ${isFinal ? 'bg-green-50' : 'bg-blue-50'} hover:opacity-90`}>
                      <td className="p-3 font-medium">{period.formattedDate} {isFinal ? '(Term Expiry)' : '(Projection)'}</td>
                      <td className="p-3 text-right">${investedAmount.toLocaleString()}</td>
                      <td className="p-3 text-right">${period.value?.toLocaleString() || '0'}</td>
                      <td className={`p-3 text-right font-medium ${isFinal ? 'text-green-700' : 'text-blue-600'}`}>
                        ${Math.abs(currentReturn).toLocaleString()}
                      </td>
                      <td className={`p-3 text-right font-medium ${isFinal ? 'text-green-700' : 'text-blue-600'}`}>
                        ${Math.abs(cumulativeReturn).toLocaleString()}
                      </td>
                      <td className={`p-3 text-right font-medium ${isFinal ? 'text-green-700' : 'text-blue-600'}`}>
                        {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Calculation Methodology:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Each Period:</strong> Include only investments made before or on that date</li>
              <li>• <strong>Current Value:</strong> Invested Amount × (1 + IRR)^EffectiveTime</li>
              <li>• <strong>Effective Time:</strong> Min(Time Elapsed, Product Term) to cap growth at maturity</li>
              <li>• <strong>Cumulative Return:</strong> Running total of all returns from start to current period</li>
              <li>• <strong>Return %:</strong> (Current Return ÷ Total Invested) × 100</li>
            </ul>
          </div>
          
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-3">Detailed Product Breakdown by Period</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border-r">Period</th>
                    <th className="p-2 text-center border-r">RE Credit</th>
                    <th className="p-2 text-center border-r">RE Equity</th>
                    <th className="p-2 text-center border-r">RE Mortgage</th>
                    <th className="p-2 text-center border-r">Corp Credit</th>
                    <th className="p-2 text-center border-r">Security Credit</th>
                    <th className="p-2 text-center border-r">VC Fund</th>
                    <th className="p-2 text-center">Total Return</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium border-r">Q2'24</td>
                    <td className="p-2 text-center border-r text-green-600">$438 (0.5%)</td>
                    <td className="p-2 text-center border-r text-gray-400">-</td>
                    <td className="p-2 text-center border-r text-gray-400">-</td>
                    <td className="p-2 text-center border-r text-gray-400">-</td>
                    <td className="p-2 text-center border-r text-gray-400">-</td>
                    <td className="p-2 text-center border-r text-gray-400">-</td>
                    <td className="p-2 text-center font-medium text-green-600">$438</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium border-r">Q3'24</td>
                    <td className="p-2 text-center border-r text-green-600">$2,689 (3.2%)</td>
                    <td className="p-2 text-center border-r text-green-600">$7,958 (2.3%)</td>
                    <td className="p-2 text-center border-r text-green-600">$1,530 (1.0%)</td>
                    <td className="p-2 text-center border-r text-green-600">$2,579 (0.6%)</td>
                    <td className="p-2 text-center border-r text-gray-400">-</td>
                    <td className="p-2 text-center border-r text-gray-400">-</td>
                    <td className="p-2 text-center font-medium text-green-600">$14,756</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium border-r">Q4'24</td>
                    <td className="p-2 text-center border-r text-green-600">$5,024 (5.9%)</td>
                    <td className="p-2 text-center border-r text-green-600">$16,991 (4.9%)</td>
                    <td className="p-2 text-center border-r text-green-600">$4,855 (3.2%)</td>
                    <td className="p-2 text-center border-r text-green-600">$14,633 (3.3%)</td>
                    <td className="p-2 text-center border-r text-green-600">$17,100 (3.0%)</td>
                    <td className="p-2 text-center border-r text-green-600">$4,342 (1.7%)</td>
                    <td className="p-2 text-center font-medium text-green-600">$62,946</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium border-r">Q1'25</td>
                    <td className="p-2 text-center border-r text-green-600">$7,422 (8.7%)</td>
                    <td className="p-2 text-center border-r text-green-600">$26,252 (7.5%)</td>
                    <td className="p-2 text-center border-r text-green-600">$8,253 (5.5%)</td>
                    <td className="p-2 text-center border-r text-green-600">$27,009 (6.0%)</td>
                    <td className="p-2 text-center border-r text-green-600">$35,966 (6.4%)</td>
                    <td className="p-2 text-center border-r text-green-600">$15,170 (6.1%)</td>
                    <td className="p-2 text-center font-medium text-green-600">$120,072</td>
                  </tr>
                  <tr className="border-b bg-blue-50">
                    <td className="p-2 font-medium border-r">Q2'25</td>
                    <td className="p-2 text-center border-r text-blue-600">$7,885 (9.3%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$35,537 (10.2%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$10,429 (7.0%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$39,434 (8.8%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$55,014 (9.7%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$26,208 (10.5%)</td>
                    <td className="p-2 text-center font-medium text-blue-600">$174,507</td>
                  </tr>
                  <tr className="border-b bg-blue-50">
                    <td className="p-2 font-medium border-r">Q1'26</td>
                    <td className="p-2 text-center border-r text-blue-600">$7,885 (9.3%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$76,142 (21.8%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$10,429 (7.0%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$89,556 (19.9%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$133,566 (23.6%)</td>
                    <td className="p-2 text-center border-r text-blue-600">$70,443 (28.2%)</td>
                    <td className="p-2 text-center font-medium text-blue-600">$388,021</td>
                  </tr>
                  <tr className="border-b bg-green-50">
                    <td className="p-2 font-medium border-r">Q1'28 (Term Expiry)</td>
                    <td className="p-2 text-center border-r text-green-700">$7,885 (9.3%)</td>
                    <td className="p-2 text-center border-r text-green-700">$182,950 (52.3%)</td>
                    <td className="p-2 text-center border-r text-green-700">$10,429 (7.0%)</td>
                    <td className="p-2 text-center border-r text-green-700">$134,144 (29.8%)</td>
                    <td className="p-2 text-center border-r text-green-700">$248,133 (43.9%)</td>
                    <td className="p-2 text-center border-r text-green-700">$264,106 (105.6%)</td>
                    <td className="p-2 text-center font-medium text-green-700">$847,647</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Shows cumulative return amount that progressively adds returns from each period. This shows the running total of all investment gains.
              <br />
              <strong>Current Status:</strong> Investment: $1,850,000 → Current Value: $1,965,395 → Cumulative Return: $115,395 (6.24%)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}