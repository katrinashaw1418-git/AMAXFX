// MIDPOINT IRR VERIFICATION - INCLUDING ALL INVESTMENTS
console.log('=== VERIFYING MIDPOINT IRR WITH ALL INVESTMENTS ===\n');

// Complete investment list with new $50k and $25k Bitcoin investments
const allInvestments = [
  { name: "Real Estate Credit Fund", invested: 500000, days: 120, rate: 0.11 },
  { name: "Corporate Credit Fund", invested: 300000, days: 90, rate: 0.11 },
  { name: "VC/Growth Equity Fund", invested: 750000, days: 365, rate: 0.18 },
  { name: "Bitcoin Tracker Fund (Original)", invested: 150000, days: 180, rate: 0.15 },
  { name: "Ethereum Staking Fund", invested: 75000, days: 60, rate: 0.0575 },
  { name: "Bitcoin Tracker Fund ($50k)", invested: 50000, days: 1, rate: 0.15 },
  { name: "Bitcoin Tracker Fund ($25k)", invested: 25000, days: 0, rate: 0.15 }
];

let totalInvested = 0;
let totalCurrent = 0;
let totalReturn = 0;

console.log('UPDATED PORTFOLIO WITH ALL INVESTMENTS:\n');

allInvestments.forEach((inv, i) => {
  const timeProgress = inv.days / 365;
  const performanceFactor = 1 + (inv.rate * timeProgress);
  const currentValue = inv.invested * performanceFactor;
  const returnAmount = currentValue - inv.invested;
  const returnPercent = (returnAmount / inv.invested) * 100;
  
  totalInvested += inv.invested;
  totalCurrent += currentValue;
  totalReturn += returnAmount;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Invested: $${inv.invested.toLocaleString()}`);
  console.log(`   Days: ${inv.days} (${timeProgress.toFixed(4)} years)`);
  console.log(`   Rate: ${(inv.rate * 100).toFixed(2)}% midpoint IRR`);
  console.log(`   Current Value: $${currentValue.toLocaleString()}`);
  console.log(`   Return: $${returnAmount.toLocaleString()} (${returnPercent.toFixed(2)}%)`);
  console.log('');
});

const portfolioReturnPercent = (totalReturn / totalInvested) * 100;

console.log('COMPLETE PORTFOLIO TOTALS:\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);

console.log('\nEXPECTED UPDATE AFTER ADDING NEW INVESTMENTS:\n');
console.log('Current API shows: $155,822 (8.78%) - Missing new investments');
console.log(`Should show: $${totalReturn.toLocaleString()} (${portfolioReturnPercent.toFixed(2)}%) - With all investments`);
console.log(`Difference: $${(totalReturn - 155822).toLocaleString()} additional return`);

console.log('\nDATABASE STATUS:\n');
console.log('✓ Switched to 15% midpoint IRR for Bitcoin (from 60% market)');
console.log('✓ Need to add $50k and $25k Bitcoin investments to database');
console.log('✓ API should automatically recalculate and update totals');
console.log('✓ Investment performance chart should reflect new totals');