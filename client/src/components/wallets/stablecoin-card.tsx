import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Upload, ArrowUpDown, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface StablecoinCardProps {
  currency: "USDT" | "USDC";
  balance: string;
  availableBalance: string;
  config: {
    name: string;
    symbol: string;
    color: string;
    flag: string;
  };
}

export default function StablecoinCard({ currency, balance, availableBalance, config }: StablecoinCardProps) {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const { toast } = useToast();

  // Mock wallet addresses for deposits
  const walletAddress = currency === "USDT" 
    ? "0x742d3a8F87A4CfA7a4D2a3B4a5F8C4e6D9E0f1a2"
    : "0x456e7B8F12C3d4e5F6a7B8c9D0e1F2a3B4c5D6e7";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawAddress) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Mock withdrawal process
    toast({
      title: "Withdrawal Initiated",
      description: `${withdrawAmount} ${currency} withdrawal to ${withdrawAddress.slice(0, 10)}... is being processed`,
    });
    setWithdrawModalOpen(false);
    setWithdrawAmount("");
    setWithdrawAddress("");
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center text-white font-bold`}>
              {config.flag}
            </div>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <p className="text-sm text-muted-foreground">ERC-20 Stablecoin</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Stable Value
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Balance</span>
            <span className="font-semibold">{config.symbol}{balance}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Available</span>
            <span className="text-sm">{config.symbol}{availableBalance}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">USD Value</span>
            <span className="text-sm font-medium">${balance}</span>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {currency} transactions settle on Ethereum blockchain. Gas fees apply for withdrawals.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-3 gap-2">
          <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                Deposit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit {currency}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border mx-auto w-fit mb-3">
                    <QrCode className="w-32 h-32 mx-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Scan QR code or copy address below</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Wallet Address (ERC-20)</Label>
                  <div className="flex space-x-2">
                    <Input 
                      value={walletAddress} 
                      readOnly 
                      className="font-mono text-xs"
                    />
                    <Button variant="outline" size="sm" onClick={handleCopyAddress}>
                      Copy
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Only send {currency} tokens to this address. Minimum deposit: 10 {currency}. 
                    Transactions require 1 block confirmation.
                  </AlertDescription>
                </Alert>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw {currency}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Destination Address</Label>
                  <Input 
                    placeholder="0x..." 
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {currency}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: {config.symbol}{availableBalance}
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Withdrawal fee: ~$15-25 (ETH gas). KYC verification required. 
                    Processing time: 5-30 minutes.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleWithdraw} className="w-full">
                  Initiate Withdrawal
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            Trade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}