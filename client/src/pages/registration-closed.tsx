import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";

// Public sign-up is closed while AMAX's AUSTRAC registration applications are under
// assessment. The server refuses new accounts as well (see PUBLIC_REGISTRATION_OPEN
// in server/routes.ts); this page only explains that to visitors.
export default function RegistrationClosed() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#f4f7ff" }}>
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <img src="/amax-global-fx-yacht-logo.png" alt="AMAX Global FX" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-3" style={{ color: "#002366" }}>We're not accepting new customers yet</h1>
        <p className="text-slate-600 mb-3">
          AMAX GLOBAL Pty Ltd has applied to AUSTRAC for registration and is not yet providing remittance or digital currency exchange services.
        </p>
        <p className="text-slate-600 mb-6">
          New accounts can't be opened until registration is granted. You can register your interest and we will contact you if and when AMAX launches.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="mailto:info@amaxglobal.com.au?subject=Register%20interest%20in%20AMAX">
            <Button className="bg-[#002366] hover:bg-[#012a6e] text-white font-semibold">
              <Mail className="w-4 h-4 mr-2" />Register interest
            </Button>
          </a>
          <Link href="/">
            <Button variant="outline" className="text-[#002366] border-[#002366]/30">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
