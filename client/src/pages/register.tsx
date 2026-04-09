import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Shield, Coins, Eye, EyeOff, Mail, CheckCircle2,
  ArrowRight, ArrowLeft, Wallet, RefreshCw, Bitcoin, Globe,
  Smartphone, ChevronRight, X,
} from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

type Step = "method" | "email-form" | "verify" | "profile";

const PURPOSES = [
  { value: "remittance",  label: "Remittance",   icon: Globe },
  { value: "ewallet",     label: "eWallet",      icon: Wallet },
  { value: "fx",          label: "FX Exchange",  icon: RefreshCw },
  { value: "crypto",      label: "Crypto",       icon: Bitcoin },
];

const PRODUCTS = [
  { value: "ewallet",    label: "eWallet" },
  { value: "fx",         label: "FX Exchange" },
  { value: "crypto",     label: "Crypto" },
  { value: "remittance", label: "Remittance" },
];

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["method", "email-form", "verify", "profile"];
  const labels = ["Method", "Details", "Verify", "Profile"];
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
  const { register } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep] = useState<Step>("method");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [socialNotice, setSocialNotice] = useState<"google" | "apple" | "phone" | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);

  const [purpose, setPurpose]     = useState("");
  const [products, setProducts]   = useState<Set<string>>(new Set());

  function toggleProduct(v: string) {
    setProducts(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) { setError("Please enter your full name."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setIsLoading(true);
    try {
      await register(firstName.trim(), lastName.trim(), email.trim(), password);
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!purpose) { setError("Please select your primary purpose."); return; }
    navigate("/compliance");
  }

  const socialNotices: Record<string, string> = {
    google: "Google sign-in is coming soon. Please use email registration for now.",
    apple:  "Apple sign-in is coming soon. Please use email registration for now.",
    phone:  "Mobile / phone sign-up is coming soon. Please use email registration for now.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-2xl font-bold text-white">AMAX</span>
          </div>
          <StepDots step={step} />
        </div>

        {/* ── METHOD SELECTION ─────────────────────────────────────────────── */}
        {step === "method" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="mb-1">
              <h2 className="text-xl font-bold text-white">Create your account</h2>
              <p className="text-sm text-slate-400 mt-1">
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
              onClick={() => { setSocialNotice(null); setStep("email-form"); }}
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

            {/* Apple */}
            <button
              onClick={() => setSocialNotice("apple")}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-slate-700/60 border border-slate-600 text-white hover:bg-slate-700 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                <SiApple className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold">Continue with Apple</div>
                <div className="text-xs text-slate-400 font-normal">Use your Apple ID</div>
              </div>
              <span className="text-[10px] bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full font-medium shrink-0">
                Coming soon
              </span>
            </button>

            {/* Phone / Mobile */}
            <button
              onClick={() => setSocialNotice("phone")}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-slate-700/60 border border-slate-600 text-white hover:bg-slate-700 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-semibold">Continue with Mobile</div>
                <div className="text-xs text-slate-400 font-normal">Sign up with your phone number</div>
              </div>
              <span className="text-[10px] bg-slate-600 text-slate-300 px-2 py-0.5 rounded-full font-medium shrink-0">
                Coming soon
              </span>
            </button>

            <p className="text-xs text-slate-500 text-center leading-relaxed pt-1">
              By signing up you agree to our{" "}
              <Link href="/terms" className="underline text-slate-400 hover:text-slate-200">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy-policy" className="underline text-slate-400 hover:text-slate-200">Privacy Policy</Link>.
              Identity verification is required as we are AUSTRAC-registered.
            </p>
          </div>
        )}

        {/* ── EMAIL FORM ───────────────────────────────────────────────────── */}
        {step === "email-form" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setError(null); setStep("method"); }}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">Sign up with Email</h2>
                <p className="text-xs text-slate-400">Create your AMAX account</p>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPw ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters" required autoComplete="new-password"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50 pr-10" />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-amber-400">Password must be at least 8 characters</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold">
                {isLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
                  : <>Create account <ArrowRight className="w-4 h-4 ml-1" /></>}
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
              <h2 className="text-xl font-bold text-white">Check your inbox</h2>
              <p className="text-sm text-slate-400 max-w-xs">
                We've sent a verification link to{" "}
                <span className="text-white font-medium">{email}</span>. Click the link to confirm your email address.
              </p>
            </div>

            <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-4 text-left space-y-3">
              {[
                { label: "From",    val: "noreply@amaxglobal.com.au" },
                { label: "Subject", val: "Confirm your AMAX Global account" },
                { label: "Expires", val: "24 hours" },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400 w-14 font-medium">{label}:</span>
                  <span className="text-xs text-slate-300">{val}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold"
                onClick={() => { setError(null); setStep("profile"); }}
              >
                I've verified my email <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => setStep("profile")}
              >
                Skip for now — I'll verify later
              </Button>
            </div>

            {error && <p className="text-xs text-amber-400">{error}</p>}
            <p className="text-xs text-slate-500">
              Didn't get it? Check your spam folder or{" "}
              <button
                className="text-slate-300 underline hover:text-white"
                onClick={() => setError("Resend available once email sending is configured.")}
              >
                resend the email
              </button>
            </p>
          </div>
        )}

        {/* ── RISK PROFILE ─────────────────────────────────────────────────── */}
        {step === "profile" && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setError(null); setStep("verify"); }}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-white">How will you use AMAX?</h2>
                <p className="text-xs text-slate-400">Helps us meet regulatory requirements</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Primary purpose of your account</Label>
                <div className="grid grid-cols-2 gap-3">
                  {PURPOSES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPurpose(value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        purpose === value
                          ? "border-white bg-white/10 text-white"
                          : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Products you plan to use <span className="text-slate-500 font-normal">(optional)</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {PRODUCTS.map(({ value, label }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        products.has(value)
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      <Checkbox
                        checked={products.has(value)}
                        onCheckedChange={() => toggleProduct(value)}
                        className="border-slate-500 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-slate-900"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold">
                Continue to verification <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-500 text-xs justify-center mt-6">
          <Shield className="w-3.5 h-3.5" />
          <span>256-bit encrypted · AUSTRAC registered · ABN 54 690 827 608</span>
        </div>

      </div>
    </div>
  );
}
