import { useState, useMemo, useEffect, useRef } from "react";
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
  PenLine,
  FileCheck,
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
  // PEP status — identity data for risk scoring (moved to agreement step for signing)
  const [piiPep,             setPiiPep]             = useState(false);

  // ── Step 3: Customer Agreement ─────────────────────────────────────────────
  const [signatureName,  setSignatureName]  = useState("");
  const [sectionsRead,   setSectionsRead]   = useState<Set<number>>(new Set());
  const agreementScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs        = useRef<(HTMLDivElement | null)[]>([]);
  const allSectionsRead    = sectionsRead.size >= 6;

  // ── Step 2: Identity document + biometric verification ────────────────────
  const [docType,          setDocType]          = useState<"passport" | "driver_licence" | "national_id">("passport");
  const [docExpiry,        setDocExpiry]        = useState("");           // YYYY-MM-DD from date input
  const [docIssueCountry,  setDocIssueCountry]  = useState("");           // issuing country (passport risk scoring)
  const [idFrontFile,      setIdFrontFile]      = useState<string | null>(null);
  const [idBackFile,       setIdBackFile]       = useState<string | null>(null);
  const [selfieFile,       setSelfieFile]       = useState<string | null>(null);
  const [idVerifyAnimStep, setIdVerifyAnimStep] = useState(0);   // 0=idle 1-4=running 5=done
  const [idVerifyComplete, setIdVerifyComplete] = useState(false);
  const [addrPoaFile,      setAddrPoaFile]      = useState<string | null>(null); // Step 3 proof of address
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
    kycRefreshDue?: string | null;
    agreementSigned?: boolean;
    agreementSignedAt?: string | null;
    agreementRef?: string | null;
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
    mutationFn: (payload: { documentType: string; documentExpiry?: string; issueCountry?: string }) =>
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

  // ── Customer Agreement signing mutation ────────────────────────────────────
  const agreementMutation = useMutation({
    mutationFn: (payload: { signature: string; pepDeclaration: boolean }) =>
      apiRequest("POST", "/api/kyc/agreement/sign", payload),
    onSuccess: async (res: any) => {
      const data = await res.json();
      toast({ title: "Agreement Signed", description: `Customer agreement signed — ref ${data.agreementRef}` });
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/profile"] });
    },
    onError: (err: any) => {
      toast({ title: "Signing Failed", description: err.message ?? "Failed to record your signature. Please try again.", variant: "destructive" });
    },
  });

  // ── Agreement scroll tracking — marks sections as read on scroll ──────────
  function handleAgreementScroll() {
    const container = agreementScrollRef.current;
    if (!container) return;
    const containerBottom = container.getBoundingClientRect().bottom;
    const newRead = new Set(sectionsRead);
    sectionRefs.current.forEach((el, idx) => {
      if (!el) return;
      const elBottom = el.getBoundingClientRect().bottom;
      if (elBottom <= containerBottom + 40) newRead.add(idx + 1);
    });
    setSectionsRead(newRead);
  }

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
    profileMutation.mutate({
      fullLegalName: piiFullName,
      dateOfBirth: piiDob,
      nationality: piiNationality,
      phoneNumber: piiPhone,
      // pepDeclaration will be captured during Customer Agreement signing (Step 3)
      pepDeclaration: false,
      sanctionsDeclaration: false,
      consentDeclaration: false,
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
  // Step 2: identity verification
  // Step 3: customer agreement (new) — unlocked after identity verified
  // Step 4: address verification — unlocked after agreement signed
  // Step 5: source of funds — unlocked after address uploaded
  const agreementSigned = kycProfile?.agreementSigned ?? false;
  const stepStatuses = useMemo((): Record<number, StepStatus> => {
    const s2: StepStatus = idVerifyComplete ? "completed" : "in_progress";
    const s3: StepStatus = !idVerifyComplete
      ? "pending"
      : agreementSigned
      ? "completed"
      : "in_progress";
    const s4: StepStatus = !agreementSigned
      ? "pending"
      : stepFiles[4]
      ? "under_review"
      : "in_progress";
    const s5: StepStatus = !stepFiles[4]
      ? "pending"
      : riskSubmitted || stepFiles[5]
      ? "completed"
      : "in_progress";
    return { 2: s2, 3: s3, 4: s4, 5: s5 };
  }, [idVerifyComplete, agreementSigned, stepFiles, riskSubmitted]);

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
    if (kycProfile?.agreementSigned)    total += 20; // step 3 customer agreement
    if (stepFiles[4])                   total += 20; // step 4 address
    if (riskSubmitted || stepFiles[5])  total += 20; // step 5 source of funds
    return total;
  }, [kycProfile?.kycProfileComplete, kycProfile?.agreementSigned, idVerifyComplete, stepFiles, riskSubmitted]);

  // derive doc verification %
  const docPct = useMemo(() => {
    let done = 2; // passport (approved) + utility bill (under_review) = 2 of 4
    if (stepFiles[4] || docUploads[4]) done = Math.min(4, done + 1);
    if (stepFiles[5] || docUploads[5]) done = Math.min(4, done + 1);
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

  // ── KYC refresh notice ─────────────────────────────────────────────────────
  const kycRefreshNotice = useMemo((): "overdue" | "due_soon" | null => {
    if (!kycProfile?.kycRefreshDue) return null;
    const due = new Date(kycProfile.kycRefreshDue);
    const now = new Date();
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 0)  return "overdue";
    if (daysUntilDue <= 30) return "due_soon";
    return null;
  }, [kycProfile?.kycRefreshDue]);

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
      title: "Customer Agreement",
      icon: FileCheck,
      baseDescription: "Read and sign the AMAX Global Customer Agreement",
      uploadId: undefined as string | undefined,
    },
    {
      id: 4,
      title: "Address Verification",
      icon: MapPin,
      baseDescription: "Upload a recent utility bill, bank statement, or government letter (dated within 3 months)",
      uploadId: "kyc-address",
    },
    {
      id: 5,
      title: "Source of Funds",
      icon: CreditCard,
      baseDescription: "Upload payslips, tax returns, or a letter from your employer",
      uploadId: "kyc-funds",
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
    if (!docExpiry) {
      toast({ title: "Expiry Date Required", description: "Please enter your document's expiry date.", variant: "destructive" });
      return;
    }
    if (new Date(docExpiry) <= new Date()) {
      toast({ title: "Document Expired", description: "Your document has expired. Please provide a valid, in-date government-issued ID.", variant: "destructive" });
      return;
    }
    if (docType === "passport" && !docIssueCountry) {
      toast({ title: "Issuing Country Required", description: "Please enter the country that issued your passport.", variant: "destructive" });
      return;
    }
    if (!idFrontFile) {
      toast({ title: "Document Required", description: "Please upload your identity document before submitting.", variant: "destructive" });
      return;
    }
    if (!selfieFile) {
      toast({ title: "Selfie Required", description: "A biometric selfie is required for identity matching under AUSTRAC electronic verification standards.", variant: "destructive" });
      return;
    }
    setVerifyMode("loading");
    identityMutation.mutate({ documentType: docType, documentExpiry: docExpiry, issueCountry: docIssueCountry || undefined });
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

  // ── document records (merged with any step/tab-uploads) ────────────────────
  const documents = [
    { id: 1, name: "Passport / Government ID", status: "approved"     as const, uploadDate: "2024-01-10", size: "2.4 MB" },
    { id: 2, name: "Biometric Selfie",          status: "under_review" as const, uploadDate: "2024-01-12", size: "1.8 MB" },
    { id: 4, name: "Proof of Address",          status: (stepFiles[4] || docUploads[4] ? "under_review" : "pending") as any, uploadDate: "", size: "" },
    { id: 5, name: "Source of Funds",           status: (stepFiles[5] || docUploads[5] ? "under_review" : "pending") as any, uploadDate: "", size: "" },
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
        <TabsList className="flex h-auto gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <TabsTrigger value="kyc"        className="flex-1 sm:flex-none text-xs sm:text-sm">KYC &amp; Documents</TabsTrigger>
          <TabsTrigger value="regulatory" className="flex-1 sm:flex-none text-xs sm:text-sm">Regulatory</TabsTrigger>
        </TabsList>

        {/* ── KYC Status Tab ── */}
        <TabsContent value="kyc" className="space-y-4">

          {/* ── KYC Refresh Notification ── */}
          {kycRefreshNotice === "overdue" && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-red-300 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">KYC Review Overdue</p>
                <p className="text-sm text-red-700 mt-0.5">
                  Your scheduled KYC review date has passed. Under AUSTRAC CDD obligations, periodic customer
                  review is required. Please contact{" "}
                  <a href="mailto:info@amaxglobal.com.au" className="underline font-medium">info@amaxglobal.com.au</a>
                  {" "}to arrange your review or re-submit your information using the form below.
                </p>
              </div>
            </div>
          )}
          {kycRefreshNotice === "due_soon" && (
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50">
              <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">KYC Review Due Soon</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Your periodic KYC review is due within the next 30 days (due:{" "}
                  {new Date(kycProfile!.kycRefreshDue!).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}).
                  Please update your details or contact{" "}
                  <a href="mailto:info@amaxglobal.com.au" className="underline font-medium">info@amaxglobal.com.au</a>.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 1: Personal Information (mandatory first step) ── */}
          {kycProfile?.kycProfileComplete ? (
            <div className="flex items-start gap-4 p-4 border rounded-xl border-green-200 bg-green-50">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-600">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-medium">Step 1 of 5</span>
                  <h3 className="font-semibold text-gray-900">Personal Information</h3>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {kycProfile.fullLegalName}{kycProfile.nationality ? ` · ${kycProfile.nationality}` : ""} · Profile saved and verified.
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-blue-300 bg-white overflow-hidden shadow-sm">

              {/* Card top bar */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Step 1 of 5 — Personal Information</p>
                      <p className="text-blue-200 text-xs mt-0.5">Takes about 3 minutes · Required by AUSTRAC</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                    <Lock className="w-3 h-3 text-blue-200" />
                    <span className="text-blue-200 text-xs font-medium">Encrypted</span>
                  </div>
                </div>
                {/* Mini step dots */}
                <div className="flex items-center gap-1.5 mt-3">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`h-1.5 rounded-full transition-all ${n === 1 ? "bg-white flex-1" : "bg-white/30 w-6"}`} />
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-5">

                {/* Section A — Identity */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-xs font-bold">A</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800">Your Identity</h4>
                    <span className="text-xs text-gray-400 ml-auto">Must match your ID exactly</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pii-fullname" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Full Legal Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pii-fullname"
                        placeholder="As shown on your passport or driver licence"
                        value={piiFullName}
                        onChange={e => setPiiFullName(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pii-dob" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Date of Birth <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pii-dob"
                        type="date"
                        value={piiDob}
                        onChange={e => setPiiDob(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pii-nationality" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Country of Nationality <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pii-nationality"
                        placeholder="e.g. Australia"
                        value={piiNationality}
                        onChange={e => setPiiNationality(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pii-phone" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Mobile Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="pii-phone"
                        type="tel"
                        placeholder="+61 400 000 000"
                        value={piiPhone}
                        onChange={e => setPiiPhone(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Section B — Residential Address */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-xs font-bold">B</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800">Residential Address</h4>
                    <span className="text-xs text-gray-400 ml-auto">No PO Box</span>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pii-addr" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Street Address <span className="text-red-500">*</span>
                      </Label>
                      <Input id="pii-addr" placeholder="e.g. 12 King Street" value={piiAddress} onChange={e => setPiiAddress(e.target.value)} className="h-10 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label htmlFor="pii-suburb" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Suburb / City <span className="text-red-500">*</span>
                        </Label>
                        <Input id="pii-suburb" placeholder="e.g. Rockdale" value={piiSuburb} onChange={e => setPiiSuburb(e.target.value)} className="h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          State <span className="text-red-500">*</span>
                        </Label>
                        <Select value={piiStateRegion} onValueChange={setPiiStateRegion}>
                          <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="State" /></SelectTrigger>
                          <SelectContent>
                            {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="pii-postcode" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Postcode <span className="text-red-500">*</span>
                        </Label>
                        <Input id="pii-postcode" placeholder="2216" maxLength={8} value={piiPostcode} onChange={e => setPiiPostcode(e.target.value)} className="h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pii-addrcountry" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Country
                        </Label>
                        <Input id="pii-addrcountry" placeholder="Australia" value={piiAddrCountry} onChange={e => setPiiAddrCountry(e.target.value)} className="h-10 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Section C — Account Profile */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-xs font-bold">C</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800">Account Profile</h4>
                    <span className="text-xs text-gray-400 ml-auto">AML/CTF Act 2006 §32</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Employment Status <span className="text-red-500">*</span>
                      </Label>
                      <Select value={piiEmployment} onValueChange={setPiiEmployment}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
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
                    <div className="space-y-1.5">
                      <Label htmlFor="pii-occupation" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Occupation / Job Title
                      </Label>
                      <Input id="pii-occupation" placeholder="e.g. Software Engineer" value={piiOccupation} onChange={e => setPiiOccupation(e.target.value)} className="h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Purpose of Account <span className="text-red-500">*</span>
                      </Label>
                      <Select value={piiPurpose} onValueChange={setPiiPurpose}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select purpose" /></SelectTrigger>
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
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Source of Funds <span className="text-red-500">*</span>
                      </Label>
                      <Select value={piiSourceFunds} onValueChange={setPiiSourceFunds}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select source" /></SelectTrigger>
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
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="pii-taxcountry" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Country of Tax Residency
                      </Label>
                      <Input id="pii-taxcountry" placeholder="e.g. Australia (for CRS / FATCA reporting)" value={piiTaxCountry} onChange={e => setPiiTaxCountry(e.target.value)} className="h-10 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="pt-1 space-y-3">
                  <Button
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl"
                    disabled={profileMutation.isPending}
                    onClick={handleProfileSubmit}
                  >
                    {profileMutation.isPending ? (
                      <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</span>
                    ) : (
                      "Continue to Identity Verification →"
                    )}
                  </Button>
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> 256-bit encrypted</span>
                    <span>·</span>
                    <span>AUSTRAC registered</span>
                    <span>·</span>
                    <span>Privacy Act 1988</span>
                  </div>
                </div>
              </div>
            </div>
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

                          {/* Document details — expiry + issuing country */}
                          <div className="bg-white border rounded-xl p-4 space-y-3">
                            <h4 className="font-semibold text-sm">Document details</h4>
                            <p className="text-xs text-muted-foreground">Required before submission — expired documents are rejected automatically.</p>
                            <div className={`grid gap-3 ${docType === "passport" ? "grid-cols-2" : "grid-cols-1"}`}>
                              <div>
                                <Label className="text-xs">Document expiry date <span className="text-red-500">*</span></Label>
                                <input
                                  type="date"
                                  value={docExpiry}
                                  onChange={e => setDocExpiry(e.target.value)}
                                  min={new Date().toISOString().split("T")[0]}
                                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                                />
                                {docExpiry && new Date(docExpiry) <= new Date() && (
                                  <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Document has expired — you must use a current document
                                  </p>
                                )}
                              </div>
                              {docType === "passport" && (
                                <div>
                                  <Label className="text-xs">Country of issue <span className="text-red-500">*</span></Label>
                                  <Input
                                    placeholder="e.g. Australia, China, UK"
                                    value={docIssueCountry}
                                    onChange={e => setDocIssueCountry(e.target.value)}
                                    className="h-9 text-sm mt-1"
                                  />
                                  <p className="text-xs text-muted-foreground mt-0.5">Jurisdiction risk scoring — AUSTRAC requirement</p>
                                </div>
                              )}
                            </div>
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
                            <Lock className="w-3 h-3" /> Your documents are encrypted in transit and stored securely by our KYC provider in accordance with the Australian Privacy Act 1988.
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
                            <Lock className="w-3 h-3" /> Your documents are encrypted in transit and stored securely by our KYC provider in accordance with the Australian Privacy Act 1988 and AML/CTF Act 2006.
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
                        <div className="px-4 pb-5 space-y-3">
                          <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-red-900">Verification Unsuccessful</p>
                                <p className="text-sm text-red-700">
                                  Your identity could not be verified automatically. Common reasons include:
                                </p>
                              </div>
                            </div>
                            <ul className="text-xs text-red-700 space-y-1 pl-2">
                              {[
                                "Document image was blurry or partially obscured — please retake in good lighting",
                                "Name on document does not match your registered account name",
                                "Document is expired or from a country not currently accepted",
                                "Selfie did not match the photo on your ID — ensure your face is clearly visible",
                              ].map(r => (
                                <li key={r} className="flex items-start gap-1.5">
                                  <span className="text-red-400 mt-0.5">•</span>{r}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-red-600">
                              If the problem persists, contact our compliance team at{" "}
                              <a href="mailto:info@amaxglobal.com.au" className="underline font-medium">info@amaxglobal.com.au</a>.
                            </p>
                            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={() => { setVerifyMode("idle"); setIdFrontFile(null); setIdBackFile(null); setSelfieFile(null); }}>
                              Try Again with Better Documents
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Step 3 expanded Customer Agreement card ─────────────────
                if (def.id === 3 && status === "in_progress") {
                  const agreementSections = [
                    {
                      title: "1. Terms of Service",
                      content: `These Terms of Service govern your use of AMAX Global Pty Ltd's (ABN 54 690 827 608) digital financial services platform, including foreign exchange, eWallet, digital currency exchange, and remittance services ("Services"). By accepting these terms you agree to be bound by all provisions herein and any supplementary policies published by AMAX Global from time to time.

You must be at least 18 years of age and have legal capacity to enter into binding contracts under Australian law. You agree to use the Services only for lawful purposes and in compliance with all applicable Australian laws, including but not limited to the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth) ("AML/CTF Act"), the Currency (Restrictions on the Use of Cash) Act 2019 (Cth), and the Australian Consumer Law.

AMAX Global reserves the right to suspend, restrict, or terminate your account where there is reasonable suspicion of fraud, money laundering, terrorism financing, sanctions evasion, or any other illegal activity. Transaction limits, fees, and foreign exchange rates are published on our website and may change without prior notice to the extent permitted by law.

These Terms are governed by the laws of New South Wales, Australia. Disputes are subject to the exclusive jurisdiction of courts of competent jurisdiction in New South Wales.`,
                    },
                    {
                      title: "2. Privacy Policy",
                      content: `AMAX Global Pty Ltd collects, uses, and discloses your personal information in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). Information collected includes identity documents, biometric data (for identity verification), financial information, transaction history, and device and usage data.

Your personal information is used to: (a) verify your identity and comply with CDD/ECDD obligations under the AML/CTF Act; (b) provide and improve our Services; (c) detect, prevent, and investigate fraud, money laundering, and sanctions evasion; (d) comply with our legal and regulatory obligations; and (e) communicate with you regarding your account.

We may disclose your information to: AUSTRAC and other regulatory authorities as required by law; DFAT and law enforcement agencies; identity verification providers (including Veriff Pty Ltd); financial institutions processing your transactions; and our professional advisors. We do not sell your personal information.

You have the right to access and correct your personal information. Contact our Privacy Officer at info@amaxglobal.com.au. Data may be transferred to servers in Australia and internationally where our service providers operate.`,
                    },
                    {
                      title: "3. AML/CTF Declaration",
                      content: `Anti-Money Laundering and Counter-Terrorism Financing Declaration — required under the AML/CTF Act 2006 (Cth) and AUSTRAC obligations.

I declare that:
(a) I am opening this account solely on my own behalf and not as an agent, trustee, or nominee for any other person or entity, unless I have separately disclosed a third-party arrangement in writing to AMAX Global;
(b) The funds I deposit, exchange, or remit through AMAX Global are derived from legitimate sources and do not, to the best of my knowledge and belief, constitute proceeds of crime;
(c) I understand that AMAX Global is required by law to monitor my transactions and may be required to report suspicious matters to AUSTRAC under Part 3 of the AML/CTF Act;
(d) I will promptly notify AMAX Global in writing if any of the information I have provided changes, including changes to my source of funds, beneficial ownership, or residency status;
(e) I consent to AMAX Global conducting ongoing CDD and ECDD as required, including re-verification of my identity, and understand that failure to cooperate may result in account restriction or closure.`,
                    },
                    {
                      title: "4. Sanctions Declaration",
                      content: `Sanctions Compliance Declaration — required under Australian autonomous sanctions laws and international obligations.

I declare that:
(a) I am not a designated person or entity listed on the DFAT Consolidated List, the United Nations Security Council consolidated sanctions list, or any other applicable Australian or international sanctions list;
(b) I am not acting on behalf of, or for the benefit of, any designated person or entity;
(c) I do not reside in, and the funds to be transacted are not derived from, a jurisdiction subject to comprehensive Australian autonomous sanctions or United Nations Security Council sanctions;
(d) I understand that AMAX Global will independently screen my identity information against relevant sanctions lists on an ongoing basis and may freeze or restrict my account if a match is identified, without prior notice, as required by law;
(e) I will immediately notify AMAX Global if I become aware that I or any beneficial owner of my account becomes subject to any sanctions designation.

Breach of Australian sanctions law is a serious criminal offence. AMAX Global is required to report any suspected sanctions breach to DFAT and may refer the matter to the Australian Federal Police.`,
                    },
                    {
                      title: "5. Risk Disclosure (Digital Currency Exchange)",
                      content: `Digital Currency Exchange Risk Disclosure — issued by AMAX Global Pty Ltd, registered with AUSTRAC as a Digital Currency Exchange (DCE) provider.

IMPORTANT RISKS — PLEASE READ CAREFULLY:

(a) Price Volatility: Digital currencies (including Bitcoin, Ethereum, and other crypto-assets) are highly volatile. Their value can decrease significantly in a short period. You may lose all or a substantial part of your investment.

(b) Regulatory Risk: The regulatory environment for digital currencies is evolving. New laws or regulatory actions may adversely affect the value, transferability, or legality of digital currencies.

(c) Technology Risk: Blockchain networks may experience congestion, forks, or technical failures. Transactions on public blockchains are generally irreversible. Errors in wallet addresses will result in permanent loss of funds.

(d) Liquidity Risk: Digital currency markets may lack sufficient liquidity, particularly during periods of high volatility, which may prevent you from executing transactions at your desired price or time.

(e) No Government Guarantee: Digital currencies are not legal tender in Australia and are not backed or guaranteed by the Australian Government, the Reserve Bank of Australia, or any other government or central bank.

(f) Custody Risk: AMAX Global holds digital currencies on your behalf. While we maintain industry-standard security, we are not a bank and your digital currency holdings are not covered by the Financial Claims Scheme.

By proceeding, you acknowledge that you have read and understood these risks and that you are making an informed decision to use AMAX Global's digital currency exchange services.`,
                    },
                    {
                      title: "6. Account Terms & Conditions",
                      content: `AMAX Global Account Terms — these terms govern your eWallet and transactional account with AMAX Global Pty Ltd.

Account Opening: Your account is subject to successful completion of our Know Your Customer (KYC) process, including identity verification and risk assessment. We reserve the right to decline any application without providing reasons.

Transaction Limits: Default daily transaction limits apply and are displayed in your account settings. Enhanced limits may be available following ECDD review. Limits may be reduced or suspended for risk management or regulatory compliance reasons.

Fees: Fee schedules are published on our website and may be updated with notice. Fees are deducted from your transaction amount or eWallet balance. No fees apply to incoming deposits unless otherwise specified.

Account Maintenance: You are responsible for maintaining the security of your login credentials. Report any unauthorised access immediately to info@amaxglobal.com.au. AMAX Global is not liable for losses arising from your failure to maintain account security.

Dormant Accounts: Accounts with no activity for 7 years may be subject to unclaimed money obligations under the Banking Act 1959 (Cth). We will contact you before any funds are transferred.

Termination: You may close your account at any time by contacting info@amaxglobal.com.au. AMAX Global may close your account with 30 days' notice, or immediately in cases of fraud, regulatory direction, or material breach of these terms.

Currency Conversion: Exchange rates for FX and remittance transactions are indicative until your transaction is confirmed. We will display the rate applicable to your transaction before you confirm.

Complaints: AMAX Global has an internal dispute resolution process. If unresolved, complaints may be referred to the Australian Financial Complaints Authority (AFCA) at www.afca.org.au or 1800 931 678.

Record Keeping: AMAX Global is required to retain transaction records for 7 years under the AML/CTF Act 2006. Account and KYC records are retained for the period required by applicable law.`,
                    },
                  ];

                  const sectionColors = [
                    "bg-blue-50 border-blue-200",
                    "bg-purple-50 border-purple-200",
                    "bg-orange-50 border-orange-200",
                    "bg-red-50 border-red-200",
                    "bg-yellow-50 border-yellow-200",
                    "bg-green-50 border-green-200",
                  ];

                  return (
                    <div key={def.id} className="border-2 border-indigo-300 bg-indigo-50 rounded-xl overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-600">
                          <FileCheck className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400 font-medium">Step 3 of 5</span>
                            <h3 className="font-semibold text-gray-900">Customer Agreement</h3>
                            <Badge className="bg-indigo-100 text-indigo-800">Action Required</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Read all 6 sections and sign below to proceed — Electronic Transactions Act 1999 (Cth)
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-5 space-y-4">
                        {/* Section progress pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {agreementSections.map((sec, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-all ${
                                sectionsRead.has(idx + 1)
                                  ? "bg-green-100 border-green-300 text-green-800"
                                  : "bg-gray-100 border-gray-300 text-gray-500"
                              }`}
                            >
                              {sectionsRead.has(idx + 1) ? "✓ " : ""}{idx + 1}. {sec.title.replace(/^\d+\. /, "").split(" ").slice(0, 2).join(" ")}
                            </span>
                          ))}
                        </div>

                        {agreementSigned ? (
                          /* ── Already signed ── */
                          <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                              <div>
                                <p className="font-semibold text-green-900">Customer Agreement Signed</p>
                                <p className="text-sm text-green-700">
                                  Agreement reference: <span className="font-mono font-semibold">{kycProfile?.agreementRef}</span>
                                </p>
                              </div>
                            </div>
                            {kycProfile?.agreementSignedAt && (
                              <p className="text-xs text-muted-foreground">
                                Signed on {new Date(kycProfile.agreementSignedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })} AEST
                                — v2.0 — Pursuant to Electronic Transactions Act 1999 (Cth)
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* ── Scrollable agreement document ── */}
                            <div
                              ref={agreementScrollRef}
                              onScroll={handleAgreementScroll}
                              className="bg-white border rounded-xl overflow-y-auto"
                              style={{ maxHeight: "420px" }}
                            >
                              {/* Identity strip */}
                              <div className="sticky top-0 z-10 bg-gray-900 text-white px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate">{kycProfile?.fullLegalName ?? "Verified Customer"}</p>
                                  <p className="text-[10px] text-gray-400">Identity verified · AMAX Global Customer Agreement v2.0</p>
                                </div>
                                <div className="text-[10px] text-gray-400 flex-shrink-0">
                                  {new Date().toLocaleDateString("en-AU")}
                                </div>
                              </div>

                              {/* Agreement header */}
                              <div className="px-5 pt-4 pb-3 border-b">
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">AMAX Global Pty Ltd — ABN 54 690 827 608</p>
                                <h3 className="text-base font-bold text-gray-900 mt-1">Customer Agreement</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Version 2.0 · Effective 1 January 2025 · Level 2, 8–12 King Street, Rockdale NSW 2216</p>
                              </div>

                              {/* 6 sections */}
                              {agreementSections.map((sec, idx) => (
                                <div
                                  key={idx}
                                  ref={el => { sectionRefs.current[idx] = el; }}
                                  className={`mx-4 my-3 rounded-lg border p-4 ${sectionColors[idx]}`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-sm font-bold text-gray-900">{sec.title}</h4>
                                    {sectionsRead.has(idx + 1) && (
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{sec.content}</p>
                                </div>
                              ))}

                              {/* Footer nudge */}
                              <div className="px-5 py-4 text-center text-xs text-gray-400">
                                {allSectionsRead
                                  ? "✓ All sections read — scroll down to sign"
                                  : "↓ Continue scrolling to read all sections before signing"}
                              </div>
                            </div>

                            {/* Signature section */}
                            <div className={`bg-white border-2 rounded-xl p-4 space-y-3 transition-all ${
                              allSectionsRead ? "border-indigo-300" : "border-gray-200 opacity-60"
                            }`}>
                              <div className="flex items-center gap-2">
                                <PenLine className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                <h4 className="text-sm font-semibold text-gray-900">Electronic Signature</h4>
                                {!allSectionsRead && (
                                  <span className="text-xs text-muted-foreground ml-auto">(unlock by reading all sections)</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">
                                Type your full legal name exactly as registered (<span className="font-semibold">{kycProfile?.fullLegalName ?? "your name"}</span>)
                                to apply your electronic signature under the <em>Electronic Transactions Act 1999</em> (Cth).
                              </p>
                              <input
                                type="text"
                                disabled={!allSectionsRead}
                                placeholder={kycProfile?.fullLegalName ?? "Your full legal name"}
                                value={signatureName}
                                onChange={e => setSignatureName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-serif italic disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                              {/* PEP acknowledgement in agreement */}
                              <div className="flex items-start gap-2 text-xs text-gray-600">
                                <Checkbox
                                  id="agreement-pep"
                                  checked={piiPep}
                                  disabled={!allSectionsRead}
                                  onCheckedChange={v => setPiiPep(Boolean(v))}
                                />
                                <Label htmlFor="agreement-pep" className="text-xs cursor-pointer leading-relaxed">
                                  I confirm I am <span className="underline">not</span> a Politically Exposed Person (PEP), nor an immediate family member or close associate of a PEP. I understand that leaving this unchecked will flag my account for Enhanced Customer Due Diligence.
                                </Label>
                              </div>
                              <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                disabled={!allSectionsRead || !signatureName.trim() || agreementMutation.isPending}
                                onClick={() => agreementMutation.mutate({ signature: signatureName.trim(), pepDeclaration: !piiPep })}
                              >
                                {agreementMutation.isPending ? "Recording signature…" : "Sign Agreement & Continue"}
                              </Button>
                              <p className="text-[10px] text-center text-muted-foreground">
                                Electronic signature valid under the Electronic Transactions Act 1999 (Cth) · AMAX Global records your IP address and timestamp
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }

                // ── Step 4 expanded address verification card ───────────────
                if (def.id === 4 && status === "in_progress") {
                  return (
                    <div key={def.id} className="border-2 border-yellow-300 bg-yellow-50 rounded-xl overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-yellow-500">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400 font-medium">Step 4 of 5</span>
                            <h3 className="font-semibold text-gray-900">Address Verification</h3>
                            <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">Required under AUSTRAC CDD — your residential address must be verified by a third-party document</p>
                        </div>
                      </div>

                      <div className="px-4 pb-5 space-y-4">
                        {/* Why is this needed */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-800">
                          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                          <span>
                            <strong>AUSTRAC CDD requirement:</strong> Simply providing an address during registration is not sufficient. You must verify it with an independent document dated within the last 3 months.
                          </span>
                        </div>

                        {/* Accepted documents */}
                        <div className="bg-white border rounded-xl p-4 space-y-3">
                          <h4 className="font-semibold text-sm">Accepted proof of address documents</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { emoji: "💡", doc: "Utility bill", detail: "Electricity, gas, water, or internet — must show your name and address" },
                              { emoji: "🏦", doc: "Bank statement", detail: "From an Australian or internationally recognised bank" },
                              { emoji: "🏛️", doc: "Government letter", detail: "ATO, Centrelink, Medicare, or local council correspondence" },
                              { emoji: "📄", doc: "Lease agreement", detail: "Signed tenancy agreement showing current address" },
                            ].map(item => (
                              <div key={item.doc} className="flex items-start gap-2.5 text-xs text-gray-700">
                                <span className="text-base flex-shrink-0 mt-0.5">{item.emoji}</span>
                                <div>
                                  <span className="font-medium">{item.doc}</span>
                                  <span className="text-muted-foreground"> — {item.detail}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            Document must be issued within the <strong>last 3 months</strong>. Older documents will not be accepted.
                          </div>
                        </div>

                        {/* Upload zone */}
                        <div className="bg-white border rounded-xl p-4 space-y-3">
                          <h4 className="font-semibold text-sm">Upload your proof of address</h4>
                          <p className="text-xs text-muted-foreground">JPG, PNG or PDF — max 10 MB. Ensure the full document is visible, including date and your name.</p>
                          <label htmlFor="kyc-poa-upload" className="cursor-pointer block">
                            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                              addrPoaFile ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400"
                            }`}>
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              {addrPoaFile ? (
                                <>
                                  <p className="text-sm font-medium text-green-700">✓ {addrPoaFile}</p>
                                  <p className="text-xs text-green-600">Tap to replace</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-medium">Click to upload or drag &amp; drop</p>
                                  <p className="text-xs text-muted-foreground">Utility bill, bank statement, or government letter</p>
                                </>
                              )}
                            </div>
                            <input
                              id="kyc-poa-upload"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.heic"
                              className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setAddrPoaFile(f.name);
                                  setStepFiles(prev => ({ ...prev, [4]: f.name }));
                                  toast({
                                    title: "Proof of Address Received",
                                    description: `${f.name} submitted. Our compliance team will verify it within 1–2 business days.`,
                                  });
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                        </div>

                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                          <Lock className="w-3 h-3" /> Your documents are encrypted in transit and stored securely in accordance with the Australian Privacy Act 1988.
                        </p>
                      </div>
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
                        <div className="text-xs text-amber-600 font-medium">Upload ↓</div>
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
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 text-blue-900">
                    Next: {nextStep.title}
                  </h4>
                  <p className="text-sm mb-3 text-blue-700">
                    {nextStep.id === 3 && "Read and sign the AMAX Customer Agreement — covers terms, privacy, AML/CTF, sanctions, and risk disclosure. Scroll through all sections then type your legal name to sign."}
                    {nextStep.id === 4 && "Upload a utility bill, bank statement, or government letter dated within the last 3 months showing your full name and address."}
                    {nextStep.id === 5 && "Upload a recent payslip, tax return, or employer letter confirming your income and source of funds. Accepted formats: PDF, JPG, PNG, HEIC — max 10 MB."}
                  </p>
                  {nextStep.uploadId && (
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
                  )}
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
          {/* ── Inline Documents Section ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Document Vault
              </CardTitle>
              <p className="text-sm text-gray-500">PDF, JPG, PNG, HEIC — max 10 MB · Review 1–2 business days</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-xl gap-3 bg-gray-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      doc.status === "approved" ? "bg-green-100" : doc.status === "under_review" ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <FileText className={`w-4 h-4 ${
                        doc.status === "approved" ? "text-green-600" : doc.status === "under_review" ? "text-blue-600" : "text-gray-400"
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                        {doc.uploadDate && <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString("en-AU")}</span>}
                        {doc.size && <span>{doc.size}</span>}
                        {docUploads[doc.id] && <span className="text-blue-600">✓ {docUploads[doc.id]}</span>}
                        {doc.id === 4 && stepFiles[4] && <span className="text-blue-600">✓ {stepFiles[4]}</span>}
                        {doc.id === 5 && stepFiles[5] && <span className="text-blue-600">✓ {stepFiles[5]}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={statusColor(doc.status)}>{statusLabel(doc.status)}</Badge>
                    {doc.status === "pending" ? (
                      <label htmlFor={`doc-upload-inline-${doc.id}`} className="cursor-pointer">
                        <Button size="sm" variant="outline" asChild>
                          <span><Upload className="w-3 h-3 mr-1" />Upload</span>
                        </Button>
                        <input id={`doc-upload-inline-${doc.id}`} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" className="hidden"
                          onChange={(e) => handleDocTabUpload(doc.id, doc.name, e)} />
                      </label>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => handleView(doc.name)}>
                        <Eye className="w-3 h-3 mr-1" />View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {/* Additional upload */}
              <label htmlFor="doc-general-inline" className="cursor-pointer block">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
                  <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                  <p className="text-xs text-gray-500 font-medium">Upload additional document</p>
                  <p className="text-xs text-gray-400">Our compliance team will categorise and review it</p>
                </div>
                <input id="doc-general-inline" type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" className="hidden" onChange={handleGeneralUpload} />
              </label>
            </CardContent>
          </Card>

          {/* ── Inline Risk Assessment Section ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" /> Risk Assessment
              </CardTitle>
              <p className="text-sm text-gray-500">Completes your KYC profile — all fields required · AML/CTF Act 2006</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {riskSubmitted ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">Risk Assessment Complete</p>
                    <p className="text-xs text-green-700">Your risk profile has been recorded.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">FX / Financial Experience *</Label>
                      <Select value={riskExperience} onValueChange={setRiskExperience}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select level" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novice">New to FX / Remittance (0–2 yrs)</SelectItem>
                          <SelectItem value="intermediate">Moderate experience (3–7 yrs)</SelectItem>
                          <SelectItem value="experienced">Experienced (8+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Annual Income (AUD) *</Label>
                      <Select value={riskIncome} onValueChange={setRiskIncome}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select range" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-50k">Under $50,000</SelectItem>
                          <SelectItem value="50k-100k">$50,000 – $100,000</SelectItem>
                          <SelectItem value="100k-250k">$100,000 – $250,000</SelectItem>
                          <SelectItem value="250k-500k">$250,000 – $500,000</SelectItem>
                          <SelectItem value="over-500k">Over $500,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Primary Source of Funds *</Label>
                      <Select value={riskFunds} onValueChange={setRiskFunds}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select source" /></SelectTrigger>
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
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">How will you use AMAX Global?</Label>
                      <Textarea
                        value={riskGoals}
                        onChange={(e) => setRiskGoals(e.target.value)}
                        placeholder="e.g. sending money overseas, FX conversion for business…"
                        className="min-h-[80px] text-sm"
                      />
                    </div>
                  </div>
                  <Button className="w-full h-10 bg-purple-600 hover:bg-purple-700" onClick={handleCompleteRiskAssessment}>
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

      </Tabs>
    </div>
  );
}
