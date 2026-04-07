import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Send,
  Mail,
  MapPin,
  Building2,
  Briefcase,
  UserCheck,
  AlertTriangle,
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
    title: "Digital Wallet",
    description:
      "Hold, send, and receive funds across multiple currencies from a single digital wallet with full transaction history.",
    features: ["Multi-currency balances", "Instant transfers", "Full audit trail"],
    color: "bg-blue-500",
  },
  {
    icon: Bitcoin,
    title: "Crypto Exchange",
    description:
      "Buy, sell, and hold digital assets including BTC, ETH, USDT, and USDC through a compliant, regulated platform.",
    features: ["BTC, ETH, USDT & USDC", "Real-time market prices", "Transparent fee structure"],
    color: "bg-emerald-500",
  },
  {
    icon: Globe2,
    title: "Remittance",
    description:
      "Send funds domestically and internationally with streamlined processing, competitive FX, and full compliance tracking.",
    features: ["Cross-border transfers", "40+ supported corridors", "Same-day processing"],
    color: "bg-purple-500",
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

const targetCustomers = [
  {
    icon: UserCheck,
    title: "Retail Users",
    description:
      "Individuals sending money overseas, managing multi-currency savings, or holding digital assets with full regulatory protection.",
  },
  {
    icon: Briefcase,
    title: "SMEs & Businesses",
    description:
      "Small and medium enterprises paying international suppliers, managing foreign currency exposure, or receiving cross-border payments.",
  },
  {
    icon: Globe2,
    title: "International Transfers",
    description:
      "Migrant workers, expats, and families sending remittances across AUD and major Asian, European, and North American corridors.",
  },
  {
    icon: Building2,
    title: "Institutional Clients",
    description:
      "Corporate treasury teams and financial intermediaries requiring compliant FX execution, reporting, and audit-ready transaction records.",
  },
];

export default function Landing() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* Pre-launch disclaimer + Nav — both sticky together */}
      <div className="sticky top-0 z-50">
        {/* Pre-launch banner */}
        <div className="bg-amber-500 text-slate-900 text-sm font-medium text-center py-2 px-6 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Platform in development — services launching following completion of AUSTRAC registration and operational readiness.
        </div>

        {/* Nav */}
        <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-slate-900" />
              </div>
              <span className="text-xl font-bold text-white">AMAX</span>
            </div>
            <nav className="hidden md:flex items-center gap-7 text-sm text-slate-400">
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#compliance" className="hover:text-white transition-colors">Compliance</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 text-sm px-4">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm px-4">
                  Sign Up <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-6">
          AUSTRAC Registered Digital Currency Exchange
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Secure FX, Digital Wallet &{" "}
          <span className="text-amber-400">Crypto Exchange</span>
          <br />Platform
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Send, receive, exchange, and manage funds across fiat and digital currencies — built with compliance and security at its core.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-8">
              Get Started
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8">
              How It Works
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

      {/* Services — 4 cards */}
      <section id="services" className="bg-slate-800/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Four core offerings built on a compliant, secure infrastructure — aligned with AUSTRAC's regulated service categories.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-7">
                    <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center mb-5`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                    <p className="text-slate-400 mb-5 leading-relaxed text-sm">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
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
                AMAX operates under a strict compliance framework aligned with AUSTRAC guidelines for Digital Currency Exchanges and Remittance Network Providers. Every transaction is monitored, recorded, and available for regulatory inspection.
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

      {/* Target Customers — 2×2 tile grid */}
      <section className="bg-slate-800/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Who We Serve</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              AMAX is designed for individuals and businesses that need regulated, transparent access to FX, digital wallets, crypto, and cross-border payments.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {targetCustomers.map((customer) => {
              const Icon = customer.icon;
              return (
                <div key={customer.title} className="flex items-start gap-5 p-7 bg-slate-800 rounded-xl border border-slate-700">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-2">{customer.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{customer.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-4">
            About AMAX
          </Badge>
          <h2 className="text-3xl font-bold mb-6">Australia-Based. Compliance-First.</h2>
          <p className="text-slate-400 leading-relaxed text-lg mb-4">
            AMAX is an Australian-based fintech platform building regulated infrastructure for FX exchange, digital wallets, cryptocurrency trading, and cross-border remittance. Our founding team brings experience from financial services, compliance, and technology — with a focus on building a platform that regulators, banks, and customers can trust.
          </p>
          <p className="text-slate-400 leading-relaxed">
            We are currently completing our AUSTRAC registration process and will launch services to the public following regulatory approval and full operational readiness. Our mission is to make regulated access to global currencies and digital assets simpler, faster, and safer for Australians.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-slate-800/50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Have a question about the platform, our compliance framework, or partnership opportunities? We'd love to hear from you.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Contact details */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Email</p>
                  <a href="mailto:contact@amax.com.au" className="text-slate-400 hover:text-amber-400 transition-colors text-sm">
                    contact@amax.com.au
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Registered Office</p>
                  <p className="text-slate-400 text-sm">Sydney, New South Wales, Australia</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Compliance Enquiries</p>
                  <a href="mailto:compliance@amax.com.au" className="text-slate-400 hover:text-amber-400 transition-colors text-sm">
                    compliance@amax.com.au
                  </a>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-7">
                {contactSent ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-white text-lg mb-2">Message Sent</h3>
                    <p className="text-slate-400 text-sm">Thank you for reaching out. We'll be in touch shortly.</p>
                    <Button
                      variant="outline"
                      className="mt-6 border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => setContactSent(false)}
                    >
                      Send Another
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="contact-name" className="text-slate-300 text-sm mb-1.5 block">Name</Label>
                      <Input
                        id="contact-name"
                        placeholder="Your full name"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500"
                        value={contactForm.name}
                        onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="text-slate-300 text-sm mb-1.5 block">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="you@example.com"
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500"
                        value={contactForm.email}
                        onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-message" className="text-slate-300 text-sm mb-1.5 block">Message</Label>
                      <Textarea
                        id="contact-message"
                        placeholder="How can we help you?"
                        rows={4}
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 resize-none"
                        value={contactForm.message}
                        onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-500 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-slate-800 mb-8">
            Join AMAX and experience compliant, fast, and transparent FX exchange, digital wallet, crypto trading, and remittance — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-10">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-slate-800 text-slate-900 hover:bg-amber-400 px-10">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-amber-500 rounded flex items-center justify-center">
                  <Coins className="w-4 h-4 text-slate-900" />
                </div>
                <span className="font-bold text-white text-lg">AMAX</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Australia-based regulated platform for FX exchange, digital wallets, cryptocurrency trading, and cross-border remittance.
              </p>
              <p className="text-slate-600 text-xs mt-3">ABN: [Pending]</p>
            </div>

            {/* Links */}
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-sm">Platform</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#services" className="hover:text-slate-300 transition-colors">Services</a></li>
                <li><a href="#how-it-works" className="hover:text-slate-300 transition-colors">How It Works</a></li>
                <li><a href="#compliance" className="hover:text-slate-300 transition-colors">Compliance</a></li>
                <li><a href="#about" className="hover:text-slate-300 transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-slate-300 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-sm">Legal</p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <Link href="/privacy-policy" className="hover:text-slate-300 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-slate-300 transition-colors">
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/aml-policy" className="hover:text-slate-300 transition-colors">
                    AML/CTF Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-slate-600 text-xs">
            <p>© {new Date().getFullYear()} AMAX. All rights reserved. AUSTRAC Registered Digital Currency Exchange.</p>
            <p>Regulated in Australia. Platform launching following regulatory registration.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
