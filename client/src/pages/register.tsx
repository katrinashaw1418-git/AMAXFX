import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, Shield, Mail, CheckCircle2,
  ArrowRight, ArrowLeft, ChevronRight, X,
  TrendingUp, Bitcoin, Check, Wallet, LineChart,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { SiGoogle } from "react-icons/si";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

type Step = "method" | "details" | "verify" | "services";

const SERVICES = [
  {
    value: "fx",
    icon: TrendingUp,
    title: "FX & Transfers",
    description: "Send and receive international payments at live exchange rates with full AUD settlement.",
  },
  {
    value: "multi-currency",
    icon: Wallet,
    title: "Multi-Currency Account",
    description: "Hold and manage supported currencies in a single account with instant conversions.",
  },
  {
    value: "digital-asset-fx",
    icon: Bitcoin,
    title: "Digital Assets",
    description: "Exchange and transfer Bitcoin, Ethereum and supported stablecoins.",
  },
  {
    value: "investment",
    icon: LineChart,
    title: "Investment Services",
    description: "Access selected investment opportunities curated for AMAX clients.",
  },
];

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["method", "details", "verify", "services"];
  const labels = ["Method", "Details", "Verify", "Services"];
  const idx = order.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {order.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center justify-center rounded-full transition-all duration-300 ${
            i < idx
              ? "w-7 h-7 bg-green-500 text-white text-xs font-bold"
              : i === idx
              ? "w-7 h-7 bg-white text-slate-900 text-xs font-bold"
              : "w-6 h-6 bg-slate-700 text-slate-500 text-xs"
          }`}>
            {i < idx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-xs hidden sm:block ${i === idx ? "text-white font-medium" : "text-slate-600"}`}>
            {labels[i]}
          </span>
          {i < order.length - 1 && (
            <div className={`w-6 h-px mx-0.5 ${i < idx ? "bg-green-500" : "bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const { refreshUser } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("method");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socialNotice, setSocialNotice] = useState<"google" | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [mobile, setMobile]       = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  function handleOtpChange(idx: number, val: string) {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    setError(null);
    if (val && idx < 5) {
      (document.getElementById(`otp-reg-${idx + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      (document.getElementById(`otp-reg-${idx - 1}`) as HTMLInputElement)?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      (document.getElementById(`otp-reg-${idx - 1}`) as HTMLInputElement)?.focus();
    }
    if (e.key === "ArrowRight" && idx < 5) {
      (document.getElementById(`otp-reg-${idx + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setOtpDigits(pasted.split(""));
      (document.getElementById(`otp-reg-5`) as HTMLInputElement)?.focus();
    }
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    setIsVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      localStorage.setItem("amax_jwt", data.token);
      await refreshUser();
      setStep("services");
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setResendSent(false);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not resend the code. Please try again.");
      }
      setOtpDigits(["", "", "", "", "", ""]);
      setResendSent(true);
      setTimeout(() => setResendSent(false), 10000);
    } catch (err: any) {
      setError(err.message || "Could not resend the code.");
    } finally {
      setResendLoading(false);
    }
  }

  function toggleService(v: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }

  async function handleDetailsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) { setError("Please enter your full name."); return; }
    if (!mobile.trim() || mobile.replace(/\D/g, "").length < 8) {
      setError("Please enter a valid mobile number.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/phone/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobile.trim(),
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      // SECURITY: token is only issued after OTP verification — see /api/auth/verify-otp
      if (data.devOtp) setDevOtp(data.devOtp);
      setOtpDigits(["", "", "", "", "", ""]);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleServicesSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.size === 0) { setError("Please select at least one service."); return; }
    navigate("/compliance");
  }

  const socialNotices: Record<string, string> = {
    google: "Google sign-in is coming soon. Please use email registration for now.",
  };

  async function handleGoogleCredential(credential: string) {
    setIsLoading(true);
    setError(null);
    setSocialNotice(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, mode: "register" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google sign-in failed");
      localStorage.setItem("amax_jwt", data.token);
      await refreshUser();
      if (data.createdNew) {
        setStep("services");
      } else {
        navigate(data?.user?.kycStatus === "verified" ? "/dashboard" : "/compliance");
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/amax-coin-icon.png" alt="AMAX GLOBAL" className="h-10 w-auto" />
            <span className="font-bold text-white text-2xl tracking-widest">AMAX GLOBAL</span>
          </div>
          <StepDots step={step} />
        </div>

        {/* ── METHOD SELECTION ─────────────────────────────────────────────── */}
        {step === "method" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="mb-1">
              <h2 className="text-xl font-bold text-white">Create your account</h2>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                Secure access to FX, multi-currency accounts, digital assets, and investment services.
              </p>
              <p className="text-sm text-slate-400 mt-3">
                Already have an account?{" "}
                <Link href="/login" className="text-white underline underline-offset-2">Sign in</Link>
              </p>
            </div>

            {socialNotice && (
              <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-300">
                <AlertDescription className="flex items-start justify-between gap-2">
                  <span className="text-sm">{socialNotices[socialNotice]}</span>
                  <button onClick={() => setSocialNotice(null)} className="shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Email — primary */}
            <button
              onClick={() => { setSocialNotice(null); setStep("details"); }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-all font-semibold group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-slate-700" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold">Continue with Email</div>
                <div className="text-xs text-slate-500 font-normal">Sign up with your email address</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Google */}
            {GOOGLE_ENABLED ? (
              <div className="w-full flex justify-center [color-scheme:dark]">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      handleGoogleCredential(credentialResponse.credential);
                    } else {
                      setError("Google sign-in failed — no credential returned.");
                    }
                  }}
                  onError={() => setError("Google sign-in was cancelled or failed.")}
                  theme="filled_black"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="368"
                />
              </div>
            ) : (
              <button
                onClick={() => setSocialNotice("google")}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-slate-700/60 border border-slate-600 text-white hover:bg-slate-700 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <SiGoogle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-semibold">Continue with Google</div>
                  <div className="text-xs text-slate-400 font-normal">Use your Google account</div>
                </div>
                <span className="text-[10px] bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full font-medium shrink-0">
                  Coming soon
                </span>
              </button>
            )}

            <p className="text-xs text-slate-500 text-center leading-relaxed pt-2">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="underline text-slate-400 hover:text-slate-200">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy-policy" className="underline text-slate-400 hover:text-slate-200">Privacy Policy</Link>.
              Identity verification is required to activate regulated services.
            </p>
          </div>
        )}

        {/* ── DETAILS ──────────────────────────────────────────────────────── */}
        {step === "details" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setError(null); setStep("method"); }}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">Enter your details</h2>
                <p className="text-xs text-slate-400">We'll email you a verification code next.</p>
              </div>
            </div>

            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-slate-300 text-sm">First name</Label>
                  <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane" required autoComplete="given-name"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-slate-300 text-sm">Last name</Label>
                  <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Smith" required autoComplete="family-name"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 text-sm">Email address</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com" required autoComplete="email"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50" />
                <p className="text-xs text-slate-500">Your verification code will be sent to this email address.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mobile" className="text-slate-300 text-sm">Mobile number</Label>
                <Input id="mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value)}
                  placeholder="+61 412 345 678" required autoComplete="tel"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50" />
                <p className="text-xs text-slate-500">Used for account contact and compliance records.</p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold">
                {isLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending code…</>
                  : <>Send verification code <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </form>
          </div>
        )}

        {/* ── EMAIL VERIFICATION ───────────────────────────────────────────── */}
        {step === "verify" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Verify your email</h2>
              <p className="text-sm text-slate-400 max-w-xs">
                We sent a 6-digit verification code to{" "}
                <span className="text-white font-medium">{email}</span>.
              </p>
              <p className="text-xs text-slate-500">Please enter the code below to continue.</p>
            </div>

            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`otp-reg-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                  className="w-11 h-14 text-center text-2xl font-bold bg-slate-700 border border-slate-500 rounded-xl text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
                />
              ))}
            </div>

            {devOtp && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm">
                <p className="text-amber-400 font-semibold text-xs uppercase tracking-wider mb-1">Demo mode — email not sent</p>
                <p className="text-white font-mono text-2xl tracking-widest font-bold">{devOtp}</p>
                <p className="text-amber-300/70 text-xs mt-1">Configure GMAIL_USER & GMAIL_APP_PASSWORD to send real emails.</p>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            {resendSent && <p className="text-sm text-green-400">New code sent — check your inbox.</p>}

            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpDigits.join("").length < 6}
            >
              {isVerifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : <>Verify and continue <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <button
                className="text-slate-300 underline hover:text-white disabled:opacity-50"
                disabled={resendLoading}
                onClick={handleResend}
              >
                {resendLoading ? "Sending…" : "Resend code"}
              </button>
              <span className="text-slate-600">·</span>
              <button
                className="text-slate-300 underline hover:text-white"
                onClick={() => { setError(null); setOtpDigits(["", "", "", "", "", ""]); setStep("details"); }}
              >
                Change email
              </button>
            </div>
          </div>
        )}

        {/* ── SERVICE SELECTION ────────────────────────────────────────────── */}
        {step === "services" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Select your services</h2>
              <p className="text-xs text-slate-400 mt-1">
                This helps us tailor your account setup and meet regulatory requirements.
              </p>
            </div>

            <form onSubmit={handleServicesSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="space-y-3">
                {SERVICES.map(({ value, icon: Icon, title, description }) => {
                  const active = selected.has(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleService(value)}
                      className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                        active
                          ? "border-white bg-white/10"
                          : "border-slate-600 bg-slate-700/40 hover:border-slate-500"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        active ? "bg-white text-slate-900" : "bg-slate-600 text-slate-300"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold mb-1 ${active ? "text-white" : "text-slate-200"}`}>
                          {title}
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed">{description}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        active ? "border-white bg-white" : "border-slate-500"
                      }`}>
                        {active && <Check className="w-3 h-3 text-slate-900" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button type="submit" className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold mt-2">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        )}

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs justify-center mt-4">
          <Shield className="w-3.5 h-3.5" />
          <span>256-bit encryption · AUSTRAC-registered · ABN 54 690 827 608</span>
        </div>

      </div>
    </div>
  );
}
