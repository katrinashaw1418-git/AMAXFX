// UPDATED PORTFOLIO PERFORMANCE WITH 60% BITCOIN MARKET-BASED RETURNS
console.log('=== PORTFOLIO PERFORMANCE WITH MARKET-BASED BITCOIN RETURNS ===\n');

// Calculate total from actual API returns
const apiReturns = [
  { name: "Real Estate Credit Fund", invested: 500000, current: 518082.19, return: 18082.19, percent: 3.62 },
  { name: "Corporate Credit Fund", invested: 300000, current: 308136.99, return: 8136.99, percent: 2.71 },
  { name: "VC/Growth Equity Fund", invested: 750000, current: 872303.79, return: 122303.79, percent: 16.31 },
  { name: "Bitcoin Tracker Fund", invested: 150000, current: 189877.64, return: 39877.64, percent: 26.59 },
  { name: "Ethereum Staking Fund", invested: 75000, current: 75708.90, return: 708.90, percent: 0.95 }
];

let totalInvested = 0;
let totalCurrent = 0;
let totalReturn = 0;

console.log('INDIVIDUAL INVESTMENT PERFORMANCE:\n');
apiReturns.forEach((inv, i) => {
  totalInvested += inv.invested;
  totalCurrent += inv.current;
  totalReturn += inv.return;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Invested: $${inv.invested.toLocaleString()}`);
  console.log(`   Current: $${inv.current.toLocaleString()}`);
  console.log(`   Return: $${inv.return.toLocaleString()} (${inv.percent}%)`);
  console.log('');
});

const portfolioReturnPercent = (totalReturn / totalInvested) * 100;

console.log('UPDATED PORTFOLIO TOTALS:\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);

console.log('\nBEFORE vs AFTER COMPARISON:\n');
console.log('BEFORE (15% Bitcoin midpoint IRR):');
console.log('  • Total Return: $155,821.84 (8.78%)');
console.log('  • Bitcoin Return: $6,589.97 (4.39%)');
console.log('');
console.log('AFTER (60% Bitcoin market-based):');
console.log(`  • Total Return: $${totalReturn.toLocaleString()} (${portfolioReturnPercent.toFixed(2)}%)`);
console.log(`  • Bitcoin Return: $39,877.64 (26.59%)`);
console.log('');
console.log('IMPROVEMENT:');
console.log(`  • Additional Return: $${(totalReturn - 155821.84).toLocaleString()}`);
console.log(`  • Percentage Increase: ${(portfolioReturnPercent - 8.78).toFixed(2)} percentage points`);
console.log(`  • Bitcoin Contribution: $${(39877.64 - 6589.97).toLocaleString()} additional from Bitcoin alone`);

console.log('\nMETHODOLOGY UPDATE:\n');
console.log('✓ Bitcoin Tracker Fund: 60% annualized (market-based historical performance)');
console.log('✓ Real Estate Credit Fund: 11% midpoint IRR');
console.log('✓ Corporate Credit Fund: 11% midpoint IRR');  
console.log('✓ VC/Growth Equity Fund: 18% midpoint IRR');
console.log('✓ Ethereum Staking Fund: 5.75% midpoint IRR');
console.log('✓ Time-based calculations with volatility adjustments');
console.log('✓ Reflects realistic market performance vs conservative estimates');