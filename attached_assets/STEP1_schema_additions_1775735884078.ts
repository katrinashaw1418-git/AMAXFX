// =============================================================================
// AMAX — STEP 1: SCHEMA ADDITIONS
// File: shared/schema.ts — ADD THESE TO YOUR EXISTING FILE
//
// Instructions:
//   1. Copy each table/column addition into shared/schema.ts
//   2. Run: npm run db:push
//   3. Verify new columns exist in your DB before proceeding to Step 2
//
// What this does NOT do:
//   - Does NOT use PG enums (keep text + Zod validation, matches your pattern)
//   - Does NOT create idempotency_keys (you already have it — idempotencyKeys table)
//   - Does NOT break any existing routes (all new columns are nullable)
// =============================================================================

// -----------------------------------------------------------------------------
// PART A — Add to your existing `wallets` table definition
// -----------------------------------------------------------------------------
//
// BEFORE (your current wallets table):
//
// export const wallets = pgTable("wallets", {
//   id: serial("id").primaryKey(),
//   userId: integer("user_id").references(() => users.id).notNull(),
//   currency: text("currency").notNull(),
//   balance: decimal("balance", { precision: 15, scale: 8 }).notNull(),
//   availableBalance: decimal("available_balance", { precision: 15, scale: 8 }).notNull(),
//   walletType: text("wallet_type").notNull(),
//   updatedAt: timestamp("updated_at").defaultNow(),
// }, ...);
//
// AFTER — add these three fields inside the table definition:

/*
  // Airwallex custody fields — populated after Airwallex wallet is created for this user+currency
  custodianWalletId: text("custodian_wallet_id"),          // Airwallex wallet ID
  custodianProvider: text("custodian_provider"),           // "airwallex" | null (null = legacy internal)
  lastReconciledAt: timestamp("last_reconciled_at"),       // timestamp of last successful reconciliation
*/

// Full updated wallets table (replace your existing one):
import {
  pgTable, text, serial, integer, boolean, decimal,
  timestamp, jsonb, uniqueIndex, check, numeric
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// NOTE: Import `users` from your existing schema — shown here for reference only
// import { users } from "./schema";

export const walletsUpdated = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),                    // .references(() => users.id)
  currency: text("currency").notNull(),
  balance: decimal("balance", { precision: 15, scale: 8 }).notNull(),
  availableBalance: decimal("available_balance", { precision: 15, scale: 8 }).notNull(),
  walletType: text("wallet_type").notNull(),               // "fiat" | "crypto"
  updatedAt: timestamp("updated_at").defaultNow(),

  // ── NEW: Airwallex custody mapping ─────────────────────────────────────────
  // Null = legacy internal wallet. Populated once Airwallex wallet is provisioned.
  custodianWalletId: text("custodian_wallet_id"),          // Airwallex wallet ID e.g. "wal_abc123"
  custodianProvider: text("custodian_provider"),           // "airwallex" | null
  lastReconciledAt: timestamp("last_reconciled_at"),       // last successful reconciliation timestamp
}, (table) => ({
  userCurrencyIdx: uniqueIndex("wallets_user_currency_uidx").on(table.userId, table.currency),
  balanceNonNeg: check("wallets_balance_non_negative", sql`${table.balance} >= 0`),
  availableBalanceNonNeg: check("wallets_available_balance_non_negative", sql`${table.availableBalance} >= 0`),
}));


// -----------------------------------------------------------------------------
// PART B — Add to your existing `transactions` table definition
// -----------------------------------------------------------------------------
//
// Add these fields to your existing transactions table:

/*
  // ── NEW: External settlement fields ──────────────────────────────────────
  externalTransactionId: text("external_transaction_id"),  // Airwallex conversion/payment ID
  externalReference: text("external_reference"),           // client_order_id we sent to Airwallex
  externalSettlementStatus: text("external_settlement_status"), // see SETTLEMENT_STATES below
  settlementUpdatedAt: timestamp("settlement_updated_at"), // last time settlement status changed
*/

// Full updated transactions table — only showing new fields, keep all your existing ones:
export const transactionsUpdated = pgTable("transactions", {
  // ... all your existing fields stay exactly as they are ...

  // ── NEW: External settlement tracking ──────────────────────────────────────
  // externalTransactionId: the ID Airwallex assigns to the conversion/payment
  // Use this to match incoming webhooks to your transaction records
  externalTransactionId: text("external_transaction_id"),

  // externalReference: the client_order_id you sent when creating the Airwallex conversion
  // This is your idempotency anchor with Airwallex
  externalReference: text("external_reference"),

  // externalSettlementStatus: tracks the lifecycle of the external settlement
  // Values: initiated | pending_external | fx_booked | settled | failed | reversed | migrated
  // NOTE: Keep as text (not PG enum) — consistent with all other status fields in your schema
  //       Validation happens at application layer via SETTLEMENT_STATUS_SCHEMA below
  externalSettlementStatus: text("external_settlement_status"),

  // settlementUpdatedAt: timestamp of last external settlement status change
  // Critical for reconciliation — lets you detect stale pending_external states
  settlementUpdatedAt: timestamp("settlement_updated_at"),
});


// -----------------------------------------------------------------------------
// PART C — NEW TABLE: webhook_events
// Add this as a new table in schema.ts
// -----------------------------------------------------------------------------
//
// Purpose: Idempotency guard for incoming Airwallex webhooks.
// Stores every processed event ID so duplicate deliveries are safely ignored.
// Separate from idempotency_keys (which is for outbound user requests).

export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),

  // eventId: Airwallex's unique event ID — used as idempotency key
  eventId: text("event_id").notNull().unique(),

  // eventType: Airwallex event name e.g. "conversion.settled", "payment.received"
  eventType: text("event_type").notNull(),

  // rawPayload: full webhook body stored for audit trail and replay capability
  rawPayload: jsonb("raw_payload").notNull(),

  // processed: true once all handlers have completed successfully
  processed: boolean("processed").notNull().default(false),

  // processingError: stores error message if handler threw — enables debugging
  processingError: text("processing_error"),

  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});


// -----------------------------------------------------------------------------
// PART D — NEW TABLE: reconciliation_logs
// Add this as a new table in schema.ts
// -----------------------------------------------------------------------------
//
// Purpose: Audit trail for balance reconciliation runs.
// Each row = one currency reconciliation check for one user.
// Used by: nightly cron job, pre-migration snapshot, post-migration verification.

export const reconciliationLogs = pgTable("reconciliation_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),                    // .references(() => users.id)
  currency: text("currency").notNull(),

  // internalBalance: what your AMAX DB says the user has
  internalBalance: decimal("internal_balance", { precision: 15, scale: 8 }).notNull(),

  // externalBalance: what Airwallex says the user has (null before Airwallex integration)
  externalBalance: decimal("external_balance", { precision: 15, scale: 8 }),

  // delta: internalBalance - externalBalance (0.00 = clean, non-zero = needs investigation)
  delta: decimal("delta", { precision: 15, scale: 8 }),

  // status: "match" | "mismatch" | "external_unavailable" | "pending_migration"
  status: text("status").notNull(),

  // runType: what triggered this reconciliation
  // "nightly_cron" | "pre_migration" | "post_migration" | "manual" | "webhook_triggered"
  runType: text("run_type").notNull().default("nightly_cron"),

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});


// -----------------------------------------------------------------------------
// PART E — NEW TABLE: migration_ledger
// Add this as a new table in schema.ts
// -----------------------------------------------------------------------------
//
// Purpose: Tracks the migration of each user wallet from internal to Airwallex custody.
// Created during pre-migration snapshot. Updated as each wallet migrates.
// Provides legal baseline and audit evidence.

export const migrationLedger = pgTable("migration_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),                    // .references(() => users.id)
  currency: text("currency").notNull(),

  // snapshotBalance: balance at time of migration freeze — legal baseline
  snapshotBalance: decimal("snapshot_balance", { precision: 15, scale: 8 }).notNull(),

  // airwallexWalletId: populated once Airwallex wallet is created for this user+currency
  airwallexWalletId: text("airwallex_wallet_id"),

  // airwallexBalance: balance confirmed in Airwallex after fund transfer
  airwallexBalance: decimal("airwallex_balance", { precision: 15, scale: 8 }),

  // reconciliationDelta: airwallexBalance - snapshotBalance (must be 0.00 for clean migration)
  // Non-zero values are compliance incidents — must be resolved before go-live
  reconciliationDelta: decimal("reconciliation_delta", { precision: 15, scale: 8 }),

  // migrationStatus: lifecycle of this wallet's migration
  // "pending" | "frozen" | "funds_transferred" | "verified" | "complete" | "failed"
  migrationStatus: text("migration_status").notNull().default("pending"),

  // migratedBy: "system" (automated) | "manual" (ops team intervened)
  migratedBy: text("migrated_by"),

  snapshotAt: timestamp("snapshot_at").defaultNow(),       // when snapshot was taken
  migratedAt: timestamp("migrated_at"),                    // when funds confirmed in Airwallex
  verifiedAt: timestamp("verified_at"),                    // when reconciliation passed

  notes: text("notes"),
});


// -----------------------------------------------------------------------------
// PART F — Zod validation for settlement status
// Add this to schema.ts — use in routes for validation
// -----------------------------------------------------------------------------

export const SETTLEMENT_STATES = [
  "initiated",        // User action received, no external call yet
  "pending_external", // Sent to Airwallex, awaiting processing
  "fx_booked",        // FX rate locked by Airwallex (optional intermediate state)
  "settled",          // Confirmed via Airwallex webhook — final success state
  "failed",           // Failed externally — funds NOT moved
  "reversed",         // Reversed/refunded by Airwallex
  "migrated",         // Legacy balance migrated from internal to Airwallex
  "internal_only",    // LEGACY: keep for backward compat with existing transactions
] as const;

export const SETTLEMENT_STATUS_SCHEMA = z.enum(SETTLEMENT_STATES);
export type SettlementStatus = z.infer<typeof SETTLEMENT_STATUS_SCHEMA>;


// -----------------------------------------------------------------------------
// PART G — Insert schemas and types for new tables
// Add these to the bottom of schema.ts alongside your existing insert schemas
// -----------------------------------------------------------------------------

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

export const insertReconciliationLogSchema = createInsertSchema(reconciliationLogs).omit({
  id: true,
  createdAt: true,
});

export const insertMigrationLedgerSchema = createInsertSchema(migrationLedger).omit({
  id: true,
  snapshotAt: true,
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type ReconciliationLog = typeof reconciliationLogs.$inferSelect;
export type InsertReconciliationLog = z.infer<typeof insertReconciliationLogSchema>;
export type MigrationLedger = typeof migrationLedger.$inferSelect;
export type InsertMigrationLedger = z.infer<typeof insertMigrationLedgerSchema>;


// =============================================================================
// STEP 1 CHECKLIST — verify before running db:push
// =============================================================================
//
// □ wallets table: custodianWalletId, custodianProvider, lastReconciledAt added
// □ transactions table: externalTransactionId, externalReference,
//     externalSettlementStatus, settlementUpdatedAt added
// □ webhook_events table: new table added
// □ reconciliation_logs table: new table added
// □ migration_ledger table: new table added
// □ SETTLEMENT_STATES and SETTLEMENT_STATUS_SCHEMA exported
// □ All new insert schemas and types exported
// □ No PG enums used (text columns only)
// □ idempotency_keys NOT recreated (already exists)
//
// THEN RUN: npm run db:push
// Verify with: SELECT column_name FROM information_schema.columns
//              WHERE table_name = 'wallets' ORDER BY ordinal_position;
