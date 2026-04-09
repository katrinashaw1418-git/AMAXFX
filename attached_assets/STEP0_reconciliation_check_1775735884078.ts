// =============================================================================
// AMAX — RECONCILIATION SCRIPT (Run BEFORE any migration)
// Location: server/reconciliation.ts (new file)
//
// Purpose: Verify your internal ledger is clean before you touch Airwallex.
// Run this manually FIRST. If it fails, fix the issues before proceeding.
//
// Usage:
//   npx tsx server/reconciliation.ts
//
// What it does:
//   1. Sums all user wallet balances per currency
//   2. Checks for negative balances, orphan transactions, pending stuck records
//   3. Outputs a full reconciliation report
//   4. Exits with code 1 if any issues found (safe to use in CI)
// =============================================================================

import { db } from "./db";
import { wallets, transactions, users, reconciliationLogs } from "@shared/schema";
import { eq, sql, and, ne } from "drizzle-orm";
import Decimal from "decimal.js";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface CurrencySummary {
  currency: string;
  totalUserBalances: Decimal;
  walletCount: number;
  negativeBalanceCount: number;
  issues: string[];
}

interface ReconciliationReport {
  runAt: Date;
  currencySummaries: CurrencySummary[];
  orphanedTransactions: number;
  stuckPendingTransactions: number;
  totalIssues: number;
  clean: boolean;
}

// -----------------------------------------------------------------------------
// STEP 1 — Sum all user balances per currency
// -----------------------------------------------------------------------------

async function sumBalancesByCurrency(): Promise<CurrencySummary[]> {
  // Get all distinct currencies
  const currencyRows = await db
    .select({ currency: wallets.currency })
    .from(wallets)
    .groupBy(wallets.currency);

  const summaries: CurrencySummary[] = [];

  for (const { currency } of currencyRows) {
    const issues: string[] = [];

    // Sum all balances for this currency
    const [sumResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${wallets.balance} AS DECIMAL)), 0)::text`,
        count: sql<string>`COUNT(*)::text`,
      })
      .from(wallets)
      .where(eq(wallets.currency, currency));

    const totalBalance = new Decimal(sumResult?.total ?? "0");
    const walletCount = parseInt(sumResult?.count ?? "0", 10);

    // Check for negative balances (should never exist due to DB check constraint)
    const [negResult] = await db
      .select({ count: sql<string>`COUNT(*)::text` })
      .from(wallets)
      .where(
        and(
          eq(wallets.currency, currency),
          sql`CAST(${wallets.balance} AS DECIMAL) < 0`
        )
      );
    const negCount = parseInt(negResult?.count ?? "0", 10);

    if (negCount > 0) {
      issues.push(`${negCount} wallet(s) with negative balance — CRITICAL`);
    }

    // Check for balance/availableBalance mismatch (available > balance is impossible)
    const [mismatchResult] = await db
      .select({ count: sql<string>`COUNT(*)::text` })
      .from(wallets)
      .where(
        and(
          eq(wallets.currency, currency),
          sql`CAST(${wallets.availableBalance} AS DECIMAL) > CAST(${wallets.balance} AS DECIMAL)`
        )
      );
    const mismatchCount = parseInt(mismatchResult?.count ?? "0", 10);
    if (mismatchCount > 0) {
      issues.push(`${mismatchCount} wallet(s) where availableBalance > balance — CRITICAL`);
    }

    summaries.push({
      currency,
      totalUserBalances: totalBalance,
      walletCount,
      negativeBalanceCount: negCount,
      issues,
    });
  }

  return summaries;
}

// -----------------------------------------------------------------------------
// STEP 2 — Check for orphaned transactions
// -----------------------------------------------------------------------------
// Orphaned = transaction references a userId that doesn't exist
// This shouldn't happen with FK constraints but worth verifying

async function checkOrphanedTransactions(): Promise<number> {
  const [result] = await db
    .select({ count: sql<string>`COUNT(*)::text` })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(sql`${users.id} IS NULL`);

  return parseInt(result?.count ?? "0", 10);
}

// -----------------------------------------------------------------------------
// STEP 3 — Check for stuck pending transactions
// -----------------------------------------------------------------------------
// Stuck = pending transactions older than 24 hours
// These should be investigated before migration

async function checkStuckPendingTransactions(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [result] = await db
    .select({ count: sql<string>`COUNT(*)::text` })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, "pending"),
        sql`${transactions.createdAt} < ${cutoff}`
      )
    );

  return parseInt(result?.count ?? "0", 10);
}

// -----------------------------------------------------------------------------
// STEP 4 — Detect duplicate wallet entries
// -----------------------------------------------------------------------------
// Should be prevented by unique index but verify

async function checkDuplicateWallets(): Promise<string[]> {
  const duplicates = await db
    .select({
      userId: wallets.userId,
      currency: wallets.currency,
      count: sql<string>`COUNT(*)::text`,
    })
    .from(wallets)
    .groupBy(wallets.userId, wallets.currency)
    .having(sql`COUNT(*) > 1`);

  return duplicates.map(
    d => `User ${d.userId} has ${d.count} wallets for ${d.currency}`
  );
}

// -----------------------------------------------------------------------------
// STEP 5 — Write reconciliation log records to DB
// -----------------------------------------------------------------------------

async function writeReconciliationLogs(summaries: CurrencySummary[]): Promise<void> {
  for (const summary of summaries) {
    // Write one aggregate log per currency (not per user — that's the migration check)
    await db.insert(reconciliationLogs).values({
      userId: 0,          // 0 = system-level aggregate check
      currency: summary.currency,
      internalBalance: summary.totalUserBalances.toFixed(8),
      externalBalance: null,   // null until Airwallex is integrated
      delta: null,
      status: summary.issues.length === 0 ? "match" : "mismatch",
      runType: "pre_migration",
      notes: summary.issues.length > 0
        ? summary.issues.join("; ")
        : `${summary.walletCount} wallets, total ${summary.totalUserBalances.toFixed(2)} ${summary.currency}`,
    } as any);
  }
}

// -----------------------------------------------------------------------------
// MAIN — Run the full pre-migration reconciliation
// -----------------------------------------------------------------------------

async function runPreMigrationReconciliation(): Promise<ReconciliationReport> {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  AMAX PRE-MIGRATION RECONCILIATION");
  console.log(`  Run at: ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  const currencySummaries = await sumBalancesByCurrency();
  const orphanedTransactions = await checkOrphanedTransactions();
  const stuckPendingTransactions = await checkStuckPendingTransactions();
  const duplicateWallets = await checkDuplicateWallets();

  // Print currency summaries
  console.log("CURRENCY BALANCES:");
  console.log("─────────────────────────────────────────");
  for (const summary of currencySummaries) {
    const statusIcon = summary.issues.length === 0 ? "✓" : "✗";
    console.log(
      `  ${statusIcon} ${summary.currency.padEnd(6)} ` +
      `Total: ${summary.totalUserBalances.toFixed(2).padStart(14)} ` +
      `Wallets: ${summary.walletCount}`
    );
    if (summary.issues.length > 0) {
      summary.issues.forEach(issue => console.log(`      ⚠ ${issue}`));
    }
  }

  // Print transaction checks
  console.log("\nTRANSACTION INTEGRITY:");
  console.log("─────────────────────────────────────────");
  console.log(`  ${orphanedTransactions === 0 ? "✓" : "✗"} Orphaned transactions: ${orphanedTransactions}`);
  console.log(`  ${stuckPendingTransactions === 0 ? "✓" : "⚠"} Stuck pending (>24h): ${stuckPendingTransactions}`);
  console.log(`  ${duplicateWallets.length === 0 ? "✓" : "✗"} Duplicate wallets: ${duplicateWallets.length}`);
  if (duplicateWallets.length > 0) {
    duplicateWallets.forEach(d => console.log(`      ⚠ ${d}`));
  }

  const allCurrencyIssues = currencySummaries.reduce(
    (sum, s) => sum + s.issues.length, 0
  );
  const totalIssues = allCurrencyIssues + orphanedTransactions + duplicateWallets.length;
  const clean = totalIssues === 0;

  // Write to DB
  await writeReconciliationLogs(currencySummaries);

  // Print verdict
  console.log("\n═══════════════════════════════════════════════════════════");
  if (clean) {
    console.log("  ✓ LEDGER IS CLEAN — safe to proceed with migration");
  } else {
    console.log(`  ✗ LEDGER HAS ${totalIssues} ISSUE(S) — DO NOT MIGRATE`);
    console.log("    Fix all issues above before proceeding.");
    if (stuckPendingTransactions > 0) {
      console.log(`    ${stuckPendingTransactions} stuck pending transactions need manual review.`);
    }
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  return {
    runAt: new Date(),
    currencySummaries,
    orphanedTransactions,
    stuckPendingTransactions,
    totalIssues,
    clean,
  };
}

// Run if called directly
runPreMigrationReconciliation()
  .then(report => {
    process.exit(report.clean ? 0 : 1);
  })
  .catch(err => {
    console.error("Reconciliation script failed:", err);
    process.exit(1);
  });
