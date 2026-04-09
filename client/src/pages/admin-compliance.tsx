import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Shield, AlertTriangle, Users, FileText, Lock, Unlock,
  CheckCircle, XCircle, Eye, Clock, ChevronRight,
} from "lucide-react";

const ADMIN_KEY_STORAGE = "amax_admin_key";

function getAdminKey() {
  return typeof window !== "undefined" ? (localStorage.getItem(ADMIN_KEY_STORAGE) ?? "") : "";
}

function adminHeaders() {
  return { "x-admin-key": getAdminKey() };
}

function riskBadge(level?: string | null) {
  if (!level) return <Badge variant="outline">Unknown</Badge>;
  const colors: Record<string, string> = {
    low:    "bg-green-100 text-green-800 border-green-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    high:   "bg-red-100 text-red-800 border-red-200",
  };
  return <Badge className={colors[level] ?? "bg-gray-100 text-gray-800"}>{level.toUpperCase()}</Badge>;
}

function kycBadge(status?: string | null) {
  const map: Record<string, string> = {
    verified:   "bg-green-100 text-green-800",
    pending:    "bg-gray-100 text-gray-800",
    rejected:   "bg-red-100 text-red-800",
    under_review: "bg-amber-100 text-amber-800",
  };
  return <Badge className={map[status ?? ""] ?? "bg-gray-100 text-gray-800"}>{status ?? "unknown"}</Badge>;
}

export default function AdminCompliance() {
  const { toast } = useToast();
  const [adminKey, setAdminKey] = useState(getAdminKey());
  const [authed, setAuthed] = useState(Boolean(getAdminKey()));
  const [keyInput, setKeyInput] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  // Freeze/unfreeze dialog
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [freezeUserId, setFreezeUserId] = useState<number | null>(null);
  const [freezeAction, setFreezeAction] = useState<"freeze" | "unfreeze">("freeze");
  const [freezeNotes, setFreezeNotes] = useState("");

  // SMR dialog
  const [smrDialogOpen, setSmrDialogOpen] = useState(false);
  const [smrUserId, setSmrUserId] = useState<number | null>(null);
  const [smrTxId, setSmrTxId] = useState("");
  const [smrNotes, setSmrNotes] = useState("");
  const [smrOutcome, setSmrOutcome] = useState("filed");
  const [smrRef, setSmrRef] = useState("");

  function handleAuthSubmit() {
    localStorage.setItem(ADMIN_KEY_STORAGE, keyInput);
    setAdminKey(keyInput);
    setAuthed(true);
  }

  const { data: pendingExchanges = [], refetch: refetchExchanges } = useQuery<any[]>({
    queryKey: ["/api/admin/pending-exchanges"],
    enabled: authed,
    queryFn: () =>
      fetch("/api/admin/pending-exchanges", { headers: adminHeaders() }).then(r => r.json()),
    refetchInterval: 30000,
  });

  const completeExchangeMutation = useMutation({
    mutationFn: (txId: number) =>
      fetch(`/api/admin/transactions/${txId}/complete-exchange`, { method: "POST", headers: adminHeaders() }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: "Exchange Settled", description: data.message });
      refetchExchanges();
    },
    onError: () => toast({ title: "Error", description: "Failed to complete exchange", variant: "destructive" }),
  });

  const failExchangeMutation = useMutation({
    mutationFn: (txId: number) =>
      fetch(`/api/admin/transactions/${txId}/fail`, { method: "POST", headers: adminHeaders() }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: "Exchange Failed", description: data.message });
      refetchExchanges();
    },
    onError: () => toast({ title: "Error", description: "Failed to fail exchange", variant: "destructive" }),
  });

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: authed,
    queryFn: () =>
      fetch("/api/admin/users", { headers: adminHeaders() }).then(r => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      }),
  });

  const { data: alerts = [], refetch: refetchAlerts } = useQuery<any[]>({
    queryKey: ["/api/admin/compliance/alerts"],
    enabled: authed,
    queryFn: () =>
      fetch("/api/admin/compliance/alerts", { headers: adminHeaders() }).then(r => r.json()),
  });

  const { data: actions = [], refetch: refetchActions } = useQuery<any[]>({
    queryKey: ["/api/admin/compliance/actions"],
    enabled: authed,
    queryFn: () =>
      fetch("/api/admin/compliance/actions", { headers: adminHeaders() }).then(r => r.json()),
  });

  const freezeMutation = useMutation({
    mutationFn: ({ userId, action, notes }: { userId: number; action: "freeze" | "unfreeze"; notes: string }) =>
      fetch(`/api/admin/${action}/${userId}`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: data.message ?? "Done", description: "Account status updated." });
      setFreezeDialogOpen(false);
      setFreezeNotes("");
      refetchUsers();
    },
    onError: () => toast({ title: "Error", description: "Failed to update account.", variant: "destructive" }),
  });

  const identityApproveMutation = useMutation({
    mutationFn: ({ userId }: { userId: number }) =>
      fetch(`/api/admin/identity/approve/${userId}`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Identity manually approved by compliance officer via admin dashboard" }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: "Identity Approved", description: data.message ?? "Identity verification marked as approved." });
      refetchUsers();
    },
    onError: () => toast({ title: "Error", description: "Failed to approve identity.", variant: "destructive" }),
  });

  const addressApproveMutation = useMutation({
    mutationFn: ({ userId }: { userId: number }) =>
      fetch(`/api/admin/kyc/approve-address/${userId}`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Proof of Address document approved by compliance officer via admin dashboard" }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: "Address Approved", description: data.message ?? "Proof of Address document approved." });
      refetchUsers();
    },
    onError: () => toast({ title: "Error", description: "Failed to approve address document.", variant: "destructive" }),
  });

  const smrMutation = useMutation({
    mutationFn: (payload: any) =>
      fetch("/api/admin/compliance/smr", {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: (data) => {
      toast({ title: "SMR logged", description: data.message ?? "Suspicious Matter Report recorded." });
      setSmrDialogOpen(false);
      setSmrNotes(""); setSmrTxId(""); setSmrRef(""); setSmrUserId(null);
      refetchActions();
    },
    onError: () => toast({ title: "Error", description: "Failed to log SMR.", variant: "destructive" }),
  });

  const alertReviewMutation = useMutation({
    mutationFn: ({ flagId, outcome }: { flagId: number; outcome: string }) =>
      fetch("/api/admin/compliance/alert-review", {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, outcome }),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Alert updated" });
      refetchAlerts();
    },
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-600" />
              <CardTitle>AMAX Compliance Portal</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Restricted — Authorised personnel only</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Admin Key</Label>
              <Input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="Enter admin key"
                onKeyDown={e => e.key === "Enter" && handleAuthSubmit()}
              />
            </div>
            <Button className="w-full" onClick={handleAuthSubmit}>Access Portal</Button>
            <p className="text-xs text-muted-foreground text-center">
              All access to this portal is logged. Unauthorised access is prohibited.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AMAX Compliance Dashboard</h1>
              <p className="text-sm text-slate-500">AML/CTF Program v2.1 — Compliance Officer: Qin Xiong</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
              {alerts.filter((a: any) => a.status === "open").length} Open Alerts
            </Badge>
            <Button variant="outline" size="sm" onClick={() => {
              localStorage.removeItem(ADMIN_KEY_STORAGE);
              setAuthed(false);
              setAdminKey("");
            }}>Sign Out</Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">KYC Verified</p>
              <p className="text-2xl font-bold text-green-600">{users.filter((u: any) => u.kycStatus === "verified").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Frozen Accounts</p>
              <p className="text-2xl font-bold text-red-600">{users.filter((u: any) => u.accountFrozen).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Open AML Alerts</p>
              <p className="text-2xl font-bold text-amber-600">{alerts.filter((a: any) => a.status === "open").length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-1" /> Users
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertTriangle className="w-4 h-4 mr-1" /> AML Alerts ({alerts.filter((a: any) => a.status === "open").length})
            </TabsTrigger>
            <TabsTrigger value="settlements">
              <Clock className="w-4 h-4 mr-1" /> Pending Settlements {pendingExchanges.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">{pendingExchanges.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="actions">
              <FileText className="w-4 h-4 mr-1" /> Action Log
            </TabsTrigger>
            <TabsTrigger value="reporting">
              <Shield className="w-4 h-4 mr-1" /> Log SMR/TTR
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Register</CardTitle>
                <p className="text-xs text-muted-foreground">AML/CTF Program v2.1 §15 — Customer Due Diligence Register</p>
              </CardHeader>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">No users found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-slate-600">ID</th>
                          <th className="text-left p-3 font-medium text-slate-600">Name / Email</th>
                          <th className="text-left p-3 font-medium text-slate-600">KYC Status</th>
                          <th className="text-left p-3 font-medium text-slate-600">Profile</th>
                          <th className="text-left p-3 font-medium text-slate-600">ID Verified</th>
                          <th className="text-left p-3 font-medium text-slate-600">Risk</th>
                          <th className="text-left p-3 font-medium text-slate-600">PEP</th>
                          <th className="text-left p-3 font-medium text-slate-600">Status</th>
                          <th className="text-left p-3 font-medium text-slate-600">KYC Refresh</th>
                          <th className="text-left p-3 font-medium text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {users.map((u: any) => (
                          <tr key={u.id} className={u.accountFrozen ? "bg-red-50" : "hover:bg-slate-50"}>
                            <td className="p-3 text-slate-500">#{u.id}</td>
                            <td className="p-3">
                              <div className="font-medium">{u.firstName} {u.lastName}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </td>
                            <td className="p-3">{kycBadge(u.kycStatus)}</td>
                            <td className="p-3">
                              {u.kycProfileComplete
                                ? <Badge className="bg-green-100 text-green-800">Complete</Badge>
                                : <Badge className="bg-gray-100 text-gray-800">Incomplete</Badge>}
                            </td>
                            <td className="p-3">
                              {u.idVerificationComplete
                                ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1 inline" />Verified</Badge>
                                : u.idDocsSubmitted
                                  ? <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1 inline" />Under Review</Badge>
                                  : <Badge className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1 inline" />Pending</Badge>}
                            </td>
                            <td className="p-3">{riskBadge(u.riskLevel)}</td>
                            <td className="p-3">
                              {u.pepDeclaration
                                ? <Badge className="bg-red-100 text-red-800">PEP Declared</Badge>
                                : <span className="text-slate-400 text-xs">No</span>}
                            </td>
                            <td className="p-3">
                              {u.accountFrozen
                                ? <Badge className="bg-red-100 text-red-800">FROZEN</Badge>
                                : <Badge className="bg-green-100 text-green-800">Active</Badge>}
                            </td>
                            <td className="p-3 text-xs text-slate-500">
                              {u.kycRefreshDue ? new Date(u.kycRefreshDue).toLocaleDateString("en-AU") : "—"}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                {u.accountFrozen ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-green-700 border-green-200"
                                    onClick={() => {
                                      setFreezeUserId(u.id);
                                      setFreezeAction("unfreeze");
                                      setFreezeDialogOpen(true);
                                    }}
                                  >
                                    <Unlock className="w-3 h-3 mr-1" /> Unfreeze
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-700 border-red-200"
                                    onClick={() => {
                                      setFreezeUserId(u.id);
                                      setFreezeAction("freeze");
                                      setFreezeDialogOpen(true);
                                    }}
                                  >
                                    <Lock className="w-3 h-3 mr-1" /> Freeze
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setSmrUserId(u.id);
                                    setSmrDialogOpen(true);
                                    setActiveTab("reporting");
                                  }}
                                >
                                  <FileText className="w-3 h-3 mr-1" /> SMR
                                </Button>
                                {!u.idVerificationComplete && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-blue-700 border-blue-200"
                                    disabled={identityApproveMutation.isPending}
                                    onClick={() => identityApproveMutation.mutate({ userId: u.id })}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" /> Verify ID
                                  </Button>
                                )}
                                {u.addressDocFilename && !u.addressDocApproved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-green-700 border-green-200"
                                    disabled={addressApproveMutation.isPending}
                                    onClick={() => addressApproveMutation.mutate({ userId: u.id })}
                                    title={`Approve address doc: ${u.addressDocFilename}`}
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" /> Approve Address
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AML Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AML Alert Queue</CardTitle>
                <p className="text-xs text-muted-foreground">System-generated alerts from transaction monitoring rules. Review within 5 business days (AUSTRAC guidance).</p>
              </CardHeader>
              <CardContent className="p-0">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">No open alerts</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-slate-600">ID</th>
                          <th className="text-left p-3 font-medium text-slate-600">User</th>
                          <th className="text-left p-3 font-medium text-slate-600">Txn</th>
                          <th className="text-left p-3 font-medium text-slate-600">Risk</th>
                          <th className="text-left p-3 font-medium text-slate-600">Reason</th>
                          <th className="text-left p-3 font-medium text-slate-600">Status</th>
                          <th className="text-left p-3 font-medium text-slate-600">Created</th>
                          <th className="text-left p-3 font-medium text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {alerts.map((a: any) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-500">#{a.id}</td>
                            <td className="p-3">#{a.userId}</td>
                            <td className="p-3">#{a.transactionId}</td>
                            <td className="p-3">{riskBadge(a.riskLevel)}</td>
                            <td className="p-3 max-w-[200px] truncate text-xs">{a.reason}</td>
                            <td className="p-3">
                              <Badge className={
                                a.status === "open" ? "bg-amber-100 text-amber-800" :
                                a.status === "cleared" ? "bg-green-100 text-green-800" :
                                a.status === "escalated" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }>{a.status}</Badge>
                            </td>
                            <td className="p-3 text-xs text-slate-500">
                              {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-AU") : "—"}
                            </td>
                            <td className="p-3">
                              {a.status === "open" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-green-700 border-green-200"
                                    onClick={() => alertReviewMutation.mutate({ flagId: a.id, outcome: "cleared" })}
                                  >Clear</Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-700 border-red-200"
                                    onClick={() => alertReviewMutation.mutate({ flagId: a.id, outcome: "escalated" })}
                                  >Escalate</Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Settlements Tab */}
          <TabsContent value="settlements">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Pending Exchange Settlements
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Exchanges awaiting external confirmation. Fiat→crypto: confirm after Independent Reserve on-chain delivery.
                  Fiat→fiat: confirm after Airwallex settlement. Completing credits the TO wallet; failing refunds the FROM wallet.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {pendingExchanges.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <p className="text-sm font-medium">No pending settlements</p>
                    <p className="text-xs">All exchanges have been confirmed by external partners.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingExchanges.map((ex: any) => {
                      const netConverted = ex.exchangeRate && ex.amount
                        ? (parseFloat(ex.amount) * parseFloat(ex.exchangeRate) - parseFloat(ex.fee ?? "0")).toLocaleString(undefined, { maximumFractionDigits: 8 })
                        : "—";
                      const label = ex.settlementStatus === "pending_delivery"
                        ? "Awaiting IR on-chain delivery"
                        : "Awaiting Airwallex settlement";
                      const labelColor = ex.settlementStatus === "pending_delivery"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700";
                      return (
                        <div key={ex.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-muted-foreground">TX #{ex.id}</span>
                              <span className="text-xs text-muted-foreground">User #{ex.userId}</span>
                              <Badge className={`text-xs ${labelColor}`}>{label}</Badge>
                            </div>
                            <p className="text-sm font-semibold">
                              {parseFloat(ex.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} {ex.fromCurrency}
                              {" → "}
                              {netConverted} {ex.toCurrency}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rate: 1 {ex.fromCurrency} = {parseFloat(ex.exchangeRate ?? "0").toLocaleString(undefined, { maximumFractionDigits: 8 })} {ex.toCurrency}
                              {" · "}
                              {ex.createdAt ? new Date(ex.createdAt).toLocaleString() : ""}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                              onClick={() => completeExchangeMutation.mutate(ex.id)}
                              disabled={completeExchangeMutation.isPending || failExchangeMutation.isPending}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 text-xs"
                              onClick={() => failExchangeMutation.mutate(ex.id)}
                              disabled={completeExchangeMutation.isPending || failExchangeMutation.isPending}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Fail & Refund
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Action Log Tab */}
          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Action Log</CardTitle>
                <p className="text-xs text-muted-foreground">Immutable audit trail — SMRs, TTRs, account freezes, ECDD flags. AML/CTF Program v2.1 §26.</p>
              </CardHeader>
              <CardContent className="p-0">
                {actions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No actions recorded yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-slate-600">ID</th>
                          <th className="text-left p-3 font-medium text-slate-600">Type</th>
                          <th className="text-left p-3 font-medium text-slate-600">User</th>
                          <th className="text-left p-3 font-medium text-slate-600">Txn</th>
                          <th className="text-left p-3 font-medium text-slate-600">Performed By</th>
                          <th className="text-left p-3 font-medium text-slate-600">Outcome</th>
                          <th className="text-left p-3 font-medium text-slate-600">AUSTRAC Ref</th>
                          <th className="text-left p-3 font-medium text-slate-600">Notes</th>
                          <th className="text-left p-3 font-medium text-slate-600">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {actions.map((act: any) => (
                          <tr key={act.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-500">#{act.id}</td>
                            <td className="p-3">
                              <Badge className={
                                act.actionType === "smr" ? "bg-red-100 text-red-800" :
                                act.actionType === "ttr" ? "bg-purple-100 text-purple-800" :
                                act.actionType === "freeze" ? "bg-orange-100 text-orange-800" :
                                act.actionType === "ecdd" ? "bg-blue-100 text-blue-800" :
                                "bg-gray-100 text-gray-800"
                              }>{act.actionType?.toUpperCase()}</Badge>
                            </td>
                            <td className="p-3 text-slate-500">{act.userId ? `#${act.userId}` : "—"}</td>
                            <td className="p-3 text-slate-500">{act.transactionId ? `#${act.transactionId}` : "—"}</td>
                            <td className="p-3 text-xs">{act.performedBy}</td>
                            <td className="p-3">
                              <Badge className={
                                act.outcome === "filed" ? "bg-green-100 text-green-800" :
                                act.outcome === "closed" ? "bg-gray-100 text-gray-800" :
                                act.outcome === "escalated" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }>{act.outcome ?? "—"}</Badge>
                            </td>
                            <td className="p-3 text-xs font-mono">{act.austracRef ?? "—"}</td>
                            <td className="p-3 text-xs max-w-[200px] truncate">{act.notes ?? "—"}</td>
                            <td className="p-3 text-xs text-slate-500">
                              {act.createdAt ? new Date(act.createdAt).toLocaleDateString("en-AU") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMR/TTR Reporting Tab */}
          <TabsContent value="reporting">
            <div className="grid md:grid-cols-2 gap-6">
              {/* SMR Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-red-700">Log Suspicious Matter Report (SMR)</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    AML/CTF Act s.41 — Report to AUSTRAC within 3 business days of forming a suspicion (24 hrs for terrorism financing).
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">User ID</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 12"
                        value={smrUserId ?? ""}
                        onChange={e => setSmrUserId(Number(e.target.value) || null)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Transaction ID (optional)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 45"
                        value={smrTxId}
                        onChange={e => setSmrTxId(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Nature of Suspicion (required)</Label>
                    <Textarea
                      placeholder="Describe the grounds for suspicion — facts, circumstances, and the specific AML/CTF typology observed..."
                      value={smrNotes}
                      onChange={e => setSmrNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Decision Outcome</Label>
                    <Select value={smrOutcome} onValueChange={setSmrOutcome}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="filed">Filed with AUSTRAC</SelectItem>
                        <SelectItem value="closed">Closed — Insufficient grounds</SelectItem>
                        <SelectItem value="false_positive">False Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">AUSTRAC Online Reference (if filed)</Label>
                    <Input
                      placeholder="SMR reference from AUSTRAC Online"
                      value={smrRef}
                      onChange={e => setSmrRef(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <Button
                    className="w-full bg-red-700 hover:bg-red-800"
                    disabled={smrMutation.isPending || !smrNotes || smrNotes.length < 10}
                    onClick={() => smrMutation.mutate({
                      userId: smrUserId,
                      transactionId: smrTxId ? Number(smrTxId) : undefined,
                      notes: smrNotes,
                      outcome: smrOutcome,
                      austracRef: smrRef || undefined,
                    })}
                  >
                    {smrMutation.isPending ? "Logging..." : "Log SMR"}
                  </Button>
                </CardContent>
              </Card>

              {/* TTR Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-purple-700">Log Threshold Transaction Report (TTR)</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    AML/CTF Act s.43 — Report cash transactions of $10,000+ (AUD equivalent) to AUSTRAC within 10 business days.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TtrForm refetchActions={refetchActions} adminHeaders={adminHeaders} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Freeze/Unfreeze Dialog */}
      <Dialog open={freezeDialogOpen} onOpenChange={setFreezeDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{freezeAction === "freeze" ? "Freeze Account" : "Unfreeze Account"}</DialogTitle>
            <DialogDescription>
              {freezeAction === "freeze"
                ? "The customer will be unable to transact. This action is logged."
                : "The customer's account will be reactivated. This action is logged."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Reason / Notes (required for audit trail)</Label>
              <Textarea
                value={freezeNotes}
                onChange={e => setFreezeNotes(e.target.value)}
                placeholder="State the regulatory or compliance reason..."
                rows={3}
              />
            </div>
            <Button
              className={`w-full ${freezeAction === "freeze" ? "bg-red-700 hover:bg-red-800" : "bg-green-700 hover:bg-green-800"}`}
              disabled={freezeMutation.isPending}
              onClick={() => freezeUserId && freezeMutation.mutate({ userId: freezeUserId, action: freezeAction, notes: freezeNotes })}
            >
              {freezeMutation.isPending ? "Processing..." : freezeAction === "freeze" ? "Confirm Freeze" : "Confirm Unfreeze"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TtrForm({ refetchActions, adminHeaders }: { refetchActions: () => void; adminHeaders: () => Record<string, string> }) {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [txId, setTxId] = useState("");
  const [notes, setNotes] = useState("");
  const [austracRef, setAustracRef] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: any) =>
      fetch("/api/admin/compliance/ttr", {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "TTR logged", description: "Threshold Transaction Report recorded." });
      setUserId(""); setTxId(""); setNotes(""); setAustracRef("");
      refetchActions();
    },
    onError: () => toast({ title: "Error", description: "Failed to log TTR.", variant: "destructive" }),
  });

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">User ID</Label>
          <Input type="number" placeholder="e.g. 12" value={userId} onChange={e => setUserId(e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Transaction ID</Label>
          <Input type="number" placeholder="e.g. 45" value={txId} onChange={e => setTxId(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Transaction Details</Label>
        <Textarea
          placeholder="Amount, currency, date, payment method, counterparty details..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
        />
      </div>
      <div>
        <Label className="text-xs">AUSTRAC Online Reference</Label>
        <Input
          placeholder="TTR reference from AUSTRAC Online"
          value={austracRef}
          onChange={e => setAustracRef(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <Button
        className="w-full bg-purple-700 hover:bg-purple-800"
        disabled={mutation.isPending || !userId || !txId || !notes}
        onClick={() => mutation.mutate({
          userId: Number(userId),
          transactionId: Number(txId),
          notes,
          austracRef: austracRef || undefined,
        })}
      >
        {mutation.isPending ? "Logging..." : "Log TTR"}
      </Button>
    </>
  );
}
