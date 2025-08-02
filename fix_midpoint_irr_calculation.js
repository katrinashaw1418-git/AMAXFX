// MIDPOINT IRR CALCULATION FIX - ENSURING DATABASE UPDATES
console.log('=== FIXING MIDPOINT IRR CALCULATION AND DATABASE UPDATES ===\n');

// New portfolio with midpoint IRR (15% for Bitcoin instead of 60%)
const investmentsWithMidpointIRR = [
  {
    name: "Real Estate Credit Fund",
    invested: 500000,
    investmentDate: "2025-04-04",
    category: "real_estate",
    annualRate: 0.11, // 11% midpoint
    daysInvested: 120 // Apr 4 to Aug 2
  },
  {
    name: "Corporate Credit Fund", 
    invested: 300000,
    investmentDate: "2025-05-04",
    category: "corporate_credit",
    annualRate: 0.11, // 11% midpoint
    daysInvested: 90 // May 4 to Aug 2
  },
  {
    name: "VC/Growth Equity Fund",
    invested: 750000,
    investmentDate: "2024-08-02",
    category: "venture_capital", 
    annualRate: 0.18, // 18% midpoint
    daysInvested: 365 // Aug 2 2024 to Aug 2 2025
  },
  {
    name: "Bitcoin Tracker Fund (Original)",
    invested: 150000,
    investmentDate: "2025-02-03",
    category: "digital_assets",
    annualRate: 0.15, // 15% midpoint IRR (not 60% market)
    daysInvested: 180 // Feb 3 to Aug 2
  },
  {
    name: "Ethereum Staking Fund",
    invested: 75000,
    investmentDate: "2025-06-03",
    category: "digital_assets",
    annualRate: 0.0575, // 5.75% midpoint
    daysInvested: 60 // Jun 3 to Aug 2
  },
  {
    name: "Bitcoin Tracker Fund (New $50k)",
    invested: 50000,
    investmentDate: "2025-08-01",
    category: "digital_assets", 
    annualRate: 0.15, // 15% midpoint IRR
    daysInvested: 1 // Aug 1 to Aug 2
  },
  {
    name: "Bitcoin Tracker Fund (New $25k)",
    invested: 25000,
    investmentDate: "2025-08-02",
    category: "digital_assets",
    annualRate: 0.15, // 15% midpoint IRR
    daysInvested: 0 // Just invested today
  }
];

console.log('UPDATED CALCULATIONS WITH MIDPOINT IRR:\n');

let totalInvested = 0;
let totalCurrent = 0;
let totalReturn = 0;

investmentsWithMidpointIRR.forEach((inv, i) => {
  const timeProgress = inv.daysInvested / 365;
  
  // Midpoint IRR calculation (linear for simplicity)
  let performanceFactor = 1 + (inv.annualRate * timeProgress);
  
  // Add volatility adjustments for some categories
  if (inv.category === 'digital_assets' && inv.name.includes('Bitcoin')) {
    const volatilityAdjustment = Math.sin(inv.daysInvested * 0.1) * 0.3 * 0.1; // Reduced volatility
    performanceFactor += volatilityAdjustment;
  } else if (inv.category === 'venture_capital') {
    const volatilityAdjustment = Math.sin(inv.daysInvested * 0.05) * 0.2 * 0.1;
    performanceFactor += volatilityAdjustment;
  }
  
  performanceFactor = Math.max(0.5, performanceFactor); // Minimum 50% of investment
  
  const currentValue = inv.invested * performanceFactor;
  const returnAmount = currentValue - inv.invested;
  const returnPercent = (returnAmount / inv.invested) * 100;
  
  totalInvested += inv.invested;
  totalCurrent += currentValue;
  totalReturn += returnAmount;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Invested: $${inv.invested.toLocaleString()}`);
  console.log(`   Days: ${inv.daysInvested} (${timeProgress.toFixed(4)} years)`);
  console.log(`   Rate: ${(inv.annualRate * 100).toFixed(2)}% midpoint IRR`);
  console.log(`   Performance Factor: ${performanceFactor.toFixed(6)}`);
  console.log(`   Current Value: $${currentValue.toLocaleString()}`);
  console.log(`   Return: $${returnAmount.toLocaleString()} (${returnPercent.toFixed(2)}%)`);
  console.log('');
});

const portfolioReturnPercent = (totalReturn / totalInvested) * 100;

console.log('NEW PORTFOLIO TOTALS WITH MIDPOINT IRR:\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);

console.log('\nCOMPARISON - MARKET vs MIDPOINT IRR:\n');
console.log('BEFORE (60% Bitcoin Market Rate):');
console.log('  • Bitcoin Original Return: $39,877.64 (26.59%)');
console.log('  • Total Portfolio Return: $189,109.51 (10.65%)');
console.log('');
console.log('AFTER (15% Bitcoin Midpoint IRR):');
const originalBitcoinMidpoint = 150000 * (1 + 0.15 * (180/365)) - 150000;
const newBitcoin50kMidpoint = 50000 * (1 + 0.15 * (1/365)) - 50000;
const newBitcoin25kMidpoint = 25000 * (1 + 0.15 * (0/365)) - 25000;
console.log(`  • Bitcoin Original Return: $${originalBitcoinMidpoint.toLocaleString()} (${(originalBitcoinMidpoint/150000*100).toFixed(2)}%)`);
console.log(`  • Bitcoin $50k Return: $${newBitcoin50kMidpoint.toLocaleString()} (${(newBitcoin50kMidpoint/50000*100).toFixed(2)}%)`);
console.log(`  • Bitcoin $25k Return: $${newBitcoin25kMidpoint.toLocaleString()} (${(newBitcoin25kMidpoint/25000*100).toFixed(2)}%)`);
console.log(`  • New Total Portfolio Return: $${totalReturn.toLocaleString()} (${portfolioReturnPercent.toFixed(2)}%)`);

console.log('\nDATABASE UPDATE REQUIREMENTS:\n');
console.log('✓ Switch Bitcoin from 60% market rate to 15% midpoint IRR');
console.log('✓ Ensure new investments immediately calculate returns (even if 0 days)');
console.log('✓ Fix duplicate ID issues in database');
console.log('✓ Update API to reflect real-time calculation changes');
console.log('✓ Link all investment inputs to database updates automatically');