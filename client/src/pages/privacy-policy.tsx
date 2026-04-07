import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coins, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 leading-relaxed">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5 text-amber-300 text-sm">
            This Privacy Policy is a placeholder document. A full, legally reviewed Privacy Policy will be published prior to the platform's public launch.
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>AMAX ("we", "our", "us") is committed to protecting the privacy and personal information of our customers and users. This Privacy Policy describes how we collect, use, store, and disclose personal information in connection with the AMAX platform, in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p>We may collect the following categories of personal information:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
              <li>Identity information (full name, date of birth, government-issued ID)</li>
              <li>Contact information (email address, phone number, residential address)</li>
              <li>Financial information (bank account details, transaction history)</li>
              <li>KYC/AML verification data (as required by AUSTRAC obligations)</li>
              <li>Device and usage data (IP address, browser type, session logs)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p>We use your personal information to:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 mt-2">
              <li>Verify your identity and comply with KYC/AML obligations</li>
              <li>Process transactions and provide platform services</li>
              <li>Comply with AUSTRAC reporting requirements</li>
              <li>Prevent fraud, money laundering, and terrorist financing</li>
              <li>Communicate service and compliance-related updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Disclosure of Information</h2>
            <p>We may disclose your personal information to regulatory authorities (including AUSTRAC), law enforcement agencies, and third-party service providers engaged in operating the platform — only to the extent required by law or necessary to provide our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Security</h2>
            <p>We implement industry-standard security measures including 256-bit TLS encryption, access controls, two-factor authentication, and audit logging to protect your personal information from unauthorised access, disclosure, or misuse.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Contact</h2>
            <p>For privacy-related enquiries, please contact us at <a href="mailto:privacy@amax.com.au" className="text-amber-400 hover:underline">privacy@amax.com.au</a>.</p>
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
