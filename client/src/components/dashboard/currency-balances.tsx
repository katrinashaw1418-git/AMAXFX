import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallets } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyConfig } from "@/lib/types";

export default function CurrencyBalances() {
  const { data: rawWallets, isLoading, error } = useWallets();

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

  if (!rawWallets || rawWallets.length === 0) {
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

  const cryptoOrder = ['BTC', 'ETH', 'USDT', 'USDC'];

  const wallets = [...rawWallets]
    .filter((w: any) => parseFloat(w.balance || '0') > 0)
    .sort((a: any, b: any) => {
      const aIsCrypto = cryptoOrder.includes(a.currency);
      const bIsCrypto = cryptoOrder.includes(b.currency);
      if (aIsCrypto && !bIsCrypto) return 1;
      if (!aIsCrypto && bIsCrypto) return -1;
      if (aIsCrypto && bIsCrypto) return cryptoOrder.indexOf(a.currency) - cryptoOrder.indexOf(b.currency);
      if (a.currency === 'AUD') return -1;
      if (b.currency === 'AUD') return 1;
      return a.currency.localeCompare(b.currency);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Balances</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {wallets.map((wallet: any) => {
            const config = CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig];
            const balance = parseFloat(wallet.balance);

            return (
              <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: config?.color || '#9ca3af' }}
                  >
                    {config?.flag || wallet.currency.slice(0, 2)}
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
