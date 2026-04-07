import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#07111f" }}>
      <header className="backdrop-blur sticky top-0 z-50" style={{ background: "rgba(7,17,31,0.97)", borderBottom: "1px solid #152e4a" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <Coins className="w-4 h-4 text-slate-900" />
              </div>
              <span className="text-lg font-bold text-white">AMAX</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="text-white hover:text-white hover:bg-[#152e4a]" style={{ borderColor: "#1d3a55", background: "transparent" }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm mb-10" style={{ color: "#4a6e88" }}>Last updated: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="space-y-8 leading-relaxed" style={{ color: "#a8c5d8" }}>
          <div className="rounded-lg p-5 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
            These Terms &amp; Conditions are a placeholder document. Final, legally reviewed terms will be published prior to the platform's public launch.
          </div>

          {[
            { title: "1. Acceptance of Terms", body: <>By accessing or using the AMAX platform, you agree to be bound by these Terms &amp; Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.</> },
            { title: "2. Platform Status", body: <>AMAX is currently in development and is not yet live for public use. The platform will launch following completion of AUSTRAC registration and full operational readiness. Access during development is strictly controlled and limited.</> },
            { title: "3. Eligibility", body: <><p>To use the AMAX platform, you must:</p><ul className="list-disc list-inside space-y-1 mt-2" style={{ color: "#6b9ab8" }}><li>Be at least 18 years of age</li><li>Be a resident of Australia or an eligible jurisdiction</li><li>Successfully complete our KYC/AML identity verification process</li><li>Not be subject to sanctions or prohibited by applicable law from using financial services</li></ul></> },
            { title: "4. Regulated Services", body: <>AMAX is registered (or in the process of registration) with AUSTRAC as a Digital Currency Exchange (DCE) and Remittance Network Provider. All services are subject to Australian AML/CTF laws. We reserve the right to suspend or terminate access for any user who fails to meet our compliance requirements.</> },
            { title: "5. Risk Disclosure", body: <>Digital currency and foreign exchange trading involve significant financial risk. The value of digital assets can fluctuate substantially. You should not invest funds you cannot afford to lose. AMAX does not provide financial advice. You are responsible for your own investment decisions.</> },
            { title: "6. Governing Law", body: <>These Terms &amp; Conditions are governed by the laws of New South Wales, Australia. Any disputes shall be subject to the exclusive jurisdiction of the courts of New South Wales.</> },
            { title: "7. Contact", body: <>For enquiries regarding these terms, please contact us at <a href="mailto:legal@amax.com.au" className="text-amber-400 hover:underline">legal@amax.com.au</a>.</> },
          ].map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
              <div>{body}</div>
            </section>
          ))}
        </div>
      </main>

      <footer className="py-6 mt-16" style={{ borderTop: "1px solid #152e4a" }}>
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} AMAX. ABN 54 690 827 608. AUSTRAC Registered Digital Currency Exchange.
        </div>
      </footer>
    </div>
  );
}
