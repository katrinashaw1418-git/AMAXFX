import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRightLeft } from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-green-100 text-green-800";
    case "pending":   return "bg-yellow-100 text-yellow-800";
    case "failed":    return "bg-red-100 text-red-800";
    default:          return "bg-gray-100 text-gray-800";
  }
};

const FX_TYPES = ["exchange", "crypto_buy", "crypto_sell", "stablecoin_swap"];

const formatAmount = (tx: any) => {
  const amount = parseFloat(tx.amount);
  if (tx.exchangeRate) {
    const rate = parseFloat(tx.exchangeRate);
    const received = (amount * rate).toLocaleString(undefined, { maximumFractionDigits: 6 });
    return `${amount.toLocaleString()} ${tx.fromCurrency} → ${received} ${tx.toCurrency}`;
  }
  return `${amount.toLocaleString()} ${tx.fromCurrency || tx.toCurrency}`;
};

export default function TransactionHistory() {
  const { data: allTransactions, isLoading, error } = useTransactions(50);

  const transactions = allTransactions
    ?.filter((tx: any) => FX_TYPES.includes(tx.type))
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Recent FX Exchanges
            </CardTitle>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Recent FX Exchanges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load exchange history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Recent FX Exchanges
          </CardTitle>
          <Link href="/transactions">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No exchange transactions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Exchange</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {tx.fromCurrency} → {tx.toCurrency}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{formatAmount(tx)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tx.status)}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
