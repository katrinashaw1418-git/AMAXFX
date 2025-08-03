import { useState, useEffect } from "react";
import WealthOverview from "@/components/dashboard/wealth-overview";
import PortfolioChart from "@/components/dashboard/portfolio-chart";
import FxExchangeTool from "@/components/dashboard/fx-exchange-tool";
import AiAdvisoryPanel from "@/components/dashboard/ai-advisory-panel";
import CurrencyBalances from "@/components/dashboard/currency-balances";
import TransactionHistory from "@/components/dashboard/transaction-history";
import KycModal from "@/components/modals/kyc-modal";

export default function Dashboard() {
  const [kycModalOpen, setKycModalOpen] = useState(false);

  useEffect(() => {
    // Show KYC modal after 5 seconds (demo purposes)
    const timer = setTimeout(() => {
      setKycModalOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Wealth Overview Cards */}
      <WealthOverview />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Portfolio Chart and FX Tool */}
        <div className="lg:col-span-2 space-y-6">
          <PortfolioChart />
          <FxExchangeTool />
        </div>

        {/* Right Column - AI Advisory and Balances */}
        <div className="space-y-6">
          <AiAdvisoryPanel />
          <CurrencyBalances />
        </div>
      </div>

      {/* Transaction History */}
      <TransactionHistory />

      {/* KYC Modal */}
      <KycModal isOpen={kycModalOpen} onClose={() => setKycModalOpen(false)} />
    </div>
  );
}
