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
        <h1 className="text-4xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm mb-10 text-white/60">Last updated: 5 November 2026</p>

        <div className="space-y-8 leading-relaxed text-white/80">
          <div className="rounded-lg p-5 text-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff" }}>
            These are website terms of use for the pre-launch period. AMAX is not providing services to customers. Full customer terms, including fees, risks and complaints handling, will be published before any service is offered.
          </div>

          {[
            { title: "1. About This Website", body: <>This website is operated by AMAX GLOBAL Pty Ltd (ABN 54 690 827 608) ("AMAX"). It provides information about a platform that is under development. By using this website you agree to these terms.</> },
            { title: "2. Platform Status", body: <>AMAX is not yet providing remittance, foreign exchange or digital currency exchange services. AMAX is enrolled with AUSTRAC and has applied for registration on AUSTRAC's Remittance Sector Register and Virtual Asset Service Provider Register. Those applications are under assessment. AMAX will not provide those services unless and until registration is granted and its operating arrangements are in place. New customer registrations are closed.</> },
            { title: "3. No Offer or Advice", body: <>Nothing on this website is an offer to provide a service, financial product advice or a recommendation. Descriptions of intended services may change before launch.</> },
            { title: "4. Intended Service Model", body: <>When launched, each transaction is intended to be funded by the customer for that transaction only and paid out to the customer's verified bank account or wallet (or, for a remittance, to the nominated recipient). AMAX does not intend to hold customer money or digital assets between transactions. Identity verification, sanctions screening and transaction monitoring will apply under AMAX's AML/CTF Program.</> },
            { title: "5. Governing Law", body: <>These terms are governed by the laws of New South Wales, Australia. Any disputes are subject to the exclusive jurisdiction of the courts of New South Wales.</> },
            { title: "6. Contact", body: <>For enquiries about these terms, contact us at <a href="mailto:info@amaxglobal.com.au" className="text-white underline hover:text-white/70">info@amaxglobal.com.au</a>.</> },
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
          © {new Date().getFullYear()} AMAX GLOBAL Pty Ltd. ABN 54 690 827 608. AUSTRAC registration applications under assessment; not yet providing services.
        </div>
      </footer>
    </div>
  );
}
