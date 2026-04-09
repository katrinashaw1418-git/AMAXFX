import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, Shield, Coins, Eye, EyeOff } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    try {
      await register(firstName.trim(), lastName.trim(), email.trim(), password);
      navigate("/compliance");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo + headline */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-2xl font-bold text-white">AMAX</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400">Start your KYC verification after sign-up</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Sign up</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-white underline underline-offset-2 hover:text-white/80">
                Sign in
              </Link>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Social sign-up buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => setError("Google sign-up is coming soon. Please use email registration.")}
              >
                <SiGoogle className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => setError("Apple sign-up is coming soon. Please use email registration.")}
              >
                <SiApple className="w-4 h-4 mr-2" />
                Apple
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-slate-700" />
              <span className="text-xs text-slate-500">or continue with email</span>
              <Separator className="flex-1 bg-slate-700" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-slate-300 text-sm">First name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jane"
                    required
                    autoComplete="given-name"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-slate-300 text-sm">Last name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    required
                    autoComplete="family-name"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 text-sm">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  autoComplete="email"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    autoComplete="new-password"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-white/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-amber-400">Password must be at least 8 characters</p>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                By creating an account you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-2 text-slate-400 hover:text-slate-200">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy-policy" className="underline underline-offset-2 text-slate-400 hover:text-slate-200">Privacy Policy</Link>.
                AMAX Global is an AUSTRAC-registered Digital Currency Exchange (DCE) — identity verification is required to activate your account.
              </p>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 text-slate-500 text-sm justify-center">
          <Shield className="w-4 h-4" />
          <span>256-bit encrypted · AUSTRAC registered · ABN 54 690 827 608</span>
        </div>

      </div>
    </div>
  );
}
