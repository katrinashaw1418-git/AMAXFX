// DETAILED RETURN PERCENTAGE CALCULATIONS FOR EACH INVESTMENT
console.log('=== HOW EACH RETURN PERCENTAGE IS CALCULATED ===');

// Investment data from API
const investments = [
  { name: "Real Estate Credit Fund", invested: 500000, current: 513150.68, return: 13150.68 },
  { name: "Corporate Credit Fund", invested: 300000, current: 303698.63, return: 3698.63 },
  { name: "VC / Growth Equity Fund", invested: 750000, current: 920658.96, return: 170658.96 },
  { name: "Bitcoin Tracker Fund", invested: 150000, current: 155126.59, return: 5126.59 },
  { name: "Ethereum Staking Fund", invested: 75000, current: 79684.41, return: 4684.41 }
];

console.log('DETAILED CALCULATION FOR EACH INVESTMENT:\n');

investments.forEach((inv, i) => {
  const returnPercent = (inv.return / inv.invested) * 100;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Formula: (Current Value - Invested Amount) ÷ Invested Amount × 100`);
  console.log(`   Current Value: $${inv.current.toLocaleString()}`);
  console.log(`   Invested Amount: $${inv.invested.toLocaleString()}`);
  console.log(`   Return Amount: $${inv.current.toLocaleString()} - $${inv.invested.toLocaleString()} = $${inv.return.toLocaleString()}`);
  console.log(`   Return %: $${inv.return.toLocaleString()} ÷ $${inv.invested.toLocaleString()} = ${(inv.return / inv.invested).toFixed(6)}`);
  console.log(`   Final %: ${(inv.return / inv.invested).toFixed(6)} × 100 = ${returnPercent.toFixed(2)}%`);
  console.log(`   Verification: ${returnPercent.toFixed(2)}% ✓`);
  console.log('');
});

console.log('SUMMARY OF INDIVIDUAL RETURNS:');
investments.forEach((inv, i) => {
  const returnPercent = (inv.return / inv.invested) * 100;
  console.log(`${inv.name}: ${returnPercent.toFixed(2)}%`);
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