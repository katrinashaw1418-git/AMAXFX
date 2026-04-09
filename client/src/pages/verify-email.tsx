import { useLocation, Link } from "wouter";
import { Coins, CheckCircle2, XCircle, Clock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") ?? "pending";

  const states = {
    success: {
      icon: <CheckCircle2 className="w-10 h-10 text-green-400" />,
      bg: "bg-green-500/10 border-green-500/30",
      title: "Email verified!",
      body: "Your email address has been confirmed. You can now continue setting up your account.",
      cta: { label: "Continue to KYC", href: "/compliance" },
    },
    already: {
      icon: <CheckCircle2 className="w-10 h-10 text-green-400" />,
      bg: "bg-green-500/10 border-green-500/30",
      title: "Already verified",
      body: "This email address was already confirmed. You're good to go.",
      cta: { label: "Go to dashboard", href: "/dashboard" },
    },
    expired: {
      icon: <Clock className="w-10 h-10 text-amber-400" />,
      bg: "bg-amber-500/10 border-amber-500/30",
      title: "Link expired",
      body: "Your verification link has expired (links are valid for 24 hours). Please request a new one from your account settings.",
      cta: { label: "Sign in to resend", href: "/login" },
    },
    invalid: {
      icon: <XCircle className="w-10 h-10 text-red-400" />,
      bg: "bg-red-500/10 border-red-500/30",
      title: "Invalid link",
      body: "This verification link is invalid or has already been used. Please request a new one.",
      cta: { label: "Sign in", href: "/login" },
    },
    error: {
      icon: <XCircle className="w-10 h-10 text-red-400" />,
      bg: "bg-red-500/10 border-red-500/30",
      title: "Something went wrong",
      body: "We couldn't verify your email. Please try again or contact support@amaxglobal.com.au",
      cta: { label: "Go home", href: "/" },
    },
    missing: {
      icon: <Mail className="w-10 h-10 text-slate-400" />,
      bg: "bg-slate-700/50 border-slate-600",
      title: "No token provided",
      body: "Please use the link sent to your email address. If you need a new link, sign in and request one.",
      cta: { label: "Sign in", href: "/login" },
    },
  };

  const s = states[status as keyof typeof states] ?? states.missing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-2xl font-bold text-white">AMAX</span>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-5">
          <div className={`w-20 h-20 rounded-full border ${s.bg} flex items-center justify-center mx-auto`}>
            {s.icon}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{s.title}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
          </div>

          <Link href={s.cta.href}>
            <Button className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold">
              {s.cta.label} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>

          {status === "success" && (
            <p className="text-xs text-slate-500">
              Your identity verification (KYC) is required before you can transact. It only takes a few minutes.
            </p>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Need help?{" "}
          <a href="mailto:support@amaxglobal.com.au" className="text-slate-400 underline hover:text-slate-200">
            support@amaxglobal.com.au
          </a>
        </p>
      </div>
    </div>
  );
}
