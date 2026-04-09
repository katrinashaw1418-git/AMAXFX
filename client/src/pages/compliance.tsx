import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
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
  FileText,
  User,
  MapPin,
  CreditCard,
  Building,
  RefreshCw,
  Lock,
  Camera,
  BookOpen,
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

const kycStepDefs: { id: number; title: string; icon: any; uploadId: string | null }[] = [
  { id: 1, title: "Personal Information",  icon: User,       uploadId: null },
  { id: 2, title: "Customer Agreement",    icon: BookOpen,   uploadId: null },
  { id: 3, title: "Identity Verification", icon: Camera,     uploadId: null },
  { id: 4, title: "Proof of Address",      icon: MapPin,     uploadId: "kyc-upload-4" },
  { id: 5, title: "Source of Funds",       icon: CreditCard, uploadId: "kyc-upload-5" },
];

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

  // ── Step 3: Customer Agreement ─────────────────────────────────────────────
  const [signatureName,  setSignatureName]  = useState("");
  const [sectionsRead,   setSectionsRead]   = useState<Set<number>>(new Set());
  const agreementScrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs        = useRef<(HTMLDivElement | null)[]>([]);
  const allSectionsRead    = sectionsRead.size >= 13;

  // ── Step 2: Identity document + biometric verification ────────────────────
  const [docType,          setDocType]          = useState<"passport" | "driver_licence" | "national_id">("passport");
  const [docExpiry,        setDocExpiry]        = useState("");           // YYYY-MM-DD from date input
  const [docIssueCountry,  setDocIssueCountry]  = useState("");           // issuing country (passport risk scoring)
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

  // ── Seed idVerifyComplete from DB on profile load ─────────────────────────
  // Ensures that if identity was verified in a previous session (or by admin),
  // the local state reflects it immediately without requiring a new verification flow.
  useEffect(() => {
    if (kycProfile?.idVerificationComplete && !idVerifyComplete) {
      setIdVerifyComplete(true);
      if (verifyMode === "idle") setVerifyMode("approved");
    }
  }, [kycProfile?.idVerificationComplete]);

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

  // ── derive step statuses ───────────────────────────────────────────────────
  // Correct order per AUSTRAC best practice:
  // 1 Personal Info → 2 Declarations/Agreement → 3 ID Verify → 4 Address → 5 Funds
  const agreementSigned = kycProfile?.agreementSigned ?? false;
  const profileDone = kycProfile?.kycProfileComplete ?? false;
  const stepStatuses = useMemo((): Record<number, StepStatus> => {
    const s1: StepStatus = profileDone ? "completed" : "in_progress";
    const s2: StepStatus = !profileDone ? "pending" : agreementSigned ? "completed" : "in_progress";
    const s3: StepStatus = !agreementSigned ? "pending" : idVerifyComplete ? "completed" : "in_progress";
    const s4: StepStatus = !agreementSigned ? "pending" : stepFiles[4] ? "under_review" : "in_progress";
    const s5: StepStatus = !agreementSigned ? "pending" : (riskSubmitted || stepFiles[5]) ? "completed" : "in_progress";
    return { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5 };
  }, [profileDone, agreementSigned, idVerifyComplete, stepFiles, riskSubmitted]);

  const currentStepId = useMemo(() => {
    if (!profileDone) return 1;
    if (!agreementSigned) return 2;
    if (!idVerifyComplete) return 3;
    if (!stepFiles[4]) return 4;
    if (!riskSubmitted && !stepFiles[5]) return 5;
    return null;
  }, [profileDone, agreementSigned, idVerifyComplete, stepFiles, riskSubmitted]);

  // KYC completion % — 20% per step
  const kycPct = useMemo(() => {
    let total = 0;
    if (profileDone)                    total += 20;
    if (agreementSigned)                total += 20;
    if (idVerifyComplete)               total += 20;
    if (stepFiles[4])                   total += 20;
    if (riskSubmitted || stepFiles[5])  total += 20;
    return total;
  }, [profileDone, agreementSigned, idVerifyComplete, stepFiles, riskSubmitted]);

  // ── Compliance metrics grid (4 tiles) ─────────────────────────────────────
  const complianceMetrics = useMemo(() => [
    {
      label: "Personal Info",
      status: stepStatuses[1],
      value: profileDone ? 100 : 0,
    },
    {
      label: "Agreement",
      status: stepStatuses[2],
      value: agreementSigned ? 100 : profileDone ? 50 : 0,
    },
    {
      label: "Identity Check",
      status: stepStatuses[3],
      value: idVerifyComplete ? 100 : agreementSigned ? 30 : 0,
    },
    {
      label: "Documentation",
      status: stepStatuses[4] === "completed" || stepStatuses[4] === "under_review" ? stepStatuses[4] : stepStatuses[5],
      value: (riskSubmitted || stepFiles[5]) ? 100 : stepFiles[4] ? 50 : agreementSigned ? 0 : 0,
    },
  ], [stepStatuses, profileDone, agreementSigned, idVerifyComplete, riskSubmitted, stepFiles]);

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


  function handleIdVerifySubmit() {
    if (!docExpiry) {
      toast({ title: "Expiry Date Required", description: "Please enter your document's expiry date before starting verification.", variant: "destructive" });
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


  // next step prompt — uses currentStepId so sequential steps 3→5 take priority
  // over step 2 (identity) which runs asynchronously in the background.
  const nextStep = currentStepId != null ? kycStepDefs.find(s => s.id === currentStepId) : undefined;

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

                // ── Step 3 expanded identity verification card ──────────────
                if (def.id === 3 && status === "in_progress") {
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
                            <span className="text-xs text-gray-400 font-medium">Step {def.id} of 5</span>
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

                          {/* Veriff info panel */}
                          <div className="bg-white border rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-sm text-gray-900">Secure Biometric Verification via Veriff</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Clicking the button below opens a secure Veriff session where you will:
                                </p>
                                <ul className="text-xs text-gray-600 mt-1.5 space-y-0.5 pl-2">
                                  <li>• Take a photo of your {dl.label} (both sides if required)</li>
                                  <li>• Complete a live biometric selfie check</li>
                                  <li>• Receive an instant result — usually under 2 minutes</li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Veriff is AUSTRAC-approved and compliant with the Privacy Act 1988. Your biometric data is never stored by AMAX Global.
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-center">
                              {[
                                { icon: "📷", label: "Scan document" },
                                { icon: "🤳", label: "Live selfie" },
                                { icon: "✅", label: "Instant result" },
                              ].map(step => (
                                <div key={step.label} className="bg-blue-50 rounded-lg py-2">
                                  <div className="text-base mb-0.5">{step.icon}</div>
                                  <div className="text-gray-700 font-medium">{step.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Button
                            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            disabled={verifyMode === "loading"}
                            onClick={handleIdVerifySubmit}
                          >
                            {verifyMode === "loading" ? (
                              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Connecting to Veriff…</span>
                            ) : (
                              <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> Start Identity Verification with Veriff →</span>
                            )}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Encrypted · AUSTRAC-compliant · Privacy Act 1988
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
                            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={() => { setVerifyMode("idle"); setDocExpiry(""); setDocIssueCountry(""); }}>
                              Try Again with Better Documents
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Step 2 expanded Customer Agreement card ─────────────────
                if (def.id === 2 && status === "in_progress") {
                  const agreementSections = [
                    {
                      title: "1. Overview",
                      content: `This Customer Agreement governs your use of AMAX Global's services, including eWallet, foreign exchange, remittance, and digital currency exchange ("Services").

By creating an account, you agree to this Agreement and any related policies. You must be at least 18 years old and legally capable of entering into binding contracts under Australian law.

This Agreement explains your rights and responsibilities, as well as AMAX Global's obligations under Australian law and international financial standards.`,
                    },
                    {
                      title: "2. Use of Services",
                      content: `You agree to:
• Use the Services only for lawful purposes
• Comply with all applicable Australian laws
• Provide accurate, current, and complete information

AMAX Global may suspend, restrict, or terminate your account where required for fraud prevention, legal compliance, or risk management.

These Terms are governed by the laws of New South Wales, Australia.`,
                    },
                    {
                      title: "3. Privacy",
                      content: `AMAX Global collects and uses personal information in accordance with the Privacy Act 1988 (Cth).

Purpose of collection:
• Identity verification and KYC compliance
• Risk management and fraud prevention
• Service delivery and improvement
• Regulatory reporting

Information sharing:
• AUSTRAC, regulators, and law enforcement as required
• Third-party verification providers (e.g., Veriff, Green ID)
• Financial institutions and service providers
• Professional advisors for compliance purposes

We do not sell your personal information. You have the right to access and correct your personal information. AMAX may transfer data internationally to service providers' servers under secure conditions.`,
                    },
                    {
                      title: "4. Compliance & AML/CTF",
                      content: `AMAX Global adheres to the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth).

Obligations:
• Conduct risk-based customer identification (KYC/CDD)
• Perform ongoing customer due diligence (OCDD/ECDD)
• Monitor transactions for suspicious activity
• Report suspicious matters to AUSTRAC

Customer obligations:
• Provide all requested documents and information accurately
• Respond to inquiries for enhanced due diligence
• Update AMAX promptly on changes to personal details, source of funds, or beneficial ownership`,
                    },
                    {
                      title: "5. Sanctions Compliance",
                      content: `AMAX Global complies with Australian sanctions laws and international obligations.

You declare:
• You are not listed on any applicable sanctions list (DFAT Consolidated List, UN Security Council sanctions, or others)
• You are not acting on behalf of a sanctioned person or entity
• Funds being transacted do not originate from sanctioned jurisdictions

AMAX will independently screen accounts and transactions and may freeze or restrict accounts where legally required.`,
                    },
                    {
                      title: "6. PEP Status Declaration",
                      content: `I am not a Politically Exposed Person (PEP), nor an immediate family member or close associate of a PEP.

A Politically Exposed Person is someone who holds or has held a prominent public position domestically or internationally (e.g., head of state, government minister, senior judicial officer, senior military officer, or executive of a state-owned enterprise).

If my PEP status changes, I will notify AMAX immediately.`,
                    },
                    {
                      title: "7. Digital Currency Risk Disclosure",
                      content: `Digital currency services involve significant risk:

• Price Volatility: Prices can change rapidly, and you may lose all or part of your investment
• Irreversibility: Transactions on public blockchains cannot be reversed
• Technology Risk: Blockchain networks may experience congestion, forks, or outages
• Liquidity Risk: Limited market liquidity may prevent timely execution of transactions
• Regulatory Risk: Changes in laws or regulations may impact value or legality

Digital currencies are not legal tender, not government-backed, and not covered by the Financial Claims Scheme.`,
                    },
                    {
                      title: "8. Account Terms",
                      content: `Account Opening: Subject to identity verification and risk assessment.
Transaction Limits: Default limits apply; enhanced limits may require additional KYC.
Fees: Published online; may change with notice.
Security: You are responsible for safeguarding login credentials.
Dormant Accounts: Inactive accounts may be treated in accordance with unclaimed money laws.
Termination: AMAX may close accounts for legal, regulatory, or risk reasons.
Currency Conversion: Rates confirmed at transaction time.
Complaints: Refer unresolved complaints to AFCA (www.afca.org.au · 1800 931 678).
Record Keeping: Records retained for at least 7 years per law.`,
                    },
                    {
                      title: "9. Identity & Use Declaration",
                      content: `I am acting on my own behalf unless otherwise disclosed.
All information I provide is true, accurate, and complete.
I understand that AMAX may verify my identity and my account activity may be monitored.`,
                    },
                    {
                      title: "10. Source of Funds Declaration",
                      content: `All funds deposited, exchanged, or remitted through AMAX are derived from legitimate sources.
I will provide documentation if requested for verification.`,
                    },
                    {
                      title: "11. Compliance Awareness Declaration",
                      content: `I understand that AMAX is required to:
• Verify my identity
• Monitor my transactions
• Conduct ongoing due diligence (OCDD/ECDD)
• Report suspicious matters to AUSTRAC when required

I will cooperate fully with compliance requirements.`,
                    },
                    {
                      title: "12. Ongoing Obligations Declaration",
                      content: `I will notify AMAX of any material changes to my information, including:
• Residential address or contact details
• Source of funds or wealth
• Beneficial ownership
• PEP or sanctions status`,
                    },
                    {
                      title: "13. Accuracy & Legal Compliance Guarantee",
                      content: `I confirm that all information provided above is accurate and complete.
I understand that providing false information is a criminal offence under Australian law.
I consent to AMAX maintaining records, conducting verification, and monitoring my account for legal compliance.`,
                    },
                  ];

                  const sectionColors = [
                    "bg-blue-50 border-blue-200",
                    "bg-slate-50 border-slate-200",
                    "bg-purple-50 border-purple-200",
                    "bg-orange-50 border-orange-200",
                    "bg-red-50 border-red-200",
                    "bg-violet-50 border-violet-200",
                    "bg-yellow-50 border-yellow-200",
                    "bg-green-50 border-green-200",
                    "bg-indigo-50 border-indigo-200",
                    "bg-teal-50 border-teal-200",
                    "bg-sky-50 border-sky-200",
                    "bg-amber-50 border-amber-200",
                    "bg-indigo-50 border-indigo-300",
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
                            Read all 13 sections and sign below to proceed — Electronic Transactions Act 1999 (Cth)
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
                                — v2.5 — Pursuant to Electronic Transactions Act 1999 (Cth)
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
                                  <p className="text-[10px] text-gray-400">Identity verified · AMAX Global Customer Agreement v2.5</p>
                                </div>
                                <div className="text-[10px] text-gray-400 flex-shrink-0">
                                  {new Date().toLocaleDateString("en-AU")}
                                </div>
                              </div>

                              {/* Agreement header */}
                              <div className="px-5 pt-4 pb-3 border-b">
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">AMAX Global Pty Ltd — ABN 54 690 827 608</p>
                                <h3 className="text-base font-bold text-gray-900 mt-1">Customer Agreement</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Version 2.5 · Effective 1 January 2025 · Level 2, 8–12 King Street, Rockdale NSW 2216</p>
                              </div>

                              {/* 8 sections */}
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
                            <div className={`bg-white border-2 rounded-xl overflow-hidden transition-all ${
                              allSectionsRead ? "border-indigo-300" : "border-gray-200 opacity-60"
                            }`}>
                              {/* Sticky summary */}
                              <div className="bg-indigo-700 px-4 py-3">
                                <p className="text-xs text-indigo-100 leading-relaxed">
                                  By proceeding, you confirm that your information is accurate and complete, that you are not a sanctioned person or acting on behalf of one, and that you understand AMAX Global's monitoring and compliance obligations under Australian law.
                                </p>
                              </div>

                              <div className="p-4 space-y-3">
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
                              <div className={`rounded-lg border p-3 text-xs text-gray-600 leading-relaxed transition-all ${
                                allSectionsRead ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200 opacity-50"
                              }`}>
                                By signing, I confirm I have read and agree to all 13 sections of this Agreement, including the declarations in Sections 5–6 and 9–13 regarding sanctions, PEP status, identity, source of funds, compliance awareness, ongoing obligations, and accuracy guarantee.
                              </div>
                              <Button
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                disabled={!allSectionsRead || !signatureName.trim() || agreementMutation.isPending}
                                onClick={() => agreementMutation.mutate({ signature: signatureName.trim(), pepDeclaration: false })}
                              >
                                {agreementMutation.isPending ? "Recording signature…" : "Sign Agreement & Continue"}
                              </Button>
                              <p className="text-[10px] text-center text-muted-foreground">
                                Electronic signature valid under the Electronic Transactions Act 1999 (Cth) · AMAX Global records your IP address and timestamp
                              </p>
                              </div>{/* /p-4 inner wrapper */}
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
                    {nextStep.id === 2 && "Read and sign the AMAX Customer Agreement — covers terms, privacy, AML/CTF, sanctions, and risk disclosure. Scroll through all sections then type your legal name to sign."}
                    {nextStep.id === 3 && "Complete biometric identity verification using your government-issued ID. This typically takes 1–3 minutes via our AUSTRAC-approved provider."}
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
