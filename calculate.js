// Calculation check after new Bitcoin fund investment
console.log('=== AFTER NEW BITCOIN INVESTMENT ===');

// Current individual investments (6 total now)
const investments = [
  { name: "Real Estate Credit Fund", invested: 500000, current: 513150.68, return: 13150.68 },
  { name: "Corporate Credit Fund", invested: 300000, current: 303698.63, return: 3698.63 },
  { name: "VC / Growth Equity Fund", invested: 750000, current: 901250.22, return: 151250.22 },
  { name: "Bitcoin Tracker Fund (Old)", invested: 150000, current: 163721.61, return: 13721.61 },
  { name: "Ethereum Staking Fund", invested: 75000, current: 76793.39, return: 1793.39 },
  { name: "Bitcoin Tracker Fund (New)", invested: 25000, current: 24752.82, return: -247.18 }
];

const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
const totalCurrent = investments.reduce((sum, inv) => sum + inv.current, 0);
const totalReturn = investments.reduce((sum, inv) => sum + inv.return, 0);
const totalReturnPercent = (totalReturn / totalInvested) * 100;

console.log('INDIVIDUAL INVESTMENTS:');
investments.forEach((inv, i) => {
  const returnPercent = (inv.return / inv.invested) * 100;
  console.log(`  ${i+1}. ${inv.name}`);
  console.log(`     Invested: $${inv.invested.toLocaleString()}`);
  console.log(`     Current: $${inv.current.toLocaleString()}`);
  console.log(`     Return: $${inv.return.toLocaleString()} (${returnPercent.toFixed(2)}%)`);
});

console.log('\n=== TOTALS ===');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Total Return %: ${totalReturnPercent.toFixed(2)}%`);

console.log('\n=== API COMPARISON ===');
console.log(`API says total return: $183,367.35 (10.19%)`);
console.log(`Manual calculation: $${totalReturn.toLocaleString()} (${totalReturnPercent.toFixed(2)}%)`);
console.log(`Difference: $${Math.abs(183367.35 - totalReturn).toFixed(2)} ${Math.abs(183367.35 - totalReturn) < 1 ? '✅' : '❌'}`);

// Check if Bitcoin investments show correctly
const bitcoinInvestments = investments.filter(inv => inv.name.includes("Bitcoin"));
const bitcoinTotal = bitcoinInvestments.reduce((sum, inv) => sum + inv.current, 0);
console.log(`\nBitcoin Fund Total: $${bitcoinTotal.toLocaleString()}`);
console.log(`API Digital Assets: $265,267.82`);
console.log(`Bitcoin vs API: $${Math.abs(265267.82 - bitcoinTotal).toFixed(2)} ${Math.abs(265267.82 - bitcoinTotal) < 1 ? '✅' : '❌'}`);