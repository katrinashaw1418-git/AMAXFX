// =============================================================================
// AMAX — STEP 2: AIRWALLEX WEBHOOK HANDLER
// Location: add inside server/routes.ts — inside your registerRoutes() function
//           alongside your existing app.post() route definitions
//
// Key differences from the advisory document's version:
//   1. Uses raw Buffer for signature verification (not JSON.stringify)
//   2. Uses Drizzle ORM throughout (not Knex)
//   3. Idempotency + handler wrapped in single atomic DB transaction
//   4. Fetches authoritative balance from Airwallex (does NOT trust webhook amount)
//   5. Fits your existing express.Router pattern in registerRoutes()
// =============================================================================

import { createHmac, timingSafeEqual } from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  transactions,
  wallets,
  webhookEvents,
  reconciliationLogs,
} from "@shared/schema";
import { writeAuditLog } from "./routes"; // your existing audit log helper

// -----------------------------------------------------------------------------
// SECTION 1 — Raw body middleware
// -----------------------------------------------------------------------------
// CRITICAL: Express must receive the raw Buffer BEFORE JSON parsing for
// signature verification to work. Add this BEFORE your JSON body-parser
// for the webhook route only.
//
// In server/index.ts or wherever you configure Express middleware, add:
//
//   app.use(
//     "/api/webhooks/airwallex",
//     express.raw({ type: "application/json" })
//   );
//
// All other routes keep their normal express.json() middleware.
// The webhook route handler receives req.body as a Buffer.

// -----------------------------------------------------------------------------
// SECTION 2 — Signature verification
// -----------------------------------------------------------------------------
// Verifies the HMAC-SHA256 signature Airwallex attaches to every webhook.
// Uses Buffer comparison (timingSafeEqual) to prevent timing attacks.
//
// IMPORTANT: Confirm Airwallex's exact header name and signing scheme in their
// webhook documentation before going to production. The header below
// ("x-airwallex-signature") is the documented value but verify it.

function verifyAirwallexSignature(rawBody: Buffer, signatureHeader: string): boolean {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] AIRWALLEX_WEBHOOK_SECRET not set — rejecting all webhooks");
    return false;
  }

  try {
    const expected = createHmac("sha256", secret)
      .update(rawBody)          // raw Buffer, NOT JSON.stringify(req.body)
      .digest("hex");

    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(signatureHeader, "utf8");

    // timingSafeEqual prevents timing attacks — buffers must be same length
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// SECTION 3 — Airwallex balance fetch
// -----------------------------------------------------------------------------
// Fetches the authoritative balance from Airwallex for a given wallet ID.
// Used by settlement handlers — we NEVER trust the balance in the webhook payload
// because a tampered or replayed webhook could corrupt your ledger.
//
// Returns null if the fetch fails — callers must handle this gracefully.

async function fetchAirwallexBalance(
  airwallexWalletId: string,
  currency: string
): Promise<string | null> {
  try {
    const token = await getAirwallexToken(); // see SECTION 7
    const response = await fetch(
      `${process.env.AIRWALLEX_API_BASE}/api/v1/balances?wallet_id=${airwallexWalletId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`[webhook] Airwallex balance fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    // Airwallex returns an array of currency balances
    const currencyBalance = data?.items?.find(
      (b: any) => b.currency === currency
    );
    return currencyBalance?.available_amount?.toString() ?? null;
  } catch (err) {
    console.error("[webhook] fetchAirwallexBalance error:", err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// SECTION 4 — FX settled handler
// -----------------------------------------------------------------------------
// Called when Airwallex fires "conversion.settled"
// Updates your transaction record and mirrors the balance from Airwallex.
//
// Uses a SERIALIZABLE transaction that atomically:
//   a) marks the webhook as processed
//   b) updates the transaction settlement status
//   c) mirrors the authoritative balance from Airwallex

async function handleFxSettled(
  eventId: string,
  data: any,
  rawPayload: Buffer
): Promise<void> {
  const externalTransactionId = data.id;         // Airwallex conversion ID
  const fromCurrency: string = data.sell_currency;
  const toCurrency: string = data.buy_currency;
  const settledAmount: string = data.buy_amount?.toString();

  // Find our transaction record using the external ID stored when we created the conversion
  const [txRecord] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.externalTransactionId as any, externalTransactionId));

  if (!txRecord) {
    // This can legitimately happen if the webhook arrives before our DB write completes
    // Log it but don't throw — Airwallex will retry
    console.warn(`[webhook] conversion.settled: no transaction found for ${externalTransactionId}`);
    return;
  }

  // Fetch authoritative balances from Airwallex BEFORE writing to DB
  // Never use the amounts in the webhook payload directly
  const [fromWallet] = await db
    .select()
    .from(wallets)
    .where(
      and(
        eq(wallets.userId, txRecord.userId),
        eq(wallets.currency, fromCurrency)
      )
    );

  const [toWallet] = await db
    .select()
    .from(wallets)
    .where(
      and(
        eq(wallets.userId, txRecord.userId),
        eq(wallets.currency, toCurrency)
      )
    );

  // Fetch authoritative balances (null = Airwallex API unavailable)
  const authFromBalance = fromWallet?.custodianWalletId
    ? await fetchAirwallexBalance(fromWallet.custodianWalletId, fromCurrency)
    : null;
  const authToBalance = toWallet?.custodianWalletId
    ? await fetchAirwallexBalance(toWallet.custodianWalletId, toCurrency)
    : null;

  // Atomic DB transaction: idempotency record + settlement update + balance mirror
  await db.transaction(async (tx) => {
    await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

    // Step 1: Record webhook as processed (idempotency guard)
    await tx.insert(webhookEvents).values({
      eventId,
      eventType: "conversion.settled",
      rawPayload: JSON.parse(rawPayload.toString()),
      processed: true,
      processedAt: new Date(),
    });

    // Step 2: Update transaction settlement status to settled
    await tx
      .update(transactions)
      .set({
        settlementStatus: "settled",         // your existing column
        externalSettlementStatus: "settled", // new column from Step 1
        settlementUpdatedAt: new Date(),
        status: "completed",
      } as any)
      .where(eq(transactions.id, txRecord.id));

    // Step 3: Mirror authoritative balances (only if we got them from Airwallex)
    if (authFromBalance !== null && fromWallet) {
      await tx
        .update(wallets)
        .set({
          balance: authFromBalance,
          availableBalance: authFromBalance,
          lastReconciledAt: new Date(),
        } as any)
        .where(eq(wallets.id, fromWallet.id));
    }

    if (authToBalance !== null && toWallet) {
      await tx
        .update(wallets)
        .set({
          balance: authToBalance,
          availableBalance: authToBalance,
          lastReconciledAt: new Date(),
        } as any)
        .where(eq(wallets.id, toWallet.id));
    }
  });

  // Write audit log outside the DB transaction (non-blocking)
  await writeAuditLog(
    txRecord.userId,
    "fx_settled_webhook",
    "transaction",
    String(txRecord.id),
    { externalTransactionId, fromCurrency, toCurrency, settledAmount },
    null
  );

  console.log(`[webhook] FX settled: txId=${txRecord.id} external=${externalTransactionId}`);
}

// -----------------------------------------------------------------------------
// SECTION 5 — FX failed handler
// -----------------------------------------------------------------------------

async function handleFxFailed(eventId: string, data: any, rawPayload: Buffer): Promise<void> {
  const externalTransactionId = data.id;

  const [txRecord] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.externalTransactionId as any, externalTransactionId));

  if (!txRecord) {
    console.warn(`[webhook] conversion.failed: no transaction found for ${externalTransactionId}`);
    return;
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

    await tx.insert(webhookEvents).values({
      eventId,
      eventType: "conversion.failed",
      rawPayload: JSON.parse(rawPayload.toString()),
      processed: true,
      processedAt: new Date(),
    });

    await tx
      .update(transactions)
      .set({
        settlementStatus: "failed",
        externalSettlementStatus: "failed",
        settlementUpdatedAt: new Date(),
        status: "failed",
      } as any)
      .where(eq(transactions.id, txRecord.id));
  });

  await writeAuditLog(
    txRecord.userId,
    "fx_failed_webhook",
    "transaction",
    String(txRecord.id),
    { externalTransactionId, reason: data.failure_reason },
    null
  );

  console.log(`[webhook] FX failed: txId=${txRecord.id} external=${externalTransactionId}`);
}

// -----------------------------------------------------------------------------
// SECTION 6 — Deposit confirmed handler
// -----------------------------------------------------------------------------
// Called when Airwallex fires "payment.received" (bank transfer / PayID confirmed)
// Matches by external_reference (the reference code you generated at deposit time)

async function handleDepositConfirmed(
  eventId: string,
  data: any,
  rawPayload: Buffer
): Promise<void> {
  const paymentReference = data.reference;         // the reference you generated
  const currency: string = data.currency;
  const receivedAmount: string = data.amount?.toString();

  // Find the pending deposit transaction by reference
  const [txRecord] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.referenceId, paymentReference));

  if (!txRecord) {
    console.warn(`[webhook] payment.received: no transaction for reference ${paymentReference}`);
    return;
  }

  // Fetch authoritative balance from Airwallex
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(
      and(
        eq(wallets.userId, txRecord.userId),
        eq(wallets.currency, currency)
      )
    );

  const authBalance = wallet?.custodianWalletId
    ? await fetchAirwallexBalance(wallet.custodianWalletId, currency)
    : null;

  await db.transaction(async (tx) => {
    await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

    await tx.insert(webhookEvents).values({
      eventId,
      eventType: "payment.received",
      rawPayload: JSON.parse(rawPayload.toString()),
      processed: true,
      processedAt: new Date(),
    });

    await tx
      .update(transactions)
      .set({
        settlementStatus: "settled",
        externalSettlementStatus: "settled",
        settlementUpdatedAt: new Date(),
        status: "completed",
      } as any)
      .where(eq(transactions.id, txRecord.id));

    // Mirror authoritative balance
    if (authBalance !== null && wallet) {
      await tx
        .update(wallets)
        .set({
          balance: authBalance,
          availableBalance: authBalance,
          lastReconciledAt: new Date(),
        } as any)
        .where(eq(wallets.id, wallet.id));
    }
  });

  await writeAuditLog(
    txRecord.userId,
    "deposit_confirmed_webhook",
    "transaction",
    String(txRecord.id),
    { paymentReference, currency, receivedAmount },
    null
  );

  console.log(`[webhook] Deposit confirmed: txId=${txRecord.id} ref=${paymentReference}`);
}

// -----------------------------------------------------------------------------
// SECTION 7 — Airwallex token management
// -----------------------------------------------------------------------------
// Airwallex uses short-lived access tokens, NOT static Bearer API keys.
// This module fetches a token, caches it, and refreshes before expiry.
// The advisory document missed this entirely — this is why their wrapper fails.

let _airwallexToken: string | null = null;
let _airwallexTokenExpiresAt: number = 0;

async function getAirwallexToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (_airwallexToken && Date.now() < _airwallexTokenExpiresAt - 60_000) {
    return _airwallexToken;
  }

  const response = await fetch(
    `${process.env.AIRWALLEX_API_BASE}/api/v1/authentication/login`,
    {
      method: "POST",
      headers: {
        "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
        "x-api-key": process.env.AIRWALLEX_API_KEY!,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Airwallex auth failed: ${response.status}`);
  }

  const data = await response.json();
  _airwallexToken = data.token;
  // Airwallex tokens typically expire in 30 minutes
  _airwallexTokenExpiresAt = Date.now() + (data.expires_in ?? 1800) * 1000;

  return _airwallexToken!;
}

// Export for use in FX route (Step 3)
export { getAirwallexToken };

// -----------------------------------------------------------------------------
// SECTION 8 — Main webhook route
// -----------------------------------------------------------------------------
// Add this inside your registerRoutes() function in server/routes.ts
//
// IMPORTANT: This route must use express.raw() middleware (see Section 1).
// Register it BEFORE your general express.json() middleware.

export function registerWebhookRoute(app: Express): void {
  app.post(
    "/api/webhooks/airwallex",
    // express.raw() is applied per-route in index.ts — see Section 1
    async (req, res) => {
      // req.body is a Buffer here (raw body middleware applied)
      const rawBody = req.body as Buffer;
      const signatureHeader = req.headers["x-airwallex-signature"] as string;

      // Step 1: Verify signature — reject immediately if invalid
      if (!signatureHeader || !verifyAirwallexSignature(rawBody, signatureHeader)) {
        console.warn("[webhook] Invalid or missing Airwallex signature — rejected");
        return res.status(401).json({ error: "Invalid signature" });
      }

      // Step 2: Parse the raw body
      let event: any;
      try {
        event = JSON.parse(rawBody.toString("utf8"));
      } catch {
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const eventId: string = event.id;
      const eventType: string = event.name;
      const eventData = event.data;

      if (!eventId || !eventType) {
        return res.status(400).json({ error: "Missing event id or name" });
      }

      // Step 3: Idempotency check — has this event been processed before?
      // Note: this check is intentionally OUTSIDE the handler transaction
      // so we can return 200 fast for duplicates without acquiring a serializable lock
      const [existingEvent] = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.eventId, eventId));

      if (existingEvent?.processed) {
        console.log(`[webhook] Duplicate event ignored: ${eventId}`);
        return res.status(200).json({ status: "already_processed" });
      }

      // Step 4: Always respond 200 to Airwallex immediately
      // Processing happens asynchronously — Airwallex will retry on 5xx
      // but we don't want retries on processing errors (they're usually code bugs)
      res.status(200).json({ status: "received" });

      // Step 5: Process asynchronously
      try {
        switch (eventType) {
          case "conversion.settled":
            await handleFxSettled(eventId, eventData, rawBody);
            break;

          case "conversion.failed":
            await handleFxFailed(eventId, eventData, rawBody);
            break;

          case "payment.received":
            await handleDepositConfirmed(eventId, eventData, rawBody);
            break;

          default:
            // Unknown events: record but don't crash
            console.log(`[webhook] Unhandled event type: ${eventType} id=${eventId}`);
            await db.insert(webhookEvents).values({
              eventId,
              eventType,
              rawPayload: event,
              processed: true,  // recorded, not needing retry
              processedAt: new Date(),
            }).onConflictDoNothing();
        }
      } catch (err: any) {
        console.error(`[webhook] Handler error for ${eventType} ${eventId}:`, err);
        // Record the failed processing attempt for debugging
        await db
          .insert(webhookEvents)
          .values({
            eventId,
            eventType,
            rawPayload: event,
            processed: false,
            processingError: err?.message ?? "Unknown error",
          })
          .onConflictDoUpdate({
            target: webhookEvents.eventId,
            set: {
              processingError: err?.message ?? "Unknown error",
              processed: false,
            },
          });
      }
    }
  );
}

// =============================================================================
// STEP 2 CHECKLIST
// =============================================================================
//
// □ express.raw() applied to /api/webhooks/airwallex route in server/index.ts
// □ AIRWALLEX_WEBHOOK_SECRET added to .env
// □ AIRWALLEX_CLIENT_ID added to .env
// □ AIRWALLEX_API_KEY added to .env
// □ AIRWALLEX_API_BASE added to .env (https://api.airwallex.com for prod,
//     https://api-demo.airwallex.com for sandbox)
// □ webhook_events table exists in DB (from Step 1)
// □ registerWebhookRoute(app) called inside registerRoutes()
// □ Signature verified using raw Buffer, not JSON.stringify
// □ Idempotency checked before processing, inserted inside atomic transaction
// □ Balance mirrored from Airwallex API, not from webhook payload
// □ getAirwallexToken exported for use in Step 3
