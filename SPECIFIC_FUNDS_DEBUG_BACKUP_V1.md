# Specific Funds Debug Backup - Version 1

## Real Estate & Corporate Credit Fund Products

This backup preserves the exact investment product definitions for debugging issues with specific funds.

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

## File Locations for Debugging
- Product definitions: `server/storage.ts` lines 2567-2708
- Filter logic: `server/storage.ts` lines 3157-3171 (MemStorage), 3438-3450 (DatabaseStorage)
- Performance calculation: `server/routes.ts` portfolio endpoints with category-based performance factors
- Frontend filters: `client/src/pages/investments.tsx` lines 430-504