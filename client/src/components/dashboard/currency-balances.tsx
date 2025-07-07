import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallets } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";

const currencyConfig = {
  USD: { name: "US Dollar", symbol: "$", color: "bg-blue-500" },
  CAD: { name: "Canadian Dollar", symbol: "$", color: "bg-red-500" },
  EUR: { name: "Euro", symbol: "€", color: "bg-blue-600" },
  GBP: { name: "British Pound", symbol: "£", color: "bg-green-600" },
  AUD: { name: "Australian Dollar", symbol: "$", color: "bg-orange-500" },
  HKD: { name: "Hong Kong Dollar", symbol: "$", color: "bg-pink-500" },
  BTC: { name: "Bitcoin", symbol: "₿", color: "bg-yellow-500" },
  ETH: { name: "Ethereum", symbol: "Ξ", color: "bg-purple-500" },
  USDT: { name: "Tether", symbol: "₮", color: "bg-green-500" },
  USDC: { name: "USD Coin", symbol: "◎", color: "bg-blue-400" },
};

export default function CurrencyBalances() {
  const { data: wallets, isLoading, error } = useWallets();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Currency Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Currency Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load wallet balances</p>
        </CardContent>
      </Card>
    );
  }

  if (!wallets || wallets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Currency Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No wallet balances available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {wallets.map((wallet) => {
            const config = currencyConfig[wallet.currency as keyof typeof currencyConfig];
            const balance = parseFloat(wallet.balance);
            
            return (
              <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config?.color || 'bg-gray-500'}`}>
                    <span className="text-white font-bold text-xs">
                      {config?.symbol || wallet.currency.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {config?.name || wallet.currency}
                    </p>
                    <p className="text-sm text-gray-500">
                      {wallet.walletType === 'crypto' ? 'Crypto' : 'Available'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {wallet.walletType === 'crypto' 
                      ? `${balance.toFixed(4)} ${wallet.currency}`
                      : `${config?.symbol || '$'}${balance.toLocaleString()}`
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
