import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Category-level fallback rates — only used when a product has no explicit annualReturn set
function getAnnualReturnFallback(category: string, productName?: string): number {
  const rates = {
    'real_estate': 0.11,      // 11% midpoint (10-12% range)
    'corporate_credit': 0.11, // 11% midpoint (10-12% range)
    'venture_capital': 0.18,  // 18% midpoint (16-20% range)
    'digital_assets': (productName && typeof productName === 'string' && productName.includes('Bitcoin')) ? 0.60 : 0.0575,
    'default': 0.11
  };
  return rates[category as keyof typeof rates] || rates.default;
}

// Unified investment performance calculation
// Prefers product.annualReturn + product.returnMethod when set; falls back to category mapping
function calculateInvestmentPerformance(
  product: any,
  investedAmount: number,
  investmentDate: Date,
  currentDate: Date = new Date()
): { currentValue: number; returnAmount: number; returnPercentage: number; valuationStatus?: string } {
  if (!product) {
    return { currentValue: investedAmount, returnAmount: 0, returnPercentage: 0 };
  }

  if (investedAmount <= 0) {
    return { currentValue: 0, returnAmount: 0, returnPercentage: 0 };
  }

  const start = new Date(investmentDate);
  const end = new Date(currentDate);

  if (start > end) {
    return { currentValue: investedAmount, returnAmount: 0, returnPercentage: 0 };
  }

  const daysHeld = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const yearsHeld = daysHeld / 365;

  // Product-level annualReturn takes precedence over category fallback
  const annualReturn = product.annualReturn != null
    ? parseFloat(product.annualReturn)
    : getAnnualReturnFallback(product.category, product.name);

  const returnMethod = product.returnMethod || "fixed_annual_compound";

  let currentValue = investedAmount;
  let valuationStatus: string | undefined;

  switch (returnMethod) {
    case "fixed_annual_compound":
      currentValue = investedAmount * Math.pow(1 + annualReturn, yearsHeld);
      break;
    case "fixed_annual_simple":
      currentValue = investedAmount * (1 + annualReturn * yearsHeld);
      break;
    case "manual_nav":
    case "market_price":
      // No live price source available — use invested amount as placeholder and flag it
      currentValue = investedAmount;
      valuationStatus = "missing_price_source";
      break;
    default:
      currentValue = investedAmount * Math.pow(1 + annualReturn, yearsHeld);
  }

  const returnAmount = currentValue - investedAmount;
  const returnPercentage = (returnAmount / investedAmount) * 100;

  return { currentValue, returnAmount, returnPercentage, valuationStatus };
}

// Shared FX conversion helper — tries direct rate then inverse
async function convertToUsd(currency: string, amount: number): Promise<number> {
  if (currency === "USD") return amount;
  const direct = await storage.getFxRate(currency, "USD");
  if (direct) return amount * parseFloat(direct.rate);
  const inverse = await storage.getFxRate("USD", currency);
  if (inverse) return amount / parseFloat(inverse.rate);
  return 0;
}

// One shared engine for all investment valuation — batch fetches products to avoid N+1 queries
async function calculateInvestmentTotalsAtDate(userId: number, asOfDate: Date = new Date()) {
  const investments = await storage.getUserInvestments(userId);
  const products = await storage.getInvestmentProducts();

  let totalInvested = 0;
  let totalCurrentValue = 0;
  const items: Array<{
    id: number; productId: number; productName: string; category: string;
    annualReturn: string; returnMethod: string;
    investedAmount: number; currentValue: number; returnAmount: number; returnPercentage: number;
  }> = [];

  for (const inv of investments) {
    const product = products.find((p: any) => p.id === inv.productId);
    if (!product) continue;
    const investedAmount = parseFloat(inv.investedAmount);
    const investmentDate = new Date(inv.investmentDate);
    if (investmentDate > asOfDate) continue; // investment didn't exist yet at asOfDate
    const perf = calculateInvestmentPerformance(product, investedAmount, investmentDate, asOfDate);
    totalInvested += investedAmount;
    totalCurrentValue += perf.currentValue;
    items.push({
      id: inv.id,
      productId: product.id,
      productName: product.name,
      category: product.category,
      annualReturn: product.annualReturn ?? getAnnualReturnFallback(product.category, product.name).toString(),
      returnMethod: product.returnMethod ?? "fixed_annual_compound",
      investedAmount,
      currentValue: perf.currentValue,
      returnAmount: perf.returnAmount,
      returnPercentage: perf.returnPercentage,
    });
  }

  return {
    totalInvested,
    totalCurrentValue,
    totalReturn: totalCurrentValue - totalInvested,
    totalReturnPercent: totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0,
    items,
  };
}

// Reconstruct wallet balances at a historical date using reverse transaction replay.
// Formula: balance_at_date = current_balance + debits_after_date - credits_after_date
// This accurately undoes any deposits/withdrawals/investments that occurred after asOfDate.
async function reconstructWalletBalancesAsOf(
  userId: number,
  asOfDate: Date
): Promise<Array<{ currency: string; balance: number; walletType: string }>> {
  const wallets = await storage.getWallets(userId);
  const allTransactions = await storage.getTransactions(userId); // no limit — need complete history

  return wallets.map((wallet: any) => {
    const currency = wallet.currency;
    const currentBalance = parseFloat(wallet.balance);

    // Only consider completed transactions that occurred AFTER the requested date
    const txAfter = allTransactions.filter(
      (t: any) => t.status === "completed" && new Date(t.createdAt) > asOfDate
    );

    // Debits: money LEFT this wallet after asOfDate → add back to get historical balance
    const totalDebits = txAfter
      .filter((t: any) => t.fromCurrency === currency)
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    // Credits: money ENTERED this wallet after asOfDate → subtract to get historical balance
    // For exchange transactions the received amount = amount * exchangeRate; otherwise it's the amount directly
    const totalCredits = txAfter
      .filter((t: any) => t.toCurrency === currency)
      .reduce((sum: number, t: any) => {
        const base = parseFloat(t.amount);
        const rate = t.exchangeRate ? parseFloat(t.exchangeRate) : 1;
        return sum + (t.type === "exchange" ? base * rate : base);
      }, 0);

    const historicalBalance = Math.max(0, currentBalance + totalDebits - totalCredits);
    return { currency, balance: historicalBalance, walletType: wallet.walletType };
  });
}

// Portfolio valuation at any given date — uses date-aware wallet balances for historical accuracy
async function calculatePortfolioTotalsAtDate(userId: number, asOfDate: Date = new Date()) {
  const now = new Date();
  const isToday = Math.abs(asOfDate.getTime() - now.getTime()) < 12 * 60 * 60 * 1000; // within 12 hours

  // Use current wallet state for today; reconstruct from transactions for historical dates
  const walletData = isToday
    ? (await storage.getWallets(userId)).map((w: any) => ({
        currency: w.currency,
        balance: parseFloat(w.balance),
        walletType: w.walletType,
      }))
    : await reconstructWalletBalancesAsOf(userId, asOfDate);

  let fiatValue = 0, cryptoValue = 0, stablecoinValue = 0;
  for (const wallet of walletData) {
    const balance = wallet.balance;
    if (wallet.walletType === "fiat") {
      fiatValue += await convertToUsd(wallet.currency, balance);
    } else if (wallet.currency === "USDT" || wallet.currency === "USDC") {
      stablecoinValue += balance;
    } else {
      const rate = await storage.getFxRate(wallet.currency, "USD");
      if (rate) cryptoValue += balance * parseFloat(rate.rate);
    }
  }
  const investmentTotals = await calculateInvestmentTotalsAtDate(userId, asOfDate);
  const investmentValue = investmentTotals.totalCurrentValue;
  return { fiatValue, cryptoValue, stablecoinValue, investmentValue,
           totalValue: fiatValue + cryptoValue + stablecoinValue + investmentValue };
}

// Save a fresh "actual" snapshot immediately after any portfolio-changing event
async function saveActualSnapshot(userId: number): Promise<void> {
  const totals = await calculatePortfolioTotalsAtDate(userId, new Date());
  await storage.createPortfolioSnapshot({
    userId,
    snapshotDate: new Date(),
    totalValue: totals.totalValue.toFixed(2),
    fiatValue: totals.fiatValue.toFixed(2),
    cryptoValue: totals.cryptoValue.toFixed(2),
    stablecoinValue: totals.stablecoinValue.toFixed(2),
    investmentValue: totals.investmentValue.toFixed(2),
    source: "actual" as SnapshotSource,
  });
}

type SnapshotSource = "actual" | "historical_estimate";

// Create a single snapshot for one day — skips if one already exists for that day
async function createSnapshotForDay(
  userId: number,
  snapshotDate: Date,
  source: SnapshotSource
): Promise<void> {
  const dayStart = new Date(snapshotDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(snapshotDate);
  dayEnd.setHours(23, 59, 59, 999);
  const existingForDay = await storage.getPortfolioSnapshots(userId, dayStart, dayEnd);
  if (existingForDay.length > 0) return; // already have one for this day
  const totals = await calculatePortfolioTotalsAtDate(userId, snapshotDate);
  await storage.createPortfolioSnapshot({
    userId,
    snapshotDate,
    totalValue: totals.totalValue.toFixed(2),
    fiatValue: totals.fiatValue.toFixed(2),
    cryptoValue: totals.cryptoValue.toFixed(2),
    stablecoinValue: totals.stablecoinValue.toFixed(2),
    investmentValue: totals.investmentValue.toFixed(2),
    source,
  });
}

// Gap-aware backfill — fills every missing day in the range, including internal gaps
async function backfillPortfolioHistory(userId: number, startDate: Date, endDate: Date) {
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);
  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(0, 0, 0, 0);

  const existing = await storage.getPortfolioSnapshots(userId, normalizedStart, normalizedEnd);

  // Build a set of dates that already have snapshots (YYYY-MM-DD keys)
  const existingDays = new Set(
    existing.map((s: any) => new Date(s.snapshotDate).toISOString().split("T")[0])
  );

  // Collect every missing date in one pass, then write them sequentially
  const missingDates: Date[] = [];
  const cursor = new Date(normalizedStart);
  while (cursor <= normalizedEnd) {
    const key = cursor.toISOString().split("T")[0];
    if (!existingDays.has(key)) missingDates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const todayKey = normalizedEnd.toISOString().split("T")[0];
  for (const date of missingDates) {
    const isToday = date.toISOString().split("T")[0] === todayKey;
    await createSnapshotForDay(userId, date, isToday ? "actual" : "historical_estimate");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Ensure crypto + GBP FX rates exist (seed missing rows, reset sequence first)
  {
    const { db } = await import('./db');
    const { sql: rawSql } = await import('drizzle-orm');
    // Reset the serial sequence to MAX(id) so inserts don't collide with existing rows
    await db.execute(rawSql`SELECT setval(pg_get_serial_sequence('fx_rates', 'id'), COALESCE((SELECT MAX(id) FROM fx_rates), 0))`);
    const missingRates = [
      { baseCurrency: 'BTC', targetCurrency: 'USD', rate: '95000.00', spread: '0.0050' },
      { baseCurrency: 'ETH', targetCurrency: 'USD', rate: '3500.00',  spread: '0.0050' },
      { baseCurrency: 'GBP', targetCurrency: 'USD', rate: '1.27000',  spread: '0.0050' },
      { baseCurrency: 'USD', targetCurrency: 'GBP', rate: '0.78740',  spread: '0.0050' },
    ];
    for (const { baseCurrency, targetCurrency, rate, spread } of missingRates) {
      const existing = await storage.getFxRate(baseCurrency, targetCurrency);
      if (!existing) {
        await db.execute(rawSql`
          INSERT INTO fx_rates (base_currency, target_currency, rate, spread, updated_at)
          VALUES (${baseCurrency}, ${targetCurrency}, ${rate}, ${spread}, NOW())
        `);
      }
    }
  }

  // Migrate investment_products: add annualReturn + returnMethod columns and set per-product rates
  {
    const { db } = await import('./db');
    const { sql: rawSql } = await import('drizzle-orm');
    await db.execute(rawSql`
      ALTER TABLE investment_products
      ADD COLUMN IF NOT EXISTS annual_return numeric(10,4),
      ADD COLUMN IF NOT EXISTS return_method text NOT NULL DEFAULT 'fixed_annual_compound'
    `);
    // Seed per-product rates — matches the category fallback mapping for existing products
    // Uses DO UPDATE so it's safe to re-run on every restart
    await db.execute(rawSql`
      UPDATE investment_products SET annual_return = 0.1100 WHERE id = 1 AND annual_return IS NULL;
      UPDATE investment_products SET annual_return = 0.6000 WHERE id = 2 AND annual_return IS NULL;
      UPDATE investment_products SET annual_return = 0.1100 WHERE id = 3 AND annual_return IS NULL;
      UPDATE investment_products SET annual_return = 0.0575 WHERE id = 4 AND annual_return IS NULL;
      UPDATE investment_products SET annual_return = 0.0575 WHERE id = 5 AND annual_return IS NULL;
    `);
  }

  // Migrate portfolio_snapshots to add 'source' column if missing, then backfill 90 days of history
  {
    const { db } = await import('./db');
    const { sql: rawSql } = await import('drizzle-orm');
    // Add column if it doesn't exist — idempotent
    await db.execute(rawSql`
      ALTER TABLE portfolio_snapshots
      ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'actual'
    `);
    // Backfill 90 days so charts and period returns always have data to draw from
    // Only runs for days with no snapshot — safe to call repeatedly
    const backfillEnd = new Date();
    backfillEnd.setHours(0, 0, 0, 0);
    const backfillStart = new Date(backfillEnd);
    backfillStart.setDate(backfillStart.getDate() - 90);
    await backfillPortfolioHistory(1, backfillStart, backfillEnd);
  }

  // Get current user (hardcoded for demo)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get user portfolio — all values computed from the single shared valuation engine
  app.get("/api/portfolio", async (req, res) => {
    try {
      const userId = 1;
      const now = new Date();

      // One call to the shared engine — no duplicated FX/investment loops
      const totals = await calculatePortfolioTotalsAtDate(userId, now);
      const { fiatValue, cryptoValue, stablecoinValue, investmentValue, totalValue } = totals;

      // Always upsert today's "actual" snapshot with the current live value.
      // Delete any stale snapshot from earlier today (could be from a previous session
      // when wallet/investment balances were different) then recreate fresh.
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      await storage.deletePortfolioSnapshotsForDay(userId, todayStr);
      await storage.createPortfolioSnapshot({
        userId,
        totalValue: totalValue.toFixed(2),
        fiatValue: fiatValue.toFixed(2),
        cryptoValue: cryptoValue.toFixed(2),
        stablecoinValue: stablecoinValue.toFixed(2),
        investmentValue: investmentValue.toFixed(2),
        snapshotDate: now,
        source: "actual" as SnapshotSource,
      });
      let allSnapshots = await storage.getPortfolioSnapshots(userId);

      // Monthly P&L: compare current value against snapshot closest to 30 days ago
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const priorSnapshot = allSnapshots
        .filter(s => new Date(s.snapshotDate) <= thirtyDaysAgo)
        .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime())[0];

      let monthlyPnl: number | null = null;
      let monthlyPnlPercent: number | null = null;
      let monthlyPnlSource: 'actual' | 'historical_estimate' | 'insufficient_history' = 'insufficient_history';
      let monthlyPnlMethod: 'actual_30_day_comparison' | 'historical_inference' = 'historical_inference';

      if (priorSnapshot) {
        const priorValue = parseFloat(priorSnapshot.totalValue);
        monthlyPnl = totalValue - priorValue;
        monthlyPnlPercent = priorValue > 0 ? (monthlyPnl / priorValue) * 100 : 0;
        monthlyPnlSource = ((priorSnapshot as any).source === 'actual') ? 'actual' : 'historical_estimate';
        monthlyPnlMethod = ((priorSnapshot as any).source === 'actual') ? 'actual_30_day_comparison' : 'historical_inference';
      }

      res.json({
        id: 1,
        userId,
        totalValue: totalValue.toFixed(2),
        cryptoValue: cryptoValue.toFixed(2),
        stablecoinValue: stablecoinValue.toFixed(2),
        fiatValue: fiatValue.toFixed(2),
        investmentValue: investmentValue.toFixed(2),
        monthlyPnl: monthlyPnl !== null ? monthlyPnl.toFixed(2) : null,
        monthlyPnlPercent: monthlyPnlPercent !== null ? monthlyPnlPercent.toFixed(2) : null,
        monthlyPnlSource,
        monthlyPnlMethod,
        updatedAt: now,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get portfolio" });
    }
  });

  // Get portfolio historical performance based on actual transactions
  app.get("/api/portfolio/history", async (req, res) => {
    try {
      const { timeframe = "1M" } = req.query;
      const userId = 1;
      
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case "1M":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "1Y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }
      
      // Current live value — use the shared engine (same as /api/portfolio)
      const { totalValue: currentTotalValue } = await calculatePortfolioTotalsAtDate(userId, endDate);

      // --- Build data points from stored snapshots ---
      const storedSnapshots = await storage.getPortfolioSnapshots(userId, startDate, endDate);
      const todayStr = endDate.toISOString().split('T')[0];

      // Thin stored snapshots to ~22 evenly-spaced points
      let thinned: typeof storedSnapshots = [];
      if (storedSnapshots.length >= 2) {
        const maxPoints = 22;
        const step = Math.max(1, Math.floor(storedSnapshots.length / (maxPoints - 1)));
        for (let i = 0; i < storedSnapshots.length - 1; i += step) {
          thinned.push(storedSnapshots[i]);
        }
        thinned.push(storedSnapshots[storedSnapshots.length - 1]);
      } else {
        thinned = [...storedSnapshots];
      }

      // Map to data points, stripping any today-dated entries (we'll inject the live value instead)
      let dataPoints: Array<{ date: string; value: number; timestamp: number; source: string }> = thinned
        .filter(s => s.snapshotDate.toISOString().split('T')[0] !== todayStr)
        .map(s => ({
          date: s.snapshotDate.toISOString().split('T')[0],
          value: Math.round(parseFloat(s.totalValue)),
          timestamp: s.snapshotDate.getTime(),
          source: (s as any).source ?? 'actual',
        }));

      // Always append the live current value as today's final point.
      // This ensures period return calculations use accurate current data,
      // not a stale snapshot saved during a previous session.
      dataPoints.push({
        date: todayStr,
        value: Math.round(currentTotalValue),
        timestamp: endDate.getTime(),
        source: 'actual',
      });

      // Performance metrics — start from the oldest data point, end at today's live value
      const startValue = dataPoints[0]?.value ?? currentTotalValue;
      const endValue = Math.round(currentTotalValue); // always the live value
      const totalReturn = endValue - startValue;
      const totalReturnPercent = startValue > 0 ? (totalReturn / startValue) * 100 : 0;
      const historySource = dataPoints.some(d => d.source === 'historical_estimate')
        ? 'historical_estimate' : 'actual';

      res.json({
        timeframe,
        data: dataPoints,
        currentValue: currentTotalValue,
        totalReturn: totalReturn.toFixed(2),
        totalReturnPercent: totalReturnPercent.toFixed(2),
        startValue: startValue.toFixed(2),
        endValue: endValue.toFixed(2),
        historySource,
        hasSufficientHistory: dataPoints.length >= 2,
      });
    } catch (error) {
      console.error("Portfolio history error:", error);
      res.status(500).json({ error: "Failed to get portfolio history" });
    }
  });

  // Portfolio performance chart — two lines (historical + projected) from Jan 1, 2026
  app.get("/api/portfolio/performance-chart", async (req, res) => {
    try {
      const { timeframe = "1Y" } = req.query;
      const userId = 1;
      const today = new Date();

      // Anchor = Jan 1 of current year
      const anchor = new Date(today.getFullYear(), 0, 1);
      anchor.setHours(0, 0, 0, 0);

      // Ensure backfilled history exists for the full anchor-to-today range
      await backfillPortfolioHistory(userId, anchor, today);

      // All historical points come from snapshots only — no wallet balance reconstruction
      const snapshots = await storage.getPortfolioSnapshots(userId, anchor, today);
      const sortedSnapshots = [...snapshots].sort(
        (a: any, b: any) =>
          new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
      );

      // Group by month — keep the latest snapshot in each calendar month
      const historyByMonth = new Map<string, { value: number; source: string }>();
      for (const s of sortedSnapshots) {
        const d = new Date(s.snapshotDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        historyByMonth.set(key, {
          value: Math.round(parseFloat(s.totalValue)),
          source: (s as any).source ?? "actual",
        });
      }

      // Opening value = earliest real snapshot (not reconstructed from current wallets)
      const openingValue =
        sortedSnapshots.length > 0
          ? Math.round(parseFloat(sortedSnapshots[0].totalValue))
          : 0;

      // Forecast baseline = latest historical value
      const latestHistoricalValue =
        sortedSnapshots.length > 0
          ? Math.round(parseFloat(sortedSnapshots[sortedSnapshots.length - 1].totalValue))
          : openingValue;

      // Use realized CAGR when history is long enough; fall back to 10% otherwise
      let annualProjectionRate = 0.10;
      let projectionMethod = "fallback_default";
      if (sortedSnapshots.length >= 2) {
        const startVal  = parseFloat(sortedSnapshots[0].totalValue);
        const startDate = new Date(sortedSnapshots[0].snapshotDate);
        const years = (today.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (startVal > 0 && latestHistoricalValue > 0 && years >= 0.1) {
          const cagrRate = Math.pow(latestHistoricalValue / startVal, 1 / years) - 1;
          if (Number.isFinite(cagrRate) && cagrRate >= 0) {
            // Cap at 50% to prevent runaway projections from short noisy windows
            annualProjectionRate = Math.min(cagrRate, 0.50);
            projectionMethod = "realized_cagr";
          }
        }
      }
      const forecastMonths =
        timeframe === "7Y" ? 84 :
        timeframe === "3Y" ? 36 :
        12;

      // --- Build historical monthly rows (anchor → today) ---
      const chartRows: Array<{
        month: string;
        historical: number | null;
        projected: number | null;
      }> = [];

      const cursor = new Date(anchor);
      while (cursor <= today) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        const label = cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const entry = historyByMonth.get(key);
        chartRows.push({
          month: label,
          historical: entry ? entry.value : null,
          projected: null,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      // If no Jan entry exists (snapshot is later in Jan), back-fill anchor row
      const anchorKey = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, '0')}`;
      if (!historyByMonth.has(anchorKey) && chartRows.length > 0) {
        chartRows[0].historical = openingValue;
      }

      // Bridge: give the last historical row a projected value equal to today's portfolio value
      // so the forecast line starts exactly where the historical line ends (no gap).
      if (chartRows.length > 0 && latestHistoricalValue > 0) {
        chartRows[chartRows.length - 1].projected = latestHistoricalValue;
      }

      // --- Append forecast rows (i=1 = one month out, grows from the bridge point) ---
      for (let i = 1; i <= forecastMonths; i++) {
        const forecastDate = new Date(today);
        forecastDate.setMonth(forecastDate.getMonth() + i);
        const label = forecastDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const projected =
          latestHistoricalValue > 0
            ? Math.round(latestHistoricalValue * Math.pow(1 + annualProjectionRate, i / 12))
            : 0;
        chartRows.push({ month: label, historical: null, projected });
      }

      const chartSource = snapshots.some((s: any) => s.source === 'historical_estimate')
        ? 'historical_estimate_plus_forecast'
        : 'historical_plus_forecast';

      res.json({
        timeframe,
        anchorDate: anchor.toISOString().split('T')[0],
        openingValue,
        projectionRate: `${(annualProjectionRate * 100).toFixed(2)}% p.a.`,
        projectionMethod,
        chartSource,
        data: chartRows,
      });
    } catch (e) {
      console.error("Performance chart error:", e);
      res.status(500).json({ error: "Failed to load performance chart" });
    }
  });

  // Investment value — full year from Jan 1 2026, month-by-month, historical + projected
  app.get("/api/investments/history-ytd", async (req, res) => {
    try {
      const userId = 1;
      const ANCHOR = new Date("2026-01-01T00:00:00.000Z");
      const today = new Date();
      const TOTAL_MONTHS = 12; // Jan through Jan (13 points)

      const investments = await storage.getUserInvestments(userId);

      // Compute the opening investment value as of Jan 1, 2026
      let openingInvestmentValue = 0;
      for (const inv of investments) {
        const product = await storage.getInvestmentProduct(inv.productId);
        if (!product) continue;
        const investedAmount = parseFloat(inv.investedAmount);
        const investmentDate = new Date(inv.investmentDate);
        const asOf = investmentDate <= ANCHOR ? ANCHOR : investmentDate;
        const perf = calculateInvestmentPerformance(product, investedAmount, investmentDate, asOf);
        openingInvestmentValue += perf.currentValue;
      }

      // Projected line: use actual investment IRR — compute investment value at each month
      const getProjectedValueAt = async (targetDate: Date): Promise<number> => {
        let total = 0;
        for (const inv of investments) {
          const product = await storage.getInvestmentProduct(inv.productId);
          if (!product) continue;
          const investedAmount = parseFloat(inv.investedAmount);
          const investmentDate = new Date(inv.investmentDate);
          const asOf = targetDate < investmentDate ? investmentDate : targetDate;
          const perf = calculateInvestmentPerformance(product, investedAmount, investmentDate, asOf);
          total += perf.currentValue;
        }
        return Math.round(total);
      };

      // Historical line: real snapshot investment values, bucketed by month
      const snapshots = await storage.getPortfolioSnapshots(userId, ANCHOR, today);
      const historyByMonth = new Map<string, number>();
      for (const s of snapshots) {
        const d = new Date(s.snapshotDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        historyByMonth.set(key, Math.round(parseFloat(s.investmentValue)));
      }

      // Build merged monthly series
      const chartRows: Array<{ month: string; historical: number | null; projected: number }> = [];
      for (let m = 0; m <= TOTAL_MONTHS; m++) {
        const d = new Date(ANCHOR);
        d.setMonth(d.getMonth() + m);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const projected = await getProjectedValueAt(d);

        let historical: number | null = null;
        if (d <= today) {
          if (m === 0) {
            historical = Math.round(openingInvestmentValue);
          } else if (historyByMonth.has(key)) {
            historical = historyByMonth.get(key)!;
          }
        }

        chartRows.push({ month: label, historical, projected });
      }

      const lastHistorical = chartRows.reduce<number | null>(
        (acc, r) => (r.historical !== null ? r.historical : acc), null
      );
      const totalReturnPercent = lastHistorical && openingInvestmentValue > 0
        ? ((lastHistorical - openingInvestmentValue) / openingInvestmentValue * 100).toFixed(2)
        : '0.00';

      res.json({
        anchorDate: '2026-01-01',
        openingValue: Math.round(openingInvestmentValue),
        projectionRate: 'actual IRR',
        data: chartRows,
        totalReturnPercent,
      });
    } catch (e) {
      console.error("Investment YTD history error:", e);
      res.status(500).json({ error: "Failed to load investment history" });
    }
  });

  // Get portfolio asset allocation — delegates entirely to the shared valuation engine
  app.get("/api/portfolio/allocation", async (req, res) => {
    try {
      const userId = 1;
      const totals = await calculatePortfolioTotalsAtDate(userId, new Date());
      const { fiatValue, cryptoValue, stablecoinValue, investmentValue, totalValue } = totals;

      res.json({
        fiat:       { value: fiatValue,        percentage: totalValue > 0 ? (fiatValue        / totalValue) * 100 : 0 },
        crypto:     { value: cryptoValue,       percentage: totalValue > 0 ? (cryptoValue      / totalValue) * 100 : 0 },
        stablecoin: { value: stablecoinValue,   percentage: totalValue > 0 ? (stablecoinValue  / totalValue) * 100 : 0 },
        investment: { value: investmentValue,   percentage: totalValue > 0 ? (investmentValue  / totalValue) * 100 : 0 },
        totalValue,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get portfolio allocation" });
    }
  });

  // Real metrics for AI advisory — diversification score, expected return, rebalancing gap, period returns
  app.get("/api/portfolio/real-metrics", async (req, res) => {
    try {
      const userId = 1;

      // Reuse the shared valuation engine for allocation fractions
      const totals = await calculatePortfolioTotalsAtDate(userId, new Date());
      const { fiatValue, cryptoValue, stablecoinValue, investmentValue, totalValue } = totals;

      const alloc = {
        fiat:       totalValue > 0 ? fiatValue       / totalValue : 0,
        crypto:     totalValue > 0 ? cryptoValue     / totalValue : 0,
        stablecoin: totalValue > 0 ? stablecoinValue / totalValue : 0,
        investment: totalValue > 0 ? investmentValue / totalValue : 0,
      };

      // Diversification score — Herfindahl-Hirschman Index (HHI) based.
      // HHI = sum(wi²): 0.25 when all four classes are equally weighted, 1.0 when fully concentrated.
      // Score = (1 − (HHI − 0.25) / 0.75) × 100, clamped [0, 100].
      const hhi = alloc.fiat ** 2 + alloc.crypto ** 2 + alloc.stablecoin ** 2 + alloc.investment ** 2;
      const diversificationScore = Math.max(0, Math.min(100, (1 - (hhi - 0.25) / 0.75) * 100));

      // Expected portfolio return — weighted average of asset-class estimates.
      // Fiat:       2.0 % p.a. (savings / money-market proxy)
      // Crypto:    20.0 % p.a. (blended market-consensus estimate for directly-held BTC/ETH)
      // Stablecoin: 5.0 % p.a. (DeFi yield proxy)
      // Investment: product-level annualReturn rates from the DB (per-product compound rates)
      const investments = await storage.getUserInvestments(userId);
      let weightedInvReturn = 0;
      let totalInvested = 0;
      for (const inv of investments) {
        const product = await storage.getInvestmentProduct(inv.productId);
        if (product?.annualReturn) {
          const amount = parseFloat(inv.investedAmount);
          weightedInvReturn += parseFloat(product.annualReturn.toString()) * amount;
          totalInvested += amount;
        }
      }
      const investExpectedReturn = totalInvested > 0 ? weightedInvReturn / totalInvested : 0.10;

      // IMPORTANT: Use ONE return framework — arithmetic returns throughout.
      const expectedPortfolioReturn = (
        alloc.fiat       * 0.02 +
        alloc.crypto     * 0.20 +
        alloc.stablecoin * 0.05 +
        alloc.investment * investExpectedReturn
      ) * 100;

      // Rebalancing gap — one-sided turnover from equal-weight benchmark [0, 50%]
      const rebalancingGap = 0.5 * (
        Math.abs(alloc.fiat       - 0.25) +
        Math.abs(alloc.crypto     - 0.25) +
        Math.abs(alloc.stablecoin - 0.25) +
        Math.abs(alloc.investment - 0.25)
      ) * 100;

      // Snapshot history for period returns
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      yearStart.setHours(0, 0, 0, 0);
      const snapshots = await storage.getPortfolioSnapshots(userId, yearStart, now);
      const sorted = [...snapshots].sort(
        (a: any, b: any) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
      );
      const historySource = sorted.some((s: any) => s.source === 'historical_estimate')
        ? 'historical_estimate' : 'actual';

      const latestValue = sorted.length > 0
        ? parseFloat(sorted[sorted.length - 1].totalValue)
        : totalValue;

      const computePeriodReturn = (lookbackMonths: number): number | null => {
        const cutoff = new Date(now);
        cutoff.setMonth(cutoff.getMonth() - lookbackMonths);
        const prior = sorted.filter((s: any) => new Date(s.snapshotDate) <= cutoff);
        if (!prior.length) return null;
        const base = parseFloat(prior[prior.length - 1].totalValue);
        return base > 0 ? (latestValue - base) / base * 100 : null;
      };

      // Patch 1 — configurable risk-free rate (annualised).  Default: 4 % p.a.
      const riskFreeAnnual = parseFloat(process.env.RISK_FREE_RATE || "0.04");

      // YTD simple return (arithmetic, consistent framework — Patch 4)
      const ytdRaw = sorted.length >= 2
        ? (latestValue - parseFloat(sorted[0].totalValue)) / parseFloat(sorted[0].totalValue) * 100
        : null;

      // Patch 2 — CAGR with stability guard.
      // For very short periods (< 0.1 years ≈ 5 weeks) annualisation is unstable;
      // fall back to the simple cumulative return instead.
      let cagr: number | null = null;
      if (sorted.length >= 2) {
        const startVal  = parseFloat(sorted[0].totalValue);
        const startDate = new Date(sorted[0].snapshotDate);
        const years = (now.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (startVal > 0 && latestValue > 0) {
          cagr = years < 0.1
            ? +((latestValue / startVal - 1) * 100).toFixed(2)           // simple return
            : +(( Math.pow(latestValue / startVal, 1 / years) - 1) * 100).toFixed(2); // CAGR
        }
      }

      // ── Risk metric computation (arithmetic returns, consistent framework) ──────
      // Compute daily arithmetic returns from the portfolio value time series.
      // All snapshots (estimated or actual) contribute; per-metric guards below
      // decide whether each statistic is meaningful enough to surface.
      const dailyReturns: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const v0 = parseFloat(sorted[i - 1].totalValue);
        const v1 = parseFloat(sorted[i].totalValue);
        if (v0 > 0) dailyReturns.push((v1 - v0) / v0);
      }

      const _mean = (arr: number[]): number =>
        arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
      const _stddev = (arr: number[], mu: number): number => {
        if (arr.length < 2) return 0;
        return Math.sqrt(arr.reduce((s, v) => s + (v - mu) ** 2, 0) / (arr.length - 1));
      };

      const returnMean = _mean(dailyReturns);
      const returnStd  = _stddev(dailyReturns, returnMean);
      const riskFreeDaily = riskFreeAnnual / 365;

      // Sharpe — requires enough returns AND non-trivial volatility
      // (returnStd ≤ 0.0001 daily ≈ smooth backfill → guard fires → null)
      const canShowSharpe =
        dailyReturns.length >= 20 &&
        Number.isFinite(returnStd)  &&
        Number.isFinite(returnMean) &&
        returnStd > 0.0001;
      const sharpe: number | null = canShowSharpe
        ? +(((returnMean - riskFreeDaily) / returnStd) * Math.sqrt(365)).toFixed(2)
        : null;

      // Volatility — same threshold as Sharpe; near-zero stddev (smooth backfill) → null
      const canShowVolatility =
        dailyReturns.length >= 20 &&
        Number.isFinite(returnStd) &&
        returnStd > 0.0001;
      const annualizedVolatility: number | null = canShowVolatility
        ? +(returnStd * Math.sqrt(365) * 100).toFixed(2)
        : null;

      // Max drawdown — only meaningful when a real peak→trough event exists
      let hasDrawdownEvent = false;
      {
        let peak = sorted.length > 0 ? parseFloat(sorted[0].totalValue) : 0;
        for (const s of sorted) {
          const v = parseFloat(s.totalValue);
          if (v < peak) { hasDrawdownEvent = true; break; }
          if (v > peak) peak = v;
        }
      }
      const canShowDrawdown = sorted.length >= 20 && hasDrawdownEvent;
      let maxDrawdown: number | null = null;
      if (canShowDrawdown) {
        let peak = parseFloat(sorted[0].totalValue);
        let maxDD = 0;
        for (const s of sorted) {
          const v = parseFloat(s.totalValue);
          if (v > peak) peak = v;
          const dd = peak > 0 ? (peak - v) / peak : 0;
          if (dd > maxDD) maxDD = dd;
        }
        maxDrawdown = +(maxDD * 100).toFixed(2);
      }

      // 3-tier state — drives UI messaging
      const hasMeaningfulHistory = sorted.length >= 30 && dailyReturns.length >= 20;
      const canComputeRiskMetrics = hasMeaningfulHistory;
      let riskMetricsState: "limited" | "estimated" | "historical";
      if (!hasMeaningfulHistory) {
        riskMetricsState = "limited";
      } else if (historySource === "historical_estimate") {
        riskMetricsState = "estimated";
      } else {
        riskMetricsState = "historical";
      }

      // Keep legacy fields for backward compatibility
      const hasSufficientHistory = sorted.length >= 30;
      const actualSnapshotCount  = sorted.filter((s: any) => s.source === "actual").length;

      res.json({
        diversificationScore: +diversificationScore.toFixed(1),
        expectedPortfolioReturn: +expectedPortfolioReturn.toFixed(2),
        rebalancingGap: +rebalancingGap.toFixed(1),
        historySource,
        hasSufficientHistory,
        hasMeaningfulHistory,
        snapshotCount: sorted.length,
        actualSnapshotCount,
        canComputeRiskMetrics,
        riskMetricsState,
        sharpe,
        annualizedVolatility,
        maxDrawdown,
        cagr,
        riskFreeRate: +(riskFreeAnnual * 100).toFixed(2),
        periodReturns: {
          ytd:        ytdRaw !== null ? +ytdRaw.toFixed(2) : null,
          oneMonth:   computePeriodReturn(1) !== null ? +computePeriodReturn(1)!.toFixed(2) : null,
          threeMonth: computePeriodReturn(3) !== null ? +computePeriodReturn(3)!.toFixed(2) : null,
        },
        allocation: {
          fiat:       +(alloc.fiat       * 100).toFixed(1),
          crypto:     +(alloc.crypto     * 100).toFixed(1),
          stablecoin: +(alloc.stablecoin * 100).toFixed(1),
          investment: +(alloc.investment * 100).toFixed(1),
        },
      });
    } catch (error) {
      console.error("Real metrics error:", error);
      res.status(500).json({ error: "Failed to compute real metrics" });
    }
  });

  // Get user wallets
  app.get("/api/wallets", async (req, res) => {
    try {
      const wallets = await storage.getWallets(1);
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallets" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(1, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Get FX rates
  app.get("/api/fx-rates", async (req, res) => {
    try {
      const rates = await storage.getFxRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: "Failed to get FX rates" });
    }
  });

  // Get specific FX rate
  app.get("/api/fx-rates/:base/:target", async (req, res) => {
    try {
      const { base, target } = req.params;
      const rate = await storage.getFxRate(base, target);
      if (!rate) {
        return res.status(404).json({ error: "FX rate not found" });
      }
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to get FX rate" });
    }
  });

  // Get AI recommendations
  app.get("/api/ai-recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getAiRecommendations(1);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get AI recommendations" });
    }
  });

  // Generate personalized AI recommendations based on risk profile
  app.post("/api/ai-recommendations/generate", async (req, res) => {
    try {
      const { riskTolerance, investmentHorizon, investmentGoal } = req.body;
      const userId = 1;
      
      // Get current portfolio allocation data
      const wallets = await storage.getWallets(userId);
      const investments = await storage.getUserInvestments(userId);
      
      // Calculate allocation categories
      let fiatValue = 0;
      let cryptoValue = 0;
      let stablecoinValue = 0;
      let investmentValue = 0;
      
      // Calculate fiat value in USD equivalent (FX-converted, same logic as /api/portfolio)
      for (const wallet of wallets.filter(w => w.walletType === 'fiat')) {
        const balance = parseFloat(wallet.balance);
        if (wallet.currency === 'USD') {
          fiatValue += balance;
        } else {
          const directRate = await storage.getFxRate(wallet.currency, 'USD');
          if (directRate) {
            fiatValue += balance * parseFloat(directRate.rate);
          } else {
            const inverseRate = await storage.getFxRate('USD', wallet.currency);
            if (inverseRate) {
              fiatValue += balance / parseFloat(inverseRate.rate);
            }
          }
        }
      }
      
      // Calculate crypto and stablecoin values
      for (const wallet of wallets.filter(w => w.walletType === 'crypto')) {
        const balance = parseFloat(wallet.balance);
        if (wallet.currency === "USDT" || wallet.currency === "USDC") {
          stablecoinValue += balance;
        } else {
          const rate = await storage.getFxRate(wallet.currency, "USD");
          if (rate) {
            cryptoValue += (balance * parseFloat(rate.rate));
          }
        }
      }
      
      // Calculate investment value with correct argument order
      const evaluationDate = new Date();
      for (const investment of investments) {
        const product = await storage.getInvestmentProduct(investment.productId);
        if (product) {
          const investedAmount = parseFloat(investment.investedAmount);
          const investmentDate = new Date(investment.investmentDate);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, evaluationDate);
          investmentValue += performance.currentValue;
        }
      }
      
      const totalValue = fiatValue + cryptoValue + stablecoinValue + investmentValue;
      
      const currentAllocation = {
        crypto: totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0,
        fiat: totalValue > 0 ? (fiatValue / totalValue) * 100 : 0,
        stablecoin: totalValue > 0 ? (stablecoinValue / totalValue) * 100 : 0,
        investment: totalValue > 0 ? (investmentValue / totalValue) * 100 : 0,
        totalValue,
      };

      // Patch 6: Rebalancing gap — sum of absolute deviations from an equal-weight benchmark,
      // scaled by 0.5 so the result is a "one-sided" turnover measure (0 = perfectly balanced).
      // currentAllocation values are percentages [0–100]; convert to fractions [0–1] first.
      const allocationFractions = {
        fiat:       currentAllocation.fiat       / 100,
        crypto:     currentAllocation.crypto     / 100,
        stablecoin: currentAllocation.stablecoin / 100,
        investment: currentAllocation.investment / 100,
      };
      const rebalancingGap = 0.5 * (
        Math.abs(allocationFractions.fiat       - 0.25) +
        Math.abs(allocationFractions.crypto     - 0.25) +
        Math.abs(allocationFractions.stablecoin - 0.25) +
        Math.abs(allocationFractions.investment - 0.25)
      );

      // Generate recommendations based on risk profile
      const recommendations: Array<{ userId: number; type: string; title: string; description: string; severity: string; isRead: boolean }> = [];
      
      // Risk-based portfolio recommendations
      if (riskTolerance <= 2) { // Conservative
        if (currentAllocation.crypto > 10) {
          recommendations.push({
            userId,
            type: "rebalancing",
            title: "Reduce Crypto Exposure",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is high for a conservative profile. Consider reducing to 5-10% and increasing fixed income investments.`,
            severity: "warning",
            isRead: false,
          });
        }
        
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Increase Bond Allocation",
          description: "Consider allocating 60-70% to government bonds and high-grade corporate bonds for stable income generation.",
          severity: "info",
          isRead: false,
        });
      } else if (riskTolerance <= 4) { // Moderate
        if (currentAllocation.crypto > 20) {
          recommendations.push({
            userId,
            type: "rebalancing",
            title: "Moderate Crypto Rebalancing",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) exceeds moderate risk guidelines. Consider reducing to 15-20% for better risk management.`,
            severity: "info",
            isRead: false,
          });
        }
        
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Diversify with International Equities",
          description: "Consider adding 20-25% international equity exposure to reduce correlation with domestic markets.",
          severity: "info",
          isRead: false,
        });
      } else { // Aggressive
        if (currentAllocation.crypto < 15) {
          recommendations.push({
            userId,
            type: "opportunity",
            title: "Increase Growth Exposure",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is conservative. Consider increasing to 25-30% for higher growth potential.`,
            severity: "info",
            isRead: false,
          });
        }
        
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Consider Growth Equity Investments",
          description: "Your aggressive profile allows for higher allocation to growth stocks and venture capital opportunities.",
          severity: "info",
          isRead: false,
        });
      }
      
      // Investment goal-based recommendations
      if (investmentGoal === "preservation") {
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Capital Preservation Strategy",
          description: "Focus on high-grade bonds, treasury securities, and stable value funds to preserve capital while earning modest returns.",
          severity: "info",
          isRead: false,
        });
        
        if (currentAllocation.crypto > 5) {
          recommendations.push({
            userId,
            type: "risk_warning",
            title: "High Crypto Risk for Preservation Goal",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is too high for capital preservation. Consider reducing to under 5%.`,
            severity: "warning",
            isRead: false,
          });
        }
      } else if (investmentGoal === "income") {
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Income Generation Focus",
          description: "Prioritize dividend-paying stocks, REITs, corporate bonds, and high-yield savings to generate steady income.",
          severity: "info",
          isRead: false,
        });
        
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Consider Dividend Aristocrats",
          description: "S&P 500 Dividend Aristocrats have increased dividends for 25+ consecutive years, providing reliable income.",
          severity: "info",
          isRead: false,
        });
      } else if (investmentGoal === "growth") {
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Growth Investment Strategy",
          description: "Focus on technology, healthcare, and emerging markets for long-term capital appreciation potential.",
          severity: "info",
          isRead: false,
        });
      } else if (investmentGoal === "aggressive") {
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Aggressive Growth Opportunities",
          description: "Consider small-cap growth stocks, venture capital, and higher crypto allocations for maximum growth potential.",
          severity: "info",
          isRead: false,
        });
        
        if (currentAllocation.crypto < 20) {
          recommendations.push({
            userId,
            type: "opportunity",
            title: "Increase Crypto Allocation",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is low for aggressive growth. Consider increasing to 20-30%.`,
            severity: "info",
            isRead: false,
          });
        }
      }
      
      // Time horizon recommendations
      if (investmentHorizon === "1-3") {
        recommendations.push({
          userId,
          type: "risk_warning",
          title: "Short-Term Horizon Adjustment",
          description: "With a 1-3 year horizon, prioritize liquidity and stability. Increase cash (15-20%) and high-grade bonds (50-60%).",
          severity: "warning",
          isRead: false,
        });
        
        if (currentAllocation.crypto > 10) {
          recommendations.push({
            userId,
            type: "risk_warning",
            title: "Crypto Risk for Short Timeline",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is high for short-term goals. Consider reducing to 5-10%.`,
            severity: "warning",
            isRead: false,
          });
        }
      } else if (investmentHorizon === "3-5") {
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Medium-Term Balance",
          description: "Your 3-5 year horizon allows for moderate growth investments while maintaining some stability through bonds and cash.",
          severity: "info",
          isRead: false,
        });
      } else if (investmentHorizon === "5-10") {
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Long-Term Growth Focus",
          description: "Your 5-10 year horizon supports higher equity allocation and moderate alternative investments for compound growth.",
          severity: "info",
          isRead: false,
        });
      } else if (investmentHorizon === "10+") {
        recommendations.push({
          userId,
          type: "opportunity",
          title: "Maximum Growth Potential",
          description: "Your 10+ year horizon allows for aggressive growth strategies including higher equity and alternative asset allocations.",
          severity: "info",
          isRead: false,
        });
        
        if (currentAllocation.crypto < 15) {
          recommendations.push({
            userId,
            type: "opportunity",
            title: "Long-Term Crypto Opportunity",
            description: `Your long timeline allows for higher crypto exposure (${currentAllocation.crypto.toFixed(1)}% current). Consider 15-25% for growth.`,
            severity: "info",
            isRead: false,
          });
        }
      }
      
      // Clear existing recommendations and set new ones
      await storage.clearAiRecommendations(userId);
      for (const recommendation of recommendations) {
        await storage.createAiRecommendation(recommendation);
      }
      
      res.json({ 
        success: true, 
        recommendations,
        rebalancingGap: +(rebalancingGap * 100).toFixed(1),
        message: "AI recommendations generated successfully"
      });
    } catch (error) {
      console.error("AI recommendations error:", error);
      res.status(500).json({ error: "Failed to generate AI recommendations" });
    }
  });

  // Create FX exchange transaction
  app.post("/api/fx-exchange", async (req, res) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      const userId = 1;
      
      if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const rate = await storage.getFxRate(fromCurrency, toCurrency);
      if (!rate) {
        return res.status(400).json({ error: "Exchange rate not available" });
      }

      // Get source wallet
      const fromWallet = await storage.getWallet(userId, fromCurrency);
      if (!fromWallet) {
        return res.status(404).json({ error: "Source wallet not found" });
      }

      // Get or create target wallet
      let toWallet = await storage.getWallet(userId, toCurrency);
      if (!toWallet) {
        console.log(`Creating new wallet for ${toCurrency}`);
        toWallet = await storage.createWallet({
          userId,
          currency: toCurrency,
          balance: "0.00",
          availableBalance: "0.00",
          walletType: toCurrency === 'BTC' || toCurrency === 'ETH' ? 'crypto' : 'fiat'
        });
      }

      const exchangeRate = parseFloat(rate.rate);
      const convertedAmount = parseFloat(amount) * exchangeRate;
      const fee = convertedAmount * 0.005; // 0.5% fee on converted amount
      const netConvertedAmount = convertedAmount - fee;
      const totalDeduction = parseFloat(amount); // Only deduct the original amount from source

      // Check if sufficient balance in source wallet
      if (parseFloat(fromWallet.availableBalance) < totalDeduction) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Update source wallet (deduct amount + fee)
      const newFromBalance = (parseFloat(fromWallet.balance) - totalDeduction).toFixed(2);
      const newFromAvailableBalance = (parseFloat(fromWallet.availableBalance) - totalDeduction).toFixed(2);
      
      await storage.updateWallet(fromWallet.id, {
        balance: newFromBalance,
        availableBalance: newFromAvailableBalance,
      });

      // Update target wallet (add net converted amount after fee)
      const newToBalance = (parseFloat(toWallet.balance) + netConvertedAmount).toFixed(2);
      const newToAvailableBalance = (parseFloat(toWallet.availableBalance) + netConvertedAmount).toFixed(2);
      
      await storage.updateWallet(toWallet.id, {
        balance: newToBalance,
        availableBalance: newToAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "exchange",
        fromCurrency,
        toCurrency,
        amount: amount.toString(),
        fee: fee.toFixed(2),
        exchangeRate: exchangeRate.toString(),
        status: "completed",
        description: `${fromCurrency} to ${toCurrency} Exchange`,
      });

      res.json({
        transaction,
        convertedAmount: netConvertedAmount,
        exchangeRate,
        fee,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process FX exchange" });
    }
  });

  // Create deposit transaction (legacy route)
  app.post("/api/deposit", async (req, res) => {
    try {
      const { currency, amount, description } = req.body;
      const userId = 1;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current wallet
      const wallet = await storage.getWallet(userId, currency);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      // Update wallet balance
      const depositAmount = parseFloat(amount);
      const newBalance = (parseFloat(wallet.balance) + depositAmount).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) + depositAmount).toFixed(2);
      
      await storage.updateWallet(wallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        fromCurrency: null,
        toCurrency: currency,
        amount: amount.toString(),
        fee: "0.00",
        exchangeRate: null,
        status: "completed",
        description: description || `${currency} Deposit`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  // Create deposit transaction (new wallet route)
  app.post("/api/wallets/deposit", async (req, res) => {
    try {
      const { currency, amount, type } = req.body;
      const userId = 1;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current wallet
      const wallet = await storage.getWallet(userId, currency);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      // Update wallet balance
      const depositAmount = parseFloat(amount);
      const newBalance = (parseFloat(wallet.balance) + depositAmount).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) + depositAmount).toFixed(2);
      
      await storage.updateWallet(wallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        fromCurrency: null,
        toCurrency: currency,
        amount: amount.toString(),
        fee: "0.00",
        exchangeRate: null,
        status: "completed",
        description: `${currency} Deposit`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  // Create withdrawal transaction (legacy route)
  app.post("/api/withdraw", async (req, res) => {
    try {
      const { currency, amount, description } = req.body;
      const userId = 1;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current wallet
      const wallet = await storage.getWallet(userId, currency);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      const withdrawAmount = parseFloat(amount);
      const fee = 25.00;
      const totalDeduction = withdrawAmount + fee;
      
      // Check if sufficient balance
      if (parseFloat(wallet.availableBalance) < totalDeduction) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Update wallet balance
      const newBalance = (parseFloat(wallet.balance) - totalDeduction).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) - totalDeduction).toFixed(2);
      
      await storage.updateWallet(wallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "withdrawal",
        fromCurrency: currency,
        toCurrency: null,
        amount: amount.toString(),
        fee: fee.toFixed(2),
        exchangeRate: null,
        status: "completed",
        description: description || `${currency} Withdrawal`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // Create withdrawal transaction (new wallet route)
  app.post("/api/wallets/withdraw", async (req, res) => {
    try {
      const { currency, amount, type } = req.body;
      const userId = 1;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current wallet
      const wallet = await storage.getWallet(userId, currency);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      const withdrawAmount = parseFloat(amount);
      const fee = 25.00;
      const totalDeduction = withdrawAmount + fee;
      
      // Check if sufficient balance
      if (parseFloat(wallet.availableBalance) < totalDeduction) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Update wallet balance
      const newBalance = (parseFloat(wallet.balance) - totalDeduction).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) - totalDeduction).toFixed(2);
      
      await storage.updateWallet(wallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "withdraw",
        fromCurrency: currency,
        toCurrency: null,
        amount: amount.toString(),
        fee: fee.toFixed(2),
        exchangeRate: null,
        status: "completed",
        description: `${currency} Withdrawal`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // Mark AI recommendation as read
  app.patch("/api/ai-recommendations/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markRecommendationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark recommendation as read" });
    }
  });

  // Apply AI recommendation
  app.post("/api/ai-recommendations/:id/apply", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // For demo purposes, we'll just mark it as read and return success
      await storage.markRecommendationAsRead(id);
      res.json({ 
        success: true, 
        message: "Recommendation applied successfully",
        appliedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to apply recommendation" });
    }
  });

  // Get investment products
  app.get("/api/investment-products", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        riskProfile: req.query.riskProfile as string,
        liquidity: req.query.liquidity as string,
      };
      
      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (!filters[key as keyof typeof filters]) {
          delete filters[key as keyof typeof filters];
        }
      });
      
      const products = await storage.getInvestmentProducts(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to get investment products" });
    }
  });

  // Get specific investment product
  app.get("/api/investment-products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getInvestmentProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Investment product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to get investment product" });
    }
  });



  // Get user investments with real-time performance calculation
  app.get("/api/user-investments", async (req, res) => {
    try {
      const userId = 1; // Hardcoded user ID for demo
      const investments = await storage.getUserInvestments(userId);
      const allProducts = await storage.getInvestmentProducts();
      const currentDate = new Date();
      
      // Calculate current values with performance using unified midpoint IRR function
      const investmentsWithPerformance = investments.map(investment => {
        const product = allProducts.find(p => p.id === investment.productId);
        if (!product) return investment;
        
        const investmentDate = new Date(investment.investmentDate);
        const investedAmount = parseFloat(investment.investedAmount);
        const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate);
        
        return {
          ...investment,
          currentValue: performance.currentValue.toFixed(2),
          totalReturn: performance.returnAmount.toFixed(2),
          returnPercent: performance.returnPercentage.toFixed(2)
        };
      });
      
      res.json(investmentsWithPerformance);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user investments" });
    }
  });

  // Get investment performance by period with predictions
  app.get("/api/investment-performance", async (req, res) => {
    try {
      const { timeframe = "1Y" } = req.query;
      const userId = 1;
      
      // Get all user investments
      const investments = await storage.getUserInvestments(userId);
      const allProducts = await storage.getInvestmentProducts();
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case "1M":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "1Y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setFullYear(startDate.getFullYear() - 1);
      }
      
      // Generate data points at 3-month intervals for the timeframe
      const dataPoints = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        let totalInvestmentValue = 0;
        let weightedReturn = 0;
        let totalInvestedAmount = 0;
        
        // Calculate investment values and returns for this date
        for (const investment of investments) {
          const product = allProducts.find(p => p.id === investment.productId);
          if (product) {
            const investmentDate = new Date(investment.investmentDate);
            if (investmentDate <= currentDate) {
              const investedAmount = parseFloat(investment.investedAmount);
              const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate);
              
              totalInvestmentValue += performance.currentValue;
              totalInvestedAmount += investedAmount;
              
              // Weight the return by the investment amount
              weightedReturn += (performance.returnPercentage * investedAmount);
            }
          }
        }
        
        // Calculate weighted average return
        const avgReturn = totalInvestedAmount > 0 ? weightedReturn / totalInvestedAmount : 0;
        
        dataPoints.push({
          date: currentDate.toISOString().split('T')[0],
          value: Math.round(totalInvestmentValue),
          investedAmount: Math.round(totalInvestedAmount),
          weightedReturn: Number(avgReturn.toFixed(2)),
          timestamp: currentDate.getTime()
        });
        
        // Move to next 3-month interval
        currentDate.setMonth(currentDate.getMonth() + 3);
      }
      
      // Calculate 12-month prediction based on current allocation
      const currentPortfolioAllocation: Record<string, { value: number; annualReturn: number }> = {};
      let totalCurrentInvestment = 0;
      
      for (const investment of investments) {
        const product = allProducts.find(p => p.id === investment.productId);
        if (product) {
          const investedAmount = parseFloat(investment.investedAmount);
          const investmentDate = new Date(investment.investmentDate);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, endDate);
          const currentValue = performance.currentValue;
          totalCurrentInvestment += currentValue;
          
          if (!currentPortfolioAllocation[product.category]) {
            currentPortfolioAllocation[product.category] = { value: 0, annualReturn: 0 };
          }
          currentPortfolioAllocation[product.category].value += currentValue;
          
          // Use product-level rate first, fallback to category mapping only when missing
          const predictedReturn =
            product.annualReturn != null
              ? parseFloat(product.annualReturn.toString())
              : getAnnualReturnFallback(product.category, product.name);
          currentPortfolioAllocation[product.category].annualReturn = predictedReturn;
        }
      }
      
      // Generate 7-year prediction (28 data points at 3-month intervals)
      const predictions = [];
      const predictionStartDate = new Date(endDate);
      
      // Calculate weighted annual return for the portfolio
      let portfolioWeightedReturn = 0;
      for (const [category, allocation] of Object.entries(currentPortfolioAllocation)) {
        const { value, annualReturn } = allocation as { value: number; annualReturn: number };
        const weight = value / totalCurrentInvestment;
        portfolioWeightedReturn += (annualReturn * weight);
      }
      
      for (let i = 1; i <= 28; i++) {
        predictionStartDate.setMonth(predictionStartDate.getMonth() + 3);
        
        // Calculate time in years (3-month intervals)
        const timeInYears = (i * 3) / 12;
        
        // Apply compound growth with portfolio weighted return
        const futureValue = totalCurrentInvestment * Math.pow(1 + portfolioWeightedReturn, timeInYears);
        const totalReturn = futureValue - totalCurrentInvestment;
        const totalReturnPercent = (totalReturn / totalCurrentInvestment) * 100;
        
        predictions.push({
          date: predictionStartDate.toISOString().split('T')[0],
          value: Math.round(futureValue),
          totalReturn: Math.round(totalReturn),
          weightedReturn: Number(totalReturnPercent.toFixed(2)),
          currentInvestment: Math.round(totalCurrentInvestment),
          isPrediction: true,
          timestamp: predictionStartDate.getTime()
        });
      }
      
      // Calculate overall performance metrics - use real-time current values from all investments with unified function
      let totalInvestedNow = 0;
      let totalCurrentValueNow = 0;
      
      for (const investment of investments) {
        const product = allProducts.find(p => p.id === investment.productId);
        if (product) {
          const investedAmount = parseFloat(investment.investedAmount);
          const investmentDate = new Date(investment.investmentDate);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, endDate);
          
          totalInvestedNow += investedAmount;
          totalCurrentValueNow += performance.currentValue;
        }
      }
      
      const totalReturn = totalCurrentValueNow - totalInvestedNow;
      const totalReturnPercent = totalInvestedNow > 0 ? (totalReturn / totalInvestedNow) * 100 : 0;
      
      res.json({
        timeframe,
        data: dataPoints,
        predictions,
        currentValue: totalCurrentValueNow,
        totalReturn: totalReturn.toFixed(2),
        totalReturnPercent: totalReturnPercent.toFixed(2),
        portfolioAllocation: currentPortfolioAllocation
      });
    } catch (error) {
      console.error("Investment performance error:", error);
      res.status(500).json({ error: "Failed to get investment performance" });
    }
  });

  // Get investment breakdown by category
  app.get("/api/investment-breakdown", async (req, res) => {
    try {
      const userId = 1;
      const totals = await calculateInvestmentTotalsAtDate(userId, new Date());

      const categoryDisplayNames: Record<string, string> = {
        real_estate: "Real Estate",
        corporate_credit: "Corporate Credit",
        venture_capital: "Venture Capital",
        digital_assets: "Digital Assets",
        cash_deposit: "Cash Deposits",
      };

      const categoryMap: Record<string, { name: string; value: number; products: any[] }> = {};
      for (const item of totals.items) {
        if (!categoryMap[item.category]) {
          categoryMap[item.category] = {
            name: categoryDisplayNames[item.category] ?? item.category,
            value: 0,
            products: [],
          };
        }
        categoryMap[item.category].value += item.currentValue;
        categoryMap[item.category].products.push({
          name: item.productName,
          value: item.currentValue,
          investedAmount: item.investedAmount,
          returnAmount: item.returnAmount,
          returnPercentage: item.returnPercentage,
          percentage: 0, // filled below
        });
      }

      const categories = Object.values(categoryMap)
        .map(cat => ({
          ...cat,
          percentage: totals.totalCurrentValue > 0 ? (cat.value / totals.totalCurrentValue) * 100 : 0,
          products: cat.products.map(p => ({
            ...p,
            percentage: totals.totalCurrentValue > 0 ? (p.value / totals.totalCurrentValue) * 100 : 0,
          })),
        }))
        .filter(cat => cat.value > 0);

      res.json({
        totalInvested: totals.totalInvested,
        totalCurrentValue: totals.totalCurrentValue,
        totalReturn: totals.totalReturn,
        totalReturnPercent: totals.totalReturnPercent,
        categories,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investment breakdown" });
    }
  });

  // Create investment
  app.post("/api/investments", async (req, res) => {
    try {
      const { productId, amount, sourceCurrency = "USD", sourceAmount } = req.body;
      const userId = 1; // Hardcoded user ID for demo
      
      if (!productId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const product = await storage.getInvestmentProduct(productId);
      if (!product) {
        return res.status(400).json({ error: "Investment product not found" });
      }

      const investmentAmount = parseFloat(amount); // USD equivalent
      const deductionAmount = sourceAmount ? parseFloat(sourceAmount) : investmentAmount; // Original currency amount
      const currency = sourceCurrency || "USD";
      const minimumInvestment = parseFloat(product.minimumInvestment);
      
      if (investmentAmount < minimumInvestment) {
        return res.status(400).json({ error: `Minimum investment is $${minimumInvestment.toLocaleString()}` });
      }

      // Check source currency wallet balance
      const sourceWallet = await storage.getWallet(userId, currency);
      if (!sourceWallet) {
        return res.status(400).json({ error: `${currency} wallet not found` });
      }

      const currentBalance = parseFloat(sourceWallet.availableBalance);
      if (currentBalance < deductionAmount) {
        return res.status(400).json({ error: `Insufficient balance. Available: ${deductionAmount.toLocaleString()} ${currency}` });
      }

      // Update source wallet balance (deduct investment amount in original currency)
      const newBalance = (parseFloat(sourceWallet.balance) - deductionAmount).toFixed(2);
      const newAvailableBalance = (parseFloat(sourceWallet.availableBalance) - deductionAmount).toFixed(2);
      
      await storage.updateWallet(sourceWallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "investment",
        fromCurrency: currency,
        toCurrency: currency === "USD" ? null : "USD",
        amount: deductionAmount.toString(),
        fee: "0.00",
        exchangeRate: currency === "USD" ? null : (investmentAmount / deductionAmount).toString(),
        status: "completed",
        description: `Investment in ${product.name}${currency !== "USD" ? ` (converted from ${currency})` : ""}`,
      });

      // Create investment record (always in USD equivalent)
      const investment = await storage.createUserInvestment({
        userId,
        productId,
        investedAmount: investmentAmount.toString(), // USD equivalent
        currentValue: investmentAmount.toString(), // Initially same as invested amount
        totalReturn: "0.00",
        returnPercent: "0.00",
        status: "active",
        maturityDate: null, // Can be calculated based on product term
      });

      // Save an "actual" portfolio snapshot so all pages reflect the new investment immediately
      await saveActualSnapshot(userId);

      res.json({
        investment,
        transaction,
        newBalance: newAvailableBalance,
        sourceCurrency: currency,
        message: "Investment created successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create investment" });
    }
  });

  // Wallet transfer endpoint
  app.post("/api/wallets/transfer", async (req, res) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      const userId = 1; // Demo user
      
      // Get source wallet
      const sourceWallet = await storage.getWallet(userId, fromCurrency);
      if (!sourceWallet) {
        return res.status(404).json({ error: "Source wallet not found" });
      }
      
      if (sourceWallet.availableBalance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Get or create target wallet
      let targetWallet = await storage.getWallet(userId, toCurrency);
      if (!targetWallet) {
        targetWallet = await storage.createWallet({
          userId,
          currency: toCurrency,
          balance: 0,
          availableBalance: 0,
          walletType: ['BTC', 'ETH'].includes(toCurrency) ? 'crypto' : 'fiat'
        });
      }
      
      // Get exchange rate - must find valid rate or fail
      const rate = await storage.getFxRate(fromCurrency, toCurrency);
      if (!rate) {
        return res.status(400).json({ error: `Exchange rate not found for ${fromCurrency} to ${toCurrency}` });
      }
      const exchangeRate = parseFloat(rate.rate);
      
      const convertedAmount = amount * exchangeRate;
      const fee = convertedAmount * 0.005; // 0.5% fee
      const finalAmount = convertedAmount - fee;
      
      // Update balances with proper numeric conversion
      const newSourceBalance = (parseFloat(sourceWallet.balance) - amount).toFixed(2);
      const newSourceAvailable = (parseFloat(sourceWallet.availableBalance) - amount).toFixed(2);
      
      await storage.updateWallet(sourceWallet.id, {
        balance: newSourceBalance,
        availableBalance: newSourceAvailable
      });
      
      const newTargetBalance = (parseFloat(targetWallet.balance) + finalAmount).toFixed(2);
      const newTargetAvailable = (parseFloat(targetWallet.availableBalance) + finalAmount).toFixed(2);
      
      await storage.updateWallet(targetWallet.id, {
        balance: newTargetBalance,
        availableBalance: newTargetAvailable
      });
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "currency_transfer",
        amount: amount.toString(),
        currency: fromCurrency,
        targetCurrency: toCurrency,
        status: "completed",
        description: `Converted ${amount} ${fromCurrency} to ${finalAmount.toFixed(2)} ${toCurrency}`,
        fee
      });
      
      res.json({
        transaction,
        exchangeRate,
        convertedAmount,
        fee,
        finalAmount,
        sourceWallet: await storage.getWallet(userId, fromCurrency),
        targetWallet: await storage.getWallet(userId, toCurrency)
      });
    } catch (error) {
      console.error("Wallet transfer error:", error);
      res.status(500).json({ error: "Failed to process transfer" });
    }
  });

  // Advisor Contact Route
  app.post("/api/advisor/contact", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // In a real implementation, this would send an email or create a ticket
      // For demo, we'll just return success
      res.json({ 
        success: true, 
        message: "Your message has been sent to your wealth planner",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  return httpServer;
}
