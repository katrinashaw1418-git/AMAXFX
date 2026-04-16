import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Email verification state (shown when login blocked due to unverified email)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      if (err.code === "email_not_verified") {
        setUnverifiedEmail(err.email || "");
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpError(null);
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleOtpChange(idx: number, val: string) {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otpDigits];
    next[idx] = val;
    setOtpDigits(next);
    setOtpError(null);
    if (val && idx < 5) {
      (document.getElementById(`otp-login-${idx + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      (document.getElementById(`otp-login-${idx - 1}`) as HTMLInputElement)?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      (document.getElementById(`otp-login-${idx - 1}`) as HTMLInputElement)?.focus();
    }
    if (e.key === "ArrowRight" && idx < 5) {
      (document.getElementById(`otp-login-${idx + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setOtpDigits(pasted.split(""));
      (document.getElementById(`otp-login-5`) as HTMLInputElement)?.focus();
    }
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join("");
    if (code.length < 6) { setOtpError("Please enter all 6 digits."); return; }
    setIsVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      localStorage.setItem("amax_jwt", data.token);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setOtpError(err.message || "Invalid code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    setResendSent(false);
    try {
      await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setOtpDigits(["", "", "", "", "", ""]);
      setResendSent(true);
      setTimeout(() => setResendSent(false), 10000);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/amax-coin-icon.png" alt="AMAX GLOBAL" className="h-10 w-auto" />
            <span className="font-bold text-white text-2xl tracking-widest">AMAX GLOBAL</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400">Sign in to your wealth management platform</p>
        </div>

        {/* ── EMAIL VERIFICATION SCREEN ── */}
        {unverifiedEmail ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Verify your email</h2>
              <p className="text-sm text-slate-400 max-w-xs">
                Your account is not yet verified. Enter the 6-digit code sent to{" "}
                <span className="text-white font-medium">{unverifiedEmail}</span>.
              </p>
            </div>

            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`otp-login-${i}`}
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

            {otpError && <p className="text-sm text-red-400">{otpError}</p>}
            {resendSent && (
              <p className="text-sm text-green-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> New code sent — check your inbox.
              </p>
            )}

            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp || otpDigits.join("").length < 6}
            >
              {isVerifyingOtp
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
                : <>Activate account <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>

            <p className="text-xs text-slate-500">
              Didn't receive a code? Check your spam folder or{" "}
              <button
                className="text-slate-300 underline hover:text-white"
                disabled={resendLoading}
                onClick={handleResend}
              >
                {resendLoading ? "Sending…" : "resend the code"}
              </button>
            </p>

            <button
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              onClick={() => setUnverifiedEmail(null)}
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          /* ── SIGN IN FORM ── */
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Sign In</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your credentials to access your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-300">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-white/50"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <div className="text-center space-y-2">
                  <Link href="/forgot-password" className="text-sm text-white hover:text-white/70 transition-colors block">
                    Forgot your password?
                  </Link>
                  <p className="text-sm text-slate-400">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-white underline underline-offset-2 hover:text-white/80">
                      Create one
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-sm justify-center">
          <Shield className="w-4 h-4" />
          <span>256-bit encrypted · JWT authenticated · Audit logged</span>
        </div>
      </div>
    </div>
  );
}
