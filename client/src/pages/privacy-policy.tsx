import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: "#4a6e88" }}>Last updated: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="space-y-8 leading-relaxed" style={{ color: "#a8c5d8" }}>
          <div className="rounded-lg p-5 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
            This Privacy Policy is a placeholder document. A full, legally reviewed Privacy Policy will be published prior to the platform's public launch.
          </div>

          {[
            { title: "1. Introduction", body: <>AMAX ("we", "our", "us") is committed to protecting the privacy and personal information of our customers and users. This Privacy Policy describes how we collect, use, store, and disclose personal information in connection with the AMAX platform, in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).</> },
            { title: "2. Information We Collect", body: <><p>We may collect the following categories of personal information:</p><ul className="list-disc list-inside space-y-1 mt-2" style={{ color: "#6b9ab8" }}><li>Identity information (full name, date of birth, government-issued ID)</li><li>Contact information (email address, phone number, residential address)</li><li>Financial information (bank account details, transaction history)</li><li>KYC/AML verification data (as required by AUSTRAC obligations)</li><li>Device and usage data (IP address, browser type, session logs)</li></ul></> },
            { title: "3. How We Use Your Information", body: <><p>We use your personal information to:</p><ul className="list-disc list-inside space-y-1 mt-2" style={{ color: "#6b9ab8" }}><li>Verify your identity and comply with KYC/AML obligations</li><li>Process transactions and provide platform services</li><li>Comply with AUSTRAC reporting requirements</li><li>Prevent fraud, money laundering, and terrorist financing</li><li>Communicate service and compliance-related updates</li></ul></> },
            { title: "4. Disclosure of Information", body: <>We may disclose your personal information to regulatory authorities (including AUSTRAC), law enforcement agencies, and third-party service providers engaged in operating the platform — only to the extent required by law or necessary to provide our services.</> },
            { title: "5. Data Security", body: <>We implement industry-standard security measures including 256-bit TLS encryption, access controls, two-factor authentication, and audit logging to protect your personal information from unauthorised access, disclosure, or misuse.</> },
            { title: "6. Contact", body: <>For privacy-related enquiries, please contact us at <a href="mailto:privacy@amax.com.au" className="text-amber-400 hover:underline">privacy@amax.com.au</a>.</> },
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
