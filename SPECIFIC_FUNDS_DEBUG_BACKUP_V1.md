# Complete Investment Products Debug Backup - Version 1

## ALL Investment Product Sections

This backup preserves ALL investment product definitions across every category for comprehensive debugging support. This includes Real Estate, Corporate Credit, Venture Capital, Digital Assets, and Cash Deposits.

### Real Estate Fund Products

#### 1. Real Estate Equity Fund (ID: 1)
```typescript
{
  id: 1,
  name: "Real Estate Equity Fund",
  category: "real_estate",
  subCategory: "equity_fund",
  investmentStrategy: "Structured equity and mezzanine capital deployed into residential and mixed-use development projects, primarily through preferred equity or subordinated positions. Focus on downside protection (typ. 60–70% LVR), co-investment alignment with developers, and disciplined feasibility validation.",
  targetNetIrr: "9.8–11.0%",
  grossIrr: null,
  moic: null,
  term: "2–6.5 years",
  structure: "Preferred equity / subordinated debt",
  distributions: "Capitalising, quarterly, or monthly",
  liquidity: "Fixed-term, no early redemptions",
  minimumInvestment: "250000.00",
  riskProfile: "high",
  returnType: "capital_gains",
  lvr: "40–80% (typ. ~70%)",
  isActive: true,
  createdAt: new Date(),
}
```

#### 2. Real Estate Credit Fund (ID: 2)
```typescript
{
  id: 2,
  name: "Real Estate Credit Fund",
  category: "real_estate",
  subCategory: "credit_fund",
  investmentStrategy: "Diversified exposure to senior and subordinated real estate-backed loans for land subdivisions and construction financing. Provides regular income and controlled exposure across multiple projects and geographies.",
  targetNetIrr: "~11%",
  grossIrr: null,
  moic: null,
  term: "~10.2 months (rolling)",
  structure: "Real estate-backed loans",
  distributions: "Quarterly",
  liquidity: "Quarterly redemptions (5% NAV cap)",
  minimumInvestment: "100000.00",
  riskProfile: "moderate",
  returnType: "income",
  lvr: "68%",
  isActive: true,
  createdAt: new Date(),
}
```

#### 3. Real Estate First Mortgage Fund (ID: 3)
```typescript
{
  id: 3,
  name: "Real Estate First Mortgage Fund",
  category: "real_estate",
  subCategory: "first_mortgage",
  investmentStrategy: "First-ranking mortgage finance to conservative, well-prepared property projects with tight controls, strong fundamentals, and regular servicing income.",
  targetNetIrr: "~9%",
  grossIrr: null,
  moic: null,
  term: "~9.4 months",
  structure: "First-ranking mortgage",
  distributions: "Quarterly",
  liquidity: "Quarterly redemption",
  minimumInvestment: "50000.00",
  riskProfile: "moderate",
  returnType: "income",
  lvr: "64%",
  isActive: true,
  createdAt: new Date(),
}
```

### Corporate Credit Fund Products

#### 4. Cash Flow-Based Corporate Credit Fund (ID: 4)
```typescript
{
  id: 4,
  name: "Cash Flow-Based Corporate Credit Fund",
  category: "corporate_credit",
  subCategory: "cash_flow_credit",
  investmentStrategy: "Secured senior lending to companies with strong recurring revenue and positive EBITDA. Terms are tailored to enterprise value and cash flow serviceability, not fixed asset security.",
  targetNetIrr: "11–14%",
  grossIrr: null,
  moic: null,
  term: "12–36 months",
  structure: "Senior secured debt",
  distributions: "Monthly interest payments",
  liquidity: "Locked term",
  minimumInvestment: "100000.00",
  riskProfile: "moderate",
  returnType: "income",
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

#### 5. Security-Backed Corporate Credit Fund (ID: 5)
```typescript
{
  id: 5,
  name: "Security-Backed Corporate Credit Fund",
  category: "corporate_credit",
  subCategory: "security_backed_credit",
  investmentStrategy: "Senior secured loans combined with equity warrants and downside protection via put rights. Structured for both income and potential capital appreciation.",
  targetNetIrr: "12–15%",
  grossIrr: null,
  moic: null,
  term: "30–39 months",
  structure: "Senior lien loan + warrant",
  distributions: "Fixed yield + equity realisation",
  liquidity: "Locked term",
  minimumInvestment: "150000.00",
  riskProfile: "moderate",
  returnType: "blended",
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

### Venture Capital Fund Products

#### 6. VC / Growth Equity Fund (ID: 6)
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
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

#### 7. Hybrid Capital Fund (ID: 7)
```typescript
{
  id: 7,
  name: "Hybrid Capital Fund",
  category: "venture_capital",
  subCategory: "hybrid_capital",
  investmentStrategy: "Structured equity capital with partial cash or PIK returns, plus participation in equity upside. Designed for companies that require non-dilutive growth capital with income and total return alignment.",
  targetNetIrr: "12–16%",
  grossIrr: null,
  moic: null,
  term: "3–5 years",
  structure: "Convertible preferred or structured equity",
  distributions: "Income + capital gains",
  liquidity: "Locked term",
  minimumInvestment: "250000.00",
  riskProfile: "high",
  returnType: "blended",
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

## Filter Behavior for These Funds

### By Category Filter
- **real_estate**: Returns products 1, 2, 3 (all Real Estate funds)
- **corporate_credit**: Returns products 4, 5 (both Corporate Credit funds)
- **venture_capital**: Returns products 6, 7 (both VC funds)

### By Risk Profile Filter
- **moderate**: Returns products 2, 3, 4, 5 (Real Estate Credit/Mortgage + Corporate Credit funds)
- **high**: Returns products 1, 6, 7 (Real Estate Equity + VC funds)

### By Liquidity Filter
- **quarterly**: Returns products 2, 3 (both have quarterly redemptions/distributions)
- **locked**: Returns products 4, 5, 7 (all have locked terms)
- **illiquid**: Returns product 6 (VC fund with long-term lock-in)

### By Return Type Filter
- **income**: Returns products 2, 3, 4 (all focused on income generation)
- **capital_gains**: Returns products 1, 6 (equity-focused funds)
- **blended**: Returns products 5, 7 (hybrid income + capital gains)

## Performance Calculation for These Funds

These funds use the following performance factors in the portfolio calculation:

### Real Estate Category (products 1, 2, 3)
```typescript
case 'real_estate':
  if (daysSinceInvestment > 0) {
    const annualReturn = 0.08; // 8% annual return
    const timeProgress = daysSinceInvestment / 365;
    performanceFactor = 1 + (annualReturn * timeProgress);
  }
```

### Corporate Credit Category (products 4, 5)
```typescript
case 'corporate_credit':
  if (daysSinceInvestment > 0) {
    const annualReturn = 0.05; // 5% annual return
    const timeProgress = daysSinceInvestment / 365;
    performanceFactor = 1 + (annualReturn * timeProgress);
  }
```

### Venture Capital Category (products 6, 7)
```typescript
case 'venture_capital':
  if (daysSinceInvestment > 0) {
    const annualReturn = 0.20; // 20% annual return
    const volatility = 0.3;
    const timeProgress = daysSinceInvestment / 365;
    const baseReturn = annualReturn * timeProgress;
    const volatilityAdjustment = (Math.random() - 0.5) * volatility * 0.1;
    performanceFactor = 1 + baseReturn + volatilityAdjustment;
  }
```

## Common Debugging Issues

### 1. Filter Not Working
- Check if category values match exactly: "real_estate", "corporate_credit", "venture_capital"
- Verify risk profile values: "moderate", "high"
- Ensure liquidity strings match product definitions

### 2. Products Not Appearing
- Verify `isActive: true` on all products
- Check if minimum investment amounts are causing display issues
- Ensure product data is properly loaded in storage

### 3. Performance Calculation Issues
- Real Estate funds should show steady 8% annual growth
- Corporate Credit funds should show conservative 5% annual growth
- VC funds should show higher 20% returns with volatility

### 4. Investment Creation Issues
- Minimum investments: Real Estate Equity ($250k), Credit ($100k), Mortgage ($50k)
- Corporate Credit: Cash Flow ($100k), Security-Backed ($150k)
- VC: Growth Equity ($500k), Hybrid Capital ($250k)

### Digital Assets Fund Products

#### 8. Bitcoin Tracker Fund (ID: 8)
```typescript
{
  id: 8,
  name: "Bitcoin Tracker Fund",
  category: "digital_assets",
  subCategory: "bitcoin_tracker",
  investmentStrategy: "Passive exposure to the price performance of Bitcoin through a regulated, institutionally structured fund with professional custody and institutional-grade security. Features quarterly rebalancing, tax-efficient structure, and direct Bitcoin exposure without operational complexities.",
  targetNetIrr: "Market-based (historical 60%+ annualized)",
  grossIrr: null,
  moic: null,
  term: "Open-ended with quarterly liquidity",
  structure: "Regulated passive tracker fund",
  distributions: "None (pure capital appreciation)",
  liquidity: "quarterly",
  minimumInvestment: "25000.00",
  riskProfile: "high",
  returnType: "capital_gains",
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

#### 9. Web3 Innovation Fund (ID: 9)
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
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

#### 10. Diversified Crypto Fund (ID: 10)
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
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

#### 11. Ethereum Staking Fund (ID: 11)
```typescript
{
  id: 11,
  name: "Ethereum Staking Fund",
  category: "digital_assets",
  subCategory: "staking_fund",
  investmentStrategy: "Professional Ethereum staking service offering institutional-grade ETH2.0 staking with automated validator management, slashing protection, and optimal reward distribution. Features liquid staking tokens, professional custody, and consistent yield generation.",
  targetNetIrr: "4.5–7% APY (staking rewards)",
  grossIrr: "5–8%",
  moic: null,
  term: "Open-ended with instant liquidity",
  structure: "Liquid staking fund",
  distributions: "Monthly staking rewards",
  liquidity: "daily",
  minimumInvestment: "10000.00",
  riskProfile: "moderate",
  returnType: "income",
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

### Cash Deposit Products

#### 12. High-Yield Savings Account (ID: 12)
```typescript
{
  id: 12,
  name: "High-Yield Savings Account",
  category: "cash_deposit",
  subCategory: "savings_account",
  investmentStrategy: "FDIC-insured high-yield savings account offering competitive interest rates for idle funds. Features instant access, no minimum balance requirements, and automated daily interest accrual with monthly compounding.",
  targetNetIrr: "4.5–5.5% p.a.",
  grossIrr: null,
  moic: null,
  term: "Open-ended",
  structure: "FDIC-insured savings account",
  distributions: "Daily accrual, monthly credit",
  liquidity: "Instant access (T+0)",
  minimumInvestment: "0.00",
  riskProfile: "low",
  returnType: "yield",
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

#### 13. Money Market Sweep Fund (ID: 13)
```typescript
{
  id: 13,
  name: "Money Market Sweep Fund",
  category: "cash_deposit",
  subCategory: "money_market",
  investmentStrategy: "Institutional-grade money market fund providing enhanced yields through T-bills, commercial paper, and repo markets. Features professional treasury management with same-day liquidity and government-backed security.",
  targetNetIrr: "3.8–4.8% p.a.",
  grossIrr: null,
  moic: null,
  term: "Open-ended",
  structure: "Money market fund sweep",
  distributions: "Daily accrual, monthly credit",
  liquidity: "Same-day settlement (T+0)",
  minimumInvestment: "1000.00",
  riskProfile: "low",
  returnType: "yield",
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

#### 14. Premium Treasury Deposit (ID: 14)
```typescript
{
  id: 14,
  name: "Premium Treasury Deposit",
  category: "cash_deposit",
  subCategory: "treasury_deposit",
  investmentStrategy: "Premium deposit product backed by US Treasury securities offering superior yields for larger balances. Features tiered interest rates, government backing, and next-day liquidity for sophisticated treasury management.",
  targetNetIrr: "2.5–3.5% p.a.",
  grossIrr: null,
  moic: null,
  term: "Open-ended with 30-day notice",
  structure: "Treasury-backed deposit account",
  distributions: "Daily accrual, quarterly credit",
  liquidity: "Next-day access (T+1)",
  minimumInvestment: "10000.00",
  riskProfile: "low",
  returnType: "yield",
  lvr: null,
  isActive: true,
  createdAt: new Date(),
}
```

## Complete User Investment Examples

```typescript
const demoUserInvestments: UserInvestment[] = [
  {
    id: 1,
    userId: 1,
    productId: 2, // Real Estate Credit Fund
    investedAmount: "500000.00",
    currentValue: "545000.00",
    totalReturn: "45000.00",
    returnPercent: "9.00",
    status: "active",
    investmentDate: new Date(Date.now() - 86400000 * 120), // 4 months ago
    maturityDate: new Date(Date.now() + 86400000 * 180), // 6 months from now
    updatedAt: new Date(),
  },
  {
    id: 2,
    userId: 1,
    productId: 4, // Cash Flow-Based Corporate Credit Fund
    investedAmount: "300000.00",
    currentValue: "327000.00",
    totalReturn: "27000.00",
    returnPercent: "9.00",
    status: "active",
    investmentDate: new Date(Date.now() - 86400000 * 90), // 3 months ago
    maturityDate: new Date(Date.now() + 86400000 * 630), // ~21 months from now
    updatedAt: new Date(),
  },
  {
    id: 3,
    userId: 1,
    productId: 6, // VC / Growth Equity Fund
    investedAmount: "750000.00",
    currentValue: "825000.00",
    totalReturn: "75000.00",
    returnPercent: "10.00",
    status: "active",
    investmentDate: new Date(Date.now() - 86400000 * 365), // 1 year ago
    maturityDate: new Date(Date.now() + 86400000 * 1460), // ~4 years from now
    updatedAt: new Date(),
  },
  {
    id: 4,
    userId: 1,
    productId: 8, // Bitcoin Tracker Fund
    investedAmount: "150000.00",
    currentValue: "187500.00",
    totalReturn: "37500.00",
    returnPercent: "25.00",
    status: "active",
    investmentDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
    maturityDate: null, // Open-ended
    updatedAt: new Date(),
  },
  {
    id: 5,
    userId: 1,
    productId: 11, // Ethereum Staking Fund
    investedAmount: "75000.00",
    currentValue: "78750.00",
    totalReturn: "3750.00",
    returnPercent: "5.00",
    status: "active",
    investmentDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
    maturityDate: null, // Open-ended
    updatedAt: new Date(),
  },
];
```

## Performance Calculation for ALL Categories

### Digital Assets Category (products 8, 9, 10, 11)
```typescript
case 'digital_assets':
  if (daysSinceInvestment > 0) {
    const annualReturn = 0.15; // 15% annual return
    const volatility = 0.4; // 40% volatility
    const timeProgress = daysSinceInvestment / 365;
    const baseReturn = annualReturn * timeProgress;
    const volatilityAdjustment = (Math.random() - 0.5) * volatility * 0.1;
    performanceFactor = Math.max(0.5, 1 + baseReturn + volatilityAdjustment);
  }
```

### Cash Deposits Category (products 12, 13, 14)
```typescript
case 'cash_deposit':
  if (daysSinceInvestment > 0) {
    const annualReturn = 0.04; // 4% annual return
    const timeProgress = daysSinceInvestment / 365;
    performanceFactor = 1 + (annualReturn * timeProgress);
  }
```

## File Locations for Debugging
- Complete product definitions: `server/storage.ts` lines 2567-2848
- User investments: `server/storage.ts` lines 2855-2922
- Filter logic: `server/storage.ts` lines 3157-3171 (MemStorage), 3438-3450 (DatabaseStorage)
- Performance calculation: `server/routes.ts` portfolio endpoints with category-based performance factors
- Frontend filters: `client/src/pages/investments.tsx` lines 430-504

## All Product Categories Summary
- **Real Estate** (3 products): Equity Fund, Credit Fund, First Mortgage Fund
- **Corporate Credit** (2 products): Cash Flow-Based, Security-Backed
- **Venture Capital** (2 products): VC/Growth Equity Fund, Hybrid Capital Fund
- **Digital Assets** (4 products): Bitcoin Tracker, Web3 Innovation, Diversified Crypto, Ethereum Staking
- **Cash Deposits** (3 products): High-Yield Savings, Money Market Sweep, Premium Treasury Deposit

## Total Investment Portfolio Value
Current user has invested across 5 different products with total investment value of $1,775,000 and current value of $1,963,250 representing 10.6% total portfolio return.