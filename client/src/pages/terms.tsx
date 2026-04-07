import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
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
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 text-amber-300 text-sm">
            These Terms &amp; Conditions are a placeholder document. Final, legally reviewed terms will be published prior to the platform's public launch.
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the AMAX platform, you agree to be bound by these Terms &amp; Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Platform Status</h2>
            <p>AMAX is currently in development and is not yet live for public use. The platform will launch following completion of AUSTRAC registration and full operational readiness. Access to the platform during development is strictly controlled and limited.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Eligibility</h2>
            <p>To use the AMAX platform, you must:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
              <li>Be at least 18 years of age</li>
              <li>Be a resident of Australia or an eligible jurisdiction</li>
              <li>Successfully complete our KYC/AML identity verification process</li>
              <li>Not be subject to sanctions or prohibited by applicable law from using financial services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Regulated Services</h2>
            <p>AMAX is registered (or in the process of registration) with AUSTRAC as a Digital Currency Exchange (DCE) and Remittance Network Provider. All services are subject to Australian AML/CTF laws and regulations. We reserve the right to suspend or terminate access for any user who fails to meet our compliance requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Risk Disclosure</h2>
            <p>Digital currency and foreign exchange trading involve significant financial risk. The value of digital assets can fluctuate substantially. You should not invest funds you cannot afford to lose. AMAX does not provide financial advice. You are responsible for your own investment decisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Governing Law</h2>
            <p>These Terms &amp; Conditions are governed by the laws of New South Wales, Australia. Any disputes shall be subject to the exclusive jurisdiction of the courts of New South Wales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
            <p>For enquiries regarding these terms, please contact us at <a href="mailto:legal@amax.com.au" className="text-amber-400 hover:underline">legal@amax.com.au</a>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-slate-600 text-xs">
          © {new Date().getFullYear()} AMAX. ABN: [Pending]. AUSTRAC Registered Digital Currency Exchange.
        </div>
      </footer>
    </div>
  );
}
