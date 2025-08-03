import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Bitcoin, DollarSign, TrendingDown } from "lucide-react";
import { usePortfolio } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";

export default function WealthOverview() {
  const { data: portfolio, isLoading, error } = usePortfolio();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-destructive">Failed to load portfolio data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">No portfolio data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalValue = parseFloat(portfolio.totalValue);
  const cryptoValue = parseFloat(portfolio.cryptoValue);
  const fiatValue = parseFloat(portfolio.fiatValue);
  const monthlyPnl = parseFloat(portfolio.monthlyPnl);
  const monthlyPnlPercent = parseFloat(portfolio.monthlyPnlPercent);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Portfolio Value</h3>
            <TrendingUp className="w-4 h-4 text-secondary" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">
              ${totalValue.toLocaleString()}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary">+12.5%</span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Crypto Holdings</h3>
            <Bitcoin className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">
              ${cryptoValue.toLocaleString()}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-secondary">+8.2%</span>
              <span className="text-xs text-gray-500">24h change</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Available Cash</h3>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-gray-900">
              ${(fiatValue - cryptoValue).toLocaleString()}
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Multi-currency</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Monthly P&L</h3>
            {monthlyPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-secondary" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
          </div>
          <div className="space-y-2">
            <p className={`text-2xl font-bold ${monthlyPnl >= 0 ? 'text-secondary' : 'text-destructive'}`}>
              {monthlyPnl >= 0 ? '+' : ''}${monthlyPnl.toLocaleString()}
            </p>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${monthlyPnl >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {monthlyPnl >= 0 ? '+' : ''}{monthlyPnlPercent}%
              </span>
              <span className="text-xs text-gray-500">return</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
