import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { createHash, createHmac, randomBytes } from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail, emailConfigured } from "./email";
import {
  isCoinbaseConfigured,
  createCharge,
  getCharge,
  verifyWebhookSignature as verifyCoinbaseSignature,
  CURRENCY_TO_NETWORK,
  CRYPTO_CURRENCIES_COINBASE,
} from "./coinbase";
import { z } from "zod";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { and, eq, or, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import { storage } from "./storage";
import { db } from "./db";
import {
  wallets,
  transactions,
  userInvestments,
  idempotencyKeys,
  auditLogs,
  passwordResetTokens,
  users,
  advisorMessages,
  amlFlags,
  complianceActions,
} from "@shared/schema";
import {
  requireAuth,
  requireKyc,
  authMiddleware,
  signToken,
  verifyPassword,
  hashPassword,
  isLocalDev,
  type AuthPayload,
} from "./auth";

// ---------------------------------------------------------------------------
// Compliance helpers — asset classification for AUSTRAC traceability
// ---------------------------------------------------------------------------
const CRYPTO_CURRENCIES = ["BTC", "ETH", "USDT", "USDC"];

function classifyAssetType(from?: string | null, to?: string | null): "fiat" | "crypto" | "cross" {
  const fromCrypto = from ? CRYPTO_CURRENCIES.includes(from) : false;
  const toCrypto   = to   ? CRYPTO_CURRENCIES.includes(to)   : false;
  if (fromCrypto && toCrypto) return "crypto";
  if (!fromCrypto && !toCrypto) return "fiat";
  return "cross"; // fiat ↔ crypto conversion — monitored separately
}

function classifyDirection(type: string): "in" | "out" | "exchange" {
  if (["deposit", "crypto_buy"].includes(type))    return "in";
  if (["withdrawal", "crypto_sell"].includes(type)) return "out";
  return "exchange";
}

async function runAmlCheck(
  userId: number,
  txId: number,
  amount: Decimal,
  assetType: "fiat" | "crypto" | "cross",
  type: string
): Promise<void> {
  try {
    const flags: { riskLevel: "low" | "medium" | "high"; reason: string }[] = [];

    // Rule 1: Large transaction (≥ AUD $10,000) — AUSTRAC TTR reporting threshold
    if (amount.gte(10000)) {
      flags.push({ riskLevel: "medium", reason: `Large transaction: ${amount.toFixed(2)} (≥ AUD $10,000 threshold)` });
    }

    // Rule 2: Fiat ↔ crypto conversion — monitored for layering risk
    if (assetType === "cross") {
      flags.push({ riskLevel: "low", reason: `Fiat-to-crypto or crypto-to-fiat conversion (type: ${type})` });
    }

    // Rule 3: Very large transaction (≥ AUD $50,000) — escalate to high
    if (amount.gte(50000)) {
      flags.push({ riskLevel: "high", reason: `High-value transaction: ${amount.toFixed(2)} (≥ AUD $50,000)` });
    }

    // Rule 4: Structuring detection — near-threshold transactions (AML/CTF Act 2006 §136 offence)
    // Checks rolling 24h total; if sum is between $8,000-$9,999 (just under TTR threshold),
    // flag as potential structuring/smurfing.
    if (amount.lt(10000) && amount.gte(3000)) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [recentResult] = await db
        .select({ total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)::text` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            sql`${transactions.createdAt} >= ${since}`,
            sql`${transactions.status} != 'failed'`,
            sql`${transactions.id} != ${txId}`,
          ),
        );
      const rollingTotal = new Decimal(recentResult?.total ?? "0").plus(amount);
      if (rollingTotal.gte(8000) && rollingTotal.lt(10000)) {
        flags.push({
          riskLevel: "medium",
          reason: `Potential structuring: rolling 24h total ${rollingTotal.toFixed(2)} approaches TTR threshold without triggering it (AML/CTF Act 2006 §136)`,
        });
      }
    }

    // Rule 5: High-velocity — more than 5 transactions in the past hour (layering indicator)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [velocityResult] = await db
      .select({ count: sql<string>`COUNT(*)::text` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`${transactions.createdAt} >= ${oneHourAgo}`,
          sql`${transactions.status} != 'failed'`,
        ),
      );
    const txCount = parseInt(velocityResult?.count ?? "0", 10);
    if (txCount > 5) {
      flags.push({
        riskLevel: "medium",
        reason: `High transaction velocity: ${txCount} transactions in the past hour (potential layering)`,
      });
    }

    for (const flag of flags) {
      await storage.createAmlFlag({
        userId,
        transactionId: txId,
        riskLevel: flag.riskLevel,
        reason: flag.reason,
        status: "open",
        notes: null,
        reviewedAt: null,
      });
    }
  } catch {
    // AML flagging must never block the transaction flow — log silently
  }
}

// ---------------------------------------------------------------------------
// Daily transaction limit check — AML/CTF Program §6 (Risk-Based Controls)
// Enforces per-user daily transaction limits derived from their risk profile.
// Low risk: AUD 50,000 | Medium risk: AUD 10,000 | High risk: AUD 2,000
// Accumulates same-currency transaction volume in the rolling 24-hour window.
// ---------------------------------------------------------------------------
async function checkDailyLimit(userId: number, amount: Decimal, currency: string): Promise<void> {
  try {
    const user = await storage.getUser(userId);
    if (!user?.dailyTransactionLimit) return;

    const dailyLimit = new Decimal(user.dailyTransactionLimit);
    if (dailyLimit.lte(0)) return;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Sum all non-failed transactions in the same currency in the last 24 hours
    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)::text` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`${transactions.createdAt} >= ${since}`,
          sql`${transactions.status} != 'failed'`,
          or(
            eq(transactions.fromCurrency, currency),
            eq(transactions.toCurrency, currency),
          ),
        ),
      );

    const dailyTotal = new Decimal(result?.total ?? "0");
    if (dailyTotal.plus(amount).gt(dailyLimit)) {
      const riskLabel = user.riskLevel === "low"
        ? "AUD 50,000"
        : user.riskLevel === "medium"
        ? "AUD 10,000"
        : "AUD 2,000";
      throw Object.assign(
        new Error(
          `This transaction would exceed your daily limit of ${riskLabel}. ` +
          "Please contact support at info@amaxglobal.com.au to request a limit review.",
        ),
        { status: 403 },
      );
    }
  } catch (e: any) {
    if (e.status) throw e;
    // Limit check must never fail silently in a way that blocks real 403s — rethrow 403s only
  }
}

// ---------------------------------------------------------------------------
// Zod validation schemas for all money-movement routes.
// These run before any storage access so bad input is rejected early.
// ---------------------------------------------------------------------------
const fxExchangeSchema = z.object({
  fromCurrency: z.string().min(2).max(10),
  toCurrency: z.string().min(2).max(10),
  amount: z.coerce.number().positive("Amount must be positive"),
}).refine(d => d.fromCurrency !== d.toCurrency, {
  message: "Source and target currencies must differ",
});

const depositSchema = z.object({
  currency: z.string().min(2).max(10),
  amount: z.coerce.number()
    .positive("Amount must be positive")
    .max(9999999, "Amount exceeds maximum single-deposit limit of 9,999,999"),
  description: z.string().max(255).optional(),
  // Payment channel: bank_transfer | payid — card deposits go via Checkout.com, not this route.
  method: z.enum(["bank_transfer", "payid"]).optional(),
  // AML/CTF originator information — AUSTRAC requires payer identity for all inbound transfers.
  // Mandatory for bank_transfer and payid channels; stored in transaction description JSON.
  payerName: z.string().max(120).optional(),
  payerBsb: z.string().max(20).optional(),
  payerAccountNumber: z.string().max(40).optional(),
  payerPayId: z.string().max(120).optional(),
});

const withdrawSchema = z.object({
  currency: z.string().min(2).max(10),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().max(500).optional(),
  withdrawMethod: z.enum(["bank_transfer", "payid"]).optional(),
  // Bank transfer payout details — required for compliance when method=bank_transfer
  bankAccountName: z.string().max(120).optional(),
  bankBsb: z.string().max(20).optional(),
  bankAccountNumber: z.string().max(40).optional(),
  bankSwift: z.string().max(20).optional(),
  bankName: z.string().max(120).optional(),
  // PayID payout details — required for compliance when method=payid
  payid: z.string().max(120).optional(),
  payidAccountName: z.string().max(120).optional(),
  // AML/CTF: purpose of transfer (mandatory per AUSTRAC CDD obligations)
  purposeOfTransfer: z.string().max(120).optional(),
});

const investmentSchema = z.object({
  productId: z.number().int().positive(),
  amount: z.coerce.number().positive("Amount must be positive"),
  sourceCurrency: z.string().min(2).max(10).optional(),
  sourceAmount: z.coerce.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Lightweight in-memory system event log — persists within a server session.
// Stores the last MAX_EVENTS entries (FIFO ring); no DB migration required.
// Replace with a persistent events table when audit-grade traceability is needed.
// ---------------------------------------------------------------------------
const MAX_SYSTEM_EVENTS = 200;
const systemEventLog: Array<{ type: string; payload: unknown; timestamp: string }> = [];

function saveSystemEvent(event: { type: string; payload: unknown }): void {
  systemEventLog.unshift({ ...event, timestamp: new Date().toISOString() });
  if (systemEventLog.length > MAX_SYSTEM_EVENTS) systemEventLog.length = MAX_SYSTEM_EVENTS;
}

// ---------------------------------------------------------------------------
// Money-movement rate limiter — applied to FX exchange, withdrawals, and
// investment purchases. 30 requests per 5 minutes per IP prevents automated abuse.
// ---------------------------------------------------------------------------
const moneyMovementLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req as any).user?.id?.toString() ?? ipKeyGenerator(req),
  message: { error: "Too many requests for this operation. Please try again in a few minutes." },
});

// ---------------------------------------------------------------------------
// DB-backed idempotency for all money-movement routes.
// Uses the idempotency_keys table (unique on userId+route+key).
// payloadHash guards against key reuse with a different request body.
// Durable across restarts and horizontal scaling.
// ---------------------------------------------------------------------------
function hashPayload(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

async function checkIdempotency(
  userId: number,
  route: string,
  key: string,
  payloadHash: string
): Promise<{ existing: boolean; response?: unknown; conflict?: boolean }> {
  const [row] = await db
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.userId, userId),
        eq(idempotencyKeys.route, route),
        eq(idempotencyKeys.key, key)
      )
    );
  if (!row) return { existing: false };
  if (row.payloadHash !== payloadHash) return { existing: true, conflict: true };
  return { existing: true, response: row.responseJson };
}

async function saveIdempotentResponse(
  userId: number,
  route: string,
  key: string,
  payloadHash: string,
  response: unknown
): Promise<void> {
  await db.insert(idempotencyKeys).values({
    userId,
    route,
    key,
    payloadHash,
    responseJson: response as any,
  }).onConflictDoNothing();
}

// ---------------------------------------------------------------------------
// Persistent audit log writer — writes finance-grade event records to DB.
// ---------------------------------------------------------------------------
async function writeAuditLog(
  userId: number | null,
  action: string,
  entityType: string | null,
  entityId: string | null,
  metadata: unknown,
  ipAddress: string | null
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata as any,
      ipAddress,
    });
  } catch {
    // Audit log failures must never crash money routes
  }
}

// ---------------------------------------------------------------------------
// Wallet transfer Zod schema (audit: missing validation added here)
// ---------------------------------------------------------------------------
const walletTransferSchema = z.object({
  fromCurrency: z.string().min(2).max(10),
  toCurrency: z.string().min(2).max(10),
  amount: z.coerce.number().positive("Amount must be positive"),
}).refine(d => d.fromCurrency !== d.toCurrency, {
  message: "Source and target currencies must differ",
});

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
): { currentValue: number | null; returnAmount: number; returnPercentage: number; valuationStatus?: string } {
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

  const returnMethod = product.returnMethod || "fixed_annual_compound";

  let currentValue: number | null = investedAmount;
  let valuationStatus: string | undefined;

  switch (returnMethod) {
    case "manual_nav":
    case "market_price":
      // No live price source available — exclude from totals and surface via valuationStatus
      currentValue = null;
      valuationStatus = "missing_price_source";
      break;
    default: {
      // Fail-closed: refuse to compute if no explicit product rate is stored in the DB.
      // Category assumption fallbacks (getAnnualReturnFallback) are intentionally not used here
      // to prevent silently overstating portfolio value with made-up rates.
      if (product.annualReturn == null) {
        currentValue = null;
        valuationStatus = "missing_product_rate";
        break;
      }
      const annualReturn = parseFloat(product.annualReturn);
      if (returnMethod === "fixed_annual_simple") {
        currentValue = investedAmount * (1 + annualReturn * yearsHeld);
      } else {
        currentValue = investedAmount * Math.pow(1 + annualReturn, yearsHeld);
      }
    }
  }

  // returnAmount and returnPercentage are 0 when currentValue is unknown
  const returnAmount = currentValue !== null ? currentValue - investedAmount : 0;
  const returnPercentage = currentValue !== null ? (returnAmount / investedAmount) * 100 : 0;

  return { currentValue, returnAmount, returnPercentage, valuationStatus };
}

// Shared FX conversion helper — tries direct rate then inverse.
// Returns null when no rate is available so callers can surface the gap
// rather than silently undercounting the portfolio total.
async function convertToUsd(currency: string, amount: number): Promise<number | null> {
  if (currency === "USD") return amount;
  const direct = await storage.getFxRate(currency, "USD");
  if (direct) return amount * parseFloat(direct.rate);
  const inverse = await storage.getFxRate("USD", currency);
  if (inverse) return amount / parseFloat(inverse.rate);
  return null;
}

// One shared engine for all investment valuation — batch fetches products to avoid N+1 queries
async function calculateInvestmentTotalsAtDate(userId: number, asOfDate: Date = new Date()) {
  const investments = await storage.getUserInvestments(userId);
  const products = await storage.getInvestmentProducts();

  let totalInvested = 0;
  let totalCurrentValue = 0;
  let hasUnpricedAssets = false;
  const items: Array<{
    id: number; productId: number; productName: string; category: string;
    annualReturn: string; returnMethod: string;
    investedAmount: number; currentValue: number | null; returnAmount: number; returnPercentage: number;
    valuationStatus?: string;
  }> = [];

  for (const inv of investments) {
    const product = products.find((p: any) => p.id === inv.productId);
    if (!product) continue;
    const investedAmount = parseFloat(inv.investedAmount);
    const investmentDate = new Date(inv.investmentDate ?? Date.now());
    if (investmentDate > asOfDate) continue; // investment didn't exist yet at asOfDate
    const perf = calculateInvestmentPerformance(product, investedAmount, investmentDate, asOfDate);
    totalInvested += investedAmount;
    // Unpriced assets (manual_nav / market_price) are excluded from the total rather than
    // estimated with a placeholder — hasUnpricedAssets signals the gap to callers
    totalCurrentValue += perf.currentValue ?? 0;
    if (perf.currentValue === null) hasUnpricedAssets = true;
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
      ...(perf.valuationStatus ? { valuationStatus: perf.valuationStatus } : {}),
    });
  }

  // Runtime guard — NaN here means a perf.currentValue ?? 0 silently received a non-numeric;
  // fail fast rather than propagate a corrupt total downstream.
  if (!Number.isFinite(totalCurrentValue)) {
    throw new Error(`[investment_totals] NaN in totalCurrentValue for userId=${userId}`);
  }

  return {
    totalInvested,
    totalCurrentValue,
    totalReturn: totalCurrentValue - totalInvested,
    totalReturnPercent: totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0,
    hasUnpricedAssets,
    items,
  };
}

// Reconstruct wallet balances at a historical date using reverse transaction replay.
// Formula: balance_at_date = current_balance + debits_after_date - credits_after_date
// This accurately undoes any deposits/withdrawals/investments that occurred after asOfDate.
//
// NOTE: Float (IEEE 754 double) arithmetic is used intentionally here.
// Safe within current precision tolerance (<$0.01 drift per transaction chain).
// Replace with Decimal.js if FX volume or precision requirements increase significantly.
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
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount ?? "0"), 0);

    // Credits: money ENTERED this wallet after asOfDate → subtract to get historical balance
    // For exchange transactions the net credited amount = (amount * exchangeRate) - fee.
    // t.fee is stored in the target currency (the fee was deducted from the converted amount).
    // Using gross (amount * exchangeRate) would overstate the historical credit by the 0.5% fee.
    const totalCredits = txAfter
      .filter((t: any) => t.toCurrency === currency)
      .reduce((sum: number, t: any) => {
        const base = parseFloat(t.amount ?? "0");
        const rate = t.exchangeRate ? parseFloat(t.exchangeRate) : 1;
        const feeInTarget = t.fee ? parseFloat(t.fee) : 0;
        return sum + (t.type === "exchange" ? base * rate - feeInTarget : base);
      }, 0);

    const historicalBalance = Math.max(0, currentBalance + totalDebits - totalCredits);
    return { currency, balance: historicalBalance, walletType: wallet.walletType };
  });
}

// Guard called before any transaction is persisted to storage.
// Prevents bad transactions from poisoning the wallet reconstruction history.
function validateTransaction(tx: {
  type: string;
  amount: number;
  fromCurrency?: string | null;
  toCurrency?: string | null;
  exchangeRate?: number | null;
}): void {
  if (!Number.isFinite(tx.amount) || tx.amount <= 0) {
    throw new Error("Invalid transaction amount");
  }
  if (!tx.type) {
    throw new Error("Transaction type required");
  }
  if (tx.type === "exchange") {
    if (!tx.fromCurrency || !tx.toCurrency) {
      throw new Error("Exchange requires both fromCurrency and toCurrency");
    }
    if (!Number.isFinite(tx.exchangeRate) || (tx.exchangeRate as number) <= 0) {
      throw new Error("Invalid exchange rate");
    }
  }
  if (tx.fromCurrency && tx.toCurrency && tx.fromCurrency === tx.toCurrency) {
    throw new Error("fromCurrency and toCurrency must differ");
  }
}

// Compares reconstructed balances against current wallet state and logs any drift.
// Returns the list of mismatches so callers can decide how to surface them.
export async function reconcileWalletBalances(
  userId: number,
  asOfDate: Date
): Promise<Array<{ currency: string; reconstructedBalance: number; currentBalance: number; delta: number }>> {
  const reconstructed = await reconstructWalletBalancesAsOf(userId, asOfDate);
  const currentWallets = await storage.getWallets(userId);
  const tolerance = 1e-6;

  const byReconstructed = new Map(reconstructed.map((r: any) => [r.currency, r.balance]));

  const mismatches = (currentWallets as any[])
    .map((wallet: any) => {
      const reconstructedBalance = byReconstructed.get(wallet.currency) ?? 0;
      const currentBalance = parseFloat(wallet.balance ?? "0");
      const delta = currentBalance - reconstructedBalance;
      return { currency: wallet.currency, reconstructedBalance, currentBalance, delta };
    })
    .filter((x) => Math.abs(x.delta) > tolerance);

  if (mismatches.length > 0) {
    const logPayload = { userId, asOfDate: asOfDate.toISOString().split("T")[0], mismatches };
    console.warn("[ledger_drift_detected]", logPayload);
    // Persist to in-memory event log for session-level traceability
    saveSystemEvent({ type: "ledger_drift", payload: logPayload });
    // Write to persistent audit log for significant drift (>$0.01) only — prevents noise
    const significantMismatches = mismatches.filter((m) => Math.abs(m.delta) > 0.01);
    if (significantMismatches.length > 0) {
      await writeAuditLog(userId, "ledger_drift_detected", "wallet", null,
        { asOfDate: asOfDate.toISOString().split("T")[0], mismatches: significantMismatches }, null
      ).catch((err) => console.error("[reconcile] audit log write failed:", err));
    }
  }

  return mismatches;
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
  let hasUnpricedWallets = false;
  const unpricedCurrencies: string[] = [];

  for (const wallet of walletData) {
    const balance = wallet.balance;
    if (wallet.walletType === "fiat") {
      const usd = await convertToUsd(wallet.currency, balance);
      if (usd !== null) {
        fiatValue += usd;
      } else {
        hasUnpricedWallets = true;
        unpricedCurrencies.push(wallet.currency);
      }
    } else if (wallet.currency === "USDT" || wallet.currency === "USDC") {
      stablecoinValue += balance;
    } else {
      const rate = await storage.getFxRate(wallet.currency, "USD");
      if (rate) {
        cryptoValue += balance * parseFloat(rate.rate);
      } else {
        hasUnpricedWallets = true;
        unpricedCurrencies.push(wallet.currency);
      }
    }
  }
  const investmentTotals = await calculateInvestmentTotalsAtDate(userId, asOfDate);
  const investmentValue = investmentTotals.totalCurrentValue;
  return {
    fiatValue, cryptoValue, stablecoinValue, investmentValue,
    totalValue: fiatValue + cryptoValue + stablecoinValue + investmentValue,
    hasUnpricedWallets,
    unpricedCurrencies,
  };
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
// Sanitize snapshots loaded from DB — drop any rows with invalid totalValue.
// Guards charts against bad historical data that predates the write-side guard.
function sanitizeSnapshots(snapshots: any[], context: string): any[] {
  return snapshots.filter((s) => {
    const v = parseFloat(s.totalValue ?? "");
    if (!Number.isFinite(v) || v < 0) {
      console.error("[snapshot-invalid] Skipping bad snapshot in", context, {
        id: s.id, userId: s.userId,
        date: s.snapshotDate, totalValue: s.totalValue,
      });
      return false;
    }
    return true;
  });
}

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

  // Guard: reject snapshots with invalid totals before writing to DB
  if (!Number.isFinite(totals.totalValue) || totals.totalValue < 0) {
    console.error("[snapshot-invalid] Refusing to write invalid snapshot", {
      userId,
      snapshotDate: snapshotDate.toISOString().split("T")[0],
      totalValue: totals.totalValue,
    });
    return;
  }

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

  // After filling any new snapshots, run reconciliation to detect ledger drift
  if (missingDates.length > 0) {
    await reconcileWalletBalances(userId, normalizedEnd);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Ensure crypto + GBP FX rates exist (seed missing rows, reset sequence first)
  {
    const { db } = await import('./db');
    const { sql: rawSql } = await import('drizzle-orm');
    // Reset the serial sequence to MAX(id) so inserts don't collide with existing rows
    await db.execute(rawSql`SELECT setval(pg_get_serial_sequence('fx_rates', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM fx_rates), 1), 1))`);
    const missingRates = [
      { baseCurrency: 'BTC',  targetCurrency: 'USD', rate: '95000.00',  spread: '0.0050' },
      { baseCurrency: 'ETH',  targetCurrency: 'USD', rate: '3500.00',   spread: '0.0050' },
      { baseCurrency: 'GBP',  targetCurrency: 'USD', rate: '1.27000',   spread: '0.0050' },
      { baseCurrency: 'USD',  targetCurrency: 'GBP', rate: '0.78740',   spread: '0.0050' },
      { baseCurrency: 'SGD',  targetCurrency: 'USD', rate: '0.74500',   spread: '0.0050' },
      { baseCurrency: 'USD',  targetCurrency: 'SGD', rate: '1.34228',   spread: '0.0050' },
      { baseCurrency: 'JPY',  targetCurrency: 'USD', rate: '0.00667',   spread: '0.0050' },
      { baseCurrency: 'USD',  targetCurrency: 'JPY', rate: '149.9500',  spread: '0.0050' },
      { baseCurrency: 'KRW',  targetCurrency: 'USD', rate: '0.000756',  spread: '0.0050' },
      { baseCurrency: 'USD',  targetCurrency: 'KRW', rate: '1323.00',   spread: '0.0050' },
      { baseCurrency: 'CNY',  targetCurrency: 'USD', rate: '0.13780',   spread: '0.0050' },
      { baseCurrency: 'USD',  targetCurrency: 'CNY', rate: '7.25900',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'USD', rate: '0.63500',   spread: '0.0050' },
      { baseCurrency: 'USD',  targetCurrency: 'AUD', rate: '1.57480',   spread: '0.0050' },
      { baseCurrency: 'HKD',  targetCurrency: 'USD', rate: '0.12810',   spread: '0.0050' },
      { baseCurrency: 'USD',  targetCurrency: 'HKD', rate: '7.80700',   spread: '0.0050' },
      // NZD — seeded as fallback; overwritten by Frankfurter on first refresh
      { baseCurrency: 'NZD',  targetCurrency: 'USD', rate: '0.58800',   spread: '0.0050' },
      { baseCurrency: 'USD',  targetCurrency: 'NZD', rate: '1.70068',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'NZD', rate: '1.07800',   spread: '0.0050' },
      { baseCurrency: 'NZD',  targetCurrency: 'AUD', rate: '0.92764',   spread: '0.0050' },
      // AUD cross rates
      { baseCurrency: 'AUD',  targetCurrency: 'CAD', rate: '0.89500',   spread: '0.0050' },
      { baseCurrency: 'CAD',  targetCurrency: 'AUD', rate: '1.11700',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'EUR', rate: '0.59000',   spread: '0.0050' },
      { baseCurrency: 'EUR',  targetCurrency: 'AUD', rate: '1.69500',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'GBP', rate: '0.50200',   spread: '0.0050' },
      { baseCurrency: 'GBP',  targetCurrency: 'AUD', rate: '1.99200',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'HKD', rate: '4.95000',   spread: '0.0050' },
      { baseCurrency: 'HKD',  targetCurrency: 'AUD', rate: '0.20200',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'SGD', rate: '0.85000',   spread: '0.0050' },
      { baseCurrency: 'SGD',  targetCurrency: 'AUD', rate: '1.17600',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'JPY', rate: '101.50',    spread: '0.0050' },
      { baseCurrency: 'JPY',  targetCurrency: 'AUD', rate: '0.00985',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'KRW', rate: '962.00',    spread: '0.0050' },
      { baseCurrency: 'KRW',  targetCurrency: 'AUD', rate: '0.00104',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'CNY', rate: '4.62000',   spread: '0.0050' },
      { baseCurrency: 'CNY',  targetCurrency: 'AUD', rate: '0.21600',   spread: '0.0050' },
      // BTC and ETH vs AUD (and inverse)
      { baseCurrency: 'BTC',  targetCurrency: 'AUD', rate: '150000.00',   spread: '0.0050' },
      { baseCurrency: 'ETH',  targetCurrency: 'AUD', rate: '5600.00',     spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'BTC', rate: '0.00000667',  spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'ETH', rate: '0.00017857',  spread: '0.0050' },
      // Stablecoins vs AUD (pegged ~$1 USD)
      { baseCurrency: 'USDT', targetCurrency: 'AUD', rate: '1.45520',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'USDT', rate: '0.68720',  spread: '0.0050' },
      { baseCurrency: 'USDC', targetCurrency: 'AUD', rate: '1.45520',   spread: '0.0050' },
      { baseCurrency: 'AUD',  targetCurrency: 'USDC', rate: '0.68720',  spread: '0.0050' },
      // Stablecoins vs USD (1:1 peg)
      { baseCurrency: 'USDT', targetCurrency: 'USD', rate: '1.00000',   spread: '0.0010' },
      { baseCurrency: 'USD',  targetCurrency: 'USDT', rate: '1.00000',  spread: '0.0010' },
      { baseCurrency: 'USDC', targetCurrency: 'USD', rate: '1.00000',   spread: '0.0010' },
      { baseCurrency: 'USD',  targetCurrency: 'USDC', rate: '1.00000',  spread: '0.0010' },
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
    // Backfill 90 days so charts and period returns always have data to draw from.
    // Runs for every registered user — not just the seed/demo user.
    // Only creates snapshots for days with none already present — safe to repeat.
    const backfillEnd = new Date();
    backfillEnd.setHours(0, 0, 0, 0);
    const backfillStart = new Date(backfillEnd);
    backfillStart.setDate(backfillStart.getDate() - 90);
    const allUsers = await db.select({ id: users.id }).from(users);
    for (const u of allUsers) {
      await backfillPortfolioHistory(u.id, backfillStart, backfillEnd);
    }
  }

  // ---------------------------------------------------------------------------
  // One-time startup migrations: DB constraints + demo user password hashing
  // ---------------------------------------------------------------------------
  {
    // Wallet integrity constraints — enforce non-negative balances at DB level
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE wallets ADD CONSTRAINT balance_non_negative CHECK (balance >= 0);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `));
    await db.execute(sql.raw(`
      DO $$ BEGIN
        ALTER TABLE wallets ADD CONSTRAINT available_balance_non_negative CHECK (available_balance >= 0);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `));
    // Unique wallet per user+currency — prevent duplicate wallets
    await db.execute(sql.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_wallet_user_currency ON wallets (user_id, currency);
    `));
    // Hash the demo user's plaintext password on first startup
    const demoUser = await storage.getUser(1);
    if (demoUser && !demoUser.password.startsWith("$2")) {
      const hashed = await hashPassword(demoUser.password);
      await storage.updateUser(1, { password: hashed });
    }
  }

  // ---------------------------------------------------------------------------
  // Auth routes — login, current user, logout
  // ---------------------------------------------------------------------------

  // Login — returns JWT on valid credentials
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        await writeAuditLog(user.id, "login_failed", "user", String(user.id), { username }, req.ip || null);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = signToken({ userId: user.id, username: user.username, email: user.email });
      await writeAuditLog(user.id, "login", "user", String(user.id), { username }, req.ip || null);
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, kycStatus: user.kycStatus, userTier: user.userTier } });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "First name, last name, email, and password are required." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters." });
      }
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists. Please sign in." });
      }
      // Derive a unique username from email
      const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");
      let username = base;
      let attempt = 0;
      while (await storage.getUserByUsername(username)) {
        attempt++;
        username = `${base}${attempt}`;
      }
      const hashed = await hashPassword(password);
      const newUser = await storage.createUser({
        username,
        email: email.toLowerCase(),
        password: hashed,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        kycStatus: "pending",
        userTier: "standard",
      });
      // Create a default AUD wallet
      await storage.createWallet({ userId: newUser.id, currency: "AUD", balance: "0.00", availableBalance: "0.00", walletType: "fiat" });
      // Generate email verification token
      const verifyToken = randomBytes(32).toString("hex");
      const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await db.update(users).set({
        emailVerificationToken: verifyToken,
        emailVerificationTokenExpiry: verifyExpiry,
        emailVerified: false,
      }).where(eq(users.id, newUser.id));

      // Send verification email (no-op if GMAIL not configured)
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      await sendVerificationEmail(newUser.email, newUser.firstName, verifyToken, baseUrl).catch(() => {});

      await writeAuditLog(newUser.id, "register", "user", String(newUser.id), { email, username }, req.ip || null);
      const token = signToken({ userId: newUser.id, username: newUser.username, email: newUser.email });
      res.status(201).json({
        token,
        user: { id: newUser.id, username: newUser.username, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, kycStatus: newUser.kycStatus, userTier: newUser.userTier },
        emailSent: emailConfigured,
      });
    } catch (error: any) {
      console.error("[register] error:", error?.message, error?.code, error?.detail);
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // Resend verification email
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const auth = requireAuth(req);
      const [user] = await db.select().from(users).where(eq(users.id, auth.userId));
      if (!user) return res.status(404).json({ error: "User not found" });
      if (user.emailVerified) return res.json({ message: "Email already verified" });
      if (!emailConfigured) return res.status(503).json({ error: "Email service not configured. Please contact support@amaxglobal.com.au" });

      const verifyToken = randomBytes(32).toString("hex");
      const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.update(users).set({ emailVerificationToken: verifyToken, emailVerificationTokenExpiry: verifyExpiry }).where(eq(users.id, user.id));

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      await sendVerificationEmail(user.email, user.firstName, verifyToken, baseUrl);
      res.json({ message: "Verification email sent" });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });

  // Verify email token (clicked from email link)
  app.get("/api/auth/verify-email", async (req, res) => {
    const { token } = req.query as { token?: string };
    if (!token) return res.redirect("/#verify=missing");
    try {
      const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token));
      if (!user) return res.redirect("/verify-email?status=invalid");
      if (user.emailVerified) return res.redirect("/verify-email?status=already");
      const expiry = user.emailVerificationTokenExpiry;
      if (expiry && new Date() > expiry) return res.redirect("/verify-email?status=expired");

      await db.update(users).set({ emailVerified: true, emailVerificationToken: null, emailVerificationTokenExpiry: null }).where(eq(users.id, user.id));
      res.redirect("/verify-email?status=success");
    } catch {
      res.redirect("/verify-email?status=error");
    }
  });

  // Current authenticated user
  app.get("/api/auth/me", async (req, res) => {
    try {
      const auth = requireAuth(req);
      const user = await storage.getUser(auth.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      // Only pass through messages from errors we explicitly constructed (requireAuth uses .status).
      // Unexpected DB or runtime errors get a generic message to avoid leaking internal details.
      if (error?.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to retrieve account details" });
    }
  });

  // Logout (client drops the token; this endpoint logs the event server-side)
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const auth = requireAuth(req);
      await writeAuditLog(auth.userId, "logout", "user", String(auth.userId), {}, req.ip || null);
      res.json({ success: true });
    } catch {
      res.json({ success: true }); // Always succeed — client drops token regardless
    }
  });

  // Get current user (auth-aware)
  app.get("/api/user", async (req, res) => {
    try {
      const auth = requireAuth(req);
      const user = await storage.getUser(auth.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error: any) {
      if (error?.status === 401) {
        return res.status(401).json({ error: error.message || "Unauthorized" });
      }
      return res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get user portfolio — all values computed from the single shared valuation engine
  app.get("/api/portfolio", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      const now = new Date();

      // One call to the shared engine — no duplicated FX/investment loops
      const totals = await calculatePortfolioTotalsAtDate(userId, now);
      const { fiatValue, cryptoValue, stablecoinValue, investmentValue, totalValue,
              hasUnpricedWallets, unpricedCurrencies } = totals;

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
        // Valuation completeness flags — consumers should warn users when true
        hasUnpricedWallets,
        unpricedCurrencies,
        updatedAt: now,
      });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get portfolio" });
    }
  });

  // Get portfolio historical performance based on actual transactions
  app.get("/api/portfolio/history", async (req, res) => {
    try {
      const { timeframe = "1M" } = req.query;
      const { userId } = requireAuth(req);
      
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
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("Portfolio history error:", error);
      res.status(500).json({ error: "Failed to get portfolio history" });
    }
  });

  // Portfolio performance chart — two lines (historical + projected) from Jan 1, 2026
  app.get("/api/portfolio/performance-chart", async (req, res) => {
    try {
      const { timeframe = "1Y" } = req.query;
      const { userId } = requireAuth(req);
      const today = new Date();

      // Anchor = Jan 1 of current year
      const anchor = new Date(today.getFullYear(), 0, 1);
      anchor.setHours(0, 0, 0, 0);

      // Ensure backfilled history exists for the full anchor-to-today range
      await backfillPortfolioHistory(userId, anchor, today);

      // All historical points come from snapshots only — no wallet balance reconstruction
      const snapshots = sanitizeSnapshots(
        await storage.getPortfolioSnapshots(userId, anchor, today),
        "performance-chart"
      );
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
          if (Number.isFinite(cagrRate)) {
            // Allow negative CAGR (declining portfolio); reject only non-finite values.
            // Clamp: floor at -95%/yr (near-total loss), ceiling at +100%/yr (double in a year).
            annualProjectionRate = Math.max(-0.95, Math.min(1.0, cagrRate));
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

      // Only add a forecast when we have a real CAGR derived from actual history.
      // A 10% "fallback default" with no data basis is assumption-based and must not be shown.
      const canForecast = projectionMethod === "realized_cagr";

      if (canForecast) {
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
      }

      const hasEstimateSource = snapshots.some((s: any) => s.source === 'historical_estimate');
      const chartSource = canForecast
        ? (hasEstimateSource ? 'historical_estimate_plus_forecast' : 'historical_plus_forecast')
        : (hasEstimateSource ? 'historical_estimate' : 'historical_only');

      res.json({
        timeframe,
        anchorDate: anchor.toISOString().split('T')[0],
        openingValue,
        projectionMethod,
        ...(canForecast ? { projectionRate: `${(annualProjectionRate * 100).toFixed(2)}% p.a.` } : {}),
        chartSource,
        data: chartRows,
      });
    } catch (e) {
      console.error("Performance chart error:", e);
      res.status(500).json({ error: "Failed to load performance chart" });
    }
  });

  // Investment value — full year from Jan 1 of current year, month-by-month, historical + projected
  app.get("/api/investments/history-ytd", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      const now = new Date();
      const ANCHOR = new Date(Date.UTC(now.getFullYear(), 0, 1));
      const today = new Date();
      const TOTAL_MONTHS = 12; // Jan through Jan (13 points)

      const investments = await storage.getUserInvestments(userId);

      // Compute the opening investment value as of Jan 1, 2026
      let openingInvestmentValue = 0;
      for (const inv of investments) {
        const product = await storage.getInvestmentProduct(inv.productId);
        if (!product) continue;
        const investedAmount = parseFloat(inv.investedAmount);
        const investmentDate = new Date(inv.investmentDate ?? Date.now());
        const asOf = investmentDate <= ANCHOR ? ANCHOR : investmentDate;
        const perf = calculateInvestmentPerformance(product, investedAmount, investmentDate, asOf);
        openingInvestmentValue += perf.currentValue ?? 0;
      }

      // Projected line: use actual investment IRR — compute investment value at each month
      const getProjectedValueAt = async (targetDate: Date): Promise<number> => {
        let total = 0;
        for (const inv of investments) {
          const product = await storage.getInvestmentProduct(inv.productId);
          if (!product) continue;
          const investedAmount = parseFloat(inv.investedAmount);
          const investmentDate = new Date(inv.investmentDate ?? Date.now());
          const asOf = targetDate < investmentDate ? investmentDate : targetDate;
          const perf = calculateInvestmentPerformance(product, investedAmount, investmentDate, asOf);
          total += perf.currentValue ?? 0;
        }
        return Math.round(total);
      };

      // Historical line: real snapshot investment values, bucketed by month
      const snapshots = sanitizeSnapshots(
        await storage.getPortfolioSnapshots(userId, ANCHOR, today),
        "investment-ytd"
      );
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
        anchorDate: ANCHOR.toISOString().split('T')[0],
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
      const { userId } = requireAuth(req);
      const totals = await calculatePortfolioTotalsAtDate(userId, new Date());
      const { fiatValue, cryptoValue, stablecoinValue, investmentValue, totalValue } = totals;

      res.json({
        fiat:       { value: fiatValue,        percentage: totalValue > 0 ? (fiatValue        / totalValue) * 100 : 0 },
        crypto:     { value: cryptoValue,       percentage: totalValue > 0 ? (cryptoValue      / totalValue) * 100 : 0 },
        stablecoin: { value: stablecoinValue,   percentage: totalValue > 0 ? (stablecoinValue  / totalValue) * 100 : 0 },
        investment: { value: investmentValue,   percentage: totalValue > 0 ? (investmentValue  / totalValue) * 100 : 0 },
        totalValue,
      });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get portfolio allocation" });
    }
  });

  // Real metrics for AI advisory — diversification score, expected return, rebalancing gap, period returns
  app.get("/api/portfolio/real-metrics", async (req, res) => {
    try {
      const { userId } = requireAuth(req);

      // Reuse the shared valuation engine for allocation fractions
      const totals = await calculatePortfolioTotalsAtDate(userId, new Date());
      const { fiatValue, cryptoValue, stablecoinValue, investmentValue, totalValue } = totals;

      // Get investment-level detail for hasUnpricedAssets flag
      const investmentTotals = await calculateInvestmentTotalsAtDate(userId, new Date());
      const hasUnpricedAssets = investmentTotals.hasUnpricedAssets;

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

      // Investment-weighted contracted return — based solely on explicit product annualReturn
      // values stored in the DB (no asset-class assumption blending for fiat/crypto/stablecoin).
      // null when no investments have an explicit rate.
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
      const hasProductRateCoverage = totalInvested > 0;
      const contractedInvestmentReturn: number | null = hasProductRateCoverage
        ? +(weightedInvReturn / totalInvested * 100).toFixed(2)
        : null;

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
      const snapshots = sanitizeSnapshots(
        await storage.getPortfolioSnapshots(userId, yearStart, now),
        "portfolio-summary"
      );
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
        // contractedInvestmentReturn: weighted average of explicit product annualReturn rates from DB.
        // null when no investments have explicit rates. Does NOT include assumption-based
        // rates for fiat/crypto/stablecoin asset classes.
        contractedInvestmentReturn,
        hasProductRateCoverage,
        rebalancingGap: +rebalancingGap.toFixed(1),
        historySource,
        hasSufficientHistory,
        hasMeaningfulHistory,
        snapshotCount: sorted.length,
        actualSnapshotCount,
        canComputeRiskMetrics,
        riskMetricsState,
        hasUnpricedAssets,
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
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("Real metrics error:", error);
      res.status(500).json({ error: "Failed to compute real metrics" });
    }
  });

  // Diagnostic: expose the in-memory system event log for integrity monitoring
  // Returns the last MAX_SYSTEM_EVENTS entries (most recent first)
  // Requires authentication — unauthenticated access would leak internal state.
  app.get("/api/system-events", async (req, res) => {
    try {
      requireAuth(req);
      res.json({ count: systemEventLog.length, events: systemEventLog });
    } catch (error: any) {
      if (error?.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to retrieve system events" });
    }
  });

  // Get user wallets
  app.get("/api/wallets", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      const wallets = await storage.getWallets(userId);
      res.json(wallets);
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get wallets" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(userId, limit);
      res.json(transactions);
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Get FX rates
  // Stale threshold — refresh runs every 15 min; if two cycles miss we flag as stale
  const FX_STALE_THRESHOLD_MS = 30 * 60 * 1000;

  function withStaleness(rate: any) {
    const updatedAt = rate.updatedAt ? new Date(rate.updatedAt) : null;
    const ageMs = updatedAt ? Date.now() - updatedAt.getTime() : null;
    return {
      ...rate,
      rateAgeMinutes: ageMs !== null ? Math.floor(ageMs / 60_000) : null,
      isStale: ageMs !== null ? ageMs > FX_STALE_THRESHOLD_MS : false,
    };
  }

  app.get("/api/fx-rates", async (req, res) => {
    try {
      const rates = await storage.getFxRates();
      res.json(rates.map(withStaleness));
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get FX rates" });
    }
  });

  // Get specific FX rate — with cross-rate derivation via USD when direct pair is missing.
  // This ensures EUR/GBP, EUR/JPY, GBP/CAD etc. always resolve even though only USD
  // and AUD cross-rates are stored in the DB as first-class rows.
  app.get("/api/fx-rates/:base/:target", async (req, res) => {
    try {
      const { base, target } = req.params;

      // 0. Same-currency shortcut — always rate 1
      if (base === target) {
        return res.json({ baseCurrency: base, targetCurrency: target, rate: "1.00000000", isStale: false, rateAgeMinutes: 0 });
      }

      // 1. Direct lookup
      const direct = await storage.getFxRate(base, target);
      if (direct) return res.json(withStaleness(direct));

      // 2. Inverse lookup — invert the stored rate
      const inverse = await storage.getFxRate(target, base);
      if (inverse) {
        const r = parseFloat(inverse.rate);
        if (r > 0) {
          return res.json(withStaleness({
            ...inverse,
            baseCurrency: base,
            targetCurrency: target,
            rate: (1 / r).toFixed(8),
          }));
        }
      }

      // 3. Derive via USD triangulation: rate(A/B) = rate(A/USD) / rate(B/USD)
      const [baseUsd, targetUsd] = await Promise.all([
        storage.getFxRate(base, "USD"),
        storage.getFxRate(target, "USD"),
      ]);
      if (baseUsd && targetUsd) {
        const bRate = parseFloat(baseUsd.rate);
        const tRate = parseFloat(targetUsd.rate);
        if (bRate > 0 && tRate > 0) {
          const derived = bRate / tRate;
          return res.json(withStaleness({
            ...baseUsd,
            baseCurrency: base,
            targetCurrency: target,
            rate: derived.toFixed(8),
          }));
        }
      }

      return res.status(404).json({ error: "FX rate not found" });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get FX rate" });
    }
  });

  // In-memory cache for YTD history (1 hour TTL per pair)
  const fxHistoryCache = new Map<string, { ts: number; data: unknown }>();
  const FX_HISTORY_TTL_MS = 60 * 60 * 1000; // 1 hour

  // Per-coin CoinGecko USD prices cache + global serial queue
  // CoinGecko free tier rate-limits concurrent requests.
  // We guarantee at most ONE CoinGecko HTTP request is in-flight at any time
  // using a serial promise chain, plus per-coin in-flight deduplication so
  // multiple requests for the same coin share the same result.
  const cryptoUsdPricesCache = new Map<string, { ts: number; prices: Map<string, number> }>();
  const cryptoUsdInFlight = new Map<string, Promise<Map<string, number>>>();
  const CRYPTO_USD_TTL_MS = 60 * 60 * 1000; // 1 hour
  let coinGeckoQueue: Promise<unknown> = Promise.resolve();

  // Enqueue fn so CoinGecko calls never overlap
  function serialCoinGecko<T>(fn: () => Promise<T>): Promise<T> {
    const next = coinGeckoQueue.then(fn, fn);
    coinGeckoQueue = next.then(() => {}, () => {});
    return next;
  }

  async function getCoinGeckoUsdPrices(
    coinId: string,
    startOfYear: string,
    today: string,
    dayCount: number,
    fetchCoinGecko: (url: string) => Promise<Response>
  ): Promise<Map<string, number>> {
    // 1. Serve from cache if fresh
    const cached = cryptoUsdPricesCache.get(coinId);
    if (cached && Date.now() - cached.ts < CRYPTO_USD_TTL_MS) return cached.prices;

    // 2. Deduplicate concurrent requests for the same coin
    const inFlight = cryptoUsdInFlight.get(coinId);
    if (inFlight) return inFlight;

    // 3. Enqueue the actual CoinGecko request (serial — no two HTTP calls overlap)
    const promise = serialCoinGecko(async (): Promise<Map<string, number>> => {
      // Re-check cache inside the queue in case another request populated it while waiting
      const recheck = cryptoUsdPricesCache.get(coinId);
      if (recheck && Date.now() - recheck.ts < CRYPTO_USD_TTL_MS) {
        cryptoUsdInFlight.delete(coinId);
        return recheck.prices;
      }

      try {
        const cgRes = await fetchCoinGecko(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${dayCount}&interval=daily`
        );
        if (!cgRes.ok) return new Map();
        const cgData = await cgRes.json() as { prices: [number, number][] };
        const map = new Map<string, number>();
        for (const [ts, price] of cgData.prices) {
          const date = new Date(ts).toISOString().split("T")[0];
          if (date >= startOfYear && date <= today) map.set(date, price);
        }
        cryptoUsdPricesCache.set(coinId, { ts: Date.now(), prices: map });
        return map;
      } finally {
        cryptoUsdInFlight.delete(coinId);
      }
    });

    cryptoUsdInFlight.set(coinId, promise);
    return promise;
  }

  // YTD historical FX rate data — real market data
  // Fiat pairs: Frankfurter.app (ECB data, same source as live rates)
  // Crypto pairs: CoinGecko free API
  app.get("/api/fx-history/:base/:target", async (req, res) => {
    const { base, target } = req.params;
    const cacheKey = `${base}/${target}`;
    const cached = fxHistoryCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < FX_HISTORY_TTL_MS) {
      return res.json(cached.data);
    }

    const now = new Date();
    const startOfYear = `${now.getFullYear()}-01-01`;
    const today = now.toISOString().split("T")[0];

    // Stablecoins use Frankfurter (pegged to $1 USD — no CoinGecko needed)
    const STABLECOINS = new Set(["USDT", "USDC"]);

    const CRYPTO_IDS: Record<string, string> = {
      BTC: "bitcoin",
      ETH: "ethereum",
    };

    // Helper: fetch CoinGecko with one retry on rate-limit
    async function fetchCoinGecko(url: string): Promise<Response> {
      const r1 = await fetch(url, { headers: { "Accept": "application/json" } });
      if (r1.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetch(url, { headers: { "Accept": "application/json" } });
      }
      return r1;
    }

    // Helper: build and cache a successful response
    const sendCached = (payload: unknown) => {
      fxHistoryCache.set(cacheKey, { ts: Date.now(), data: payload });
      return res.json(payload);
    };

    try {
      // ── Same-currency or stablecoin-vs-USD: flat 1.0 line ───────────────────
      const baseIsStable   = STABLECOINS.has(base);
      const targetIsStable = STABLECOINS.has(target);
      const baseUsd  = base   === "USD" || baseIsStable;
      const targetUsd = target === "USD" || targetIsStable;

      if (baseUsd && targetUsd) {
        // Both sides resolve to USD — synthetic flat 1.0 line (daily, YTD)
        const points: { date: string; rate: number }[] = [];
        const d = new Date(startOfYear + "T12:00:00Z");
        const end = new Date(today + "T12:00:00Z");
        while (d <= end) {
          points.push({ date: d.toISOString().split("T")[0], rate: 1 });
          d.setUTCDate(d.getUTCDate() + 1);
        }
        return sendCached({ base, target, points });
      }

      // ── Stablecoins vs a real fiat: mirror USD via Frankfurter ───────────────
      if (baseIsStable || targetIsStable) {
        const ffBase   = baseIsStable  ? "USD" : base;
        const ffTarget = targetIsStable ? "USD" : target;
        const ffRes = await fetch(
          `https://api.frankfurter.app/${startOfYear}..${today}?from=${ffBase}&to=${ffTarget}`
        );
        if (!ffRes.ok) return res.status(502).json({ error: "Frankfurter unavailable" });
        const ffData = await ffRes.json() as { rates: Record<string, Record<string, number>> };
        const points = Object.entries(ffData.rates)
          .map(([date, rates]) => ({ date, rate: rates[ffTarget] ?? 0 }))
          .sort((a, b) => a.date.localeCompare(b.date));
        return sendCached({ base, target, points });
      }

      // ── Volatile crypto pairs ─────────────────────────────────────────────────
      // Strategy: always fetch CoinGecko vs USD (most stable, cached), then
      // triangulate to any other fiat via Frankfurter USD→target series.
      // This means ONE CoinGecko call per coin regardless of display currency.
      const cryptoBase   = CRYPTO_IDS[base];
      const cryptoTarget = CRYPTO_IDS[target];

      const dayCount = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Helper: fetch daily Frankfurter USD→fiatTarget rates
      async function fetchUsdToFiatSeries(fiatTarget: string): Promise<Map<string, number>> {
        if (fiatTarget === "USD") {
          // USD/USD is always 1.0 — no network call needed
          const map = new Map<string, number>();
          const d = new Date(startOfYear + "T12:00:00Z");
          const end = new Date(today + "T12:00:00Z");
          while (d <= end) {
            map.set(d.toISOString().split("T")[0], 1);
            d.setUTCDate(d.getUTCDate() + 1);
          }
          return map;
        }
        const ffRes = await fetch(
          `https://api.frankfurter.app/${startOfYear}..${today}?from=USD&to=${fiatTarget}`,
          { headers: { "Accept": "application/json" } }
        );
        if (!ffRes.ok) return new Map();
        const ffData = await ffRes.json() as { rates: Record<string, Record<string, number>> };
        const map = new Map<string, number>();
        for (const [date, vals] of Object.entries(ffData.rates)) {
          if (vals[fiatTarget]) map.set(date, vals[fiatTarget]);
        }
        return map;
      }

      // Helper: forward-fill missing fiat dates (ECB has no weekends/holidays)
      function forwardFill(cryptoDates: string[], fiatMap: Map<string, number>): Map<string, number> {
        const filled = new Map<string, number>();
        let last = 0;
        for (const date of cryptoDates.sort()) {
          const v = fiatMap.get(date);
          if (v !== undefined) last = v;
          if (last > 0) filled.set(date, last);
        }
        return filled;
      }

      // Crypto as base (BTC/AUD, ETH/AUD, BTC/USD, ETH/USD, BTC/EUR…)
      if (cryptoBase) {
        const [cryptoUsd, usdToTarget] = await Promise.all([
          getCoinGeckoUsdPrices(cryptoBase, startOfYear, today, dayCount, fetchCoinGecko),
          fetchUsdToFiatSeries(target),
        ]);
        if (cryptoUsd.size === 0) return res.status(502).json({ error: "CoinGecko unavailable" });

        const filledFiat = forwardFill([...cryptoUsd.keys()], usdToTarget);
        const points: { date: string; rate: number }[] = [];
        for (const [date, usdPrice] of [...cryptoUsd.entries()].sort(([a], [b]) => a.localeCompare(b))) {
          const fiatRate = filledFiat.get(date) ?? 1;
          points.push({ date, rate: usdPrice * fiatRate });
        }
        return sendCached({ base, target, points });
      }

      // Crypto as target (USD/BTC, AUD/BTC, EUR/BTC, etc.) — invert
      if (cryptoTarget) {
        const [cryptoUsd, usdToBase] = await Promise.all([
          getCoinGeckoUsdPrices(cryptoTarget, startOfYear, today, dayCount, fetchCoinGecko),
          fetchUsdToFiatSeries(base),
        ]);
        if (cryptoUsd.size === 0) return res.status(502).json({ error: "CoinGecko unavailable" });

        // base/crypto = (base/USD) × (USD/crypto) = (1/usdToBase) × (1/cryptoUsd)
        // actually base→crypto: how much crypto does 1 unit of base buy?
        // 1 base = (1/usdToBase) USD; 1 crypto = cryptoUsd USD → 1 base = (1/usdToBase)/cryptoUsd crypto
        const filledFiat = forwardFill([...cryptoUsd.keys()], usdToBase);
        const points: { date: string; rate: number }[] = [];
        for (const [date, usdPrice] of [...cryptoUsd.entries()].sort(([a], [b]) => a.localeCompare(b))) {
          if (usdPrice <= 0) continue;
          const baseToUsd = filledFiat.get(date) ?? 1;
          points.push({ date, rate: baseToUsd > 0 ? (1 / baseToUsd) / usdPrice : 0 });
        }
        return sendCached({ base, target, points });
      }

      // ── Fiat pairs via Frankfurter.app ─────────────────────────────────────
      const ffRes = await fetch(
        `https://api.frankfurter.app/${startOfYear}..${today}?from=${base}&to=${target}`,
        { headers: { "Accept": "application/json" } }
      );
      if (!ffRes.ok) {
        // Try inverse then invert values
        const invRes = await fetch(
          `https://api.frankfurter.app/${startOfYear}..${today}?from=${target}&to=${base}`,
          { headers: { "Accept": "application/json" } }
        );
        if (!invRes.ok) return res.status(502).json({ error: "Frankfurter unavailable" });
        const invData = await invRes.json() as { rates: Record<string, Record<string, number>> };
        const points = Object.entries(invData.rates)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, vals]) => ({ date, rate: vals[base] ? 1 / vals[base] : null }))
          .filter((p) => p.rate !== null);
        return sendCached({ base, target, points });
      }
      const ffData = await ffRes.json() as { rates: Record<string, Record<string, number>> };
      const points = Object.entries(ffData.rates)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({ date, rate: vals[target] ?? null }))
        .filter((p) => p.rate !== null);
      return sendCached({ base, target, points });

    } catch (err) {
      console.error("[fx-history] error:", (err as Error).message);
      res.status(500).json({ error: "Failed to fetch historical FX data" });
    }
  });

  // Get AI recommendations
  app.get("/api/ai-recommendations", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      const recommendations = await storage.getAiRecommendations(userId);
      res.json(recommendations);
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get AI recommendations" });
    }
  });

  // Generate personalized AI recommendations based on risk profile
  app.post("/api/ai-recommendations/generate", async (req, res) => {
    try {
      const { riskTolerance, investmentHorizon, investmentGoal } = req.body;
      const { userId } = requireAuth(req);
      
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
          const investmentDate = new Date(investment.investmentDate ?? Date.now());
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, evaluationDate);
          investmentValue += performance.currentValue ?? 0;
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
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("AI recommendations error:", error);
      res.status(500).json({ error: "Failed to generate AI recommendations" });
    }
  });

  // ---------------------------------------------------------------------------
  // FX Exchange — atomic SERIALIZABLE transaction + Decimal + DB idempotency
  // ---------------------------------------------------------------------------
  app.post("/api/fx-exchange", moneyMovementLimiter, async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);

      const parsed = fxExchangeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }
      const { fromCurrency, toCurrency, amount: rawAmount } = parsed.data;
      const amount = new Decimal(rawAmount);

      // Enforce risk-based daily transaction limit
      await checkDailyLimit(userId, amount, fromCurrency);

      // DB-backed idempotency check
      const idemKey = req.headers["idempotency-key"] as string | undefined;
      const payloadHash = hashPayload(req.body);
      if (idemKey) {
        const idem = await checkIdempotency(userId, "/api/fx-exchange", idemKey, payloadHash);
        if (idem.conflict) return res.status(422).json({ error: "Idempotency-Key reused with a different request payload." });
        if (idem.existing) return res.json({ ...(idem.response as object), idempotent: true });
      }

      if (fromCurrency === toCurrency) {
        return res.status(400).json({ error: "From and To currencies must be different" });
      }

      // Look up rate directly; fall back to USD triangulation for cross-pairs not in DB
      let rateValue: string | null = null;
      const directRate = await storage.getFxRate(fromCurrency, toCurrency);
      if (directRate) {
        rateValue = directRate.rate;
      } else {
        // Triangulate via USD: from→USD × USD→to
        const fromUsd = await storage.getFxRate(fromCurrency, "USD");
        const usdTo   = await storage.getFxRate("USD", toCurrency);
        if (fromUsd && usdTo) {
          rateValue = new Decimal(fromUsd.rate).mul(usdTo.rate).toFixed(8);
        }
      }
      if (!rateValue) return res.status(400).json({ error: "Exchange rate not available for this pair" });

      const rate = directRate ?? { rate: rateValue, spread: "0.005" };

      // Ensure target wallet exists before entering transaction
      const existingToWallet = await storage.getWallet(userId, toCurrency);
      if (!existingToWallet) {
        await storage.createWallet({
          userId, currency: toCurrency, balance: "0.00", availableBalance: "0.00",
          walletType: CRYPTO_CURRENCIES.includes(toCurrency) ? "crypto" : "fiat",
        });
      }

      const exchangeRate = new Decimal(rate.rate);
      const converted = amount.mul(exchangeRate);
      const fee = converted.mul("0.005");
      const netConverted = converted.minus(fee);

      let txRecord: any;
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

        const [fromWallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.currency, fromCurrency)))
          .for("update");
        if (!fromWallet) throw Object.assign(new Error("Source wallet not found"), { status: 404 });

        const available = new Decimal(fromWallet.availableBalance);
        if (available.lt(amount)) throw Object.assign(new Error("Insufficient balance"), { status: 400 });

        validateTransaction({ type: "exchange", amount: amount.toNumber(), fromCurrency, toCurrency, exchangeRate: exchangeRate.toNumber() });

        const [toWallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.currency, toCurrency)))
          .for("update");
        if (!toWallet) throw Object.assign(new Error("Target wallet not found"), { status: 404 });

        await tx.update(wallets)
          .set({ balance: new Decimal(fromWallet.balance).minus(amount).toFixed(8), availableBalance: available.minus(amount).toFixed(8) })
          .where(eq(wallets.id, fromWallet.id));

        await tx.update(wallets)
          .set({ balance: new Decimal(toWallet.balance).plus(netConverted).toFixed(8), availableBalance: new Decimal(toWallet.availableBalance).plus(netConverted).toFixed(8) })
          .where(eq(wallets.id, toWallet.id));

        [txRecord] = await tx.insert(transactions).values({
          userId, type: "exchange", fromCurrency, toCurrency,
          amount: amount.toFixed(8), fee: fee.toFixed(8),
          exchangeRate: exchangeRate.toFixed(8), status: "completed",
          settlementStatus: "internal_only",
          description: `${fromCurrency} to ${toCurrency} Exchange`,
          sourceExchange: null, blockchainTxHash: null,
          assetType: classifyAssetType(fromCurrency, toCurrency),
          direction: "exchange",
          riskFlag: false,
          reviewStatus: "clear",
          reviewNotes: null,
        }).returning();
      });

      await runAmlCheck(userId, txRecord?.id, amount, classifyAssetType(fromCurrency, toCurrency), "exchange");

      const responseBody = { transaction: txRecord, convertedAmount: netConverted.toNumber(), exchangeRate: exchangeRate.toNumber(), fee: fee.toNumber() };
      if (idemKey) await saveIdempotentResponse(userId, "/api/fx-exchange", idemKey, payloadHash, responseBody);
      await writeAuditLog(userId, "fx_exchange", "transaction", String(txRecord?.id), { fromCurrency, toCurrency, amount: rawAmount }, req.ip || null);
      res.json(responseBody);
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to process FX exchange" });
    }
  });

  // ---------------------------------------------------------------------------
  // Deposit — shared handler used by both canonical and legacy routes.
  // Internal operation: write completed atomically; no pending pre-insert.
  // ---------------------------------------------------------------------------
  const handleDeposit = async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);
      const parsedDeposit = depositSchema.safeParse(req.body);

      if (!parsedDeposit.success) return res.status(400).json({ error: parsedDeposit.error.errors[0].message });
      const { currency, amount: rawAmount, description, method, payerName, payerBsb, payerAccountNumber, payerPayId } = parsedDeposit.data;
      const amount = new Decimal(rawAmount);

      // Enforce risk-based daily transaction limit before processing
      await checkDailyLimit(userId, amount, currency);

      // Card deposits must use the Checkout.com hosted payment route — never this handler.
      // Accepting card deposits here would credit balances without real payment confirmation.
      if ((method as string) === "card") {
        return res.status(400).json({
          error: "Card deposits must use the Checkout.com hosted payment flow. Use POST /api/checkout/create-payment-link.",
        });
      }

      // Bank transfer and PayID deposits are pending until AMAX confirms receipt.
      // Balance is NOT credited immediately — only credited by admin confirmation
      // or banking webhook (e.g. Airwallex/Monoova NPP webhook in production).
      const isPendingChannel = method === "bank_transfer" || method === "payid";

      const idemKey = req.headers["idempotency-key"] as string | undefined;
      const payloadHash = hashPayload(req.body);
      if (idemKey) {
        const idem = await checkIdempotency(userId, "/api/deposit", idemKey, payloadHash);
        if (idem.conflict) return res.status(422).json({ error: "Idempotency-Key reused with a different request payload." });
        if (idem.existing) return res.json({ ...(idem.response as object), idempotent: true });
      }

      let txRecord: any;
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        const [wallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.currency, currency)))
          .for("update");
        if (!wallet) throw Object.assign(new Error("Wallet not found"), { status: 404 });

        // Only credit balance immediately for confirmed channels (not bank/PayID).
        if (!isPendingChannel) {
          await tx.update(wallets).set({
            balance: new Decimal(wallet.balance).plus(amount).toFixed(8),
            availableBalance: new Decimal(wallet.availableBalance).plus(amount).toFixed(8),
          }).where(eq(wallets.id, wallet.id));
        }

        const channelLabel = method === "bank_transfer"
          ? "Bank Transfer"
          : method === "payid"
          ? "PayID"
          : "Transfer";

        const referenceCode = `AMAX-${randomBytes(4).toString("hex").toUpperCase()}`;

        [txRecord] = await tx.insert(transactions).values({
          userId, type: "deposit", fromCurrency: null, toCurrency: currency,
          amount: amount.toFixed(8), fee: "0.00000000", exchangeRate: null,
          status: isPendingChannel ? "pending" : "completed",
          settlementStatus: isPendingChannel ? "awaiting_bank_confirmation" : "internal_only",
          description: isPendingChannel
            ? JSON.stringify({
                method,
                currency,
                referenceCode,
                label: `${currency} ${channelLabel} Deposit`,
                // AML originator fields — retained for 7 years per AML/CTF Act 2006 s.106
                payer: {
                  name: payerName ?? null,
                  bsb: payerBsb ?? null,
                  accountNumber: payerAccountNumber ?? null,
                  payId: payerPayId ?? null,
                },
              })
            : (description || `${currency} ${channelLabel} Deposit`),
          sourceExchange: method ?? null, blockchainTxHash: null,
          assetType: classifyAssetType(null, currency),
          direction: "in",
          riskFlag: amount.gte(10000),
          reviewStatus: amount.gte(10000) ? "flagged" : "clear",
          reviewNotes: amount.gte(10000) ? "AUSTRAC threshold — manual review required" : null,
        }).returning();
      });

      if (idemKey) await saveIdempotentResponse(userId, "/api/deposit", idemKey, payloadHash, txRecord);
      await writeAuditLog(userId, "deposit", "transaction", String(txRecord?.id), { currency, amount: rawAmount, method }, req.ip || null);

      // TTR auto-flag — AUSTRAC mandatory reporting for cash deposits >= AUD $10,000 equivalent.
      if (amount.gte(10000)) {
        try {
          await db.insert(complianceActions).values({
            userId,
            transactionId: txRecord?.id ?? null,
            actionType: "ttr",
            performedBy: "system",
            notes: `Auto-flagged: ${currency} deposit of ${rawAmount} meets or exceeds AUD $10,000 AUSTRAC TTR threshold. Pending review by Compliance Officer.`,
            outcome: null,
            austracRef: null,
          });
        } catch (flagErr: any) {
          console.error("[ttr-auto-flag-deposit] failed:", flagErr.message);
        }
      }

      // Run AML rules (large transactions, fiat-crypto conversions, etc.)
      await runAmlCheck(userId, txRecord?.id, amount, classifyAssetType(null, currency), "deposit");

      let referenceCode: string | undefined;
      try { referenceCode = JSON.parse(txRecord.description ?? "{}").referenceCode; } catch {}
      res.json({ ...txRecord, referenceCode });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("[deposit-error]", error?.message ?? error);
      res.status(500).json({ error: error?.message ?? "Failed to process deposit" });
    }
  };

  app.post("/api/deposit", moneyMovementLimiter, handleDeposit);
  app.post("/api/wallets/deposit", moneyMovementLimiter, handleDeposit);

  // ---------------------------------------------------------------------------
  // Withdraw — shared handler used by both canonical and legacy routes.
  // Internal operation: write completed atomically; no pending pre-insert.
  // ---------------------------------------------------------------------------
  const handleWithdraw = async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);
      const parsedWithdraw = withdrawSchema.safeParse(req.body);
      if (!parsedWithdraw.success) return res.status(400).json({ error: parsedWithdraw.error.errors[0].message });
      const {
        currency, amount: rawAmount, description,
        withdrawMethod, bankAccountName, bankBsb, bankAccountNumber, bankSwift, bankName,
        payid: payidIdentifier, payidAccountName, purposeOfTransfer,
      } = parsedWithdraw.data;
      const amount = new Decimal(rawAmount);

      // This endpoint handles fiat wire withdrawals only.
      // Crypto assets (BTC, ETH, USDT, USDC) must not use this route — a flat
      // fiat fee (e.g. 25 USD) applied to a BTC withdrawal would be catastrophic.
      const CRYPTO_CURRENCIES = new Set(["BTC", "ETH", "USDT", "USDC", "LTC", "XRP"]);
      if (CRYPTO_CURRENCIES.has(currency)) {
        throw Object.assign(
          new Error("Crypto withdrawals are not supported via this route. Use the crypto withdrawal channel."),
          { status: 400 }
        );
      }

      // Enforce risk-based daily transaction limit before processing
      await checkDailyLimit(userId, amount, currency);

      // Currency-aware fiat wire fee table (flat fee per withdrawal, in native currency).
      // These represent typical correspondent banking / SWIFT wire charges.
      const WITHDRAWAL_FEES: Record<string, string> = {
        USD: "25.00",
        EUR: "20.00",
        GBP: "18.00",
        AUD: "35.00",
        CAD: "30.00",
        HKD: "200.00",
        SGD: "30.00",
        CNY: "150.00",
        JPY: "2500.00",
        CHF: "22.00",
        NZD: "35.00",
      };
      const feeAmount = WITHDRAWAL_FEES[currency] ?? "25.00";
      const fee = new Decimal(feeAmount);
      const totalDeduction = amount.plus(fee);

      const idemKey = req.headers["idempotency-key"] as string | undefined;
      const payloadHash = hashPayload(req.body);
      if (idemKey) {
        const idem = await checkIdempotency(userId, "/api/withdraw", idemKey, payloadHash);
        if (idem.conflict) return res.status(422).json({ error: "Idempotency-Key reused with a different request payload." });
        if (idem.existing) return res.json({ ...(idem.response as object), idempotent: true });
      }

      let txRecord: any;
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        const [wallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.currency, currency)))
          .for("update");
        if (!wallet) throw Object.assign(new Error("Wallet not found"), { status: 404 });

        const available = new Decimal(wallet.availableBalance);
        if (available.lt(totalDeduction)) throw Object.assign(new Error("Insufficient balance"), { status: 400 });

        // Reserve funds: only deduct availableBalance now (shows user funds are spoken for).
        // The actual balance will be reduced by the admin /complete-withdrawal endpoint
        // once the payout is confirmed. This avoids balance going negative prematurely
        // and allows refunds on failure without double-crediting.
        await tx.update(wallets).set({
          availableBalance: available.minus(totalDeduction).toFixed(8),
        }).where(eq(wallets.id, wallet.id));

        const withdrawRef = `AMAX-W${randomBytes(4).toString("hex").toUpperCase()}`;
        const withdrawMeta = JSON.stringify({
          method: withdrawMethod ?? "bank_transfer",
          referenceCode: withdrawRef,
          ...(withdrawMethod === "payid"
            ? { payid: payidIdentifier, accountName: payidAccountName }
            : { accountName: bankAccountName, bsb: bankBsb, accountNumber: bankAccountNumber, swift: bankSwift, bank: bankName }),
        });

        [txRecord] = await tx.insert(transactions).values({
          userId, type: "withdrawal", fromCurrency: currency, toCurrency: null,
          amount: amount.toFixed(8), fee: fee.toFixed(8), exchangeRate: null,
          status: "pending", settlementStatus: "awaiting_payout",
          description: withdrawMeta,
          sourceExchange: null, blockchainTxHash: null,
          assetType: classifyAssetType(currency, null),
          direction: "out",
          purposeOfTransfer: purposeOfTransfer ?? null,
          riskFlag: amount.gte(10000),
          reviewStatus: amount.gte(10000) ? "flagged" : "clear",
          reviewNotes: amount.gte(10000) ? "AUSTRAC threshold — manual review required" : null,
        }).returning();
        txRecord = { ...txRecord, referenceCode: withdrawRef };
      });

      if (idemKey) await saveIdempotentResponse(userId, "/api/withdraw", idemKey, payloadHash, txRecord);
      await writeAuditLog(userId, "withdrawal", "transaction", String(txRecord?.id), { currency, amount: rawAmount }, req.ip || null);

      // TTR auto-flag — AUSTRAC mandatory reporting for cash transactions >= AUD $10,000 equivalent.
      // Creates a pending complianceActions record for the Compliance Officer (Qin Xiong) to review and file.
      if (amount.gte(10000)) {
        try {
          await db.insert(complianceActions).values({
            userId,
            transactionId: txRecord?.id ?? null,
            actionType: "ttr",
            performedBy: "system",
            notes: `Auto-flagged: ${currency} withdrawal of ${rawAmount} meets or exceeds AUD $10,000 AUSTRAC TTR threshold. Pending review by Compliance Officer.`,
            outcome: null,
            austracRef: null,
          });
        } catch (flagErr: any) {
          console.error("[ttr-auto-flag] failed to insert complianceActions:", flagErr.message);
        }
      }

      // Run AML rules (large transactions, fiat-crypto conversions, etc.)
      await runAmlCheck(userId, txRecord?.id, amount, classifyAssetType(currency, null), "withdrawal");

      res.json(txRecord);
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  };

  app.post("/api/withdraw", moneyMovementLimiter, handleWithdraw);
  app.post("/api/wallets/withdraw", moneyMovementLimiter, handleWithdraw);

  // Mark AI recommendation as read
  app.patch("/api/ai-recommendations/:id/read", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      const id = parseInt(req.params.id);
      if (!Number.isFinite(id)) throw Object.assign(new Error("Invalid recommendation id"), { status: 400 });
      await storage.markRecommendationAsRead(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to mark recommendation as read" });
    }
  });

  // Apply AI recommendation
  app.post("/api/ai-recommendations/:id/apply", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      const id = parseInt(req.params.id);
      if (!Number.isFinite(id)) throw Object.assign(new Error("Invalid recommendation id"), { status: 400 });
      await storage.markRecommendationAsRead(id, userId);
      res.json({ 
        success: true, 
        message: "Recommendation applied successfully",
        appliedAt: new Date().toISOString()
      });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
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
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
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
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get investment product" });
    }
  });



  // Get user investments with real-time performance calculation
  app.get("/api/user-investments", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      const investments = await storage.getUserInvestments(userId);
      const allProducts = await storage.getInvestmentProducts();
      const currentDate = new Date();
      
      // Calculate current values with performance using unified midpoint IRR function
      const investmentsWithPerformance = investments.map(investment => {
        const product = allProducts.find(p => p.id === investment.productId);
        if (!product) return investment;
        
        const investmentDate = new Date(investment.investmentDate ?? Date.now());
        const investedAmount = parseFloat(investment.investedAmount);
        const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate);
        
        return {
          ...investment,
          currentValue: performance.currentValue != null ? performance.currentValue.toFixed(2) : null,
          totalReturn: performance.returnAmount.toFixed(2),
          returnPercent: performance.returnPercentage.toFixed(2),
          ...(performance.valuationStatus ? { valuationStatus: performance.valuationStatus } : {})
        };
      });
      
      res.json(investmentsWithPerformance);
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to get user investments" });
    }
  });

  // Get investment performance by period with predictions
  app.get("/api/investment-performance", async (req, res) => {
    try {
      const { timeframe = "1Y" } = req.query;
      const { userId } = requireAuth(req);
      
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
            const investmentDate = new Date(investment.investmentDate ?? Date.now());
            if (investmentDate <= currentDate) {
              const investedAmount = parseFloat(investment.investedAmount);
              const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate);
              
              totalInvestmentValue += performance.currentValue ?? 0;
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
          const investmentDate = new Date(investment.investmentDate ?? Date.now());
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, endDate);
          const currentValue = performance.currentValue ?? 0;
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
          const investmentDate = new Date(investment.investmentDate ?? Date.now());
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, endDate);
          
          totalInvestedNow += investedAmount;
          totalCurrentValueNow += performance.currentValue ?? 0;
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
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("Investment performance error:", error);
      res.status(500).json({ error: "Failed to get investment performance" });
    }
  });

  // Get investment breakdown by category
  app.get("/api/investment-breakdown", async (req, res) => {
    try {
      const { userId } = requireAuth(req);
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
        categoryMap[item.category].value += item.currentValue ?? 0;
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
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to fetch investment breakdown" });
    }
  });

  // ---------------------------------------------------------------------------
  // Investments — atomic SERIALIZABLE transaction + Decimal + DB idempotency
  // ---------------------------------------------------------------------------
  app.post("/api/investments", moneyMovementLimiter, async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);
      const parsedInvestment = investmentSchema.safeParse(req.body);
      if (!parsedInvestment.success) return res.status(400).json({ error: parsedInvestment.error.errors[0].message });
      const { productId, amount: rawAmount, sourceCurrency = "USD", sourceAmount: rawSourceAmount } = parsedInvestment.data;

      const product = await storage.getInvestmentProduct(productId);
      if (!product) return res.status(400).json({ error: "Investment product not found" });

      const investmentAmount = new Decimal(rawAmount);
      const deductionAmount = rawSourceAmount ? new Decimal(rawSourceAmount) : investmentAmount;
      const currency = sourceCurrency || "USD";

      // Enforce risk-based daily transaction limit
      await checkDailyLimit(userId, deductionAmount, currency);
      const minimumInvestment = new Decimal(product.minimumInvestment);

      if (investmentAmount.lt(minimumInvestment)) {
        return res.status(400).json({ error: `Minimum investment is $${minimumInvestment.toFixed(2)}` });
      }

      const idemKey = req.headers["idempotency-key"] as string | undefined;
      const payloadHash = hashPayload(req.body);
      if (idemKey) {
        const idem = await checkIdempotency(userId, "/api/investments", idemKey, payloadHash);
        if (idem.conflict) return res.status(422).json({ error: "Idempotency-Key reused with a different request payload." });
        if (idem.existing) return res.json({ ...(idem.response as object), idempotent: true });
      }

      const exchangeRateStr = currency !== "USD" ? investmentAmount.div(deductionAmount).toFixed(8) : null;

      let txRecord: any;
      let investRecord: any;
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        const [sourceWallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.currency, currency))).for("update");
        if (!sourceWallet) throw Object.assign(new Error(`${currency} wallet not found`), { status: 400 });

        const available = new Decimal(sourceWallet.availableBalance);
        if (available.lt(deductionAmount)) throw Object.assign(
          new Error(`Insufficient balance. Available: ${available.toFixed(2)} ${currency}`), { status: 400 }
        );

        await tx.update(wallets).set({
          balance: new Decimal(sourceWallet.balance).minus(deductionAmount).toFixed(8),
          availableBalance: available.minus(deductionAmount).toFixed(8),
        }).where(eq(wallets.id, sourceWallet.id));

        [txRecord] = await tx.insert(transactions).values({
          userId, type: "investment", fromCurrency: currency,
          toCurrency: currency === "USD" ? null : "USD",
          amount: deductionAmount.toFixed(8), fee: "0.00000000",
          exchangeRate: exchangeRateStr, status: "completed",
          settlementStatus: "internal_only",
          description: `Investment in ${product.name}${currency !== "USD" ? ` (converted from ${currency})` : ""}`,
          sourceExchange: null, blockchainTxHash: null,
          assetType: classifyAssetType(currency, "USD"),
          direction: "out",
          riskFlag: false,
          reviewStatus: "clear",
          reviewNotes: null,
        }).returning();

        const [inv] = await tx.insert(userInvestments).values({
          userId, productId,
          investedAmount: investmentAmount.toFixed(2),
          currentValue: investmentAmount.toFixed(2),
          totalReturn: "0.00",
          returnPercent: "0.00",
          status: "active",
          maturityDate: null,
        }).returning();
        investRecord = inv;
      });

      await saveActualSnapshot(userId);
      const responseBody = { investment: investRecord, transaction: txRecord, newBalance: deductionAmount.toString(), sourceCurrency: currency, message: "Investment created successfully" };
      if (idemKey) await saveIdempotentResponse(userId, "/api/investments", idemKey, payloadHash, responseBody);
      await writeAuditLog(userId, "investment_created", "investment", String(investRecord?.id), { productId, amount: rawAmount, currency }, req.ip || null);
      res.json(responseBody);
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to create investment" });
    }
  });

  // ---------------------------------------------------------------------------
  // Wallet Transfer — atomic SERIALIZABLE + Zod + Decimal + DB idempotency
  // (previously had no validation, no atomicity, no decimal math)
  // ---------------------------------------------------------------------------
  app.post("/api/wallets/transfer", moneyMovementLimiter, async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);
      const parsedTransfer = walletTransferSchema.safeParse(req.body);
      if (!parsedTransfer.success) return res.status(400).json({ error: parsedTransfer.error.errors[0].message });
      const { fromCurrency, toCurrency, amount: rawAmount } = parsedTransfer.data;
      const amount = new Decimal(rawAmount);

      // Enforce risk-based daily transaction limit
      await checkDailyLimit(userId, amount, fromCurrency);

      const idemKey = req.headers["idempotency-key"] as string | undefined;
      const payloadHash = hashPayload(req.body);
      if (idemKey) {
        const idem = await checkIdempotency(userId, "/api/wallets/transfer", idemKey, payloadHash);
        if (idem.conflict) return res.status(422).json({ error: "Idempotency-Key reused with a different request payload." });
        if (idem.existing) return res.json({ ...(idem.response as object), idempotent: true });
      }

      const rate = await storage.getFxRate(fromCurrency, toCurrency);
      if (!rate) return res.status(400).json({ error: `Exchange rate not found for ${fromCurrency} to ${toCurrency}` });
      const exchangeRate = new Decimal(rate.rate);

      // Ensure target wallet exists before entering the transaction
      const existingTarget = await storage.getWallet(userId, toCurrency);
      if (!existingTarget) {
        await storage.createWallet({
          userId, currency: toCurrency, balance: "0.00", availableBalance: "0.00",
          walletType: CRYPTO_CURRENCIES.includes(toCurrency) ? "crypto" : "fiat",
        });
      }

      const converted = amount.mul(exchangeRate);
      const fee = converted.mul("0.005");
      const finalAmount = converted.minus(fee);

      let txRecord: any;
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        const [srcWallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.currency, fromCurrency))).for("update");
        if (!srcWallet) throw Object.assign(new Error("Source wallet not found"), { status: 404 });

        const available = new Decimal(srcWallet.availableBalance);
        if (available.lt(amount)) throw Object.assign(new Error("Insufficient balance"), { status: 400 });

        validateTransaction({ type: "exchange", amount: amount.toNumber(), fromCurrency, toCurrency, exchangeRate: exchangeRate.toNumber() });

        const [tgtWallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.currency, toCurrency))).for("update");
        if (!tgtWallet) throw Object.assign(new Error("Target wallet not found"), { status: 404 });

        await tx.update(wallets).set({
          balance: new Decimal(srcWallet.balance).minus(amount).toFixed(8),
          availableBalance: available.minus(amount).toFixed(8),
        }).where(eq(wallets.id, srcWallet.id));

        await tx.update(wallets).set({
          balance: new Decimal(tgtWallet.balance).plus(finalAmount).toFixed(8),
          availableBalance: new Decimal(tgtWallet.availableBalance).plus(finalAmount).toFixed(8),
        }).where(eq(wallets.id, tgtWallet.id));

        [txRecord] = await tx.insert(transactions).values({
          userId, type: "exchange", fromCurrency, toCurrency,
          amount: amount.toFixed(8), fee: fee.toFixed(8),
          exchangeRate: exchangeRate.toFixed(8), status: "completed",
          settlementStatus: "internal_only",
          description: `Converted ${rawAmount} ${fromCurrency} to ${finalAmount.toFixed(8)} ${toCurrency}`,
          sourceExchange: null, blockchainTxHash: null,
          assetType: classifyAssetType(fromCurrency, toCurrency),
          direction: "exchange",
          riskFlag: false,
          reviewStatus: "clear",
          reviewNotes: null,
        }).returning();
      });

      const responseBody = { transaction: txRecord, exchangeRate: exchangeRate.toNumber(), convertedAmount: converted.toNumber(), fee: fee.toNumber(), finalAmount: finalAmount.toNumber() };
      if (idemKey) await saveIdempotentResponse(userId, "/api/wallets/transfer", idemKey, payloadHash, responseBody);
      await writeAuditLog(userId, "wallet_transfer", "transaction", String(txRecord?.id), { fromCurrency, toCurrency, amount: rawAmount }, req.ip || null);
      res.json(responseBody);
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to process transfer" });
    }
  });

  // ---------------------------------------------------------------------------
  // Internal Transfer — user-to-user crypto/fiat transfer on the AMAX ledger.
  // No external settlement; both sides recorded atomically; AUSTRAC-aware.
  // ---------------------------------------------------------------------------
  const internalTransferSchema = z.object({
    currency: z.string().min(1, "Currency is required"),
    amount: z.number().positive("Amount must be positive").max(9999999),
    recipientEmail: z.string().email("Invalid recipient email"),
  });

  app.post("/api/transfer/internal", moneyMovementLimiter, async (req, res) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);

      const parsed = internalTransferSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

      const { currency, amount: rawAmount, recipientEmail } = parsed.data;
      const amount = new Decimal(rawAmount);

      // Enforce risk-based daily transaction limit
      await checkDailyLimit(userId, amount, currency);

      // Prevent self-transfer
      const sender = await storage.getUser(userId);
      if (!sender) return res.status(404).json({ error: "Sender account not found" });
      if (sender.email.toLowerCase() === recipientEmail.toLowerCase()) {
        return res.status(400).json({ error: "You cannot transfer to your own account" });
      }

      // Resolve recipient
      const recipient = await storage.getUserByEmail(recipientEmail.toLowerCase());
      if (!recipient) return res.status(404).json({ error: "No AMAX account found for that email address" });

      // AUSTRAC: flag large transfers (>= AUD 10,000 equivalent — simplified: flag any currency >= 10000)
      const amlFlagged = amount.gte(10000);

      // Generate a shared reference ID linking both transaction records
      const referenceId = `ITX-${randomBytes(8).toString("hex").toUpperCase()}`;

      let senderTx: any;
      let recipientTx: any;

      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

        // Lock sender wallet
        const [senderWallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, userId), eq(wallets.currency, currency)))
          .for("update");
        if (!senderWallet) throw Object.assign(new Error(`You do not have a ${currency} wallet`), { status: 400 });

        const senderBalance = new Decimal(senderWallet.availableBalance);
        if (senderBalance.lt(amount)) {
          throw Object.assign(new Error("Insufficient balance for this transfer"), { status: 400 });
        }

        // Ensure recipient has a wallet for this currency; create one if not
        let [recipientWallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, recipient.id), eq(wallets.currency, currency)))
          .for("update");
        if (!recipientWallet) {
          const walletType = CRYPTO_CURRENCIES.includes(currency) ? "crypto" : "fiat";
          [recipientWallet] = await tx.insert(wallets).values({
            userId: recipient.id,
            currency,
            balance: "0.00000000",
            availableBalance: "0.00000000",
            walletType,
          }).returning();
        }

        // Debit sender
        await tx.update(wallets).set({
          balance: new Decimal(senderWallet.balance).minus(amount).toFixed(8),
          availableBalance: senderBalance.minus(amount).toFixed(8),
        }).where(eq(wallets.id, senderWallet.id));

        // Credit recipient
        await tx.update(wallets).set({
          balance: new Decimal(recipientWallet.balance).plus(amount).toFixed(8),
          availableBalance: new Decimal(recipientWallet.availableBalance).plus(amount).toFixed(8),
        }).where(eq(wallets.id, recipientWallet.id));

        // Sender transaction record (transfer_out)
        [senderTx] = await tx.insert(transactions).values({
          userId,
          type: "transfer",
          fromCurrency: currency,
          toCurrency: currency,
          amount: amount.toFixed(8),
          fee: "0.00000000",
          exchangeRate: "1.00000000",
          status: "completed",
          settlementStatus: "internal_only",
          description: `Internal transfer of ${rawAmount} ${currency} to ${recipient.email}`,
          sourceExchange: null,
          blockchainTxHash: null,
          assetType: CRYPTO_CURRENCIES.includes(currency) ? "crypto" : "fiat",
          direction: "out",
          riskFlag: amlFlagged,
          reviewStatus: amlFlagged ? "flagged" : "clear",
          reviewNotes: amlFlagged ? `Large internal transfer >= 10000 ${currency} — AUSTRAC threshold review` : null,
          referenceId,
          counterpartyUserId: recipient.id,
        }).returning();

        // Recipient transaction record (transfer_in)
        [recipientTx] = await tx.insert(transactions).values({
          userId: recipient.id,
          type: "transfer",
          fromCurrency: currency,
          toCurrency: currency,
          amount: amount.toFixed(8),
          fee: "0.00000000",
          exchangeRate: "1.00000000",
          status: "completed",
          settlementStatus: "internal_only",
          description: `Internal transfer received: ${rawAmount} ${currency} from ${sender.email}`,
          sourceExchange: null,
          blockchainTxHash: null,
          assetType: CRYPTO_CURRENCIES.includes(currency) ? "crypto" : "fiat",
          direction: "in",
          riskFlag: amlFlagged,
          reviewStatus: amlFlagged ? "flagged" : "clear",
          reviewNotes: amlFlagged ? `Large internal transfer >= 10000 ${currency} — AUSTRAC threshold review` : null,
          referenceId,
          counterpartyUserId: userId,
        }).returning();
      });

      await writeAuditLog(userId, "internal_transfer", "transaction", String(senderTx?.id), {
        currency, amount: rawAmount, recipientEmail, referenceId, amlFlagged,
      }, req.ip || null);

      res.json({
        success: true,
        referenceId,
        senderTransactionId: senderTx?.id,
        recipientTransactionId: recipientTx?.id,
        amount: rawAmount,
        currency,
        recipientEmail,
        message: `${rawAmount} ${currency} successfully transferred to ${recipientEmail}`,
      });
    } catch (error: any) {
      console.error("[internal-transfer-error]", error?.message ?? error);
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to process internal transfer" });
    }
  });

  // Advisor Contact Route
  app.post("/api/advisor/contact", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Resolve authenticated user if available (not required)
      let userId: number | null = null;
      let userEmail: string | null = null;
      try {
        const auth = requireAuth(req);
        userId = auth.userId;
        const [userRow] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
        userEmail = userRow?.email ?? null;
      } catch {
        // unauthenticated — still store the message for audit trail
      }

      await db.insert(advisorMessages).values({
        userId: userId ?? undefined,
        message: message.trim(),
        userEmail: userEmail ?? undefined,
      });

      await writeAuditLog(userId ?? 0, "advisor_contact", "advisor_messages", null, { messageLength: message.trim().length }, req.ip || null);

      res.json({
        success: true,
        message: "Your message has been received. Your wealth planner will contact you within 24 hours.",
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // ---------------------------------------------------------------------------
  // Password Reset — forgot-password generates a token; reset-password validates
  // it, hashes the new password, and marks the token used. Single-use, 1h TTL.
  // ---------------------------------------------------------------------------
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { username } = z.object({ username: z.string().min(1) }).parse(req.body);
      const [user] = await db.select().from(users).where(eq(users.username, username));
      // Always return 200 to prevent username enumeration
      if (!user) return res.json({ message: "If that account exists, a reset token has been generated." });

      // Expire any existing unused tokens for this user
      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.userId, user.id), sql`${passwordResetTokens.usedAt} IS NULL`));

      const token = randomBytes(32).toString("hex"); // raw token returned to user
      const tokenHash = createHash("sha256").update(token).digest("hex"); // hashed value stored in DB
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({ userId: user.id, token: tokenHash, expiresAt });

      await writeAuditLog(user.id, "password_reset_requested", "user", String(user.id), { username }, null);

      // Never expose the raw token outside isolated local development — in a real
      // deployment this would be emailed to the user. Only returned when isLocalDev
      // is true (NODE_ENV=development + APP_ENV=local or ALLOW_LOCAL_DEV_AUTH=true),
      // which is never satisfied by a shared staging server.
      if (isLocalDev) {
        return res.json({ message: "Reset token generated (dev mode).", resetToken: token });
      }
      res.json({ message: "If that account exists, a password reset link has been sent." });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message });
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      }).parse(req.body);

      // Hash incoming token before comparing — stored value is also a SHA-256 hash
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const [record] = await db.select().from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, tokenHash),
          sql`${passwordResetTokens.usedAt} IS NULL`,
          sql`${passwordResetTokens.expiresAt} > now()`
        ));

      if (!record) return res.status(400).json({ error: "Invalid or expired reset token." });

      const hashed = await hashPassword(newPassword);

      await db.transaction(async (tx) => {
        await tx.update(users).set({ password: hashed }).where(eq(users.id, record.userId));
        await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));
      });

      await writeAuditLog(record.userId, "password_reset_completed", "user", String(record.userId), {}, null);

      res.json({ message: "Password reset successfully." });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors[0].message });
      if (error.status) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // ---------------------------------------------------------------------------
  // Checkout.com — Real card payment processing via Checkout.com Hosted Payments
  // Flow: Frontend calls create-payment-link → redirects to Checkout.com hosted page
  //       → Checkout.com redirects back → webhook fires → balance credited
  // Requires env: CHECKOUT_SECRET_KEY, CHECKOUT_WEBHOOK_SECRET
  // Zero-decimal currencies (JPY, KRW): amount passed as whole units (no cents).
  // ---------------------------------------------------------------------------

  // Currencies where the amount is the whole unit (no minor units / cents)
  const CHECKOUT_ZERO_DECIMAL = new Set(["JPY", "KRW", "BIF", "CLP", "GNF", "ISK", "MGA", "PYG", "RWF", "UGX", "VND", "XAF", "XOF", "XPF"]);

  function getCheckoutBaseUrl(): string {
    const key = process.env.CHECKOUT_SECRET_KEY ?? "";
    return key.startsWith("sk_sbox_")
      ? "https://api.sandbox.checkout.com"
      : "https://api.checkout.com";
  }

  async function checkoutPost(path: string, body: object): Promise<any> {
    const key = process.env.CHECKOUT_SECRET_KEY;
    if (!key) throw Object.assign(new Error("Checkout.com is not configured — CHECKOUT_SECRET_KEY missing"), { status: 503 });
    const res = await fetch(`${getCheckoutBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw Object.assign(new Error(err.message ?? `Checkout.com API error ${res.status}`), { status: res.status });
    }
    return res.json();
  }

  // GET /api/checkout/status — frontend uses this to show/hide card payment option
  app.get("/api/checkout/status", (_req: Request, res: any) => {
    res.json({ configured: !!process.env.CHECKOUT_SECRET_KEY });
  });

  // GET /api/deposit/instructions
  // Returns AMAX bank/PayID settlement instructions from server environment config.
  // Centralises all payment identifiers so they never appear hardcoded in the frontend.
  app.get("/api/deposit/instructions", (_req: Request, res: any) => {
    res.json({
      payid: {
        identifier: process.env.AMAX_PAYID ?? "info@amaxglobal.com.au",
        accountName: "AMAX Global Pty Ltd",
      },
      bank: {
        bank: process.env.AMAX_BANK_NAME ?? "Westpac Banking Corporation",
        bsb: process.env.AMAX_BSB ?? "032-000",
        account: process.env.AMAX_ACCOUNT_NUMBER ?? "123456789",
        accountName: "AMAX Global Pty Ltd",
        swift: process.env.AMAX_SWIFT ?? "WPACAU2S",
      },
    });
  });

  // POST /api/checkout/create-payment-link
  // Body: { walletId: number, amount: string, currency: string }
  // Returns: { url } — Checkout.com hosted payment page URL
  app.post("/api/checkout/create-payment-link", requireAuth, async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);
      const { walletId, amount, currency } = req.body;
      if (!walletId || !amount || !currency) {
        return res.status(400).json({ error: "walletId, amount and currency are required" });
      }

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      await checkDailyLimit(userId, new Decimal(parsedAmount), currency);

      const [wallet] = await db.select().from(wallets)
        .where(and(eq(wallets.id, Number(walletId)), eq(wallets.userId, userId)));
      if (!wallet) return res.status(404).json({ error: "Wallet not found" });

      const appDomain = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "http://localhost:5000";

      const unitAmount = CHECKOUT_ZERO_DECIMAL.has(currency.toUpperCase())
        ? Math.round(parsedAmount)
        : Math.round(parsedAmount * 100);

      const reference = `AMAX-${randomBytes(4).toString("hex").toUpperCase()}`;

      const data = await checkoutPost("/hosted-payments", {
        amount: unitAmount,
        currency: currency.toUpperCase(),
        reference,
        description: `AMAX Global ${currency} Wallet Deposit`,
        billing: { address: { country: "AU" } },
        metadata: {
          walletId: String(walletId),
          userId: String(userId),
          currency,
          amountDecimal: amount,
        },
        success_url: `${appDomain}/wallets?checkout=success&ref=${reference}`,
        failure_url: `${appDomain}/wallets?checkout=failed`,
        cancel_url: `${appDomain}/wallets?checkout=cancel`,
      });

      const redirectUrl = (data as any)._links?.redirect?.href;
      if (!redirectUrl) throw new Error("No redirect URL in Checkout.com response");

      res.json({ url: redirectUrl, reference });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("[checkout-create-link]", error?.message ?? error);
      res.status(500).json({ error: "Failed to create Checkout.com payment link" });
    }
  });

  // POST /api/checkout/webhook
  // Checkout.com posts events here; body is raw Buffer (set up in server/index.ts)
  // Handles: payment_captured → credit wallet balance
  // Signature: HMAC-SHA256 of raw body using CHECKOUT_WEBHOOK_SECRET, sent in cko-signature header
  app.post("/api/checkout/webhook", async (req: Request, res: any) => {
    const sig = req.headers["cko-signature"] as string;
    const webhookSecret = process.env.CHECKOUT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[checkout-webhook] CHECKOUT_WEBHOOK_SECRET not set");
      return res.status(503).json({ error: "Webhook not configured" });
    }

    const expected = createHmac("sha256", webhookSecret)
      .update(req.body as Buffer)
      .digest("hex");

    if (!sig || sig !== expected) {
      console.error("[checkout-webhook] signature verification failed");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    let event: any;
    try {
      event = JSON.parse((req.body as Buffer).toString());
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    if (event.type === "payment_captured") {
      const payment = event.data ?? {};
      const { walletId, userId, currency, amountDecimal } = payment.metadata ?? {};

      if (!walletId || !userId || !currency || !amountDecimal) {
        console.error("[checkout-webhook] missing metadata on payment", payment.id);
        return res.status(400).json({ error: "Missing metadata" });
      }

      const amount = new Decimal(amountDecimal);

      try {
        let txRecord: any;
        await db.transaction(async (tx) => {
          await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
          const [wallet] = await tx.select().from(wallets)
            .where(and(eq(wallets.id, Number(walletId)), eq(wallets.userId, Number(userId))))
            .for("update");
          if (!wallet) throw new Error(`Wallet ${walletId} not found for userId ${userId}`);

          await tx.update(wallets).set({
            balance: new Decimal(wallet.balance).plus(amount).toFixed(8),
            availableBalance: new Decimal(wallet.availableBalance).plus(amount).toFixed(8),
          }).where(eq(wallets.id, wallet.id));

          [txRecord] = await tx.insert(transactions).values({
            userId: Number(userId),
            type: "deposit",
            fromCurrency: null,
            toCurrency: currency,
            amount: amount.toFixed(8),
            fee: "0.00000000",
            exchangeRate: null,
            status: "completed",
            settlementStatus: "checkout_card",
            description: `${currency} Deposit via Card (Checkout.com ${payment.id})`,
            sourceExchange: "checkout",
            blockchainTxHash: null,
            assetType: "fiat",
            direction: "in",
            riskFlag: false,
            reviewStatus: "clear",
            reviewNotes: null,
          }).returning();
        });

        await writeAuditLog(
          Number(userId), "checkout_deposit", "transaction", String(txRecord?.id),
          { currency, amount: amountDecimal, checkoutPaymentId: payment.id },
          null,
        );
        console.log(`[checkout-webhook] credited ${amount} ${currency} to wallet ${walletId} (payment ${payment.id})`);
      } catch (err: any) {
        console.error("[checkout-webhook] failed to credit wallet:", err.message);
        return res.status(500).json({ error: "Failed to credit wallet" });
      }
    }

    if (event.type === "payment_declined") {
      console.log(`[checkout-webhook] payment declined: ${event.data?.id ?? "unknown"}`);
    }

    res.json({ received: true });
  });

  // ---------------------------------------------------------------------------
  // Coinbase Commerce — crypto & stablecoin deposits
  // AMAX is NOT the custodian: Coinbase Commerce holds the assets.
  // Funds are automatically credited to the user's wallet on charge:confirmed webhook.
  // Requires env: COINBASE_COMMERCE_API_KEY, COINBASE_COMMERCE_WEBHOOK_SECRET
  // ---------------------------------------------------------------------------

  // GET /api/crypto/coinbase/status — frontend uses this to show/hide live deposit UI
  app.get("/api/crypto/coinbase/status", (_req: Request, res: any) => {
    res.json({ configured: isCoinbaseConfigured() });
  });

  // POST /api/crypto/deposit-charge — generate a Coinbase Commerce charge for a crypto deposit
  // Returns: { chargeCode, hostedUrl, address, expiresAt }
  app.post("/api/crypto/deposit-charge", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);

      const schema = z.object({
        currency: z.string().min(1),
        walletId: z.number().int().positive(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

      const { currency, walletId } = parsed.data;

      if (!CRYPTO_CURRENCIES_COINBASE.has(currency)) {
        return res.status(400).json({ error: `${currency} is not supported via Coinbase Commerce. Supported: ${[...CRYPTO_CURRENCIES_COINBASE].join(", ")}` });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const charge = await createCharge({
        name: `AMAX Global — ${currency} Deposit`,
        description: `Deposit ${currency} to your AMAX wallet. Funds are credited automatically after blockchain confirmation.`,
        metadata: {
          userId: String(userId),
          walletId: String(walletId),
          currency,
          userEmail: user.email,
        },
      });

      const networkKey = CURRENCY_TO_NETWORK[currency];
      const address = charge.addresses?.[networkKey] ?? null;

      res.json({
        chargeCode: charge.code,
        chargeId: charge.id,
        hostedUrl: charge.hosted_url,
        address,
        networkKey,
        expiresAt: charge.expires_at,
        allAddresses: charge.addresses,
      });
    } catch (err: any) {
      console.error("[coinbase-deposit-charge]", err.message);
      res.status(err.status ?? 500).json({ error: err.message });
    }
  });

  // GET /api/crypto/deposit-charge/:code — check charge status
  app.get("/api/crypto/deposit-charge/:code", async (req: Request, res: any) => {
    try {
      requireAuth(req);
      const charge = await getCharge(req.params.code);
      const timeline = (charge as any).timeline ?? [];
      const status = timeline.length > 0 ? timeline[timeline.length - 1].status : "NEW";
      res.json({ status, charge });
    } catch (err: any) {
      console.error("[coinbase-charge-status]", err.message);
      res.status(err.status ?? 500).json({ error: err.message });
    }
  });

  // POST /api/webhooks/coinbase-commerce — Coinbase Commerce webhook
  // Verifies HMAC-SHA256 signature (X-CC-Webhook-Signature), credits wallet on charge:confirmed
  app.post("/api/webhooks/coinbase-commerce", async (req: Request, res: any) => {
    const sig = req.headers["x-cc-webhook-signature"] as string;
    const rawBody = (req.body as Buffer).toString("utf8");

    if (!verifyCoinbaseSignature(rawBody, sig)) {
      console.error("[coinbase-webhook] signature verification failed");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    if (event.type === "charge:confirmed") {
      const chargeData = event.data ?? {};
      const { userId, walletId, currency } = chargeData.metadata ?? {};

      if (!userId || !walletId || !currency) {
        console.error("[coinbase-webhook] missing metadata on charge", chargeData.id);
        return res.status(400).json({ error: "Missing charge metadata" });
      }

      // Determine amount from payments array
      const payments: any[] = chargeData.payments ?? [];
      if (payments.length === 0) {
        console.error("[coinbase-webhook] no payments on confirmed charge", chargeData.id);
        return res.status(200).json({ received: true, note: "no payments to process" });
      }

      const payment = payments[payments.length - 1];
      const valueObj = payment.value ?? {};
      const rawAmount = valueObj.crypto?.amount ?? "0";
      const amount = new Decimal(rawAmount);

      if (amount.lte(0)) {
        console.error("[coinbase-webhook] invalid amount", rawAmount);
        return res.status(200).json({ received: true, note: "zero amount" });
      }

      try {
        await db.transaction(async (tx) => {
          await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

          const [wallet] = await tx.select().from(wallets)
            .where(and(eq(wallets.id, parseInt(walletId)), eq(wallets.userId, parseInt(userId))))
            .for("update");

          if (!wallet) throw new Error(`Wallet ${walletId} not found for user ${userId}`);

          const newBalance = new Decimal(wallet.balance ?? "0").plus(amount);
          await tx.update(wallets)
            .set({ balance: newBalance.toFixed(8) })
            .where(eq(wallets.id, parseInt(walletId)));

          const audRate = await storage.getFxRate(currency, "AUD");
          const audValue = audRate ? amount.mul(audRate.rate) : new Decimal(0);
          const isLargeTransaction = audValue.gte(10000);

          await tx.insert(transactions).values({
            userId: parseInt(userId),
            walletId: parseInt(walletId),
            type: "deposit",
            amount: amount.toFixed(8),
            currency,
            description: `Coinbase Commerce crypto deposit — ${chargeData.code ?? chargeData.id}`,
            status: "completed",
            referenceCode: `CC-${chargeData.code ?? chargeData.id}`,
            sourceExchange: "coinbase_commerce",
            blockchainTxHash: payment.transaction_id ?? null,
            riskFlag: isLargeTransaction,
            reviewStatus: isLargeTransaction ? "flagged" : "ok",
          } as any);

          if (isLargeTransaction) {
            await tx.insert(complianceActions as any).values({
              userId: parseInt(userId),
              actionType: "ttr",
              notes: `Auto-flagged: Coinbase Commerce deposit ${currency} ${amount.toFixed(8)} (≥ AUD 10,000). Charge: ${chargeData.code ?? chargeData.id}`,
              performedBy: "system",
            });
          }
        });

        console.log(`[coinbase-webhook] credited ${amount.toFixed(8)} ${currency} to wallet ${walletId} for user ${userId}`);
        res.json({ received: true });
      } catch (err: any) {
        console.error("[coinbase-webhook] failed to credit wallet:", err.message);
        return res.status(500).json({ error: "Failed to credit wallet" });
      }
    } else {
      console.log(`[coinbase-webhook] unhandled event type: ${event.type}`);
      res.json({ received: true });
    }
  });

  // POST /api/crypto/withdraw — submit a crypto withdrawal (pending manual processing via Coinbase)
  // Travel Rule fields required per AUSTRAC Digital Currency Exchange obligations.
  app.post("/api/crypto/withdraw", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);

      const schema = z.object({
        currency: z.string().min(1),
        walletId: z.number().int().positive(),
        amount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount"),
        destinationAddress: z.string().min(10, "Destination wallet address required"),
        beneficiaryName: z.string().min(2, "Beneficiary full legal name required"),
        beneficiaryAddress: z.string().min(5, "Beneficiary address required"),
        network: z.string().min(1, "Network required"),
        isSelfHosted: z.boolean().optional().default(false),
        vaspName: z.string().optional(),
      });

      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });

      const { currency, walletId, amount: rawAmount, destinationAddress, beneficiaryName, beneficiaryAddress, network, isSelfHosted, vaspName } = parsed.data;
      const amount = new Decimal(rawAmount);

      if (!CRYPTO_CURRENCIES_COINBASE.has(currency)) {
        return res.status(400).json({ error: `${currency} is not a supported crypto asset` });
      }

      await checkDailyLimit(userId, amount, currency);

      const idemKey = req.headers["idempotency-key"] as string | undefined;
      const payloadHash = hashPayload(req.body);
      if (idemKey) {
        const idem = await checkIdempotency(userId, "/api/crypto/withdraw", idemKey, payloadHash);
        if (idem.conflict) return res.status(422).json({ error: "Idempotency-Key reused with different payload." });
        if (idem.existing) return res.json({ ...(idem.response as object), idempotent: true });
      }

      let txRecord: any;
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

        const [wallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
          .for("update");

        if (!wallet) throw Object.assign(new Error("Wallet not found"), { status: 404 });
        if (new Decimal(wallet.balance ?? "0").lt(amount)) {
          throw Object.assign(new Error(`Insufficient ${currency} balance`), { status: 400 });
        }

        const newBalance = new Decimal(wallet.balance ?? "0").minus(amount);
        await tx.update(wallets)
          .set({ balance: newBalance.toFixed(8) })
          .where(eq(wallets.id, walletId));

        const audRate = await storage.getFxRate(currency, "AUD");
        const audValue = audRate ? amount.mul(audRate.rate) : new Decimal(0);
        const isLargeTransaction = audValue.gte(10000);

        const refCode = `CW-${randomBytes(4).toString("hex").toUpperCase()}`;

        const [inserted] = await tx.insert(transactions).values({
          userId,
          walletId,
          type: "withdrawal",
          amount: amount.toFixed(8),
          currency,
          description: `Crypto withdrawal to ${destinationAddress.substring(0, 12)}… (${network}) — ${isSelfHosted ? "SELF-HOSTED WALLET — AUSTRAC reporting required within 10 business days" : `VASP: ${vaspName || "unknown"}`} — pending processing`,
          status: "pending",
          referenceCode: refCode,
          beneficiaryName,
          beneficiaryAddress,
          sourceExchange: "coinbase_commerce",
          blockchainTxHash: null,
          riskFlag: isLargeTransaction,
          reviewStatus: isLargeTransaction ? "flagged" : "pending",
        } as any).returning();

        txRecord = inserted;

        if (isLargeTransaction) {
          await tx.insert(complianceActions as any).values({
            userId,
            actionType: "ttr",
            notes: `Auto-flagged: Crypto withdrawal ${currency} ${amount.toFixed(8)} (≥ AUD 10,000) to ${destinationAddress.substring(0, 20)}. Ref: ${refCode}`,
            performedBy: "system",
          });
        }

        // Self-hosted wallet: AUSTRAC requires reporting to the AUSTRAC CEO within 10 business days (from 1 Jul 2026)
        if (isSelfHosted) {
          await tx.insert(complianceActions as any).values({
            userId,
            actionType: "smr",
            notes: `SELF-HOSTED WALLET TRANSFER — AUSTRAC reporting required within 10 business days. ${currency} ${amount.toFixed(8)} to ${destinationAddress.substring(0, 20)} (${network}). Beneficiary: ${beneficiaryName}. Ref: ${refCode}`,
            performedBy: "system",
          });
        }

        await runAmlCheck(tx, userId, currency, amount, "out");
      });

      if (idemKey && txRecord) {
        await saveIdempotencyResponse(userId, "/api/crypto/withdraw", idemKey, payloadHash, txRecord);
      }

      res.json({
        success: true,
        referenceCode: txRecord.referenceCode,
        status: "pending",
        message: "Your withdrawal request has been submitted. AMAX will process it via Coinbase within 1–2 business days. You will receive an email confirmation once sent.",
      });
    } catch (err: any) {
      console.error("[crypto-withdraw]", err.message);
      res.status(err.status ?? 500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // PayPal Orders API — deposit only
  // Requires env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
  // Set PAYPAL_ENV=production to switch from sandbox to live.
  // Supported currencies (PayPal merchant subset of app's 11 fiats):
  //   AUD NZD USD EUR CAD GBP HKD SGD JPY
  // CNY and KRW are NOT supported by PayPal standard merchant accounts.
  // ---------------------------------------------------------------------------
  const PAYPAL_BASE =
    process.env.PAYPAL_ENV === "production"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  async function getPayPalAccessToken(): Promise<string> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw Object.assign(new Error("PayPal credentials not configured"), { status: 503 });
    }
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) throw Object.assign(new Error("PayPal auth failed"), { status: 502 });
    const data: any = await res.json();
    return data.access_token;
  }

  // POST /api/paypal/create-order
  // Body: { walletId: number, amount: string, currency: string }
  // Returns: { approvalUrl: string, orderId: string }
  app.post("/api/paypal/create-order", requireAuth, async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);
      const { walletId, amount, currency } = req.body;
      if (!walletId || !amount || !currency) {
        return res.status(400).json({ error: "walletId, amount and currency are required" });
      }

      await checkDailyLimit(userId, new Decimal(parseFloat(amount)), currency);

      const appDomain = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : "http://localhost:5000";

      const accessToken = await getPayPalAccessToken();

      // JPY has 0 decimal places; all others use 2
      const decimalPlaces = currency === "JPY" ? 0 : 2;
      const formattedAmount = parseFloat(amount).toFixed(decimalPlaces);

      const orderBody = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: currency, value: formattedAmount },
            custom_id: `amax:wallet:${walletId}:user:${userId}`,
            description: `AMAX Global ${currency} Deposit`,
          },
        ],
        application_context: {
          brand_name: "AMAX Global",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: `${appDomain}/wallets?paypal=success&walletId=${walletId}`,
          cancel_url: `${appDomain}/wallets?paypal=cancel`,
        },
      };

      const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderBody),
      });

      if (!orderRes.ok) {
        const err: any = await orderRes.json();
        console.error("[paypal-create-order]", err);
        return res.status(502).json({ error: "PayPal order creation failed", details: err });
      }

      const order: any = await orderRes.json();
      const approvalUrl = order.links?.find((l: any) => l.rel === "approve")?.href;
      if (!approvalUrl) return res.status(502).json({ error: "No PayPal approval URL returned" });

      res.json({ approvalUrl, orderId: order.id });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("[paypal-create-order-error]", error?.message ?? error);
      res.status(500).json({ error: "Failed to create PayPal order" });
    }
  });

  // POST /api/paypal/capture-order
  // Body: { orderId: string, walletId: number }
  // Captures the approved PayPal order and credits the wallet.
  app.post("/api/paypal/capture-order", requireAuth, async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      const { orderId, walletId } = req.body;
      if (!orderId || !walletId) {
        return res.status(400).json({ error: "orderId and walletId are required" });
      }

      const accessToken = await getPayPalAccessToken();
      const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!captureRes.ok) {
        const err: any = await captureRes.json();
        // INSTRUMENT_DECLINED is a user PayPal error, not a server error
        const status = err?.details?.[0]?.issue === "INSTRUMENT_DECLINED" ? 400 : 502;
        return res.status(status).json({ error: err?.details?.[0]?.description ?? "PayPal capture failed" });
      }

      const capture: any = await captureRes.json();
      if (capture.status !== "COMPLETED") {
        return res.status(400).json({ error: `PayPal order status: ${capture.status}` });
      }

      const capturedUnit = capture.purchase_units?.[0];
      const capturedAmt = capturedUnit?.payments?.captures?.[0]?.amount;
      if (!capturedAmt) return res.status(502).json({ error: "Could not parse captured amount from PayPal" });

      const amount = new Decimal(capturedAmt.value);
      const currency = capturedAmt.currency_code;

      let txRecord: any;
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        const [wallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.id, Number(walletId)), eq(wallets.userId, userId)))
          .for("update");
        if (!wallet) throw Object.assign(new Error("Wallet not found or does not belong to user"), { status: 404 });

        await tx.update(wallets).set({
          balance: new Decimal(wallet.balance).plus(amount).toFixed(8),
          availableBalance: new Decimal(wallet.availableBalance).plus(amount).toFixed(8),
        }).where(eq(wallets.id, wallet.id));

        [txRecord] = await tx.insert(transactions).values({
          userId,
          type: "deposit",
          fromCurrency: null,
          toCurrency: currency,
          amount: amount.toFixed(8),
          fee: "0.00000000",
          exchangeRate: null,
          status: "completed",
          settlementStatus: "paypal",
          description: `${currency} Deposit via PayPal (${orderId})`,
          sourceExchange: "paypal",
          blockchainTxHash: null,
          assetType: "fiat",
          direction: "in",
          riskFlag: amount.gte(10000),
          reviewStatus: amount.gte(10000) ? "flagged" : "clear",
          reviewNotes: amount.gte(10000) ? "AUSTRAC threshold — manual review required" : null,
        }).returning();
      });

      await writeAuditLog(
        userId, "paypal_deposit", "transaction", String(txRecord?.id),
        { currency, amount: capturedAmt.value, orderId },
        req.ip || null,
      );

      // TTR auto-flag — AUSTRAC mandatory reporting for PayPal deposits >= AUD $10,000 equivalent.
      if (amount.gte(10000)) {
        try {
          await db.insert(complianceActions).values({
            userId,
            transactionId: txRecord?.id ?? null,
            actionType: "ttr",
            performedBy: "system",
            notes: `Auto-flagged: ${currency} PayPal deposit of ${capturedAmt.value} meets or exceeds AUD $10,000 AUSTRAC TTR threshold. Pending review by Compliance Officer.`,
            outcome: null,
            austracRef: null,
          });
        } catch (flagErr: any) {
          console.error("[ttr-auto-flag-paypal] failed:", flagErr?.message);
        }
      }

      await runAmlCheck(userId, txRecord?.id, amount, "fiat", "deposit");

      res.json({ success: true, amount: capturedAmt.value, currency, transactionId: txRecord?.id });
    } catch (error: any) {
      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("[paypal-capture-error]", error?.message ?? error);
      res.status(500).json({ error: "Failed to capture PayPal payment" });
    }
  });

  // ---------------------------------------------------------------------------
  // KYC Profile endpoints — AML/CTF Program v2.0 §15 (Part B)
  // Collects mandatory individual CDD fields before document upload is allowed.
  // ---------------------------------------------------------------------------

  // GET /api/kyc/profile — returns user's KYC profile fields
  app.get("/api/kyc/profile", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({
        fullLegalName: user.fullLegalName ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
        nationality: user.nationality ?? "",
        phoneNumber: user.phoneNumber ?? "",
        pepDeclaration: user.pepDeclaration ?? false,
        sanctionsDeclaration: user.sanctionsDeclaration ?? false,
        consentDeclaration: user.consentDeclaration ?? false,
        kycProfileComplete: user.kycProfileComplete ?? false,
        accountFrozen: user.accountFrozen ?? false,
        kycRefreshDue: user.kycRefreshDue ?? null,
        residentialAddress: user.residentialAddress ?? "",
        suburb: user.suburb ?? "",
        stateRegion: user.stateRegion ?? "",
        postcode: user.postcode ?? "",
        addressCountry: user.addressCountry ?? "Australia",
        occupation: user.occupation ?? "",
        employmentStatus: user.employmentStatus ?? "",
        purposeOfAccount: user.purposeOfAccount ?? "",
        sourceOfFunds: user.sourceOfFunds ?? "",
        taxCountry: user.taxCountry ?? "",
        idDocumentType: user.idDocumentType ?? "",
        idDocsSubmitted: user.idDocsSubmitted ?? false,
        idVerificationComplete: user.idVerificationComplete ?? false,
        addressDocFilename: user.addressDocFilename ?? null,
        addressDocApproved: user.addressDocApproved ?? false,
        agreementSigned: user.agreementSigned ?? false,
        agreementSignedAt: user.agreementSignedAt ?? null,
        agreementRef: user.agreementRef ?? null,
        agreementSignature: user.agreementSignature ?? null,
        agreementVersion: user.agreementVersion ?? null,
      });
    } catch (err: any) {
      res.status(401).json({ error: err.message ?? "Unauthorized" });
    }
  });

  // PUT /api/kyc/profile — saves KYC profile personal info
  app.put("/api/kyc/profile", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      const schema = z.object({
        fullLegalName: z.string().min(2, "Full legal name required"),
        dateOfBirth: z.string().min(8, "Date of birth required"),
        nationality: z.string().min(2, "Nationality required"),
        phoneNumber: z.string().min(8, "Phone number required"),
        pepDeclaration: z.boolean(),
        sanctionsDeclaration: z.boolean(),
        consentDeclaration: z.boolean(),
        residentialAddress: z.string().optional(),
        suburb: z.string().optional(),
        stateRegion: z.string().optional(),
        postcode: z.string().optional(),
        addressCountry: z.string().optional(),
        occupation: z.string().optional(),
        employmentStatus: z.string().optional(),
        purposeOfAccount: z.string().optional(),
        sourceOfFunds: z.string().optional(),
        taxCountry: z.string().optional(),
      });
      const data = schema.parse(req.body);
      // Note: sanctionsDeclaration and consentDeclaration are formally captured
      // during the Customer Agreement signing step (Step 3), not here.
      // Calculate internal risk score (not shown to user — gaming risk per AUSTRAC guidance)
      // Geography(AUS=1) + Behaviour(new=1) + Product(fiat=1) + Customer(individual=1) = 4 = Low
      // Elevated if PEP declared
      const riskScore = data.pepDeclaration ? 9 : 4;
      const riskLevel = riskScore <= 6 ? "low" : riskScore <= 9 ? "medium" : "high";
      const dailyLimit = riskLevel === "low" ? "50000" : riskLevel === "medium" ? "10000" : "2000";
      // KYC refresh due 1 year from now (for medium/high-risk, 6 months)
      const refreshMonths = riskLevel === "low" ? 12 : 6;
      const kycRefreshDue = new Date();
      kycRefreshDue.setMonth(kycRefreshDue.getMonth() + refreshMonths);

      await db.update(users).set({
        fullLegalName: data.fullLegalName,
        dateOfBirth: data.dateOfBirth,
        nationality: data.nationality,
        phoneNumber: data.phoneNumber,
        pepDeclaration: data.pepDeclaration,
        sanctionsDeclaration: data.sanctionsDeclaration,
        consentDeclaration: data.consentDeclaration,
        kycProfileComplete: true,
        riskScore,
        riskLevel,
        dailyTransactionLimit: dailyLimit,
        kycRefreshDue,
        residentialAddress: data.residentialAddress ?? null,
        suburb: data.suburb ?? null,
        stateRegion: data.stateRegion ?? null,
        postcode: data.postcode ?? null,
        addressCountry: data.addressCountry ?? null,
        occupation: data.occupation ?? null,
        employmentStatus: data.employmentStatus ?? null,
        purposeOfAccount: data.purposeOfAccount ?? null,
        sourceOfFunds: data.sourceOfFunds ?? null,
        taxCountry: data.taxCountry ?? null,
      }).where(eq(users.id, userId));

      // Log to audit trail
      await db.insert(auditLogs).values({
        userId,
        action: "kyc_profile_submitted",
        entityType: "user",
        entityId: String(userId),
        metadata: { riskLevel, pepDeclared: data.pepDeclaration },
      });

      // If PEP declared — flag for compliance officer review
      if (data.pepDeclaration) {
        await db.insert(complianceActions).values({
          actionType: "ecdd",
          userId,
          performedBy: "system",
          notes: "Customer self-declared as PEP at KYC onboarding. ECDD required before account activation.",
          outcome: "pending",
        });
      }

      // AML/CTF Rules 2025 — EDD trigger for elevated source-of-funds categories.
      // crypto, inheritance, and "other" are high-risk per AUSTRAC guidance and require
      // source of wealth documentation before the account may be fully activated.
      const eddSourcesOfFunds = ["crypto", "inheritance", "other"];
      if (data.sourceOfFunds && eddSourcesOfFunds.includes(data.sourceOfFunds)) {
        await db.insert(complianceActions).values({
          actionType: "ecdd",
          userId,
          performedBy: "system",
          notes: `EDD triggered: source of funds declared as "${data.sourceOfFunds}". Source of wealth documentation required before account activation. Customer must provide supporting documents to compliance@amaxglobal.com.au.`,
          outcome: "pending",
        });
        await db.insert(auditLogs as any).values({
          userId,
          action: "edd_triggered_source_of_funds",
          entityType: "user",
          entityId: String(userId),
          metadata: { sourceOfFunds: data.sourceOfFunds, trigger: "high_risk_sof" },
        });
      }

      res.json({ success: true, kycProfileComplete: true, riskLevel });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
      res.status(500).json({ error: err.message ?? "Failed to save KYC profile" });
    }
  });

  // ---------------------------------------------------------------------------
  // POST /api/kyc/agreement/sign — records the customer's signed agreement
  // Electronic Transactions Act 1999 (Cth) — typed name constitutes valid signature
  // ---------------------------------------------------------------------------
  app.post("/api/kyc/agreement/sign", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      const schema = z.object({
        signature: z.string().min(2, "Signature required"),
        pepDeclaration: z.boolean().optional(),
      });
      const data = schema.parse(req.body);

      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ error: "User not found" });

      // Signature must match full legal name (case-insensitive trim)
      if (user.fullLegalName && data.signature.trim().toLowerCase() !== user.fullLegalName.trim().toLowerCase()) {
        return res.status(400).json({ error: "Signature does not match your verified legal name. Please type your name exactly as registered." });
      }

      const agreementRef = `AMXAGR-${randomBytes(4).toString("hex").toUpperCase()}`;
      const signedAt = new Date();

      await db.update(users).set({
        agreementSigned: true,
        agreementSignedAt: signedAt,
        agreementRef,
        agreementVersion: "v2.0",
        agreementSignature: data.signature.trim(),
        // Capture declarations included in the agreement body
        sanctionsDeclaration: true,
        consentDeclaration: true,
        ...(data.pepDeclaration !== undefined ? { pepDeclaration: data.pepDeclaration } : {}),
      }).where(eq(users.id, userId));

      await writeAuditLog(userId, "agreement_signed", "user", String(userId), {
        agreementRef, agreementVersion: "v2.0", signature: data.signature.trim(),
      }, null);

      res.json({ success: true, agreementRef, signedAt: signedAt.toISOString() });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
      res.status(500).json({ error: err.message ?? "Failed to record agreement" });
    }
  });

  // ---------------------------------------------------------------------------
  // Identity verification endpoints — Sumsub integration
  // POST /api/kyc/identity/start         — creates Sumsub applicant + SDK access token
  // POST /api/kyc/identity/refresh-token — renews SDK token (called by Sumsub SDK)
  // POST /api/kyc/identity/webhook       — receives Sumsub applicantReviewed events
  // GET  /api/kyc/identity/status        — frontend polls for DB-recorded result
  // ---------------------------------------------------------------------------

  const SUMSUB_API_URL = "https://api.sumsub.com";
  const SUMSUB_LEVEL   = "basic-kyc-level"; // verification level configured in Sumsub dashboard

  // Build HMAC-SHA256 signature required by every Sumsub API call
  function makeSumsubSig(secretKey: string, ts: number, method: string, path: string, body = ""): string {
    const crypto = require("crypto");
    return crypto.createHmac("sha256", secretKey)
      .update(String(ts) + method.toUpperCase() + path + body)
      .digest("hex");
  }

  // Authenticated fetch wrapper for Sumsub REST API
  async function sumsubFetch(appToken: string, secretKey: string, method: string, path: string, body?: object) {
    const ts      = Math.floor(Date.now() / 1000);
    const bodyStr = body ? JSON.stringify(body) : "";
    const sig     = makeSumsubSig(secretKey, ts, method, path, bodyStr);
    const headers: Record<string, string> = {
      "X-App-Token":      appToken,
      "X-App-Access-Ts":  String(ts),
      "X-App-Access-Sig": sig,
      "Accept":           "application/json",
    };
    if (bodyStr) headers["Content-Type"] = "application/json";
    return fetch(`${SUMSUB_API_URL}${path}`, {
      method,
      headers,
      ...(bodyStr ? { body: bodyStr } : {}),
    });
  }

  // Helper: generate a Sumsub SDK access token for a given externalUserId
  async function getSumsubAccessToken(appToken: string, secretKey: string, externalUserId: string): Promise<string> {
    const path    = `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}&levelName=${encodeURIComponent(SUMSUB_LEVEL)}`;
    const tokenRes = await sumsubFetch(appToken, secretKey, "POST", path, {});
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Sumsub token error (${tokenRes.status}): ${errText}`);
    }
    const tokenData: any = await tokenRes.json();
    return tokenData.token ?? "";
  }

  // POST /api/kyc/identity/start
  app.post("/api/kyc/identity/start", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return res.status(404).json({ error: "User not found" });

      const appToken  = process.env.SUMSUB_APP_TOKEN;
      const secretKey = process.env.SUMSUB_SECRET_KEY;
      const docType: string = req.body.documentType ?? "passport";

      if (!appToken || !secretKey) {
        // No Sumsub credentials — queue for manual review by compliance team
        await db.update(users).set({ idDocumentType: docType }).where(eq(users.id, userId));
        await db.insert(complianceActions as any).values({
          actionType: "id_verification_started",
          userId,
          performedBy: "system",
          notes: `Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: ${docType}. Customer: ${user.firstName} ${user.lastName}.`,
          outcome: "pending",
        });
        await db.insert(auditLogs as any).values({
          userId,
          action: "id_verification_manual_review_queued",
          entityType: "user",
          entityId: String(userId),
          metadata: { documentType: docType, mode: "manual_review" },
        });
        return res.json({ mode: "manual_review" });
      }

      const externalUserId = `amax-${userId}`;

      // Step 1: Create applicant in Sumsub
      const applicantPath = `/resources/applicants?levelName=${encodeURIComponent(SUMSUB_LEVEL)}`;
      const applicantBody: Record<string, any> = {
        externalUserId,
        email: user.email,
        info: {
          firstName: user.firstName ?? "",
          lastName:  user.lastName  ?? "",
          ...(user.dateOfBirth ? { dob: user.dateOfBirth } : {}),
          ...(user.nationality  ? { country: user.nationality } : {}),
        },
      };
      const applicantRes = await sumsubFetch(appToken, secretKey, "POST", applicantPath, applicantBody);
      if (!applicantRes.ok) {
        const errText = await applicantRes.text();
        throw new Error(`Sumsub applicant error (${applicantRes.status}): ${errText}`);
      }
      const applicantData: any = await applicantRes.json();
      const applicantId: string = applicantData.id ?? "";

      // Step 2: Generate SDK access token
      const accessToken = await getSumsubAccessToken(appToken, secretKey, externalUserId);

      await db.update(users).set({ idDocumentType: docType }).where(eq(users.id, userId));
      await db.insert(complianceActions as any).values({
        actionType: "id_verification_started",
        userId,
        performedBy: "system",
        notes: `Sumsub applicant created. Applicant ID: ${applicantId}. External user ID: ${externalUserId}.`,
        outcome: "pending",
      });
      await db.insert(auditLogs as any).values({
        userId,
        action: "id_verification_session_started",
        entityType: "user",
        entityId: String(userId),
        metadata: { applicantId, externalUserId, levelName: SUMSUB_LEVEL, mode: "sumsub" },
      });

      res.json({ mode: "sumsub", token: accessToken, applicantId });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to start verification" });
    }
  });

  // POST /api/kyc/identity/refresh-token — called by Sumsub WebSDK when token expires
  app.post("/api/kyc/identity/refresh-token", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      const appToken  = process.env.SUMSUB_APP_TOKEN;
      const secretKey = process.env.SUMSUB_SECRET_KEY;
      if (!appToken || !secretKey) return res.status(503).json({ error: "KYC provider not configured" });
      const accessToken = await getSumsubAccessToken(appToken, secretKey, `amax-${userId}`);
      res.json({ token: accessToken });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to refresh token" });
    }
  });

  // POST /api/kyc/identity/docs-submitted — called by frontend when Sumsub SDK signals
  // that documents have been submitted (applicant status → pending review by Sumsub)
  app.post("/api/kyc/identity/docs-submitted", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      await db.update(users).set({ idDocsSubmitted: true }).where(eq(users.id, userId));
      await db.insert(auditLogs as any).values({
        userId, action: "id_docs_submitted_to_sumsub", entityType: "user", entityId: String(userId),
        metadata: { note: "User completed Sumsub SDK — docs submitted for review" }, ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to record docs submitted" });
    }
  });

  // POST /api/kyc/address/upload — save POA document filename (step 4 under_review)
  app.post("/api/kyc/address/upload", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      const { filename } = z.object({ filename: z.string().min(1) }).parse(req.body);
      await db.update(users).set({ addressDocFilename: filename }).where(eq(users.id, userId));
      await db.insert(auditLogs as any).values({
        userId, action: "address_doc_uploaded", entityType: "user", entityId: String(userId),
        metadata: { filename, note: "Proof of Address document uploaded by user" }, ipAddress: req.ip,
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to record address document" });
    }
  });

  // POST /api/kyc/identity/webhook — receives Sumsub applicantReviewed events
  // No auth — public endpoint called by Sumsub servers
  // Sumsub signs the payload: x-payload-digest = HMAC-SHA256(secretKey, rawBody)
  app.post("/api/kyc/identity/webhook", async (req: Request, res: any) => {
    try {
      // Signature verification (active when SUMSUB_SECRET_KEY is set)
      const secretKey = process.env.SUMSUB_SECRET_KEY;
      if (secretKey) {
        const crypto = require("crypto");
        const rawBody   = JSON.stringify(req.body);
        const digest    = req.headers["x-payload-digest"] as string ?? "";
        const expected  = crypto.createHmac("sha256", secretKey).update(rawBody).digest("hex");
        if (digest && digest !== expected) {
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
      }

      const body: any = req.body ?? {};
      const type: string          = body.type ?? "";
      const externalUserId: string = body.externalUserId ?? "";

      // Only act on applicantReviewed events
      if (type !== "applicantReviewed") return res.json({ success: true, skipped: true });

      const match = externalUserId.match(/^amax-(\d+)$/);
      if (!match) return res.status(400).json({ error: "Invalid externalUserId format" });
      const userId = parseInt(match[1], 10);

      const reviewResult: any = body.reviewResult ?? {};
      const reviewAnswer: string = reviewResult.reviewAnswer ?? ""; // "GREEN" | "RED"
      const approved = reviewAnswer === "GREEN";

      if (approved) {
        await db.update(users).set({ idVerificationComplete: true }).where(eq(users.id, userId));
      }

      await db.insert(complianceActions as any).values({
        actionType: "id_verification_result",
        userId,
        performedBy: "sumsub",
        notes: `Sumsub decision: ${reviewAnswer}. Applicant ID: ${body.applicantId ?? "n/a"}. Reject labels: ${(reviewResult.rejectLabels ?? []).join(", ") || "none"}.`,
        outcome: approved ? "completed" : "pending",
      });
      await db.insert(auditLogs as any).values({
        userId,
        action: "id_verification_webhook_received",
        entityType: "user",
        entityId: String(userId),
        metadata: {
          reviewAnswer,
          applicantId:  body.applicantId  ?? null,
          inspectionId: body.inspectionId ?? null,
          rejectLabels: reviewResult.rejectLabels ?? [],
        },
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Webhook processing failed" });
    }
  });

  // GET /api/kyc/identity/status — frontend polls for DB-recorded verification result
  app.get("/api/kyc/identity/status", async (req: Request, res: any) => {
    try {
      const { userId } = requireAuth(req);
      const [user] = await db
        .select({ idVerificationComplete: users.idVerificationComplete, idDocumentType: users.idDocumentType })
        .from(users)
        .where(eq(users.id, userId));
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({
        complete:     user.idVerificationComplete ?? false,
        documentType: user.idDocumentType ?? null,
      });
    } catch (err: any) {
      res.status(401).json({ error: err.message ?? "Unauthorized" });
    }
  });

  // ---------------------------------------------------------------------------
  // Admin transaction lifecycle endpoints
  // Protected by X-Admin-Key header matched against ADMIN_SECRET env var.
  // No UI — used by AMAX ops team to approve/complete/fail transactions.
  // ---------------------------------------------------------------------------
  function requireAdminKey(req: Request, res: any): boolean {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) { res.status(503).json({ error: "Admin not configured" }); return false; }
    if (req.headers["x-admin-key"] !== secret) { res.status(401).json({ error: "Unauthorized" }); return false; }
    return true;
  }

  // POST /api/admin/transactions/:id/complete-deposit
  // Credits the wallet and marks a pending deposit as completed.
  app.post("/api/admin/transactions/:id/complete-deposit", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const txId = Number(req.params.id);
      const [txRow] = await db.select().from(transactions).where(eq(transactions.id, txId));
      if (!txRow) return res.status(404).json({ error: "Transaction not found" });
      if (txRow.type !== "deposit") return res.status(400).json({ error: "Not a deposit transaction" });
      if (txRow.status === "completed") return res.status(409).json({ error: "Already completed" });

      const currency = txRow.toCurrency!;
      const creditAmount = new Decimal(txRow.amount);

      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        const [wallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, txRow.userId!), eq(wallets.currency, currency)))
          .for("update");
        if (!wallet) throw new Error("Wallet not found");
        await tx.update(wallets).set({
          balance: new Decimal(wallet.balance).plus(creditAmount).toFixed(8),
          availableBalance: new Decimal(wallet.availableBalance).plus(creditAmount).toFixed(8),
        }).where(eq(wallets.id, wallet.id));
        await tx.update(transactions).set({ status: "completed", settlementStatus: "internal_only" })
          .where(eq(transactions.id, txId));
      });
      res.json({ success: true, message: "Deposit completed and wallet credited" });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to complete deposit" });
    }
  });

  // POST /api/admin/transactions/:id/complete-withdrawal
  // Marks a pending withdrawal as completed. Now also reduces the actual balance
  // (funds were reserved in availableBalance at submission time).
  app.post("/api/admin/transactions/:id/complete-withdrawal", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const txId = Number(req.params.id);
      const [txRow] = await db.select().from(transactions).where(eq(transactions.id, txId));
      if (!txRow) return res.status(404).json({ error: "Transaction not found" });
      if (txRow.type !== "withdrawal") return res.status(400).json({ error: "Not a withdrawal transaction" });
      if (txRow.status === "completed") return res.status(409).json({ error: "Already completed" });

      const currency = txRow.fromCurrency!;
      const deductAmount = new Decimal(txRow.amount).plus(new Decimal(txRow.fee ?? "0"));

      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        const [wallet] = await tx.select().from(wallets)
          .where(and(eq(wallets.userId, txRow.userId!), eq(wallets.currency, currency)))
          .for("update");
        if (wallet) {
          await tx.update(wallets).set({
            balance: new Decimal(wallet.balance).minus(deductAmount).toFixed(8),
          }).where(eq(wallets.id, wallet.id));
        }
        await tx.update(transactions).set({ status: "completed", settlementStatus: "paid_out" })
          .where(eq(transactions.id, txId));
      });
      res.json({ success: true, message: "Withdrawal completed and balance finalised" });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to complete withdrawal" });
    }
  });

  // POST /api/admin/transactions/:id/fail
  // Marks a transaction as failed. Refunds balance for failed withdrawals.
  app.post("/api/admin/transactions/:id/fail", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const txId = Number(req.params.id);
      const [txRow] = await db.select().from(transactions).where(eq(transactions.id, txId));
      if (!txRow) return res.status(404).json({ error: "Transaction not found" });
      if (txRow.status === "completed") return res.status(409).json({ error: "Cannot fail a completed transaction" });

      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
        if (txRow.type === "withdrawal") {
          // Refund: availableBalance was reduced at submission but balance was NOT.
          // Only restore availableBalance to release the reservation.
          const refundAmount = new Decimal(txRow.amount).plus(new Decimal(txRow.fee ?? "0"));
          const currency = txRow.fromCurrency!;
          const [wallet] = await tx.select().from(wallets)
            .where(and(eq(wallets.userId, txRow.userId!), eq(wallets.currency, currency)))
            .for("update");
          if (wallet) {
            await tx.update(wallets).set({
              availableBalance: new Decimal(wallet.availableBalance).plus(refundAmount).toFixed(8),
            }).where(eq(wallets.id, wallet.id));
          }
        }
        await tx.update(transactions).set({ status: "failed", settlementStatus: "failed" })
          .where(eq(transactions.id, txId));
      });
      res.json({ success: true, message: txRow.type === "withdrawal" ? "Withdrawal failed — balance refunded" : "Transaction marked failed" });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to fail transaction" });
    }
  });

  // GET /api/admin/compliance/alerts — all open AML flags
  app.get("/api/admin/compliance/alerts", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const flags = await db.select().from(amlFlags).orderBy(amlFlags.createdAt);
      res.json(flags);
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to fetch alerts" });
    }
  });

  // GET /api/admin/compliance/actions — full compliance action log (SMR/TTR/freeze)
  app.get("/api/admin/compliance/actions", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const actions = await db.select().from(complianceActions).orderBy(complianceActions.createdAt);
      res.json(actions);
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to fetch actions" });
    }
  });

  // GET /api/admin/users — all users with KYC + freeze status
  app.get("/api/admin/users", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const allUsers = await db.select({
        id: users.id, username: users.username, email: users.email,
        firstName: users.firstName, lastName: users.lastName,
        kycStatus: users.kycStatus, kycProfileComplete: users.kycProfileComplete,
        idDocsSubmitted: users.idDocsSubmitted,
        idVerificationComplete: users.idVerificationComplete,
        addressDocFilename: users.addressDocFilename,
        addressDocApproved: users.addressDocApproved,
        accountFrozen: users.accountFrozen, riskLevel: users.riskLevel,
        kycRefreshDue: users.kycRefreshDue, createdAt: users.createdAt,
        pepDeclaration: users.pepDeclaration,
      }).from(users).orderBy(users.createdAt);
      res.json(allUsers);
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to fetch users" });
    }
  });

  // POST /api/admin/freeze/:userId — freeze an account
  app.post("/api/admin/freeze/:userId", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const userId = Number(req.params.userId);
      const { notes } = req.body;
      await db.update(users).set({ accountFrozen: true }).where(eq(users.id, userId));
      await db.insert(complianceActions).values({
        actionType: "freeze", userId, performedBy: "admin",
        notes: notes ?? "Account frozen by compliance officer",
        outcome: "filed",
      });
      await db.insert(auditLogs).values({
        userId, action: "account_frozen", entityType: "user", entityId: String(userId),
        metadata: { notes }, ipAddress: req.ip,
      });
      res.json({ success: true, message: "Account frozen" });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to freeze account" });
    }
  });

  // POST /api/admin/unfreeze/:userId — unfreeze an account
  app.post("/api/admin/unfreeze/:userId", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const userId = Number(req.params.userId);
      const { notes } = req.body;
      await db.update(users).set({ accountFrozen: false }).where(eq(users.id, userId));
      await db.insert(complianceActions).values({
        actionType: "unfreeze", userId, performedBy: "admin",
        notes: notes ?? "Account unfrozen by compliance officer",
        outcome: "closed",
      });
      await db.insert(auditLogs).values({
        userId, action: "account_unfrozen", entityType: "user", entityId: String(userId),
        metadata: { notes }, ipAddress: req.ip,
      });
      res.json({ success: true, message: "Account unfrozen" });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to unfreeze account" });
    }
  });

  // POST /api/admin/identity/approve/:userId — manually approve identity verification
  // Used by compliance team when SUMSUB credentials are not configured, or as override.
  app.post("/api/admin/identity/approve/:userId", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const userId = Number(req.params.userId);
      const { notes } = req.body;
      await db.update(users).set({ idVerificationComplete: true }).where(eq(users.id, userId));
      await db.insert(complianceActions as any).values({
        actionType: "id_verification_manual_approved",
        userId,
        performedBy: "admin",
        notes: notes ?? "Identity manually approved by compliance officer",
        outcome: "completed",
      });
      await db.insert(auditLogs as any).values({
        userId,
        action: "id_verification_manual_approved",
        entityType: "user",
        entityId: String(userId),
        metadata: { notes, method: "manual_admin" },
        ipAddress: req.ip,
      });
      res.json({ success: true, message: "Identity verification approved" });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to approve identity" });
    }
  });

  // POST /api/admin/kyc/approve-address/:userId — approve Step 4 Proof of Address document
  app.post("/api/admin/kyc/approve-address/:userId", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const userId = Number(req.params.userId);
      const { notes } = req.body;
      await db.update(users).set({ addressDocApproved: true }).where(eq(users.id, userId));
      await db.insert(complianceActions as any).values({
        actionType: "address_doc_approved",
        userId,
        performedBy: "admin",
        notes: notes ?? "Proof of Address document approved by compliance officer",
        outcome: "completed",
      });
      await db.insert(auditLogs as any).values({
        userId, action: "address_doc_approved", entityType: "user", entityId: String(userId),
        metadata: { notes }, ipAddress: req.ip,
      });

      // Promote kycStatus to "verified" only when ALL 4 steps are complete:
      // kycProfileComplete + agreementSigned + idVerificationComplete + addressDocApproved
      // This is the single authoritative gate — no other path sets kycStatus = "verified".
      const [updatedUser] = await db.select({
        kycProfileComplete: users.kycProfileComplete,
        agreementSigned: users.agreementSigned,
        idVerificationComplete: users.idVerificationComplete,
      }).from(users).where(eq(users.id, userId));

      if (
        updatedUser?.kycProfileComplete &&
        updatedUser?.agreementSigned &&
        updatedUser?.idVerificationComplete
      ) {
        await db.update(users).set({ kycStatus: "verified" }).where(eq(users.id, userId));
        await db.insert(auditLogs as any).values({
          userId, action: "kyc_fully_verified", entityType: "user", entityId: String(userId),
          metadata: { promotedBy: "admin", trigger: "address_doc_approved" }, ipAddress: req.ip,
        });
      }

      res.json({ success: true, message: "Address document approved" });
    } catch (err: any) {
      res.status(500).json({ error: err.message ?? "Failed to approve address document" });
    }
  });

  // POST /api/admin/compliance/smr — log an SMR internal decision
  app.post("/api/admin/compliance/smr", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const schema = z.object({
        userId: z.number().optional(),
        transactionId: z.number().optional(),
        notes: z.string().min(10, "Notes required"),
        outcome: z.enum(["filed", "closed", "false_positive"]),
        austracRef: z.string().optional(),
      });
      const data = schema.parse(req.body);
      await db.insert(complianceActions).values({
        actionType: "smr",
        userId: data.userId,
        transactionId: data.transactionId,
        performedBy: "admin",
        notes: data.notes,
        outcome: data.outcome,
        austracRef: data.austracRef,
      });
      // If flagged txn, update its review status
      if (data.transactionId) {
        const outcome = data.outcome === "filed" ? "escalated" : data.outcome === "closed" ? "cleared" : "cleared";
        await db.update(transactions).set({ reviewStatus: outcome }).where(eq(transactions.id, data.transactionId));
      }
      res.json({ success: true, message: `SMR logged: ${data.outcome}` });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
      res.status(500).json({ error: err.message ?? "Failed to log SMR" });
    }
  });

  // POST /api/admin/compliance/ttr — log a TTR
  app.post("/api/admin/compliance/ttr", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const schema = z.object({
        userId: z.number(),
        transactionId: z.number(),
        notes: z.string().min(5, "Notes required"),
        austracRef: z.string().optional(),
      });
      const data = schema.parse(req.body);
      await db.insert(complianceActions).values({
        actionType: "ttr",
        userId: data.userId,
        transactionId: data.transactionId,
        performedBy: "admin",
        notes: data.notes,
        outcome: "filed",
        austracRef: data.austracRef,
      });
      res.json({ success: true, message: "TTR logged" });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
      res.status(500).json({ error: err.message ?? "Failed to log TTR" });
    }
  });

  // POST /api/admin/compliance/alert-review — resolve an AML flag
  app.post("/api/admin/compliance/alert-review", async (req: Request, res: any) => {
    if (!requireAdminKey(req, res)) return;
    try {
      const schema = z.object({
        flagId: z.number(),
        outcome: z.enum(["cleared", "escalated", "reviewing"]),
        notes: z.string().optional(),
      });
      const data = schema.parse(req.body);
      await db.update(amlFlags).set({
        status: data.outcome,
        notes: data.notes,
        reviewedAt: new Date(),
      }).where(eq(amlFlags.id, data.flagId));
      await db.insert(complianceActions).values({
        actionType: "alert_review",
        performedBy: "admin",
        notes: data.notes ?? `Alert ${data.flagId} reviewed`,
        outcome: data.outcome,
      });
      res.json({ success: true });
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
      res.status(500).json({ error: err.message ?? "Failed to update alert" });
    }
  });

  // ---------------------------------------------------------------------------
  //   • frankfurter.app  — ECB fiat rates (EUR, GBP, CAD, CNY vs USD)
  //   • api.coinbase.com — BTC and ETH spot prices
  // Runs immediately on startup, then every 15 minutes.
  // Fails silently on network errors — existing DB rates are kept as fallback.
  // ---------------------------------------------------------------------------
  async function refreshFxRates(): Promise<void> {
    // Helper: upsert a rate pair — INSERT if not exists, UPDATE if exists.
    // Needed because fx_rates has no unique constraint, so ON CONFLICT can't be used.
    async function upsertRate(base: string, target: string, rateStr: string, spread = '0.0050') {
      const exists = await storage.getFxRate(base, target);
      if (exists) {
        await db.execute(sql`UPDATE fx_rates SET rate = ${rateStr}, updated_at = NOW() WHERE base_currency = ${base} AND target_currency = ${target}`).catch(() => {});
      } else {
        await db.execute(sql`INSERT INTO fx_rates (base_currency, target_currency, rate, spread, updated_at) VALUES (${base}, ${target}, ${rateStr}, ${spread}, NOW())`).catch(() => {});
      }
    }

    try {
      // ── USD cross rates (ECB via Frankfurter — real market data, daily) ────
      const fiatRes = await fetch(
        "https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,CAD,CNY,AUD,HKD,SGD,JPY,KRW,NZD"
      );
      const usdRates: Record<string, number> = {};
      if (fiatRes.ok) {
        const fiatData = await fiatRes.json() as { rates: Record<string, number> };
        for (const [currency, rate] of Object.entries(fiatData.rates)) {
          usdRates[currency] = rate;
          await upsertRate('USD', currency, rate.toFixed(8));
          await upsertRate(currency, 'USD', (1 / rate).toFixed(8));
        }
      }

      // ── AUD cross rates (ECB via Frankfurter — real market data, daily) ────
      const audRes = await fetch(
        "https://api.frankfurter.app/latest?from=AUD&to=USD,CAD,EUR,GBP,HKD,SGD,JPY,KRW,CNY,NZD"
      );
      const audRates: Record<string, number> = {};
      if (audRes.ok) {
        const audData = await audRes.json() as { rates: Record<string, number> };
        for (const [currency, rate] of Object.entries(audData.rates)) {
          audRates[currency] = rate;
          await upsertRate('AUD', currency, rate.toFixed(8));
          await upsertRate(currency, 'AUD', (1 / rate).toFixed(8));
        }
      }

      // ── Stablecoins (USDT, USDC pegged 1:1 to USD) ────────────────────────
      const audUsd = audRates['USD'] || 0;
      if (audUsd > 0) {
        const audPerUsd = 1 / audUsd;
        for (const stable of ["USDT", "USDC"]) {
          await upsertRate(stable, 'AUD', audPerUsd.toFixed(8));
          await upsertRate('AUD', stable, audUsd.toFixed(8));
          await upsertRate(stable, 'USD', '1.00000000', '0.0010');
          await upsertRate('USD', stable, '1.00000000', '0.0010');
        }
      }

      // ── Crypto pairs (Coinbase spot — real market data, ~15 min) ──────────
      for (const [symbol, dbCurrency] of [["BTC-USD", "BTC"], ["ETH-USD", "ETH"]] as const) {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${symbol}/spot`);
        if (res.ok) {
          const body = await res.json() as { data: { amount: string } };
          const priceUsd = parseFloat(body.data.amount);
          if (isFinite(priceUsd) && priceUsd > 0) {
            await upsertRate(dbCurrency, 'USD', priceUsd.toFixed(8));
            // Derive AUD price and inverse
            if (audUsd > 0) {
              const priceAud = priceUsd / audUsd;
              await upsertRate(dbCurrency, 'AUD', priceAud.toFixed(8));
              await upsertRate('AUD', dbCurrency, (1 / priceAud).toFixed(10));
            }
          }
        }
      }

      console.log("[fx-refresh] rates updated at", new Date().toISOString());
    } catch (err) {
      // Fail silently — DB rates remain as fallback; don't crash the server
      console.error("[fx-refresh] failed:", (err as Error).message);
    }
  }

  // Run immediately on startup, then every 15 minutes
  refreshFxRates();
  setInterval(refreshFxRates, 15 * 60 * 1000);

  return httpServer;
}
