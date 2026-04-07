import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";

export default function AmlPolicy() {
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
        <h1 className="text-4xl font-bold mb-2">AML/CTF Policy</h1>
        <p className="text-sm mb-1" style={{ color: "#6b9ab8" }}>Anti-Money Laundering &amp; Counter-Terrorism Financing Policy</p>
        <p className="text-sm mb-10" style={{ color: "#4a6e88" }}>Last updated: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="space-y-8 leading-relaxed" style={{ color: "#a8c5d8" }}>
          <div className="rounded-lg p-5 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
            This AML/CTF Policy is a high-level public statement. A comprehensive internal AML/CTF Program is maintained separately in accordance with the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth).
          </div>

          {[
            { title: "1. Our Commitment", body: <>AMAX is committed to complying with Australia's Anti-Money Laundering and Counter-Terrorism Financing (AML/CTF) laws. We operate under the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) and maintain an AML/CTF Program designed to detect, deter, and disrupt financial crime.</> },
            { title: "2. AUSTRAC Registration", body: <><p>AMAX is registered (or in the process of registration) with AUSTRAC as a reporting entity in the following categories:</p><ul className="list-disc list-inside space-y-1 mt-2" style={{ color: "#6b9ab8" }}><li>Digital Currency Exchange (DCE)</li><li>Remittance Network Provider (RNP)</li><li>Independent Remittance Dealer (IRD)</li></ul></> },
            { title: "3. Know Your Customer (KYC)", body: <><p>All users are required to verify their identity before accessing AMAX services. Our KYC process includes:</p><ul className="list-disc list-inside space-y-1 mt-2" style={{ color: "#6b9ab8" }}><li>Collection and verification of government-issued identity documents</li><li>Proof of address verification</li><li>Politically Exposed Person (PEP) and sanctions screening</li><li>Enhanced due diligence for higher-risk customers</li></ul></> },
            { title: "4. Transaction Monitoring", body: <><p>AMAX monitors all transactions on an ongoing basis to detect suspicious activity. Our monitoring program includes:</p><ul className="list-disc list-inside space-y-1 mt-2" style={{ color: "#6b9ab8" }}><li>Automated rule-based transaction monitoring</li><li>Threshold-based reporting (Threshold Transaction Reports to AUSTRAC)</li><li>Suspicious Matter Reporting (SMR) to AUSTRAC where required</li><li>International funds transfer instruction (IFTI) reporting</li></ul></> },
            { title: "5. Record Keeping", body: <>We retain records of all customer identification, transaction records, and AML/CTF program documentation for a minimum of seven (7) years, in accordance with our legislative obligations.</> },
            { title: "6. Training & Governance", body: <>Our staff and key personnel receive regular AML/CTF training. An appointed AML/CTF Compliance Officer oversees the program, ensures ongoing regulatory compliance, and manages AUSTRAC reporting obligations.</> },
            { title: "7. Contact", body: <>For AML/CTF enquiries, please contact our Compliance team at <a href="mailto:compliance@amax.com.au" className="text-amber-400 hover:underline">compliance@amax.com.au</a>.</> },
          ].map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
              <div>{body}</div>
            </section>
          ))}
        </div>
      </main>

      <footer className="py-6 mt-16" style={{ borderTop: "1px solid #152e4a" }}>
        <div className="max-w-4xl mx-auto px-6 text-center text-xs" style={{ color: "#2d4d65" }}>
          © {new Date().getFullYear()} AMAX. ABN 54 690 827 608. AUSTRAC Registered Digital Currency Exchange.
        </div>
      </footer>
    </div>
  );
}
