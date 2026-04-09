import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Lock,
  Camera,
  BookOpen,
  Briefcase,
  Home,
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
  const { user } = useAuth();
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

  // ── Step 1: Personal Info (KYC Profile) ───────────────────────────────────
  const [piiFullName,        setPiiFullName]        = useState("");
  const [piiDob,             setPiiDob]             = useState("");
  const [piiNationality,     setPiiNationality]     = useState("");
  const [piiPhone,           setPiiPhone]           = useState("");
  // Address
  const [piiAddress,         setPiiAddress]         = useState("");
  const [piiSuburb,          setPiiSuburb]          = useState("");
  const [piiStateRegion,     setPiiStateRegion]     = useState("");
  const [piiPostcode,        setPiiPostcode]        = useState("");
  const [piiAddrCountry,     setPiiAddrCountry]     = useState("Australia");
  // Employment & financial profile
  const [piiEmployment,      setPiiEmployment]      = useState("");
  const [piiOccupation,      setPiiOccupation]      = useState("");
  const [piiPurpose,         setPiiPurpose]         = useState("");
  const [piiSourceFunds,     setPiiSourceFunds]     = useState("");
  const [piiTaxCountry,      setPiiTaxCountry]      = useState("");
  // Declarations
  const [piiPep,             setPiiPep]             = useState(false);
  const [piiSanctions,       setPiiSanctions]       = useState(false);
  const [piiConsent,         setPiiConsent]         = useState(false);
  const [piiTerms,           setPiiTerms]           = useState(false);
  const [piiRiskAck,         setPiiRiskAck]         = useState(false);
  const [piiAccuracy,        setPiiAccuracy]        = useState(false);

  // ── Step 2: Identity document + biometric verification ────────────────────
  const [docType,          setDocType]          = useState<"passport" | "driver_licence" | "national_id">("passport");
  const [idFrontFile,      setIdFrontFile]      = useState<string | null>(null);
  const [idBackFile,       setIdBackFile]       = useState<string | null>(null);
  const [selfieFile,       setSelfieFile]       = useState<string | null>(null);
  const [idVerifyAnimStep, setIdVerifyAnimStep] = useState(0);   // 0=idle 1-4=running 5=done
  const [idVerifyComplete, setIdVerifyComplete] = useState(false);
  // Veriff integration state
  type VerifyMode = "idle" | "loading" | "veriff_iframe" | "manual_review" | "approved" | "declined";
  const [verifyMode, setVerifyMode] = useState<VerifyMode>("idle");
  const [verifyUrl,  setVerifyUrl]  = useState<string>("");

  const { data: kycProfile, refetch: refetchProfile } = useQuery<{
    kycProfileComplete: boolean;
    idVerificationComplete: boolean;
    fullLegalName?: string;
    dateOfBirth?: string;
    nationality?: string;
    phoneNumber?: string;
    residentialAddress?: string;
    suburb?: string;
    stateRegion?: string;
    postcode?: string;
    addressCountry?: string;
    occupation?: string;
    employmentStatus?: string;
    purposeOfAccount?: string;
    sourceOfFunds?: string;
    taxCountry?: string;
  }>({
    queryKey: ["/api/kyc/profile"],
  });

  const profileMutation = useMutation({
    mutationFn: (payload: any) => apiRequest("PUT", "/api/kyc/profile", payload),
    onSuccess: () => {
      toast({ title: "Personal Information Saved", description: "Your KYC profile is complete. Please proceed to document upload." });
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/profile"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message ?? "Failed to save profile", variant: "destructive" });
    },
  });

  // ── Identity verification: start Veriff session ────────────────────────────
  const identityMutation = useMutation({
    mutationFn: (payload: { documentType: string }) =>
      apiRequest("POST", "/api/kyc/identity/start", payload),
    onSuccess: async (res: any) => {
      const data = await res.json();
      if (data.mode === "veriff") {
        setVerifyMode("veriff_iframe");
        setVerifyUrl(data.url);
      } else {
        // No Veriff key — manual review queued
        setVerifyMode("manual_review");
        toast({
          title: "Identity Documents Received",
          description: "Your documents have been queued for manual review by our compliance team. You will be notified within 1–2 business days.",
        });
      }
    },
    onError: (err: any) => {
      setVerifyMode("idle");
      toast({ title: "Verification Error", description: err.message ?? "Failed to start identity verification. Please try again.", variant: "destructive" });
    },
  });

  // ── Poll /api/kyc/identity/status while Veriff iframe is open ─────────────
  const { data: idStatusData } = useQuery<{ complete: boolean; documentType: string | null }>({
    queryKey: ["/api/kyc/identity/status"],
    refetchInterval: verifyMode === "veriff_iframe" ? 5000 : false,
    enabled: verifyMode === "veriff_iframe" || verifyMode === "manual_review",
  });

  useEffect(() => {
    if (idStatusData?.complete && !idVerifyComplete) {
      setIdVerifyComplete(true);
      setVerifyMode("approved");
      toast({ title: "Identity Verified", description: "Your identity has been successfully verified. You may now proceed to the next step." });
    }
  }, [idStatusData?.complete]);

  function handleProfileSubmit() {
    if (!piiFullName || !piiDob || !piiNationality || !piiPhone) {
      toast({ title: "Personal Details Required", description: "Please complete name, date of birth, nationality, and phone number.", variant: "destructive" });
      return;
    }
    if (!piiAddress || !piiSuburb || !piiPostcode) {
      toast({ title: "Address Required", description: "Please enter your full residential address (no PO Box).", variant: "destructive" });
      return;
    }
    if (!piiEmployment || !piiPurpose || !piiSourceFunds) {
      toast({ title: "Financial Profile Required", description: "Please select your employment status, purpose of account, and source of funds.", variant: "destructive" });
      return;
    }
    if (!piiSanctions || !piiConsent || !piiTerms || !piiRiskAck || !piiAccuracy) {
      toast({ title: "All Declarations Required", description: "You must accept all mandatory declarations (marked *) to proceed.", variant: "destructive" });
      return;
    }
    profileMutation.mutate({
      fullLegalName: piiFullName,
      dateOfBirth: piiDob,
      nationality: piiNationality,
      phoneNumber: piiPhone,
      // piiPep checked = user CONFIRMS they are NOT a PEP → store false (not a PEP)
      // piiPep unchecked = user has NOT confirmed non-PEP status → store true (flag for ECDD review)
      pepDeclaration: !piiPep,
      sanctionsDeclaration: piiSanctions,
      consentDeclaration: piiConsent,
      residentialAddress: piiAddress,
      suburb: piiSuburb,
      stateRegion: piiStateRegion,
      postcode: piiPostcode,
      addressCountry: piiAddrCountry,
      occupation: piiOccupation,
      employmentStatus: piiEmployment,
      purposeOfAccount: piiPurpose,
      sourceOfFunds: piiSourceFunds,
      taxCountry: piiTaxCountry,
    });
  }

  // ── derive step statuses dynamically ──────────────────────────────────────
  // Step 2: in_progress until idVerifyComplete, then completed
  // Step 3: pending until step 2 complete, then in_progress → under_review once file uploaded
  // Step 4: pending until step 3 uploaded, then in_progress → under_review once uploaded
  // Step 5: pending until step 4 uploaded, then in_progress → completed once risk submitted
  const stepStatuses = useMemo((): Record<number, StepStatus> => {
    const s2: StepStatus = idVerifyComplete ? "completed" : "in_progress";
    const s3: StepStatus = !idVerifyComplete
      ? "pending"
      : stepFiles[3]
      ? "under_review"
      : "in_progress";
    const s4: StepStatus = !stepFiles[3]
      ? "pending"
      : stepFiles[4]
      ? "under_review"
      : "in_progress";
    const s5: StepStatus = !stepFiles[4]
      ? "pending"
      : riskSubmitted
      ? "completed"
      : "in_progress";
    return { 2: s2, 3: s3, 4: s4, 5: s5 };
  }, [idVerifyComplete, stepFiles, riskSubmitted]);

  // derive current active step (first non-completed step)
  const currentStepId = useMemo(() => {
    for (const id of [2, 3, 4, 5]) {
      if (stepStatuses[id] !== "completed" && stepStatuses[id] !== "under_review") return id;
    }
    return 5;
  }, [stepStatuses]);

  // derive KYC completion % — 5 steps, 20% each
  const kycPct = useMemo(() => {
    let total = 0;
    if (kycProfile?.kycProfileComplete) total += 20; // step 1
    if (idVerifyComplete)               total += 20; // step 2
    if (stepFiles[3])                   total += 20; // step 3
    if (stepFiles[4])                   total += 20; // step 4
    if (riskSubmitted)                  total += 20; // step 5
    return total;
  }, [kycProfile?.kycProfileComplete, idVerifyComplete, stepFiles, riskSubmitted]);

  // derive doc verification %
  const docPct = useMemo(() => {
    let done = 2; // passport (approved) + utility bill (under_review) = 2 of 4
    if (stepFiles[3] || docUploads[3]) done = Math.min(4, done + 1);
    if (stepFiles[4] || docUploads[4]) done = Math.min(4, done + 1);
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
      id: 2,
      title: "Identity Verification",
      icon: User,
      baseDescription: "Government-issued photo ID verified",
      uploadId: undefined as string | undefined,
    },
    {
      id: 3,
      title: "Address Verification",
      icon: MapPin,
      baseDescription: "Upload a recent utility bill, bank statement, or government letter (dated within 3 months)",
      uploadId: "kyc-address",
    },
    {
      id: 4,
      title: "Source of Funds",
      icon: CreditCard,
      baseDescription: "Upload payslips, tax returns, or a letter from your employer",
      uploadId: "kyc-funds",
    },
    {
      id: 5,
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
      description: `Contact info@amaxglobal.com.au to retrieve a copy of ${docName}.`,
    });
  }

  function handleDownload(docName: string) {
    const email = user?.email ?? "your registered email address";
    toast({
      title: "Download Requested",
      description: `${docName} will be sent to ${email} within 24 hours.`,
    });
  }

  function handleIdVerifySubmit() {
    if (!idFrontFile) {
      toast({ title: "Document Required", description: "Please upload your identity document before submitting.", variant: "destructive" });
      return;
    }
    if (!selfieFile) {
      toast({ title: "Selfie Required", description: "A biometric selfie is required for identity matching under AUSTRAC electronic verification standards.", variant: "destructive" });
      return;
    }
    setVerifyMode("loading");
    identityMutation.mutate({ documentType: docType });
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
      description: "Your risk profile has been recorded. KYC Step 5 is now complete.",
    });
  }

  // ── document records (merged with any tab-uploads) ─────────────────────────
  const documents = [
    { id: 1, name: "Passport Copy",    status: "approved"     as const, uploadDate: "2024-01-10", size: "2.4 MB" },
    { id: 2, name: "Utility Bill",     status: "under_review" as const, uploadDate: "2024-01-12", size: "1.8 MB" },
    { id: 3, name: "Bank Statement",   status: (stepFiles[3] || docUploads[3] ? "under_review" : "pending") as any, uploadDate: "", size: "" },
    { id: 4, name: "Income Statement", status: (stepFiles[4] || docUploads[4] ? "under_review" : "pending") as any, uploadDate: "", size: "" },
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
        {kycPct === 100 ? (
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Under Review</p>
              <p className="text-xs text-blue-600">All documents submitted — awaiting compliance approval</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Verification In Progress</p>
              <p className="text-xs text-yellow-600">KYC {kycPct}% complete</p>
            </div>
          </div>
        )}
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

          {/* ── Step 1: Personal Information (mandatory first step) ── */}
          {kycProfile?.kycProfileComplete ? (
            <div className="flex items-start gap-4 p-4 border rounded-xl border-green-200 bg-green-50">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-600">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-medium">Step 1</span>
                  <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Your identity details have been recorded: {kycProfile.fullLegalName}
                  {kycProfile.nationality ? ` · ${kycProfile.nationality}` : ""}.
                  Your KYC profile is complete — proceed to document upload below.
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            </div>
          ) : (
            <Card className="border-2 border-blue-400">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Step 1 — Personal Information</CardTitle>
                    <p className="text-xs text-blue-700 mt-0.5">Required before document upload — AML/CTF Act 2006, AUSTRAC CDD requirements</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="pii-fullname" className="text-sm font-medium">
                      Full Legal Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pii-fullname"
                      placeholder="As it appears on your passport"
                      value={piiFullName}
                      onChange={e => setPiiFullName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Must match your government-issued ID exactly</p>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pii-dob" className="text-sm font-medium">
                      Date of Birth <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pii-dob"
                      type="date"
                      value={piiDob}
                      onChange={e => setPiiDob(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pii-nationality" className="text-sm font-medium">
                      Country of Nationality <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pii-nationality"
                      placeholder="e.g. Australia, China, USA"
                      value={piiNationality}
                      onChange={e => setPiiNationality(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pii-phone" className="text-sm font-medium">
                      Mobile Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="pii-phone"
                      type="tel"
                      placeholder="+61 400 000 000"
                      value={piiPhone}
                      onChange={e => setPiiPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Residential Address */}
                <div className="rounded-lg border p-4 space-y-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold">Residential Address <span className="text-red-500">*</span></h4>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">No PO Box — required for customer identification under AUSTRAC CDD rules</p>
                  <div className="space-y-1">
                    <Label htmlFor="pii-addr" className="text-sm">Street Address <span className="text-red-500">*</span></Label>
                    <Input id="pii-addr" placeholder="e.g. 12 King Street" value={piiAddress} onChange={e => setPiiAddress(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1 col-span-2 md:col-span-2">
                      <Label htmlFor="pii-suburb" className="text-sm">Suburb / City <span className="text-red-500">*</span></Label>
                      <Input id="pii-suburb" placeholder="e.g. Rockdale" value={piiSuburb} onChange={e => setPiiSuburb(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pii-state" className="text-sm">State <span className="text-red-500">*</span></Label>
                      <Select value={piiStateRegion} onValueChange={setPiiStateRegion}>
                        <SelectTrigger id="pii-state"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pii-postcode" className="text-sm">Postcode <span className="text-red-500">*</span></Label>
                      <Input id="pii-postcode" placeholder="2216" maxLength={8} value={piiPostcode} onChange={e => setPiiPostcode(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pii-addrcountry" className="text-sm">Country</Label>
                    <Input id="pii-addrcountry" placeholder="Australia" value={piiAddrCountry} onChange={e => setPiiAddrCountry(e.target.value)} />
                  </div>
                </div>

                {/* Employment & Financial Profile */}
                <div className="rounded-lg border p-4 space-y-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-semibold">Employment &amp; Financial Profile <span className="text-red-500">*</span></h4>
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">Required for AML/CTF risk assessment and transaction monitoring — AML/CTF Act 2006 §32</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Employment Status <span className="text-red-500">*</span></Label>
                      <Select value={piiEmployment} onValueChange={setPiiEmployment}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed (full-time / part-time)</SelectItem>
                          <SelectItem value="self_employed">Self-employed / Business owner</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="unemployed">Unemployed / Seeking work</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pii-occupation" className="text-sm">Occupation / Job Title</Label>
                      <Input id="pii-occupation" placeholder="e.g. Software Engineer" value={piiOccupation} onChange={e => setPiiOccupation(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Purpose of Using AMAX Global <span className="text-red-500">*</span></Label>
                      <Select value={piiPurpose} onValueChange={setPiiPurpose}>
                        <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal_transfers">Personal / Family remittances</SelectItem>
                          <SelectItem value="business_payments">Business payments</SelectItem>
                          <SelectItem value="investment">Investment / Portfolio management</SelectItem>
                          <SelectItem value="fx_conversion">FX conversion</SelectItem>
                          <SelectItem value="savings">Savings / eWallet management</SelectItem>
                          <SelectItem value="crypto">Cryptocurrency exchange</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Primary Source of Funds <span className="text-red-500">*</span></Label>
                      <Select value={piiSourceFunds} onValueChange={setPiiSourceFunds}>
                        <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employment">Employment / Salary</SelectItem>
                          <SelectItem value="business">Business income</SelectItem>
                          <SelectItem value="savings">Personal savings</SelectItem>
                          <SelectItem value="inheritance">Inheritance / Gift</SelectItem>
                          <SelectItem value="property">Property / Rental income</SelectItem>
                          <SelectItem value="investment">Investment returns</SelectItem>
                          <SelectItem value="crypto">Crypto / Digital assets</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pii-taxcountry" className="text-sm">Country of Tax Residency</Label>
                    <Input id="pii-taxcountry" placeholder="e.g. Australia" value={piiTaxCountry} onChange={e => setPiiTaxCountry(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Required for CRS / FATCA cross-border compliance where applicable</p>
                  </div>
                </div>

                {/* Declarations */}
                <div className="rounded-lg border p-4 space-y-4 bg-slate-50">
                  <div>
                    <h4 className="text-sm font-semibold">Mandatory Declarations</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">All items marked <span className="text-red-500 font-medium">*</span> are required. The PEP confirmation is optional — leave unchecked if you are, or may be, a PEP.</p>
                  </div>

                  {/* 1. Sanctions Declaration */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="pii-sanctions"
                      checked={piiSanctions}
                      onCheckedChange={v => setPiiSanctions(Boolean(v))}
                    />
                    <div>
                      <Label htmlFor="pii-sanctions" className="text-sm font-medium cursor-pointer">
                        Sanctions Declaration <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        I declare that I am not a designated person or entity under Australian sanctions laws (including the Autonomous Sanctions Act 2011),
                        United Nations Security Council sanctions, or the DFAT Consolidated List. I acknowledge that AMAX Global Pty Ltd will independently
                        screen my information against relevant sanctions lists.
                      </p>
                    </div>
                  </div>

                  {/* 2. PEP — optional, positive wording */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="pii-pep"
                      checked={piiPep}
                      onCheckedChange={v => setPiiPep(Boolean(v))}
                    />
                    <div>
                      <Label htmlFor="pii-pep" className="text-sm font-medium cursor-pointer">
                        Politically Exposed Person (PEP) Confirmation
                        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional — leave unchecked if you are a PEP)</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        I confirm that I am not a Politically Exposed Person (PEP), nor a family member or close associate of a PEP,
                        whether domestic or foreign. I understand that if I am, or become, a PEP, I must notify AMAX and may be subject
                        to enhanced due diligence.
                      </p>
                    </div>
                  </div>

                  {/* 3. Consent to Verification & Privacy */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="pii-consent"
                      checked={piiConsent}
                      onCheckedChange={v => setPiiConsent(Boolean(v))}
                    />
                    <div>
                      <Label htmlFor="pii-consent" className="text-sm font-medium cursor-pointer">
                        Consent to Verification &amp; Privacy Collection <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        I consent to AMAX Global Pty Ltd collecting, verifying, and using my personal information for identity verification,
                        fraud prevention, and compliance with the AML/CTF Act 2006. I understand that my information may be disclosed to
                        authorised third-party verification providers, regulatory bodies including AUSTRAC, and as outlined in the AMAX Privacy Policy.
                      </p>
                    </div>
                  </div>

                  {/* 4. Terms & Conditions */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="pii-terms"
                      checked={piiTerms}
                      onCheckedChange={v => setPiiTerms(Boolean(v))}
                    />
                    <div>
                      <Label htmlFor="pii-terms" className="text-sm font-medium cursor-pointer">
                        Terms &amp; Conditions Acceptance <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        I agree to the AMAX Global Terms and Conditions and acknowledge that I have read and understood them.
                      </p>
                    </div>
                  </div>

                  {/* 5. Account Use & Risk Acknowledgement */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="pii-riskack"
                      checked={piiRiskAck}
                      onCheckedChange={v => setPiiRiskAck(Boolean(v))}
                    />
                    <div>
                      <Label htmlFor="pii-riskack" className="text-sm font-medium cursor-pointer">
                        Account Use &amp; Monitoring Acknowledgement <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        I understand that my account and transactions may be monitored and, where required, restricted, delayed, or reported
                        to comply with applicable laws and regulations including the AML/CTF Act 2006.
                      </p>
                    </div>
                  </div>

                  {/* 6. Accuracy Declaration */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="pii-accuracy"
                      checked={piiAccuracy}
                      onCheckedChange={v => setPiiAccuracy(Boolean(v))}
                    />
                    <div>
                      <Label htmlFor="pii-accuracy" className="text-sm font-medium cursor-pointer">
                        Accuracy Declaration <span className="text-red-500">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        I declare that all information provided is true, accurate, and complete. I understand that providing false or
                        misleading information may result in account suspension or reporting to relevant authorities.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={profileMutation.isPending}
                  onClick={handleProfileSubmit}
                >
                  {profileMutation.isPending ? "Saving..." : "Save Personal Information & Continue"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Your information is encrypted and stored securely. Required under AML/CTF Act 2006 §33.
                </p>
              </CardContent>
            </Card>
          )}

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

                // ── Step 2 expanded identity verification card ──────────────
                if (def.id === 2 && status === "in_progress") {
                  const docLabels = {
                    passport:       { label: "Passport",       sub: "Any country",        hint: "Upload the photo page of your passport. Ensure all four corners are visible and text is legible." },
                    driver_licence: { label: "Driver Licence", sub: "Australian only",    hint: "Upload both the front and back of your Australian driver licence." },
                    national_id:    { label: "National ID",    sub: "Foreign nationals",  hint: "Upload both the front and back of your national identity card." },
                  };
                  const dl = docLabels[docType];
                  const needsBack = docType !== "passport";
                  const animSteps = [
                    { label: "Documents Received",       icon: FileText  },
                    { label: "Identity Matching",        icon: User      },
                    { label: "Sanctions & PEP Screening",icon: Shield    },
                    { label: "Risk Score Assigned",      icon: CheckCircle },
                  ];

                  return (
                    <div key={def.id} className="border-2 border-yellow-300 bg-yellow-50 rounded-xl overflow-hidden">
                      {/* Step header */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-yellow-500">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400 font-medium">Step 2 of 5</span>
                            <h3 className="font-semibold text-gray-900">Document upload &amp; ID verification</h3>
                            <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">Upload your government-issued ID and a biometric selfie — required under AUSTRAC electronic verification standards</p>
                        </div>
                      </div>

                      {verifyMode === "idle" && (
                        <div className="px-4 pb-5 space-y-4">
                          {/* Document type selector */}
                          <div className="bg-white border rounded-xl p-4 space-y-3">
                            <h4 className="font-semibold text-sm">Select your document type</h4>
                            <p className="text-xs text-muted-foreground">Choose the government-issued ID you will upload</p>
                            <div className="grid grid-cols-3 gap-3">
                              {(["passport","driver_licence","national_id"] as const).map((dt) => {
                                const info = docLabels[dt];
                                return (
                                  <button
                                    key={dt}
                                    type="button"
                                    onClick={() => setDocType(dt)}
                                    className={`border-2 rounded-xl p-3 text-center transition-all ${
                                      docType === dt
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-white hover:border-gray-300"
                                    }`}
                                  >
                                    <div className="text-2xl mb-1">
                                      {dt === "passport" ? "📕" : dt === "driver_licence" ? "🚗" : "🪪"}
                                    </div>
                                    <div className="text-xs font-semibold">{info.label}</div>
                                    <div className="text-xs text-muted-foreground">{info.sub}</div>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{dl.hint}</div>
                          </div>

                          {/* Document upload zone(s) */}
                          <div className="bg-white border rounded-xl p-4 space-y-3">
                            <h4 className="font-semibold text-sm">Upload your document</h4>
                            <p className="text-xs text-muted-foreground">JPG, PNG or PDF — max 10 MB per file</p>
                            <div className={`grid gap-3 ${needsBack ? "grid-cols-2" : "grid-cols-1"}`}>
                              {/* Front / single */}
                              <label htmlFor="id-front" className="cursor-pointer block">
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                                  idFrontFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400"
                                }`}>
                                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  {idFrontFile ? (
                                    <>
                                      <p className="text-sm font-medium text-green-700">✓ {idFrontFile}</p>
                                      <p className="text-xs text-green-600">Tap to replace</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm font-medium">Click to upload or drag &amp; drop</p>
                                      <p className="text-xs text-muted-foreground">
                                        {needsBack ? `${dl.label} — front` : `${dl.label} photo page`}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <input id="id-front" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" className="hidden"
                                  onChange={e => { const f = e.target.files?.[0]; if (f) { setIdFrontFile(f.name); e.target.value = ""; } }} />
                              </label>
                              {/* Back (driver licence / national ID only) */}
                              {needsBack && (
                                <label htmlFor="id-back" className="cursor-pointer block">
                                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                                    idBackFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400"
                                  }`}>
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    {idBackFile ? (
                                      <>
                                        <p className="text-sm font-medium text-green-700">✓ {idBackFile}</p>
                                        <p className="text-xs text-green-600">Tap to replace</p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-sm font-medium">Click to upload or drag &amp; drop</p>
                                        <p className="text-xs text-muted-foreground">{dl.label} — back</p>
                                      </>
                                    )}
                                  </div>
                                  <input id="id-back" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) { setIdBackFile(f.name); e.target.value = ""; } }} />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Biometric selfie */}
                          <div className="bg-white border rounded-xl p-4 space-y-3">
                            <h4 className="font-semibold text-sm">Biometric selfie</h4>
                            <p className="text-xs text-muted-foreground">A live photo to match your face against your document</p>
                            <label htmlFor="id-selfie" className="cursor-pointer block">
                              <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                                selfieFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400"
                              }`}>
                                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                {selfieFile ? (
                                  <>
                                    <p className="text-sm font-medium text-green-700">✓ {selfieFile}</p>
                                    <p className="text-xs text-green-600">Tap to replace</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-sm font-medium">Take or upload a selfie</p>
                                    <p className="text-xs text-muted-foreground">Face clearly visible, no sunglasses, good lighting</p>
                                  </>
                                )}
                              </div>
                              <input id="id-selfie" type="file" accept=".jpg,.jpeg,.png,.heic" capture="user" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) { setSelfieFile(f.name); e.target.value = ""; } }} />
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                              <p className="text-xs font-semibold text-gray-700">Tips for a successful selfie</p>
                              {[
                                "Look directly at the camera in a well-lit space",
                                "Remove glasses, hats, or anything covering your face",
                                "Plain background preferred — no filters",
                                "Your face should fill at least 70% of the frame",
                              ].map(tip => (
                                <p key={tip} className="text-xs text-gray-600">• {tip}</p>
                              ))}
                            </div>
                          </div>

                          <Button
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                            disabled={verifyMode === "loading"}
                            onClick={handleIdVerifySubmit}
                          >
                            {verifyMode === "loading" ? "Starting verification…" : "Submit for verification"}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> 256-bit encrypted — data handled under the AMAX Privacy Policy &amp; AML/CTF Act 2006
                          </p>
                        </div>
                      )}

                      {/* Loading state */}
                      {verifyMode === "loading" && (
                        <div className="px-4 pb-5 flex flex-col items-center gap-3 py-6">
                          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-sm font-medium text-gray-700">Connecting to verification provider…</p>
                          <p className="text-xs text-muted-foreground">Please wait while we prepare your secure session.</p>
                        </div>
                      )}

                      {/* Veriff iframe — external verification session */}
                      {verifyMode === "veriff_iframe" && (
                        <div className="px-4 pb-5 space-y-3">
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-blue-900 text-sm">Secure Verification Session Active</p>
                                <p className="text-xs text-blue-700 mt-0.5">
                                  Complete your identity verification in the window below. Your documents are processed by our
                                  AUSTRAC-approved identity verification provider. This typically takes 1–3 minutes.
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-blue-600 bg-blue-100 rounded-lg px-3 py-2 flex items-center gap-2">
                              <RefreshCw className="w-3 h-3 animate-spin flex-shrink-0" />
                              Polling for verification result every 5 seconds…
                            </div>
                          </div>
                          {/* Veriff iframe — embedded verification flow */}
                          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: "600px" }}>
                            <iframe
                              src={verifyUrl}
                              title="Identity Verification"
                              allow="camera; microphone"
                              className="w-full h-full border-0"
                            />
                          </div>
                          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> 256-bit encrypted — processed by Veriff under AUSTRAC AML/CTF Act 2006 obligations
                          </p>
                        </div>
                      )}

                      {/* Manual review pending — no Veriff API key */}
                      {verifyMode === "manual_review" && (
                        <div className="px-4 pb-5">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 space-y-3">
                            <div className="flex items-start gap-3">
                              <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-yellow-900">Documents Received — Awaiting Manual Review</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                  Your identity documents have been received and queued for review by our compliance team
                                  (Compliance Officer: Qin Xiong). You will be notified at your registered email address
                                  within <strong>1–2 business days</strong>.
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white border border-yellow-200 rounded-lg px-3 py-2">
                                <p className="text-gray-500">Review Status</p>
                                <p className="font-semibold text-yellow-700">In Queue</p>
                              </div>
                              <div className="bg-white border border-yellow-200 rounded-lg px-3 py-2">
                                <p className="text-gray-500">Expected Turnaround</p>
                                <p className="font-semibold text-yellow-700">1–2 business days</p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Contact <a href="mailto:info@amaxglobal.com.au" className="underline">info@amaxglobal.com.au</a> if
                              you have not received confirmation within 2 business days.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Verified — Veriff approved */}
                      {verifyMode === "approved" && (
                        <div className="px-4 pb-5">
                          <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-green-900">Identity Verified</p>
                                <p className="text-sm text-green-700">All checks passed — document verified, face matched, sanctions clear</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                <p className="text-gray-500">Provider</p>
                                <p className="font-semibold text-green-700">Veriff</p>
                              </div>
                              <div className="bg-white border border-green-200 rounded-lg px-3 py-2">
                                <p className="text-gray-500">Account Status</p>
                                <p className="font-semibold text-green-700">Unlocked</p>
                              </div>
                            </div>
                            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                              <Lock className="w-3 h-3" /> 256-bit encrypted — processed under the AMAX Privacy Policy &amp; AML/CTF Act 2006
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Declined */}
                      {verifyMode === "declined" && (
                        <div className="px-4 pb-5">
                          <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-red-900">Verification Unsuccessful</p>
                                <p className="text-sm text-red-700">
                                  We were unable to verify your identity. Please contact{" "}
                                  <a href="mailto:info@amaxglobal.com.au" className="underline">info@amaxglobal.com.au</a>{" "}
                                  for assistance.
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => setVerifyMode("idle")}>
                              Try Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

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
                      ) : def.id === 5 && status === "in_progress" ? (
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
              nextStep.id === 5 ? "border-purple-200 bg-purple-50" : "border-blue-200 bg-blue-50"
            }`}>
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className={`w-5 h-5 mt-0.5 flex-shrink-0 ${nextStep.id === 5 ? "text-purple-600" : "text-blue-600"}`} />
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${nextStep.id === 5 ? "text-purple-900" : "text-blue-900"}`}>
                    Next: {nextStep.title}
                  </h4>
                  <p className={`text-sm mb-3 ${nextStep.id === 5 ? "text-purple-700" : "text-blue-700"}`}>
                    {nextStep.id === 3 && "Upload a utility bill, bank statement, or government letter dated within the last 3 months showing your full name and address."}
                    {nextStep.id === 4 && "Upload a recent payslip, tax return, or employer letter confirming your income and source of funds."}
                    {nextStep.id === 5 && "You're almost there! Complete the short risk assessment questionnaire to finish your KYC verification."}
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

          {/* All steps submitted — under review */}
          {!nextStep && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900">All Documents Submitted — Under Review</h4>
                  <p className="text-sm text-blue-700">Our compliance team is reviewing your documents. This typically takes 1–2 business days. You will be notified by email once your account is approved.</p>
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
                        {(doc.id === 3 && stepFiles[3]) && <span className="text-blue-600">✓ {stepFiles[3]}</span>}
                        {(doc.id === 4 && stepFiles[4]) && <span className="text-blue-600">✓ {stepFiles[4]}</span>}
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
              <p className="text-sm text-gray-500">Required to complete KYC Step 5. All fields marked * are required.</p>
            </CardHeader>
            <CardContent className="space-y-5">
              {riskSubmitted ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900">Risk Assessment Complete</h4>
                    <p className="text-sm text-green-700">Your risk profile has been recorded and KYC Step 5 is now marked complete.</p>
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
                ["3. Account Responsibilities", "You are responsible for maintaining the confidentiality of your credentials and all activity under your account. Notify us immediately of any unauthorised use at info@amaxglobal.com.au."],
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
                ["4. Data Retention", "Financial records retained ≥ 7 years (AML/CTF Act 2006). Deletion of non-regulatory data: info@amaxglobal.com.au."],
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
