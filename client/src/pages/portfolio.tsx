import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePortfolio, useWallets } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Bitcoin, PieChart as PieChartIcon, Target, RefreshCw } from "lucide-react";

const COLORS = ['hsl(207, 90%, 54%)', 'hsl(152, 60%, 39%)', 'hsl(0, 84%, 55%)', '#FBBF24', '#8B5CF6', '#10B981'];

export default function Portfolio() {
  const { data: portfolio, isLoading: portfolioLoading } = usePortfolio();
  const { data: wallets, isLoading: walletsLoading } = useWallets();

  const isLoading = portfolioLoading || walletsLoading;

  // Calculate portfolio allocation data
  const allocationData = wallets?.map((wallet, index) => {
    const balance = parseFloat(wallet.balance);
    const value = wallet.walletType === 'crypto' ? balance * 43500 : balance; // Mock BTC price
    
    return {
      name: wallet.currency,
      value: value,
      percentage: 0, // Will be calculated below
      color: COLORS[index % COLORS.length],
      type: wallet.walletType
    };
  }).filter(item => item.value > 0) || [];

  const totalValue = allocationData.reduce((sum, item) => sum + item.value, 0);
  allocationData.forEach(item => {
    item.percentage = (item.value / totalValue) * 100;
  });

  // Mock performance data
  const performanceData = [
    { period: '1W', value: 2.5, color: 'text-secondary' },
    { period: '1M', value: 12.5, color: 'text-secondary' },
    { period: '3M', value: 8.7, color: 'text-secondary' },
    { period: '6M', value: 15.2, color: 'text-secondary' },
    { period: '1Y', value: 28.4, color: 'text-secondary' },
    { period: 'YTD', value: 18.9, color: 'text-secondary' },
  ];

  // Mock historical data for the chart
  const historicalData = [
    { month: 'Jan', portfolio: 2200000, benchmark: 2180000 },
    { month: 'Feb', portfolio: 2350000, benchmark: 2320000 },
    { month: 'Mar', portfolio: 2180000, benchmark: 2240000 },
    { month: 'Apr', portfolio: 2420000, benchmark: 2380000 },
    { month: 'May', portfolio: 2380000, benchmark: 2360000 },
    { month: 'Jun', portfolio: 2550000, benchmark: 2490000 },
    { month: 'Jul', portfolio: 2620000, benchmark: 2580000 },
    { month: 'Aug', portfolio: 2580000, benchmark: 2620000 },
    { month: 'Sep', portfolio: 2750000, benchmark: 2690000 },
    { month: 'Oct', portfolio: 2680000, benchmark: 2720000 },
    { month: 'Nov', portfolio: 2820000, benchmark: 2780000 },
    { month: 'Dec', portfolio: 2847392, benchmark: 2801000 },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalPortfolioValue = portfolio ? parseFloat(portfolio.totalValue) : 0;
  const cryptoValue = portfolio ? parseFloat(portfolio.cryptoValue) : 0;
  const fiatValue = portfolio ? parseFloat(portfolio.fiatValue) : 0;
  const monthlyPnl = portfolio ? parseFloat(portfolio.monthlyPnl) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio Overview</h1>
          <p className="text-gray-600">Track your asset allocation and performance</p>
        </div>
        <Button>
          <RefreshCw className="w-4 h-4 mr-2" />
          Rebalance
        </Button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">${totalPortfolioValue.toLocaleString()}</p>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="w-3 h-3 text-secondary" />
              <span className="text-sm text-secondary">+12.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Crypto Assets</h3>
              <Bitcoin className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">${cryptoValue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">
              {((cryptoValue / totalPortfolioValue) * 100).toFixed(1)}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Fiat Assets</h3>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">${fiatValue.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">
              {((fiatValue / totalPortfolioValue) * 100).toFixed(1)}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Monthly P&L</h3>
              {monthlyPnl >= 0 ? (
                <TrendingUp className="w-4 h-4 text-secondary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <p className={`text-2xl font-bold ${monthlyPnl >= 0 ? 'text-secondary' : 'text-destructive'}`}>
              {monthlyPnl >= 0 ? '+' : ''}${monthlyPnl.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {monthlyPnl >= 0 ? '+' : ''}18.5% this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance and Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance vs Benchmark</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === 'portfolio' ? 'Your Portfolio' : 'Benchmark'
                    ]}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                  />
                  <Line type="monotone" dataKey="portfolio" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Asset Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="h-64 w-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {allocationData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline">{item.type}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.percentage.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">${item.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Periods */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {performanceData.map((item) => (
                <div key={item.period} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{item.period}</p>
                  <p className={`text-lg font-bold ${item.color}`}>+{item.value}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Portfolio Volatility</span>
                  <span className="text-sm text-gray-600">12.4%</span>
                </div>
                <Progress value={24.8} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Sharpe Ratio</span>
                  <span className="text-sm text-gray-600">1.85</span>
                </div>
                <Progress value={61.7} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Maximum Drawdown</span>
                  <span className="text-sm text-gray-600">-8.2%</span>
                </div>
                <Progress value={16.4} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Beta (vs Market)</span>
                  <span className="text-sm text-gray-600">0.92</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
