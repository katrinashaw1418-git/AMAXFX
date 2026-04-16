import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  kycStatus: text("kyc_status").notNull().default("pending"), // pending, verified, rejected
  userTier: text("user_tier").notNull().default("standard"), // standard, premium, hnwi
  createdAt: timestamp("created_at").defaultNow(),
  // KYC profile fields — required by AML/CTF Program v2.0 §15 (Part B)
  fullLegalName: text("full_legal_name"),
  dateOfBirth: text("date_of_birth"),
  nationality: text("nationality"),
  phoneNumber: text("phone_number"),
  pepDeclaration: boolean("pep_declaration").default(false),
  sanctionsDeclaration: boolean("sanctions_declaration").default(false),
  consentDeclaration: boolean("consent_declaration").default(false),
  kycProfileComplete: boolean("kyc_profile_complete").default(false),
  // Extended CDD fields — AUSTRAC customer identification procedure (Part B §15)
  residentialAddress: text("residential_address"),
  suburb: text("suburb"),
  stateRegion: text("state_region"),
  postcode: text("postcode"),
  addressCountry: text("address_country"),
  occupation: text("occupation"),
  employmentStatus: text("employment_status"),   // employed | self_employed | unemployed | student | retired
  purposeOfAccount: text("purpose_of_account"),  // personal_transfers | business_payments | investment | remittance | other
  sourceOfFunds: text("source_of_funds"),         // employment | business | savings | inheritance | property | crypto | other
  taxCountry: text("tax_country"),
  // ID document verification (Step 3)
  idDocumentType: text("id_document_type"),       // passport | driver_licence | national_id
  idDocsSubmitted: boolean("id_docs_submitted").default(false),   // docs sent to Sumsub → "under_review"
  idVerificationComplete: boolean("id_verification_complete").default(false), // Sumsub approved → "completed"
  // Proof of Address (Step 4)
  addressDocFilename: text("address_doc_filename"),  // filename of uploaded POA document
  addressDocApproved: boolean("address_doc_approved").default(false), // admin approved → "completed"
  // Account control
  accountFrozen: boolean("account_frozen").default(false),
  // Internal risk scoring (not shown to user — gaming risk per AUSTRAC guidance)
  riskScore: integer("risk_score"),
  riskLevel: text("risk_level"),           // "low" | "medium" | "high"
  dailyTransactionLimit: decimal("daily_transaction_limit", { precision: 15, scale: 2 }),
  kycRefreshDue: timestamp("kyc_refresh_due"), // Annual refresh trigger
  // Customer agreement signing — Electronic Transactions Act 1999 (Cth)
  agreementSigned: boolean("agreement_signed").default(false),
  agreementSignedAt: timestamp("agreement_signed_at"),
  agreementRef: text("agreement_ref"),          // unique reference e.g. AMXAGR-XXXXXXXX
  agreementVersion: text("agreement_version"),  // e.g. "v2.0"
  agreementSignature: text("agreement_signature"), // typed legal name at signing
  // Email verification
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationTokenExpiry: timestamp("email_verification_token_expiry"),
  emailOtp: text("email_otp"),
});

export const portfolios = pgTable("portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
  cryptoValue: decimal("crypto_value", { precision: 15, scale: 2 }).notNull(),
  stablecoinValue: decimal("stablecoin_value", { precision: 15, scale: 2 }).default("0.00"),
  fiatValue: decimal("fiat_value", { precision: 15, scale: 2 }).notNull(),
  investmentValue: decimal("investment_value", { precision: 15, scale: 2 }).default("0.00"),
  monthlyPnl: decimal("monthly_pnl", { precision: 15, scale: 2 }).notNull(),
  monthlyPnlPercent: decimal("monthly_pnl_percent", { precision: 5, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
  cryptoValue: decimal("crypto_value", { precision: 15, scale: 2 }).notNull(),
  stablecoinValue: decimal("stablecoin_value", { precision: 15, scale: 2 }).notNull(),
  fiatValue: decimal("fiat_value", { precision: 15, scale: 2 }).notNull(),
  investmentValue: decimal("investment_value", { precision: 15, scale: 2 }).notNull(),
  snapshotDate: timestamp("snapshot_date").notNull(),
  source: text("source").notNull().default("actual"), // "actual" | "historical_estimate"
  createdAt: timestamp("created_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  currency: text("currency").notNull(), // USD, CAD, EUR, GBP, CNY, BTC, ETH
  balance: decimal("balance", { precision: 15, scale: 8 }).notNull(),
  availableBalance: decimal("available_balance", { precision: 15, scale: 8 }).notNull(),
  walletType: text("wallet_type").notNull(), // fiat, crypto
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // One wallet per user per currency — enforced at DB level
  userCurrencyIdx: uniqueIndex("wallets_user_currency_uidx").on(table.userId, table.currency),
  // Non-negative balance safety rails
  balanceNonNeg: check("wallets_balance_non_negative", sql`${table.balance} >= 0`),
  availableBalanceNonNeg: check("wallets_available_balance_non_negative", sql`${table.availableBalance} >= 0`),
}));

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // deposit, withdrawal, exchange, transfer, crypto_buy, crypto_sell
  fromCurrency: text("from_currency"),
  toCurrency: text("to_currency"),
  amount: decimal("amount", { precision: 15, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 8 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 15, scale: 8 }),
  status: text("status").notNull(), // pending, completed, failed, cancelled
  // Explicit labeling — prevents UI/regulator confusion. "internal_only" = no external settlement.
  settlementStatus: text("settlement_status").notNull().default("internal_only"),
  description: text("description").notNull(),
  sourceExchange: text("source_exchange"), // binance, coinbase, etc.
  blockchainTxHash: text("blockchain_tx_hash"), // transaction hash for blockchain transfers
  // Compliance fields — AUSTRAC traceability
  assetType: text("asset_type"),          // "fiat" | "crypto" | "cross" (fiat↔crypto)
  direction: text("direction"),           // "in" | "out" | "exchange"
  riskFlag: boolean("risk_flag").default(false),
  reviewStatus: text("review_status").default("clear"), // "clear" | "flagged" | "reviewing" | "cleared" | "escalated"
  reviewNotes: text("review_notes"),
  // Internal transfer linking — both sides of a transfer share the same referenceId
  referenceId: text("reference_id"),
  counterpartyUserId: integer("counterparty_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  // Travel Rule & transaction monitoring fields — AML/CTF Program v2.0 §8
  purposeOfTransfer: text("purpose_of_transfer"),
  beneficiaryName: text("beneficiary_name"),
  beneficiaryAddress: text("beneficiary_address"),
});

export const fxRates = pgTable("fx_rates", {
  id: serial("id").primaryKey(),
  baseCurrency: text("base_currency").notNull(),
  targetCurrency: text("target_currency").notNull(),
  rate: decimal("rate", { precision: 15, scale: 8 }).notNull(),
  spread: decimal("spread", { precision: 5, scale: 4 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // rebalancing, opportunity, risk_warning
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // info, warning, alert
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const investmentProducts = pgTable("investment_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // real_estate, corporate_credit, venture_capital
  subCategory: text("sub_category").notNull(), // equity_fund, credit_fund, first_mortgage, etc.
  investmentStrategy: text("investment_strategy").notNull(),
  targetNetIrr: text("target_net_irr").notNull(),
  grossIrr: text("gross_irr"),
  moic: text("moic"), // Multiple of Invested Capital
  term: text("term").notNull(),
  structure: text("structure").notNull(),
  distributions: text("distributions").notNull(),
  liquidity: text("liquidity").notNull(),
  minimumInvestment: decimal("minimum_investment", { precision: 15, scale: 2 }).notNull(),
  riskProfile: text("risk_profile").notNull(), // conservative, moderate, high
  returnType: text("return_type").notNull(), // income, capital_gains, blended
  lvr: text("lvr"), // Loan-to-Value Ratio
  annualReturn: decimal("annual_return", { precision: 10, scale: 4 }), // explicit rate e.g. 0.1100 = 11%
  returnMethod: text("return_method").notNull().default("fixed_annual_compound"), // fixed_annual_compound | fixed_annual_simple
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userInvestments = pgTable("user_investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => investmentProducts.id).notNull(),
  investedAmount: decimal("invested_amount", { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).notNull(),
  totalReturn: decimal("total_return", { precision: 15, scale: 2 }).notNull(),
  returnPercent: decimal("return_percent", { precision: 5, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // active, matured, withdrawn
  investmentDate: timestamp("investment_date").defaultNow(),
  maturityDate: timestamp("maturity_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    route: text("route").notNull(),
    key: text("key").notNull(),
    payloadHash: text("payload_hash").notNull(),
    responseJson: jsonb("response_json").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqUserRouteKey: uniqueIndex("idempotency_user_route_key_idx").on(
      table.userId,
      table.route,
      table.key
    ),
  })
);

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Compliance Actions — SMR/TTR logs, account freezes, alert review outcomes
// Immutable append-only log for full audit trail
export const complianceActions = pgTable("compliance_actions", {
  id: serial("id").primaryKey(),
  actionType: text("action_type").notNull(), // "smr" | "ttr" | "freeze" | "unfreeze" | "ecdd" | "alert_review"
  userId: integer("user_id").references(() => users.id),
  transactionId: integer("transaction_id").references(() => transactions.id),
  performedBy: text("performed_by").notNull().default("admin"),
  notes: text("notes"),
  outcome: text("outcome"), // "filed" | "closed" | "escalated" | "false_positive"
  austracRef: text("austrac_ref"), // AUSTRAC Online reference number after lodgement
  createdAt: timestamp("created_at").defaultNow(),
});

// AML Flags — basic monitoring table for AUSTRAC compliance
// Automatically generated by server-side rules; manually reviewed by compliance staff
export const amlFlags = pgTable("aml_flags", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  transactionId: integer("transaction_id").references(() => transactions.id).notNull(),
  riskLevel: text("risk_level").notNull(),   // "low" | "medium" | "high"
  reason: text("reason").notNull(),
  status: text("status").notNull().default("open"), // "open" | "reviewing" | "cleared" | "escalated"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  updatedAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertFxRateSchema = createInsertSchema(fxRates).omit({
  id: true,
  updatedAt: true,
});

export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertInvestmentProductSchema = createInsertSchema(investmentProducts).omit({
  id: true,
  createdAt: true,
});

export const insertUserInvestmentSchema = createInsertSchema(userInvestments).omit({
  id: true,
  investmentDate: true,
  updatedAt: true,
});

export const insertPortfolioSnapshotSchema = createInsertSchema(portfolioSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertAmlFlagSchema = createInsertSchema(amlFlags).omit({
  id: true,
  createdAt: true,
});

export const insertComplianceActionSchema = createInsertSchema(complianceActions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type FxRate = typeof fxRates.$inferSelect;
export type InsertFxRate = z.infer<typeof insertFxRateSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type InvestmentProduct = typeof investmentProducts.$inferSelect;
export type InsertInvestmentProduct = z.infer<typeof insertInvestmentProductSchema>;
export type UserInvestment = typeof userInvestments.$inferSelect;
export type InsertUserInvestment = z.infer<typeof insertUserInvestmentSchema>;
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type InsertPortfolioSnapshot = z.infer<typeof insertPortfolioSnapshotSchema>;
export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AmlFlag = typeof amlFlags.$inferSelect;
export type InsertAmlFlag = z.infer<typeof insertAmlFlagSchema>;
export type ComplianceAction = typeof complianceActions.$inferSelect;
export type InsertComplianceAction = z.infer<typeof insertComplianceActionSchema>;

// Advisor contact messages — written on every submission for full audit trail
export const advisorMessages = pgTable("advisor_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  message: text("message").notNull(),
  userEmail: text("user_email"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AdvisorMessage = typeof advisorMessages.$inferSelect;

// Password reset tokens — ephemeral, expire after 1 hour, single-use
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
