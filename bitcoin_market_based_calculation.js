// BITCOIN MARKET-BASED CALCULATION - 60%+ Annualized Returns
console.log('=== BITCOIN MARKET-BASED CALCULATION (60%+ ANNUALIZED) ===\n');

// Current investment data with updated Bitcoin return rate
const investments = [
  {
    id: 1,
    productName: "Real Estate Credit Fund",
    category: "real_estate",
    investedAmount: 500000.00,
    investmentDate: "2025-04-03T15:21:00.032Z",
    annualReturn: 0.11, // 11% midpoint
    daysInvested: 120
  },
  {
    id: 2, 
    productName: "Corporate Credit Fund",
    category: "corporate_credit",
    investedAmount: 300000.00,
    investmentDate: "2025-05-03T15:21:00.032Z",
    annualReturn: 0.11, // 11% midpoint
    daysInvested: 90
  },
  {
    id: 3,
    productName: "VC/Growth Equity Fund", 
    category: "venture_capital",
    investedAmount: 750000.00,
    investmentDate: "2024-08-01T15:21:00.032Z",
    annualReturn: 0.18, // 18% midpoint
    daysInvested: 365
  },
  {
    id: 4,
    productName: "Bitcoin Tracker Fund",
    category: "digital_assets", 
    investedAmount: 150000.00,
    investmentDate: "2025-02-02T15:21:00.032Z",
    annualReturn: 0.60, // 60% market-based historical
    daysInvested: 180
  },
  {
    id: 5,
    productName: "Ethereum Staking Fund",
    category: "digital_assets",
    investedAmount: 75000.00,
    investmentDate: "2025-06-02T15:21:00.032Z", 
    annualReturn: 0.0575, // 5.75% midpoint
    daysInvested: 60
  }
];

console.log('UPDATED CALCULATION WITH 60% BITCOIN RETURNS:\n');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

investments.forEach((inv, i) => {
  const timeProgress = inv.daysInvested / 365; // Years since investment
  
  // Base performance factor
  let performanceFactor = 1 + (inv.annualReturn * timeProgress);
  
  // Add volatility adjustments for specific categories
  if (inv.category === 'digital_assets' && inv.productName.includes('Bitcoin')) {
    const volatilityAdjustment = Math.sin(inv.daysInvested * 0.1) * 0.4 * 0.1;
    performanceFactor += volatilityAdjustment;
  } else if (inv.category === 'venture_capital') {
    const volatilityAdjustment = (Math.sin(inv.daysInvested * 0.05) * 0.3 * 0.1);
    performanceFactor += volatilityAdjustment;
  }
  
  // Ensure minimum performance factor
  performanceFactor = Math.max(0.5, performanceFactor);
  
  const currentValue = inv.investedAmount * performanceFactor;
  const returnAmount = currentValue - inv.investedAmount;
  const returnPercent = (returnAmount / inv.investedAmount) * 100;
  
  console.log(`${i+1}. ${inv.productName}`);
  console.log(`   Days Invested: ${inv.daysInvested} (${timeProgress.toFixed(4)} years)`);
  console.log(`   Annual Return Rate: ${(inv.annualReturn * 100).toFixed(2)}%`);
  console.log(`   Performance Factor: ${performanceFactor.toFixed(6)}`);
  console.log(`   Invested: $${inv.investedAmount.toLocaleString()}`);
  console.log(`   Current Value: $${currentValue.toLocaleString()}`);
  console.log(`   Return: $${returnAmount.toLocaleString()}`);
  console.log(`   Return %: ${returnPercent.toFixed(2)}%`);
  console.log('');
  
  totalInvested += inv.investedAmount;
  totalCurrentValue += currentValue;
  totalReturn += returnAmount;
});

console.log('PORTFOLIO TOTALS WITH 60% BITCOIN RETURNS:\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Total Return Percentage: ${((totalReturn / totalInvested) * 100).toFixed(2)}%`);

console.log('\nCOMPARISON WITH PREVIOUS 15% BITCOIN RATE:\n');
console.log('Previous Portfolio (15% Bitcoin): $155,821.84 return (8.78%)');
console.log(`Updated Portfolio (60% Bitcoin): $${totalReturn.toLocaleString()} return (${((totalReturn / totalInvested) * 100).toFixed(2)}%)`);
console.log(`Improvement: $${(totalReturn - 155821.84).toLocaleString()} additional return`);

console.log('\nBITCOIN MARKET-BASED METHODOLOGY:\n');
console.log('✓ Bitcoin Tracker Fund: 60%+ annualized (historical market performance)');
console.log('✓ Real Estate: 11% midpoint IRR');
console.log('✓ Corporate Credit: 11% midpoint IRR');
console.log('✓ VC Fund: 18% midpoint IRR');
console.log('✓ Ethereum: 5.75% midpoint IRR');
console.log('✓ Time-based calculation with volatility adjustments');
console.log('✓ Reflects actual Bitcoin historical performance vs conservative midpoint estimates');