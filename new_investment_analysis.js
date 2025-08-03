// ANALYSIS: New Bitcoin Investment Impact on Portfolio
console.log('=== NEW BITCOIN INVESTMENT IMPACT ANALYSIS ===\n');

// Current investments after new $50k Bitcoin investment
const investments = [
  { name: "Real Estate Credit Fund", invested: 500000, return: 18082.19, percent: 3.62 },
  { name: "Corporate Credit Fund", invested: 300000, return: 8136.99, percent: 2.71 },
  { name: "VC/Growth Equity Fund", invested: 750000, return: 122303.79, percent: 16.31 },
  { name: "Bitcoin Tracker Fund (Original)", invested: 150000, return: 39877.64, percent: 26.59 },
  { name: "Ethereum Staking Fund", invested: 75000, return: 708.90, percent: 0.95 },
  { name: "Bitcoin Tracker Fund (NEW)", invested: 50000, return: 0.00, percent: 0.00 } // Just invested today
];

console.log('CURRENT PORTFOLIO BREAKDOWN:\n');

let totalInvested = 0;
let totalCurrent = 0;
let totalReturn = 0;

investments.forEach((inv, i) => {
  const currentValue = inv.invested + inv.return;
  totalInvested += inv.invested;
  totalCurrent += currentValue;
  totalReturn += inv.return;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Invested: $${inv.invested.toLocaleString()}`);
  console.log(`   Current: $${currentValue.toLocaleString()}`);
  console.log(`   Return: $${inv.return.toLocaleString()} (${inv.percent}%)`);
  console.log('');
});

const portfolioReturnPercent = (totalReturn / totalInvested) * 100;

console.log('NEW PORTFOLIO TOTALS:\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);

console.log('\nIMPACT ANALYSIS:\n');
console.log('BEFORE New Investment:');
console.log('  • Total Invested: $1,775,000');
console.log('  • Total Return: $189,109.51');
console.log('  • Portfolio Return: 10.65%');
console.log('');
console.log('AFTER New Investment:');
console.log(`  • Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`  • Total Return: $${totalReturn.toLocaleString()}`);
console.log(`  • Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);
console.log('');
console.log('MATHEMATICAL EXPLANATION:');
console.log('When you add new money to the portfolio with 0% initial return,');
console.log('the total return stays the same but gets divided by a larger invested amount.');
console.log('');
console.log(`Formula: Portfolio Return % = Total Return ÷ Total Invested × 100`);
console.log(`New calculation: $189,109.51 ÷ $${totalInvested.toLocaleString()} × 100 = ${portfolioReturnPercent.toFixed(2)}%`);
console.log('');
console.log('EXPECTED BEHAVIOR:');
console.log('✓ Total return amount stays the same: $189,109.51');
console.log('✓ Portfolio percentage decreases due to dilution effect');
console.log('✓ New Bitcoin investment will generate returns over time');
console.log('✓ Future portfolio returns will increase as new investment gains value');

console.log('\nDATA INTEGRITY ISSUE:');
console.log('⚠️  Database shows duplicate ID (id: 1) for two different investments');
console.log('⚠️  This can cause calculation conflicts and data inconsistency');
console.log('⚠️  Need to fix the auto-increment ID issue in the database');