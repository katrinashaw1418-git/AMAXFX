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
} from "lucide-react";

const services = [
  {
    icon: ArrowRightLeft,
    title: "FX Exchange",
    description: "Convert between major currencies including AUD, USD, EUR, GBP, CAD, SGD, JPY, HKD and more at competitive interbank rates.",
    features: ["Real-time exchange rates", "Multi-currency accounts", "Instant settlement"],
    color: "bg-purple-600",
  },
  {
    icon: Wallet,
    title: "Multi-Currency Accounts",
    description: "Send and receive funds across multiple currencies with full transaction history. Balances reflect funds held with regulated partner institutions — AMAX does not hold client funds.",
    features: ["Multi-currency balances", "Instant transfers", "Full audit trail"],
    color: "bg-blue-500",
  },
  {
    icon: Bitcoin,
    title: "Crypto Exchange",
    description: "Buy, sell, and hold digital assets including BTC, ETH, USDT, and USDC through a compliant, regulated platform.",
    features: ["BTC, ETH, USDT & USDC", "Real-time market prices", "Transparent fee structure"],
    color: "bg-white",
    iconColor: "text-slate-900",
  },
  {
    icon: Globe2,
    title: "Remittance",
    description: "Send funds domestically and internationally with streamlined processing, competitive FX, and full compliance tracking.",
    features: ["Cross-border transfers", "40+ supported corridors", "Same-day processing"],
    color: "bg-green-500",
  },
];

const steps = [
  { step: "01", title: "Create Your Account", description: "Register and complete identity verification (KYC/AML) in minutes." },
  { step: "02", title: "Fund Your Account",     description: "Deposit funds via bank transfer into your multi-currency account, held with regulated partner institutions." },
  { step: "03", title: "Exchange or Remit",    description: "Convert currencies or send cross-border payments at transparent rates." },
  { step: "04", title: "Track Everything",     description: "Monitor all transactions in real time with a complete audit trail." },
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
  { icon: Zap,       label: "Instant Settlements",  description: "Near real-time FX and account transfers",    color: "text-purple-400", bg: "rgba(192,132,252,0.12)" },
  { icon: BarChart3, label: "Competitive Rates",     description: "Tight spreads on 20+ currency pairs",       color: "text-green-400",  bg: "rgba(74,222,128,0.12)" },
  { icon: Globe2,    label: "Global Coverage",       description: "Send and receive in 40+ countries",          color: "text-blue-400",   bg: "rgba(96,165,250,0.12)" },
  { icon: Lock,      label: "Bank-Grade Security",   description: "256-bit TLS, 2FA, and session audit logs",   color: "text-white",      bg: "#111111" },
  { icon: FileCheck, label: "Regulatory Compliant",  description: "AUSTRAC registered & fully audited",         color: "text-green-400",  bg: "rgba(74,222,128,0.12)" },
  { icon: Users,     label: "Dedicated Support",     description: "Human support for all compliance queries",   color: "text-purple-400", bg: "rgba(192,132,252,0.12)" },
];

const targetCustomers = [
  { icon: UserCheck, title: "Retail Users",            description: "Individuals sending money overseas, managing multi-currency savings, or holding digital assets with full regulatory protection.",    color: "text-purple-400", bg: "rgba(192,132,252,0.12)" },
  { icon: Briefcase, title: "SMEs & Businesses",       description: "Small and medium enterprises paying international suppliers, managing foreign currency exposure, or receiving cross-border payments.", color: "text-green-400",  bg: "rgba(74,222,128,0.12)" },
  { icon: Globe2,    title: "International Transfers", description: "Migrant workers, expats, and families sending remittances across AUD and major Asian, European, and North American corridors.",       color: "text-blue-400",   bg: "rgba(96,165,250,0.12)" },
  { icon: Building2, title: "Institutional Clients",   description: "Corporate treasury teams and financial intermediaries requiring compliant FX execution, reporting, and audit-ready transaction records.", color: "text-white",    bg: "#111111" },
];

const GREY_BTN = "bg-gray-600 hover:bg-gray-500 text-white font-semibold";
const ICON_BG  = { background: "rgba(255,255,255,0.08)" };
const CARD_STYLE = { background: "#0e1f33", border: "1px solid #1a3450" };

export default function Landing() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactSent(true);
    setContactForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="landing-page bg-landing min-h-screen text-white">

      {/* ── Pre-launch banner + Nav (sticky together) ── */}
      <div className="sticky top-0 z-50 bg-landing">
        <div className="text-white/60 text-sm text-center py-2 px-6">
          Platform in development — services launching following completion of AUSTRAC registration and operational readiness.
        </div>

        <header>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex-1 flex items-center gap-3">
              <img src="/amax-coin-icon.png" alt="AMAX GLOBAL" className="h-10 w-auto" />
              <span className="font-bold text-white text-xl tracking-widest">AMAX GLOBAL</span>
            </div>

            <nav className="hidden md:flex items-center gap-5 text-sm flex-1 justify-center">
              <a href="#services"     className="text-white hover:text-white/70 transition-colors whitespace-nowrap">Services</a>
              <a href="#how-it-works" className="text-white hover:text-white/70 transition-colors whitespace-nowrap">How It Works</a>
              <a href="#compliance"   className="text-white hover:text-white/70 transition-colors whitespace-nowrap">Compliance</a>
              <a href="#about"        className="text-white hover:text-white/70 transition-colors whitespace-nowrap">About</a>
              <a href="#contact"      className="text-white hover:text-white/70 transition-colors whitespace-nowrap">Contact</a>
            </nav>

            <div className="flex-1 flex items-center justify-end gap-2">
              <Link href="/login">
                <Button variant="outline" className="text-sm px-4 text-white hover:text-white hover:bg-white/10" style={{ borderColor: "#1d3a55", background: "transparent" }}>
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className={`${GREY_BTN} text-sm px-4`}>
                  Sign Up <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Badge className="bg-white/10 text-white border border-white/20 mb-6">
          AUSTRAC Registered Digital Currency Exchange
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Secure FX, Multi-Currency Accounts &{" "}
          <span className="text-white">Crypto Exchange</span>
          <br />Platform
        </h1>
        <p className="text-xl text-white max-w-2xl mx-auto mb-10">
          Send, receive, exchange, and manage funds across fiat and digital currencies — built with compliance and security at its core.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className={`${GREY_BTN} px-8`}>Get Started</Button>
          </Link>
          <a href="#how-it-works">
            <Button size="lg" variant="outline" className="px-8 text-white hover:text-white hover:bg-white/10" style={{ borderColor: "#1d3a55", background: "transparent" }}>
              How It Works
            </Button>
          </a>
        </div>
        <p className="mt-6 text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline underline-offset-2 hover:text-white/80 transition-colors">
            Sign In
          </Link>
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-6 justify-center mt-16 text-sm text-white">
          {[
            { Icon: Shield,       label: "256-bit Encrypted" },
            { Icon: FileCheck,    label: "AUSTRAC Registered" },
            { Icon: Lock,         label: "KYC/AML Verified" },
            { Icon: CheckCircle2, label: "Segregated Client Funds" },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-white" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-20" style={{ background: "#0a1928" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-white max-w-xl mx-auto">
              Four core offerings built on a compliant, secure infrastructure — aligned with AUSTRAC's regulated service categories.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="border-0" style={CARD_STYLE}>
                  <CardContent className="p-7">
                    <div className={`w-12 h-12 ${service.color} rounded-xl flex items-center justify-center mb-5`}>
                      <Icon className={`w-6 h-6 ${service.iconColor ?? "text-white"}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{service.title}</h3>
                    <p className="mb-5 leading-relaxed text-sm text-white">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-white">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
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

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20" style={{ background: "#07111f" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-white max-w-xl mx-auto">Start sending and exchanging in four simple steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px" style={{ background: "#152e4a" }} />
                )}
                {/* White circle with white number */}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-white text-white text-xl font-bold mb-5" style={{ background: "#0e1f33" }}>
                  {step.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Features ── */}
      <section className="py-20" style={{ background: "#0a1928" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Key Features</h2>
            <p className="text-white max-w-xl mx-auto">Built for reliability, transparency, and regulatory confidence.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {keyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-start gap-4 p-6 rounded-xl" style={CARD_STYLE}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: feature.bg }}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.label}</h3>
                    <p className="text-sm text-white">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Compliance ── */}
      <section id="compliance" className="py-20" style={{ background: "#07111f" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="bg-white/10 text-white border border-white/20 mb-4">
                Regulatory Compliance
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Built for Regulators, Trusted by Users</h2>
              <p className="mb-8 leading-relaxed text-white">
                AMAX operates under a strict compliance framework aligned with AUSTRAC guidelines for Digital Currency Exchanges and Remittance Network Providers. Every transaction is monitored, recorded, and available for regulatory inspection.
              </p>
              <Link href="/login">
                <Button className={GREY_BTN}>Access the Platform</Button>
              </Link>
            </div>
            <div>
              <Card style={CARD_STYLE}>
                <CardContent className="p-8">
                  <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-white" />
                    Compliance Framework
                  </h3>
                  <ul className="space-y-4">
                    {compliancePoints.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-white">
                        <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
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

      {/* ── Who We Serve ── */}
      <section className="py-20" style={{ background: "#0a1928" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Who We Serve</h2>
            <p className="text-white max-w-xl mx-auto">
              AMAX is designed for individuals and businesses that need regulated, transparent access to FX, multi-currency accounts, crypto, and cross-border payments.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {targetCustomers.map((customer) => {
              const Icon = customer.icon;
              return (
                <div key={customer.title} className="flex items-start gap-5 p-7 rounded-xl" style={CARD_STYLE}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: customer.bg }}>
                    <Icon className={`w-6 h-6 ${customer.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-2">{customer.title}</h3>
                    <p className="text-sm leading-relaxed text-white">{customer.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20" style={{ background: "#07111f" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge className="bg-white/10 text-white border border-white/20 mb-4">About AMAX</Badge>
          <h2 className="text-3xl font-bold mb-6">Australia-Based. Compliance-First.</h2>
          <p className="leading-relaxed text-lg text-white mb-4">
            AMAX is an Australian-based FX and remittance service provider, building regulated infrastructure for foreign exchange, multi-currency accounts, cryptocurrency trading, and cross-border remittance. Alongside our digital platform, AMAX will operate from our Kings Court headquarters in Rockdale, Sydney — giving Australians the option to access FX and remittance services in person.
          </p>
          <p className="leading-relaxed text-white mb-4">
            Our founding team brings experience across financial services, compliance, and technology — with a singular focus on building a platform that regulators, banks, and customers can trust.
          </p>
          <p className="leading-relaxed text-white">
            Our mission is to make regulated access to global currencies and digital assets simpler, faster, and safer for all Australians.
          </p>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-20" style={{ background: "#0a1928" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-white max-w-xl mx-auto">
              Have a question about the platform, our compliance framework, or partnership opportunities? We'd love to hear from you.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Contact details */}
            <div className="space-y-6">
              {[
                { Icon: Mail,   title: "Email",             href: "mailto:info@amaxglobal.com.au", label: "info@amaxglobal.com.au" },
                { Icon: MapPin, title: "Office", href: null,                      label: "Level 2, Kings Court, 8-12 King Street, Rockdale, Sydney NSW 2216" },
              ].map(({ Icon, title, href, label }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={ICON_BG}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">{title}</p>
                    {href
                      ? <a href={href} className="text-sm text-white hover:text-gray-300 transition-colors">{label}</a>
                      : <p className="text-sm text-white">{label}</p>
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Contact form */}
            <Card style={CARD_STYLE}>
              <CardContent className="p-7">
                {contactSent ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-white mx-auto mb-4" />
                    <h3 className="font-semibold text-white text-lg mb-2">Message Sent</h3>
                    <p className="text-sm text-white">Thank you for reaching out. We'll be in touch shortly.</p>
                    <Button
                      className={`mt-6 ${GREY_BTN}`}
                      onClick={() => setContactSent(false)}
                    >
                      Send Another
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="contact-name" className="text-sm text-white mb-1.5 block">Name</Label>
                      <Input
                        id="contact-name"
                        placeholder="Your full name"
                        className="text-white placeholder:text-white/40 border-0 focus-visible:ring-white/30"
                        style={{ background: "#071526", border: "1px solid #1d3a55" }}
                        value={contactForm.name}
                        onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="text-sm text-white mb-1.5 block">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="you@example.com"
                        className="text-white placeholder:text-white/40 border-0 focus-visible:ring-white/30"
                        style={{ background: "#071526", border: "1px solid #1d3a55" }}
                        value={contactForm.email}
                        onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-message" className="text-sm text-white mb-1.5 block">Message</Label>
                      <Textarea
                        id="contact-message"
                        placeholder="How can we help you?"
                        rows={4}
                        className="text-white placeholder:text-white/40 border-0 focus-visible:ring-white/30 resize-none"
                        style={{ background: "#071526", border: "1px solid #1d3a55" }}
                        value={contactForm.message}
                        onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className={`w-full ${GREY_BTN}`}>
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

      {/* ── CTA — black background ── */}
      <section style={{ background: "#050a10" }} className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-white mb-8">
            Join AMAX and experience compliant, fast, and transparent FX exchange, multi-currency accounts, crypto trading, and remittance — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className={`${GREY_BTN} px-10`}>Sign Up Now</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-10 text-white hover:text-white hover:bg-white/10" style={{ borderColor: "#1d3a55", background: "transparent" }}>
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12" style={{ background: "#07111f", borderTop: "1px solid #152e4a" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <img src="/amax-coin-icon.png" alt="AMAX GLOBAL" className="h-9 w-auto" />
                <span className="font-bold text-white text-lg tracking-widest">AMAX GLOBAL</span>
              </div>
              <p className="text-sm text-white leading-relaxed">
                Australia-based regulated platform for FX exchange, multi-currency accounts, cryptocurrency trading, and cross-border remittance.
              </p>
              <p className="text-sm text-white leading-relaxed">ABN 54 690 827 608</p>
            </div>

            <div>
              <p className="font-semibold text-white mb-3 text-sm">Platform</p>
              <ul className="space-y-2 text-sm">
                {[["#services","Services"],["#how-it-works","How It Works"],["#compliance","Compliance"],["#about","About"],["#contact","Contact"]].map(([href, label]) => (
                  <li key={label}><a href={href} className="text-white hover:text-white/70 transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-white mb-3 text-sm">Legal</p>
              <ul className="space-y-2 text-sm text-white">
                <li><Link href="/privacy-policy" className="hover:text-white/70 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms"           className="hover:text-white/70 transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/aml-policy"      className="hover:text-white/70 transition-colors">AML/CTF Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/70" style={{ borderTop: "1px solid #152e4a" }}>
            <p>© {new Date().getFullYear()} AMAX. All rights reserved. AUSTRAC Registered Digital Currency Exchange. ABN 54 690 827 608</p>
            <p>Regulated in Australia. Platform launching following regulatory registration.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
