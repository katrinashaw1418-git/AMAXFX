import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "deposit":
      return "bg-green-100 text-green-800";
    case "withdrawal":
      return "bg-red-100 text-red-800";
    case "exchange":
      return "bg-blue-100 text-blue-800";
    case "transfer":
      return "bg-purple-100 text-purple-800";
    case "crypto_buy":
    case "crypto_sell":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatTransactionAmount = (transaction: any) => {
  const amount = parseFloat(transaction.amount);
  
  if (transaction.type === "exchange") {
    return `${amount.toLocaleString()} ${transaction.fromCurrency} → ${transaction.toCurrency}`;
  }
  
  if (transaction.type === "deposit") {
    return `+${amount.toLocaleString()} ${transaction.toCurrency}`;
  }
  
  if (transaction.type === "withdrawal") {
    return `-${amount.toLocaleString()} ${transaction.fromCurrency}`;
  }
  
  if (transaction.type === "crypto_buy") {
    return `${amount} ${transaction.toCurrency}`;
  }
  
  return `${amount.toLocaleString()} ${transaction.fromCurrency || transaction.toCurrency}`;
};

export default function TransactionHistory() {
  const { data: transactions, isLoading, error } = useTransactions(4);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
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
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load transaction history</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/transactions">
            <Button variant="outline">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((transaction: any) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(transaction.type)}>
                    {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{formatTransactionAmount(transaction)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
