// MANUAL CALCULATION: $1,775,000 invested, $197,319 profit, 11.12% return
console.log('=== MANUAL BREAKDOWN OF 11.12% RETURN ===');

// Investment data from API
const investments = [
  { name: "Real Estate Credit Fund", invested: 500000, current: 513150.68, return: 13150.68 },
  { name: "Corporate Credit Fund", invested: 300000, current: 303698.63, return: 3698.63 },
  { name: "VC / Growth Equity Fund", invested: 750000, current: 920658.96, return: 170658.96 },
  { name: "Bitcoin Tracker Fund", invested: 150000, current: 155126.59, return: 5126.59 },
  { name: "Ethereum Staking Fund", invested: 75000, current: 79684.41, return: 4684.41 }
];

console.log('STEP 1: INDIVIDUAL INVESTMENT CALCULATIONS');
let runningTotalInvested = 0;
let runningTotalReturn = 0;

investments.forEach((inv, i) => {
  runningTotalInvested += inv.invested;
  runningTotalReturn += inv.return;
  const returnPercent = (inv.return / inv.invested) * 100;
  
  console.log(`Investment ${i+1}: ${inv.name}`);
  console.log(`  Invested: $${inv.invested.toLocaleString()}`);
  console.log(`  Current: $${inv.current.toLocaleString()}`);
  console.log(`  Return: $${inv.return.toLocaleString()}`);
  console.log(`  Individual %: ${inv.return.toLocaleString()} ÷ ${inv.invested.toLocaleString()} = ${returnPercent.toFixed(2)}%`);
  console.log(`  Running Total Invested: $${runningTotalInvested.toLocaleString()}`);
  console.log(`  Running Total Return: $${runningTotalReturn.toLocaleString()}`);
  console.log('');
});

console.log('STEP 2: FINAL TOTALS');
console.log(`Total Invested: $${runningTotalInvested.toLocaleString()}`);
console.log(`Total Return: $${runningTotalReturn.toLocaleString()}`);

console.log('\nSTEP 3: PERCENTAGE CALCULATION');
console.log(`${runningTotalReturn.toLocaleString()} ÷ ${runningTotalInvested.toLocaleString()} = ${(runningTotalReturn / runningTotalInvested).toFixed(6)}`);
console.log(`${(runningTotalReturn / runningTotalInvested).toFixed(6)} × 100 = ${((runningTotalReturn / runningTotalInvested) * 100).toFixed(2)}%`);

console.log('\nSTEP 4: VERIFICATION WITH API DATA');
console.log(`API Total Invested: $1,775,000`);
console.log(`API Total Return: $197,319.27`);
console.log(`API Calculation: 197,319.27 ÷ 1,775,000 = ${(197319.27 / 1775000).toFixed(6)}`);
console.log(`API Percentage: ${(197319.27 / 1775000).toFixed(6)} × 100 = ${((197319.27 / 1775000) * 100).toFixed(2)}%`);

console.log('\nFINAL RESULT:');
console.log(`Manual: ${((runningTotalReturn / runningTotalInvested) * 100).toFixed(2)}%`);
console.log(`API: 11.12%`);
console.log(`Match: ${Math.abs(((runningTotalReturn / runningTotalInvested) * 100) - 11.12) < 0.01 ? 'YES' : 'NO'}`);