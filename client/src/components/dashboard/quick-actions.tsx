import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle, ArrowRightLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "BTC", name: "Bitcoin" },
  { code: "ETH", name: "Ethereum" },
];

export default function QuickActions() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositData, setDepositData] = useState({ currency: "", amount: "", description: "" });
  const [withdrawData, setWithdrawData] = useState({ currency: "", amount: "", description: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: (data: { currency: string; amount: number; description?: string }) =>
      api.createDeposit(data),
    onSuccess: () => {
      toast({
        title: "Deposit Initiated",
        description: "Your deposit request has been submitted successfully.",
      });
      setDepositOpen(false);
      setDepositData({ currency: "", amount: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: () => {
      toast({
        title: "Deposit Failed",
        description: "There was an error processing your deposit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { currency: string; amount: number; description?: string }) =>
      api.createWithdrawal(data),
    onSuccess: () => {
      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal request has been submitted successfully.",
      });
      setWithdrawOpen(false);
      setWithdrawData({ currency: "", amount: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: () => {
      toast({
        title: "Withdrawal Failed",
        description: "There was an error processing your withdrawal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeposit = () => {
    if (!depositData.currency || !depositData.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    depositMutation.mutate({
      currency: depositData.currency,
      amount: parseFloat(depositData.amount),
      description: depositData.description || undefined,
    });
  };

  const handleWithdraw = () => {
    if (!withdrawData.currency || !withdrawData.amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      currency: withdrawData.currency,
      amount: parseFloat(withdrawData.amount),
      description: withdrawData.description || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <PlusCircle className="w-4 h-4 text-secondary" />
                  <span className="font-medium">Deposit Funds</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deposit Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deposit-currency">Currency</Label>
                  <Select value={depositData.currency} onValueChange={(value) => setDepositData({...depositData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="deposit-amount">Amount</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    value={depositData.amount}
                    onChange={(e) => setDepositData({...depositData, amount: e.target.value})}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="deposit-description">Description (Optional)</Label>
                  <Textarea
                    id="deposit-description"
                    value={depositData.description}
                    onChange={(e) => setDepositData({...depositData, description: e.target.value})}
                    placeholder="Enter description"
                  />
                </div>
                <Button onClick={handleDeposit} disabled={depositMutation.isPending} className="w-full">
                  {depositMutation.isPending ? "Processing..." : "Submit Deposit"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between p-4 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <MinusCircle className="w-4 h-4 text-primary" />
                  <span className="font-medium">Withdraw</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="withdraw-currency">Currency</Label>
                  <Select value={withdrawData.currency} onValueChange={(value) => setWithdrawData({...withdrawData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="withdraw-amount">Amount</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawData.amount}
                    onChange={(e) => setWithdrawData({...withdrawData, amount: e.target.value})}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label htmlFor="withdraw-description">Description (Optional)</Label>
                  <Textarea
                    id="withdraw-description"
                    value={withdrawData.description}
                    onChange={(e) => setWithdrawData({...withdrawData, description: e.target.value})}
                    placeholder="Enter description"
                  />
                </div>
                <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending} className="w-full">
                  {withdrawMutation.isPending ? "Processing..." : "Submit Withdrawal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="w-full justify-between p-4 h-auto"
            onClick={() => window.location.href = "/fx-exchange"}
          >
            <div className="flex items-center space-x-3">
              <ArrowRightLeft className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Transfer</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
