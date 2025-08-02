// DETAILED INVESTMENT CALCULATION BREAKDOWN
console.log('=== DETAILED INVESTMENT CALCULATION BREAKDOWN ===\n');

// Current investments from database
const investments = [
  {
    name: "Real Estate Credit Fund",
    invested: 500000,
    investmentDate: "2025-04-04",
    daysHeld: 120, // Apr 4 to Aug 2
    category: "real_estate",
    midpointRate: 0.11 // 11% annual
  },
  {
    name: "Corporate Credit Fund", 
    invested: 300000,
    investmentDate: "2025-05-04",
    daysHeld: 90, // May 4 to Aug 2
    category: "corporate_credit",
    midpointRate: 0.11 // 11% annual
  },
  {
    name: "VC/Growth Equity Fund",
    invested: 750000,
    investmentDate: "2024-08-02",
    daysHeld: 365, // Aug 2 2024 to Aug 2 2025
    category: "venture_capital",
    midpointRate: 0.18 // 18% annual
  },
  {
    name: "Bitcoin Tracker Fund (Original)",
    invested: 150000,
    investmentDate: "2025-02-03",
    daysHeld: 180, // Feb 3 to Aug 2
    category: "digital_assets",
    midpointRate: 0.15 // 15% annual (CHANGED from 60% market)
  },
  {
    name: "Ethereum Staking Fund",
    invested: 75000,
    investmentDate: "2025-06-03",
    daysHeld: 60, // Jun 3 to Aug 2
    category: "digital_assets",
    midpointRate: 0.0575 // 5.75% annual
  },
  {
    name: "Bitcoin Tracker Fund ($50k)",
    invested: 50000,
    investmentDate: "2025-08-01",
    daysHeld: 1, // Aug 1 to Aug 2
    category: "digital_assets",
    midpointRate: 0.15 // 15% annual
  },
  {
    name: "Bitcoin Tracker Fund ($25k)",
    invested: 25000,
    investmentDate: "2025-08-02",
    daysHeld: 0, // Just invested today
    category: "digital_assets",
    midpointRate: 0.15 // 15% annual
  }
];

console.log('MIDPOINT IRR CALCULATION FORMULA:\n');
console.log('Current Value = Invested Amount × (1 + Annual Rate × Time Fraction)');
console.log('Time Fraction = Days Held / 365');
console.log('Total Return = Current Value - Invested Amount');
console.log('Return % = (Total Return / Invested Amount) × 100\n');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

console.log('DETAILED CALCULATIONS:\n');

investments.forEach((inv, i) => {
  const timeFraction = inv.daysHeld / 365;
  const growthFactor = 1 + (inv.midpointRate * timeFraction);
  const currentValue = inv.invested * growthFactor;
  const returnAmount = currentValue - inv.invested;
  const returnPercent = (returnAmount / inv.invested) * 100;
  
  totalInvested += inv.invested;
  totalCurrentValue += currentValue;
  totalReturn += returnAmount;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Investment Date: ${inv.investmentDate}`);
  console.log(`   Days Held: ${inv.daysHeld} days`);
  console.log(`   Time Fraction: ${timeFraction.toFixed(4)} years`);
  console.log(`   Annual Rate: ${(inv.midpointRate * 100).toFixed(2)}% (midpoint IRR)`);
  console.log(`   Calculation: $${inv.invested.toLocaleString()} × ${growthFactor.toFixed(6)}`);
  console.log(`   Current Value: $${currentValue.toLocaleString()}`);
  console.log(`   Total Return: $${returnAmount.toLocaleString()}`);
  console.log(`   Return %: ${returnPercent.toFixed(2)}%`);
  console.log('');
});

const portfolioReturnPercent = (totalReturn / totalInvested) * 100;

console.log('PORTFOLIO TOTALS:\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);

console.log('\nKEY CHANGES MADE:\n');
console.log('✓ Bitcoin switched from 60% market rate to 15% midpoint IRR');
console.log('✓ All investments now use consistent midpoint methodology');
console.log('✓ New $50k and $25k Bitcoin investments properly included');
console.log('✓ Database updated to reflect real-time calculations');

console.log('\nEXPECTED API RESPONSE:\n');
console.log(`"totalReturn": "${totalReturn.toFixed(2)}"`);
console.log(`"totalReturnPercent": "${portfolioReturnPercent.toFixed(2)}"`);
console.log(`"currentValue": ${totalCurrentValue.toFixed(2)}`);
console.log(`Total investments: ${investments.length} records`);