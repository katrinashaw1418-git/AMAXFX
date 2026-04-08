import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  FileText,
  User,
  MapPin,
  CreditCard,
  Building,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  switch (s) {
    case "completed": case "approved":       return "bg-green-100 text-green-800";
    case "in_progress": case "under_review": return "bg-yellow-100 text-yellow-800";
    case "pending":                          return "bg-gray-100 text-gray-800";
    case "rejected":                         return "bg-red-100 text-red-800";
    default:                                 return "bg-gray-100 text-gray-800";
  }
};

const statusLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

type StepStatus = "completed" | "under_review" | "in_progress" | "pending";

// ── main ─────────────────────────────────────────────────────────────────────
export default function Compliance() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("kyc");

  // which steps have had files uploaded (stepId → filename)
  const [stepFiles, setStepFiles] = useState<Record<number, string>>({});

  // risk questionnaire
  const [riskExperience, setRiskExperience] = useState("");
  const [riskIncome,     setRiskIncome]     = useState("");
  const [riskFunds,      setRiskFunds]      = useState("");
  const [riskGoals,      setRiskGoals]      = useState("");
  const [riskSubmitted,  setRiskSubmitted]  = useState(false);

  // documents-tab uploads (docId → filename)
  const [docUploads, setDocUploads] = useState<Record<number, string>>({});

  // ── derive step statuses dynamically ──────────────────────────────────────
  // Step 1: always completed (pre-verified)
  // Step 2: in_progress → under_review once file uploaded
  // Step 3: pending until step 2 uploaded, then in_progress → under_review once uploaded
  // Step 4: pending until step 3 uploaded, then in_progress → completed once risk submitted
  const stepStatuses = useMemo((): Record<number, StepStatus> => {
    const s2 = stepFiles[2] ? "under_review" : "in_progress";
    const s3 = !stepFiles[2]
      ? "pending"
      : stepFiles[3]
      ? "under_review"
      : "in_progress";
    const s4 = !stepFiles[3]
      ? "pending"
      : riskSubmitted
      ? "completed"
      : "in_progress";
    return { 1: "completed", 2: s2, 3: s3, 4: s4 };
  }, [stepFiles, riskSubmitted]);

  // derive current active step (first non-completed step)
  const currentStepId = useMemo(() => {
    for (const id of [1, 2, 3, 4]) {
      if (stepStatuses[id] !== "completed" && stepStatuses[id] !== "under_review") return id;
    }
    return 4;
  }, [stepStatuses]);

  // derive KYC completion %
  const kycPct = useMemo(() => {
    const weights: Record<number, number> = { 1: 25, 2: 25, 3: 25, 4: 25 };
    let total = 25; // step 1 always done
    if (stepFiles[2])   total += 25;
    if (stepFiles[3])   total += 25;
    if (riskSubmitted)  total += 25;
    return total;
  }, [stepFiles, riskSubmitted]);

  // derive doc verification %
  const docPct = useMemo(() => {
    let done = 2; // passport (approved) + utility bill (under_review) = 2 of 4
    if (stepFiles[2] || docUploads[3]) done = Math.min(4, done + 1);
    if (stepFiles[3] || docUploads[4]) done = Math.min(4, done + 1);
    return Math.round((done / 4) * 100);
  }, [stepFiles, docUploads]);

  const complianceMetrics = useMemo(() => [
    {
      label: "KYC Completion",
      value: kycPct,
      status: kycPct === 100 ? "completed" : "in_progress",
    },
    { label: "AML Screening",         value: 100, status: "completed" },
    {
      label: "Document Verification",
      value: docPct,
      status: docPct === 100 ? "completed" : docPct > 0 ? "in_progress" : "pending",
    },
    {
      label: "Risk Assessment",
      value: riskSubmitted ? 100 : 0,
      status: riskSubmitted ? "completed" : "pending",
    },
  ], [kycPct, docPct, riskSubmitted]);

  // ── step definitions ───────────────────────────────────────────────────────
  const kycStepDefs = [
    {
      id: 1,
      title: "Identity Verification",
      icon: User,
      baseDescription: "Government-issued photo ID verified",
      uploadId: undefined as string | undefined,
    },
    {
      id: 2,
      title: "Address Verification",
      icon: MapPin,
      baseDescription: "Upload a recent utility bill, bank statement, or government letter (dated within 3 months)",
      uploadId: "kyc-address",
    },
    {
      id: 3,
      title: "Source of Funds",
      icon: CreditCard,
      baseDescription: "Upload payslips, tax returns, or a letter from your employer",
      uploadId: "kyc-funds",
    },
    {
      id: 4,
      title: "Risk Assessment",
      icon: Shield,
      baseDescription: "Complete the risk questionnaire",
      uploadId: undefined,
    },
  ];

  // ── handlers ──────────────────────────────────────────────────────────────
  function handleKycUpload(stepId: number, stepTitle: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStepFiles(prev => ({ ...prev, [stepId]: file.name }));
    toast({
      title: "Document Submitted",
      description: `${file.name} received for ${stepTitle}. Our compliance team will review it within 1–2 business days.`,
    });
    e.target.value = "";
  }

  function handleDocTabUpload(docId: number, docName: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploads(prev => ({ ...prev, [docId]: file.name }));
    toast({
      title: "Document Submitted",
      description: `${file.name} submitted for ${docName}. Review takes 1–2 business days.`,
    });
    e.target.value = "";
  }

  function handleGeneralUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({
      title: "Document Received",
      description: `${file.name} uploaded. Our team will categorise and review it shortly.`,
    });
    e.target.value = "";
  }

  function handleView(docName: string) {
    toast({
      title: "Document Viewer",
      description: `Contact support@amaxglobal.com.au to retrieve a copy of ${docName}.`,
    });
  }

  function handleDownload(docName: string) {
    toast({
      title: "Download Requested",
      description: `${docName} will be sent to your registered email within 24 hours.`,
    });
  }

  function handleCompleteRiskAssessment() {
    if (!riskExperience || !riskIncome || !riskFunds) {
      toast({
        title: "Incomplete Form",
        description: "Please complete all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }
    setRiskSubmitted(true);
    toast({
      title: "Risk Assessment Submitted",
      description: "Your risk profile has been recorded. KYC Step 4 is now complete.",
    });
  }

  // ── document records (merged with any tab-uploads) ─────────────────────────
  const documents = [
    { id: 1, name: "Passport Copy",    status: "approved"     as const, uploadDate: "2024-01-10", size: "2.4 MB" },
    { id: 2, name: "Utility Bill",     status: "under_review" as const, uploadDate: "2024-01-12", size: "1.8 MB" },
    { id: 3, name: "Bank Statement",   status: (stepFiles[2] || docUploads[3] ? "under_review" : "pending") as any, uploadDate: "", size: "" },
    { id: 4, name: "Income Statement", status: (stepFiles[3] || docUploads[4] ? "under_review" : "pending") as any, uploadDate: "", size: "" },
  ];

  // next step prompt content
  const nextStep = kycStepDefs.find(s => stepStatuses[s.id] === "in_progress");

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Compliance Centre</h1>
          <p className="text-gray-600 text-sm">
            AMAX Financial Pty Ltd (ABN 54 690 827 608) — regulatory verification and document management
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Tier 2 Verified</p>
            <p className="text-xs text-green-600">AUSTRAC registered DCE</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {complianceMetrics.map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{metric.label}</h3>
                <Badge className={statusColor(metric.status)}>{statusLabel(metric.status)}</Badge>
              </div>
              <span className="text-2xl font-bold">{metric.value}%</span>
              <Progress value={metric.value} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="kyc"             className="flex-1 min-w-[90px] text-xs sm:text-sm">KYC Status</TabsTrigger>
          <TabsTrigger value="documents"       className="flex-1 min-w-[90px] text-xs sm:text-sm">Documents</TabsTrigger>
          <TabsTrigger value="risk"            className="flex-1 min-w-[90px] text-xs sm:text-sm">Risk Profile</TabsTrigger>
          <TabsTrigger value="regulatory"      className="flex-1 min-w-[90px] text-xs sm:text-sm">Regulatory</TabsTrigger>
          <TabsTrigger value="terms"           className="flex-1 min-w-[90px] text-xs sm:text-sm">Terms</TabsTrigger>
          <TabsTrigger value="privacy"         className="flex-1 min-w-[90px] text-xs sm:text-sm">Privacy</TabsTrigger>
          <TabsTrigger value="risk-disclosure" className="flex-1 min-w-[90px] text-xs sm:text-sm">Risk Disclosure</TabsTrigger>
        </TabsList>

        {/* ── KYC Status Tab ── */}
        <TabsContent value="kyc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Know Your Customer (KYC) Verification</CardTitle>
              <p className="text-sm text-gray-500">Upload documents directly on each step. Steps unlock automatically as you progress.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {kycStepDefs.map((def) => {
                const status    = stepStatuses[def.id];
                const fileName  = stepFiles[def.id];
                const Icon      = def.icon;
                const canUpload = def.uploadId && (status === "in_progress" || status === "under_review");
                const isLocked  = status === "pending";

                return (
                  <div
                    key={def.id}
                    className={`flex items-start gap-4 p-4 border rounded-xl transition-all ${
                      status === "completed"    ? "border-green-200  bg-green-50"  :
                      status === "under_review" ? "border-blue-200   bg-blue-50"   :
                      status === "in_progress"  ? "border-yellow-300 bg-yellow-50" :
                      "border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    {/* Step icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      status === "completed"    ? "bg-green-600"  :
                      status === "under_review" ? "bg-blue-500"   :
                      status === "in_progress"  ? "bg-yellow-500" :
                      "bg-gray-300"
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-gray-400 font-medium">Step {def.id}</span>
                        <h3 className="font-semibold text-gray-900">{def.title}</h3>
                        <Badge className={statusColor(status)}>
                          {status === "under_review" ? "Under Review" : statusLabel(status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{def.baseDescription}</p>
                      {fileName && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {fileName} — submitted for review
                        </p>
                      )}
                      {status === "under_review" && !fileName && (
                        <p className="text-xs text-blue-600 mt-1">Document under review</p>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="flex-shrink-0 mt-1">
                      {status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : status === "under_review" ? (
                        <div className="flex flex-col items-center gap-1">
                          <RefreshCw className="w-4 h-4 text-blue-500" />
                          {def.uploadId && (
                            <label htmlFor={`${def.uploadId}-replace`} className="cursor-pointer">
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" asChild>
                                <span>Replace</span>
                              </Button>
                              <input
                                id={`${def.uploadId}-replace`}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.heic"
                                className="hidden"
                                onChange={(e) => handleKycUpload(def.id, def.title, e)}
                              />
                            </label>
                          )}
                        </div>
                      ) : canUpload ? (
                        <label htmlFor={def.uploadId} className="cursor-pointer">
                          <Button size="sm" asChild>
                            <span><Upload className="w-3 h-3 mr-1" /> Upload</span>
                          </Button>
                          <input
                            id={def.uploadId}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                            className="hidden"
                            onChange={(e) => handleKycUpload(def.id, def.title, e)}
                          />
                        </label>
                      ) : def.id === 4 && status === "in_progress" ? (
                        <Button size="sm" onClick={() => setActiveTab("risk")}>
                          Start <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      ) : (
                        <Clock className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Dynamic next-step prompt */}
          {nextStep && (
            <Card className={`border-2 ${
              nextStep.id === 4 ? "border-purple-200 bg-purple-50" : "border-blue-200 bg-blue-50"
            }`}>
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className={`w-5 h-5 mt-0.5 flex-shrink-0 ${nextStep.id === 4 ? "text-purple-600" : "text-blue-600"}`} />
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${nextStep.id === 4 ? "text-purple-900" : "text-blue-900"}`}>
                    Next: {nextStep.title}
                  </h4>
                  <p className={`text-sm mb-3 ${nextStep.id === 4 ? "text-purple-700" : "text-blue-700"}`}>
                    {nextStep.id === 2 && "Upload a utility bill, bank statement, or government letter dated within the last 3 months showing your full name and address."}
                    {nextStep.id === 3 && "Upload a recent payslip, tax return, or employer letter confirming your income and source of funds."}
                    {nextStep.id === 4 && "You're almost there! Complete the short risk assessment questionnaire to finish your KYC verification."}
                    {" "}Accepted formats: PDF, JPG, PNG, HEIC — max 10 MB.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {nextStep.uploadId ? (
                      <>
                        <label htmlFor={`next-${nextStep.uploadId}`} className="cursor-pointer">
                          <Button size="sm" asChild>
                            <span><Upload className="w-3 h-3 mr-1" /> Upload {nextStep.title} Document</span>
                          </Button>
                          <input
                            id={`next-${nextStep.uploadId}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                            className="hidden"
                            onChange={(e) => handleKycUpload(nextStep.id, nextStep.title, e)}
                          />
                        </label>
                        <Button size="sm" variant="outline" onClick={() => setActiveTab("documents")}>
                          View All Documents
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" onClick={() => setActiveTab("risk")}>
                        Start Risk Assessment <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All done */}
          {!nextStep && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900">KYC Verification Complete</h4>
                  <p className="text-sm text-green-700">All steps submitted. Your account is fully verified and you have full access to AMAX Global services.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Documents Tab ── */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <p className="text-sm text-gray-500">Accepted: PDF, JPG, PNG, HEIC — max 10 MB. Review takes 1–2 business days.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-xl gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                        {doc.uploadDate && <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>}
                        {doc.size       && <span>{doc.size}</span>}
                        {docUploads[doc.id] && <span className="text-blue-600">✓ {docUploads[doc.id]}</span>}
                        {(doc.id === 3 && stepFiles[2]) && <span className="text-blue-600">✓ {stepFiles[2]}</span>}
                        {(doc.id === 4 && stepFiles[3]) && <span className="text-blue-600">✓ {stepFiles[3]}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={statusColor(doc.status)}>{statusLabel(doc.status)}</Badge>
                    {doc.status === "pending" ? (
                      <label htmlFor={`doc-upload-${doc.id}`} className="cursor-pointer">
                        <Button size="sm" asChild>
                          <span><Upload className="w-3 h-3 mr-1" /> Upload</span>
                        </Button>
                        <input
                          id={`doc-upload-${doc.id}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.heic"
                          className="hidden"
                          onChange={(e) => handleDocTabUpload(doc.id, doc.name, e)}
                        />
                      </label>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleView(doc.name)}>
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc.name)}>
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-8 text-center">
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">Upload Additional Document</h3>
              <p className="text-sm text-gray-500 mb-4">Our compliance team will categorise and review it.</p>
              <label htmlFor="doc-general-upload" className="cursor-pointer">
                <Button asChild>
                  <span><Upload className="w-4 h-4 mr-2" /> Choose File</span>
                </Button>
                <input
                  id="doc-general-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.heic"
                  className="hidden"
                  onChange={handleGeneralUpload}
                />
              </label>
              <p className="text-xs text-gray-400 mt-3">PDF, JPG, PNG, HEIC — max 10 MB</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Risk Profile Tab ── */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Questionnaire</CardTitle>
              <p className="text-sm text-gray-500">Required to complete KYC Step 4. All fields marked * are required.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {riskSubmitted ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900">Risk Assessment Complete</h4>
                    <p className="text-sm text-green-700">Your risk profile has been recorded and KYC Step 4 is now marked complete.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <Label>FX / Financial Services Experience *</Label>
                    <Select value={riskExperience} onValueChange={setRiskExperience}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select your experience level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novice">New to FX / Remittance (0–2 years)</SelectItem>
                        <SelectItem value="intermediate">Moderate experience (3–7 years)</SelectItem>
                        <SelectItem value="experienced">Experienced (8+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Annual Income (AUD) *</Label>
                    <Select value={riskIncome} onValueChange={setRiskIncome}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select income range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-50k">Under $50,000</SelectItem>
                        <SelectItem value="50k-100k">$50,000 – $100,000</SelectItem>
                        <SelectItem value="100k-250k">$100,000 – $250,000</SelectItem>
                        <SelectItem value="250k-500k">$250,000 – $500,000</SelectItem>
                        <SelectItem value="over-500k">Over $500,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Primary Source of Funds *</Label>
                    <Select value={riskFunds} onValueChange={setRiskFunds}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select primary source" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employment">Employment / Salary</SelectItem>
                        <SelectItem value="business">Business Income</SelectItem>
                        <SelectItem value="savings">Personal Savings</SelectItem>
                        <SelectItem value="inheritance">Inheritance / Gift</SelectItem>
                        <SelectItem value="property">Property / Rental Income</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Purpose of Using AMAX Global</Label>
                    <Textarea
                      value={riskGoals}
                      onChange={(e) => setRiskGoals(e.target.value)}
                      placeholder="e.g. sending money overseas, FX conversion for business, holding digital assets…"
                      className="mt-1 min-h-[90px]"
                    />
                  </div>
                  <Button className="w-full" onClick={handleCompleteRiskAssessment}>
                    Submit Risk Assessment
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Regulatory Tab ── */}
        <TabsContent value="regulatory">
          <Card>
            <CardHeader><CardTitle>Regulatory Compliance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "AUSTRAC (Australia)", badge: "Registered", cls: "bg-green-100 text-green-800", text: "AMAX Financial Pty Ltd is registered with AUSTRAC as a Digital Currency Exchange (DCE) provider and remittance dealer. ABN 54 690 827 608." },
                  { title: "Australian Privacy Act 1988", badge: "Compliant", cls: "bg-green-100 text-green-800", text: "All personal information is collected, held, and used in accordance with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs)." },
                  { title: "AML/CTF Act 2006 (Australia)", badge: "Compliant", cls: "bg-green-100 text-green-800", text: "Full compliance with the Anti-Money Laundering and Counter-Terrorism Financing Act 2006, including customer due diligence, transaction monitoring, and AUSTRAC reporting." },
                  { title: "ASIC — Consumer Compliance", badge: "In Progress", cls: "bg-yellow-100 text-yellow-800", text: "Engagement with ASIC requirements for financial services consumer protection. Licensing review underway ahead of full service launch." },
                ].map((reg, i) => (
                  <div key={i} className="p-4 border rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">{reg.title}</h3>
                    </div>
                    <Badge className={`${reg.cls} mb-2`}>{reg.badge}</Badge>
                    <p className="text-sm text-gray-600">{reg.text}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="font-semibold text-blue-900 mb-2">Regulatory Reminders</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• All users must complete KYC/AML verification before transacting</li>
                  <li>• Transactions ≥ AUD 10,000 are subject to enhanced due diligence</li>
                  <li>• Suspicious activity is reported to AUSTRAC as required by law</li>
                  <li>• Transaction records are retained for a minimum of 7 years</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Terms Tab ── */}
        <TabsContent value="terms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Terms &amp; Conditions</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              {[
                ["1. Acceptance of Terms", "By accessing or using the AMAX Global platform, you agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and AMAX Financial Pty Ltd (ABN 54 690 827 608)."],
                ["2. Eligibility", "You must be at least 18 years of age and legally capable of entering into binding contracts to use our services."],
                ["3. Account Responsibilities", "You are responsible for maintaining the confidentiality of your credentials and all activity under your account. Notify us immediately of any unauthorised use at support@amaxglobal.com.au."],
                ["4. Services", "AMAX Global provides multi-currency eWallet management, foreign exchange (FX) conversion, remittance, and regulated digital currency exchange (DCE) services. AMAX Global does not provide financial advice or investment recommendations."],
                ["5. Fees and Charges", "FX conversion: 0.5% of converted amount. Fiat withdrawals: flat fee per currency disclosed at checkout. All fees are shown before confirmation."],
                ["6. Limitation of Liability", "AMAX Global is not liable for losses arising from market fluctuations, outages, or events beyond our reasonable control. Total liability capped at fees paid in the preceding 12 months."],
                ["7. Governing Law", "These Terms are governed by the laws of New South Wales, Australia. Disputes subject to the non-exclusive jurisdiction of NSW courts."],
              ].map(([title, body]) => (
                <div key={title as string}><h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3><p>{body}</p></div>
              ))}
              <p className="text-xs text-gray-400 pt-2">Last updated: April 2026 | AMAX Financial Pty Ltd (ABN 54 690 827 608) | Level 2, 8-12 King Street, Rockdale NSW 2216</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Privacy Tab ── */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-green-600" /> Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              {[
                ["1. Data We Collect", "We collect personal information you provide (name, email, government ID, financial data), usage data, and technical data (IP, device, browser). Governed by the Australian Privacy Act 1988 and the APPs."],
                ["2. How We Use Your Data", "To provide services, comply with AML/CTF Act 2006 KYC obligations, process transactions, detect fraud, and communicate updates. We do not sell your data."],
                ["3. Data Sharing", "With AUSTRAC and regulators (as required), payment processors, identity verification providers, and cloud partners under strict data agreements."],
                ["4. Data Retention", "Financial records retained ≥ 7 years (AML/CTF Act 2006). Deletion of non-regulatory data: privacy@amaxglobal.com.au."],
                ["5. Your Rights", "Access and correct your personal information. Complaints to the OAIC at oaic.gov.au."],
                ["6. Security", "AES-256 encryption at rest, TLS 1.3 in transit, MFA. Breaches reported under the Notifiable Data Breaches scheme."],
              ].map(([title, body]) => (
                <div key={title as string}><h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3><p>{body}</p></div>
              ))}
              <p className="text-xs text-gray-400 pt-2">Last updated: April 2026 | Australian Privacy Act 1988 | AMAX Financial Pty Ltd (ABN 54 690 827 608)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Risk Disclosure Tab ── */}
        <TabsContent value="risk-disclosure">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" /> Risk Disclosure Statement</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-800">Important Notice</p>
                <p className="text-amber-700 text-sm mt-1">FX, remittance, and digital currency exchange services involve risk. You may receive less than you send. Past rates are not indicative of future rates.</p>
              </div>
              {[
                ["1. Foreign Exchange Risk", "Currency values fluctuate based on macroeconomic factors, central bank policy, and geopolitical events. Rates at execution may differ materially from later dates."],
                ["2. Digital Currency Risk", "BTC, ETH, USDT, and USDC are subject to extreme volatility, regulatory uncertainty, and potential total loss of value. Not suitable for those who cannot afford total loss."],
                ["3. Remittance Risk", "Cross-border transfers are executed at the prevailing FX rate. Correspondent bank delays or compliance reviews may affect the amount received."],
                ["4. Liquidity Risk", "Some pairs may have limited liquidity, affecting execution price or settlement speed. Spreads may widen during high volatility."],
                ["5. Technology Risk", "Platform outages, cyber-attacks, or software errors may temporarily affect transactions."],
                ["6. Regulatory Risk", "Changes in Australian law or AUSTRAC requirements may affect service availability or cost."],
                ["7. No Financial Advice", "AMAX Global does not provide financial advice, investment recommendations, or tax advice. Seek independent professional advice."],
              ].map(([title, body]) => (
                <div key={title as string}><h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3><p>{body}</p></div>
              ))}
              <p className="text-xs text-gray-400 pt-2">Issued by AMAX Financial Pty Ltd (ABN 54 690 827 608) | Last updated: April 2026</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
