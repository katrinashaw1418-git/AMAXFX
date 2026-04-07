import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallets, usePortfolio } from "@/hooks/use-portfolio";
import { useFxRates } from "@/hooks/use-fx-rates";
import { CurrencyConfig } from "@/lib/types";
import { Link } from "wouter";
import { ArrowRightLeft, TrendingUp, Coins, Landmark, Info } from "lucide-react";

const CRYPTO = ["BTC", "ETH", "USDT", "USDC"];

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

export default function CurrencyBalances() {
  const { data: rawWallets, isLoading: walletsLoading } = useWallets();
  const { data: portfolio } = usePortfolio();
  const { data: fxRates } = useFxRates();

  const wallets: any[] = (rawWallets || []).filter(
    (w: any) => parseFloat(w.balance || "0") > 0
  );

  const fiatWallets = wallets
    .filter((w) => !CRYPTO.includes(w.currency))
    .sort((a, b) => {
      if (a.currency === "AUD") return -1;
      if (b.currency === "AUD") return 1;
      return a.currency.localeCompare(b.currency);
    });

  const cryptoWallets = wallets
    .filter((w) => CRYPTO.includes(w.currency))
    .sort((a, b) => CRYPTO.indexOf(a.currency) - CRYPTO.indexOf(b.currency));

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Portfolio Summary Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Portfolio */}
        <Card className="bg-slate-800 text-white border-slate-700">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-xs uppercase tracking-wide">Portfolio Value</span>
            </div>
            <p className="text-2xl font-bold">
              {totalAud !== null
                ? `A$${totalAud.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "—"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Fiat + digital assets · AUD equivalent
            </p>
            <p className="text-xs text-slate-600 mt-2 italic">
              Digital assets subject to market volatility
            </p>
          </CardContent>
        </Card>

        {/* Fiat Summary */}
        <Card className="border-blue-100 bg-blue-50/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Landmark className="w-4 h-4 text-blue-500" />
              <span className="text-blue-600 text-xs uppercase tracking-wide font-medium">Currency Balances</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {fiatAud !== null
                ? `A$${fiatAud.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "—"}
            </p>
            <p className="text-xs text-blue-500 mt-1">Held in fiat accounts</p>
            <p className="text-xs text-gray-500 mt-1">{fiatWallets.length} {fiatWallets.length === 1 ? "currency" : "currencies"} active</p>
          </CardContent>
        </Card>

        {/* Crypto Summary */}
        <Card className="border-amber-100 bg-amber-50/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600 text-xs uppercase tracking-wide font-medium">Digital Wallet</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {cryptoAud !== null
                ? `A$${cryptoAud.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : "—"}
            </p>
            <p className="text-xs text-amber-500 mt-1">Digital assets held in wallet</p>
            <p className="text-xs text-gray-500 mt-1">{cryptoWallets.length} {cryptoWallets.length === 1 ? "asset" : "assets"} active</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Section 1: Fiat Balances ── */}
      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-500" />
              <div>
                <CardTitle className="text-base">Currency Balances</CardTitle>
                <p className="text-xs text-blue-500 font-normal mt-0.5">Held in fiat accounts · Remittance &amp; FX regulated</p>
              </div>
            </div>
            <Link href="/wallets">
              <Button variant="outline" size="sm" className="text-xs">Manage</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {fiatWallets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No fiat balances held.</p>
          ) : (
            <div className="space-y-2">
              {fiatWallets.map((wallet: any) => {
                const config = CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig];
                const balance = parseFloat(wallet.balance);
                const audVal = fxRates ? toAud(wallet.currency, balance, fxRates) : null;
                return (
                  <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <CurrencyCircle currency={wallet.currency} />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{config?.name || wallet.currency}</p>
                        <p className="text-xs text-gray-500">{wallet.currency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">
                        {config?.symbol}{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      {audVal !== null && wallet.currency !== "AUD" && (
                        <p className="text-xs text-gray-400">
                          ≈ A${audVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Action strip */}
          <div className="flex gap-2 mt-4 pt-3 border-t">
            <Link href="/wallets" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                <ArrowRightLeft className="w-3 h-3" /> Convert (FX)
              </Button>
            </Link>
            <Link href="/wallets" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                Transfer
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Digital Assets ── */}
      <Card className="border-amber-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              <div>
                <CardTitle className="text-base">Digital Wallet</CardTitle>
                <p className="text-xs text-amber-500 font-normal mt-0.5">Digital assets held in wallet · DCE regulated (AUSTRAC)</p>
              </div>
            </div>
            <Link href="/wallets">
              <Button variant="outline" size="sm" className="text-xs">Manage</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {cryptoWallets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No digital assets held.</p>
          ) : (
            <div className="space-y-2">
              {cryptoWallets.map((wallet: any) => {
                const config = CurrencyConfig[wallet.currency as keyof typeof CurrencyConfig];
                const balance = parseFloat(wallet.balance);
                const audVal = fxRates ? toAud(wallet.currency, balance, fxRates) : null;
                return (
                  <div key={wallet.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <CurrencyCircle currency={wallet.currency} />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{config?.name || wallet.currency}</p>
                        <p className="text-xs text-gray-500">{wallet.currency}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">
                        {balance.toFixed(wallet.currency === "BTC" ? 6 : wallet.currency === "ETH" ? 4 : 2)} {wallet.currency}
                      </p>
                      {audVal !== null && (
                        <p className="text-xs text-gray-400">
                          ≈ A${audVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Compliance note */}
          <div className="flex items-start gap-2 mt-4 pt-3 border-t text-xs text-gray-500">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
            <span>
              Digital asset values fluctuate with market conditions and are not guaranteed.
              AMAX holds DCE registration with AUSTRAC (ABN 54 690 827 608).
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
