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
  Phone,
  Building2,
  Briefcase,
  UserCheck,
} from "lucide-react";

const NAVY = "#002366";

// Regulatory status wording. AMAX GLOBAL Pty Ltd is enrolled with AUSTRAC and has
// applied for registration on the Remittance Sector Register and the Virtual Asset
// Service Provider Register. It is NOT registered and is not providing designated
// services. Do not describe AMAX as "registered", "regulated" or "licensed" until
// AUSTRAC confirms registration in writing. Any change to regulatory wording on this
// site must be approved by the AML/CTF Compliance Officer first.
const STATUS_LINE =
  "Pre-launch: AMAX GLOBAL Pty Ltd has applied to AUSTRAC for registration and is not yet providing remittance or digital currency exchange services.";

const services = [
  {
    icon: Globe2,
    title: "FX Remittance",
    description: "Send money domestically and overseas. Each transfer is funded for that transfer only, converted at the rate you accept and paid to the recipient's bank account.",
    features: ["Rate and fees shown before you confirm", "Recipients checked before payment", "Funded one transfer at a time"],
    iconBg: "bg-green-100", iconColor: "text-green-700",
  },
  {
    icon: Bitcoin,
    title: "Digital Currency Exchange",
    description: "Buy or sell BTC, ETH, USDT and USDC. Purchases are delivered to your own verified wallet and sale proceeds are paid to your own verified bank account.",
    features: ["BTC, ETH, USDT & USDC", "Delivered to your own wallet", "AMAX does not hold your crypto"],
    iconBg: "bg-amber-100", iconColor: "text-amber-700",
  },
  {
    icon: Shield,
    title: "Compliance Built In",
    description: "Identity verification, sanctions and PEP screening and transaction monitoring are designed to apply before and during every transaction.",
    features: ["Identity verified before any service", "Sanctions & PEP screening", "Ongoing transaction monitoring"],
    iconBg: "bg-blue-100", iconColor: "text-blue-700",
  },
];

const steps = [
  { step: "01", title: "Verify Your Identity", description: "Complete identity verification before using any service." },
  { step: "02", title: "Get a Quote",          description: "See the exchange rate and fees before you confirm." },
  { step: "03", title: "Fund the Transaction", description: "Pay in from your own bank account (or your own wallet, for a crypto sale) for that transaction only." },
  { step: "04", title: "Receive the Payout",   description: "Money or crypto is sent to the verified destination. Nothing is held for you in between." },
];

const compliancePoints = [
  "Identity verification before any designated service is provided",
  "Sanctions, PEP and adverse-media screening at onboarding and on an ongoing basis",
  "Transaction monitoring, with suspicious matters reported to AUSTRAC",
  "No customer money or crypto held between transactions",
  "AUSTRAC registration applications under assessment — services not yet available",
  "Records kept for at least 7 years",
];

const keyFeatures = [
  { icon: BarChart3, label: "Upfront Pricing",       description: "Exchange rate and fees displayed before you confirm",             iconBg: "bg-green-100",  iconColor: "text-green-700" },
  { icon: Wallet,    label: "No Balances Held",      description: "Every transaction is paid out; AMAX does not hold customer funds between transactions", iconBg: "bg-purple-100", iconColor: "text-purple-700" },
  { icon: Lock,      label: "Secure by Design",      description: "Encrypted connections and audit logging",                          iconBg: "bg-slate-100",  iconColor: "text-slate-700" },
  { icon: FileCheck, label: "Compliance First",      description: "AML/CTF Program in place; AUSTRAC registration applications under assessment", iconBg: "bg-green-100",  iconColor: "text-green-700" },
  { icon: Building2, label: "Australian Company",    description: "AMAX GLOBAL Pty Ltd, ABN 54 690 827 608",                          iconBg: "bg-blue-100",   iconColor: "text-blue-700" },
  { icon: Users,     label: "Human Support",         description: "Email and phone support",                                         iconBg: "bg-purple-100", iconColor: "text-purple-700" },
];

const targetCustomers = [
  { icon: UserCheck, title: "Individuals",            description: "Australian residents sending money domestically or overseas, or buying and selling digital currency.", iconBg: "bg-purple-100", iconColor: "text-purple-700" },
  { icon: Briefcase, title: "Sole Traders & Companies", description: "Australian businesses paying suppliers or receiving funds across borders.",                         iconBg: "bg-green-100",  iconColor: "text-green-700" },
];

const NAVY_BTN  = "bg-[#002366] hover:bg-[#012a6e] text-white font-semibold";
const WHITE_BTN = "bg-white hover:bg-white/90 text-[#002366] font-semibold";
const LIGHT_CARD = { background: "#ffffff", border: "1px solid #d1ddf0", borderRadius: "12px" };
const DARK_CARD  = { background: "#012a6e", border: "1px solid #1e3f73" };

export default function Landing() {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);

  // There is no contact-form backend on this deployment, so the form opens the
  // visitor's email app with the message addressed to info@amaxglobal.com.au.
  // (Previously the form showed "Message Sent" without sending anything.)
  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`AMAX enquiry / register interest — ${contactForm.name}`);
    const body = encodeURIComponent(
      `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\n${contactForm.message}`,
    );
    window.location.href = `mailto:info@amaxglobal.com.au?subject=${subject}&body=${body}`;
    setContactSent(true);
    setContactForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="min-h-screen" style={{ background: "#ffffff" }}>

      {/* ── Sticky Nav ── */}
      <div className="sticky top-0 z-50">
        <div className="text-white/80 text-sm text-center py-2 px-6" style={{ background: NAVY }}>
          {STATUS_LINE}
        </div>
        <header style={{ background: "#ffffff" }}>
          <div className="max-w-6xl mx-auto px-6 py-1 flex items-center justify-between">
            <div className="flex-1 flex items-center gap-2">
              <img src="/amax-global-fx-yacht-logo.png" alt="AMAX Global FX" className="h-16 w-auto" />
            </div>
            <nav className="hidden md:flex items-center gap-5 text-sm flex-1 justify-center">
              <a href="#services"     className="text-slate-700 hover:text-[#002366] transition-colors whitespace-nowrap">Services</a>
              <a href="#how-it-works" className="text-slate-700 hover:text-[#002366] transition-colors whitespace-nowrap">How It Works</a>
              <a href="#compliance"   className="text-slate-700 hover:text-[#002366] transition-colors whitespace-nowrap">Compliance</a>
              <a href="#about"        className="text-slate-700 hover:text-[#002366] transition-colors whitespace-nowrap">About</a>
              <a href="#contact"      className="text-slate-700 hover:text-[#002366] transition-colors whitespace-nowrap">Contact</a>
            </nav>
            <div className="flex-1 flex items-center justify-end gap-2">
              <Link href="/login">
                <Button variant="outline" className="text-sm px-4 text-[#002366] hover:text-[#002366] hover:bg-[#002366]/10 border-[#002366]/30" style={{ background: "transparent" }}>
                  Sign In
                </Button>
              </Link>
              <a href="#contact">
                <Button className={`${NAVY_BTN} text-sm px-4`}>
                  Register Interest <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        </header>
      </div>

      {/* ── Hero ── */}
      <section className="py-24 text-center text-white" style={{ background: NAVY }}>
        <div className="max-w-6xl mx-auto px-6">
          <Badge className="bg-white/10 text-white border border-white/20 mb-6">
            Pre-launch · AUSTRAC registration applications under assessment
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            FX Remittance &{" "}
            <span className="text-blue-300">Digital Currency Exchange</span>
            <br />Platform
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Send money and exchange between fiat and digital currencies. Each transaction is funded, converted and paid out to your own verified account or wallet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact">
              <Button size="lg" className={`${WHITE_BTN} px-8`}>Register Interest</Button>
            </a>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="px-8 text-white hover:text-white hover:bg-white/10 border-white/30" style={{ background: "transparent" }}>
                How It Will Work
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-white/60">
            We are not accepting new customers yet. Services will start only if AUSTRAC registration is granted.
          </p>
          <div className="flex flex-wrap gap-6 justify-center mt-16 text-sm text-white/70">
            {[
              { Icon: Shield,       label: "Encrypted connections" },
              { Icon: FileCheck,    label: "Identity verified before any service" },
              { Icon: CheckCircle2, label: "No funds held between transactions" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-blue-300" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-20" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="mb-3" style={{ background: "#e8f0fe", color: NAVY, border: "none" }}>Planned Services</Badge>
            <h2 className="text-3xl font-bold mb-4" style={{ color: NAVY }}>What AMAX Will Offer</h2>
            <p className="max-w-xl mx-auto text-slate-500">
              Services will start only after AUSTRAC registration is granted and our operating and compliance arrangements are in place.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="border shadow-sm hover:shadow-md transition-shadow" style={LIGHT_CARD}>
                  <CardContent className="p-7">
                    <div className={`w-12 h-12 ${service.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                      <Icon className={`w-6 h-6 ${service.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: NAVY }}>{service.title}</h3>
                    <p className="mb-5 leading-relaxed text-sm text-slate-500">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
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
      <section id="how-it-works" className="py-20" style={{ background: NAVY }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="bg-white/10 text-white border border-white/20 mb-3">How It Works</Badge>
            <h2 className="text-3xl font-bold mb-4 text-white">How It Will Work</h2>
            <p className="text-white/70 max-w-xl mx-auto">The same four steps apply to every transaction.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
                )}
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-full text-[#002366] text-xl font-bold mb-5 bg-white">
                  {step.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Features ── */}
      <section className="py-20" style={{ background: "#f4f7ff" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="mb-3" style={{ background: "#e8f0fe", color: NAVY, border: "none" }}>Platform</Badge>
            <h2 className="text-3xl font-bold mb-4" style={{ color: NAVY }}>Key Features</h2>
            <p className="text-slate-500 max-w-xl mx-auto">What customers can expect when AMAX launches.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {keyFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex items-start gap-4 p-6 rounded-xl bg-white shadow-sm border border-slate-100">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${feature.iconBg}`}>
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: NAVY }}>{feature.label}</h3>
                    <p className="text-sm text-slate-500">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Compliance ── */}
      <section id="compliance" className="py-20" style={{ background: "#ffffff" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4" style={{ background: "#e8f0fe", color: NAVY, border: "none" }}>Regulatory Compliance</Badge>
              <h2 className="text-3xl font-bold mb-4" style={{ color: NAVY }}>Our Regulatory Status</h2>
              <p className="mb-4 leading-relaxed text-slate-500">
                AMAX GLOBAL Pty Ltd is enrolled with AUSTRAC as a reporting entity and has applied for registration on AUSTRAC's Remittance Sector Register and Virtual Asset Service Provider Register. Those applications are under assessment.
              </p>
              <p className="mb-8 leading-relaxed text-slate-500">
                AMAX is not registered and will not provide remittance or digital currency exchange services unless and until registration is granted.
              </p>
              <Link href="/aml-policy">
                <Button className={NAVY_BTN}>Read our AML/CTF Policy</Button>
              </Link>
            </div>
            <div>
              <Card className="shadow-md" style={LIGHT_CARD}>
                <CardContent className="p-8">
                  <h3 className="font-semibold mb-6 flex items-center gap-2" style={{ color: NAVY }}>
                    <Shield className="w-5 h-5 text-blue-600" />
                    Compliance Framework
                  </h3>
                  <ul className="space-y-4">
                    {compliancePoints.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
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
      <section className="py-20" style={{ background: "#f4f7ff" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="mb-3" style={{ background: "#e8f0fe", color: NAVY, border: "none" }}>Customers</Badge>
            <h2 className="text-3xl font-bold mb-4" style={{ color: NAVY }}>Who We Serve</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              AMAX will serve Australian-based individuals and businesses that pass identity verification.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {targetCustomers.map((customer) => {
              const Icon = customer.icon;
              return (
                <div key={customer.title} className="flex items-start gap-5 p-7 rounded-xl bg-white shadow-sm border border-slate-100">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${customer.iconBg}`}>
                    <Icon className={`w-6 h-6 ${customer.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: NAVY }}>{customer.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{customer.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="py-20" style={{ background: "#ffffff" }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge className="mb-4" style={{ background: "#e8f0fe", color: NAVY, border: "none" }}>About AMAX</Badge>
          <h2 className="text-3xl font-bold mb-6" style={{ color: NAVY }}>Australia-Based. Compliance-First.</h2>
          <p className="leading-relaxed text-lg text-slate-600 mb-4">
            AMAX GLOBAL Pty Ltd is an Australian company building a platform for FX remittance and digital currency exchange.
          </p>
          <p className="leading-relaxed text-slate-500">
            The platform is in pre-launch. We will open to customers only after AUSTRAC registration is granted and our operating and compliance arrangements are in place.
          </p>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-20" style={{ background: "#f4f7ff" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <Badge className="mb-3" style={{ background: "#e8f0fe", color: NAVY, border: "none" }}>Get in Touch</Badge>
            <h2 className="text-3xl font-bold mb-4" style={{ color: NAVY }}>Register Interest or Contact Us</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              We are not accepting customers yet. Send us your details if you would like to hear when AMAX launches, or contact us with any question.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              {[
                { Icon: Phone,  title: "Phone",  href: "tel:+61283201908",              label: "+61 2 8320 1908" },
                { Icon: Mail,   title: "Email",  href: "mailto:info@amaxglobal.com.au", label: "info@amaxglobal.com.au" },
                // Registered office. Matches the ABN register (NSW 2216) and the address
                // already published on the AML policy page — kept in step if either changes.
                { Icon: MapPin, title: "Address", href: "",                            label: "Level 2, 8–12 King Street, Rockdale NSW 2216" },
              ].map(({ Icon, title, href, label }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
                    <Icon className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: NAVY }}>{title}</p>
                    {href
                      ? <a href={href} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">{label}</a>
                      : <p className="text-sm text-slate-500">{label}</p>
                    }
                  </div>
                </div>
              ))}
            </div>
            <Card className="shadow-md" style={LIGHT_CARD}>
              <CardContent className="p-7">
                {contactSent ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2" style={{ color: NAVY }}>Check Your Email App</h3>
                    <p className="text-sm text-slate-500">Your message has opened in your email app, addressed to info@amaxglobal.com.au. Press send there to complete it.</p>
                    <Button className={`mt-6 ${NAVY_BTN}`} onClick={() => setContactSent(false)}>Send Another</Button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="contact-name" className="text-sm font-medium mb-1.5 block" style={{ color: NAVY }}>Name</Label>
                      <Input id="contact-name" placeholder="Your full name" className="border-slate-200 focus-visible:ring-blue-300"
                        value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))} required />
                    </div>
                    <div>
                      <Label htmlFor="contact-email" className="text-sm font-medium mb-1.5 block" style={{ color: NAVY }}>Email</Label>
                      <Input id="contact-email" type="email" placeholder="you@example.com" className="border-slate-200 focus-visible:ring-blue-300"
                        value={contactForm.email} onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} required />
                    </div>
                    <div>
                      <Label htmlFor="contact-message" className="text-sm font-medium mb-1.5 block" style={{ color: NAVY }}>Message</Label>
                      <Textarea id="contact-message" placeholder="How can we help you?" rows={4} className="border-slate-200 focus-visible:ring-blue-300 resize-none"
                        value={contactForm.message} onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))} required />
                    </div>
                    <Button type="submit" className={`w-full ${NAVY_BTN}`}>
                      <Send className="w-4 h-4 mr-2" />Email Your Message
                    </Button>
                    <p className="text-xs text-slate-400 text-center">Opens your email app. Or email info@amaxglobal.com.au directly.</p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16" style={{ background: NAVY }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Interested in AMAX?</h2>
          <p className="text-white/70 mb-8">
            We are not accepting customers yet. Register your interest and we will contact you if and when AMAX launches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact">
              <Button size="lg" className={`${WHITE_BTN} px-10`}>Register Interest</Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12" style={{ background: "#002366", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <img src="/amax-bluebackground-yacht-water-transparent-logo.png" alt="AMAX Global FX" className="h-16 w-auto object-contain" />
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                Australian company building an FX remittance and digital currency exchange platform. Not yet providing services.
              </p>
              <p className="text-sm text-white/60 leading-relaxed mt-1">ABN 54 690 827 608</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-3 text-sm">Platform</p>
              <ul className="space-y-2 text-sm">
                {[["#services","Services"],["#how-it-works","How It Works"],["#compliance","Compliance"],["#about","About"],["#contact","Contact"]].map(([href, label]) => (
                  <li key={label}><a href={href} className="text-white/60 hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3 text-sm">Legal</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy-policy" className="text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms"           className="text-white/60 hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
                <li><Link href="/aml-policy"      className="text-white/60 hover:text-white transition-colors">AML/CTF Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p>© {new Date().getFullYear()} AMAX GLOBAL Pty Ltd. All rights reserved. ABN 54 690 827 608</p>
            <p>AUSTRAC registration applications under assessment. Not yet providing remittance or digital currency exchange services.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
