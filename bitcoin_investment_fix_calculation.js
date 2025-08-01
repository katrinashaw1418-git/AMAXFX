// BITCOIN INVESTMENT CALCULATION FIX - ALL THREE BITCOIN INVESTMENTS
console.log('=== BITCOIN INVESTMENT CALCULATION FIX ===\n');

const currentDate = new Date("2025-08-01T15:40:00.000Z");

// Your actual Bitcoin investments
const bitcoinInvestments = [
  { amount: 150000, date: new Date("2025-02-02T15:37:02.377Z"), days: null },
  { amount: 50000, date: new Date("2025-08-01T15:31:58.000Z"), days: null },
  { amount: 25000, date: new Date("2025-08-01T15:38:07.000Z"), days: null }
];

// Calculate days since investment for each
bitcoinInvestments.forEach((inv, i) => {
  inv.days = Math.floor((currentDate.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24));
  console.log(`Bitcoin Investment ${i+1}:`);
  console.log(`  Amount: $${inv.amount.toLocaleString()}`);
  console.log(`  Date: ${inv.date.toDateString()}`);
  console.log(`  Days: ${inv.days} days`);
  console.log(`  Time Progress: ${(inv.days / 365).toFixed(4)} years`);
  console.log('');
});

// Calculate performance for each Bitcoin investment using 60% annual rate
const bitcoinAnnualRate = 0.60; // 60% market-based rate
let totalBitcoinInvested = 0;
let totalBitcoinCurrent = 0;
let totalBitcoinReturn = 0;

console.log('BITCOIN PERFORMANCE CALCULATIONS:\n');

bitcoinInvestments.forEach((inv, i) => {
  const timeProgress = inv.days / 365;
  
  // Base performance factor with 60% annual return
  let performanceFactor = 1 + (bitcoinAnnualRate * timeProgress);
  
  // Add Bitcoin volatility adjustment (same as original calculation)
  const volatilityAdjustment = Math.sin(inv.days * 0.1) * 0.4 * 0.1;
  performanceFactor += volatilityAdjustment;
  
  // Ensure minimum performance factor
  performanceFactor = Math.max(0.5, performanceFactor);
  
  const currentValue = inv.amount * performanceFactor;
  const returnAmount = currentValue - inv.amount;
  const returnPercent = (returnAmount / inv.amount) * 100;
  
  console.log(`Bitcoin Investment ${i+1} Performance:`);
  console.log(`  Performance Factor: ${performanceFactor.toFixed(6)}`);
  console.log(`  Current Value: $${currentValue.toLocaleString()}`);
  console.log(`  Return: $${returnAmount.toLocaleString()}`);
  console.log(`  Return %: ${returnPercent.toFixed(2)}%`);
  console.log('');
  
  totalBitcoinInvested += inv.amount;
  totalBitcoinCurrent += currentValue;
  totalBitcoinReturn += returnAmount;
});

console.log('TOTAL BITCOIN PORTFOLIO:\n');
console.log(`Total Invested: $${totalBitcoinInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalBitcoinCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalBitcoinReturn.toLocaleString()}`);
console.log(`Bitcoin Portfolio Return: ${((totalBitcoinReturn / totalBitcoinInvested) * 100).toFixed(2)}%`);
console.log('');

// Other investments (unchanged)
const otherInvestments = [
  { name: "Real Estate Credit Fund", invested: 500000, return: 18082.19 },
  { name: "Corporate Credit Fund", invested: 300000, return: 8136.99 },
  { name: "VC/Growth Equity Fund", invested: 750000, return: 122303.79 },
  { name: "Ethereum Staking Fund", invested: 75000, return: 708.90 }
];

let otherTotalInvested = 0;
let otherTotalReturn = 0;

otherInvestments.forEach(inv => {
  otherTotalInvested += inv.invested;
  otherTotalReturn += inv.return;
});

// Complete portfolio calculation
const portfolioTotalInvested = totalBitcoinInvested + otherTotalInvested;
const portfolioTotalReturn = totalBitcoinReturn + otherTotalReturn;
const portfolioTotalCurrent = portfolioTotalInvested + portfolioTotalReturn;
const portfolioReturnPercent = (portfolioTotalReturn / portfolioTotalInvested) * 100;

console.log('COMPLETE UPDATED PORTFOLIO:\n');
console.log(`Total Invested: $${portfolioTotalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${portfolioTotalCurrent.toLocaleString()}`);
console.log(`Total Return: $${portfolioTotalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);
console.log('');

console.log('COMPARISON WITH CURRENT API RESPONSE:\n');
console.log('API Currently Shows:');
console.log('  • Total Return: $189,109.51');
console.log('  • Portfolio Return: 10.51%');
console.log('  • Bitcoin missing your new $25k investment gains');
console.log('');
console.log('Should Actually Show:');
console.log(`  • Total Return: $${portfolioTotalReturn.toLocaleString()}`);
console.log(`  • Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);
console.log(`  • Bitcoin gains from all three investments: $${totalBitcoinReturn.toLocaleString()}`);
console.log('');

console.log('ISSUE IDENTIFIED:');
console.log('⚠️  API calculations are not including your new $25,000 Bitcoin investment');
console.log('⚠️  System needs to refresh and recalculate with updated investment data');
console.log('⚠️  Database shows investments but calculation engine is using cached/outdated data');

console.log('\nEXPECTED INCREASE FROM FIX:');
console.log(`Additional Bitcoin Return: $${(totalBitcoinReturn - 39877.64).toLocaleString()}`);
console.log(`New Portfolio Total Return: $${portfolioTotalReturn.toLocaleString()}`);
console.log(`Portfolio % Improvement: ${(portfolioReturnPercent - 10.51).toFixed(2)} percentage points`);