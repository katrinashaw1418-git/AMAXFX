import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";

// Public summary of AMAX's AML/CTF Program. Keep this page consistent with the
// approved internal Program: every statement here must be traceable to it.
// Regulatory status: enrolled with AUSTRAC; registration applications under
// assessment; NOT registered and not providing designated services.
const UPDATED = "5 November 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="text-white/80 space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 pl-2">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

export default function AmlPolicy() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#07111f" }}>
      <header className="backdrop-blur sticky top-0 z-50" style={{ background: "rgba(7,17,31,0.97)", borderBottom: "1px solid #152e4a" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
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

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-4xl font-bold mb-2">AML/CTF Policy</h1>
          <p className="text-sm text-white/60">Anti-Money Laundering &amp; Counter-Terrorism Financing Policy Statement</p>
          <p className="text-sm text-white/60">AMAX GLOBAL Pty Ltd &nbsp;|&nbsp; ABN 54 690 827 608 &nbsp;|&nbsp; Last updated: {UPDATED}</p>
        </div>

        <div className="rounded-lg p-5 text-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <strong>Public summary.</strong> This page summarises AMAX's AML/CTF framework. AMAX's full AML/CTF Program is an internal document approved by its Director. AMAX is not yet providing remittance or digital currency exchange services.
        </div>

        <div className="space-y-10">

          <Section id="s1" title="1. About AMAX and Our Regulatory Status">
            <p>AMAX GLOBAL Pty Ltd (ACN 690 827 608, ABN 54 690 827 608) is an Australian company. It is enrolled with the Australian Transaction Reports and Analysis Centre (AUSTRAC) and has applied for registration on AUSTRAC's Remittance Sector Register and Virtual Asset Service Provider Register. Those applications are under assessment. AMAX is not registered and will not provide the services below unless and until registration is granted.</p>
            <p>If registered, AMAX intends to provide:</p>
            <List items={[
              "Remittance services as an independent remittance dealer: domestic and international funds transfers on behalf of customers",
              "Digital currency exchange (virtual asset) services: exchange between Australian dollars and Bitcoin (BTC), Ether (ETH), Tether (USDT) and USD Coin (USDC)",
            ]} />
          </Section>

          <Section id="s2" title="2. Customer Funds">
            <p>AMAX will not hold customer money or digital assets between transactions. Each instruction is funded by the customer for that transaction only, executed through regulated third-party providers and paid out to the customer's verified bank account or wallet, or to the nominated recipient of a remittance. AMAX does not accept cash.</p>
          </Section>

          <Section id="s3" title="3. Legislative Framework">
            <List items={[
              "Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth)",
              "Anti-Money Laundering and Counter-Terrorism Financing Rules 2025",
              "Autonomous Sanctions Act 2011 (Cth) and Charter of the United Nations Act 1945 (Cth)",
              "Criminal Code Act 1995 (Cth), Division 400 (money laundering offences)",
            ]} />
          </Section>

          <Section id="s4" title="4. Governance">
            <List items={[
              "The Director is AMAX's governing body and approves the AML/CTF Program and any material change to it",
              "AML/CTF Compliance Officer: Katrina Stratford (Director)",
              "The Program is reviewed at least annually and whenever the business, its services or its risks change materially",
              "The Program will be independently evaluated at least once every two years",
              "Any public statement about AMAX's regulatory status must be approved by the AML/CTF Compliance Officer",
            ]} />
          </Section>

          <Section id="s5" title="5. Risk Assessment">
            <p>AMAX has assessed its money laundering, terrorism financing and proliferation financing risks across its customers, services, delivery channels and the countries it deals with. The risk assessment is reviewed at least annually and whenever there is a material change.</p>
          </Section>

          <Section id="s6" title="6. Customer Due Diligence">
            <List items={[
              "Every customer is identified and verified before any designated service is provided; unverified customers cannot transact",
              "Individuals, sole traders and companies only; beneficial owners holding 25% or more, or otherwise controlling a company, are identified and verified",
              "Screening of customers and beneficial owners for sanctions (DFAT Consolidated List and UN lists), politically exposed persons and adverse information, at onboarding and on an ongoing basis",
              "Enhanced due diligence, including source of funds and source of wealth and senior approval, for PEPs, higher-risk countries and unusual activity",
              "Higher-risk customers are reviewed at least annually",
            ]} />
          </Section>

          <Section id="s7" title="7. Transaction Monitoring">
            <p>Transactions will be monitored using defined rules and manual review, including single or linked transactions of AUD 10,000 or more in 24 hours, structuring, rapid conversion between fiat and digital currency without a clear purpose, transfers involving higher-risk jurisdictions, and blockchain analytics on wallets. Alerts are reviewed by the AML/CTF Compliance Officer within 24 hours.</p>
          </Section>

          <Section id="s8" title="8. Reporting to AUSTRAC">
            <List items={[
              "Suspicious matter reports: as soon as practicable, and within 24 hours for terrorism financing suspicions or three business days for other suspicions",
              "International funds transfer instruction reports for international transfers sent or received for customers",
              "Threshold transaction reports apply only to cash; AMAX does not accept cash",
              "Annual compliance reports when requested by AUSTRAC",
            ]} />
          </Section>

          <Section id="s9" title="9. Travel Rule">
            <p>For value transfers, including virtual asset transfers, AMAX will collect, verify and pass on the required originator and beneficiary information. A transfer will not be processed where the required information cannot be obtained, unless it has been individually risk-assessed and approved in writing by the AML/CTF Compliance Officer.</p>
          </Section>

          <Section id="s10" title="10. Record Keeping">
            <p>Customer identification, transaction, reporting, Travel Rule, training and monitoring records are kept for at least 7 years.</p>
          </Section>

          <Section id="s11" title="11. Contact">
            <p>For AML/CTF enquiries or to report a concern:</p>
            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p><strong>AMAX GLOBAL Pty Ltd</strong></p>
              <p>AML/CTF Compliance Officer: Katrina Stratford</p>
              <p>Level 2, 8–12 King Street, Rockdale NSW 2216</p>
              <p>Phone: <a href="tel:+61283201908" className="text-white underline hover:text-white/70">+61 2 8320 1908</a></p>
              <p>Email: <a href="mailto:info@amaxglobal.com.au" className="text-white underline hover:text-white/70">info@amaxglobal.com.au</a></p>
            </div>
          </Section>

        </div>
      </main>

      <footer className="py-6 mt-16" style={{ borderTop: "1px solid #152e4a" }}>
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} AMAX GLOBAL Pty Ltd. ABN 54 690 827 608. Enrolled with AUSTRAC; registration applications under assessment.
        </div>
      </footer>
    </div>
  );
}
