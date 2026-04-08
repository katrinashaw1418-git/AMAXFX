import { useState } from "react";
import { useLocation } from "wouter";
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
} from "lucide-react";

export default function Compliance() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [kycStep] = useState(2);
  const [riskExperience, setRiskExperience] = useState("");
  const [riskIncome, setRiskIncome] = useState("");
  const [riskFunds, setRiskFunds] = useState("");
  const [riskGoals, setRiskGoals] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const kycStatus = {
    overall: "in_progress",
    steps: [
      { id: 1, title: "Identity Verification",  status: "completed",   icon: User,       description: "Government-issued photo ID verified" },
      { id: 2, title: "Address Verification",   status: "in_progress", icon: MapPin,     description: "Proof of address — pending upload" },
      { id: 3, title: "Source of Funds",         status: "pending",     icon: CreditCard, description: "Income / source-of-funds declaration required" },
      { id: 4, title: "Risk Assessment",         status: "pending",     icon: Shield,     description: "Questionnaire completion required" },
    ],
  };

  const documents = [
    { id: 1, type: "passport",       name: "Passport Copy",    status: "approved",      uploadDate: "2024-01-10", size: "2.4 MB" },
    { id: 2, type: "address",        name: "Utility Bill",     status: "under_review",  uploadDate: "2024-01-12", size: "1.8 MB" },
    { id: 3, type: "bank_statement", name: "Bank Statement",   status: "pending",       uploadDate: "",           size: "" },
    { id: 4, type: "income",         name: "Income Statement", status: "pending",       uploadDate: "",           size: "" },
  ];

  const complianceMetrics = [
    { label: "KYC Completion",         value: 65,  status: "in_progress" },
    { label: "AML Screening",          value: 100, status: "completed" },
    { label: "Document Verification",  value: 50,  status: "in_progress" },
    { label: "Risk Assessment",        value: 0,   status: "pending" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": case "approved":     return "bg-green-100 text-green-800";
      case "in_progress": case "under_review": return "bg-yellow-100 text-yellow-800";
      case "pending":                         return "bg-gray-100 text-gray-800";
      case "rejected":                        return "bg-red-100 text-red-800";
      default:                                return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": case "approved": return CheckCircle;
      case "rejected":                  return AlertTriangle;
      default:                          return Clock;
    }
  };

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      toast({
        title: "Document Selected",
        description: `${file.name} is ready to upload. Our compliance team will review it within 1–2 business days.`,
      });
    }
  }

  function handleContinueVerification() {
    navigate("/compliance");
    toast({
      title: "Continue Verification",
      description: "Please upload your proof of address document in the Documents tab to continue.",
    });
  }

  function handleView(docName: string) {
    toast({
      title: "Document Viewer",
      description: `Opening ${docName}… Please contact support@amaxglobal.com.au if you need a copy.`,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Centre</h1>
          <p className="text-gray-600">Manage your verification status and regulatory compliance — AMAX Financial Pty Ltd (ABN 54 690 827 608)</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Tier 2 Verified</p>
            <p className="text-xs text-gray-500">AUSTRAC registered DCE</p>
          </div>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {complianceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="kyc" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="kyc"             className="flex-1 min-w-[120px]">KYC Status</TabsTrigger>
          <TabsTrigger value="documents"       className="flex-1 min-w-[120px]">Documents</TabsTrigger>
          <TabsTrigger value="risk"            className="flex-1 min-w-[120px]">Risk Profile</TabsTrigger>
          <TabsTrigger value="regulatory"      className="flex-1 min-w-[120px]">Regulatory</TabsTrigger>
          <TabsTrigger value="terms"           className="flex-1 min-w-[120px]">Terms &amp; Conditions</TabsTrigger>
          <TabsTrigger value="privacy"         className="flex-1 min-w-[120px]">Privacy Policy</TabsTrigger>
          <TabsTrigger value="risk-disclosure" className="flex-1 min-w-[120px]">Risk Disclosure</TabsTrigger>
        </TabsList>

        {/* ── KYC Status Tab ── */}
        <TabsContent value="kyc" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Know Your Customer (KYC) Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {kycStatus.steps.map((step) => {
                  const Icon = step.icon;
                  const StatusIcon = getStatusIcon(step.status);
                  return (
                    <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-medium">{step.title}</h3>
                          <Badge className={getStatusColor(step.status)}>
                            {step.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                      <StatusIcon className={`w-5 h-5 ${
                        step.status === "completed"   ? "text-green-600"  :
                        step.status === "in_progress" ? "text-yellow-600" :
                        "text-gray-400"
                      }`} />
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Next Steps</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Complete your address verification by uploading a recent utility bill or bank statement dated within the last 3 months.
                    </p>
                    <Button size="sm" onClick={handleContinueVerification}>
                      Continue Verification
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Documents Tab ── */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.map((doc) => {
                  const StatusIcon = getStatusIcon(doc.status);
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{doc.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {doc.uploadDate && (
                              <span>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                            )}
                            {doc.size && <span>Size: {doc.size}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status.replace("_", " ")}
                        </Badge>
                        {doc.status === "pending" ? (
                          <label htmlFor={`file-upload-${doc.id}`} className="cursor-pointer">
                            <Button size="sm" asChild>
                              <span>
                                <Upload className="w-3 h-3 mr-1" />
                                Upload
                              </span>
                            </Button>
                            <input
                              id={`file-upload-${doc.id}`}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                          </label>
                        ) : (
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleView(doc.name)}>
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownload(doc.name)}>
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">Upload New Document</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Accepted formats: PDF, JPG, PNG — max 10 MB per file
                </p>
                {selectedFileName && (
                  <p className="text-sm text-green-600 mb-3 font-medium">Selected: {selectedFileName}</p>
                )}
                <label htmlFor="file-upload-general" className="cursor-pointer">
                  <Button asChild>
                    <span>Choose File</span>
                  </Button>
                  <input
                    id="file-upload-general"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Risk Profile Tab ── */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment Questionnaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label>FX / Financial Services Experience</Label>
                  <Select value={riskExperience} onValueChange={setRiskExperience}>
                    <SelectTrigger>
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
                  <Label>Annual Income (AUD)</Label>
                  <Select value={riskIncome} onValueChange={setRiskIncome}>
                    <SelectTrigger>
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
                  <Label>Primary Source of Funds</Label>
                  <Select value={riskFunds} onValueChange={setRiskFunds}>
                    <SelectTrigger>
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
                    placeholder="Describe your intended use — e.g. sending money overseas, FX conversion for business, holding digital assets…"
                    className="min-h-[100px]"
                  />
                </div>

                <Button className="w-full" onClick={handleCompleteRiskAssessment}>
                  Submit Risk Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Regulatory Tab ── */}
        <TabsContent value="regulatory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">AUSTRAC (Australia)</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-800 mb-2">Registered</Badge>
                    <p className="text-sm text-gray-600">
                      AMAX Financial Pty Ltd is registered with AUSTRAC as a Digital Currency Exchange (DCE) provider and remittance dealer. ABN 54 690 827 608.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">Australian Privacy Act 1988</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-800 mb-2">Compliant</Badge>
                    <p className="text-sm text-gray-600">
                      All personal information is collected, held, and used in accordance with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs).
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">AML/CTF Act 2006 (Australia)</h3>
                    </div>
                    <Badge className="bg-green-100 text-green-800 mb-2">Compliant</Badge>
                    <p className="text-sm text-gray-600">
                      Full compliance with the Anti-Money Laundering and Counter-Terrorism Financing Act 2006, including customer due diligence, transaction monitoring, and AUSTRAC reporting obligations.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-medium">ASIC — Consumer Compliance</h3>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 mb-2">In Progress</Badge>
                    <p className="text-sm text-gray-600">
                      Engagement with ASIC requirements for financial services consumer protection. Licensing review underway ahead of full service launch.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Regulatory Reminders</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• All users must complete KYC/AML verification before transacting</li>
                    <li>• Transactions ≥ AUD 10,000 are subject to enhanced due diligence</li>
                    <li>• Suspicious activity is reported to AUSTRAC as required by law</li>
                    <li>• Transaction records are retained for a minimum of 7 years</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Terms & Conditions Tab ── */}
        <TabsContent value="terms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Terms &amp; Conditions
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">1. Acceptance of Terms</h3>
                <p>By accessing or using the AMAX Global platform, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services. These terms constitute a legally binding agreement between you and AMAX Financial Pty Ltd (ABN 54 690 827 608).</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">2. Eligibility</h3>
                <p>You must be at least 18 years of age and legally capable of entering into binding contracts to use our services. Use of AMAX Global services is restricted in jurisdictions where such services are prohibited by applicable law.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">3. Account Responsibilities</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must notify AMAX Global immediately of any unauthorised use or suspected breach of security by emailing support@amaxglobal.com.au.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">4. Services</h3>
                <p>AMAX Global provides multi-currency eWallet management, foreign exchange (FX) conversion, remittance, and regulated digital currency exchange (DCE) services. All services are subject to applicable Australian financial regulations and require completed KYC/AML verification. AMAX Global does not provide financial advice or investment recommendations.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">5. Fees and Charges</h3>
                <p>AMAX Global charges fees for certain services including FX conversion (0.5% of converted amount) and fiat withdrawals (flat fee per currency, disclosed at checkout). Crypto exchange fees are shown before confirmation. All fees are disclosed prior to transaction confirmation.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">6. Limitation of Liability</h3>
                <p>AMAX Global is not liable for losses arising from market fluctuations, system outages, third-party failures, or events beyond our reasonable control. To the extent permitted by Australian Consumer Law, our total liability to you shall not exceed fees paid in the preceding 12 months.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">7. Governing Law</h3>
                <p>These Terms are governed by the laws of New South Wales, Australia. Disputes shall be subject to the non-exclusive jurisdiction of the courts of New South Wales.</p>
              </div>
              <p className="text-xs text-gray-400 pt-2">Last updated: April 2026 | AMAX Financial Pty Ltd (ABN 54 690 827 608) | Level 2, 8-12 King Street, Rockdale NSW 2216</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Privacy Policy Tab ── */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">1. Data We Collect</h3>
                <p>We collect information you provide directly (name, email, government-issued ID, financial data), usage data (transaction history, platform interactions), and technical data (IP address, device type, browser). All collection is governed by the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs).</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">2. How We Use Your Data</h3>
                <p>Your data is used to: provide and improve our services, comply with KYC/AML obligations under the AML/CTF Act 2006, process transactions, detect and prevent fraud, and communicate account updates. We do not sell your personal data to third parties.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">3. Data Sharing</h3>
                <p>We share data with: AUSTRAC and other regulatory bodies (as required by Australian law), payment processors and banking partners (for transaction processing), identity verification providers (for KYC), and cloud service providers (under strict data processing agreements governed by Australian law).</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">4. Data Retention</h3>
                <p>Financial records are retained for a minimum of 7 years as required by the AML/CTF Act 2006. Account data is retained for the duration of your relationship with AMAX Global and 5 years thereafter. You may request deletion of non-regulatory data at any time by contacting privacy@amaxglobal.com.au.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">5. Your Rights</h3>
                <p>Under the Australian Privacy Act 1988 you have the right to: access your personal information, request correction of inaccuracies, and make a privacy complaint. Submit requests to privacy@amaxglobal.com.au. Complaints may also be made to the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">6. Cookies</h3>
                <p>AMAX Global uses strictly necessary cookies for session management and authentication. Analytics cookies (used with consent) help us improve platform performance. You can manage cookie preferences in your browser settings.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">7. Security</h3>
                <p>We employ industry-standard security measures including AES-256 encryption at rest, TLS 1.3 in transit, and multi-factor authentication. In the event of a data breach affecting your personal information, we will notify you and the OAIC as required by the Notifiable Data Breaches scheme.</p>
              </div>
              <p className="text-xs text-gray-400 pt-2">Last updated: April 2026 | Compliant with Australian Privacy Act 1988 &amp; Australian Privacy Principles | AMAX Financial Pty Ltd (ABN 54 690 827 608)</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Risk Disclosure Tab ── */}
        <TabsContent value="risk-disclosure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Risk Disclosure Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-800">Important Notice</p>
                <p className="text-amber-700 text-sm mt-1">Foreign exchange, remittance, and digital currency exchange services involve risk. The value of currencies and digital assets can fluctuate significantly. You may receive less than you send. Past exchange rates are not an indicator of future rates.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">1. Foreign Exchange (FX) Risk</h3>
                <p>Currency values fluctuate continuously based on macroeconomic factors, central bank policy, geopolitical events, and market sentiment. The rate at which you exchange today may differ materially from rates available at a later date.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">2. Digital Currency Risk</h3>
                <p>Digital assets including Bitcoin (BTC), Ethereum (ETH), USDT, and USDC are subject to extreme price volatility, regulatory uncertainty, technological risk, and potential total loss of value. Digital currency exchange services are provided under AUSTRAC DCE registration. These services are not suitable for individuals who cannot afford to sustain a total loss.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">3. Remittance Risk</h3>
                <p>Cross-border transfers are subject to the FX rate prevailing at the time of execution. Delays caused by correspondent banks, local payment networks, or compliance reviews may affect the amount received. AMAX Global is not responsible for recipient bank fees or local deductions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">4. Liquidity Risk</h3>
                <p>Some currency pairs or digital assets may have limited liquidity at certain times, which could affect execution price or settlement speed. During periods of high market volatility, spreads may widen.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">5. Technology Risk</h3>
                <p>Platform outages, internet disruptions, cyber-attacks, or software errors may temporarily affect your ability to execute transactions. AMAX Global employs best-practice security measures but cannot guarantee uninterrupted service.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">6. Regulatory Risk</h3>
                <p>Changes in Australian or international law, tax treatment, or AUSTRAC regulatory requirements may affect the availability or cost of our services. AMAX Global monitors regulatory developments and will notify clients of material changes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-2">7. No Financial Advice</h3>
                <p>AMAX Global does not provide financial advice, investment recommendations, or tax advice. The information on this platform is for general informational purposes only. You should seek independent professional advice before making significant financial decisions.</p>
              </div>
              <p className="text-xs text-gray-400 pt-2">This disclosure is issued by AMAX Financial Pty Ltd (ABN 54 690 827 608) in accordance with Australian regulatory obligations | Last updated: April 2026</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
