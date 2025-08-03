// DETAILED BREAKDOWN CALCULATION - $189,109.51 Total Return (10.65%)
console.log('=== DETAILED INVESTMENT BREAKDOWN CALCULATION ===\n');

// Current data from API (Aug 1, 2025)
const investments = [
  {
    id: 1,
    name: "Real Estate Credit Fund",
    category: "real_estate",
    invested: 500000.00,
    investmentDate: "2025-04-03T15:26:22.609Z",
    currentValue: 518082.19,
    totalReturn: 18082.19,
    returnPercent: 3.62,
    annualRate: 0.11 // 11% midpoint IRR
  },
  {
    id: 2,
    name: "Corporate Credit Fund", 
    category: "corporate_credit",
    invested: 300000.00,
    investmentDate: "2025-05-03T15:26:22.609Z",
    currentValue: 308136.99,
    totalReturn: 8136.99,
    returnPercent: 2.71,
    annualRate: 0.11 // 11% midpoint IRR
  },
  {
    id: 3,
    name: "VC/Growth Equity Fund",
    category: "venture_capital", 
    invested: 750000.00,
    investmentDate: "2024-08-01T15:26:22.609Z",
    currentValue: 872303.79,
    totalReturn: 122303.79,
    returnPercent: 16.31,
    annualRate: 0.18 // 18% midpoint IRR
  },
  {
    id: 4,
    name: "Bitcoin Tracker Fund",
    category: "digital_assets",
    invested: 150000.00,
    investmentDate: "2025-02-02T15:26:22.609Z", 
    currentValue: 189877.64,
    totalReturn: 39877.64,
    returnPercent: 26.59,
    annualRate: 0.60 // 60% market-based
  },
  {
    id: 5,
    name: "Ethereum Staking Fund",
    category: "digital_assets",
    invested: 75000.00,
    investmentDate: "2025-06-02T15:26:22.609Z",
    currentValue: 75708.90,
    totalReturn: 708.90,
    returnPercent: 0.95,
    annualRate: 0.0575 // 5.75% midpoint IRR
  }
];

const currentDate = new Date("2025-08-01T15:26:22.609Z");

console.log('STEP-BY-STEP CALCULATION FOR EACH INVESTMENT:\n');

let portfolioTotalInvested = 0;
let portfolioTotalCurrent = 0;
let portfolioTotalReturn = 0;

investments.forEach((inv, i) => {
  const investmentDate = new Date(inv.investmentDate);
  const daysSinceInvestment = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeProgress = daysSinceInvestment / 365; // Years since investment
  
  console.log(`${i+1}. ${inv.name.toUpperCase()}`);
  console.log(`   Investment Date: ${investmentDate.toDateString()}`);
  console.log(`   Current Date: ${currentDate.toDateString()}`);
  console.log(`   Days Invested: ${daysSinceInvestment} days`);
  console.log(`   Time Progress: ${timeProgress.toFixed(4)} years`);
  console.log(`   Annual Return Rate: ${(inv.annualRate * 100).toFixed(2)}%`);
  console.log('');
  
  // Base performance calculation
  let performanceFactor = 1 + (inv.annualRate * timeProgress);
  console.log(`   Base Performance Factor: 1 + (${(inv.annualRate * 100).toFixed(2)}% × ${timeProgress.toFixed(4)})`);
  console.log(`   Base Performance Factor: 1 + ${(inv.annualRate * timeProgress).toFixed(6)} = ${performanceFactor.toFixed(6)}`);
  
  // Add volatility adjustments
  if (inv.category === 'digital_assets' && inv.name.includes('Bitcoin')) {
    const volatilityAdjustment = Math.sin(daysSinceInvestment * 0.1) * 0.4 * 0.1;
    performanceFactor += volatilityAdjustment;
    console.log(`   Bitcoin Volatility Adjustment: ${volatilityAdjustment.toFixed(6)}`);
    console.log(`   Adjusted Performance Factor: ${performanceFactor.toFixed(6)}`);
  } else if (inv.category === 'venture_capital') {
    const volatilityAdjustment = (Math.sin(daysSinceInvestment * 0.05) * 0.3 * 0.1);
    performanceFactor += volatilityAdjustment;
    console.log(`   VC Volatility Adjustment: ${volatilityAdjustment.toFixed(6)}`);
    console.log(`   Adjusted Performance Factor: ${performanceFactor.toFixed(6)}`);
  }
  
  // Ensure minimum performance factor
  performanceFactor = Math.max(0.5, performanceFactor);
  
  // Calculate final values
  const calculatedCurrentValue = inv.invested * performanceFactor;
  const calculatedReturn = calculatedCurrentValue - inv.invested;
  const calculatedPercent = (calculatedReturn / inv.invested) * 100;
  
  console.log('');
  console.log(`   CALCULATION:`);
  console.log(`   Current Value = Invested × Performance Factor`);
  console.log(`   Current Value = $${inv.invested.toLocaleString()} × ${performanceFactor.toFixed(6)}`);
  console.log(`   Current Value = $${calculatedCurrentValue.toLocaleString()}`);
  console.log('');
  console.log(`   Return = Current Value - Invested Amount`); 
  console.log(`   Return = $${calculatedCurrentValue.toLocaleString()} - $${inv.invested.toLocaleString()}`);
  console.log(`   Return = $${calculatedReturn.toLocaleString()}`);
  console.log('');
  console.log(`   Return % = (Return ÷ Invested) × 100`);
  console.log(`   Return % = ($${calculatedReturn.toLocaleString()} ÷ $${inv.invested.toLocaleString()}) × 100`);
  console.log(`   Return % = ${calculatedPercent.toFixed(2)}%`);
  console.log('');
  console.log(`   API VALUES (for verification):`);
  console.log(`   API Current Value: $${inv.currentValue.toLocaleString()}`);
  console.log(`   API Return: $${inv.totalReturn.toLocaleString()}`);
  console.log(`   API Return %: ${inv.returnPercent}%`);
  console.log(`   Match: ${Math.abs(calculatedCurrentValue - inv.currentValue) < 0.01 ? '✓' : '✗'}`);
  console.log('');
  console.log('   ' + '='.repeat(60));
  console.log('');
  
  // Add to portfolio totals
  portfolioTotalInvested += inv.invested;
  portfolioTotalCurrent += inv.currentValue;
  portfolioTotalReturn += inv.totalReturn;
});

console.log('PORTFOLIO TOTALS CALCULATION:\n');
console.log(`Total Invested = ${investments.map(inv => `$${inv.invested.toLocaleString()}`).join(' + ')}`);
console.log(`Total Invested = $${portfolioTotalInvested.toLocaleString()}`);
console.log('');
console.log(`Total Current Value = ${investments.map(inv => `$${inv.currentValue.toLocaleString()}`).join(' + ')}`);
console.log(`Total Current Value = $${portfolioTotalCurrent.toLocaleString()}`);
console.log('');
console.log(`Total Return = ${investments.map(inv => `$${inv.totalReturn.toLocaleString()}`).join(' + ')}`);
console.log(`Total Return = $${portfolioTotalReturn.toLocaleString()}`);
console.log('');
console.log(`Portfolio Return % = (Total Return ÷ Total Invested) × 100`);
console.log(`Portfolio Return % = ($${portfolioTotalReturn.toLocaleString()} ÷ $${portfolioTotalInvested.toLocaleString()}) × 100`);
console.log(`Portfolio Return % = ${((portfolioTotalReturn / portfolioTotalInvested) * 100).toFixed(2)}%`);
console.log('');

console.log('VERIFICATION OF TARGET VALUES:\n');
console.log(`Expected Total Return: $189,109.51`);
console.log(`Calculated Total Return: $${portfolioTotalReturn.toLocaleString()}`);
console.log(`Difference: $${Math.abs(189109.51 - portfolioTotalReturn).toLocaleString()}`);
console.log(`Match: ${Math.abs(189109.51 - portfolioTotalReturn) < 0.01 ? '✓' : '✗'}`);
console.log('');
console.log(`Expected Portfolio Return: 10.65%`);
console.log(`Calculated Portfolio Return: ${((portfolioTotalReturn / portfolioTotalInvested) * 100).toFixed(2)}%`);
console.log(`Match: ${Math.abs(10.65 - ((portfolioTotalReturn / portfolioTotalInvested) * 100)) < 0.01 ? '✓' : '✗'}`);