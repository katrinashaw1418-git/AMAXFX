--
-- PostgreSQL database dump
--

\restrict 4ETc8VnWLOvpwOOLAe54Sz6D7i1IMIPr48GfVhYF4zhcxOYeTQApgSDxX3unF7q

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.user_investments DROP CONSTRAINT IF EXISTS user_investments_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.user_investments DROP CONSTRAINT IF EXISTS user_investments_product_id_investment_products_id_fk;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_counterparty_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.portfolios DROP CONSTRAINT IF EXISTS portfolios_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.portfolio_snapshots DROP CONSTRAINT IF EXISTS portfolio_snapshots_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.idempotency_keys DROP CONSTRAINT IF EXISTS idempotency_keys_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.compliance_actions DROP CONSTRAINT IF EXISTS compliance_actions_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.compliance_actions DROP CONSTRAINT IF EXISTS compliance_actions_transaction_id_transactions_id_fk;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.aml_flags DROP CONSTRAINT IF EXISTS aml_flags_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.aml_flags DROP CONSTRAINT IF EXISTS aml_flags_transaction_id_transactions_id_fk;
ALTER TABLE IF EXISTS ONLY public.ai_recommendations DROP CONSTRAINT IF EXISTS ai_recommendations_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.advisor_messages DROP CONSTRAINT IF EXISTS advisor_messages_user_id_users_id_fk;
DROP INDEX IF EXISTS public.wallets_user_currency_uidx;
DROP INDEX IF EXISTS public.users_phone_number_unique;
DROP INDEX IF EXISTS public.unique_wallet_user_currency;
DROP INDEX IF EXISTS public.idempotency_user_route_key_idx;
ALTER TABLE IF EXISTS ONLY public.wallets DROP CONSTRAINT IF EXISTS wallets_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_google_id_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.user_investments DROP CONSTRAINT IF EXISTS user_investments_pkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.portfolios DROP CONSTRAINT IF EXISTS portfolios_pkey;
ALTER TABLE IF EXISTS ONLY public.portfolio_snapshots DROP CONSTRAINT IF EXISTS portfolio_snapshots_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.investment_products DROP CONSTRAINT IF EXISTS investment_products_pkey;
ALTER TABLE IF EXISTS ONLY public.idempotency_keys DROP CONSTRAINT IF EXISTS idempotency_keys_pkey;
ALTER TABLE IF EXISTS ONLY public.fx_rates DROP CONSTRAINT IF EXISTS fx_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.compliance_actions DROP CONSTRAINT IF EXISTS compliance_actions_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.aml_flags DROP CONSTRAINT IF EXISTS aml_flags_pkey;
ALTER TABLE IF EXISTS ONLY public.ai_recommendations DROP CONSTRAINT IF EXISTS ai_recommendations_pkey;
ALTER TABLE IF EXISTS ONLY public.advisor_messages DROP CONSTRAINT IF EXISTS advisor_messages_pkey;
ALTER TABLE IF EXISTS public.wallets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_investments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.portfolios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.portfolio_snapshots ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.investment_products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.idempotency_keys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.fx_rates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.compliance_actions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.aml_flags ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.ai_recommendations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.advisor_messages ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.wallets_id_seq;
DROP TABLE IF EXISTS public.wallets;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_investments_id_seq;
DROP TABLE IF EXISTS public.user_investments;
DROP SEQUENCE IF EXISTS public.transactions_id_seq;
DROP TABLE IF EXISTS public.transactions;
DROP SEQUENCE IF EXISTS public.portfolios_id_seq;
DROP TABLE IF EXISTS public.portfolios;
DROP SEQUENCE IF EXISTS public.portfolio_snapshots_id_seq;
DROP TABLE IF EXISTS public.portfolio_snapshots;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP SEQUENCE IF EXISTS public.investment_products_id_seq;
DROP TABLE IF EXISTS public.investment_products;
DROP SEQUENCE IF EXISTS public.idempotency_keys_id_seq;
DROP TABLE IF EXISTS public.idempotency_keys;
DROP SEQUENCE IF EXISTS public.fx_rates_id_seq;
DROP TABLE IF EXISTS public.fx_rates;
DROP SEQUENCE IF EXISTS public.compliance_actions_id_seq;
DROP TABLE IF EXISTS public.compliance_actions;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.aml_flags_id_seq;
DROP TABLE IF EXISTS public.aml_flags;
DROP SEQUENCE IF EXISTS public.ai_recommendations_id_seq;
DROP TABLE IF EXISTS public.ai_recommendations;
DROP SEQUENCE IF EXISTS public.advisor_messages_id_seq;
DROP TABLE IF EXISTS public.advisor_messages;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advisor_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.advisor_messages (
    id integer NOT NULL,
    user_id integer,
    message text NOT NULL,
    user_email text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: advisor_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.advisor_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: advisor_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.advisor_messages_id_seq OWNED BY public.advisor_messages.id;


--
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_recommendations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    severity text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_recommendations_id_seq OWNED BY public.ai_recommendations.id;


--
-- Name: aml_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aml_flags (
    id integer NOT NULL,
    user_id integer NOT NULL,
    transaction_id integer NOT NULL,
    risk_level text NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    reviewed_at timestamp without time zone
);


--
-- Name: aml_flags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.aml_flags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aml_flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.aml_flags_id_seq OWNED BY public.aml_flags.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action text NOT NULL,
    entity_type text,
    entity_id text,
    metadata jsonb,
    ip_address text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: compliance_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_actions (
    id integer NOT NULL,
    action_type text NOT NULL,
    user_id integer,
    transaction_id integer,
    performed_by text DEFAULT 'admin'::text NOT NULL,
    notes text,
    outcome text,
    austrac_ref text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: compliance_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliance_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliance_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliance_actions_id_seq OWNED BY public.compliance_actions.id;


--
-- Name: fx_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_rates (
    id integer NOT NULL,
    base_currency text NOT NULL,
    target_currency text NOT NULL,
    rate numeric(15,8) NOT NULL,
    spread numeric(5,4) NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: fx_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fx_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fx_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fx_rates_id_seq OWNED BY public.fx_rates.id;


--
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idempotency_keys (
    id integer NOT NULL,
    user_id integer NOT NULL,
    route text NOT NULL,
    key text NOT NULL,
    payload_hash text NOT NULL,
    response_json jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: idempotency_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.idempotency_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: idempotency_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.idempotency_keys_id_seq OWNED BY public.idempotency_keys.id;


--
-- Name: investment_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investment_products (
    id integer NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    sub_category text NOT NULL,
    investment_strategy text NOT NULL,
    target_net_irr text NOT NULL,
    gross_irr text,
    moic text,
    term text NOT NULL,
    structure text NOT NULL,
    distributions text NOT NULL,
    liquidity text NOT NULL,
    minimum_investment numeric(15,2) NOT NULL,
    risk_profile text NOT NULL,
    return_type text NOT NULL,
    lvr text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    annual_return numeric(10,4),
    return_method text DEFAULT 'fixed_annual_compound'::text NOT NULL
);


--
-- Name: investment_products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.investment_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: investment_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.investment_products_id_seq OWNED BY public.investment_products.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: portfolio_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_snapshots (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total_value numeric(15,2) NOT NULL,
    crypto_value numeric(15,2) NOT NULL,
    stablecoin_value numeric(15,2) NOT NULL,
    fiat_value numeric(15,2) NOT NULL,
    investment_value numeric(15,2) NOT NULL,
    snapshot_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    source text DEFAULT 'actual'::text NOT NULL
);


--
-- Name: portfolio_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portfolio_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portfolio_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portfolio_snapshots_id_seq OWNED BY public.portfolio_snapshots.id;


--
-- Name: portfolios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolios (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total_value numeric(15,2) NOT NULL,
    crypto_value numeric(15,2) NOT NULL,
    stablecoin_value numeric(15,2) DEFAULT 0.00,
    fiat_value numeric(15,2) NOT NULL,
    investment_value numeric(15,2) DEFAULT 0.00,
    monthly_pnl numeric(15,2) NOT NULL,
    monthly_pnl_percent numeric(5,2) NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: portfolios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portfolios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portfolios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portfolios_id_seq OWNED BY public.portfolios.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    from_currency text,
    to_currency text,
    amount numeric(15,8) NOT NULL,
    fee numeric(15,8) NOT NULL,
    exchange_rate numeric(15,8),
    status text NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    source_exchange text,
    blockchain_tx_hash text,
    settlement_status text DEFAULT 'internal_only'::text NOT NULL,
    asset_type text,
    direction text,
    risk_flag boolean DEFAULT false,
    review_status text DEFAULT 'clear'::text,
    review_notes text,
    reference_id text,
    counterparty_user_id integer,
    purpose_of_transfer text,
    beneficiary_name text,
    beneficiary_address text
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: user_investments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_investments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    invested_amount numeric(15,2) NOT NULL,
    current_value numeric(15,2) NOT NULL,
    total_return numeric(15,2) NOT NULL,
    return_percent numeric(5,2) NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    investment_date timestamp without time zone DEFAULT now(),
    maturity_date timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_investments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_investments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_investments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_investments_id_seq OWNED BY public.user_investments.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    kyc_status text DEFAULT 'pending'::text NOT NULL,
    user_tier text DEFAULT 'standard'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    full_legal_name text,
    date_of_birth text,
    nationality text,
    phone_number text,
    pep_declaration boolean DEFAULT false,
    sanctions_declaration boolean DEFAULT false,
    consent_declaration boolean DEFAULT false,
    kyc_profile_complete boolean DEFAULT false,
    account_frozen boolean DEFAULT false,
    risk_score integer,
    risk_level text,
    daily_transaction_limit numeric(15,2),
    kyc_refresh_due timestamp without time zone,
    residential_address text,
    suburb text,
    state_region text,
    postcode text,
    address_country text,
    occupation text,
    employment_status text,
    purpose_of_account text,
    source_of_funds text,
    tax_country text,
    id_document_type text,
    id_verification_complete boolean DEFAULT false,
    agreement_signed boolean DEFAULT false,
    agreement_signed_at timestamp without time zone,
    agreement_ref text,
    agreement_version text,
    agreement_signature text,
    email_verified boolean DEFAULT false,
    email_verification_token text,
    email_verification_token_expiry timestamp without time zone,
    id_docs_submitted boolean DEFAULT false,
    address_doc_filename text,
    address_doc_approved boolean DEFAULT false,
    email_otp text,
    google_id text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    currency text NOT NULL,
    balance numeric(15,8) NOT NULL,
    available_balance numeric(15,8) NOT NULL,
    wallet_type text NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT available_balance_non_negative CHECK ((available_balance >= (0)::numeric)),
    CONSTRAINT balance_non_negative CHECK ((balance >= (0)::numeric)),
    CONSTRAINT wallets_available_balance_non_negative CHECK ((available_balance >= (0)::numeric)),
    CONSTRAINT wallets_balance_non_negative CHECK ((balance >= (0)::numeric))
);


--
-- Name: wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wallets_id_seq OWNED BY public.wallets.id;


--
-- Name: advisor_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advisor_messages ALTER COLUMN id SET DEFAULT nextval('public.advisor_messages_id_seq'::regclass);


--
-- Name: ai_recommendations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations ALTER COLUMN id SET DEFAULT nextval('public.ai_recommendations_id_seq'::regclass);


--
-- Name: aml_flags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aml_flags ALTER COLUMN id SET DEFAULT nextval('public.aml_flags_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: compliance_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_actions ALTER COLUMN id SET DEFAULT nextval('public.compliance_actions_id_seq'::regclass);


--
-- Name: fx_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_rates ALTER COLUMN id SET DEFAULT nextval('public.fx_rates_id_seq'::regclass);


--
-- Name: idempotency_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys ALTER COLUMN id SET DEFAULT nextval('public.idempotency_keys_id_seq'::regclass);


--
-- Name: investment_products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investment_products ALTER COLUMN id SET DEFAULT nextval('public.investment_products_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: portfolio_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_snapshots ALTER COLUMN id SET DEFAULT nextval('public.portfolio_snapshots_id_seq'::regclass);


--
-- Name: portfolios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolios ALTER COLUMN id SET DEFAULT nextval('public.portfolios_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: user_investments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_investments ALTER COLUMN id SET DEFAULT nextval('public.user_investments_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wallets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets ALTER COLUMN id SET DEFAULT nextval('public.wallets_id_seq'::regclass);


--
-- Data for Name: advisor_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.advisor_messages (id, user_id, message, user_email, created_at) FROM stdin;
\.


--
-- Data for Name: ai_recommendations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_recommendations (id, user_id, type, title, description, severity, is_read, created_at) FROM stdin;
10	1	opportunity	Diversify with International Equities	Consider adding 20-25% international equity exposure to reduce correlation with domestic markets.	info	f	2026-04-06 01:26:47.617649
11	1	opportunity	Income Generation Focus	Prioritize dividend-paying stocks, REITs, corporate bonds, and high-yield savings to generate steady income.	info	f	2026-04-06 01:26:47.633392
12	1	opportunity	Consider Dividend Aristocrats	S&P 500 Dividend Aristocrats have increased dividends for 25+ consecutive years, providing reliable income.	info	f	2026-04-06 01:26:47.63802
13	1	opportunity	Medium-Term Balance	Your 3-5 year horizon allows for moderate growth investments while maintaining some stability through bonds and cash.	info	f	2026-04-06 01:26:47.642494
\.


--
-- Data for Name: aml_flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.aml_flags (id, user_id, transaction_id, risk_level, reason, status, notes, created_at, reviewed_at) FROM stdin;
1	1	11	low	Fiat-to-crypto or crypto-to-fiat conversion (type: exchange)	open	\N	2026-04-07 14:38:04.494131	\N
2	1	12	low	Fiat-to-crypto or crypto-to-fiat conversion (type: exchange)	open	\N	2026-04-08 01:58:22.404774	\N
3	1	13	low	Fiat-to-crypto or crypto-to-fiat conversion (type: exchange)	open	\N	2026-04-08 01:58:42.081575	\N
4	1	28	low	Fiat-to-crypto or crypto-to-fiat conversion (type: exchange)	open	\N	2026-04-08 03:46:45.9492	\N
5	1	31	low	Fiat-to-crypto or crypto-to-fiat conversion (type: exchange)	open	\N	2026-04-08 06:16:03.858256	\N
6	1	42	low	Fiat-to-crypto or crypto-to-fiat conversion (type: exchange)	open	\N	2026-04-09 09:23:59.684697	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at) FROM stdin;
1	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-02 04:07:47.679601
2	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 04:58:51.658859
3	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 04:58:56.651503
4	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 05:10:47.575554
5	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 05:10:53.205918
6	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-02 05:13:14.303451
7	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-02 05:13:22.606923
8	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 05:13:22.992861
9	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 05:14:15.704177
10	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 05:37:02.730903
11	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 07:39:18.935491
12	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 07:40:07.399267
13	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-02", "mismatches": [{"delta": -150, "currency": "USD", "currentBalance": 1949850, "reconstructedBalance": 1950000}, {"delta": 136.84500000000116, "currency": "EUR", "currentBalance": 100136.16, "reconstructedBalance": 99999.315}]}	\N	2026-04-02 07:40:26.108782
14	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-03 04:38:22.762801
15	1	logout	user	1	{}	127.0.0.1	2026-04-03 04:40:31.965964
16	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-03 04:40:36.953938
17	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-03 04:40:52.096805
18	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-03 09:16:50.503529
19	1	login_failed	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-03 09:17:13.874353
20	1	login_failed	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-03 22:57:43.854432
21	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-03 22:57:51.9151
22	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-03 22:58:12.387179
23	1	login_failed	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-06 01:20:16.071184
24	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-06 01:20:28.579474
25	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-06 01:20:51.7031
26	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 06:20:57.977922
27	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 06:21:12.392253
59	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 06:24:11.251467
60	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 06:24:24.63315
61	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 06:36:15.344168
62	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 06:41:19.971313
63	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 06:52:01.703877
64	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 07:00:24.283383
65	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 07:05:20.690182
66	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 07:13:57.505106
67	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 07:23:18.875256
68	1	fx_exchange	transaction	6	{"amount": 999, "toCurrency": "AUD", "fromCurrency": "USD"}	127.0.0.1	2026-04-07 07:25:19.973638
69	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -999, "currency": "USD", "currentBalance": 1948851, "reconstructedBalance": 1949850}, {"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}]}	\N	2026-04-07 07:32:24.054404
70	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 07:32:36.746035
71	1	fx_exchange	transaction	7	{"amount": 100, "toCurrency": "KRW", "fromCurrency": "USD"}	127.0.0.1	2026-04-07 07:34:27.642662
72	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 07:41:45.415347
162	1	fx_exchange	transaction	20	{"amount": 100, "toCurrency": "CNY", "fromCurrency": "USD"}	127.0.0.1	2026-04-08 02:50:48.536583
346	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 06:16:38.717256
359	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 09:22:37.07212
73	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 07:42:43.915491
74	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 07:43:19.621927
75	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 08:06:26.749261
76	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 08:06:38.277529
77	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 08:07:58.687563
78	1	logout	user	1	{}	127.0.0.1	2026-04-07 08:09:07.287176
79	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 08:16:11.313204
80	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 08:30:31.72098
81	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 08:40:58.046466
82	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 08:41:10.026997
83	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 08:42:53.213452
84	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 09:18:36.934726
85	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 09:25:02.274349
86	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 09:34:24.256255
87	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 09:35:03.293067
88	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 09:40:17.137992
89	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 09:47:57.204583
90	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 09:48:28.899025
91	1	logout	user	1	{}	127.0.0.1	2026-04-07 09:48:40.612048
92	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 09:48:49.030281
93	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 09:48:56.107279
94	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 1446.4566332599998, "currency": "AUD", "currentBalance": 1446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}]}	\N	2026-04-07 09:51:02.08631
95	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 09:51:20.932683
96	1	fx_exchange	transaction	8	{"amount": 1000, "toCurrency": "JPY", "fromCurrency": "AUD"}	127.0.0.1	2026-04-07 09:53:40.992507
347	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 06:37:19.593311
97	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}]}	\N	2026-04-07 09:53:58.061891
98	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 09:55:39.389299
99	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}]}	\N	2026-04-07 09:57:26.615734
100	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 09:57:51.301397
101	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}]}	\N	2026-04-07 09:59:37.840538
102	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 10:11:55.360791
103	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -1099, "currency": "USD", "currentBalance": 1948751, "reconstructedBalance": 1949850}, {"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}]}	\N	2026-04-07 10:14:30.815193
104	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 10:16:30.069576
105	1	fx_exchange	transaction	9	{"amount": 10000, "toCurrency": "SGD", "fromCurrency": "USD"}	127.0.0.1	2026-04-07 10:19:39.778669
106	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 10:54:52.860313
107	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 11:35:03.142838
108	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 11:36:58.406599
109	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 11:37:59.765329
110	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 12:58:41.654831
111	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 13:18:18.651718
112	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 13:22:21.494871
334	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 04:18:13.215531
348	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 06:42:40.693216
113	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 13:26:19.791486
114	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 13:27:20.03101
115	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 13:51:05.985606
116	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 150906.675, "currency": "KRW", "currentBalance": 150906.675, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 446.45663326, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 109131.6, "currency": "JPY", "currentBalance": 109131.6, "reconstructedBalance": 0}, {"delta": -11099, "currency": "USD", "currentBalance": 1938751, "reconstructedBalance": 1949850}, {"delta": 12806.645, "currency": "SGD", "currentBalance": 12806.645, "reconstructedBalance": 0}]}	\N	2026-04-07 13:53:49.586233
117	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -11099, "currency": "USD", "currentBalance": 3500, "reconstructedBalance": 14599}, {"delta": 4600, "currency": "SGD", "currentBalance": 4600, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 5200, "reconstructedBalance": 4753.54336674}, {"delta": 150906.6749999998, "currency": "KRW", "currentBalance": 4500000, "reconstructedBalance": 4349093.325}, {"delta": 109131.59999999998, "currency": "JPY", "currentBalance": 380000, "reconstructedBalance": 270868.4}]}	\N	2026-04-07 13:56:47.804675
118	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -11099, "currency": "USD", "currentBalance": 3500, "reconstructedBalance": 14599}, {"delta": 4600, "currency": "SGD", "currentBalance": 4600, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 5200, "reconstructedBalance": 4753.54336674}, {"delta": 150906.6749999998, "currency": "KRW", "currentBalance": 4500000, "reconstructedBalance": 4349093.325}, {"delta": 109131.59999999998, "currency": "JPY", "currentBalance": 380000, "reconstructedBalance": 270868.4}]}	\N	2026-04-07 13:57:46.622932
119	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 13:59:17.167852
120	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -11099, "currency": "USD", "currentBalance": 3500, "reconstructedBalance": 14599}, {"delta": 4600, "currency": "SGD", "currentBalance": 4600, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 5200, "reconstructedBalance": 4753.54336674}, {"delta": 150906.6749999998, "currency": "KRW", "currentBalance": 4500000, "reconstructedBalance": 4349093.325}, {"delta": 109131.59999999998, "currency": "JPY", "currentBalance": 380000, "reconstructedBalance": 270868.4}]}	\N	2026-04-07 14:09:47.359377
121	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -11099, "currency": "USD", "currentBalance": 3500, "reconstructedBalance": 14599}, {"delta": 4600, "currency": "SGD", "currentBalance": 4600, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 5200, "reconstructedBalance": 4753.54336674}, {"delta": 150906.6749999998, "currency": "KRW", "currentBalance": 4500000, "reconstructedBalance": 4349093.325}, {"delta": 109131.59999999998, "currency": "JPY", "currentBalance": 380000, "reconstructedBalance": 270868.4}]}	\N	2026-04-07 14:19:05.261297
122	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -11099, "currency": "USD", "currentBalance": 3500, "reconstructedBalance": 14599}, {"delta": 4600, "currency": "SGD", "currentBalance": 4600, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 5200, "reconstructedBalance": 4753.54336674}, {"delta": 150906.6749999998, "currency": "KRW", "currentBalance": 4500000, "reconstructedBalance": 4349093.325}, {"delta": 109131.59999999998, "currency": "JPY", "currentBalance": 380000, "reconstructedBalance": 270868.4}]}	\N	2026-04-07 14:23:40.697999
123	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": -11099, "currency": "USD", "currentBalance": 3500, "reconstructedBalance": 14599}, {"delta": 4600, "currency": "SGD", "currentBalance": 4600, "reconstructedBalance": 0}, {"delta": 446.45663325999976, "currency": "AUD", "currentBalance": 5200, "reconstructedBalance": 4753.54336674}, {"delta": 150906.6749999998, "currency": "KRW", "currentBalance": 4500000, "reconstructedBalance": 4349093.325}, {"delta": 109131.59999999998, "currency": "JPY", "currentBalance": 380000, "reconstructedBalance": 270868.4}]}	\N	2026-04-07 14:25:39.351273
124	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-07 14:28:12.797239
125	1	fx_exchange	transaction	10	{"amount": 1000, "toCurrency": "AUD", "fromCurrency": "USD"}	127.0.0.1	2026-04-07 14:30:59.6559
126	1	fx_exchange	transaction	11	{"amount": 500, "toCurrency": "BTC", "fromCurrency": "AUD"}	127.0.0.1	2026-04-07 14:38:04.509219
335	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 04:28:27.053507
349	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 07:29:21.659966
360	1	fx_exchange	transaction	42	{"amount": 500, "toCurrency": "BTC", "fromCurrency": "AUD"}	127.0.0.1	2026-04-09 09:23:59.787689
364	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:02:07.680307
127	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-07", "mismatches": [{"delta": 4600, "currency": "SGD", "currentBalance": 4600, "reconstructedBalance": 0}, {"delta": 150906.6749999998, "currency": "KRW", "currentBalance": 4500000, "reconstructedBalance": 4349093.325}, {"delta": 109131.59999999998, "currency": "JPY", "currentBalance": 380000, "reconstructedBalance": 270868.4}, {"delta": -12099, "currency": "USD", "currentBalance": 2500, "reconstructedBalance": 14599}, {"delta": 1394.3611710599998, "currency": "AUD", "currentBalance": 6147.9045378, "reconstructedBalance": 4753.54336674}]}	\N	2026-04-07 20:11:19.624738
128	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 00:08:13.72451
129	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:09:03.093468
130	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:19:11.271213
131	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:25:14.840876
132	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:27:23.371878
133	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:30:09.310064
134	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:35:03.378914
135	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:39:42.086489
136	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:42:37.996053
137	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:45:49.594274
138	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 01:51:46.961942
139	1	fx_exchange	transaction	12	{"amount": 500, "toCurrency": "BTC", "fromCurrency": "AUD"}	127.0.0.1	2026-04-08 01:58:22.411893
140	1	fx_exchange	transaction	13	{"amount": 0.00001, "toCurrency": "AUD", "fromCurrency": "BTC"}	127.0.0.1	2026-04-08 01:58:42.087529
141	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}]}	\N	2026-04-08 02:01:06.644028
142	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}]}	\N	2026-04-08 02:04:05.568441
143	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}]}	\N	2026-04-08 02:06:00.641972
144	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 02:06:58.717593
145	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}]}	\N	2026-04-08 02:13:10.204762
146	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}]}	\N	2026-04-08 02:15:03.833313
147	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 02:16:48.252206
148	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}]}	\N	2026-04-08 02:17:15.335199
149	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}]}	\N	2026-04-08 02:18:31.321732
150	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 02:19:16.803263
151	1	fx_exchange	transaction	14	{"amount": 100, "toCurrency": "CNY", "fromCurrency": "USD"}	127.0.0.1	2026-04-08 02:21:52.641178
152	1	fx_exchange	transaction	15	{"amount": 100, "toCurrency": "KRW", "fromCurrency": "USD"}	127.0.0.1	2026-04-08 02:22:07.157752
153	1	fx_exchange	transaction	16	{"amount": 100, "toCurrency": "KRW", "fromCurrency": "USD"}	127.0.0.1	2026-04-08 02:22:31.904976
154	1	fx_exchange	transaction	17	{"amount": 100, "toCurrency": "NZD", "fromCurrency": "USD"}	127.0.0.1	2026-04-08 02:23:00.298857
155	1	fx_exchange	transaction	18	{"amount": 100, "toCurrency": "HKD", "fromCurrency": "USD"}	127.0.0.1	2026-04-08 02:23:32.280296
156	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}, {"delta": 682.3113, "currency": "CNY", "currentBalance": 682.3113, "reconstructedBalance": 0}, {"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": -500, "currency": "USD", "currentBalance": 2000, "reconstructedBalance": 2500}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}]}	\N	2026-04-08 02:31:51.141313
157	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 02:37:50.527402
158	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}, {"delta": 682.3113, "currency": "CNY", "currentBalance": 682.3113, "reconstructedBalance": 0}, {"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": -500, "currency": "USD", "currentBalance": 2000, "reconstructedBalance": 2500}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}]}	\N	2026-04-08 02:42:00.222138
159	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": -498.9736107097615, "currency": "AUD", "currentBalance": 5648.9309271, "reconstructedBalance": 6147.904537809762}, {"delta": 682.3113, "currency": "CNY", "currentBalance": 682.3113, "reconstructedBalance": 0}, {"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": -500, "currency": "USD", "currentBalance": 2000, "reconstructedBalance": 2500}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}]}	\N	2026-04-08 02:45:15.499256
160	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 02:46:49.376417
161	1	fx_exchange	transaction	19	{"amount": 100, "toCurrency": "CNY", "fromCurrency": "AUD"}	127.0.0.1	2026-04-08 02:50:24.888792
163	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": -598.9736107097615, "currency": "AUD", "currentBalance": 5548.9309271, "reconstructedBalance": 6147.904537809762}, {"delta": -600, "currency": "USD", "currentBalance": 1900, "reconstructedBalance": 2500}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}]}	\N	2026-04-08 03:03:11.072342
164	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": -598.9736107097615, "currency": "AUD", "currentBalance": 5548.9309271, "reconstructedBalance": 6147.904537809762}, {"delta": -600, "currency": "USD", "currentBalance": 1900, "reconstructedBalance": 2500}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}]}	\N	2026-04-08 03:04:32.172834
165	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 03:05:11.226207
166	1	withdrawal	transaction	21	{"amount": 100, "currency": "AUD"}	127.0.0.1	2026-04-08 03:12:06.029815
167	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": -600, "currency": "USD", "currentBalance": 1900, "reconstructedBalance": 2500}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -698.9736107097615, "currency": "AUD", "currentBalance": 5413.9309271, "reconstructedBalance": 6112.904537809762}]}	\N	2026-04-08 03:13:32.039434
168	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": -600, "currency": "USD", "currentBalance": 1900, "reconstructedBalance": 2500}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -698.9736107097615, "currency": "AUD", "currentBalance": 5413.9309271, "reconstructedBalance": 6112.904537809762}]}	\N	2026-04-08 03:16:42.173454
169	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 03:18:11.024838
170	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": -600, "currency": "USD", "currentBalance": 1900, "reconstructedBalance": 2500}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": -698.9736107097615, "currency": "AUD", "currentBalance": 5413.9309271, "reconstructedBalance": 6112.904537809762}]}	\N	2026-04-08 03:19:31.914723
171	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 03:20:06.188951
172	1	deposit	transaction	22	{"amount": 999995, "currency": "AUD"}	127.0.0.1	2026-04-08 03:24:06.021784
173	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": -600, "currency": "USD", "currentBalance": 1900, "reconstructedBalance": 2500}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 999296.0263892902, "currency": "AUD", "currentBalance": 1005408.9309271, "reconstructedBalance": 6112.90453780978}]}	\N	2026-04-08 03:25:02.925856
174	1	login_failed	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 03:25:20.567886
175	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 03:25:20.571399
176	1	deposit	transaction	23	{"amount": 500, "currency": "AUD"}	127.0.0.1	2026-04-08 03:25:27.966692
177	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 03:26:30.437283
178	1	fx_exchange	transaction	24	{"amount": 1000, "toCurrency": "USD", "fromCurrency": "AUD"}	127.0.0.1	2026-04-08 03:26:50.947218
179	1	deposit	transaction	25	{"amount": 123456, "currency": "CAD"}	127.0.0.1	2026-04-08 03:27:44.562428
180	1	withdrawal	transaction	26	{"amount": 324, "currency": "CAD"}	127.0.0.1	2026-04-08 03:28:08.211369
181	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 998796.0263892902, "currency": "AUD", "currentBalance": 1004908.9309271, "reconstructedBalance": 6112.90453780978}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}]}	\N	2026-04-08 03:29:47.587854
182	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 03:33:05.408206
183	1	deposit	transaction	27	{"amount": 345657, "currency": "ETH"}	127.0.0.1	2026-04-08 03:35:17.642686
184	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 998796.0263892902, "currency": "AUD", "currentBalance": 1004908.9309271, "reconstructedBalance": 6112.90453780978}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345657, "currency": "ETH", "currentBalance": 345657.5, "reconstructedBalance": 0.5}]}	\N	2026-04-08 03:40:18.647025
185	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 03:45:10.081575
186	1	fx_exchange	transaction	28	{"amount": 500, "toCurrency": "AUD", "fromCurrency": "ETH"}	127.0.0.1	2026-04-08 03:46:45.955
187	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2602214.6589561403, "currency": "AUD", "currentBalance": 2608327.56349395, "reconstructedBalance": 6112.904537809547}]}	\N	2026-04-08 04:03:06.17484
188	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 04:03:57.174274
189	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2602214.6589561403, "currency": "AUD", "currentBalance": 2608327.56349395, "reconstructedBalance": 6112.904537809547}]}	\N	2026-04-08 04:04:44.625988
190	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 04:06:36.767811
191	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2602214.6589561403, "currency": "AUD", "currentBalance": 2608327.56349395, "reconstructedBalance": 6112.904537809547}]}	\N	2026-04-08 05:40:34.137692
192	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2602214.6589561403, "currency": "AUD", "currentBalance": 2608327.56349395, "reconstructedBalance": 6112.904537809547}]}	\N	2026-04-08 05:46:42.218714
193	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2602214.6589561403, "currency": "AUD", "currentBalance": 2608327.56349395, "reconstructedBalance": 6112.904537809547}]}	\N	2026-04-08 05:47:20.24619
336	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 04:52:11.257915
350	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 07:31:23.741233
361	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 09:52:51.570563
454	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-10 06:42:25.329459
194	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2602214.6589561403, "currency": "AUD", "currentBalance": 2608327.56349395, "reconstructedBalance": 6112.904537809547}]}	\N	2026-04-08 05:49:24.376704
195	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2602214.6589561403, "currency": "AUD", "currentBalance": 2608327.56349395, "reconstructedBalance": 6112.904537809547}]}	\N	2026-04-08 05:50:06.843838
196	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 05:56:13.607079
197	1	deposit	transaction	29	{"amount": 123, "currency": "AUD"}	127.0.0.1	2026-04-08 05:58:44.839067
198	1	withdrawal	transaction	30	{"amount": 3456, "currency": "AUD"}	127.0.0.1	2026-04-08 05:59:15.928429
199	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598881.6589561403, "currency": "AUD", "currentBalance": 2604959.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:04:56.612781
200	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598881.6589561403, "currency": "AUD", "currentBalance": 2604959.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:06:09.098548
201	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 06:08:50.167361
202	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598881.6589561403, "currency": "AUD", "currentBalance": 2604959.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:09:26.511876
203	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598881.6589561403, "currency": "AUD", "currentBalance": 2604959.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:10:42.943201
204	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 06:11:39.623354
205	1	fx_exchange	transaction	31	{"amount": 500, "toCurrency": "BTC", "fromCurrency": "AUD"}	127.0.0.1	2026-04-08 06:16:03.863386
337	1	agreement_signed	user	1	{"signature": "OY X", "agreementRef": "AMXAGR-DDCA1AF4", "agreementVersion": "v2.0"}	\N	2026-04-09 04:53:36.217341
351	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 07:33:49.252329
455	1	id_verification_reset	user	1	{"note": "User requested re-verification of identity documents via Sumsub"}	127.0.0.1	2026-04-10 06:42:27.348956
206	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:30:43.646896
207	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:33:00.739749
208	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:34:45.076487
209	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:35:39.720649
210	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:39:55.293415
211	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 06:40:35.451451
212	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:51:45.258847
213	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 06:52:02.160182
338	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 05:20:18.960494
352	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 07:47:45.683136
362	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 09:58:22.646823
365	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:03:07.763481
456	1	login	user	1	{"username": "KenLancaster"}	127.0.0.1	2026-04-13 01:54:03.550142
459	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-13 02:02:23.352171
214	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 06:55:54.772442
215	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 07:01:14.859902
216	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 07:01:34.237295
217	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 07:05:17.276665
218	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 07:06:26.022227
219	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 07:08:31.31199
220	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 07:08:50.435825
221	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}]}	\N	2026-04-08 07:13:15.742462
222	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 07:15:15.693391
223	1	deposit	transaction	32	{"amount": 43567, "currency": "SGD"}	127.0.0.1	2026-04-08 07:17:01.893129
224	1	withdrawal	transaction	33	{"amount": 3425, "currency": "SGD"}	127.0.0.1	2026-04-08 07:17:35.194043
225	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}]}	\N	2026-04-08 07:20:20.308384
339	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 05:25:59.581659
353	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 08:02:45.012655
457	1	address_verification_reset	user	1	{"note": "User requested re-submission of proof of address via Sumsub"}	127.0.0.1	2026-04-13 02:02:03.485807
226	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}]}	\N	2026-04-08 07:23:01.321245
227	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}]}	\N	2026-04-08 07:24:26.595334
228	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 2598381.6589561403, "currency": "AUD", "currentBalance": 2604459.56349395, "reconstructedBalance": 6077.904537809547}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}]}	\N	2026-04-08 07:28:09.975453
229	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 07:37:57.857082
230	1	withdrawal	transaction	34	{"amount": 4353, "currency": "AUD"}	127.0.0.1	2026-04-08 07:46:58.656851
231	1	deposit	transaction	35	{"amount": 4356, "currency": "AUD"}	127.0.0.1	2026-04-08 07:47:20.78978
232	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 08:35:37.465644
233	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 08:41:11.959874
234	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 08:44:13.15264
354	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 08:08:07.382458
235	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 08:47:12.241259
236	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 08:48:53.931377
237	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 08:51:50.685241
238	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 08:56:00.934979
239	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 08:56:41.27622
240	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 09:05:00.713531
241	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 09:07:39.845941
340	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-09 05:30:13.133656
355	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 08:30:38.516957
242	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 09:10:08.700764
243	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2598384.6589561403, "currency": "AUD", "currentBalance": 2604427.56349395, "reconstructedBalance": 6042.904537809547}]}	\N	2026-04-08 09:12:14.532723
244	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 09:14:02.572241
245	1	deposit	transaction	36	{"amount": 76890, "method": "payid", "currency": "AUD"}	127.0.0.1	2026-04-08 09:15:39.803793
246	1	deposit	transaction	37	{"amount": 112, "method": "bank_transfer", "currency": "CNY"}	127.0.0.1	2026-04-08 09:16:08.744994
247	1	withdrawal	transaction	38	{"amount": 12340, "currency": "AUD"}	127.0.0.1	2026-04-08 09:16:31.670768
248	1	deposit	transaction	39	{"amount": 4347, "method": "bank_transfer", "currency": "CNY"}	127.0.0.1	2026-04-08 09:18:52.422858
249	1	deposit	transaction	40	{"amount": 3425, "method": "payid", "currency": "GBP"}	127.0.0.1	2026-04-08 09:21:23.813753
250	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 09:24:16.458462
251	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 09:27:27.816886
252	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 09:41:47.711711
341	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 05:36:26.140076
356	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 08:37:26.313827
363	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:00:15.740231
366	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:04:20.798957
458	1	address_verification_reset	user	1	{"note": "User requested re-submission of proof of address via Sumsub"}	127.0.0.1	2026-04-13 02:02:20.841204
253	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 09:44:10.562641
254	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 09:46:06.986263
255	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 09:48:07.607753
256	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 09:49:56.685773
257	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 09:52:29.103739
258	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 10:00:36.488918
259	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 10:01:08.471733
260	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 10:01:13.946865
261	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:04:52.946422
262	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:06:42.04164
263	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:09:00.579338
264	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:09:54.5424
265	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:19:27.443725
266	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:21:39.568753
267	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:23:14.455205
268	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 10:24:20.85149
269	1	withdrawal	transaction	41	{"amount": 2334, "currency": "AUD"}	127.0.0.1	2026-04-08 10:26:31.279697
270	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:28:35.883864
342	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-09 05:40:05.733264
271	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:29:55.569548
272	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:30:53.178438
273	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 10:34:05.897197
274	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:35:57.234434
275	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 10:37:13.029937
276	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:37:14.879813
277	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:38:36.404695
278	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:39:43.24528
279	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 10:41:29.06568
343	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 05:53:59.442758
280	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:45:01.532636
281	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 10:45:43.214907
282	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:49:11.088278
283	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:51:26.676879
284	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 10:52:04.131203
285	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 16:56:42.046139
286	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 17:27:16.618006
344	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-09 05:54:54.329981
357	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 08:39:32.637864
406	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 13:09:27.732585
287	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 17:29:28.324459
288	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 17:34:49.127736
289	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 17:39:03.002739
290	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 17:39:35.511575
291	1	logout	user	1	{}	127.0.0.1	2026-04-08 17:39:42.945725
292	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 18:18:10.318073
293	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 19:09:13.807453
294	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 20:00:13.631165
295	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 20:03:55.022688
296	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 20:05:17.633486
297	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 21:01:02.123473
298	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 21:03:24.949434
299	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 21:05:22.179592
300	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 21:08:00.230992
301	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 21:10:13.754198
302	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 21:11:48.829483
345	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 05:59:26.98196
358	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 08:40:28.890106
453	1	kyc_profile_submitted	user	1	{"riskLevel": "low", "pepDeclared": false}	\N	2026-04-10 06:36:56.188211
303	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 23:10:14.014747
304	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 23:10:30.501172
305	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 23:14:42.622863
306	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 23:16:51.904002
307	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 23:17:24.273453
308	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-08", "mismatches": [{"delta": 297984.58999999985, "currency": "KRW", "currentBalance": 4797984.59, "reconstructedBalance": 4500000}, {"delta": 174.49315, "currency": "NZD", "currentBalance": 174.49315, "reconstructedBalance": 0}, {"delta": 779.71185, "currency": "HKD", "currentBalance": 779.71185, "reconstructedBalance": 0}, {"delta": 1837.7948499999998, "currency": "CNY", "currentBalance": 1837.79485, "reconstructedBalance": 0.00000000000022737367544323206}, {"delta": 90.02255000000014, "currency": "USD", "currentBalance": 2590.02255, "reconstructedBalance": 2500}, {"delta": 123132, "currency": "CAD", "currentBalance": 127302, "reconstructedBalance": 4170}, {"delta": 345157, "currency": "ETH", "currentBalance": 345157.5, "reconstructedBalance": 0.5}, {"delta": 40142, "currency": "SGD", "currentBalance": 44712, "reconstructedBalance": 4570}, {"delta": 2586044.6589561403, "currency": "AUD", "currentBalance": 2592052.56349395, "reconstructedBalance": 6007.904537809547}]}	\N	2026-04-08 23:35:56.896333
309	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-08 23:40:58.437509
310	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 00:36:52.831695
311	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 00:45:58.229872
312	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 00:50:00.410669
313	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 01:06:53.502281
314	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 01:20:47.015351
315	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 01:25:44.460864
316	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 01:38:51.890657
317	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-09 01:45:49.55399
318	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 01:56:24.197048
319	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 01:59:28.196934
320	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 02:10:35.528089
321	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 02:13:59.436531
322	1	kyc_profile_submitted	user	1	{"riskLevel": "low", "pepDeclared": false}	\N	2026-04-09 02:14:40.10245
323	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 02:25:49.529534
324	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 03:09:05.963409
367	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:05:58.86391
368	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 10:07:49.722433
369	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:28:24.788637
370	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 10:28:55.715805
371	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:30:09.545728
372	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 10:31:21.255476
373	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:40:53.601323
374	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 10:42:48.387064
375	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:51:12.099347
376	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 10:54:57.507652
377	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 10:55:20.405328
378	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:04:07.237487
379	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:05:52.534064
380	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:07:56.046342
381	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:08:45.40273
382	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 12:09:12.297979
383	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:10:22.874478
384	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 12:10:37.300236
385	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:11:55.764853
386	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 12:12:13.762924
387	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:13:23.934336
388	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 12:13:36.602673
389	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:15:03.278872
390	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:17:38.612582
391	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 12:17:58.593642
392	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:19:05.960007
393	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:23:06.620616
394	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 12:23:53.037767
395	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:32:10.225498
396	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:34:47.05583
397	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:43:27.289432
398	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:45:25.309344
399	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 12:47:38.738041
400	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:53:07.943017
401	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 12:56:39.348264
402	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 12:59:32.172617
403	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 13:00:25.652584
404	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 13:01:18.566809
405	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 13:09:13.382751
407	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 13:12:44.058948
408	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 13:12:56.958455
409	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2591552.56349395, "reconstructedBalance": 2592052.56349395}]}	\N	2026-04-09 13:16:03.234797
410	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 13:16:33.627456
411	1	fx_exchange	transaction	43	{"amount": 1000, "rateShown": "0.70565000", "feeCharged": "3.52825000", "toCurrency": "USD", "fromCurrency": "AUD", "netConverted": "702.12175000", "consentTimestamp": "2026-04-09T13:20:42.218Z"}	127.0.0.1	2026-04-09 13:20:42.219748
412	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 13:29:25.529214
413	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 13:35:51.110389
414	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 13:36:39.834975
415	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 21:18:58.888594
416	1	login	user	1	{"username": "demo_user"}	127.0.0.1	2026-04-09 22:04:54.364572
417	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 22:05:04.470588
418	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 22:06:43.7961
419	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 22:40:40.739366
420	1	login	user	1	{"username": "johnchen"}	127.0.0.1	2026-04-09 23:06:27.621059
421	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 23:06:42.089341
422	1	login	user	1	{"username": "johnchen"}	127.0.0.1	2026-04-09 23:06:59.059589
423	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 23:10:32.236897
424	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 23:14:18.539897
425	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 23:30:01.19745
426	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 23:46:20.657353
427	1	ledger_drift_detected	wallet	\N	{"asOfDate": "2026-04-09", "mismatches": [{"delta": -500, "currency": "AUD", "currentBalance": 2590552.56349395, "reconstructedBalance": 2591052.56349395}]}	\N	2026-04-09 23:48:20.936144
428	1	login	user	1	{"username": "Johnchen"}	127.0.0.1	2026-04-09 23:50:16.193511
429	1	login	user	1	{"username": "Johnchen"}	127.0.0.1	2026-04-09 23:50:49.997993
430	1	login	user	1	{"username": "Johnchen"}	127.0.0.1	2026-04-09 23:51:00.727548
431	1	login	user	1	{"username": "Johnchen"}	127.0.0.1	2026-04-10 00:04:57.017966
432	1	logout	user	1	{}	127.0.0.1	2026-04-10 00:09:22.260942
433	1	login_failed	user	1	{"username": "Johnchen"}	127.0.0.1	2026-04-10 00:09:33.091022
434	1	login_failed	user	1	{"username": "Johnchen"}	127.0.0.1	2026-04-10 00:09:40.627689
435	1	login	user	1	{"username": "Johnchen"}	127.0.0.1	2026-04-10 00:11:35.256192
436	1	deposit	transaction	44	{"amount": 199, "method": "payid", "currency": "AUD"}	127.0.0.1	2026-04-10 00:43:34.226569
437	1	kyc_profile_submitted	user	1	{"riskLevel": "low", "pepDeclared": false}	\N	2026-04-10 03:15:39.903769
438	1	kyc_profile_submitted	user	1	{"riskLevel": "low", "pepDeclared": false}	\N	2026-04-10 03:48:29.646403
439	1	login	user	1	{"username": "KenLancaster"}	127.0.0.1	2026-04-10 05:29:17.793073
440	1	kyc_profile_submitted	user	1	{"riskLevel": "low", "pepDeclared": false}	\N	2026-04-10 05:56:05.179886
441	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-10 05:56:41.544833
442	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-10 06:06:21.828741
443	1	address_verification_reset	user	1	{"note": "User requested re-submission of proof of address via Sumsub"}	127.0.0.1	2026-04-10 06:06:33.276126
444	1	address_verification_reset	user	1	{"note": "User requested re-submission of proof of address via Sumsub"}	127.0.0.1	2026-04-10 06:06:45.823921
445	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-10 06:09:15.221543
446	1	address_verification_reset	user	1	{"note": "User requested re-submission of proof of address via Sumsub"}	127.0.0.1	2026-04-10 06:09:20.209366
447	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-10 06:29:40.721277
448	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-10 06:32:11.51534
449	1	id_verification_reset	user	1	{"note": "User requested re-verification of identity documents via Sumsub"}	127.0.0.1	2026-04-10 06:32:27.143375
450	1	id_verification_manual_review_queued	user	1	{"mode": "manual_review", "documentType": "passport"}	\N	2026-04-10 06:36:00.188156
451	1	id_verification_reset	user	1	{"note": "User requested re-verification of identity documents via Sumsub"}	127.0.0.1	2026-04-10 06:36:04.162104
452	1	address_verification_reset	user	1	{"note": "User requested re-submission of proof of address via Sumsub"}	127.0.0.1	2026-04-10 06:36:09.794263
460	1	id_verification_reset	user	1	{"note": "User requested re-verification of identity documents via Sumsub"}	127.0.0.1	2026-04-13 02:02:27.872866
461	1	kyc_profile_submitted	user	1	{"riskLevel": "low", "pepDeclared": false}	\N	2026-04-13 12:00:35.104608
462	1	logout	user	1	{}	127.0.0.1	2026-04-13 13:17:14.187534
463	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-13 13:26:41.189867
464	1	logout	user	1	{}	127.0.0.1	2026-04-13 13:27:04.989533
465	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-14 00:28:58.682333
466	1	logout	user	1	{}	127.0.0.1	2026-04-14 00:37:55.662929
467	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-14 00:38:15.645198
468	1	logout	user	1	{}	127.0.0.1	2026-04-14 00:49:49.50997
469	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-14 00:53:07.696402
470	1	login_failed	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-15 08:41:26.789812
471	1	login_failed	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-15 08:41:37.577057
472	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-15 08:43:29.692802
473	1	logout	user	1	{}	127.0.0.1	2026-04-15 12:08:54.581101
474	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-15 13:03:07.061377
475	1	logout	user	1	{}	127.0.0.1	2026-04-15 13:10:50.277311
476	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-15 13:11:13.553731
477	1	logout	user	1	{}	127.0.0.1	2026-04-15 13:13:14.093768
478	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-15 13:26:00.645633
479	1	logout	user	1	{}	127.0.0.1	2026-04-15 13:26:28.968453
485	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-17 10:42:26.464894
486	1	logout	user	1	{}	127.0.0.1	2026-04-17 10:48:44.037129
487	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-20 01:49:19.265829
488	1	logout	user	1	{}	127.0.0.1	2026-04-20 01:58:04.541918
489	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-20 01:59:26.941289
490	1	logout	user	1	{}	127.0.0.1	2026-04-20 05:25:53.356589
529	29	phone_register_started	user	29	{"email": "graceannxy@gmail.com", "phone": "+61401699386"}	127.0.0.1	2026-04-20 07:46:42.853111
530	29	email_verified	user	29	{"email": "graceannxy@gmail.com"}	127.0.0.1	2026-04-20 07:47:10.071015
531	29	logout	user	29	{}	127.0.0.1	2026-04-20 07:47:25.316743
532	30	register_google	user	30	{"email": "katrinashaw1418@gmail.com"}	127.0.0.1	2026-04-20 07:47:42.147382
533	30	login_google	user	30	{"email": "katrinashaw1418@gmail.com"}	127.0.0.1	2026-04-20 07:47:42.15229
534	30	logout	user	30	{}	127.0.0.1	2026-04-20 07:47:55.841583
535	31	register_google	user	31	{"email": "darlingox3@gmail.com"}	127.0.0.1	2026-04-20 07:48:16.734393
536	31	login_google	user	31	{"email": "darlingox3@gmail.com"}	127.0.0.1	2026-04-20 07:48:16.742065
537	32	register_google	user	32	{"email": "oyx8888@gmail.com"}	127.0.0.1	2026-04-20 07:49:21.032217
538	32	login_google	user	32	{"email": "oyx8888@gmail.com"}	127.0.0.1	2026-04-20 07:49:21.038211
539	32	logout	user	32	{}	127.0.0.1	2026-04-20 07:49:50.499919
540	33	phone_register_started	user	33	{"email": "prosperityxy@hotmail.com", "phone": "+61416803889"}	127.0.0.1	2026-04-20 08:05:28.750484
541	33	email_verified	user	33	{"email": "prosperityxy@hotmail.com"}	127.0.0.1	2026-04-20 08:08:25.229995
542	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-21 09:28:56.408247
543	1	login	user	1	{"username": "GeorgeLancaster"}	127.0.0.1	2026-04-24 12:05:42.892556
\.


--
-- Data for Name: compliance_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.compliance_actions (id, action_type, user_id, transaction_id, performed_by, notes, outcome, austrac_ref, created_at) FROM stdin;
1	id_verification_started	1	\N	system	Manual review queued — VERIFF_API_KEY not configured. Document type: passport. Customer: Demo User.	pending	\N	2026-04-09 01:45:49.546207
2	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Demo User.	pending	\N	2026-04-09 05:30:13.124632
3	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Demo User.	pending	\N	2026-04-09 05:40:05.72831
4	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Demo User.	pending	\N	2026-04-09 05:54:54.32523
5	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Ken Lancaster.	pending	\N	2026-04-10 05:56:41.5383
6	address_verification_started	1	\N	system	Manual review queued — SUMSUB credentials not configured. Customer: Ken Lancaster.	pending	\N	2026-04-10 05:57:02.685541
7	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:06:21.815745
8	address_verification_started	1	\N	system	Manual review queued — SUMSUB credentials not configured. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:06:43.604063
9	address_verification_started	1	\N	system	Manual review queued — SUMSUB credentials not configured. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:06:50.080331
10	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:09:15.21683
11	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:29:40.707911
12	address_verification_started	1	\N	system	Manual review queued — SUMSUB credentials not configured. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:29:46.991603
13	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:32:11.509801
14	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:36:00.183324
15	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Ken Lancaster.	pending	\N	2026-04-10 06:42:25.316465
16	address_verification_started	1	\N	system	Manual review queued — SUMSUB credentials not configured. Customer: Ken Lancaster.	pending	\N	2026-04-13 02:01:58.863378
17	address_verification_started	1	\N	system	Manual review queued — SUMSUB credentials not configured. Customer: Ken Lancaster.	pending	\N	2026-04-13 02:02:18.863818
18	id_verification_started	1	\N	system	Manual review queued — SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY not configured. Document type: passport. Customer: Ken Lancaster.	pending	\N	2026-04-13 02:02:23.348047
\.


--
-- Data for Name: fx_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fx_rates (id, base_currency, target_currency, rate, spread, updated_at) FROM stdin;
50	USD	NZD	1.70420000	0.0050	2026-04-29 12:33:36.418172
49	NZD	USD	0.58678559	0.0050	2026-04-29 12:33:36.424314
10	USD	SGD	1.27830000	0.0050	2026-04-29 12:33:36.429763
9	SGD	USD	0.78228898	0.0050	2026-04-29 12:33:36.435796
21	AUD	CAD	0.97838000	0.0050	2026-04-29 12:33:36.782623
22	CAD	AUD	1.02209775	0.0050	2026-04-29 12:33:36.787929
35	AUD	CNY	4.89230000	0.0050	2026-04-29 12:33:36.793963
36	CNY	AUD	0.20440284	0.0050	2026-04-29 12:33:36.798122
23	AUD	EUR	0.61248000	0.0050	2026-04-29 12:33:36.804174
24	EUR	AUD	1.63270637	0.0050	2026-04-29 12:33:36.810161
25	AUD	GBP	0.53111000	0.0050	2026-04-29 12:33:36.814715
26	GBP	AUD	1.88284913	0.0050	2026-04-29 12:33:36.820467
27	AUD	HKD	5.60590000	0.0050	2026-04-29 12:33:36.826359
28	HKD	AUD	0.17838349	0.0050	2026-04-29 12:33:36.832504
31	AUD	JPY	114.28000000	0.0050	2026-04-29 12:33:36.838592
32	JPY	AUD	0.00875044	0.0050	2026-04-29 12:33:36.844094
33	AUD	KRW	1056.54000000	0.0050	2026-04-29 12:33:36.85009
34	KRW	AUD	0.00094649	0.0050	2026-04-29 12:33:36.855562
51	AUD	NZD	1.21910000	0.0050	2026-04-29 12:33:36.861058
52	NZD	AUD	0.82027725	0.0050	2026-04-29 12:33:36.866499
29	AUD	SGD	0.91444000	0.0050	2026-04-29 12:33:36.871882
30	SGD	AUD	1.09356546	0.0050	2026-04-29 12:33:36.877811
17	AUD	USD	0.71538000	0.0050	2026-04-29 12:33:36.883427
18	USD	AUD	1.39785848	0.0050	2026-04-29 12:33:36.889418
39	USDT	AUD	1.39785848	0.0050	2026-04-29 12:33:36.894913
40	AUD	USDT	0.71538000	0.0050	2026-04-29 12:33:36.900812
45	USDT	USD	1.00000000	0.0010	2026-04-29 12:33:36.907281
46	USD	USDT	1.00000000	0.0010	2026-04-29 12:33:36.913335
41	USDC	AUD	1.39785848	0.0050	2026-04-29 12:33:36.919002
42	AUD	USDC	0.71538000	0.0050	2026-04-29 12:33:36.924384
47	USDC	USD	1.00000000	0.0010	2026-04-29 12:33:36.930272
48	USD	USDC	1.00000000	0.0010	2026-04-29 12:33:36.93531
5	BTC	USD	77057.97500000	0.0050	2026-04-29 12:33:37.008655
37	BTC	AUD	107716.14386759	0.0050	2026-04-29 12:33:37.014362
43	AUD	BTC	0.00000928	0.0050	2026-04-29 12:33:37.019829
6	ETH	USD	2311.24000000	0.0050	2026-04-29 12:33:37.049812
38	ETH	AUD	3230.78643518	0.0050	2026-04-29 12:33:37.05559
44	AUD	ETH	0.00030952	0.0050	2026-04-29 12:33:37.060927
1	USD	CAD	1.36760000	0.0050	2026-04-29 12:33:36.33304
2	CAD	USD	0.73120796	0.0050	2026-04-29 12:33:36.340068
16	USD	CNY	6.83880000	0.0050	2026-04-29 12:33:36.345841
15	CNY	USD	0.14622448	0.0050	2026-04-29 12:33:36.35201
3	USD	EUR	0.85616000	0.0040	2026-04-29 12:33:36.358713
4	EUR	USD	1.16800598	0.0040	2026-04-29 12:33:36.364422
8	USD	GBP	0.74242000	0.0050	2026-04-29 12:33:36.370873
7	GBP	USD	1.34694647	0.0050	2026-04-29 12:33:36.376749
20	USD	HKD	7.83620000	0.0050	2026-04-29 12:33:36.383054
19	HKD	USD	0.12761287	0.0050	2026-04-29 12:33:36.389342
12	USD	JPY	159.74000000	0.0050	2026-04-29 12:33:36.39524
11	JPY	USD	0.00626017	0.0050	2026-04-29 12:33:36.402037
14	USD	KRW	1476.89000000	0.0050	2026-04-29 12:33:36.406653
13	KRW	USD	0.00067710	0.0050	2026-04-29 12:33:36.412612
\.


--
-- Data for Name: idempotency_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.idempotency_keys (id, user_id, route, key, payload_hash, response_json, created_at) FROM stdin;
\.


--
-- Data for Name: investment_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.investment_products (id, name, category, sub_category, investment_strategy, target_net_irr, gross_irr, moic, term, structure, distributions, liquidity, minimum_investment, risk_profile, return_type, lvr, is_active, created_at, annual_return, return_method) FROM stdin;
1	Real Estate Equity Fund	real_estate	Commercial Property	Core Plus Strategy	8.5	9.2	1.35	24 months	Fund	Quarterly	Low	250000.00	Medium	Capital Growth	65	t	2025-08-01 14:03:36.694449	0.1100	fixed_annual_compound
2	Bitcoin Tracker Fund	digital_assets	Blockchain Investments	Market-based (historical 60%+ annualized) passive exposure to Bitcoin through systematic allocation methodology	15.0	15.0	1.15	12 months	ETF	None	High	25000.00	High	Capital Growth	0	t	2025-08-01 14:03:36.694449	0.6000	fixed_annual_compound
3	Corporate Credit Fund	corporate_credit	Investment Grade	Investment-grade corporate credit portfolio with midpoint IRR targeting 11% annual returns through diversified lending to established enterprises	6.2	6.8	1.12	18 months	Fund	Monthly	Medium	25000.00	Low	Income	0	t	2025-08-01 14:03:36.694449	0.1100	fixed_annual_compound
4	Web3 Innovation Fund	digital_assets	web3_innovation	Next-generation blockchain and Web3 infrastructure investments with midpoint IRR targeting 18% annual returns through exposure to DeFi, NFTs, and emerging crypto protocols	25-35%	\N	\N	3-5 years	Venture equity fund	Capital gains at exit	Illiquid / long-term lock-in	100000.00	high	capital_gains	\N	t	2025-08-01 14:24:07.69981	0.0575	fixed_annual_compound
5	Ethereum Staking Fund	digital_assets	ethereum_staking	Institutional-grade Ethereum staking with midpoint IRR targeting 5.75% annual returns through professional validator operations and MEV optimization	6-8%	\N	\N	Open-ended	Staking pool shares	Quarterly rewards	Monthly redemption	50000.00	moderate	income	\N	t	2025-08-01 14:24:07.69981	0.0575	fixed_annual_compound
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: portfolio_snapshots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portfolio_snapshots (id, user_id, total_value, crypto_value, stablecoin_value, fiat_value, investment_value, snapshot_date, created_at, source) FROM stdin;
3657	32	0.00	0.00	0.00	0.00	0.00	2026-04-20 07:49:32.94	2026-04-20 07:49:32.953404	actual
2	1	4741167.01	82500.00	100000.00	2264760.00	2293907.01	2026-01-01 00:00:00	2026-04-01 15:26:33.622752	historical_estimate
3	1	4742118.16	82500.00	100000.00	2264760.00	2294858.16	2026-01-02 00:00:00	2026-04-01 15:26:33.664008	historical_estimate
4	1	4743070.10	82500.00	100000.00	2264760.00	2295810.10	2026-01-03 00:00:00	2026-04-01 15:26:33.705268	historical_estimate
5	1	4744022.82	82500.00	100000.00	2264760.00	2296762.82	2026-01-04 00:00:00	2026-04-01 15:26:33.745045	historical_estimate
6	1	4744976.33	82500.00	100000.00	2264760.00	2297716.33	2026-01-05 00:00:00	2026-04-01 15:26:33.785502	historical_estimate
7	1	4745930.63	82500.00	100000.00	2264760.00	2298670.63	2026-01-06 00:00:00	2026-04-01 15:26:33.827161	historical_estimate
8	1	4746885.72	82500.00	100000.00	2264760.00	2299625.72	2026-01-07 00:00:00	2026-04-01 15:26:33.867128	historical_estimate
9	1	4747841.60	82500.00	100000.00	2264760.00	2300581.60	2026-01-08 00:00:00	2026-04-01 15:26:33.907399	historical_estimate
10	1	4748798.28	82500.00	100000.00	2264760.00	2301538.28	2026-01-09 00:00:00	2026-04-01 15:26:33.946741	historical_estimate
11	1	4749755.74	82500.00	100000.00	2264760.00	2302495.74	2026-01-10 00:00:00	2026-04-01 15:26:33.984332	historical_estimate
12	1	4750714.00	82500.00	100000.00	2264760.00	2303454.00	2026-01-11 00:00:00	2026-04-01 15:26:34.025505	historical_estimate
13	1	4751673.06	82500.00	100000.00	2264760.00	2304413.06	2026-01-12 00:00:00	2026-04-01 15:26:34.065617	historical_estimate
14	1	4752632.91	82500.00	100000.00	2264760.00	2305372.91	2026-01-13 00:00:00	2026-04-01 15:26:34.108105	historical_estimate
15	1	4753593.55	82500.00	100000.00	2264760.00	2306333.55	2026-01-14 00:00:00	2026-04-01 15:26:34.149757	historical_estimate
16	1	4754555.00	82500.00	100000.00	2264760.00	2307295.00	2026-01-15 00:00:00	2026-04-01 15:26:34.190512	historical_estimate
17	1	4755517.24	82500.00	100000.00	2264760.00	2308257.24	2026-01-16 00:00:00	2026-04-01 15:26:34.229244	historical_estimate
18	1	4756480.28	82500.00	100000.00	2264760.00	2309220.28	2026-01-17 00:00:00	2026-04-01 15:26:34.26971	historical_estimate
19	1	4757444.12	82500.00	100000.00	2264760.00	2310184.12	2026-01-18 00:00:00	2026-04-01 15:26:34.309309	historical_estimate
20	1	4758408.77	82500.00	100000.00	2264760.00	2311148.77	2026-01-19 00:00:00	2026-04-01 15:26:34.347627	historical_estimate
21	1	4759374.21	82500.00	100000.00	2264760.00	2312114.21	2026-01-20 00:00:00	2026-04-01 15:26:34.386273	historical_estimate
22	1	4760340.46	82500.00	100000.00	2264760.00	2313080.46	2026-01-21 00:00:00	2026-04-01 15:26:34.423491	historical_estimate
23	1	4761307.51	82500.00	100000.00	2264760.00	2314047.51	2026-01-22 00:00:00	2026-04-01 15:26:34.459468	historical_estimate
24	1	4762275.37	82500.00	100000.00	2264760.00	2315015.37	2026-01-23 00:00:00	2026-04-01 15:26:34.496706	historical_estimate
25	1	4763244.03	82500.00	100000.00	2264760.00	2315984.03	2026-01-24 00:00:00	2026-04-01 15:26:34.537348	historical_estimate
26	1	4764213.50	82500.00	100000.00	2264760.00	2316953.50	2026-01-25 00:00:00	2026-04-01 15:26:34.576861	historical_estimate
27	1	4765183.77	82500.00	100000.00	2264760.00	2317923.77	2026-01-26 00:00:00	2026-04-01 15:26:34.613069	historical_estimate
28	1	4766154.86	82500.00	100000.00	2264760.00	2318894.86	2026-01-27 00:00:00	2026-04-01 15:26:34.651208	historical_estimate
29	1	4767126.75	82500.00	100000.00	2264760.00	2319866.75	2026-01-28 00:00:00	2026-04-01 15:26:34.688697	historical_estimate
30	1	4768099.46	82500.00	100000.00	2264760.00	2320839.46	2026-01-29 00:00:00	2026-04-01 15:26:34.72592	historical_estimate
31	1	4769072.97	82500.00	100000.00	2264760.00	2321812.97	2026-01-30 00:00:00	2026-04-01 15:26:34.763801	historical_estimate
32	1	4770047.30	82500.00	100000.00	2264760.00	2322787.30	2026-01-31 00:00:00	2026-04-01 15:26:34.802259	historical_estimate
33	1	4771022.44	82500.00	100000.00	2264760.00	2323762.44	2026-02-01 00:00:00	2026-04-01 15:26:34.838367	historical_estimate
34	1	4771998.40	82500.00	100000.00	2264760.00	2324738.40	2026-02-02 00:00:00	2026-04-01 15:26:34.875617	historical_estimate
35	1	4772975.17	82500.00	100000.00	2264760.00	2325715.17	2026-02-03 00:00:00	2026-04-01 15:26:34.914521	historical_estimate
36	1	4773952.75	82500.00	100000.00	2264760.00	2326692.75	2026-02-04 00:00:00	2026-04-01 15:26:34.952392	historical_estimate
37	1	4774931.16	82500.00	100000.00	2264760.00	2327671.16	2026-02-05 00:00:00	2026-04-01 15:26:34.990101	historical_estimate
38	1	4775910.38	82500.00	100000.00	2264760.00	2328650.38	2026-02-06 00:00:00	2026-04-01 15:26:35.02562	historical_estimate
39	1	4776890.42	82500.00	100000.00	2264760.00	2329630.42	2026-02-07 00:00:00	2026-04-01 15:26:35.063338	historical_estimate
40	1	4777871.28	82500.00	100000.00	2264760.00	2330611.28	2026-02-08 00:00:00	2026-04-01 15:26:35.101124	historical_estimate
41	1	4778852.96	82500.00	100000.00	2264760.00	2331592.96	2026-02-09 00:00:00	2026-04-01 15:26:35.139995	historical_estimate
42	1	4779835.46	82500.00	100000.00	2264760.00	2332575.46	2026-02-10 00:00:00	2026-04-01 15:26:35.177359	historical_estimate
43	1	4780818.79	82500.00	100000.00	2264760.00	2333558.79	2026-02-11 00:00:00	2026-04-01 15:26:35.215934	historical_estimate
44	1	4781802.94	82500.00	100000.00	2264760.00	2334542.94	2026-02-12 00:00:00	2026-04-01 15:26:35.255592	historical_estimate
45	1	4782787.91	82500.00	100000.00	2264760.00	2335527.91	2026-02-13 00:00:00	2026-04-01 15:26:35.298399	historical_estimate
46	1	4783773.71	82500.00	100000.00	2264760.00	2336513.71	2026-02-14 00:00:00	2026-04-01 15:26:35.336073	historical_estimate
47	1	4784760.33	82500.00	100000.00	2264760.00	2337500.33	2026-02-15 00:00:00	2026-04-01 15:26:35.373129	historical_estimate
48	1	4785747.79	82500.00	100000.00	2264760.00	2338487.79	2026-02-16 00:00:00	2026-04-01 15:26:35.409259	historical_estimate
49	1	4786736.07	82500.00	100000.00	2264760.00	2339476.07	2026-02-17 00:00:00	2026-04-01 15:26:35.449938	historical_estimate
50	1	4787725.18	82500.00	100000.00	2264760.00	2340465.18	2026-02-18 00:00:00	2026-04-01 15:26:35.48897	historical_estimate
51	1	4788715.12	82500.00	100000.00	2264760.00	2341455.12	2026-02-19 00:00:00	2026-04-01 15:26:35.525776	historical_estimate
52	1	4789705.89	82500.00	100000.00	2264760.00	2342445.89	2026-02-20 00:00:00	2026-04-01 15:26:35.562905	historical_estimate
53	1	4790697.50	82500.00	100000.00	2264760.00	2343437.50	2026-02-21 00:00:00	2026-04-01 15:26:35.600792	historical_estimate
54	1	4791689.94	82500.00	100000.00	2264760.00	2344429.94	2026-02-22 00:00:00	2026-04-01 15:26:35.637903	historical_estimate
55	1	4792683.21	82500.00	100000.00	2264760.00	2345423.21	2026-02-23 00:00:00	2026-04-01 15:26:35.674285	historical_estimate
56	1	4793677.32	82500.00	100000.00	2264760.00	2346417.32	2026-02-24 00:00:00	2026-04-01 15:26:35.711442	historical_estimate
57	1	4794672.26	82500.00	100000.00	2264760.00	2347412.26	2026-02-25 00:00:00	2026-04-01 15:26:35.748955	historical_estimate
58	1	4795668.04	82500.00	100000.00	2264760.00	2348408.04	2026-02-26 00:00:00	2026-04-01 15:26:35.786475	historical_estimate
59	1	4796664.66	82500.00	100000.00	2264760.00	2349404.66	2026-02-27 00:00:00	2026-04-01 15:26:35.823626	historical_estimate
60	1	4797662.12	82500.00	100000.00	2264760.00	2350402.12	2026-02-28 00:00:00	2026-04-01 15:26:35.860804	historical_estimate
61	1	4798660.41	82500.00	100000.00	2264760.00	2351400.41	2026-03-01 00:00:00	2026-04-01 15:26:35.898888	historical_estimate
62	1	4799659.55	82500.00	100000.00	2264760.00	2352399.55	2026-03-02 00:00:00	2026-04-01 15:26:35.936024	historical_estimate
63	1	4800659.53	82500.00	100000.00	2264760.00	2353399.53	2026-03-03 00:00:00	2026-04-01 15:26:35.97292	historical_estimate
64	1	4801660.36	82500.00	100000.00	2264760.00	2354400.36	2026-03-04 00:00:00	2026-04-01 15:26:36.011069	historical_estimate
65	1	4802662.02	82500.00	100000.00	2264760.00	2355402.02	2026-03-05 00:00:00	2026-04-01 15:26:36.047276	historical_estimate
66	1	4803664.54	82500.00	100000.00	2264760.00	2356404.54	2026-03-06 00:00:00	2026-04-01 15:26:36.08393	historical_estimate
67	1	4804667.90	82500.00	100000.00	2264760.00	2357407.90	2026-03-07 00:00:00	2026-04-01 15:26:36.121825	historical_estimate
68	1	4805672.10	82500.00	100000.00	2264760.00	2358412.10	2026-03-08 00:00:00	2026-04-01 15:26:36.16471	historical_estimate
69	1	4806677.15	82500.00	100000.00	2264760.00	2359417.15	2026-03-09 00:00:00	2026-04-01 15:26:36.201544	historical_estimate
70	1	4807683.06	82500.00	100000.00	2264760.00	2360423.06	2026-03-10 00:00:00	2026-04-01 15:26:36.237478	historical_estimate
71	1	4808689.81	82500.00	100000.00	2264760.00	2361429.81	2026-03-11 00:00:00	2026-04-01 15:26:36.272703	historical_estimate
72	1	4809697.41	82500.00	100000.00	2264760.00	2362437.41	2026-03-12 00:00:00	2026-04-01 15:26:36.312436	historical_estimate
73	1	4810705.87	82500.00	100000.00	2264760.00	2363445.87	2026-03-13 00:00:00	2026-04-01 15:26:36.353178	historical_estimate
74	1	4811715.17	82500.00	100000.00	2264760.00	2364455.17	2026-03-14 00:00:00	2026-04-01 15:26:36.394903	historical_estimate
75	1	4812725.33	82500.00	100000.00	2264760.00	2365465.33	2026-03-15 00:00:00	2026-04-01 15:26:36.438745	historical_estimate
76	1	4813736.35	82500.00	100000.00	2264760.00	2366476.35	2026-03-16 00:00:00	2026-04-01 15:26:36.476896	historical_estimate
77	1	4814748.22	82500.00	100000.00	2264760.00	2367488.22	2026-03-17 00:00:00	2026-04-01 15:26:36.511381	historical_estimate
78	1	4815760.95	82500.00	100000.00	2264760.00	2368500.95	2026-03-18 00:00:00	2026-04-01 15:26:36.5484	historical_estimate
79	1	4816774.54	82500.00	100000.00	2264760.00	2369514.54	2026-03-19 00:00:00	2026-04-01 15:26:36.584472	historical_estimate
80	1	4817788.98	82500.00	100000.00	2264760.00	2370528.98	2026-03-20 00:00:00	2026-04-01 15:26:36.620381	historical_estimate
81	1	4818804.29	82500.00	100000.00	2264760.00	2371544.29	2026-03-21 00:00:00	2026-04-01 15:26:36.653845	historical_estimate
82	1	4819820.45	82500.00	100000.00	2264760.00	2372560.45	2026-03-22 00:00:00	2026-04-01 15:26:36.68986	historical_estimate
83	1	4820837.48	82500.00	100000.00	2264760.00	2373577.48	2026-03-23 00:00:00	2026-04-01 15:26:36.726337	historical_estimate
84	1	4821855.37	82500.00	100000.00	2264760.00	2374595.37	2026-03-24 00:00:00	2026-04-01 15:26:36.762804	historical_estimate
85	1	4822874.13	82500.00	100000.00	2264760.00	2375614.13	2026-03-25 00:00:00	2026-04-01 15:26:36.798854	historical_estimate
86	1	4823893.74	82500.00	100000.00	2264760.00	2376633.74	2026-03-26 00:00:00	2026-04-01 15:26:36.837272	historical_estimate
87	1	4824914.23	82500.00	100000.00	2264760.00	2377654.23	2026-03-27 00:00:00	2026-04-01 15:26:36.87218	historical_estimate
88	1	4825935.58	82500.00	100000.00	2264760.00	2378675.58	2026-03-28 00:00:00	2026-04-01 15:26:36.907861	historical_estimate
89	1	4826957.80	82500.00	100000.00	2264760.00	2379697.80	2026-03-29 00:00:00	2026-04-01 15:26:36.943424	historical_estimate
90	1	4827980.89	82500.00	100000.00	2264760.00	2380720.89	2026-03-30 00:00:00	2026-04-01 15:26:36.980564	historical_estimate
91	1	4829004.85	82500.00	100000.00	2264760.00	2381744.85	2026-03-31 00:00:00	2026-04-01 15:26:37.017882	historical_estimate
3658	29	0.00	0.00	0.00	0.00	0.00	2026-01-20 00:00:00	2026-04-20 07:51:20.148323	historical_estimate
3659	29	0.00	0.00	0.00	0.00	0.00	2026-01-21 00:00:00	2026-04-20 07:51:20.165603	historical_estimate
3660	29	0.00	0.00	0.00	0.00	0.00	2026-01-22 00:00:00	2026-04-20 07:51:20.180719	historical_estimate
3661	29	0.00	0.00	0.00	0.00	0.00	2026-01-23 00:00:00	2026-04-20 07:51:20.195664	historical_estimate
3662	29	0.00	0.00	0.00	0.00	0.00	2026-01-24 00:00:00	2026-04-20 07:51:20.21034	historical_estimate
3663	29	0.00	0.00	0.00	0.00	0.00	2026-01-25 00:00:00	2026-04-20 07:51:20.2244	historical_estimate
3664	29	0.00	0.00	0.00	0.00	0.00	2026-01-26 00:00:00	2026-04-20 07:51:20.239477	historical_estimate
847	1	2421195.02	4783.04	2300.00	25063.49	2389048.50	2026-04-07 14:38:37.877	2026-04-07 14:38:37.907137	actual
3665	29	0.00	0.00	0.00	0.00	0.00	2026-01-27 00:00:00	2026-04-20 07:51:20.254454	historical_estimate
3666	29	0.00	0.00	0.00	0.00	0.00	2026-01-28 00:00:00	2026-04-20 07:51:20.270287	historical_estimate
3667	29	0.00	0.00	0.00	0.00	0.00	2026-01-29 00:00:00	2026-04-20 07:51:20.286165	historical_estimate
3668	29	0.00	0.00	0.00	0.00	0.00	2026-01-30 00:00:00	2026-04-20 07:51:20.300165	historical_estimate
3669	29	0.00	0.00	0.00	0.00	0.00	2026-01-31 00:00:00	2026-04-20 07:51:20.314987	historical_estimate
3670	29	0.00	0.00	0.00	0.00	0.00	2026-02-01 00:00:00	2026-04-20 07:51:20.32895	historical_estimate
3671	29	0.00	0.00	0.00	0.00	0.00	2026-02-02 00:00:00	2026-04-20 07:51:20.344559	historical_estimate
3672	29	0.00	0.00	0.00	0.00	0.00	2026-02-03 00:00:00	2026-04-20 07:51:20.361087	historical_estimate
3673	29	0.00	0.00	0.00	0.00	0.00	2026-02-04 00:00:00	2026-04-20 07:51:20.37547	historical_estimate
3674	29	0.00	0.00	0.00	0.00	0.00	2026-02-05 00:00:00	2026-04-20 07:51:20.392026	historical_estimate
630	1	4811992.34	53977.49	100000.00	2272165.46	2385849.40	2026-04-03 22:58:12.724	2026-04-03 22:58:12.784134	actual
3675	29	0.00	0.00	0.00	0.00	0.00	2026-02-06 00:00:00	2026-04-20 07:51:20.408873	historical_estimate
3676	29	0.00	0.00	0.00	0.00	0.00	2026-02-07 00:00:00	2026-04-20 07:51:20.425073	historical_estimate
3677	29	0.00	0.00	0.00	0.00	0.00	2026-02-08 00:00:00	2026-04-20 07:51:20.440318	historical_estimate
3678	29	0.00	0.00	0.00	0.00	0.00	2026-02-09 00:00:00	2026-04-20 07:51:20.455685	historical_estimate
3679	29	0.00	0.00	0.00	0.00	0.00	2026-02-10 00:00:00	2026-04-20 07:51:20.472046	historical_estimate
3680	29	0.00	0.00	0.00	0.00	0.00	2026-02-11 00:00:00	2026-04-20 07:51:20.487138	historical_estimate
3681	29	0.00	0.00	0.00	0.00	0.00	2026-02-12 00:00:00	2026-04-20 07:51:20.502045	historical_estimate
3682	29	0.00	0.00	0.00	0.00	0.00	2026-02-13 00:00:00	2026-04-20 07:51:20.51535	historical_estimate
3683	29	0.00	0.00	0.00	0.00	0.00	2026-02-14 00:00:00	2026-04-20 07:51:20.530832	historical_estimate
3684	29	0.00	0.00	0.00	0.00	0.00	2026-02-15 00:00:00	2026-04-20 07:51:20.546383	historical_estimate
3685	29	0.00	0.00	0.00	0.00	0.00	2026-02-16 00:00:00	2026-04-20 07:51:20.562352	historical_estimate
3686	29	0.00	0.00	0.00	0.00	0.00	2026-02-17 00:00:00	2026-04-20 07:51:20.577277	historical_estimate
3687	29	0.00	0.00	0.00	0.00	0.00	2026-02-18 00:00:00	2026-04-20 07:51:20.592159	historical_estimate
3688	29	0.00	0.00	0.00	0.00	0.00	2026-02-19 00:00:00	2026-04-20 07:51:20.606612	historical_estimate
3689	29	0.00	0.00	0.00	0.00	0.00	2026-02-20 00:00:00	2026-04-20 07:51:20.620825	historical_estimate
3690	29	0.00	0.00	0.00	0.00	0.00	2026-02-21 00:00:00	2026-04-20 07:51:20.636315	historical_estimate
3691	29	0.00	0.00	0.00	0.00	0.00	2026-02-22 00:00:00	2026-04-20 07:51:20.65062	historical_estimate
3692	29	0.00	0.00	0.00	0.00	0.00	2026-02-23 00:00:00	2026-04-20 07:51:20.665339	historical_estimate
3693	29	0.00	0.00	0.00	0.00	0.00	2026-02-24 00:00:00	2026-04-20 07:51:20.680885	historical_estimate
749	1	4812152.62	54093.66	100000.00	2272165.46	2385893.50	2026-04-04 11:31:25.597	2026-04-04 11:31:25.896668	actual
750	1	4813107.02	54063.85	100000.00	2272165.46	2386877.72	2026-04-05 00:00:00	2026-04-06 01:18:57.118117	historical_estimate
3694	29	0.00	0.00	0.00	0.00	0.00	2026-02-25 00:00:00	2026-04-20 07:51:20.694316	historical_estimate
3695	29	0.00	0.00	0.00	0.00	0.00	2026-02-26 00:00:00	2026-04-20 07:51:20.708871	historical_estimate
3696	29	0.00	0.00	0.00	0.00	0.00	2026-02-27 00:00:00	2026-04-20 07:51:20.72384	historical_estimate
3697	29	0.00	0.00	0.00	0.00	0.00	2026-02-28 00:00:00	2026-04-20 07:51:20.738865	historical_estimate
3698	29	0.00	0.00	0.00	0.00	0.00	2026-03-01 00:00:00	2026-04-20 07:51:20.75306	historical_estimate
756	1	4815648.67	55576.30	100000.00	2272165.46	2387906.92	2026-04-06 01:24:37.854	2026-04-06 01:24:37.871755	actual
3699	29	0.00	0.00	0.00	0.00	0.00	2026-03-02 00:00:00	2026-04-20 07:51:20.767	historical_estimate
212	1	4831055.38	82500.00	100000.00	2264760.00	2383795.38	2026-04-01 23:54:02.816	2026-04-01 23:54:02.867513	actual
3700	29	0.00	0.00	0.00	0.00	0.00	2026-03-03 00:00:00	2026-04-20 07:51:20.782855	historical_estimate
3701	29	0.00	0.00	0.00	0.00	0.00	2026-03-04 00:00:00	2026-04-20 07:51:20.797198	historical_estimate
3702	29	0.00	0.00	0.00	0.00	0.00	2026-03-05 00:00:00	2026-04-20 07:51:20.811799	historical_estimate
3703	29	0.00	0.00	0.00	0.00	0.00	2026-03-06 00:00:00	2026-04-20 07:51:20.827242	historical_estimate
3704	29	0.00	0.00	0.00	0.00	0.00	2026-03-07 00:00:00	2026-04-20 07:51:20.841898	historical_estimate
3705	29	0.00	0.00	0.00	0.00	0.00	2026-03-08 00:00:00	2026-04-20 07:51:20.85575	historical_estimate
3706	29	0.00	0.00	0.00	0.00	0.00	2026-03-09 00:00:00	2026-04-20 07:51:20.871511	historical_estimate
3707	29	0.00	0.00	0.00	0.00	0.00	2026-03-10 00:00:00	2026-04-20 07:51:20.887511	historical_estimate
3708	29	0.00	0.00	0.00	0.00	0.00	2026-03-11 00:00:00	2026-04-20 07:51:20.90325	historical_estimate
505	1	4831054.63	82500.00	100000.00	2264759.26	2383795.38	2026-04-02 07:41:57.438	2026-04-02 07:41:57.45805	actual
1068	1	758433039.57	754068454.53	2300.00	1971285.26	2390999.78	2026-04-08 23:42:00.129	2026-04-08 23:42:00.165093	actual
3709	29	0.00	0.00	0.00	0.00	0.00	2026-03-12 00:00:00	2026-04-20 07:51:20.918471	historical_estimate
3710	29	0.00	0.00	0.00	0.00	0.00	2026-03-13 00:00:00	2026-04-20 07:51:20.932426	historical_estimate
3711	29	0.00	0.00	0.00	0.00	0.00	2026-03-14 00:00:00	2026-04-20 07:51:20.949014	historical_estimate
3712	29	0.00	0.00	0.00	0.00	0.00	2026-03-15 00:00:00	2026-04-20 07:51:20.967141	historical_estimate
3713	29	0.00	0.00	0.00	0.00	0.00	2026-03-16 00:00:00	2026-04-20 07:51:20.985916	historical_estimate
3714	29	0.00	0.00	0.00	0.00	0.00	2026-03-17 00:00:00	2026-04-20 07:51:21.002777	historical_estimate
3715	29	0.00	0.00	0.00	0.00	0.00	2026-03-18 00:00:00	2026-04-20 07:51:21.01764	historical_estimate
3716	29	0.00	0.00	0.00	0.00	0.00	2026-03-19 00:00:00	2026-04-20 07:51:21.032863	historical_estimate
3717	29	0.00	0.00	0.00	0.00	0.00	2026-03-20 00:00:00	2026-04-20 07:51:21.047026	historical_estimate
3718	29	0.00	0.00	0.00	0.00	0.00	2026-03-21 00:00:00	2026-04-20 07:51:21.061856	historical_estimate
3719	29	0.00	0.00	0.00	0.00	0.00	2026-03-22 00:00:00	2026-04-20 07:51:21.080938	historical_estimate
3720	29	0.00	0.00	0.00	0.00	0.00	2026-03-23 00:00:00	2026-04-20 07:51:21.099515	historical_estimate
3721	29	0.00	0.00	0.00	0.00	0.00	2026-03-24 00:00:00	2026-04-20 07:51:21.114364	historical_estimate
3722	29	0.00	0.00	0.00	0.00	0.00	2026-03-25 00:00:00	2026-04-20 07:51:21.128658	historical_estimate
3723	29	0.00	0.00	0.00	0.00	0.00	2026-03-26 00:00:00	2026-04-20 07:51:21.143325	historical_estimate
3724	29	0.00	0.00	0.00	0.00	0.00	2026-03-27 00:00:00	2026-04-20 07:51:21.158027	historical_estimate
3725	29	0.00	0.00	0.00	0.00	0.00	2026-03-28 00:00:00	2026-04-20 07:51:21.17185	historical_estimate
3726	29	0.00	0.00	0.00	0.00	0.00	2026-03-29 00:00:00	2026-04-20 07:51:21.18628	historical_estimate
3727	29	0.00	0.00	0.00	0.00	0.00	2026-03-30 00:00:00	2026-04-20 07:51:21.299066	historical_estimate
3728	29	0.00	0.00	0.00	0.00	0.00	2026-03-31 00:00:00	2026-04-20 07:51:21.313075	historical_estimate
3729	29	0.00	0.00	0.00	0.00	0.00	2026-04-01 00:00:00	2026-04-20 07:51:21.328573	historical_estimate
3730	29	0.00	0.00	0.00	0.00	0.00	2026-04-02 00:00:00	2026-04-20 07:51:21.342544	historical_estimate
3731	29	0.00	0.00	0.00	0.00	0.00	2026-04-03 00:00:00	2026-04-20 07:51:21.356957	historical_estimate
3732	29	0.00	0.00	0.00	0.00	0.00	2026-04-04 00:00:00	2026-04-20 07:51:21.370477	historical_estimate
3733	29	0.00	0.00	0.00	0.00	0.00	2026-04-05 00:00:00	2026-04-20 07:51:21.383145	historical_estimate
3734	29	0.00	0.00	0.00	0.00	0.00	2026-04-06 00:00:00	2026-04-20 07:51:21.397242	historical_estimate
3735	29	0.00	0.00	0.00	0.00	0.00	2026-04-07 00:00:00	2026-04-20 07:51:21.410408	historical_estimate
3736	29	0.00	0.00	0.00	0.00	0.00	2026-04-08 00:00:00	2026-04-20 07:51:21.422989	historical_estimate
3737	29	0.00	0.00	0.00	0.00	0.00	2026-04-09 00:00:00	2026-04-20 07:51:21.43725	historical_estimate
3738	29	0.00	0.00	0.00	0.00	0.00	2026-04-10 00:00:00	2026-04-20 07:51:21.451576	historical_estimate
3739	29	0.00	0.00	0.00	0.00	0.00	2026-04-11 00:00:00	2026-04-20 07:51:21.466113	historical_estimate
3740	29	0.00	0.00	0.00	0.00	0.00	2026-04-12 00:00:00	2026-04-20 07:51:21.480465	historical_estimate
3741	29	0.00	0.00	0.00	0.00	0.00	2026-04-13 00:00:00	2026-04-20 07:51:21.494518	historical_estimate
3742	29	0.00	0.00	0.00	0.00	0.00	2026-04-14 00:00:00	2026-04-20 07:51:21.509191	historical_estimate
3743	29	0.00	0.00	0.00	0.00	0.00	2026-04-15 00:00:00	2026-04-20 07:51:21.524657	historical_estimate
3744	29	0.00	0.00	0.00	0.00	0.00	2026-04-16 00:00:00	2026-04-20 07:51:21.540135	historical_estimate
3745	29	0.00	0.00	0.00	0.00	0.00	2026-04-17 00:00:00	2026-04-20 07:51:21.559042	historical_estimate
3746	29	0.00	0.00	0.00	0.00	0.00	2026-04-18 00:00:00	2026-04-20 07:51:21.575324	historical_estimate
3747	29	0.00	0.00	0.00	0.00	0.00	2026-04-19 00:00:00	2026-04-20 07:51:21.593494	historical_estimate
3748	29	0.00	0.00	0.00	0.00	0.00	2026-04-20 00:00:00	2026-04-20 07:51:21.606801	actual
3749	30	0.00	0.00	0.00	0.00	0.00	2026-01-20 00:00:00	2026-04-20 07:51:21.627951	historical_estimate
3750	30	0.00	0.00	0.00	0.00	0.00	2026-01-21 00:00:00	2026-04-20 07:51:21.642134	historical_estimate
3751	30	0.00	0.00	0.00	0.00	0.00	2026-01-22 00:00:00	2026-04-20 07:51:21.655575	historical_estimate
3752	30	0.00	0.00	0.00	0.00	0.00	2026-01-23 00:00:00	2026-04-20 07:51:21.669126	historical_estimate
3753	30	0.00	0.00	0.00	0.00	0.00	2026-01-24 00:00:00	2026-04-20 07:51:21.68266	historical_estimate
3754	30	0.00	0.00	0.00	0.00	0.00	2026-01-25 00:00:00	2026-04-20 07:51:21.694859	historical_estimate
3755	30	0.00	0.00	0.00	0.00	0.00	2026-01-26 00:00:00	2026-04-20 07:51:21.710458	historical_estimate
3756	30	0.00	0.00	0.00	0.00	0.00	2026-01-27 00:00:00	2026-04-20 07:51:21.724563	historical_estimate
3757	30	0.00	0.00	0.00	0.00	0.00	2026-01-28 00:00:00	2026-04-20 07:51:21.739079	historical_estimate
3758	30	0.00	0.00	0.00	0.00	0.00	2026-01-29 00:00:00	2026-04-20 07:51:21.753414	historical_estimate
3759	30	0.00	0.00	0.00	0.00	0.00	2026-01-30 00:00:00	2026-04-20 07:51:21.768591	historical_estimate
3760	30	0.00	0.00	0.00	0.00	0.00	2026-01-31 00:00:00	2026-04-20 07:51:21.783801	historical_estimate
3761	30	0.00	0.00	0.00	0.00	0.00	2026-02-01 00:00:00	2026-04-20 07:51:21.798534	historical_estimate
3762	30	0.00	0.00	0.00	0.00	0.00	2026-02-02 00:00:00	2026-04-20 07:51:21.812302	historical_estimate
3763	30	0.00	0.00	0.00	0.00	0.00	2026-02-03 00:00:00	2026-04-20 07:51:21.82624	historical_estimate
3764	30	0.00	0.00	0.00	0.00	0.00	2026-02-04 00:00:00	2026-04-20 07:51:21.83997	historical_estimate
3765	30	0.00	0.00	0.00	0.00	0.00	2026-02-05 00:00:00	2026-04-20 07:51:21.853333	historical_estimate
3766	30	0.00	0.00	0.00	0.00	0.00	2026-02-06 00:00:00	2026-04-20 07:51:21.866527	historical_estimate
3767	30	0.00	0.00	0.00	0.00	0.00	2026-02-07 00:00:00	2026-04-20 07:51:21.879958	historical_estimate
3768	30	0.00	0.00	0.00	0.00	0.00	2026-02-08 00:00:00	2026-04-20 07:51:21.893375	historical_estimate
3769	30	0.00	0.00	0.00	0.00	0.00	2026-02-09 00:00:00	2026-04-20 07:51:21.906904	historical_estimate
3770	30	0.00	0.00	0.00	0.00	0.00	2026-02-10 00:00:00	2026-04-20 07:51:21.921571	historical_estimate
3771	30	0.00	0.00	0.00	0.00	0.00	2026-02-11 00:00:00	2026-04-20 07:51:21.935522	historical_estimate
3772	30	0.00	0.00	0.00	0.00	0.00	2026-02-12 00:00:00	2026-04-20 07:51:21.949542	historical_estimate
3773	30	0.00	0.00	0.00	0.00	0.00	2026-02-13 00:00:00	2026-04-20 07:51:21.963143	historical_estimate
3774	30	0.00	0.00	0.00	0.00	0.00	2026-02-14 00:00:00	2026-04-20 07:51:21.978288	historical_estimate
3775	30	0.00	0.00	0.00	0.00	0.00	2026-02-15 00:00:00	2026-04-20 07:51:21.994183	historical_estimate
3776	30	0.00	0.00	0.00	0.00	0.00	2026-02-16 00:00:00	2026-04-20 07:51:22.008483	historical_estimate
3777	30	0.00	0.00	0.00	0.00	0.00	2026-02-17 00:00:00	2026-04-20 07:51:22.021741	historical_estimate
3778	30	0.00	0.00	0.00	0.00	0.00	2026-02-18 00:00:00	2026-04-20 07:51:22.036248	historical_estimate
3779	30	0.00	0.00	0.00	0.00	0.00	2026-02-19 00:00:00	2026-04-20 07:51:22.050796	historical_estimate
3780	30	0.00	0.00	0.00	0.00	0.00	2026-02-20 00:00:00	2026-04-20 07:51:22.064888	historical_estimate
3781	30	0.00	0.00	0.00	0.00	0.00	2026-02-21 00:00:00	2026-04-20 07:51:22.078922	historical_estimate
3782	30	0.00	0.00	0.00	0.00	0.00	2026-02-22 00:00:00	2026-04-20 07:51:22.092546	historical_estimate
3783	30	0.00	0.00	0.00	0.00	0.00	2026-02-23 00:00:00	2026-04-20 07:51:22.106369	historical_estimate
3784	30	0.00	0.00	0.00	0.00	0.00	2026-02-24 00:00:00	2026-04-20 07:51:22.120922	historical_estimate
3785	30	0.00	0.00	0.00	0.00	0.00	2026-02-25 00:00:00	2026-04-20 07:51:22.134359	historical_estimate
3786	30	0.00	0.00	0.00	0.00	0.00	2026-02-26 00:00:00	2026-04-20 07:51:22.14819	historical_estimate
3787	30	0.00	0.00	0.00	0.00	0.00	2026-02-27 00:00:00	2026-04-20 07:51:22.161132	historical_estimate
3788	30	0.00	0.00	0.00	0.00	0.00	2026-02-28 00:00:00	2026-04-20 07:51:22.174578	historical_estimate
3789	30	0.00	0.00	0.00	0.00	0.00	2026-03-01 00:00:00	2026-04-20 07:51:22.188438	historical_estimate
3790	30	0.00	0.00	0.00	0.00	0.00	2026-03-02 00:00:00	2026-04-20 07:51:22.201338	historical_estimate
3791	30	0.00	0.00	0.00	0.00	0.00	2026-03-03 00:00:00	2026-04-20 07:51:22.215137	historical_estimate
3792	30	0.00	0.00	0.00	0.00	0.00	2026-03-04 00:00:00	2026-04-20 07:51:22.229495	historical_estimate
3793	30	0.00	0.00	0.00	0.00	0.00	2026-03-05 00:00:00	2026-04-20 07:51:22.243117	historical_estimate
3794	30	0.00	0.00	0.00	0.00	0.00	2026-03-06 00:00:00	2026-04-20 07:51:22.256296	historical_estimate
3795	30	0.00	0.00	0.00	0.00	0.00	2026-03-07 00:00:00	2026-04-20 07:51:22.268677	historical_estimate
3796	30	0.00	0.00	0.00	0.00	0.00	2026-03-08 00:00:00	2026-04-20 07:51:22.282195	historical_estimate
3797	30	0.00	0.00	0.00	0.00	0.00	2026-03-09 00:00:00	2026-04-20 07:51:22.294513	historical_estimate
3798	30	0.00	0.00	0.00	0.00	0.00	2026-03-10 00:00:00	2026-04-20 07:51:22.310744	historical_estimate
3799	30	0.00	0.00	0.00	0.00	0.00	2026-03-11 00:00:00	2026-04-20 07:51:22.326585	historical_estimate
3800	30	0.00	0.00	0.00	0.00	0.00	2026-03-12 00:00:00	2026-04-20 07:51:22.341115	historical_estimate
3801	30	0.00	0.00	0.00	0.00	0.00	2026-03-13 00:00:00	2026-04-20 07:51:22.354605	historical_estimate
3802	30	0.00	0.00	0.00	0.00	0.00	2026-03-14 00:00:00	2026-04-20 07:51:22.367959	historical_estimate
3803	30	0.00	0.00	0.00	0.00	0.00	2026-03-15 00:00:00	2026-04-20 07:51:22.382415	historical_estimate
3804	30	0.00	0.00	0.00	0.00	0.00	2026-03-16 00:00:00	2026-04-20 07:51:22.396199	historical_estimate
3805	30	0.00	0.00	0.00	0.00	0.00	2026-03-17 00:00:00	2026-04-20 07:51:22.410228	historical_estimate
3806	30	0.00	0.00	0.00	0.00	0.00	2026-03-18 00:00:00	2026-04-20 07:51:22.421691	historical_estimate
3807	30	0.00	0.00	0.00	0.00	0.00	2026-03-19 00:00:00	2026-04-20 07:51:22.435877	historical_estimate
3808	30	0.00	0.00	0.00	0.00	0.00	2026-03-20 00:00:00	2026-04-20 07:51:22.449123	historical_estimate
3809	30	0.00	0.00	0.00	0.00	0.00	2026-03-21 00:00:00	2026-04-20 07:51:22.462923	historical_estimate
3810	30	0.00	0.00	0.00	0.00	0.00	2026-03-22 00:00:00	2026-04-20 07:51:22.476113	historical_estimate
3811	30	0.00	0.00	0.00	0.00	0.00	2026-03-23 00:00:00	2026-04-20 07:51:22.489502	historical_estimate
3812	30	0.00	0.00	0.00	0.00	0.00	2026-03-24 00:00:00	2026-04-20 07:51:22.502619	historical_estimate
3813	30	0.00	0.00	0.00	0.00	0.00	2026-03-25 00:00:00	2026-04-20 07:51:22.515238	historical_estimate
3814	30	0.00	0.00	0.00	0.00	0.00	2026-03-26 00:00:00	2026-04-20 07:51:22.528535	historical_estimate
3815	30	0.00	0.00	0.00	0.00	0.00	2026-03-27 00:00:00	2026-04-20 07:51:22.542126	historical_estimate
3816	30	0.00	0.00	0.00	0.00	0.00	2026-03-28 00:00:00	2026-04-20 07:51:22.556053	historical_estimate
3817	30	0.00	0.00	0.00	0.00	0.00	2026-03-29 00:00:00	2026-04-20 07:51:22.569605	historical_estimate
3818	30	0.00	0.00	0.00	0.00	0.00	2026-03-30 00:00:00	2026-04-20 07:51:22.582902	historical_estimate
3819	30	0.00	0.00	0.00	0.00	0.00	2026-03-31 00:00:00	2026-04-20 07:51:22.597876	historical_estimate
3820	30	0.00	0.00	0.00	0.00	0.00	2026-04-01 00:00:00	2026-04-20 07:51:22.611573	historical_estimate
3821	30	0.00	0.00	0.00	0.00	0.00	2026-04-02 00:00:00	2026-04-20 07:51:22.625545	historical_estimate
3822	30	0.00	0.00	0.00	0.00	0.00	2026-04-03 00:00:00	2026-04-20 07:51:22.639309	historical_estimate
3823	30	0.00	0.00	0.00	0.00	0.00	2026-04-04 00:00:00	2026-04-20 07:51:22.653475	historical_estimate
3824	30	0.00	0.00	0.00	0.00	0.00	2026-04-05 00:00:00	2026-04-20 07:51:22.671373	historical_estimate
3825	30	0.00	0.00	0.00	0.00	0.00	2026-04-06 00:00:00	2026-04-20 07:51:22.686132	historical_estimate
3826	30	0.00	0.00	0.00	0.00	0.00	2026-04-07 00:00:00	2026-04-20 07:51:22.699513	historical_estimate
3827	30	0.00	0.00	0.00	0.00	0.00	2026-04-08 00:00:00	2026-04-20 07:51:22.713592	historical_estimate
3828	30	0.00	0.00	0.00	0.00	0.00	2026-04-09 00:00:00	2026-04-20 07:51:22.726179	historical_estimate
3829	30	0.00	0.00	0.00	0.00	0.00	2026-04-10 00:00:00	2026-04-20 07:51:22.745606	historical_estimate
3830	30	0.00	0.00	0.00	0.00	0.00	2026-04-11 00:00:00	2026-04-20 07:51:22.759591	historical_estimate
3831	30	0.00	0.00	0.00	0.00	0.00	2026-04-12 00:00:00	2026-04-20 07:51:22.773747	historical_estimate
3832	30	0.00	0.00	0.00	0.00	0.00	2026-04-13 00:00:00	2026-04-20 07:51:22.787518	historical_estimate
3833	30	0.00	0.00	0.00	0.00	0.00	2026-04-14 00:00:00	2026-04-20 07:51:22.799737	historical_estimate
3834	30	0.00	0.00	0.00	0.00	0.00	2026-04-15 00:00:00	2026-04-20 07:51:22.812963	historical_estimate
3835	30	0.00	0.00	0.00	0.00	0.00	2026-04-16 00:00:00	2026-04-20 07:51:22.826658	historical_estimate
3836	30	0.00	0.00	0.00	0.00	0.00	2026-04-17 00:00:00	2026-04-20 07:51:22.838992	historical_estimate
3837	30	0.00	0.00	0.00	0.00	0.00	2026-04-18 00:00:00	2026-04-20 07:51:22.852282	historical_estimate
3838	30	0.00	0.00	0.00	0.00	0.00	2026-04-19 00:00:00	2026-04-20 07:51:22.865143	historical_estimate
3839	30	0.00	0.00	0.00	0.00	0.00	2026-04-20 00:00:00	2026-04-20 07:51:22.877003	actual
3840	31	0.00	0.00	0.00	0.00	0.00	2026-01-20 00:00:00	2026-04-20 07:51:22.897768	historical_estimate
3841	31	0.00	0.00	0.00	0.00	0.00	2026-01-21 00:00:00	2026-04-20 07:51:22.911663	historical_estimate
3842	31	0.00	0.00	0.00	0.00	0.00	2026-01-22 00:00:00	2026-04-20 07:51:22.925902	historical_estimate
3843	31	0.00	0.00	0.00	0.00	0.00	2026-01-23 00:00:00	2026-04-20 07:51:22.941032	historical_estimate
3844	31	0.00	0.00	0.00	0.00	0.00	2026-01-24 00:00:00	2026-04-20 07:51:22.955103	historical_estimate
3845	31	0.00	0.00	0.00	0.00	0.00	2026-01-25 00:00:00	2026-04-20 07:51:22.968149	historical_estimate
3846	31	0.00	0.00	0.00	0.00	0.00	2026-01-26 00:00:00	2026-04-20 07:51:22.982084	historical_estimate
3847	31	0.00	0.00	0.00	0.00	0.00	2026-01-27 00:00:00	2026-04-20 07:51:22.995417	historical_estimate
3848	31	0.00	0.00	0.00	0.00	0.00	2026-01-28 00:00:00	2026-04-20 07:51:23.007794	historical_estimate
3849	31	0.00	0.00	0.00	0.00	0.00	2026-01-29 00:00:00	2026-04-20 07:51:23.021095	historical_estimate
3850	31	0.00	0.00	0.00	0.00	0.00	2026-01-30 00:00:00	2026-04-20 07:51:23.034593	historical_estimate
3851	31	0.00	0.00	0.00	0.00	0.00	2026-01-31 00:00:00	2026-04-20 07:51:23.047696	historical_estimate
3852	31	0.00	0.00	0.00	0.00	0.00	2026-02-01 00:00:00	2026-04-20 07:51:23.060088	historical_estimate
3853	31	0.00	0.00	0.00	0.00	0.00	2026-02-02 00:00:00	2026-04-20 07:51:23.072595	historical_estimate
3854	31	0.00	0.00	0.00	0.00	0.00	2026-02-03 00:00:00	2026-04-20 07:51:23.085867	historical_estimate
3855	31	0.00	0.00	0.00	0.00	0.00	2026-02-04 00:00:00	2026-04-20 07:51:23.099662	historical_estimate
3856	31	0.00	0.00	0.00	0.00	0.00	2026-02-05 00:00:00	2026-04-20 07:51:23.111672	historical_estimate
3857	31	0.00	0.00	0.00	0.00	0.00	2026-02-06 00:00:00	2026-04-20 07:51:23.123733	historical_estimate
3858	31	0.00	0.00	0.00	0.00	0.00	2026-02-07 00:00:00	2026-04-20 07:51:23.137408	historical_estimate
3859	31	0.00	0.00	0.00	0.00	0.00	2026-02-08 00:00:00	2026-04-20 07:51:23.151399	historical_estimate
3860	31	0.00	0.00	0.00	0.00	0.00	2026-02-09 00:00:00	2026-04-20 07:51:23.16478	historical_estimate
3861	31	0.00	0.00	0.00	0.00	0.00	2026-02-10 00:00:00	2026-04-20 07:51:23.178892	historical_estimate
3862	31	0.00	0.00	0.00	0.00	0.00	2026-02-11 00:00:00	2026-04-20 07:51:23.191697	historical_estimate
3863	31	0.00	0.00	0.00	0.00	0.00	2026-02-12 00:00:00	2026-04-20 07:51:23.204713	historical_estimate
3864	31	0.00	0.00	0.00	0.00	0.00	2026-02-13 00:00:00	2026-04-20 07:51:23.218364	historical_estimate
3865	31	0.00	0.00	0.00	0.00	0.00	2026-02-14 00:00:00	2026-04-20 07:51:23.230289	historical_estimate
3866	31	0.00	0.00	0.00	0.00	0.00	2026-02-15 00:00:00	2026-04-20 07:51:23.243911	historical_estimate
3867	31	0.00	0.00	0.00	0.00	0.00	2026-02-16 00:00:00	2026-04-20 07:51:23.257242	historical_estimate
3868	31	0.00	0.00	0.00	0.00	0.00	2026-02-17 00:00:00	2026-04-20 07:51:23.270748	historical_estimate
3869	31	0.00	0.00	0.00	0.00	0.00	2026-02-18 00:00:00	2026-04-20 07:51:23.283108	historical_estimate
3870	31	0.00	0.00	0.00	0.00	0.00	2026-02-19 00:00:00	2026-04-20 07:51:23.297031	historical_estimate
3871	31	0.00	0.00	0.00	0.00	0.00	2026-02-20 00:00:00	2026-04-20 07:51:23.309445	historical_estimate
3872	31	0.00	0.00	0.00	0.00	0.00	2026-02-21 00:00:00	2026-04-20 07:51:23.322673	historical_estimate
3873	31	0.00	0.00	0.00	0.00	0.00	2026-02-22 00:00:00	2026-04-20 07:51:23.335601	historical_estimate
3874	31	0.00	0.00	0.00	0.00	0.00	2026-02-23 00:00:00	2026-04-20 07:51:23.349559	historical_estimate
3875	31	0.00	0.00	0.00	0.00	0.00	2026-02-24 00:00:00	2026-04-20 07:51:23.363098	historical_estimate
3876	31	0.00	0.00	0.00	0.00	0.00	2026-02-25 00:00:00	2026-04-20 07:51:23.375892	historical_estimate
3877	31	0.00	0.00	0.00	0.00	0.00	2026-02-26 00:00:00	2026-04-20 07:51:23.389329	historical_estimate
3878	31	0.00	0.00	0.00	0.00	0.00	2026-02-27 00:00:00	2026-04-20 07:51:23.4035	historical_estimate
3879	31	0.00	0.00	0.00	0.00	0.00	2026-02-28 00:00:00	2026-04-20 07:51:23.416106	historical_estimate
3880	31	0.00	0.00	0.00	0.00	0.00	2026-03-01 00:00:00	2026-04-20 07:51:23.430062	historical_estimate
3881	31	0.00	0.00	0.00	0.00	0.00	2026-03-02 00:00:00	2026-04-20 07:51:23.442728	historical_estimate
3882	31	0.00	0.00	0.00	0.00	0.00	2026-03-03 00:00:00	2026-04-20 07:51:23.457346	historical_estimate
3883	31	0.00	0.00	0.00	0.00	0.00	2026-03-04 00:00:00	2026-04-20 07:51:23.470644	historical_estimate
3884	31	0.00	0.00	0.00	0.00	0.00	2026-03-05 00:00:00	2026-04-20 07:51:23.484263	historical_estimate
3885	31	0.00	0.00	0.00	0.00	0.00	2026-03-06 00:00:00	2026-04-20 07:51:23.498462	historical_estimate
3886	31	0.00	0.00	0.00	0.00	0.00	2026-03-07 00:00:00	2026-04-20 07:51:23.511826	historical_estimate
3887	31	0.00	0.00	0.00	0.00	0.00	2026-03-08 00:00:00	2026-04-20 07:51:23.525574	historical_estimate
3888	31	0.00	0.00	0.00	0.00	0.00	2026-03-09 00:00:00	2026-04-20 07:51:23.539278	historical_estimate
3889	31	0.00	0.00	0.00	0.00	0.00	2026-03-10 00:00:00	2026-04-20 07:51:23.55311	historical_estimate
3890	31	0.00	0.00	0.00	0.00	0.00	2026-03-11 00:00:00	2026-04-20 07:51:23.56637	historical_estimate
3891	31	0.00	0.00	0.00	0.00	0.00	2026-03-12 00:00:00	2026-04-20 07:51:23.578786	historical_estimate
3892	31	0.00	0.00	0.00	0.00	0.00	2026-03-13 00:00:00	2026-04-20 07:51:23.592672	historical_estimate
3893	31	0.00	0.00	0.00	0.00	0.00	2026-03-14 00:00:00	2026-04-20 07:51:23.605492	historical_estimate
3894	31	0.00	0.00	0.00	0.00	0.00	2026-03-15 00:00:00	2026-04-20 07:51:23.618104	historical_estimate
3895	31	0.00	0.00	0.00	0.00	0.00	2026-03-16 00:00:00	2026-04-20 07:51:23.63158	historical_estimate
3896	31	0.00	0.00	0.00	0.00	0.00	2026-03-17 00:00:00	2026-04-20 07:51:23.645794	historical_estimate
3897	31	0.00	0.00	0.00	0.00	0.00	2026-03-18 00:00:00	2026-04-20 07:51:23.660776	historical_estimate
3898	31	0.00	0.00	0.00	0.00	0.00	2026-03-19 00:00:00	2026-04-20 07:51:23.675086	historical_estimate
3899	31	0.00	0.00	0.00	0.00	0.00	2026-03-20 00:00:00	2026-04-20 07:51:23.690313	historical_estimate
3900	31	0.00	0.00	0.00	0.00	0.00	2026-03-21 00:00:00	2026-04-20 07:51:23.704963	historical_estimate
3901	31	0.00	0.00	0.00	0.00	0.00	2026-03-22 00:00:00	2026-04-20 07:51:23.718077	historical_estimate
3902	31	0.00	0.00	0.00	0.00	0.00	2026-03-23 00:00:00	2026-04-20 07:51:23.731678	historical_estimate
3903	31	0.00	0.00	0.00	0.00	0.00	2026-03-24 00:00:00	2026-04-20 07:51:23.745022	historical_estimate
3904	31	0.00	0.00	0.00	0.00	0.00	2026-03-25 00:00:00	2026-04-20 07:51:23.758234	historical_estimate
3905	31	0.00	0.00	0.00	0.00	0.00	2026-03-26 00:00:00	2026-04-20 07:51:23.771612	historical_estimate
3906	31	0.00	0.00	0.00	0.00	0.00	2026-03-27 00:00:00	2026-04-20 07:51:23.784441	historical_estimate
3907	31	0.00	0.00	0.00	0.00	0.00	2026-03-28 00:00:00	2026-04-20 07:51:23.797603	historical_estimate
3908	31	0.00	0.00	0.00	0.00	0.00	2026-03-29 00:00:00	2026-04-20 07:51:23.81207	historical_estimate
3909	31	0.00	0.00	0.00	0.00	0.00	2026-03-30 00:00:00	2026-04-20 07:51:23.823717	historical_estimate
3910	31	0.00	0.00	0.00	0.00	0.00	2026-03-31 00:00:00	2026-04-20 07:51:23.836992	historical_estimate
3911	31	0.00	0.00	0.00	0.00	0.00	2026-04-01 00:00:00	2026-04-20 07:51:23.850005	historical_estimate
3912	31	0.00	0.00	0.00	0.00	0.00	2026-04-02 00:00:00	2026-04-20 07:51:23.863664	historical_estimate
3913	31	0.00	0.00	0.00	0.00	0.00	2026-04-03 00:00:00	2026-04-20 07:51:23.877078	historical_estimate
3914	31	0.00	0.00	0.00	0.00	0.00	2026-04-04 00:00:00	2026-04-20 07:51:23.889056	historical_estimate
3915	31	0.00	0.00	0.00	0.00	0.00	2026-04-05 00:00:00	2026-04-20 07:51:23.902363	historical_estimate
3916	31	0.00	0.00	0.00	0.00	0.00	2026-04-06 00:00:00	2026-04-20 07:51:23.915529	historical_estimate
3917	31	0.00	0.00	0.00	0.00	0.00	2026-04-07 00:00:00	2026-04-20 07:51:23.929267	historical_estimate
3918	31	0.00	0.00	0.00	0.00	0.00	2026-04-08 00:00:00	2026-04-20 07:51:23.942412	historical_estimate
3919	31	0.00	0.00	0.00	0.00	0.00	2026-04-09 00:00:00	2026-04-20 07:51:23.956084	historical_estimate
3920	31	0.00	0.00	0.00	0.00	0.00	2026-04-10 00:00:00	2026-04-20 07:51:23.968666	historical_estimate
3921	31	0.00	0.00	0.00	0.00	0.00	2026-04-11 00:00:00	2026-04-20 07:51:23.982026	historical_estimate
3922	31	0.00	0.00	0.00	0.00	0.00	2026-04-12 00:00:00	2026-04-20 07:51:23.994993	historical_estimate
3923	31	0.00	0.00	0.00	0.00	0.00	2026-04-13 00:00:00	2026-04-20 07:51:24.009576	historical_estimate
3924	31	0.00	0.00	0.00	0.00	0.00	2026-04-14 00:00:00	2026-04-20 07:51:24.022527	historical_estimate
3925	31	0.00	0.00	0.00	0.00	0.00	2026-04-15 00:00:00	2026-04-20 07:51:24.036215	historical_estimate
3926	31	0.00	0.00	0.00	0.00	0.00	2026-04-16 00:00:00	2026-04-20 07:51:24.048632	historical_estimate
3927	31	0.00	0.00	0.00	0.00	0.00	2026-04-17 00:00:00	2026-04-20 07:51:24.062447	historical_estimate
3928	31	0.00	0.00	0.00	0.00	0.00	2026-04-18 00:00:00	2026-04-20 07:51:24.075618	historical_estimate
3929	31	0.00	0.00	0.00	0.00	0.00	2026-04-19 00:00:00	2026-04-20 07:51:24.089138	historical_estimate
3930	31	0.00	0.00	0.00	0.00	0.00	2026-04-20 00:00:00	2026-04-20 07:51:24.100639	actual
3931	32	0.00	0.00	0.00	0.00	0.00	2026-01-20 00:00:00	2026-04-20 07:51:24.120496	historical_estimate
3932	32	0.00	0.00	0.00	0.00	0.00	2026-01-21 00:00:00	2026-04-20 07:51:24.133329	historical_estimate
3933	32	0.00	0.00	0.00	0.00	0.00	2026-01-22 00:00:00	2026-04-20 07:51:24.146451	historical_estimate
3934	32	0.00	0.00	0.00	0.00	0.00	2026-01-23 00:00:00	2026-04-20 07:51:24.158093	historical_estimate
3935	32	0.00	0.00	0.00	0.00	0.00	2026-01-24 00:00:00	2026-04-20 07:51:24.170104	historical_estimate
3936	32	0.00	0.00	0.00	0.00	0.00	2026-01-25 00:00:00	2026-04-20 07:51:24.183127	historical_estimate
3937	32	0.00	0.00	0.00	0.00	0.00	2026-01-26 00:00:00	2026-04-20 07:51:24.196467	historical_estimate
3938	32	0.00	0.00	0.00	0.00	0.00	2026-01-27 00:00:00	2026-04-20 07:51:24.209627	historical_estimate
3939	32	0.00	0.00	0.00	0.00	0.00	2026-01-28 00:00:00	2026-04-20 07:51:24.224767	historical_estimate
3940	32	0.00	0.00	0.00	0.00	0.00	2026-01-29 00:00:00	2026-04-20 07:51:24.238104	historical_estimate
3941	32	0.00	0.00	0.00	0.00	0.00	2026-01-30 00:00:00	2026-04-20 07:51:24.251678	historical_estimate
3942	32	0.00	0.00	0.00	0.00	0.00	2026-01-31 00:00:00	2026-04-20 07:51:24.264792	historical_estimate
3943	32	0.00	0.00	0.00	0.00	0.00	2026-02-01 00:00:00	2026-04-20 07:51:24.277355	historical_estimate
3944	32	0.00	0.00	0.00	0.00	0.00	2026-02-02 00:00:00	2026-04-20 07:51:24.2905	historical_estimate
3945	32	0.00	0.00	0.00	0.00	0.00	2026-02-03 00:00:00	2026-04-20 07:51:24.304712	historical_estimate
3946	32	0.00	0.00	0.00	0.00	0.00	2026-02-04 00:00:00	2026-04-20 07:51:24.317591	historical_estimate
3947	32	0.00	0.00	0.00	0.00	0.00	2026-02-05 00:00:00	2026-04-20 07:51:24.331296	historical_estimate
3948	32	0.00	0.00	0.00	0.00	0.00	2026-02-06 00:00:00	2026-04-20 07:51:24.34426	historical_estimate
3949	32	0.00	0.00	0.00	0.00	0.00	2026-02-07 00:00:00	2026-04-20 07:51:24.35765	historical_estimate
3950	32	0.00	0.00	0.00	0.00	0.00	2026-02-08 00:00:00	2026-04-20 07:51:24.370895	historical_estimate
3951	32	0.00	0.00	0.00	0.00	0.00	2026-02-09 00:00:00	2026-04-20 07:51:24.384542	historical_estimate
3952	32	0.00	0.00	0.00	0.00	0.00	2026-02-10 00:00:00	2026-04-20 07:51:24.397125	historical_estimate
3953	32	0.00	0.00	0.00	0.00	0.00	2026-02-11 00:00:00	2026-04-20 07:51:24.410703	historical_estimate
3954	32	0.00	0.00	0.00	0.00	0.00	2026-02-12 00:00:00	2026-04-20 07:51:24.423946	historical_estimate
3955	32	0.00	0.00	0.00	0.00	0.00	2026-02-13 00:00:00	2026-04-20 07:51:24.438078	historical_estimate
3956	32	0.00	0.00	0.00	0.00	0.00	2026-02-14 00:00:00	2026-04-20 07:51:24.451434	historical_estimate
3957	32	0.00	0.00	0.00	0.00	0.00	2026-02-15 00:00:00	2026-04-20 07:51:24.463676	historical_estimate
3958	32	0.00	0.00	0.00	0.00	0.00	2026-02-16 00:00:00	2026-04-20 07:51:24.476362	historical_estimate
3959	32	0.00	0.00	0.00	0.00	0.00	2026-02-17 00:00:00	2026-04-20 07:51:24.489865	historical_estimate
3960	32	0.00	0.00	0.00	0.00	0.00	2026-02-18 00:00:00	2026-04-20 07:51:24.503063	historical_estimate
3961	32	0.00	0.00	0.00	0.00	0.00	2026-02-19 00:00:00	2026-04-20 07:51:24.51648	historical_estimate
3962	32	0.00	0.00	0.00	0.00	0.00	2026-02-20 00:00:00	2026-04-20 07:51:24.529348	historical_estimate
3963	32	0.00	0.00	0.00	0.00	0.00	2026-02-21 00:00:00	2026-04-20 07:51:24.542572	historical_estimate
3964	32	0.00	0.00	0.00	0.00	0.00	2026-02-22 00:00:00	2026-04-20 07:51:24.555468	historical_estimate
3965	32	0.00	0.00	0.00	0.00	0.00	2026-02-23 00:00:00	2026-04-20 07:51:24.568582	historical_estimate
3966	32	0.00	0.00	0.00	0.00	0.00	2026-02-24 00:00:00	2026-04-20 07:51:24.580868	historical_estimate
3967	32	0.00	0.00	0.00	0.00	0.00	2026-02-25 00:00:00	2026-04-20 07:51:24.594249	historical_estimate
3968	32	0.00	0.00	0.00	0.00	0.00	2026-02-26 00:00:00	2026-04-20 07:51:24.607738	historical_estimate
3969	32	0.00	0.00	0.00	0.00	0.00	2026-02-27 00:00:00	2026-04-20 07:51:24.621898	historical_estimate
3970	32	0.00	0.00	0.00	0.00	0.00	2026-02-28 00:00:00	2026-04-20 07:51:24.636638	historical_estimate
3971	32	0.00	0.00	0.00	0.00	0.00	2026-03-01 00:00:00	2026-04-20 07:51:24.652476	historical_estimate
3972	32	0.00	0.00	0.00	0.00	0.00	2026-03-02 00:00:00	2026-04-20 07:51:24.666241	historical_estimate
3973	32	0.00	0.00	0.00	0.00	0.00	2026-03-03 00:00:00	2026-04-20 07:51:24.679899	historical_estimate
3974	32	0.00	0.00	0.00	0.00	0.00	2026-03-04 00:00:00	2026-04-20 07:51:24.693242	historical_estimate
3975	32	0.00	0.00	0.00	0.00	0.00	2026-03-05 00:00:00	2026-04-20 07:51:24.706124	historical_estimate
3976	32	0.00	0.00	0.00	0.00	0.00	2026-03-06 00:00:00	2026-04-20 07:51:24.718124	historical_estimate
3977	32	0.00	0.00	0.00	0.00	0.00	2026-03-07 00:00:00	2026-04-20 07:51:24.731616	historical_estimate
3978	32	0.00	0.00	0.00	0.00	0.00	2026-03-08 00:00:00	2026-04-20 07:51:24.743605	historical_estimate
3979	32	0.00	0.00	0.00	0.00	0.00	2026-03-09 00:00:00	2026-04-20 07:51:24.757123	historical_estimate
3980	32	0.00	0.00	0.00	0.00	0.00	2026-03-10 00:00:00	2026-04-20 07:51:24.770398	historical_estimate
3981	32	0.00	0.00	0.00	0.00	0.00	2026-03-11 00:00:00	2026-04-20 07:51:24.783839	historical_estimate
3982	32	0.00	0.00	0.00	0.00	0.00	2026-03-12 00:00:00	2026-04-20 07:51:24.796862	historical_estimate
3983	32	0.00	0.00	0.00	0.00	0.00	2026-03-13 00:00:00	2026-04-20 07:51:24.810081	historical_estimate
3984	32	0.00	0.00	0.00	0.00	0.00	2026-03-14 00:00:00	2026-04-20 07:51:24.823058	historical_estimate
3985	32	0.00	0.00	0.00	0.00	0.00	2026-03-15 00:00:00	2026-04-20 07:51:24.836945	historical_estimate
3986	32	0.00	0.00	0.00	0.00	0.00	2026-03-16 00:00:00	2026-04-20 07:51:24.850333	historical_estimate
3987	32	0.00	0.00	0.00	0.00	0.00	2026-03-17 00:00:00	2026-04-20 07:51:24.863649	historical_estimate
3988	32	0.00	0.00	0.00	0.00	0.00	2026-03-18 00:00:00	2026-04-20 07:51:24.876069	historical_estimate
3989	32	0.00	0.00	0.00	0.00	0.00	2026-03-19 00:00:00	2026-04-20 07:51:24.889669	historical_estimate
3990	32	0.00	0.00	0.00	0.00	0.00	2026-03-20 00:00:00	2026-04-20 07:51:24.902845	historical_estimate
3991	32	0.00	0.00	0.00	0.00	0.00	2026-03-21 00:00:00	2026-04-20 07:51:24.91656	historical_estimate
3992	32	0.00	0.00	0.00	0.00	0.00	2026-03-22 00:00:00	2026-04-20 07:51:24.929249	historical_estimate
3993	32	0.00	0.00	0.00	0.00	0.00	2026-03-23 00:00:00	2026-04-20 07:51:24.942548	historical_estimate
3994	32	0.00	0.00	0.00	0.00	0.00	2026-03-24 00:00:00	2026-04-20 07:51:24.955649	historical_estimate
3995	32	0.00	0.00	0.00	0.00	0.00	2026-03-25 00:00:00	2026-04-20 07:51:24.969377	historical_estimate
3996	32	0.00	0.00	0.00	0.00	0.00	2026-03-26 00:00:00	2026-04-20 07:51:24.982297	historical_estimate
3997	32	0.00	0.00	0.00	0.00	0.00	2026-03-27 00:00:00	2026-04-20 07:51:24.995734	historical_estimate
3998	32	0.00	0.00	0.00	0.00	0.00	2026-03-28 00:00:00	2026-04-20 07:51:25.009587	historical_estimate
3999	32	0.00	0.00	0.00	0.00	0.00	2026-03-29 00:00:00	2026-04-20 07:51:25.022788	historical_estimate
4000	32	0.00	0.00	0.00	0.00	0.00	2026-03-30 00:00:00	2026-04-20 07:51:25.035181	historical_estimate
4001	32	0.00	0.00	0.00	0.00	0.00	2026-03-31 00:00:00	2026-04-20 07:51:25.048594	historical_estimate
4002	32	0.00	0.00	0.00	0.00	0.00	2026-04-01 00:00:00	2026-04-20 07:51:25.062108	historical_estimate
4003	32	0.00	0.00	0.00	0.00	0.00	2026-04-02 00:00:00	2026-04-20 07:51:25.075688	historical_estimate
4004	32	0.00	0.00	0.00	0.00	0.00	2026-04-03 00:00:00	2026-04-20 07:51:25.089021	historical_estimate
4005	32	0.00	0.00	0.00	0.00	0.00	2026-04-04 00:00:00	2026-04-20 07:51:25.10284	historical_estimate
4006	32	0.00	0.00	0.00	0.00	0.00	2026-04-05 00:00:00	2026-04-20 07:51:25.115522	historical_estimate
4007	32	0.00	0.00	0.00	0.00	0.00	2026-04-06 00:00:00	2026-04-20 07:51:25.127736	historical_estimate
4008	32	0.00	0.00	0.00	0.00	0.00	2026-04-07 00:00:00	2026-04-20 07:51:25.140972	historical_estimate
4009	32	0.00	0.00	0.00	0.00	0.00	2026-04-08 00:00:00	2026-04-20 07:51:25.154638	historical_estimate
4010	32	0.00	0.00	0.00	0.00	0.00	2026-04-09 00:00:00	2026-04-20 07:51:25.169098	historical_estimate
4011	32	0.00	0.00	0.00	0.00	0.00	2026-04-10 00:00:00	2026-04-20 07:51:25.185508	historical_estimate
4012	32	0.00	0.00	0.00	0.00	0.00	2026-04-11 00:00:00	2026-04-20 07:51:25.200306	historical_estimate
4013	32	0.00	0.00	0.00	0.00	0.00	2026-04-12 00:00:00	2026-04-20 07:51:25.214418	historical_estimate
4014	32	0.00	0.00	0.00	0.00	0.00	2026-04-13 00:00:00	2026-04-20 07:51:25.227511	historical_estimate
4015	32	0.00	0.00	0.00	0.00	0.00	2026-04-14 00:00:00	2026-04-20 07:51:25.240968	historical_estimate
4016	32	0.00	0.00	0.00	0.00	0.00	2026-04-15 00:00:00	2026-04-20 07:51:25.254216	historical_estimate
4017	32	0.00	0.00	0.00	0.00	0.00	2026-04-16 00:00:00	2026-04-20 07:51:25.268033	historical_estimate
4018	32	0.00	0.00	0.00	0.00	0.00	2026-04-17 00:00:00	2026-04-20 07:51:25.281053	historical_estimate
4019	32	0.00	0.00	0.00	0.00	0.00	2026-04-18 00:00:00	2026-04-20 07:51:25.296136	historical_estimate
4020	32	0.00	0.00	0.00	0.00	0.00	2026-04-19 00:00:00	2026-04-20 07:51:25.310949	historical_estimate
4021	33	0.00	0.00	0.00	0.00	0.00	2026-01-20 00:00:00	2026-04-20 08:47:58.273076	historical_estimate
4022	33	0.00	0.00	0.00	0.00	0.00	2026-01-21 00:00:00	2026-04-20 08:47:58.295087	historical_estimate
4023	33	0.00	0.00	0.00	0.00	0.00	2026-01-22 00:00:00	2026-04-20 08:47:58.30974	historical_estimate
4024	33	0.00	0.00	0.00	0.00	0.00	2026-01-23 00:00:00	2026-04-20 08:47:58.323778	historical_estimate
4025	33	0.00	0.00	0.00	0.00	0.00	2026-01-24 00:00:00	2026-04-20 08:47:58.339767	historical_estimate
4026	33	0.00	0.00	0.00	0.00	0.00	2026-01-25 00:00:00	2026-04-20 08:47:58.354668	historical_estimate
4027	33	0.00	0.00	0.00	0.00	0.00	2026-01-26 00:00:00	2026-04-20 08:47:58.369749	historical_estimate
4028	33	0.00	0.00	0.00	0.00	0.00	2026-01-27 00:00:00	2026-04-20 08:47:58.384615	historical_estimate
4029	33	0.00	0.00	0.00	0.00	0.00	2026-01-28 00:00:00	2026-04-20 08:47:58.400271	historical_estimate
4030	33	0.00	0.00	0.00	0.00	0.00	2026-01-29 00:00:00	2026-04-20 08:47:58.413932	historical_estimate
4031	33	0.00	0.00	0.00	0.00	0.00	2026-01-30 00:00:00	2026-04-20 08:47:58.427946	historical_estimate
4032	33	0.00	0.00	0.00	0.00	0.00	2026-01-31 00:00:00	2026-04-20 08:47:58.442246	historical_estimate
4033	33	0.00	0.00	0.00	0.00	0.00	2026-02-01 00:00:00	2026-04-20 08:47:58.456586	historical_estimate
4034	33	0.00	0.00	0.00	0.00	0.00	2026-02-02 00:00:00	2026-04-20 08:47:58.471218	historical_estimate
4035	33	0.00	0.00	0.00	0.00	0.00	2026-02-03 00:00:00	2026-04-20 08:47:58.486586	historical_estimate
4036	33	0.00	0.00	0.00	0.00	0.00	2026-02-04 00:00:00	2026-04-20 08:47:58.502453	historical_estimate
4037	33	0.00	0.00	0.00	0.00	0.00	2026-02-05 00:00:00	2026-04-20 08:47:58.516402	historical_estimate
4038	33	0.00	0.00	0.00	0.00	0.00	2026-02-06 00:00:00	2026-04-20 08:47:58.530492	historical_estimate
4039	33	0.00	0.00	0.00	0.00	0.00	2026-02-07 00:00:00	2026-04-20 08:47:58.544462	historical_estimate
4040	33	0.00	0.00	0.00	0.00	0.00	2026-02-08 00:00:00	2026-04-20 08:47:58.55836	historical_estimate
4041	33	0.00	0.00	0.00	0.00	0.00	2026-02-09 00:00:00	2026-04-20 08:47:58.572233	historical_estimate
4042	33	0.00	0.00	0.00	0.00	0.00	2026-02-10 00:00:00	2026-04-20 08:47:58.586801	historical_estimate
4043	33	0.00	0.00	0.00	0.00	0.00	2026-02-11 00:00:00	2026-04-20 08:47:58.601246	historical_estimate
4044	33	0.00	0.00	0.00	0.00	0.00	2026-02-12 00:00:00	2026-04-20 08:47:58.615858	historical_estimate
4045	33	0.00	0.00	0.00	0.00	0.00	2026-02-13 00:00:00	2026-04-20 08:47:58.631505	historical_estimate
4046	33	0.00	0.00	0.00	0.00	0.00	2026-02-14 00:00:00	2026-04-20 08:47:58.645199	historical_estimate
4047	33	0.00	0.00	0.00	0.00	0.00	2026-02-15 00:00:00	2026-04-20 08:47:58.659579	historical_estimate
4048	33	0.00	0.00	0.00	0.00	0.00	2026-02-16 00:00:00	2026-04-20 08:47:58.673373	historical_estimate
4049	33	0.00	0.00	0.00	0.00	0.00	2026-02-17 00:00:00	2026-04-20 08:47:58.68752	historical_estimate
4050	33	0.00	0.00	0.00	0.00	0.00	2026-02-18 00:00:00	2026-04-20 08:47:58.701847	historical_estimate
4051	33	0.00	0.00	0.00	0.00	0.00	2026-02-19 00:00:00	2026-04-20 08:47:58.715927	historical_estimate
4052	33	0.00	0.00	0.00	0.00	0.00	2026-02-20 00:00:00	2026-04-20 08:47:58.729485	historical_estimate
4053	33	0.00	0.00	0.00	0.00	0.00	2026-02-21 00:00:00	2026-04-20 08:47:58.743932	historical_estimate
4054	33	0.00	0.00	0.00	0.00	0.00	2026-02-22 00:00:00	2026-04-20 08:47:58.75758	historical_estimate
4055	33	0.00	0.00	0.00	0.00	0.00	2026-02-23 00:00:00	2026-04-20 08:47:58.77091	historical_estimate
4056	33	0.00	0.00	0.00	0.00	0.00	2026-02-24 00:00:00	2026-04-20 08:47:58.784815	historical_estimate
4057	33	0.00	0.00	0.00	0.00	0.00	2026-02-25 00:00:00	2026-04-20 08:47:58.797391	historical_estimate
4058	33	0.00	0.00	0.00	0.00	0.00	2026-02-26 00:00:00	2026-04-20 08:47:58.81091	historical_estimate
4059	33	0.00	0.00	0.00	0.00	0.00	2026-02-27 00:00:00	2026-04-20 08:47:58.8251	historical_estimate
4060	33	0.00	0.00	0.00	0.00	0.00	2026-02-28 00:00:00	2026-04-20 08:47:58.838572	historical_estimate
4061	33	0.00	0.00	0.00	0.00	0.00	2026-03-01 00:00:00	2026-04-20 08:47:58.853579	historical_estimate
4062	33	0.00	0.00	0.00	0.00	0.00	2026-03-02 00:00:00	2026-04-20 08:47:58.867218	historical_estimate
4063	33	0.00	0.00	0.00	0.00	0.00	2026-03-03 00:00:00	2026-04-20 08:47:58.881915	historical_estimate
4064	33	0.00	0.00	0.00	0.00	0.00	2026-03-04 00:00:00	2026-04-20 08:47:58.895379	historical_estimate
4065	33	0.00	0.00	0.00	0.00	0.00	2026-03-05 00:00:00	2026-04-20 08:47:58.910087	historical_estimate
4066	33	0.00	0.00	0.00	0.00	0.00	2026-03-06 00:00:00	2026-04-20 08:47:58.924135	historical_estimate
4067	33	0.00	0.00	0.00	0.00	0.00	2026-03-07 00:00:00	2026-04-20 08:47:58.939243	historical_estimate
4068	33	0.00	0.00	0.00	0.00	0.00	2026-03-08 00:00:00	2026-04-20 08:47:58.953188	historical_estimate
4069	33	0.00	0.00	0.00	0.00	0.00	2026-03-09 00:00:00	2026-04-20 08:47:58.967305	historical_estimate
4070	33	0.00	0.00	0.00	0.00	0.00	2026-03-10 00:00:00	2026-04-20 08:47:58.979704	historical_estimate
4071	33	0.00	0.00	0.00	0.00	0.00	2026-03-11 00:00:00	2026-04-20 08:47:58.993368	historical_estimate
4072	33	0.00	0.00	0.00	0.00	0.00	2026-03-12 00:00:00	2026-04-20 08:47:59.007385	historical_estimate
4073	33	0.00	0.00	0.00	0.00	0.00	2026-03-13 00:00:00	2026-04-20 08:47:59.020916	historical_estimate
4074	33	0.00	0.00	0.00	0.00	0.00	2026-03-14 00:00:00	2026-04-20 08:47:59.034862	historical_estimate
4075	33	0.00	0.00	0.00	0.00	0.00	2026-03-15 00:00:00	2026-04-20 08:47:59.049319	historical_estimate
4076	33	0.00	0.00	0.00	0.00	0.00	2026-03-16 00:00:00	2026-04-20 08:47:59.06089	historical_estimate
4077	33	0.00	0.00	0.00	0.00	0.00	2026-03-17 00:00:00	2026-04-20 08:47:59.075043	historical_estimate
4078	33	0.00	0.00	0.00	0.00	0.00	2026-03-18 00:00:00	2026-04-20 08:47:59.087847	historical_estimate
4079	33	0.00	0.00	0.00	0.00	0.00	2026-03-19 00:00:00	2026-04-20 08:47:59.101539	historical_estimate
4080	33	0.00	0.00	0.00	0.00	0.00	2026-03-20 00:00:00	2026-04-20 08:47:59.113914	historical_estimate
4081	33	0.00	0.00	0.00	0.00	0.00	2026-03-21 00:00:00	2026-04-20 08:47:59.126739	historical_estimate
4082	33	0.00	0.00	0.00	0.00	0.00	2026-03-22 00:00:00	2026-04-20 08:47:59.139432	historical_estimate
4083	33	0.00	0.00	0.00	0.00	0.00	2026-03-23 00:00:00	2026-04-20 08:47:59.153123	historical_estimate
4084	33	0.00	0.00	0.00	0.00	0.00	2026-03-24 00:00:00	2026-04-20 08:47:59.166765	historical_estimate
4085	33	0.00	0.00	0.00	0.00	0.00	2026-03-25 00:00:00	2026-04-20 08:47:59.179687	historical_estimate
4086	33	0.00	0.00	0.00	0.00	0.00	2026-03-26 00:00:00	2026-04-20 08:47:59.194309	historical_estimate
4087	33	0.00	0.00	0.00	0.00	0.00	2026-03-27 00:00:00	2026-04-20 08:47:59.206889	historical_estimate
4088	33	0.00	0.00	0.00	0.00	0.00	2026-03-28 00:00:00	2026-04-20 08:47:59.220416	historical_estimate
4089	33	0.00	0.00	0.00	0.00	0.00	2026-03-29 00:00:00	2026-04-20 08:47:59.234597	historical_estimate
4090	33	0.00	0.00	0.00	0.00	0.00	2026-03-30 00:00:00	2026-04-20 08:47:59.248532	historical_estimate
4091	33	0.00	0.00	0.00	0.00	0.00	2026-03-31 00:00:00	2026-04-20 08:47:59.262628	historical_estimate
4092	33	0.00	0.00	0.00	0.00	0.00	2026-04-01 00:00:00	2026-04-20 08:47:59.275828	historical_estimate
4093	33	0.00	0.00	0.00	0.00	0.00	2026-04-02 00:00:00	2026-04-20 08:47:59.289315	historical_estimate
4094	33	0.00	0.00	0.00	0.00	0.00	2026-04-03 00:00:00	2026-04-20 08:47:59.302291	historical_estimate
4095	33	0.00	0.00	0.00	0.00	0.00	2026-04-04 00:00:00	2026-04-20 08:47:59.315633	historical_estimate
4096	33	0.00	0.00	0.00	0.00	0.00	2026-04-05 00:00:00	2026-04-20 08:47:59.329392	historical_estimate
4097	33	0.00	0.00	0.00	0.00	0.00	2026-04-06 00:00:00	2026-04-20 08:47:59.34126	historical_estimate
4098	33	0.00	0.00	0.00	0.00	0.00	2026-04-07 00:00:00	2026-04-20 08:47:59.354599	historical_estimate
4099	33	0.00	0.00	0.00	0.00	0.00	2026-04-08 00:00:00	2026-04-20 08:47:59.367734	historical_estimate
4100	33	0.00	0.00	0.00	0.00	0.00	2026-04-09 00:00:00	2026-04-20 08:47:59.382394	historical_estimate
4101	33	0.00	0.00	0.00	0.00	0.00	2026-04-10 00:00:00	2026-04-20 08:47:59.395371	historical_estimate
4102	33	0.00	0.00	0.00	0.00	0.00	2026-04-11 00:00:00	2026-04-20 08:47:59.408822	historical_estimate
4103	33	0.00	0.00	0.00	0.00	0.00	2026-04-12 00:00:00	2026-04-20 08:47:59.421605	historical_estimate
4104	33	0.00	0.00	0.00	0.00	0.00	2026-04-13 00:00:00	2026-04-20 08:47:59.435561	historical_estimate
4105	33	0.00	0.00	0.00	0.00	0.00	2026-04-14 00:00:00	2026-04-20 08:47:59.447902	historical_estimate
4106	33	0.00	0.00	0.00	0.00	0.00	2026-04-15 00:00:00	2026-04-20 08:47:59.461281	historical_estimate
4107	33	0.00	0.00	0.00	0.00	0.00	2026-04-16 00:00:00	2026-04-20 08:47:59.474145	historical_estimate
4108	33	0.00	0.00	0.00	0.00	0.00	2026-04-17 00:00:00	2026-04-20 08:47:59.487733	historical_estimate
4109	33	0.00	0.00	0.00	0.00	0.00	2026-04-18 00:00:00	2026-04-20 08:47:59.501144	historical_estimate
4110	33	0.00	0.00	0.00	0.00	0.00	2026-04-19 00:00:00	2026-04-20 08:47:59.514878	historical_estimate
4111	33	0.00	0.00	0.00	0.00	0.00	2026-04-20 00:00:00	2026-04-20 08:47:59.526425	actual
4113	29	0.00	0.00	0.00	0.00	0.00	2026-04-21 00:00:00	2026-04-21 09:27:19.40596	actual
4114	30	0.00	0.00	0.00	0.00	0.00	2026-04-21 00:00:00	2026-04-21 09:27:19.42646	actual
4115	31	0.00	0.00	0.00	0.00	0.00	2026-04-21 00:00:00	2026-04-21 09:27:19.446656	actual
4116	32	0.00	0.00	0.00	0.00	0.00	2026-04-21 00:00:00	2026-04-21 09:27:19.466544	actual
4117	33	0.00	0.00	0.00	0.00	0.00	2026-04-21 00:00:00	2026-04-21 09:27:19.487377	actual
4123	29	0.00	0.00	0.00	0.00	0.00	2026-04-22 00:00:00	2026-04-22 01:58:45.5705	actual
4124	30	0.00	0.00	0.00	0.00	0.00	2026-04-22 00:00:00	2026-04-22 01:58:45.590565	actual
4125	31	0.00	0.00	0.00	0.00	0.00	2026-04-22 00:00:00	2026-04-22 01:58:45.610791	actual
4126	32	0.00	0.00	0.00	0.00	0.00	2026-04-22 00:00:00	2026-04-22 01:58:45.630396	actual
4127	33	0.00	0.00	0.00	0.00	0.00	2026-04-22 00:00:00	2026-04-22 01:58:45.648523	actual
4129	1	4417231.34	9625.32	2300.00	1999767.71	2405538.31	2026-04-23 00:00:00	2026-04-24 12:05:20.629734	historical_estimate
4131	29	0.00	0.00	0.00	0.00	0.00	2026-04-23 00:00:00	2026-04-24 12:05:20.693345	historical_estimate
4132	29	0.00	0.00	0.00	0.00	0.00	2026-04-24 00:00:00	2026-04-24 12:05:20.708712	actual
4133	30	0.00	0.00	0.00	0.00	0.00	2026-04-23 00:00:00	2026-04-24 12:05:20.727839	historical_estimate
4134	30	0.00	0.00	0.00	0.00	0.00	2026-04-24 00:00:00	2026-04-24 12:05:20.742585	actual
4135	31	0.00	0.00	0.00	0.00	0.00	2026-04-23 00:00:00	2026-04-24 12:05:20.764114	historical_estimate
4136	31	0.00	0.00	0.00	0.00	0.00	2026-04-24 00:00:00	2026-04-24 12:05:20.775724	actual
4137	32	0.00	0.00	0.00	0.00	0.00	2026-04-23 00:00:00	2026-04-24 12:05:20.7973	historical_estimate
4138	32	0.00	0.00	0.00	0.00	0.00	2026-04-24 00:00:00	2026-04-24 12:05:20.811281	actual
4139	33	0.00	0.00	0.00	0.00	0.00	2026-04-23 00:00:00	2026-04-24 12:05:20.83432	historical_estimate
4140	33	0.00	0.00	0.00	0.00	0.00	2026-04-24 00:00:00	2026-04-24 12:05:20.849581	actual
4143	29	0.00	0.00	0.00	0.00	0.00	2026-04-25 00:00:00	2026-04-25 10:13:58.285439	actual
4144	30	0.00	0.00	0.00	0.00	0.00	2026-04-25 00:00:00	2026-04-25 10:13:58.3051	actual
4145	31	0.00	0.00	0.00	0.00	0.00	2026-04-25 00:00:00	2026-04-25 10:13:58.325663	actual
4146	32	0.00	0.00	0.00	0.00	0.00	2026-04-25 00:00:00	2026-04-25 10:13:58.345673	actual
4147	33	0.00	0.00	0.00	0.00	0.00	2026-04-25 00:00:00	2026-04-25 10:13:58.365366	actual
4150	1	4414776.96	9689.84	2300.00	1994110.70	2408676.42	2026-04-26 00:00:00	2026-04-26 01:51:04.272541	actual
4151	29	0.00	0.00	0.00	0.00	0.00	2026-04-26 00:00:00	2026-04-26 01:51:04.298954	actual
4152	30	0.00	0.00	0.00	0.00	0.00	2026-04-26 00:00:00	2026-04-26 01:51:04.31968	actual
4153	31	0.00	0.00	0.00	0.00	0.00	2026-04-26 00:00:00	2026-04-26 01:51:04.338382	actual
4154	32	0.00	0.00	0.00	0.00	0.00	2026-04-26 00:00:00	2026-04-26 01:51:04.357932	actual
4155	33	0.00	0.00	0.00	0.00	0.00	2026-04-26 00:00:00	2026-04-26 01:51:04.379196	actual
4156	1	4415800.83	9665.88	2300.00	1994110.70	2409724.25	2026-04-27 00:00:00	2026-04-28 08:14:44.997342	historical_estimate
4157	1	4416849.56	9665.88	2300.00	1994110.70	2410772.98	2026-04-28 00:00:00	2026-04-28 08:14:45.032633	actual
4158	29	0.00	0.00	0.00	0.00	0.00	2026-04-27 00:00:00	2026-04-28 08:14:45.057054	historical_estimate
4159	29	0.00	0.00	0.00	0.00	0.00	2026-04-28 00:00:00	2026-04-28 08:14:45.070994	actual
4160	30	0.00	0.00	0.00	0.00	0.00	2026-04-27 00:00:00	2026-04-28 08:14:45.094527	historical_estimate
4161	30	0.00	0.00	0.00	0.00	0.00	2026-04-28 00:00:00	2026-04-28 08:14:45.107331	actual
4162	31	0.00	0.00	0.00	0.00	0.00	2026-04-27 00:00:00	2026-04-28 08:14:45.128989	historical_estimate
4163	31	0.00	0.00	0.00	0.00	0.00	2026-04-28 00:00:00	2026-04-28 08:14:45.14224	actual
4164	32	0.00	0.00	0.00	0.00	0.00	2026-04-27 00:00:00	2026-04-28 08:14:45.166302	historical_estimate
4165	32	0.00	0.00	0.00	0.00	0.00	2026-04-28 00:00:00	2026-04-28 08:14:45.180093	actual
4166	33	0.00	0.00	0.00	0.00	0.00	2026-04-27 00:00:00	2026-04-28 08:14:45.201783	historical_estimate
4167	33	0.00	0.00	0.00	0.00	0.00	2026-04-28 00:00:00	2026-04-28 08:14:45.214151	actual
4168	1	4430717.99	9557.72	2300.00	2007037.65	2411822.61	2026-04-29 00:00:00	2026-04-29 09:35:46.232424	actual
4169	29	0.00	0.00	0.00	0.00	0.00	2026-04-29 00:00:00	2026-04-29 09:35:46.259045	actual
4170	30	0.00	0.00	0.00	0.00	0.00	2026-04-29 00:00:00	2026-04-29 09:35:46.281606	actual
4171	31	0.00	0.00	0.00	0.00	0.00	2026-04-29 00:00:00	2026-04-29 09:35:46.304101	actual
4172	32	0.00	0.00	0.00	0.00	0.00	2026-04-29 00:00:00	2026-04-29 09:35:46.325593	actual
4173	33	0.00	0.00	0.00	0.00	0.00	2026-04-29 00:00:00	2026-04-29 09:35:46.34667	actual
1804	1	759903536.59	755542677.36	2300.00	1966526.74	2392032.49	2026-04-09 23:58:58.278	2026-04-09 23:58:58.313115	actual
1917	1	4369933.30	9074.07	2300.00	1966526.74	2392032.49	2026-04-10 06:45:09.785	2026-04-10 06:45:09.818095	actual
1925	1	4370948.86	9056.03	2300.00	1966526.74	2393066.09	2026-04-11 00:00:00	2026-04-11 01:53:06.263104	actual
4128	1	4416187.09	9625.32	2300.00	1999767.71	2404494.06	2026-04-22 01:59:32.973	2026-04-22 01:59:33.08599	actual
4141	1	4415218.86	9737.85	2300.00	1996552.31	2406628.70	2026-04-24 12:05:43.255	2026-04-24 12:05:43.309282	actual
1940	1	4379799.62	9127.87	2300.00	1974271.19	2394100.56	2026-04-12 00:00:00	2026-04-13 01:50:15.904814	historical_estimate
1956	1	4380833.25	9058.47	2300.00	1974271.19	2395203.59	2026-04-13 13:26:41.509	2026-04-13 13:26:41.576689	actual
2045	1	4372530.25	9654.78	2300.00	1964403.31	2396172.16	2026-04-14 02:49:12.979	2026-04-14 02:49:13.086949	actual
2164	1	4397131.45	9535.64	2300.00	1988018.72	2397277.09	2026-04-15 13:26:01.053	2026-04-15 13:26:01.125707	actual
2172	1	4398106.09	9540.07	2300.00	1988018.72	2398247.30	2026-04-16 00:00:00	2026-04-16 06:47:30.032597	actual
4149	1	4413775.34	9689.84	2300.00	1994110.70	2407674.80	2026-04-25 10:16:03.625	2026-04-25 10:16:03.659341	actual
4121	1	4412754.48	9622.82	2300.00	1997380.95	2403450.71	2026-04-21 09:30:02.562	2026-04-21 09:30:02.608988	actual
2468	1	4412640.70	9618.00	2300.00	2001391.65	2399331.06	2026-04-17 10:47:57.964	2026-04-17 10:47:58.026242	actual
2493	1	4415323.67	10036.62	2300.00	2002661.05	2400326.00	2026-04-18 00:00:00	2026-04-20 01:48:21.513587	historical_estimate
2494	1	4416364.35	10036.62	2300.00	2002661.05	2401366.68	2026-04-19 00:00:00	2026-04-20 01:48:21.545255	historical_estimate
2544	1	4416748.64	9379.34	2300.00	2002661.05	2402408.24	2026-04-20 05:25:44.808	2026-04-20 05:25:44.959562	actual
\.


--
-- Data for Name: portfolios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portfolios (id, user_id, total_value, crypto_value, stablecoin_value, fiat_value, investment_value, monthly_pnl, monthly_pnl_percent, updated_at) FROM stdin;
1	1	51300.00	8600.00	2300.00	39000.00	12300.00	382.50	0.75	2026-04-07 13:56:45.238947
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, user_id, type, from_currency, to_currency, amount, fee, exchange_rate, status, description, created_at, source_exchange, blockchain_tx_hash, settlement_status, asset_type, direction, risk_flag, review_status, review_notes, reference_id, counterparty_user_id, purpose_of_transfer, beneficiary_name, beneficiary_address) FROM stdin;
1	1	investment	USD	\N	500000.00000000	0.00000000	\N	completed	Investment in Bitcoin Tracker Fund	2025-08-01 14:03:56.74495	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
2	1	investment	USD	\N	25000.00000000	0.00000000	\N	completed	Investment in Bitcoin Tracker Fund	2025-08-03 14:40:00.597074	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
3	1	investment	USD	\N	25000.00000000	0.00000000	\N	completed	Investment in Corporate Credit Fund	2025-08-03 14:40:14.72998	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
4	1	exchange	USD	EUR	100.00000000	0.46000000	0.91230000	completed	USD to EUR Exchange	2026-04-02 02:50:49.167766	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
5	1	exchange	USD	EUR	50.00000000	0.23000000	0.91230000	completed	USD to EUR Exchange	2026-04-02 03:02:29.725463	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
6	1	exchange	USD	AUD	999.00000000	7.26862630	1.45518044	completed	USD to AUD Exchange	2026-04-07 07:25:19.945831	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
7	1	exchange	USD	KRW	100.00000000	758.32500000	1516.65000000	completed	USD to KRW Exchange	2026-04-07 07:34:27.616382	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
8	1	exchange	AUD	JPY	1000.00000000	548.40000000	109.68000000	completed	AUD to JPY Exchange	2026-04-07 09:53:40.975314	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
9	1	exchange	USD	SGD	10000.00000000	64.35500000	1.28710000	completed	USD to SGD Exchange	2026-04-07 10:19:39.760725	\N	\N	internal_only	\N	\N	f	clear	\N	\N	\N	\N	\N	\N
10	1	exchange	USD	AUD	1000.00000000	7.27590220	1.45518044	completed	USD to AUD Exchange	2026-04-07 14:30:59.639286	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
11	1	exchange	AUD	BTC	500.00000000	0.00002523	0.00001009	completed	AUD to BTC Exchange	2026-04-07 14:38:04.442292	\N	\N	internal_only	cross	exchange	f	clear	\N	\N	\N	\N	\N	\N
12	1	exchange	AUD	BTC	500.00000000	0.00002423	0.00000969	completed	AUD to BTC Exchange	2026-04-08 01:58:22.385926	\N	\N	internal_only	cross	exchange	f	clear	\N	\N	\N	\N	\N	\N
13	1	exchange	BTC	AUD	0.00001000	0.00515774	103154.70302384	completed	BTC to AUD Exchange	2026-04-08 01:58:42.034936	\N	\N	internal_only	cross	exchange	f	clear	\N	\N	\N	\N	\N	\N
14	1	exchange	USD	CNY	100.00000000	3.42870000	6.85740000	completed	USD to CNY Exchange	2026-04-08 02:21:52.624061	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
15	1	exchange	USD	KRW	100.00000000	748.70500000	1497.41000000	completed	USD to KRW Exchange	2026-04-08 02:22:07.142937	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
16	1	exchange	USD	KRW	100.00000000	748.70500000	1497.41000000	completed	USD to KRW Exchange	2026-04-08 02:22:31.886296	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
17	1	exchange	USD	NZD	100.00000000	0.87685000	1.75370000	completed	USD to NZD Exchange	2026-04-08 02:23:00.283322	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
18	1	exchange	USD	HKD	100.00000000	3.91815000	7.83630000	completed	USD to HKD Exchange	2026-04-08 02:23:32.195023	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
19	1	exchange	AUD	CNY	100.00000000	2.37775000	4.75550000	completed	AUD to CNY Exchange	2026-04-08 02:50:24.852784	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
20	1	exchange	USD	CNY	100.00000000	3.42870000	6.85740000	completed	USD to CNY Exchange	2026-04-08 02:50:48.51583	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
21	1	withdrawal	AUD	\N	100.00000000	35.00000000	\N	completed	AUD Withdrawal	2026-04-08 03:12:06.017526	\N	\N	internal_only	fiat	out	f	clear	\N	\N	\N	\N	\N	\N
22	1	deposit	\N	AUD	999995.00000000	0.00000000	\N	completed	AUD Deposit	2026-04-08 03:24:05.977357	\N	\N	internal_only	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
23	1	deposit	\N	AUD	500.00000000	0.00000000	\N	completed	AUD Deposit	2026-04-08 03:25:27.951749	\N	\N	internal_only	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
24	1	exchange	AUD	USD	1000.00000000	3.46745000	0.69349000	completed	AUD to USD Exchange	2026-04-08 03:26:50.929308	\N	\N	internal_only	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
25	1	deposit	\N	CAD	123456.00000000	0.00000000	\N	completed	CAD Deposit	2026-04-08 03:27:44.547378	\N	\N	internal_only	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
26	1	withdrawal	CAD	\N	324.00000000	30.00000000	\N	completed	CAD Withdrawal	2026-04-08 03:28:08.198082	\N	\N	internal_only	fiat	out	f	clear	\N	\N	\N	\N	\N	\N
27	1	deposit	\N	ETH	345657.00000000	0.00000000	\N	completed	ETH Deposit	2026-04-08 03:35:17.610996	\N	\N	internal_only	cross	in	f	clear	\N	\N	\N	\N	\N	\N
28	1	exchange	ETH	AUD	500.00000000	8057.38006315	3222.95202526	completed	ETH to AUD Exchange	2026-04-08 03:46:45.928852	\N	\N	internal_only	cross	exchange	f	clear	\N	\N	\N	\N	\N	\N
29	1	deposit	\N	AUD	123.00000000	0.00000000	\N	completed	AUD Deposit	2026-04-08 05:58:44.793327	\N	\N	internal_only	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
30	1	withdrawal	AUD	\N	3456.00000000	35.00000000	\N	completed	AUD Withdrawal	2026-04-08 05:59:15.91376	\N	\N	internal_only	fiat	out	f	clear	\N	\N	\N	\N	\N	\N
31	1	exchange	AUD	BTC	500.00000000	0.00002420	0.00000968	completed	AUD to BTC Exchange	2026-04-08 06:16:03.816688	\N	\N	internal_only	cross	exchange	f	clear	\N	\N	\N	\N	\N	\N
32	1	deposit	\N	SGD	43567.00000000	0.00000000	\N	completed	SGD Deposit	2026-04-08 07:17:01.877479	\N	\N	internal_only	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
33	1	withdrawal	SGD	\N	3425.00000000	30.00000000	\N	completed	SGD Withdrawal	2026-04-08 07:17:35.153324	\N	\N	internal_only	fiat	out	f	clear	\N	\N	\N	\N	\N	\N
34	1	withdrawal	AUD	\N	4353.00000000	35.00000000	\N	completed	AUD Withdrawal	2026-04-08 07:46:58.614373	\N	\N	internal_only	fiat	out	f	clear	\N	\N	\N	\N	\N	\N
35	1	deposit	\N	AUD	4356.00000000	0.00000000	\N	completed	AUD Deposit	2026-04-08 07:47:20.776782	\N	\N	internal_only	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
36	1	deposit	\N	AUD	76890.00000000	0.00000000	\N	pending	AUD PayID Deposit	2026-04-08 09:15:39.762006	payid	\N	awaiting_bank_confirmation	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
37	1	deposit	\N	CNY	112.00000000	0.00000000	\N	pending	CNY Bank Transfer Deposit	2026-04-08 09:16:08.733709	bank_transfer	\N	awaiting_bank_confirmation	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
38	1	withdrawal	AUD	\N	12340.00000000	35.00000000	\N	completed	AUD Withdrawal	2026-04-08 09:16:31.657046	\N	\N	internal_only	fiat	out	f	clear	\N	\N	\N	\N	\N	\N
39	1	deposit	\N	CNY	4347.00000000	0.00000000	\N	pending	CNY Bank Transfer Deposit	2026-04-08 09:18:52.383306	bank_transfer	\N	awaiting_bank_confirmation	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
40	1	deposit	\N	GBP	3425.00000000	0.00000000	\N	pending	GBP PayID Deposit	2026-04-08 09:21:23.802121	payid	\N	awaiting_bank_confirmation	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
41	1	withdrawal	AUD	\N	2334.00000000	35.00000000	\N	pending	{"method":"payid","referenceCode":"AMAX-W25A1E404","payid":"23333","accountName":"DFDS"}	2026-04-08 10:26:31.256626	\N	\N	awaiting_payout	fiat	out	f	clear	\N	\N	\N	\N	\N	\N
42	1	exchange	AUD	BTC	500.00000000	0.00002473	0.00000989	completed	AUD to BTC Exchange	2026-04-09 09:23:59.632817	\N	\N	internal_only	cross	exchange	f	clear	\N	\N	\N	\N	\N	\N
43	1	exchange	AUD	USD	1000.00000000	3.52825000	0.70565000	pending	AUD to USD Exchange	2026-04-09 13:20:42.116147	\N	\N	awaiting_airwallex	fiat	exchange	f	clear	\N	\N	\N	\N	\N	\N
44	1	deposit	\N	AUD	199.00000000	0.00000000	\N	pending	{"method":"payid","currency":"AUD","referenceCode":"AMAX-8E9DFC84","label":"AUD PayID Deposit","payer":{"name":null,"bsb":null,"accountNumber":null,"payId":null}}	2026-04-10 00:43:34.182558	payid	\N	awaiting_bank_confirmation	fiat	in	f	clear	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: user_investments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_investments (id, user_id, product_id, invested_amount, current_value, total_return, return_percent, status, investment_date, maturity_date, updated_at) FROM stdin;
28	1	4	750000.00	832440.00	82440.00	10.99	active	2024-08-01 15:37:02	2029-07-31 15:37:02	2025-08-02 09:59:50.413501
38	1	2	25000.00	25000.00	0.00	0.00	active	2025-08-02 17:18:14	\N	2025-08-02 17:19:46.093264
39	1	3	25000.00	25000.00	0.00	0.00	active	2025-08-02 17:32:29	\N	2025-08-02 17:35:29.49176
40	1	3	25000.00	25000.00	0.00	0.00	active	2025-08-03 12:54:57.71574	\N	2025-08-03 12:54:57.71574
42	1	1	50000.00	50000.00	0.00	0.00	active	2025-08-03 13:07:35.192464	\N	2025-08-03 13:07:35.192464
43	1	2	25000.00	25000.00	0.00	0.00	active	2025-08-03 13:31:42.6785	\N	2025-08-03 13:31:42.6785
44	1	2	25000.00	25000.00	0.00	0.00	active	2025-08-03 14:40:00.637419	\N	2025-08-03 14:40:00.637419
45	1	3	25000.00	25000.00	0.00	0.00	active	2025-08-03 14:40:14.759907	\N	2025-08-03 14:40:14.759907
37	1	2	25000.00	25000.00	0.00	0.00	active	2025-08-02 09:45:46	\N	2025-08-02 09:53:55.078925
26	1	1	500000.00	517588.48	17588.48	3.62	active	2025-04-03 15:37:02	2026-01-28 15:37:02	2025-08-02 09:56:00.660063
27	1	3	300000.00	307902.50	7902.50	2.71	active	2025-05-03 15:37:02	2027-04-23 15:37:02	2025-08-02 09:56:01.057027
29	1	2	150000.00	160757.09	10757.09	7.40	active	2025-02-02 15:37:02	\N	2025-08-02 09:59:49.383008
30	1	5	75000.00	75703.56	703.56	0.95	active	2025-06-02 15:37:02	\N	2025-08-02 09:59:51.494144
36	1	2	50000.00	50019.14	19.14	0.04	active	2025-08-01 15:31:58	\N	2025-08-02 09:59:52.59196
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, email, password, first_name, last_name, kyc_status, user_tier, created_at, full_legal_name, date_of_birth, nationality, phone_number, pep_declaration, sanctions_declaration, consent_declaration, kyc_profile_complete, account_frozen, risk_score, risk_level, daily_transaction_limit, kyc_refresh_due, residential_address, suburb, state_region, postcode, address_country, occupation, employment_status, purpose_of_account, source_of_funds, tax_country, id_document_type, id_verification_complete, agreement_signed, agreement_signed_at, agreement_ref, agreement_version, agreement_signature, email_verified, email_verification_token, email_verification_token_expiry, id_docs_submitted, address_doc_filename, address_doc_approved, email_otp, google_id) FROM stdin;
29	graceannxy	graceannxy@gmail.com	\N	grace	ann	pending	standard	2026-04-20 07:46:41.763194	\N	\N	\N	+61401699386	f	f	f	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	t	\N	\N	f	\N	f	\N	\N
30	katrinashaw1418	katrinashaw1418@gmail.com	\N	Katrina	Shaw	pending	standard	2026-04-20 07:47:42.137695	\N	\N	\N	\N	f	f	f	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	t	\N	\N	f	\N	f	\N	114115920250108040176
31	darlingox3	darlingox3@gmail.com	\N	Darling	OX	pending	standard	2026-04-20 07:48:16.712778	\N	\N	\N	\N	f	f	f	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	t	\N	\N	f	\N	f	\N	115663552465543500614
1	GeorgeLancaster	demo@amaxglobal.com.au	$2b$12$JviVJkp/pEvzeYciakRwi.c3PO6f88G3LDYpnSKrJglGgXWjDg4xW	George	Lancaster	verified	premium	2025-08-01 14:03:01.639238	George Lancaster	1988-04-09	Australia	0412345678	f	f	f	t	f	4	low	50000.00	2027-04-13 12:00:35.003	LEVEL 2, KINGS COURT	SYDNEY		2216	Australia	banker	employed	personal_transfers	employment	Australia	passport	f	t	2026-04-09 04:53:36.21	AMXAGR-DDCA1AF4	v2.0	OY X	t	\N	\N	f	\N	f	\N	\N
32	oyx8888	oyx8888@gmail.com	\N	OY	X	pending	standard	2026-04-20 07:49:21.012841	\N	\N	\N	\N	f	f	f	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	t	\N	\N	f	\N	f	\N	110119344751101303191
33	prosperityxy	prosperityxy@hotmail.com	\N	x	y	pending	standard	2026-04-20 08:05:27.637866	\N	\N	\N	+61416803889	f	f	f	f	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	t	\N	\N	f	\N	f	\N	\N
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallets (id, user_id, currency, balance, available_balance, wallet_type, updated_at) FROM stdin;
2822	33	AUD	0.00000000	0.00000000	fiat	2026-04-20 08:05:27.672618
11	1	EUR	2800.00000000	2800.00000000	fiat	2025-08-01 14:03:05.379368
12	1	GBP	2400.00000000	2400.00000000	fiat	2025-08-01 14:03:05.379368
20	1	JPY	380000.00000000	380000.00000000	fiat	2026-04-07 09:53:40.96942
19	1	KRW	4797984.59000000	4797984.59000000	fiat	2026-04-07 07:34:10.416544
23	1	NZD	174.49315000	174.49315000	fiat	2026-04-08 02:23:00.278462
21	1	HKD	779.71185000	779.71185000	fiat	2026-04-08 01:56:37.616494
22	1	CNY	1837.79485000	1837.79485000	fiat	2026-04-08 02:21:52.618762
9	1	USD	2590.02255000	2590.02255000	fiat	2025-08-01 14:03:05.379368
10	1	CAD	127302.00000000	127302.00000000	fiat	2025-08-01 14:03:05.379368
2758	29	AUD	0.00000000	0.00000000	fiat	2026-04-20 07:46:41.80018
17	1	SGD	44712.00000000	44712.00000000	fiat	2026-04-07 07:24:40.5424
2759	30	AUD	0.00000000	0.00000000	fiat	2026-04-20 07:47:42.14249
2760	31	AUD	0.00000000	0.00000000	fiat	2026-04-20 07:48:16.719796
2761	32	AUD	0.00000000	0.00000000	fiat	2026-04-20 07:49:21.018596
13	1	BTC	0.05000000	0.05000000	crypto	2025-08-01 14:03:05.379368
14	1	ETH	2.50000000	2.50000000	crypto	2025-08-01 14:03:05.379368
15	1	USDT	1500.00000000	1500.00000000	crypto	2025-08-01 14:03:05.379368
16	1	USDC	800.00000000	800.00000000	crypto	2025-08-01 14:03:05.379368
18	1	AUD	2590552.56349395	2588183.56349395	fiat	2026-04-07 07:25:19.912702
\.


--
-- Name: advisor_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.advisor_messages_id_seq', 1, false);


--
-- Name: ai_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ai_recommendations_id_seq', 13, true);


--
-- Name: aml_flags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.aml_flags_id_seq', 6, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 543, true);


--
-- Name: compliance_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.compliance_actions_id_seq', 18, true);


--
-- Name: fx_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fx_rates_id_seq', 52, true);


--
-- Name: idempotency_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.idempotency_keys_id_seq', 1, false);


--
-- Name: investment_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.investment_products_id_seq', 1, false);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: portfolio_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.portfolio_snapshots_id_seq', 4173, true);


--
-- Name: portfolios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.portfolios_id_seq', 1, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 44, true);


--
-- Name: user_investments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_investments_id_seq', 45, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 33, true);


--
-- Name: wallets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wallets_id_seq', 3002, true);


--
-- Name: advisor_messages advisor_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advisor_messages
    ADD CONSTRAINT advisor_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);


--
-- Name: aml_flags aml_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aml_flags
    ADD CONSTRAINT aml_flags_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: compliance_actions compliance_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_actions
    ADD CONSTRAINT compliance_actions_pkey PRIMARY KEY (id);


--
-- Name: fx_rates fx_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_rates
    ADD CONSTRAINT fx_rates_pkey PRIMARY KEY (id);


--
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (id);


--
-- Name: investment_products investment_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investment_products
    ADD CONSTRAINT investment_products_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: portfolio_snapshots portfolio_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_snapshots
    ADD CONSTRAINT portfolio_snapshots_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_investments user_investments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_investments
    ADD CONSTRAINT user_investments_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_google_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_unique UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: idempotency_user_route_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idempotency_user_route_key_idx ON public.idempotency_keys USING btree (user_id, route, key);


--
-- Name: unique_wallet_user_currency; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_wallet_user_currency ON public.wallets USING btree (user_id, currency);


--
-- Name: users_phone_number_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_phone_number_unique ON public.users USING btree (phone_number) WHERE (phone_number IS NOT NULL);


--
-- Name: wallets_user_currency_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX wallets_user_currency_uidx ON public.wallets USING btree (user_id, currency);


--
-- Name: advisor_messages advisor_messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.advisor_messages
    ADD CONSTRAINT advisor_messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: ai_recommendations ai_recommendations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: aml_flags aml_flags_transaction_id_transactions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aml_flags
    ADD CONSTRAINT aml_flags_transaction_id_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


--
-- Name: aml_flags aml_flags_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aml_flags
    ADD CONSTRAINT aml_flags_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: compliance_actions compliance_actions_transaction_id_transactions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_actions
    ADD CONSTRAINT compliance_actions_transaction_id_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);


--
-- Name: compliance_actions compliance_actions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_actions
    ADD CONSTRAINT compliance_actions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: idempotency_keys idempotency_keys_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: portfolio_snapshots portfolio_snapshots_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_snapshots
    ADD CONSTRAINT portfolio_snapshots_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: portfolios portfolios_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_counterparty_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_counterparty_user_id_users_id_fk FOREIGN KEY (counterparty_user_id) REFERENCES public.users(id);


--
-- Name: transactions transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_investments user_investments_product_id_investment_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_investments
    ADD CONSTRAINT user_investments_product_id_investment_products_id_fk FOREIGN KEY (product_id) REFERENCES public.investment_products(id);


--
-- Name: user_investments user_investments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_investments
    ADD CONSTRAINT user_investments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wallets wallets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 4ETc8VnWLOvpwOOLAe54Sz6D7i1IMIPr48GfVhYF4zhcxOYeTQApgSDxX3unF7q

