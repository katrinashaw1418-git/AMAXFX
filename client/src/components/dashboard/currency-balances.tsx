import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallets, usePortfolio } from "@/hooks/use-portfolio";
import { useFxRates } from "@/hooks/use-fx-rates";
import { CurrencyConfig } from "@/lib/types";
import { useLocation } from "wouter";
import { Landmark, Info, Wallet, ArrowRightLeft } from "lucide-react";

function CurrencyCircle({ currency, size = "md" }: { currency: string; size?: "sm" | "md" }) {
  const config = CurrencyConfig[currency as keyof typeof CurrencyConfig];
  const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: config?.color || "#9ca3af" }}
    >
      {config?.flag || currency.slice(0, 2)}
    </div>
  );
}

function toAud(currency: string, amount: number, fxRates: any[]): number | null {
  if (currency === "AUD") return amount;
  const rate = fxRates?.find(
    (r: any) => r.baseCurrency === "AUD" && r.targetCurrency === currency
  );
  if (rate && parseFloat(rate.rate) > 0) return amount / parseFloat(rate.rate);
  return null;
}

export default function CurrencyBalances({ hideSummary = false }: { hideSummary?: boolean }) {
  const [, navigate] = useLocation();
  const { data: rawWallets, isLoading: walletsLoading } = useWallets();
  const { data: portfolio } = usePortfolio();
  const { data: fxRates } = useFxRates();

  const wallets: any[] = (rawWallets || []).filter(
    (w: any) => parseFloat(w.balance || "0") > 0
  );

  const CRYPTO_ORDER = ["BTC", "ETH", "USDT", "USDC"];

  const fiatWallets = wallets
    .filter((w: any) => w.walletType === "fiat")
    .sort((a: any, b: any) => {
      if (a.currency === "AUD") return -1;
      if (b.currency === "AUD") return 1;
      return a.currency.localeCompare(b.currency);
    });

  const cryptoWallets = wallets
    .filter((w: any) => w.walletType === "crypto")
    .sort((a: any, b: any) => {
      const ai = CRYPTO_ORDER.indexOf(a.currency);
      const bi = CRYPTO_ORDER.indexOf(b.currency);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const fiatAud = fxRates
    ? fiatWallets.reduce((sum, w) => {
        const aud = toAud(w.currency, parseFloat(w.balance || "0"), fxRates);
        return aud !== null ? sum + aud : sum;
      }, 0)
    : null;

  const cryptoAud = fxRates
    ? cryptoWallets.reduce((sum, w) => {
        const aud = toAud(w.currency, parseFloat(w.balance || "0"), fxRates);
        return aud !== null ? sum + aud : sum;
      }, 0)
    : null;

  const totalAud =
    fiatAud !== null && cryptoAud !== null ? fiatAud + cryptoAud : null;

  if (walletsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Portfolio Summary (hidden when shown separately in dashboard) ── */}
      {!hideSummary && (
        <Card className="bg-slate-800 text-white border-slate-700">
          <CardContent className="p-5">
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Total Fiat Balance</p>
            <p className="text-3xl font-bold">
              {fiatAud !== null
                ? `A$${fiatAud.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "—"}
            </p>
            <p className="text-xs text-slate-600 mt-2 italic">Fiat balances held with regulated banking partners</p>
          </CardContent>
        </Card>
      )}

      {/* ── Section 1: Currency Balances (Fiat) ── */}
      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle className="text-base">Currency Balances</CardTitle>
              <p className="text-xs text-blue-500 font-normal mt-0.5">
                Fiat accounts · Remittance &amp; FX regulated
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {fiatWallets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No fiat balances held.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {fiatWallets.map((wallet: any) => {
                const config = CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig];
                const balance = parseFloat(wallet.balance);
                const audVal = fxRates ? toAud(wallet.currency, balance, fxRates) : null;
                return (
                  <div key={wallet.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CurrencyCircle currency={wallet.currency} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{wallet.currency}</p>
                        <p className="text-xs text-gray-400">{config?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">
                        {config?.symbol}{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      {audVal !== null && wallet.currency !== "AUD" && (
                        <p className="text-xs text-gray-400">≈ A${audVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Action buttons */}
          <div className="flex gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => navigate('/wallets')}>
              <Wallet className="w-3 h-3" /> Currency Accounts
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50" onClick={() => navigate('/fx-exchange')}>
              <ArrowRightLeft className="w-3 h-3" /> Exchange
            </Button>
          </div>
          <div className="flex gap-2 mt-1">
            <p className="flex-1 text-center text-[10px] text-gray-400">Deposit &amp; withdraw</p>
            <p className="flex-1 text-center text-[10px] text-gray-400">Internal transfer</p>
          </div>
        </CardContent>
      </Card>

      {/* Crypto Exchange note — AMAX is a DCE but does not hold digital assets */}
      <div className="flex items-start gap-2 px-1 text-xs text-gray-500">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
        <span>
          Digital asset exchange (BTC, ETH, USDT, USDC) is available via the Crypto Exchange page.
          AMAX does not hold digital assets — all crypto is settled through Independent Reserve Pty Ltd (AUSTRAC DCE-100461150-001).
        </span>
      </div>
    </div>
  );
}
