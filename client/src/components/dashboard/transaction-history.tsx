import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRightLeft } from "lucide-react";

const FIAT_TYPES   = ["exchange", "deposit", "withdrawal", "transfer"];
const CRYPTO_TYPES = ["crypto_buy", "crypto_sell", "stablecoin_swap"];
const ALL_TYPES    = [...FIAT_TYPES, ...CRYPTO_TYPES];

type Filter = "all" | "fiat" | "crypto";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-green-100 text-green-800";
    case "pending":   return "bg-yellow-100 text-yellow-800";
    case "failed":    return "bg-red-100 text-red-800";
    default:          return "bg-gray-100 text-gray-800";
  }
};

const formatAmount = (tx: any) => {
  const amount = parseFloat(tx.amount);
  if (tx.exchangeRate && tx.fromCurrency && tx.toCurrency) {
    const rate     = parseFloat(tx.exchangeRate);
    const received = (amount * rate).toLocaleString(undefined, { maximumFractionDigits: 6 });
    return `${amount.toLocaleString()} ${tx.fromCurrency} → ${received} ${tx.toCurrency}`;
  }
  if (tx.type === "deposit")    return `+${amount.toLocaleString()} ${tx.toCurrency || tx.fromCurrency}`;
  if (tx.type === "withdrawal") return `-${amount.toLocaleString()} ${tx.fromCurrency || tx.toCurrency}`;
  return `${amount.toLocaleString()} ${tx.fromCurrency || tx.toCurrency}`;
};

const typeLabel = (type: string) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function TransactionHistory() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: allTx, isLoading, error } = useTransactions(100);

  const typeSet =
    filter === "fiat"   ? FIAT_TYPES   :
    filter === "crypto" ? CRYPTO_TYPES :
    ALL_TYPES;

  const transactions = allTx
    ?.filter((tx: any) => typeSet.includes(tx.type))
    .slice(0, 6);

  const filterBtn = (f: Filter, label: string) => (
    <button
      onClick={() => setFilter(f)}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        filter === f
          ? "bg-slate-800 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" /> Recent Transactions
            </CardTitle>
            <Skeleton className="h-9 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <Skeleton className="h-4 w-48" />
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" /> Recent Transactions
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-full border">
              {filterBtn("all",    "All")}
              {filterBtn("fiat",   "Fiat")}
              {filterBtn("crypto", "Crypto")}
            </div>
            <Link href="/transactions">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No {filter !== "all" ? filter + " " : ""}transactions yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {typeLabel(tx.type)}
                    </Badge>
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
