import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, Eye, ArrowRightLeft, Wallet } from "lucide-react";

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
    const exchangeRate = parseFloat(transaction.exchangeRate);
    const convertedAmount = amount * exchangeRate;
    return `${amount.toLocaleString()} ${transaction.fromCurrency} → ${convertedAmount.toLocaleString()} ${transaction.toCurrency}`;
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

const formatTransactionFee = (transaction: any) => {
  const fee = parseFloat(transaction.fee);
  if (fee === 0) return "Free";
  return `${fee.toFixed(2)} ${transaction.fromCurrency || transaction.toCurrency}`;
};

const FX_TYPES = ["exchange", "crypto_buy", "crypto_sell"];
const WALLET_TYPES = ["deposit", "withdrawal", "transfer"];

function TransactionTable({ transactions, searchTerm, statusFilter }: {
  transactions: any[];
  searchTerm: string;
  statusFilter: string;
}) {
  const filtered = transactions.filter((transaction: any) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.fromCurrency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.toCurrency?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date & Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Fee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((transaction: any) => (
          <TableRow key={transaction.id}>
            <TableCell>
              <div>
                <p className="font-medium">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(transaction.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getTypeColor(transaction.type)}>
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1).replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{transaction.description}</p>
                {transaction.exchangeRate && (
                  <p className="text-sm text-gray-600">
                    Rate: 1 {transaction.fromCurrency} = {parseFloat(transaction.exchangeRate).toFixed(4)}{" "}
                    {transaction.toCurrency}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <p className="font-medium">{formatTransactionAmount(transaction)}</p>
            </TableCell>
            <TableCell>
              <p className="text-sm">{formatTransactionFee(transaction)}</p>
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: transactions, isLoading, error } = useTransactions();

  const fxTransactions = transactions?.filter((t: any) => FX_TYPES.includes(t.type)) || [];
  const walletTransactions = transactions?.filter((t: any) => WALLET_TYPES.includes(t.type)) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Transactions</h1>
          <p className="text-destructive">Failed to load transaction history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-gray-600">FX exchange and wallet transaction records</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">FX Exchange Transactions</h3>
            <p className="text-2xl font-bold text-blue-600">{fxTransactions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Currency conversions & crypto</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Transactions</h3>
            <p className="text-2xl font-bold text-purple-600">{walletTransactions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Deposits, withdrawals & transfers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {transactions?.filter((t: any) => t.status === "pending").length || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by description or currency..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Transaction Views */}
      <Tabs defaultValue="fx">
        <TabsList>
          <TabsTrigger value="fx" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            FX Exchange
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fx">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>FX Exchange Transactions</CardTitle>
                <p className="text-sm text-gray-500">Currency conversions and crypto exchange</p>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={fxTransactions}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Wallet Transactions</CardTitle>
                <p className="text-sm text-gray-500">Deposits, withdrawals, and transfers</p>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionTable
                transactions={walletTransactions}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
