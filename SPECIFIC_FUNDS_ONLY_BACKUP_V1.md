# Specific Investment Funds Backup - Version 1

## Target Investment Products for Debugging

This backup preserves ONLY the specific investment funds you mentioned for focused debugging.

### Real Estate Funds

#### 1. Real Estate Equity Fund
```typescript
{
  id: 1,
  name: "Real Estate Equity Fund",
  category: "real_estate",
  subCategory: "equity_fund",
  investmentStrategy: "Structured equity and mezzanine capital deployed into residential and mixed-use development projects, primarily through preferred equity or subordinated positions. Focus on downside protection (typ. 60–70% LVR), co-investment alignment with developers, and disciplined feasibility validation.",
  targetNetIrr: "9.8–11.0%",
  term: "2–6.5 years",
  structure: "Preferred equity / subordinated debt",
  distributions: "Capitalising, quarterly, or monthly",
  liquidity: "Fixed-term, no early redemptions",
  minimumInvestment: "250000.00",
  riskProfile: "high",
  returnType: "capital_gains",
  isActive: true
}
```

#### 2. Real Estate Credit Fund
```typescript
{
  id: 2,
  name: "Real Estate Credit Fund",
  category: "real_estate",
  subCategory: "credit_fund",
  investmentStrategy: "Diversified exposure to senior and subordinated real estate-backed loans for land subdivisions and construction financing. Provides regular income and controlled exposure across multiple projects and geographies.",
  targetNetIrr: "~11%",
  term: "~10.2 months (rolling)",
  structure: "Real estate-backed loans",
  distributions: "Quarterly",
  liquidity: "Quarterly redemptions (5% NAV cap)",
  minimumInvestment: "100000.00",
  riskProfile: "moderate",
  returnType: "income",
  isActive: true
}
```

#### 3. Real Estate First Mortgage Fund
```typescript
{
  id: 3,
  name: "Real Estate First Mortgage Fund",
  category: "real_estate",
  subCategory: "first_mortgage",
  investmentStrategy: "First-ranking mortgage finance to conservative, well-prepared property projects with tight controls, strong fundamentals, and regular servicing income.",
  targetNetIrr: "~9%",
  term: "~9.4 months",
  structure: "First-ranking mortgage",
  distributions: "Quarterly",
  liquidity: "Quarterly redemption",
  minimumInvestment: "50000.00",
  riskProfile: "moderate",
  returnType: "income",
  isActive: true
}
```

### Corporate Credit Funds

#### 4. Cash Flow-Based Corporate Credit Fund
```typescript
{
  id: 4,
  name: "Cash Flow-Based Corporate Credit Fund",
  category: "corporate_credit",
  subCategory: "cash_flow_credit",
  investmentStrategy: "Secured senior lending to companies with strong recurring revenue and positive EBITDA. Terms are tailored to enterprise value and cash flow serviceability, not fixed asset security.",
  targetNetIrr: "10–12%",
  term: "2–3 years",
  structure: "First lien amortising loan",
  distributions: "Monthly or quarterly",
  liquidity: "Locked term",
  minimumInvestment: "100000.00",
  riskProfile: "moderate",
  returnType: "income",
  isActive: true
}
```

#### 5. Security-Backed Corporate Credit Fund
```typescript
{
  id: 5,
  name: "Security-Backed Corporate Credit Fund",
  category: "corporate_credit",
  subCategory: "security_backed_credit",
  investmentStrategy: "Senior secured loans combined with equity warrants and downside protection via put rights. Structured for both income and potential capital appreciation.",
  targetNetIrr: "12–15%",
  term: "30–39 months",
  structure: "Senior lien loan + warrant",
  distributions: "Fixed yield + equity realisation",
  liquidity: "Locked term",
  minimumInvestment: "150000.00",
  riskProfile: "moderate",
  returnType: "blended",
  isActive: true
}
```

### Venture Capital Funds

#### 6. VC / Growth Equity Fund
```typescript
{
  id: 6,
  name: "VC / Growth Equity Fund",
  category: "venture_capital",
  subCategory: "growth_equity",
  investmentStrategy: "Equity investments into founder-led and management-aligned private companies with growth potential. Structured for long-term capital gains with governance protections and value creation support.",
  targetNetIrr: "16–20%",
  grossIrr: "22–25%",
  moic: "3–4x",
  term: "5–7+ years",
  structure: "Equity investment",
  distributions: "Capital gain at exit",
  liquidity: "Illiquid / long-term lock-in",
  minimumInvestment: "500000.00",
  riskProfile: "high",
  returnType: "capital_gains",
  isActive: true
}
```

#### 7. Hybrid Capital Fund
```typescript
{
  id: 7,
  name: "Hybrid Capital Fund",
  category: "venture_capital",
  subCategory: "hybrid_capital",
  investmentStrategy: "Structured equity capital with partial cash or PIK returns, plus participation in equity upside. Designed for companies that require non-dilutive growth capital with income and total return alignment.",
  targetNetIrr: "12–16%",
  term: "3–5 years",
  structure: "Convertible preferred or structured equity",
  distributions: "Income + capital gains",
  liquidity: "Locked term",
  minimumInvestment: "250000.00",
  riskProfile: "high",
  returnType: "blended",
  isActive: true
}
```

### Digital Assets / Crypto Funds

#### 8. Bitcoin Tracker Fund
```typescript
{
  id: 8,
  name: "Bitcoin Tracker Fund",
  category: "digital_assets",
  subCategory: "bitcoin_tracker",
  investmentStrategy: "Passive exposure to the price performance of Bitcoin through a regulated, institutionally structured fund with professional custody and institutional-grade security. Features quarterly rebalancing, tax-efficient structure, and direct Bitcoin exposure without operational complexities.",
  targetNetIrr: "Market-based (historical 60%+ annualized)",
  term: "Open-ended with quarterly liquidity",
  structure: "Regulated passive tracker fund",
  distributions: "None (pure capital appreciation)",
  liquidity: "quarterly",
  minimumInvestment: "25000.00",
  riskProfile: "high",
  returnType: "capital_gains",
  isActive: true
}
```

#### 9. Web3 Innovation Fund
```typescript
{
  id: 9,
  name: "Web3 Innovation Fund",
  category: "digital_assets",
  subCategory: "token_fund",
  investmentStrategy: "Strategic investments in pre-launch tokens and early-stage Web3 projects including DeFi protocols, NFT platforms, and infrastructure tokens. Features professional due diligence, strategic partnerships, and institutional-grade token custody with structured unlock schedules.",
  targetNetIrr: "30–50%+ target",
  grossIrr: "40–60%",
  moic: "5–10x target",
  term: "3–5 years with extensions",
  structure: "Hybrid venture + token allocation fund",
  distributions: "Quarterly distributions from liquid positions",
  liquidity: "illiquid",
  minimumInvestment: "250000.00",
  riskProfile: "very_high",
  returnType: "capital_gains",
  isActive: true
}
```

#### 10. Diversified Crypto Fund
```typescript
{
  id: 10,
  name: "Diversified Crypto Fund",
  category: "digital_assets",
  subCategory: "blockchain_fund",
  investmentStrategy: "Institutional-grade diversified exposure across the crypto ecosystem including blue-chip cryptocurrencies (40%), DeFi protocols (25%), infrastructure tokens (20%), and emerging opportunities (15%). Features active management, risk controls, and institutional custody.",
  targetNetIrr: "25–35% target",
  grossIrr: "30–40%",
  moic: "2.5–4x over cycle",
  term: "Open-ended with 3-year recommended hold",
  structure: "Multi-strategy diversified fund",
  distributions: "Semi-annual distributions from DeFi yield",
  liquidity: "quarterly",
  minimumInvestment: "50000.00",
  riskProfile: "high",
  returnType: "blended",
  isActive: true
}
```

#### 11. Ethereum Staking Fund
```typescript
{
  id: 11,
  name: "Ethereum Staking Fund",
  category: "digital_assets",
  subCategory: "staking_fund",
  investmentStrategy: "Professional Ethereum staking service offering institutional-grade ETH2.0 staking with automated validator management, slashing protection, and optimal reward distribution. Features liquid staking tokens, professional custody, and consistent yield generation.",
  targetNetIrr: "4.5–7% APY (staking rewards)",
  grossIrr: "5–8%",
  term: "Open-ended with instant liquidity",
  structure: "Liquid staking fund",
  distributions: "Monthly staking rewards",
  liquidity: "daily",
  minimumInvestment: "10000.00",
  riskProfile: "moderate",
  returnType: "income",
  isActive: true
}
```

### Cash Deposit Products

#### 12. High-Yield Savings Account
```typescript
{
  id: 12,
  name: "High-Yield Savings Account",
  category: "cash_deposit",
  subCategory: "savings_account",
  investmentStrategy: "FDIC-insured high-yield savings account offering competitive interest rates for idle funds. Features instant access, no minimum balance requirements, and automated daily interest accrual with monthly compounding.",
  targetNetIrr: "4.5–5.5% p.a.",
  term: "Open-ended",
  structure: "FDIC-insured savings account",
  distributions: "Daily accrual, monthly credit",
  liquidity: "Instant access (T+0)",
  minimumInvestment: "0.00",
  riskProfile: "low",
  returnType: "yield",
  isActive: true
}
```

#### 14. Premium Treasury Deposit
```typescript
{
  id: 14,
  name: "Premium Treasury Deposit",
  category: "cash_deposit",
  subCategory: "treasury_deposit",
  investmentStrategy: "Premium deposit product backed by US Treasury securities offering superior yields for larger balances. Features tiered interest rates, government backing, and next-day liquidity for sophisticated treasury management.",
  targetNetIrr: "2.5–3.5% p.a.",
  term: "Open-ended with 30-day notice",
  structure: "Treasury-backed deposit account",
  distributions: "Daily accrual, quarterly credit",
  liquidity: "Next-day access (T+1)",
  minimumInvestment: "10000.00",
  riskProfile: "low",
  returnType: "yield",
  isActive: true
}
```

## Filter Values for These Specific Funds

### By Category
- `real_estate`: Products 1, 2, 3
- `corporate_credit`: Products 4, 5  
- `venture_capital`: Products 6, 7
- `digital_assets`: Products 8, 9, 10, 11
- `cash_deposit`: Products 12, 14

### By Risk Profile
- `high`: Products 1, 6, 8, 10
- `very_high`: Product 9
- `moderate`: Products 2, 3, 4, 5, 11
- `low`: Products 12, 14

### By Liquidity
- `quarterly`: Products 2, 3, 8, 10
- `locked`: Products 4, 5, 7
- `illiquid`: Products 6, 9
- `daily`: Product 11
- `instant`: Product 12
- `next-day`: Product 14

## Current User Investments in These Funds

User has active investments in:
- Real Estate Credit Fund: $500k invested → $545k current value (9% return)
- Cash Flow Corporate Credit: $300k invested → $327k current value (9% return)  
- VC Growth Equity Fund: $750k invested → $825k current value (10% return)
- Bitcoin Tracker Fund: $150k invested → $187.5k current value (25% return)
- Ethereum Staking Fund: $75k invested → $78.75k current value (5% return)

## Quick Debug Checklist

1. **Product Not Showing**: Check `isActive: true` status
2. **Filter Not Working**: Verify exact category/risk/liquidity string matches
3. **Investment Display**: Check user has investment in productId
4. **Performance Issues**: Verify category-based performance calculation factors
5. **Minimum Investment**: Check user available balance vs minimumInvestment amount

This focused backup contains only the specific funds you're debugging in the investment products section.