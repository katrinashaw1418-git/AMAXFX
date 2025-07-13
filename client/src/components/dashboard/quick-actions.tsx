import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronRight, TrendingUp } from "lucide-react";

const tradingPairs = [
  { symbol: 'BTC', name: 'Bitcoin', color: 'text-orange-600' },
  { symbol: 'ETH', name: 'Ethereum', color: 'text-blue-600' },
  { symbol: 'USDT', name: 'Tether', color: 'text-green-600' },
  { symbol: 'USDC', name: 'USD Coin', color: 'text-purple-600' },
];

export default function QuickActions() {
  const handleTrade = (symbol: string) => {
    window.open(`https://virgocx.com/trade/${symbol.toLowerCase()}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tradingPairs.map((pair) => (
            <Button
              key={pair.symbol}
              variant="outline"
              className="w-full justify-between p-4 h-auto"
              onClick={() => handleTrade(pair.symbol)}
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className={`w-4 h-4 ${pair.color}`} />
                <span className="font-medium">Trade {pair.symbol}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ))}
          
          <Button
            variant="outline"
            className="w-full justify-between p-4 h-auto"
            onClick={() => window.open('https://virgocx.com/account', '_blank')}
          >
            <div className="flex items-center space-x-3">
              <PlusCircle className="w-4 h-4 text-secondary" />
              <span className="font-medium">VirgoCX Account</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
