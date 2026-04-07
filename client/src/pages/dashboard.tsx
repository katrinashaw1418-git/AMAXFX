import CurrencyBalances from "@/components/dashboard/currency-balances";
import TransactionHistory from "@/components/dashboard/transaction-history";
import FxExchangeTool from "@/components/dashboard/fx-exchange-tool";
import { ArrowRightLeft, Wallet, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Your currency balances and recent activity</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/fx-exchange">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-100 hover:border-amber-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">FX Exchange</p>
                <p className="text-xs text-gray-500">Convert currencies</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/wallets">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-100 hover:border-blue-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">eWallet</p>
                <p className="text-xs text-gray-500">Manage balances</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/compliance">
          <Card className="cursor-pointer hover:shadow-md transition-shadow border-emerald-100 hover:border-emerald-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Compliance</p>
                <p className="text-xs text-gray-500">KYC & documents</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currency Balances */}
        <div className="lg:col-span-1">
          <CurrencyBalances />
        </div>

        {/* FX Quick Tool */}
        <div className="lg:col-span-2">
          <FxExchangeTool />
        </div>
      </div>

      {/* Recent Transactions */}
      <TransactionHistory />
    </div>
  );
}
