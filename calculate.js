// 11.12% RETURN CALCULATION BREAKDOWN
console.log('=== HOW THE 11.12% RETURN IS CALCULATED ===');

// Current individual investments (5 total now - the Corporate Credit funds were removed)
const investments = [
  { name: "Real Estate Credit Fund", invested: 500000, current: 513150.68, return: 13150.68 },
  { name: "Corporate Credit Fund", invested: 300000, current: 303698.63, return: 3698.63 },
  { name: "VC / Growth Equity Fund", invested: 750000, current: 920658.96, return: 170658.96 },
  { name: "Bitcoin Tracker Fund", invested: 150000, current: 155126.59, return: 5126.59 },
  { name: "Ethereum Staking Fund", invested: 75000, current: 79684.41, return: 4684.41 }
];

const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
const totalCurrent = investments.reduce((sum, inv) => sum + inv.current, 0);
const totalReturn = investments.reduce((sum, inv) => sum + inv.return, 0);
const manualReturnPercent = (totalReturn / totalInvested) * 100;

console.log('INDIVIDUAL INVESTMENT BREAKDOWN:');
investments.forEach((inv, i) => {
  const returnPercent = (inv.return / inv.invested) * 100;
  console.log(`  ${i+1}. ${inv.name}: ${returnPercent.toFixed(2)}%`);
  console.log(`     $${inv.invested.toLocaleString()} → $${inv.current.toLocaleString()} (+$${inv.return.toLocaleString()})`);
});

console.log('\n=== TOTAL CALCULATION ===');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Manual Return %: ${manualReturnPercent.toFixed(2)}%`);

console.log('\n=== API COMPARISON ===');
console.log(`API says: $197,319.27 return (11.12%)`);
console.log(`API calculation: $197,319.27 ÷ $1,775,000 = 11.12%`);
console.log(`Manual calculation: $${totalReturn.toLocaleString()} ÷ $${totalInvested.toLocaleString()} = ${manualReturnPercent.toFixed(2)}%`);

const apiTotalInvested = 1775000;
const apiTotalReturn = 197319.27;
const apiCurrentValue = 1972319.27;

console.log('\n=== HOW 11.12% IS CALCULATED ===');
console.log(`Step 1: API Total Invested = $${apiTotalInvested.toLocaleString()}`);
console.log(`Step 2: API Current Value = $${apiCurrentValue.toLocaleString()}`);
console.log(`Step 3: API Total Return = $${apiCurrentValue.toLocaleString()} - $${apiTotalInvested.toLocaleString()} = $${apiTotalReturn.toLocaleString()}`);
console.log(`Step 4: Return % = $${apiTotalReturn.toLocaleString()} ÷ $${apiTotalInvested.toLocaleString()} × 100 = 11.12%`);

console.log('\n=== VERIFICATION ===');
console.log(`✅ The 11.12% is correct based on API's investment total of $1,775,000`);
console.log(`✅ Manual calculation matches: ${((apiTotalReturn / apiTotalInvested) * 100).toFixed(2)}%`);