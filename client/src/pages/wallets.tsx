import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallets } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, MinusCircle, ArrowUpDown } from "lucide-react";

const currencyConfig = {
  USD: { name: "US Dollar", symbol: "$", color: "bg-blue-500", flag: "🇺🇸" },
  CAD: { name: "Canadian Dollar", symbol: "$", color: "bg-red-500", flag: "🇨🇦" },
  EUR: { name: "Euro", symbol: "€", color: "bg-blue-600", flag: "🇪🇺" },
  GBP: { name: "British Pound", symbol: "£", color: "bg-green-600", flag: "🇬🇧" },
  AUD: { name: "Australian Dollar", symbol: "$", color: "bg-orange-500", flag: "🇦🇺" },
  HKD: { name: "Hong Kong Dollar", symbol: "$", color: "bg-pink-500", flag: "🇭🇰" },
  BTC: { name: "Bitcoin", symbol: "₿", color: "bg-yellow-500", flag: "₿" },
  ETH: { name: "Ethereum", symbol: "Ξ", color: "bg-purple-500", flag: "Ξ" },
};

export default function Wallets() {
  const { data: wallets, isLoading, error } = useWallets();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Wallets</h1>
            <p className="text-gray-600">Manage your multi-currency accounts</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Wallets</h1>
          <p className="text-destructive">Failed to load wallet data</p>
        </div>
      </div>
    );
  }

  const totalBalance = wallets?.reduce((sum, wallet) => {
    if (wallet.walletType === 'fiat') {
      return sum + parseFloat(wallet.balance);
    }
    return sum;
  }, 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wallets</h1>
          <p className="text-gray-600">Manage your multi-currency accounts</p>
        </div>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Wallet
        </Button>
      </div>

      {/* Total Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Total Balance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary mb-4">
            ${totalBalance.toLocaleString()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Fiat Assets</p>
              <p className="text-lg font-semibold">
                ${wallets?.filter(w => w.walletType === 'fiat')
                  .reduce((sum, w) => sum + parseFloat(w.balance), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Crypto Assets</p>
              <p className="text-lg font-semibold">
                ${wallets?.filter(w => w.walletType === 'crypto')
                  .reduce((sum, w) => sum + (parseFloat(w.balance) * 43500), 0) // Mock BTC price
                  .toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Wallets</p>
              <p className="text-lg font-semibold">{wallets?.length || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets?.map((wallet) => {
          const config = currencyConfig[wallet.currency as keyof typeof currencyConfig];
          const balance = parseFloat(wallet.balance);
          const availableBalance = parseFloat(wallet.availableBalance);
          const utilizationPercent = balance > 0 ? (availableBalance / balance) * 100 : 0;
          
          return (
            <Card key={wallet.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config?.color || 'bg-gray-500'}`}>
                      <span className="text-white font-bold text-sm">
                        {config?.flag || wallet.currency.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{config?.name || wallet.currency}</h3>
                      <Badge variant={wallet.walletType === 'crypto' ? 'secondary' : 'outline'}>
                        {wallet.walletType === 'crypto' ? 'Crypto' : 'Fiat'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Balance</span>
                    <span className="font-semibold">
                      {wallet.walletType === 'crypto' 
                        ? `${balance.toFixed(4)} ${wallet.currency}`
                        : `${config?.symbol || '$'}${balance.toLocaleString()}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available</span>
                    <span className="font-semibold">
                      {wallet.walletType === 'crypto' 
                        ? `${availableBalance.toFixed(4)} ${wallet.currency}`
                        : `${config?.symbol || '$'}${availableBalance.toLocaleString()}`
                      }
                    </span>
                  </div>
                  <Progress value={utilizationPercent} className="h-2" />
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <PlusCircle className="w-3 h-3 mr-1" />
                    Deposit
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <MinusCircle className="w-3 h-3 mr-1" />
                    Withdraw
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    Transfer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
