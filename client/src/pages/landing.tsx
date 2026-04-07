import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightLeft,
  Wallet,
  Bitcoin,
  Globe2,
  Shield,
  CheckCircle2,
  ChevronRight,
  Coins,
  Lock,
  FileCheck,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";

const services = [
  {
    icon: ArrowRightLeft,
    title: "FX Exchange",
    description:
      "Convert between major currencies including AUD, USD, EUR, GBP, CAD, SGD, JPY, HKD and more at competitive interbank rates.",
    features: ["Real-time exchange rates", "Multi-currency accounts", "Instant settlement"],
    color: "bg-amber-500",
  },
  {
    icon: Wallet,
    title: "eWallet",
    description:
      "Hold, send, and receive funds across multiple currencies from a single digital wallet with full transaction history.",
    features: ["Multi-currency balances", "Instant transfers", "Full audit trail"],
    color: "bg-blue-500",
  },
  {
    icon: Bitcoin,
    title: "Crypto Exchange & Remittance",
    description:
      "Buy, sell, and remit using cryptocurrency. Cross-border transfers made faster and more cost-effective.",
    features: ["BTC, ETH & more", "Cross-border remittance", "Transparent fee structure"],
    color: "bg-emerald-500",
  },
];

const steps = [
  {
    step: "01",
    title: "Create Your Account",
    description: "Register and complete identity verification (KYC/AML) in minutes.",
  },
  {
    step: "02",
    title: "Fund Your Wallet",
    description: "Deposit funds via bank transfer or crypto into your multi-currency eWallet.",
  },
  {
    step: "03",
    title: "Exchange or Remit",
    description: "Convert currencies or send cross-border payments at transparent rates.",
  },
  {
    step: "04",
    title: "Track Everything",
    description: "Monitor all transactions in real time with a complete audit trail.",
  },
];

const compliancePoints = [
  "Full KYC/AML identity verification on all users",
  "Transaction monitoring and suspicious activity reporting (SAR)",
  "AUSTRAC registered Digital Currency Exchange (DCE)",
  "Segregated client funds — never co-mingled with operational funds",
  "256-bit encryption across all data at rest and in transit",
  "Complete audit logs retained for regulatory review",
];

const keyFeatures = [
  { icon: Zap, label: "Instant Settlements", description: "Near real-time FX and wallet transfers" },
  { icon: BarChart3, label: "Competitive Rates", description: "Tight spreads on 20+ currency pairs" },
  { icon: Globe2, label: "Global Coverage", description: "Send and receive in 40+ countries" },
  { icon: Lock, label: "Bank-Grade Security", description: "256-bit TLS, 2FA, and session audit logs" },
  { icon: FileCheck, label: "Regulatory Compliant", description: "AUSTRAC registered & fully audited" },
  { icon: Users, label: "Dedicated Support", description: "Human support for all compliance queries" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header / Nav */}
      <header className="border-b border-slate-800 sticky top-0 z-50 bg-slate-900/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
              <Coins className="w-5 h-5 text-slate-900" />
            </div>
            <span className="text-xl font-bold text-white">AMAX</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#compliance" className="hover:text-white transition-colors">Compliance</a>
          </nav>
          <Link href="/login">
            <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
              Sign In <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-6">
          AUSTRAC Registered Digital Currency Exchange
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          FX, eWallet &{" "}
          <span className="text-amber-400">Crypto Remittance</span>
          <br />for the Modern World
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          AMAX provides regulated multi-currency exchange, digital wallets, and crypto-powered remittance — built for compliance, designed for speed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-8">
              Get Started
            </Button>
          </Link>
          <a href="#compliance">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8">
              Compliance Framework
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-6 justify-center mt-16 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>256-bit Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-amber-500" />
            <span>AUSTRAC Registered</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>KYC/AML Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <span>Segregated Client Funds</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-slate-800/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Three core products built on a compliant, secure infrastructure — designed for individuals and businesses alike.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-8">
                    <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center mb-6`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
                    <p className="text-slate-400 mb-6 leading-relaxed">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Start sending and exchanging in four simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-slate-700" />
                )}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border-2 border-amber-500 text-amber-400 text-xl font-bold mb-5">
                  {step.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-slate-800/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built for reliability, transparency, and regulatory confidence.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {keyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-start gap-4 p-6 bg-slate-800 rounded-xl border border-slate-700">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.label}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section id="compliance" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
                Regulatory Compliance
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Built for Regulators, Trusted by Users</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                AMAX operates under a strict compliance framework aligned with AUSTRAC guidelines for Digital Currency Exchanges. Every transaction is monitored, recorded, and available for regulatory inspection.
              </p>
              <Link href="/login">
                <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
                  Access the Platform
                </Button>
              </Link>
            </div>
            <div>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8">
                  <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-400" />
                    Compliance Framework
                  </h3>
                  <ul className="space-y-4">
                    {compliancePoints.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-500 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-slate-800 mb-8">
            Join AMAX and experience compliant, fast, and transparent FX exchange, eWallet, and crypto remittance.
          </p>
          <Link href="/login">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-10">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
              <Coins className="w-3 h-3 text-slate-900" />
            </div>
            <span className="font-semibold text-slate-300">AMAX</span>
            <span>— Digital Currency Exchange Platform</span>
          </div>
          <div className="flex gap-6">
            <a href="#compliance" className="hover:text-slate-300 transition-colors">Compliance</a>
            <a href="#services" className="hover:text-slate-300 transition-colors">Services</a>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </div>
          <p>© {new Date().getFullYear()} AMAX. AUSTRAC Registered DCE.</p>
        </div>
      </footer>
    </div>
  );
}
