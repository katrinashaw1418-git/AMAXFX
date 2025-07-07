import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function TestApi() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: async () => {
      const response = await apiRequest('/api/transactions');
      return response;
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      return await apiRequest('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      toast({
        title: "Transaction Created",
        description: `Transaction ${data.id} created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create transaction: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    await createTransactionMutation.mutateAsync({
      type: "deposit",
      toCurrency: currency,
      amount: amount,
      description: `Test ${currency} deposit`,
      status: "completed",
      fee: 0.00,
    });

    setAmount("");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Test Page</h1>
        <p className="text-gray-600">Test the transaction API functionality</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Test Transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
              <option value="USD">USD</option>
              <option value="BTC">BTC</option>
            </select>
          </div>
          <Button 
            onClick={handleCreateTransaction}
            disabled={createTransactionMutation.isPending}
            className="w-full"
          >
            {createTransactionMutation.isPending ? "Creating..." : "Create Test Transaction"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading transactions...</p>
          ) : (
            <div className="space-y-2">
              {transactions?.slice(0, 5).map((transaction: any) => (
                <div key={transaction.id} className="p-3 border rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.type} • {transaction.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{transaction.amount}</p>
                      <p className="text-sm text-gray-500">
                        {transaction.toCurrency || transaction.fromCurrency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}