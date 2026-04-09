import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2, Shield, Coins, Eye, EyeOff, Mail, CheckCircle2,
  ArrowRight, ArrowLeft, Wallet, RefreshCw, Bitcoin, Globe,
} from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

type Step = 1 | 2 | 3;

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

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Account" },
    { n: 2, label: "Email" },
    { n: 3, label: "Profile" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            s.n < current ? "bg-green-500 text-white" :
            s.n === current ? "bg-white text-slate-900" :
            "bg-slate-700 text-slate-400"
          }`}>
            {s.n < current ? <CheckCircle2 className="w-4 h-4" /> : s.n}
          </div>
          <span className={`text-xs hidden sm:block ${s.n === current ? "text-white font-medium" : "text-slate-500"}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px mx-1 ${s.n < current ? "bg-green-500" : "bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();

  const [step, setStep]         = useState<Step>(1);
  const [error, setError]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 — account
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);

  // Step 3 — risk profiling
  const [purpose,   setPurpose]   = useState<string>("");
  const [products,  setProducts]  = useState<Set<string>>(new Set());

  function toggleProduct(v: string) {
    setProducts(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }

  // ── Step 1 submit — create account, move to step 2 ─────────────────────
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) { setError("Please enter your first and last name."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setIsLoading(true);
    try {
      await register(firstName.trim(), lastName.trim(), email.trim(), password);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 3 submit — save risk profile, go to compliance ────────────────
  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    if (!purpose) { setError("Please select your primary purpose."); return; }
    navigate("/compliance");
  }

  // ── Shared shell ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-2xl font-bold text-white">AMAX</span>
          </div>
          <StepIndicator current={step} />
        </div>

        {/* ── STEP 1: Create account ────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Create your account</h2>
              <p className="text-sm text-slate-400 mt-1">
                Already have an account?{" "}
                <Link href="/login" className="text-white underline underline-offset-2">Sign in</Link>
              </p>
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => setError("Google sign-up coming soon — please use email registration.")}
              >
                <SiGoogle className="w-4 h-4 mr-2" /> Google
              </Button>
              <Button type="button" variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => setError("Apple sign-up coming soon — please use email registration.")}
              >
                <SiApple className="w-4 h-4 mr-2" /> Apple
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500">or continue with email</span>
              <Separator className="flex-1 bg-slate-700" />
            </div>

            <form onSubmit={handleStep1} className="space-y-4">
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

              <p className="text-xs text-slate-500 leading-relaxed">
                By signing up you agree to our{" "}
                <Link href="/terms" className="underline text-slate-400 hover:text-slate-200">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy-policy" className="underline text-slate-400 hover:text-slate-200">Privacy Policy</Link>.
                AMAX Global is AUSTRAC-registered — identity verification is required.
              </p>

              <Button type="submit" disabled={isLoading} className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold">
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</> : <>Create account <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </form>
          </div>
        )}

        {/* ── STEP 2: Email verification notice ────────────────────────── */}
        {step === 2 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Check your email</h2>
              <p className="text-sm text-slate-400 max-w-xs">
                We've sent a verification link to <span className="text-white font-medium">{email}</span>.
                Click the link to confirm your address.
              </p>
            </div>

            <div className="bg-slate-700/50 rounded-xl p-4 text-left space-y-2">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">What to expect</p>
              {[
                "A verification email from noreply@amaxglobal.com.au",
                "Subject: Confirm your AMAX account",
                "Link expires in 24 hours",
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold"
                onClick={() => { setError(null); setStep(3); }}
              >
                I've verified my email <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => setStep(3)}
              >
                Skip for now — verify later
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Didn't receive it?{" "}
              <button className="text-slate-300 underline hover:text-white" onClick={() => setError("Resend available once GMAIL is configured.")}>
                Resend email
              </button>
              {error && <span className="block text-amber-400 mt-1">{error}</span>}
            </p>
          </div>
        )}

        {/* ── STEP 3: Risk profiling ────────────────────────────────────── */}
        {step === 3 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">How will you use AMAX?</h2>
              <p className="text-sm text-slate-400 mt-1">This helps us personalise your experience and meet regulatory requirements.</p>
            </div>

            <form onSubmit={handleStep3} className="space-y-5">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              {/* Primary purpose — single select */}
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

              {/* Products — multi select checkboxes */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">Products you plan to use</Label>
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

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="ghost"
                  className="text-slate-400 hover:text-white hover:bg-slate-700 px-3"
                  onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button type="submit" className="flex-1 bg-white hover:bg-slate-100 text-slate-900 font-semibold">
                  Continue to KYC <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
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
