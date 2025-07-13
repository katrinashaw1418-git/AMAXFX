import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ExternalLink, ArrowRightLeft, TrendingUp, Send, QrCode } from 'lucide-react';

interface VirgoCXIntegrationProps {
  currency: string;
  balance: string;
  onTransactionComplete?: () => void;
}

// Market data component
function VirgoCXMarketData() {
  const { data: marketData } = useQuery({
    queryKey: ['/api/virgocx/market-data'],
    queryFn: () => apiRequest('GET', '/api/virgocx/market-data').then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          VirgoCX Market Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">BTC/CAD</div>
            <div className="font-semibold">$129,850</div>
            <div className="text-xs text-green-600">+2.4%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">ETH/CAD</div>
            <div className="font-semibold">$4,420</div>
            <div className="text-xs text-green-600">+1.8%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">USDT/CAD</div>
            <div className="font-semibold">$1.37</div>
            <div className="text-xs text-gray-400">-0.1%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">USDC/CAD</div>
            <div className="font-semibold">$1.37</div>
            <div className="text-xs text-gray-400">0.0%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VirgoCXIntegration({ currency, balance, onTransactionComplete }: VirgoCXIntegrationProps) {
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const { toast } = useToast();

  // Check if currency is supported by VirgoCX
  const supportedCurrencies = ['BTC', 'ETH', 'USDT', 'USDC'];
  const isSupported = supportedCurrencies.includes(currency);

  // Trade mutation
  const tradeMutation = useMutation({
    mutationFn: async (data: { currency: string; amount: string; action: 'buy' | 'sell' }) => {
      const response = await apiRequest('POST', '/api/virgocx/trade', data);
      if (!response.ok) throw new Error('Trade failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Trade Executed",
        description: `Successfully executed ${currency} trade on VirgoCX`,
      });
      setShowTradeDialog(false);
      setTradeAmount('');
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      onTransactionComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async (data: { currency: string; amount: string; address: string }) => {
      const response = await apiRequest('POST', '/api/virgocx/send', data);
      if (!response.ok) throw new Error('Send failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Transfer Initiated",
        description: `Successfully sent ${sendAmount} ${currency} to VirgoCX`,
      });
      setShowSendDialog(false);
      setSendAmount('');
      setSendAddress('');
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      onTransactionComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleTrade = (action: 'buy' | 'sell') => {
    if (!tradeAmount) {
      toast({
        title: "Missing Amount",
        description: "Please enter an amount to trade",
        variant: "destructive",
      });
      return;
    }

    tradeMutation.mutate({
      currency,
      amount: tradeAmount,
      action
    });
  };

  const handleSend = () => {
    if (!sendAmount || !sendAddress) {
      toast({
        title: "Missing Information",
        description: "Please enter both amount and destination address",
        variant: "destructive",
      });
      return;
    }

    sendMutation.mutate({
      currency,
      amount: sendAmount,
      address: sendAddress
    });
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Market Data */}
      <VirgoCXMarketData />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTradeDialog(true)}
          className="flex items-center gap-2"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Trade on VirgoCX
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSendDialog(true)}
          className="flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send to VirgoCX
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open('https://virgocx.ca', '_blank')}
          className="flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Open VirgoCX
        </Button>
      </div>

      {/* Trade Dialog */}
      <Dialog open={showTradeDialog} onOpenChange={setShowTradeDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Trade {currency} on VirgoCX</DialogTitle>
            <DialogDescription>
              Execute trades directly on VirgoCX with pre-filled data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Balance</span>
                <span className="font-medium">{balance} {currency}</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="trade-amount">Amount</Label>
              <Input
                id="trade-amount"
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleTrade('buy')}
                disabled={tradeMutation.isPending}
                className="flex-1"
              >
                Buy {currency}
              </Button>
              <Button
                onClick={() => handleTrade('sell')}
                disabled={tradeMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                Sell {currency}
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Trades will be executed at current market prices on VirgoCX
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Send {currency} to VirgoCX</DialogTitle>
            <DialogDescription>
              Transfer {currency} to your VirgoCX account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Balance</span>
                <span className="font-medium">{balance} {currency}</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="send-amount">Amount</Label>
              <Input
                id="send-amount"
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label htmlFor="send-address">VirgoCX Deposit Address</Label>
              <Input
                id="send-address"
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
                placeholder="Enter VirgoCX deposit address"
              />
              <div className="text-xs text-gray-500 mt-1">
                Get this from your VirgoCX account under Deposit → {currency}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending}
                className="flex-1"
              >
                {sendMutation.isPending ? "Sending..." : "Send to VirgoCX"}
              </Button>
              <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                Cancel
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Network fees will be automatically calculated
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}