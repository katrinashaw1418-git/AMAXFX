import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTransactions } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, Eye, ArrowRightLeft, Wallet, X } from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "bg-green-100 text-green-800";
    case "pending":   return "bg-yellow-100 text-yellow-800";
    case "failed":    return "bg-red-100 text-red-800";
    default:          return "bg-gray-100 text-gray-800";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "deposit":                  return "bg-green-100 text-green-800";
    case "withdrawal":               return "bg-red-100 text-red-800";
    case "exchange":                 return "bg-blue-100 text-blue-800";
    case "transfer":                 return "bg-purple-100 text-purple-800";
    case "crypto_buy":
    case "crypto_sell":              return "bg-yellow-100 text-yellow-800";
    default:                         return "bg-gray-100 text-gray-800";
  }
};

const formatTypeLabel = (type: string) => {
  switch (type) {
    case "deposit":    return "Transfer In";
    case "withdrawal": return "Transfer Out";
    case "exchange":   return "FX Conversion";
    case "transfer":   return "Currency Conversion";
    case "crypto_buy":  return "Digital Asset Buy";
    case "crypto_sell": return "Digital Asset Sell";
    default: return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
  }
};

const formatTransactionAmount = (transaction: any) => {
  const amount = parseFloat(transaction.amount);
  if (isNaN(amount)) return "—";

  if (transaction.type === "exchange" && transaction.exchangeRate && transaction.fromCurrency && transaction.toCurrency) {
    const rate = parseFloat(transaction.exchangeRate);
    const converted = isNaN(rate) ? 0 : amount * rate;
    return `${amount.toLocaleString()} ${transaction.fromCurrency} → ${converted.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${transaction.toCurrency}`;
  }
  if (transaction.type === "deposit")    return `+${amount.toLocaleString()} ${transaction.toCurrency ?? ""}`;
  if (transaction.type === "withdrawal") return `-${amount.toLocaleString()} ${transaction.fromCurrency ?? ""}`;
  if (transaction.type === "crypto_buy") return `${amount} ${transaction.toCurrency ?? ""}`;
  return `${amount.toLocaleString()} ${transaction.fromCurrency ?? transaction.toCurrency ?? ""}`;
};

const formatTransactionFee = (transaction: any) => {
  const fee = parseFloat(transaction.fee);
  if (!fee || fee === 0) return "Free";
  return `${fee.toFixed(2)} ${transaction.fromCurrency ?? transaction.toCurrency ?? ""}`;
};

function downloadCsv(transactions: any[], filename: string) {
  const headers = ["Date", "Time", "Type", "Description", "From Currency", "To Currency", "Amount", "Fee", "Exchange Rate", "Status"];
  const rows = transactions.map((t: any) => [
    new Date(t.createdAt).toLocaleDateString(),
    new Date(t.createdAt).toLocaleTimeString(),
    t.type,
    `"${(t.description ?? "").replace(/"/g, '""')}"`,
    t.fromCurrency ?? "",
    t.toCurrency ?? "",
    parseFloat(t.amount).toLocaleString(),
    parseFloat(t.fee).toFixed(2),
    t.exchangeRate ? parseFloat(t.exchangeRate).toFixed(6) : "",
    t.status,
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Transaction Detail Modal ──────────────────────────────────────────────────
function TransactionDetailModal({ transaction, onClose }: { transaction: any; onClose: () => void }) {
  const amount = parseFloat(transaction.amount);
  const fee    = parseFloat(transaction.fee);
  const rate   = transaction.exchangeRate ? parseFloat(transaction.exchangeRate) : null;

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-start py-2 border-b last:border-0">
      <span className="text-sm text-gray-500 min-w-[140px]">{label}</span>
      <span className="text-sm font-medium text-right max-w-[220px] break-all">{value ?? "—"}</span>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            Transaction Record
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type + Status badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={getTypeColor(transaction.type)}>{formatTypeLabel(transaction.type)}</Badge>
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Badge>
            {transaction.riskFlag && (
              <Badge className="bg-red-100 text-red-800">Risk Flagged</Badge>
            )}
          </div>

          {/* Core details */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-0">
            <Row label="Transaction ID" value={`#${transaction.id}`} />
            <Row label="Date" value={new Date(transaction.createdAt).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" })} />
            <Row label="Time" value={new Date(transaction.createdAt).toLocaleTimeString("en-AU")} />
            <Row label="Description" value={transaction.description} />
            <Row label="Direction" value={transaction.direction === "in" ? "↓ Incoming" : transaction.direction === "out" ? "↑ Outgoing" : transaction.direction} />
          </div>

          {/* Amount details */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-0">
            <Row
              label="Amount"
              value={
                transaction.type === "exchange" && rate
                  ? `${amount.toLocaleString()} ${transaction.fromCurrency} → ${(amount * rate).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${transaction.toCurrency}`
                  : `${amount.toLocaleString()} ${transaction.toCurrency ?? transaction.fromCurrency ?? ""}`
              }
            />
            <Row label="Fee" value={fee === 0 ? "Free" : `${fee.toFixed(4)} ${transaction.fromCurrency ?? transaction.toCurrency ?? ""}`} />
            {rate && (
              <Row label="Exchange Rate" value={`1 ${transaction.fromCurrency} = ${rate.toFixed(6)} ${transaction.toCurrency}`} />
            )}
            {transaction.fromCurrency && <Row label="From Currency" value={transaction.fromCurrency} />}
            {transaction.toCurrency   && <Row label="To Currency"   value={transaction.toCurrency} />}
          </div>

          {/* Settlement / compliance */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-0">
            <Row label="Asset Type" value={transaction.assetType} />
            <Row label="Settlement Status" value={transaction.settlementStatus?.replace(/_/g, " ")} />
            <Row label="Review Status" value={transaction.reviewStatus} />
            {transaction.reviewNotes && <Row label="Review Notes" value={transaction.reviewNotes} />}
            {transaction.blockchainTxHash && <Row label="Blockchain Tx" value={transaction.blockchainTxHash} />}
            {transaction.sourceExchange  && <Row label="Source Exchange" value={transaction.sourceExchange} />}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="w-3 h-3 mr-1" /> Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Transaction Table ─────────────────────────────────────────────────────────
const FX_TYPES     = ["exchange", "crypto_buy", "crypto_sell"];
const WALLET_TYPES = ["deposit", "withdrawal", "transfer"];

function TransactionTable({ transactions, searchTerm, statusFilter }: {
  transactions: any[];
  searchTerm: string;
  statusFilter: string;
}) {
  const [viewTx, setViewTx] = useState<any | null>(null);

  const filtered = transactions.filter((t: any) => {
    const matchesSearch =
      (t.description ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.fromCurrency ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.toCurrency   ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    return <div className="text-center py-12"><p className="text-gray-500">No transactions found</p></div>;
  }

  return (
    <>
      {viewTx && <TransactionDetailModal transaction={viewTx} onClose={() => setViewTx(null)} />}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date &amp; Time</TableHead>
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
                  <p className="font-medium">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{new Date(transaction.createdAt).toLocaleTimeString()}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getTypeColor(transaction.type)}>
                  {formatTypeLabel(transaction.type)}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  {transaction.exchangeRate && (
                    <p className="text-sm text-gray-600">
                      Rate: 1 {transaction.fromCurrency} = {parseFloat(transaction.exchangeRate).toFixed(4)} {transaction.toCurrency}
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
                <Button size="sm" variant="outline" onClick={() => setViewTx(transaction)}>
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Transactions() {
  const [searchTerm, setSearchTerm]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab]       = useState("fx");
  const { toast }                       = useToast();

  const { data: transactions, isLoading, error } = useTransactions();

  const fxTransactions     = transactions?.filter((t: any) => FX_TYPES.includes(t.type))     ?? [];
  const walletTransactions = transactions?.filter((t: any) => WALLET_TYPES.includes(t.type)) ?? [];

  function handleExport() {
    const data = activeTab === "fx" ? fxTransactions : walletTransactions;
    if (!data.length) {
      toast({ title: "Nothing to export", description: "No transactions in this tab.", variant: "destructive" });
      return;
    }
    const label = activeTab === "fx" ? "FX" : "Wallet";
    downloadCsv(data, `amax-${label.toLowerCase()}-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: "Export ready", description: `${data.length} ${label} transaction(s) downloaded as CSV.` });
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-6 w-16" /><Skeleton className="h-4 w-48" />
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
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Transactions</h1>
        <p className="text-destructive">Failed to load transaction history</p>
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
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">FX Exchange Transactions</h3>
            <p className="text-2xl font-bold text-blue-600">{fxTransactions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Currency conversions &amp; crypto</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Transactions</h3>
            <p className="text-2xl font-bold text-purple-600">{walletTransactions.length}</p>
            <p className="text-sm text-gray-600 mt-1">Transfer In, Transfer Out &amp; conversions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {transactions?.filter((t: any) => t.status === "pending").length ?? 0}
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by description or currency..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fx" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" /> FX Exchange
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Transfers
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
              <TransactionTable transactions={fxTransactions} searchTerm={searchTerm} statusFilter={statusFilter} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transfer Transactions</CardTitle>
                <p className="text-sm text-gray-500">Transfer In, Transfer Out, and currency conversions</p>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionTable transactions={walletTransactions} searchTerm={searchTerm} statusFilter={statusFilter} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
