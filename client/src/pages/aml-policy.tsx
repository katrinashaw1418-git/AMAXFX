import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";

const UPDATED = "1 April 2025";

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
          <p className="text-sm text-white/60">AMAX Global Pty Ltd &nbsp;|&nbsp; ABN 54 690 827 608 &nbsp;|&nbsp; Version 2.0 &nbsp;|&nbsp; Last updated: {UPDATED}</p>
        </div>

        {/* Disclaimer */}
        <div className="rounded-lg p-5 text-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <strong>Public Policy Statement.</strong> This document is a high-level public statement of AMAX's AML/CTF obligations and commitments. A comprehensive internal AML/CTF Program (v2.0) is maintained separately and is not publicly disclosed, in accordance with the <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em> (Cth) (the Act).
        </div>

        <div className="space-y-10">

          <Section id="s1" title="1. About AMAX">
            <p>AMAX Global Pty Ltd (ACN 690 827 608, ABN 54 690 827 608) is an Australian financial technology company headquartered at Level 2, 8–12 King Street, Rockdale NSW 2216. AMAX provides the following designated services under the Act:</p>
            <List items={[
              "Digital Currency Exchange (DCE) — buying, selling, and exchanging crypto-assets including Bitcoin (BTC), Ethereum (ETH), and stablecoins",
              "Remittance services — international and domestic funds transfers",
              "Multi-Currency Account and foreign exchange (FX) services",
            ]} />
            <p>These services make AMAX a <strong>reporting entity</strong> under the Act. AMAX is enrolled with the Australian Transaction Reports and Analysis Centre (AUSTRAC) and complies with all applicable AML/CTF obligations.</p>
            <div className="mt-4 space-y-2">
              <p className="font-semibold text-white">Fund-Holding Structure — Partner-Held Ledger Model</p>
              <p>AMAX maintains internal ledger accounts that record each customer's balance entitlements across multiple currencies and digital assets. <strong>AMAX does not hold customer funds directly.</strong> Fiat currency balances are maintained with regulated Australian banking partners in omnibus accounts; AMAX's internal ledger records each customer's proportional entitlement within those accounts.</p>
              <p>Digital asset transactions are executed exclusively via <strong>Independent Reserve Pty Ltd</strong> (ABN 46 164 681 443, AUSTRAC DCE-100461150-001), a licensed and AUSTRAC-registered digital currency exchange that provides third-party custodial infrastructure for digital asset settlement. AMAX issues and redeems customer ledger entitlements upon receipt of, or transfer of, corresponding funds to and from these regulated partner institutions.</p>
              <p>AMAX does not exercise discretionary control over customer funds beyond executing customer-directed transaction instructions. This structure is consistent with a non-bank payment platform operating under an omnibus/partner-held custody model, and does not constitute the acceptance of deposits within the meaning of the <em>Banking Act 1959</em> (Cth).</p>
              <p>AMAX does not operate as an authorised deposit-taking institution (ADI) and does not provide deposit products within the meaning of the <em>Banking Act 1959</em> (Cth). Customer ledger entitlements are not guaranteed by the Financial Claims Scheme (FCS).</p>
              <p>AMAX does not use, lend, invest, or otherwise apply customer funds for any proprietary purpose. Customer funds held by partner institutions are applied solely to execute customer-directed transaction instructions. Customers do not have a direct claim over funds held by regulated third-party institutions but hold a contractual right to access their entitlement through the platform.</p>
            </div>
          </Section>

          <Section id="s2" title="2. Legislative Framework">
            <p>AMAX's AML/CTF Program is designed to comply with the following Australian legislation and regulatory guidance:</p>
            <List items={[
              "Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth)",
              "Anti-Money Laundering and Counter-Terrorism Financing Rules Instrument 2007 (Cth)",
              "Proceeds of Crime Act 2002 (Cth)",
              "Criminal Code Act 1995 (Cth) — Division 400 (money laundering offences)",
              "Autonomous Sanctions Act 2011 (Cth)",
              "Charter of the United Nations Act 1945 (Cth) — UN Security Council sanctions",
              "AUSTRAC Regulatory Guidance — Transaction Monitoring, DCE, Remittance, Travel Rule",
            ]} />
          </Section>

          <Section id="s3" title="3. AUSTRAC Registration &amp; Reporting Obligations">
            <p>As a reporting entity, AMAX is registered with AUSTRAC and fulfils the following mandatory reporting obligations:</p>
            <List items={[
              "Threshold Transaction Reports (TTRs) — cash transactions of AUD 10,000 or more are reported to AUSTRAC within 10 business days",
              "Suspicious Matter Reports (SMRs) — suspicious transactions are reported to AUSTRAC within 3 business days (24 hours for terrorism financing matters)",
              "International Funds Transfer Instructions (IFTIs) — all cross-border electronic funds transfers are reported to AUSTRAC",
              "Annual Compliance Reports — submitted to AUSTRAC confirming program compliance",
            ]} />
          </Section>

          <Section id="s4" title="4. AML/CTF Program — Part A (Organisational)">
            <p>AMAX maintains a comprehensive Part A AML/CTF Program that governs:</p>
            <List items={[
              "Money laundering and terrorism financing (ML/TF) risk assessment — updated at least every 3 years or on material business change",
              "Board and senior management oversight — risk appetite, policies, and governance",
              "Appointment of an AML/CTF Compliance Officer (Compliance Officer: Qin Xiong)",
              "Independent program review — conducted every 3 years by a qualified external reviewer",
              "AML/CTF training program — mandatory for all staff on commencement and annually thereafter",
              "Employee due diligence — background checks for roles with AML/CTF responsibilities",
              "Correspondent banking controls — due diligence on correspondent relationships",
            ]} />
          </Section>

          <Section id="s5" title="5. Know Your Customer (KYC) — Part B Customer Due Diligence">
            <p>AMAX conducts Customer Due Diligence (CDD) on all customers before providing designated services. Our KYC process is risk-based and includes:</p>

            <div>
              <p className="font-medium text-white mb-1">Standard CDD (all customers)</p>
              <List items={[
                "Collection of full legal name, date of birth, and country of nationality",
                "Verification of identity against a government-issued photo ID (passport, driver's licence, national ID)",
                "Proof of current residential address (utility bill, bank statement, or government letter — dated within 3 months)",
                "Source of funds declaration and documentation",
                "Politically Exposed Person (PEP) self-declaration and screening",
                "Sanctions screening against DFAT, UN, OFAC, and other relevant lists",
                "KYC refresh at least annually for medium/high-risk customers; every 3 years for low-risk",
              ]} />
            </div>

            <div>
              <p className="font-medium text-white mb-1">Enhanced Customer Due Diligence (ECDD)</p>
              <p>Enhanced due diligence is applied to customers classified as higher risk, including:</p>
              <List items={[
                "Politically Exposed Persons (PEPs) and their associates",
                "Customers from high-risk jurisdictions (FATF grey/black list countries)",
                "Customers with complex or opaque ownership structures",
                "Customers exhibiting unusual or high-risk transaction behaviour",
                "ECDD includes senior management approval, enhanced source of funds verification, and increased monitoring frequency",
              ]} />
            </div>

            <div>
              <p className="font-medium text-white mb-1">Ongoing CDD</p>
              <List items={[
                "Continuous monitoring of the business relationship and transactions",
                "Re-verification when customer information changes materially",
                "Periodic KYC refresh based on risk classification",
              ]} />
            </div>
          </Section>

          <Section id="s6" title="6. Risk Assessment &amp; Risk-Based Approach">
            <p>AMAX adopts a risk-based approach to AML/CTF compliance. ML/TF risk is assessed across four dimensions:</p>
            <List items={[
              "Customer risk — PEP status, occupation, country of origin, account behaviour",
              "Product and service risk — digital currency exchange carries inherently higher ML/TF risk than fiat FX",
              "Geography risk — domicile, destination countries, and sanctioned jurisdictions",
              "Delivery channel risk — internet-based onboarding and non-face-to-face transactions",
            ]} />
            <p>Risk classifications are Low, Medium, or High. Controls, monitoring intensity, and reporting obligations are scaled accordingly. Risk scores are maintained as confidential internal records and are not disclosed to customers.</p>
          </Section>

          <Section id="s7" title="7. Transaction Monitoring">
            <p>AMAX operates an automated transaction monitoring system that applies rule-based and scenario-based detection to identify suspicious activity, including:</p>
            <List items={[
              "Large transactions — single or aggregated transactions approaching or exceeding AUD 10,000",
              "Structuring — patterns suggesting deliberate transaction splitting to avoid reporting thresholds",
              "Rapid layering — high-frequency FX conversions or unusual transaction velocity",
              "Geographic anomalies — transactions involving high-risk or sanctioned jurisdictions",
              "Crypto typologies — mixing, tumbling, or use of anonymity-enhanced cryptocurrencies",
              "High-risk counterparties — transactions linked to flagged wallets or named individuals",
            ]} />
            <p>Triggered alerts are reviewed by the Compliance Officer within 5 business days. Substantiated suspicions are escalated for SMR filing with AUSTRAC. Tipping off customers about investigations is prohibited under s.123 of the Act.</p>
          </Section>

          <Section id="s8" title="8. Travel Rule Compliance (Virtual Assets)">
            <p>For virtual asset transfers, AMAX complies with FATF Recommendation 16 (the Travel Rule) as implemented in Australia. This requires:</p>
            <List items={[
              "Originator information (name, account number, address) transmitted with all virtual asset transfers above USD 1,000",
              "Beneficiary information (name, account number) transmitted and verified for all qualifying transfers",
              "Due diligence on counterparty Virtual Asset Service Providers (VASPs)",
              "International crypto-asset transfers to unknown or non-compliant counterparties are currently blocked pending full Travel Rule infrastructure deployment",
            ]} />
            <p>AMAX is in the process of onboarding a licensed Travel Rule solution provider to enable compliant international crypto transfers. Until this is fully operational, cross-border crypto withdrawals to external wallets remain restricted.</p>
          </Section>

          <Section id="s9" title="9. Sanctions Screening">
            <p>AMAX screens all customers and counterparties against the following sanctions lists on onboarding and on an ongoing basis:</p>
            <List items={[
              "Australian Government — DFAT Consolidated List (Autonomous Sanctions Act 2011)",
              "United Nations Security Council Consolidated List",
              "OFAC Specially Designated Nationals (SDN) List",
              "UK HM Treasury Financial Sanctions List",
              "EU Consolidated Financial Sanctions List",
            ]} />
            <p>Customer self-declarations are supplementary to formal sanctions screening and do not substitute for AMAX's independent database checks. Accounts with sanctions matches are immediately frozen pending compliance review.</p>
          </Section>

          <Section id="s10" title="10. Record Keeping">
            <p>AMAX retains the following records for a minimum of <strong>7 years</strong> from the date of the transaction or the end of the customer relationship, whichever is later:</p>
            <List items={[
              "Customer identification and verification records",
              "Transaction records — all deposits, withdrawals, exchanges, and transfers",
              "AML/CTF Program documentation, training records, and independent review reports",
              "AUSTRAC reports — TTRs, SMRs, IFTIs, and Annual Compliance Reports",
              "Compliance action log — account freezes, ECDD outcomes, SMR decisions",
              "Audit logs — all user actions, administrative actions, and system events",
            ]} />
          </Section>

          <Section id="s11" title="11. Governance &amp; Oversight">
            <List items={[
              "Board of Directors — approves the AML/CTF Program and sets risk appetite",
              "AML/CTF Compliance Officer (Qin Xiong) — responsible for day-to-day program oversight, AUSTRAC reporting, and staff training",
              "Independent Program Review — conducted by an external qualified reviewer at least every 3 years",
              "Whistleblower Protection — AMAX provides protections for staff reporting AML/CTF concerns in good faith",
              "No tipping off — staff are prohibited from alerting customers that an SMR has been filed or that they are under investigation (s.123 of the Act)",
            ]} />
          </Section>

          <Section id="s12" title="12. Correspondent Banking &amp; Third-Party Reliance">
            <p>Where AMAX relies on a third-party service provider for CDD, it remains responsible for ensuring CDD is conducted to the standard required under the Act. Third-party reliance arrangements are documented and subject to regular review.</p>
            <p>AMAX does not maintain correspondent banking relationships with shell banks. Due diligence is conducted on all financial institution partners.</p>
          </Section>

          <Section id="s13" title="13. Program Review &amp; Continuous Improvement">
            <p>AMAX reviews and updates its AML/CTF Program:</p>
            <List items={[
              "At least every 3 years (independent review)",
              "Following any material change to the business, services, or customer base",
              "Upon regulatory updates from AUSTRAC or changes to the legislative framework",
              "Following any material AML/CTF incident or near-miss",
            ]} />
          </Section>

          <Section id="s14" title="14. Contact">
            <p>For AML/CTF enquiries, compliance matters, or to report a concern, please contact:</p>
            <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p><strong>AMAX Global Pty Ltd</strong></p>
              <p>AML/CTF Compliance Officer: Qin Xiong</p>
              <p>Level 2, 8–12 King Street, Rockdale NSW 2216</p>
              <p>Email: <a href="mailto:info@amaxglobal.com.au" className="text-white underline hover:text-white/70">info@amaxglobal.com.au</a></p>
            </div>
          </Section>

        </div>
      </main>

      <footer className="py-6 mt-16" style={{ borderTop: "1px solid #152e4a" }}>
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} AMAX Global Pty Ltd. ABN 54 690 827 608. AUSTRAC Enrolled Reporting Entity.
          This policy is reviewed periodically in line with regulatory requirements.
        </div>
      </footer>
    </div>
  );
}
