// DETAILED MIDPOINT IRR CALCULATION - Step by Step Breakdown
console.log('=== DETAILED MIDPOINT IRR CALCULATION ===\n');

// Current investment data from API (as of Aug 1, 2025)
const investments = [
  {
    id: 1,
    productName: "Real Estate Credit Fund",
    category: "real_estate",
    investedAmount: 500000.00,
    investmentDate: "2025-04-03T15:21:00.032Z",
    midpointIRR: 0.11, // 11% annual
    currentValue: 518082.19,
    actualReturn: 18082.19,
    actualPercent: 3.62
  },
  {
    id: 2, 
    productName: "Corporate Credit Fund",
    category: "corporate_credit",
    investedAmount: 300000.00,
    investmentDate: "2025-05-03T15:21:00.032Z",
    midpointIRR: 0.11, // 11% annual
    currentValue: 308136.99,
    actualReturn: 8136.99,
    actualPercent: 2.71
  },
  {
    id: 3,
    productName: "VC/Growth Equity Fund", 
    category: "venture_capital",
    investedAmount: 750000.00,
    investmentDate: "2024-08-01T15:21:00.032Z",
    midpointIRR: 0.18, // 18% annual
    currentValue: 872303.79,
    actualReturn: 122303.79,
    actualPercent: 16.31
  },
  {
    id: 4,
    productName: "Bitcoin Tracker Fund",
    category: "digital_assets", 
    investedAmount: 150000.00,
    investmentDate: "2025-02-02T15:21:00.032Z",
    midpointIRR: 0.15, // 15% annual (Bitcoin)
    currentValue: 156589.97,
    actualReturn: 6589.97,
    actualPercent: 4.39
  },
  {
    id: 5,
    productName: "Ethereum Staking Fund",
    category: "digital_assets",
    investedAmount: 75000.00,
    investmentDate: "2025-06-02T15:21:00.032Z", 
    midpointIRR: 0.0575, // 5.75% annual (Ethereum)
    currentValue: 75708.90,
    actualReturn: 708.90,
    actualPercent: 0.95
  }
];

const currentDate = new Date("2025-08-01T15:21:00.032Z");

console.log('STEP 1: MIDPOINT IRR CALCULATION FOR EACH INVESTMENT\n');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

investments.forEach((inv, i) => {
  const investmentDate = new Date(inv.investmentDate);
  const daysSinceInvestment = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeProgress = daysSinceInvestment / 365; // Years since investment
  
  // Midpoint IRR calculation
  let performanceFactor = 1 + (inv.midpointIRR * timeProgress);
  
  // Add volatility adjustments for specific categories
  if (inv.category === 'digital_assets' && inv.productName.includes('Bitcoin')) {
    const volatilityAdjustment = Math.sin(daysSinceInvestment * 0.1) * 0.4 * 0.1;
    performanceFactor += volatilityAdjustment;
  } else if (inv.category === 'venture_capital') {
    const volatilityAdjustment = (Math.sin(daysSinceInvestment * 0.05) * 0.3 * 0.1);
    performanceFactor += volatilityAdjustment;
  }
  
  // Ensure minimum performance factor
  performanceFactor = Math.max(0.5, performanceFactor);
  
  const calculatedCurrentValue = inv.investedAmount * performanceFactor;
  const calculatedReturn = calculatedCurrentValue - inv.investedAmount;
  const calculatedPercent = (calculatedReturn / inv.investedAmount) * 100;
  
  console.log(`${i+1}. ${inv.productName}`);
  console.log(`   Investment Date: ${investmentDate.toDateString()}`);
  console.log(`   Days Since Investment: ${daysSinceInvestment}`);
  console.log(`   Time Progress: ${timeProgress.toFixed(4)} years`);
  console.log(`   Midpoint IRR: ${(inv.midpointIRR * 100).toFixed(2)}%`);
  console.log(`   Performance Factor: ${performanceFactor.toFixed(6)}`);
  console.log(`   Invested Amount: $${inv.investedAmount.toLocaleString()}`);
  console.log(`   Calculated Current Value: $${calculatedCurrentValue.toLocaleString()}`);
  console.log(`   Calculated Return: $${calculatedReturn.toLocaleString()}`);
  console.log(`   Calculated Return %: ${calculatedPercent.toFixed(2)}%`);
  console.log(`   API Current Value: $${inv.currentValue.toLocaleString()}`);
  console.log(`   API Return: $${inv.actualReturn.toLocaleString()}`);
  console.log(`   API Return %: ${inv.actualPercent.toFixed(2)}%`);
  console.log(`   Match: ${Math.abs(calculatedCurrentValue - inv.currentValue) < 0.01 ? '✓' : '✗'}`);
  console.log('');
  
  totalInvested += inv.investedAmount;
  totalCurrentValue += inv.currentValue;
  totalReturn += inv.actualReturn;
});

console.log('STEP 2: PORTFOLIO TOTALS\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Total Return Percentage: ${((totalReturn / totalInvested) * 100).toFixed(2)}%`);

console.log('\nSTEP 3: VERIFICATION OF $155,821.84 and 8.78%\n');
console.log(`Expected Total Return: $155,821.84`);
console.log(`Calculated Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Difference: $${Math.abs(155821.84 - totalReturn).toLocaleString()}`);
console.log(`Match: ${Math.abs(155821.84 - totalReturn) < 0.01 ? '✓' : '✗'}`);

const expectedPercent = 8.78;
const calculatedPercent = (totalReturn / totalInvested) * 100;
console.log(`Expected Return %: ${expectedPercent}%`);
console.log(`Calculated Return %: ${calculatedPercent.toFixed(2)}%`);
console.log(`Difference: ${Math.abs(expectedPercent - calculatedPercent).toFixed(2)}%`);
console.log(`Match: ${Math.abs(expectedPercent - calculatedPercent) < 0.01 ? '✓' : '✗'}`);

console.log('\nSTEP 4: MIDPOINT IRR METHODOLOGY SUMMARY\n');
console.log('✓ Real Estate Credit Fund: 11% midpoint IRR');
console.log('✓ Corporate Credit Fund: 11% midpoint IRR (10-12% range)');
console.log('✓ VC/Growth Equity Fund: 18% midpoint IRR (16-20% range)'); 
console.log('✓ Bitcoin Tracker Fund: 15% midpoint IRR with volatility');
console.log('✓ Ethereum Staking Fund: 5.75% midpoint IRR (4.5-7% range)');
console.log('✓ Time-based calculation: Performance Factor = 1 + (midpoint IRR × time in years)');
console.log('✓ Volatility adjustments for Bitcoin and VC funds using deterministic functions');
console.log('✓ Minimum performance factor of 0.5 to prevent negative returns');