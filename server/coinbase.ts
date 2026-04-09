import { createHmac } from "crypto";

const COMMERCE_API_BASE = "https://api.commerce.coinbase.com";

export function isCoinbaseConfigured(): boolean {
  return !!process.env.COINBASE_COMMERCE_API_KEY;
}

export interface CoinbaseCharge {
  id: string;
  code: string;
  hosted_url: string;
  expires_at: string;
  addresses: Record<string, string>;
  pricing_type: string;
  metadata: Record<string, string>;
}

async function commerceRequest(
  method: "GET" | "POST",
  path: string,
  body?: object
): Promise<any> {
  const key = process.env.COINBASE_COMMERCE_API_KEY;
  if (!key) {
    throw Object.assign(
      new Error("Coinbase Commerce is not configured — COINBASE_COMMERCE_API_KEY missing"),
      { status: 503 }
    );
  }

  const res = await fetch(`${COMMERCE_API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": key,
      "X-CC-Version": "2018-03-22",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (json as any)?.error?.message ?? `Coinbase Commerce API error ${res.status}`;
    throw Object.assign(new Error(message), { status: res.status });
  }
  return json;
}

export async function createCharge(params: {
  name: string;
  description: string;
  metadata: Record<string, string>;
}): Promise<CoinbaseCharge> {
  const response = await commerceRequest("POST", "/charges", {
    name: params.name,
    description: params.description,
    pricing_type: "no_price",
    metadata: params.metadata,
  });
  return response.data as CoinbaseCharge;
}

export async function getCharge(chargeCode: string): Promise<CoinbaseCharge> {
  const response = await commerceRequest("GET", `/charges/${chargeCode}`);
  return response.data as CoinbaseCharge;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

// Maps AMAX internal currency codes to Coinbase Commerce address network keys
export const CURRENCY_TO_NETWORK: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDC: "usdc",
  USDT: "usdt",
  LTC: "litecoin",
};

// All currencies handled via Coinbase Commerce
export const CRYPTO_CURRENCIES_COINBASE = new Set(Object.keys(CURRENCY_TO_NETWORK));
