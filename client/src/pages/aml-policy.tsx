import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";

export default function AmlPolicy() {
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
        <h1 className="text-4xl font-bold mb-2">AML/CTF Policy</h1>
        <p className="text-slate-500 text-sm mb-2">Anti-Money Laundering &amp; Counter-Terrorism Financing Policy</p>
        <p className="text-slate-500 text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 text-amber-300 text-sm">
            This AML/CTF Policy is a high-level public statement. A comprehensive internal AML/CTF Program is maintained separately in accordance with the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth).
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Our Commitment</h2>
            <p>AMAX is committed to complying with Australia's Anti-Money Laundering and Counter-Terrorism Financing (AML/CTF) laws. We operate under the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) and maintain an AML/CTF Program designed to detect, deter, and disrupt financial crime.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. AUSTRAC Registration</h2>
            <p>AMAX is registered (or in the process of registration) with AUSTRAC as a reporting entity in the following categories:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
              <li>Digital Currency Exchange (DCE)</li>
              <li>Remittance Network Provider (RNP)</li>
              <li>Independent Remittance Dealer (IRD)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Know Your Customer (KYC)</h2>
            <p>All users are required to verify their identity before accessing AMAX services. Our KYC process includes:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
              <li>Collection and verification of government-issued identity documents</li>
              <li>Proof of address verification</li>
              <li>Politically Exposed Person (PEP) and sanctions screening</li>
              <li>Enhanced due diligence for higher-risk customers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Transaction Monitoring</h2>
            <p>AMAX monitors all transactions on an ongoing basis to detect suspicious activity. Our monitoring program includes:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
              <li>Automated rule-based transaction monitoring</li>
              <li>Threshold-based reporting (Threshold Transaction Reports to AUSTRAC)</li>
              <li>Suspicious Matter Reporting (SMR) to AUSTRAC where required</li>
              <li>International funds transfer instruction (IFTI) reporting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Record Keeping</h2>
            <p>We retain records of all customer identification, transaction records, and AML/CTF program documentation for a minimum of seven (7) years, in accordance with our legislative obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Training &amp; Governance</h2>
            <p>Our staff and key personnel receive regular AML/CTF training. An appointed AML/CTF Compliance Officer oversees the program, ensures ongoing regulatory compliance, and manages AUSTRAC reporting obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
            <p>For AML/CTF enquiries, please contact our Compliance team at <a href="mailto:compliance@amax.com.au" className="text-amber-400 hover:underline">compliance@amax.com.au</a>.</p>
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
