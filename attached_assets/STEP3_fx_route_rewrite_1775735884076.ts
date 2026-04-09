// =============================================================================
// AMAX — STEP 3: FX ROUTE REWRITE (WEBHOOK-FIRST)
// Location: Replace your existing app.post("/api/fx-exchange", ...) handler
//           inside registerRoutes() in server/routes.ts
//
// Key differences from the advisory document's version:
//   1. DB transaction wraps record operations (not deleted — wallet mutations removed)
//   2. Error handler marks failed transactions (no orphaned "initiated" records)
//   3. Airwallex token auth via getAirwallexToken() (not static Bearer key)
//   4. client_order_id is idempotency-safe (user-scoped hash, not raw tx ID)
//   5. Uses Drizzle throughout (not Knex)
//   6. All existing compliance infrastructure preserved (KYC, AML, TTR, audit log)
//   7. Returns pending status — UI must handle async settlement
// =============================================================================

import { createHash } from "crypto";
import Decimal from "decimal.js";
import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import { wallets, transactions } from "@shared/schema";
import { getAirwallexToken } from "./webhooks"; // exported from Step 2
import {
  requireAuth,
  requireKyc,
} from "./auth";
import {
  checkDailyLimit,
  checkIdempotency,
  saveIdempotentResponse,
  writeAuditLog,
  runAmlCheck,
  classifyAssetType,
  moneyMovementLimiter,
} from "./routes"; // your existing helpers
import { z } from "zod";

// -----------------------------------------------------------------------------
// SECTION 1 — Updated FX exchange Zod schema
// -----------------------------------------------------------------------------
// Extends your existing fxExchangeSchema with the idempotency key header support.
// The schema itself is unchanged — idempotency key comes via request header.

const fxExchangeSchemaV2 = z.object({
  fromCurrency: z.string().min(2).max(10),
  toCurrency: z.string().min(2).max(10),
  amount: z.coerce.number().positive("Amount must be positive"),
  // Travel Rule / DCE fields (unchanged from your existing schema)
  destinationWallet: z.string().max(200).optional(),
  walletType: z.enum(["custodial", "self_hosted"]).optional(),
  custodianName: z.string().max(120).optional(),
}).refine(d => d.fromCurrency !== d.toCurrency, {
  message: "Source and target currencies must differ",
});

// -----------------------------------------------------------------------------
// SECTION 2 — Airwallex conversion API wrapper
// -----------------------------------------------------------------------------
// Creates a conversion (FX order) with Airwallex.
// Uses short-lived token from getAirwallexToken() — not a static Bearer key.
// client_order_id is your idempotency anchor with Airwallex.

interface AirwallexConversionParams {
  sellCurrency: string;
  buyCurrency: string;
  sellAmount: string;         // string to avoid float precision issues
  clientOrderId: string;      // your idempotency key — Airwallex deduplicates on this
}

interface AirwallexConversionResponse {
  id: string;                 // Airwallex's conversion ID — store as external_transaction_id
  status: string;             // "CREATED" | "PENDING" | "SETTLED" | "FAILED"
  sell_amount: string;
  buy_amount: string;
  client_order_id: string;
}

async function createAirwallexConversion(
  params: AirwallexConversionParams
): Promise<AirwallexConversionResponse> {
  const token = await getAirwallexToken();
  const apiBase = process.env.AIRWALLEX_API_BASE ?? "https://api-demo.airwallex.com";

  const response = await fetch(`${apiBase}/api/v1/conversions/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sell_currency: params.sellCurrency,
      buy_currency: params.buyCurrency,
      sell_amount: params.sellAmount,
      client_order_id: params.clientOrderId, // Airwallex idempotency key
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw Object.assign(
      new Error(errBody?.message ?? `Airwallex conversion failed: ${response.status}`),
      { status: response.status === 400 ? 400 : 502 }
    );
  }

  return response.json();
}

// -----------------------------------------------------------------------------
// SECTION 3 — Client order ID generation
// -----------------------------------------------------------------------------
// client_order_id must be:
//   a) Unique per conversion
//   b) Deterministic for the same user + idempotency key combination
//   c) Safe to send to Airwallex on retry without creating duplicate conversions
//
// Strategy: hash(userId + idemKey + fromCurrency + toCurrency + amount)
// This means the same user retrying the same conversion gets the same
// client_order_id — Airwallex returns the existing conversion rather than
// creating a new one.

function buildClientOrderId(
  userId: number,
  idemKey: string,
  fromCurrency: string,
  toCurrency: string,
  amount: string
): string {
  return createHash("sha256")
    .update(`${userId}:${idemKey}:${fromCurrency}:${toCurrency}:${amount}`)
    .digest("hex")
    .slice(0, 64); // Airwallex client_order_id max length
}

// -----------------------------------------------------------------------------
// SECTION 4 — The rewritten FX exchange route
// -----------------------------------------------------------------------------
// Replace your entire existing app.post("/api/fx-exchange", ...) handler with this.
//
// WHAT CHANGED vs your current route:
//   REMOVED: direct wallet debit/credit (the DB mutation that made you the custodian)
//   REMOVED: SERIALIZABLE wallet balance updates
//   REMOVED: settlementStatus: "internal_only"
//   REMOVED: instant completion
//
//   KEPT:    all KYC/AML/TTR/audit log infrastructure (untouched)
//   KEPT:    idempotency check (extended to be Airwallex-safe)
//   KEPT:    rate limiting
//   KEPT:    Travel Rule / DCE compliance fields
//   KEPT:    triangulation for cross-pairs
//
//   ADDED:   Airwallex conversion API call
//   ADDED:   external_transaction_id + external_reference stored
//   ADDED:   externalSettlementStatus: "pending_external"
//   ADDED:   error handler marks failed records
//   ADDED:   pending response to UI

export function registerFxExchangeRoute(app: Express): void {
  app.post("/api/fx-exchange", moneyMovementLimiter, async (req, res) => {
    let txRecordId: number | null = null; // track for error cleanup

    try {
      const { userId } = requireAuth(req);
      await requireKyc(userId, storage);

      const parsed = fxExchangeSchemaV2.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0].message });
      }

      const {
        fromCurrency, toCurrency,
        amount: rawAmount,
        destinationWallet, walletType, custodianName
      } = parsed.data;
      const amount = new Decimal(rawAmount);

      // Enforce risk-based daily limit (unchanged)
      await checkDailyLimit(userId, amount, fromCurrency);

      // Idempotency check (unchanged pattern, extended for Airwallex safety)
      const idemKey = req.headers["idempotency-key"] as string | undefined;
      const payloadHash = hashPayload(req.body);

      if (idemKey) {
        const idem = await checkIdempotency(userId, "/api/fx-exchange", idemKey, payloadHash);
        if (idem.conflict) {
          return res.status(422).json({
            error: "Idempotency-Key reused with a different request payload.",
          });
        }
        if (idem.existing) {
          return res.json({ ...(idem.response as object), idempotent: true });
        }
      }

      // Validate currencies differ (belt-and-suspenders, Zod refine already checks)
      if (fromCurrency === toCurrency) {
        return res.status(400).json({ error: "From and To currencies must be different" });
      }

      // Look up FX rate (unchanged — used for fee estimation displayed to user)
      let rateValue: string | null = null;
      const directRate = await storage.getFxRate(fromCurrency, toCurrency);
      if (directRate) {
        rateValue = directRate.rate;
      } else {
        const fromUsd = await storage.getFxRate(fromCurrency, "USD");
        const usdTo   = await storage.getFxRate("USD", toCurrency);
        if (fromUsd && usdTo) {
          rateValue = new Decimal(fromUsd.rate).mul(usdTo.rate).toFixed(8);
        }
      }
      if (!rateValue) {
        return res.status(400).json({ error: "Exchange rate not available for this pair" });
      }

      const rate = directRate ?? { rate: rateValue, spread: "0.005" };
      const exchangeRate = new Decimal(rate.rate);
      const converted = amount.mul(exchangeRate);
      const fee = converted.mul("0.005");
      const estimatedNetConverted = converted.minus(fee);

      // Verify source wallet exists and has sufficient balance
      const [fromWallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.userId, userId), eq(wallets.currency, fromCurrency)));

      if (!fromWallet) {
        return res.status(404).json({ error: "Source wallet not found" });
      }

      const available = new Decimal(fromWallet.availableBalance);
      if (available.lt(amount)) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Ensure target wallet exists (create if needed — unchanged)
      const existingToWallet = await storage.getWallet(userId, toCurrency);
      if (!existingToWallet) {
        await storage.createWallet({
          userId, currency: toCurrency,
          balance: "0.00", availableBalance: "0.00",
          walletType: CRYPTO_CURRENCIES.includes(toCurrency) ? "crypto" : "fiat",
        });
      }

      // ── CORE CHANGE: Build client_order_id as idempotency anchor ──────────
      // This is the key that Airwallex uses to deduplicate — deterministic per
      // user + request. Double-taps or network retries return the same conversion.
      const clientOrderId = buildClientOrderId(
        userId,
        idemKey ?? randomBytes(16).toString("hex"), // fall back to random if no idem key
        fromCurrency,
        toCurrency,
        amount.toFixed(8)
      );

      // ── CORE CHANGE: Create transaction record FIRST (status: initiated) ──
      // No wallet balance mutations. The record creation is the only DB write here.
      let txRecord: any;
      await db.transaction(async (tx) => {
        await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

        [txRecord] = await tx.insert(transactions).values({
          userId,
          type: "exchange",
          fromCurrency,
          toCurrency,
          amount: amount.toFixed(8),
          fee: fee.toFixed(8),
          exchangeRate: exchangeRate.toFixed(8),
          status: "pending",                          // pending until webhook confirms
          settlementStatus: "pending_external",        // replaces "internal_only"
          externalSettlementStatus: "initiated",       // new field from Step 1
          externalReference: clientOrderId,            // our idempotency key to Airwallex
          description: `${fromCurrency} → ${toCurrency} Exchange (pending Airwallex settlement)`,
          assetType: classifyAssetType(fromCurrency, toCurrency),
          direction: "exchange",
          riskFlag: false,
          reviewStatus: "clear",
          reviewNotes: null,
          // Travel Rule / DCE fields (unchanged)
          beneficiaryAddress: destinationWallet ?? null,
          beneficiaryName: walletType
            ? (walletType === "self_hosted"
                ? "Self-hosted wallet"
                : `Custodial — ${custodianName ?? "unknown"}`)
            : null,
        } as any).returning();
      });

      txRecordId = txRecord?.id;

      // ── CORE CHANGE: Call Airwallex conversion API ─────────────────────────
      // This is the external settlement request. If it fails, we mark our
      // transaction as failed (error handler below handles this).
      const airwallexConversion = await createAirwallexConversion({
        sellCurrency: fromCurrency,
        buyCurrency: toCurrency,
        sellAmount: amount.toFixed(8),
        clientOrderId,
      });

      // ── Store Airwallex's conversion ID for webhook matching ───────────────
      // This is the critical mapping: when "conversion.settled" arrives,
      // the webhook handler looks up transactions.external_transaction_id
      await db
        .update(transactions)
        .set({
          externalTransactionId: airwallexConversion.id,
          externalSettlementStatus: "pending_external",
        } as any)
        .where(eq(transactions.id, txRecord.id));

      // AML check (unchanged — non-blocking)
      await runAmlCheck(
        userId, txRecord.id, amount,
        classifyAssetType(fromCurrency, toCurrency), "exchange"
      );

      // Audit log (unchanged)
      await writeAuditLog(
        userId, "fx_exchange_initiated", "transaction", String(txRecord.id),
        { fromCurrency, toCurrency, amount: rawAmount, airwallexConversionId: airwallexConversion.id },
        req.ip ?? null
      );

      // ── CORE CHANGE: Return pending status ────────────────────────────────
      // Transaction is NOT complete. Settlement happens via webhook.
      // UI must poll or subscribe to status updates.
      const responseBody = {
        transactionId: txRecord.id,
        status: "pending",                            // NOT "completed"
        message: "FX conversion submitted. Settlement will confirm shortly.",
        estimatedAmount: estimatedNetConverted.toNumber(),
        estimatedRate: exchangeRate.toNumber(),
        fee: fee.toNumber(),
        airwallexConversionId: airwallexConversion.id,
      };

      if (idemKey) {
        await saveIdempotentResponse(userId, "/api/fx-exchange", idemKey, payloadHash, responseBody);
      }

      return res.json(responseBody);

    } catch (error: any) {
      // ── CORE CHANGE: Mark transaction as failed on any error ──────────────
      // Prevents orphaned "initiated" records in your DB.
      // Without this, a partial failure leaves a ghost transaction that
      // confuses your reconciliation engine.
      if (txRecordId !== null) {
        try {
          await db
            .update(transactions)
            .set({
              status: "failed",
              externalSettlementStatus: "failed",
              settlementUpdatedAt: new Date(),
            } as any)
            .where(eq(transactions.id, txRecordId));
        } catch (cleanupErr) {
          console.error("[fx-exchange] Failed to mark transaction as failed:", cleanupErr);
        }
      }

      if (error.status) return res.status(error.status).json({ error: error.message });
      console.error("[fx-exchange]", error?.message ?? error);
      return res.status(500).json({ error: "Failed to process FX exchange" });
    }
  });
}

// =============================================================================
// SECTION 5 — UI changes required (frontend notes)
// =============================================================================
//
// Your fx-exchange.tsx currently does:
//   onSuccess: toast("Exchange Successful") + invalidate queries
//
// After this change it must:
//   onSuccess: toast("Conversion submitted — settlement in progress")
//             + show pending state in UI
//             + poll GET /api/transactions?id=X every 3s until status = completed
//             + OR subscribe via websocket if you have one
//
// Add to your FX exchange confirm modal:
//   - Disable submit button while pending
//   - Show spinner with "Awaiting settlement..." message
//   - Update to success/failure once webhook fires and GET /api/transactions reflects it
//
// The GET /api/transactions endpoint already exists and returns current status.
// No backend changes needed for polling — just change the frontend.

// =============================================================================
// SECTION 6 — Environment variables required
// =============================================================================
//
// Add to your .env:
//
//   AIRWALLEX_API_BASE=https://api-demo.airwallex.com   # sandbox
//   AIRWALLEX_CLIENT_ID=your_client_id_from_airwallex
//   AIRWALLEX_API_KEY=your_api_key_from_airwallex
//   AIRWALLEX_WEBHOOK_SECRET=your_webhook_secret_from_airwallex
//
// Production:
//   AIRWALLEX_API_BASE=https://api.airwallex.com

// =============================================================================
// STEP 3 CHECKLIST
// =============================================================================
//
// □ Old /api/fx-exchange handler removed from routes.ts
// □ registerFxExchangeRoute(app) called inside registerRoutes()
// □ getAirwallexToken imported from step 2 webhook file
// □ No wallet.balance or wallet.availableBalance mutations in this route
// □ Transaction created with status: "pending", externalSettlementStatus: "initiated"
// □ Airwallex conversion created using token auth (not static Bearer)
// □ external_transaction_id stored after Airwallex responds
// □ client_order_id is deterministic hash (not raw tx ID)
// □ Error handler marks failed transactions in DB
// □ Response returns { status: "pending" } not { status: "completed" }
// □ Frontend updated to handle pending state
// □ .env updated with Airwallex credentials
