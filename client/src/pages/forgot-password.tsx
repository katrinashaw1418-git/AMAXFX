import { useState } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { username });
      const data = await res.json();
      setResetToken(data.resetToken);
    } catch (err: any) {
      setError(err.message || "Failed to process request.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-2xl font-bold text-white">AMAX</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-slate-400">Enter your username and we'll generate a reset token</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Account Recovery</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your username to receive a password reset token
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!resetToken ? (
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
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : "Generate Reset Token"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Alert className="border-amber-500 bg-amber-500/10">
                  <KeyRound className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-200">
                    Your reset token has been generated. Copy it and use it on the reset page.
                    <strong className="block mt-2 font-mono text-sm break-all text-amber-100 bg-slate-900 p-2 rounded mt-2">
                      {resetToken}
                    </strong>
                    <span className="text-xs text-slate-400 mt-1 block">Expires in 1 hour. Single use only.</span>
                  </AlertDescription>
                </Alert>
                <Link href={`/reset-password?token=${resetToken}`}>
                  <Button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
                    Go to Reset Password
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/login" className="text-slate-400 hover:text-amber-400 text-sm flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
