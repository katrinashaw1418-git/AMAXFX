import { useState } from "react";
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
} from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────
interface KycStep {
  id: number;
  title: string;
  status: "completed" | "in_progress" | "pending";
  icon: React.ElementType;
  description: string;
  uploadLabel?: string;
  uploadId?: string;
}

interface DocRecord {
  id: number;
  name: string;
  status: "approved" | "under_review" | "pending" | "rejected";
  uploadDate: string;
  size: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const statusColor = (s: string) => {
  switch (s) {
    case "completed": case "approved":          return "bg-green-100 text-green-800";
    case "in_progress": case "under_review":   return "bg-yellow-100 text-yellow-800";
    case "pending":                             return "bg-gray-100 text-gray-800";
    case "rejected":                            return "bg-red-100 text-red-800";
    default:                                    return "bg-gray-100 text-gray-800";
  }
};

const statusLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

// ── main component ────────────────────────────────────────────────────────────
export default function Compliance() {
  const { toast } = useToast();

  // controlled tab so buttons can switch tabs programmatically
  const [activeTab, setActiveTab] = useState("kyc");

  // KYC step upload tracking
  const [uploadedSteps, setUploadedSteps] = useState<Record<number, string>>({});

  // risk assessment form
  const [riskExperience, setRiskExperience] = useState("");
  const [riskIncome,     setRiskIncome]     = useState("");
  const [riskFunds,      setRiskFunds]      = useState("");
  const [riskGoals,      setRiskGoals]      = useState("");

  // document upload tracking (Documents tab)
  const [docUploads, setDocUploads] = useState<Record<number, string>>({});

  // ── data ──────────────────────────────────────────────────────────────────
  const kycSteps: KycStep[] = [
    {
      id: 1,
      title: "Identity Verification",
      status: "completed",
      icon: User,
      description: "Government-issued photo ID verified",
    },
    {
      id: 2,
      title: "Address Verification",
      status: "in_progress",
      icon: MapPin,
      description: "Upload a recent utility bill or bank statement (dated within 3 months)",
      uploadLabel: "Upload Proof of Address",
      uploadId: "kyc-address",
    },
    {
      id: 3,
      title: "Source of Funds",
      status: "pending",
      icon: CreditCard,
      description: "Upload payslips, tax returns, or a letter from your employer",
      uploadLabel: "Upload Source of Funds",
      uploadId: "kyc-funds",
    },
    {
      id: 4,
      title: "Risk Assessment",
      status: "pending",
      icon: Shield,
      description: "Complete the risk questionnaire in the Risk Profile tab",
    },
  ];

  const documents: DocRecord[] = [
    { id: 1, name: "Passport Copy",    status: "approved",     uploadDate: "2024-01-10", size: "2.4 MB" },
    { id: 2, name: "Utility Bill",     status: "under_review", uploadDate: "2024-01-12", size: "1.8 MB" },
    { id: 3, name: "Bank Statement",   status: "pending",      uploadDate: "",           size: "" },
    { id: 4, name: "Income Statement", status: "pending",      uploadDate: "",           size: "" },
  ];

  const complianceMetrics = [
    { label: "KYC Completion",        value: 65,  status: "in_progress" },
    { label: "AML Screening",         value: 100, status: "completed" },
    { label: "Document Verification", value: 50,  status: "in_progress" },
    { label: "Risk Assessment",       value: 0,   status: "pending" },
  ];

  // ── handlers ──────────────────────────────────────────────────────────────
  function handleKycUpload(stepId: number, stepTitle: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedSteps(prev => ({ ...prev, [stepId]: file.name }));
    toast({
      title: "Document Uploaded",
      description: `${file.name} submitted for ${stepTitle}. Our compliance team will review it within 1–2 business days.`,
    });
    e.target.value = "";
  }

  function handleDocTabUpload(docId: number, docName: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploads(prev => ({ ...prev, [docId]: file.name }));
    toast({
      title: "Document Uploaded",
      description: `${file.name} has been submitted for ${docName}. Review takes 1–2 business days.`,
    });
    e.target.value = "";
  }

  function handleGeneralUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({
      title: "Document Received",
      description: `${file.name} uploaded. Our compliance team will categorise and review it shortly.`,
    });
    e.target.value = "";
  }

  function handleView(docName: string) {
    toast({
      title: "Document Viewer",
      description: `Please contact support@amaxglobal.com.au to retrieve a copy of ${docName}.`,
    });
  }

  function handleDownload(docName: string) {
    toast({
      title: "Download Requested",
      description: `${docName} will be sent to your registered email address within 24 hours.`,
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
    toast({
      title: "Risk Assessment Submitted",
      description: "Your risk profile has been recorded. Our compliance team will review it shortly.",
    });
  }

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

      {/* Compliance Overview Cards */}
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
          <TabsTrigger value="kyc"             className="flex-1 min-w-[100px] text-xs sm:text-sm">KYC Status</TabsTrigger>
          <TabsTrigger value="documents"       className="flex-1 min-w-[100px] text-xs sm:text-sm">Documents</TabsTrigger>
          <TabsTrigger value="risk"            className="flex-1 min-w-[100px] text-xs sm:text-sm">Risk Profile</TabsTrigger>
          <TabsTrigger value="regulatory"      className="flex-1 min-w-[100px] text-xs sm:text-sm">Regulatory</TabsTrigger>
          <TabsTrigger value="terms"           className="flex-1 min-w-[100px] text-xs sm:text-sm">Terms</TabsTrigger>
          <TabsTrigger value="privacy"         className="flex-1 min-w-[100px] text-xs sm:text-sm">Privacy</TabsTrigger>
          <TabsTrigger value="risk-disclosure" className="flex-1 min-w-[100px] text-xs sm:text-sm">Risk Disclosure</TabsTrigger>
        </TabsList>

        {/* ── KYC Status Tab ── */}
        <TabsContent value="kyc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Know Your Customer (KYC) Verification</CardTitle>
              <p className="text-sm text-gray-500">
                Complete each step below. For steps requiring documents, use the upload button directly on that step.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {kycSteps.map((step) => {
                const Icon       = step.icon;
                const isUploaded = !!uploadedSteps[step.id];
                const needsUpload = (step.status === "in_progress" || step.status === "pending") && step.uploadId;
                const isRiskStep  = step.id === 4;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-4 p-4 border rounded-xl transition-colors ${
                      step.status === "in_progress" ? "border-yellow-300 bg-yellow-50" :
                      step.status === "completed"   ? "border-green-200 bg-green-50"   :
                      "border-gray-200 bg-gray-50"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      step.status === "completed"   ? "bg-green-600" :
                      step.status === "in_progress" ? "bg-yellow-500" :
                      "bg-gray-300"
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">{step.title}</h3>
                        <Badge className={statusColor(step.status)}>{statusLabel(step.status)}</Badge>
                        {isUploaded && (
                          <Badge className="bg-blue-100 text-blue-800">
                            ✓ {uploadedSteps[step.id]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                      {step.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-2" />
                      ) : needsUpload ? (
                        <label htmlFor={step.uploadId} className="cursor-pointer">
                          <Button size="sm" variant={step.status === "in_progress" ? "default" : "outline"} asChild>
                            <span>
                              <Upload className="w-3 h-3 mr-1" />
                              {isUploaded ? "Replace" : "Upload"}
                            </span>
                          </Button>
                          <input
                            id={step.uploadId}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.heic"
                            className="hidden"
                            onChange={(e) => handleKycUpload(step.id, step.title, e)}
                          />
                        </label>
                      ) : isRiskStep ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab("risk")}
                        >
                          Start <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400 mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Next Steps prompt */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Next: Address Verification</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Upload a utility bill, bank statement, or government letter dated within the last 3 months showing your full name and address.
                  Accepted formats: PDF, JPG, PNG, HEIC — max 10 MB.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => setActiveTab("documents")}>
                    View All Documents
                  </Button>
                  <label htmlFor="kyc-next-address" className="cursor-pointer">
                    <Button size="sm" variant="outline" asChild>
                      <span><Upload className="w-3 h-3 mr-1" /> Upload Proof of Address</span>
                    </Button>
                    <input
                      id="kyc-next-address"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.heic"
                      className="hidden"
                      onChange={(e) => handleKycUpload(2, "Address Verification", e)}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documents Tab ── */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
              <p className="text-sm text-gray-500">
                Accepted formats: PDF, JPG, PNG, HEIC — max 10 MB per file. Review takes 1–2 business days.
              </p>
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
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {doc.uploadDate && <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>}
                        {doc.size       && <span>{doc.size}</span>}
                        {docUploads[doc.id] && (
                          <span className="text-blue-600">✓ {docUploads[doc.id]}</span>
                        )}
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

          {/* General upload drop-zone */}
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-8 text-center">
              <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">Upload Additional Document</h3>
              <p className="text-sm text-gray-500 mb-4">
                Have another document to submit? Our compliance team will categorise and review it.
              </p>
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
              <div>
                <Label>FX / Financial Services Experience *</Label>
                <Select value={riskExperience} onValueChange={setRiskExperience}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
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
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
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
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select primary source" />
                  </SelectTrigger>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Regulatory Tab ── */}
        <TabsContent value="regulatory" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Regulatory Compliance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: "AUSTRAC (Australia)",
                    badge: "Registered",
                    badgeClass: "bg-green-100 text-green-800",
                    text: "AMAX Financial Pty Ltd is registered with AUSTRAC as a Digital Currency Exchange (DCE) provider and remittance dealer. ABN 54 690 827 608.",
                  },
                  {
                    title: "Australian Privacy Act 1988",
                    badge: "Compliant",
                    badgeClass: "bg-green-100 text-green-800",
                    text: "All personal information is collected, held, and used in accordance with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs).",
                  },
                  {
                    title: "AML/CTF Act 2006 (Australia)",
                    badge: "Compliant",
                    badgeClass: "bg-green-100 text-green-800",
                    text: "Full compliance with the Anti-Money Laundering and Counter-Terrorism Financing Act 2006, including customer due diligence, transaction monitoring, and AUSTRAC reporting.",
                  },
                  {
                    title: "ASIC — Consumer Compliance",
                    badge: "In Progress",
                    badgeClass: "bg-yellow-100 text-yellow-800",
                    text: "Engagement with ASIC requirements for financial services consumer protection. Licensing review underway ahead of full service launch.",
                  },
                ].map((reg, i) => (
                  <div key={i} className="p-4 border rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-sm">{reg.title}</h3>
                    </div>
                    <Badge className={`${reg.badgeClass} mb-2`}>{reg.badge}</Badge>
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
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Terms &amp; Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              {[
                ["1. Acceptance of Terms", "By accessing or using the AMAX Global platform, you agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and AMAX Financial Pty Ltd (ABN 54 690 827 608)."],
                ["2. Eligibility", "You must be at least 18 years of age and legally capable of entering into binding contracts to use our services. Use is restricted in jurisdictions where such services are prohibited by applicable law."],
                ["3. Account Responsibilities", "You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of any unauthorised use at support@amaxglobal.com.au."],
                ["4. Services", "AMAX Global provides multi-currency eWallet management, foreign exchange (FX) conversion, remittance, and regulated digital currency exchange (DCE) services. All services are subject to Australian financial regulations and require completed KYC/AML verification. AMAX Global does not provide financial advice or investment recommendations."],
                ["5. Fees and Charges", "AMAX Global charges fees for FX conversion (0.5% of converted amount) and fiat withdrawals (flat fee per currency, disclosed at checkout). All fees are disclosed prior to transaction confirmation."],
                ["6. Limitation of Liability", "AMAX Global is not liable for losses arising from market fluctuations, system outages, third-party failures, or events beyond our reasonable control. To the extent permitted by Australian Consumer Law, our total liability shall not exceed fees paid in the preceding 12 months."],
                ["7. Governing Law", "These Terms are governed by the laws of New South Wales, Australia. Disputes shall be subject to the non-exclusive jurisdiction of the courts of New South Wales."],
              ].map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-2">Last updated: April 2026 | AMAX Financial Pty Ltd (ABN 54 690 827 608) | Level 2, 8-12 King Street, Rockdale NSW 2216</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Privacy Tab ── */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" /> Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              {[
                ["1. Data We Collect", "We collect information you provide directly (name, email, government-issued ID, financial data), usage data (transaction history, platform interactions), and technical data (IP address, device type, browser). Governed by the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs)."],
                ["2. How We Use Your Data", "Your data is used to provide and improve our services, comply with KYC/AML obligations under the AML/CTF Act 2006, process transactions, detect and prevent fraud, and communicate account updates. We do not sell your personal data to third parties."],
                ["3. Data Sharing", "We share data with: AUSTRAC and other regulatory bodies (as required by Australian law), payment processors and banking partners, identity verification providers, and cloud service providers under strict data processing agreements."],
                ["4. Data Retention", "Financial records are retained for a minimum of 7 years as required by the AML/CTF Act 2006. You may request deletion of non-regulatory data at privacy@amaxglobal.com.au."],
                ["5. Your Rights", "Under the Australian Privacy Act 1988 you have the right to access your personal information and request corrections. Complaints may be made to the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au."],
                ["6. Security", "We employ AES-256 encryption at rest, TLS 1.3 in transit, and multi-factor authentication. Data breaches are reported to you and the OAIC under the Notifiable Data Breaches scheme."],
              ].map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-2">Last updated: April 2026 | Australian Privacy Act 1988 | AMAX Financial Pty Ltd (ABN 54 690 827 608)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Risk Disclosure Tab ── */}
        <TabsContent value="risk-disclosure">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> Risk Disclosure Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-800">Important Notice</p>
                <p className="text-amber-700 text-sm mt-1">Foreign exchange, remittance, and digital currency exchange services involve risk. You may receive less than you send. Past exchange rates are not an indicator of future rates.</p>
              </div>
              {[
                ["1. Foreign Exchange (FX) Risk", "Currency values fluctuate continuously based on macroeconomic factors, central bank policy, geopolitical events, and market sentiment. The rate at which you exchange today may differ materially from rates available at a later date."],
                ["2. Digital Currency Risk", "Digital assets including BTC, ETH, USDT, and USDC are subject to extreme price volatility, regulatory uncertainty, technological risk, and potential total loss of value. Not suitable for individuals who cannot afford a total loss."],
                ["3. Remittance Risk", "Cross-border transfers are subject to the FX rate prevailing at execution. Delays caused by correspondent banks, local payment networks, or compliance reviews may affect the amount received."],
                ["4. Liquidity Risk", "Some currency pairs or digital assets may have limited liquidity at certain times, affecting execution price or settlement speed. Spreads may widen during high market volatility."],
                ["5. Technology Risk", "Platform outages, internet disruptions, cyber-attacks, or software errors may temporarily affect your ability to execute transactions."],
                ["6. Regulatory Risk", "Changes in Australian or international law, tax treatment, or AUSTRAC regulatory requirements may affect the availability or cost of our services."],
                ["7. No Financial Advice", "AMAX Global does not provide financial advice, investment recommendations, or tax advice. Seek independent professional advice before making significant financial decisions."],
              ].map(([title, body]) => (
                <div key={title}>
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-2">Issued by AMAX Financial Pty Ltd (ABN 54 690 827 608) | Last updated: April 2026</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
