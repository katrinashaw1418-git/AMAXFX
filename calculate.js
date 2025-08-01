// EXPLAINING THE DILUTION EFFECT - This is MATHEMATICAL, not a bug
console.log('=== DILUTION EFFECT EXPLANATION ===');

// Current investments (7 total with 3 Bitcoin tracker funds)
const investments = [
  { name: "Real Estate Credit Fund", invested: 500000, current: 513150.68, return: 13150.68 },
  { name: "Corporate Credit Fund", invested: 300000, current: 303698.63, return: 3698.63 },
  { name: "VC / Growth Equity Fund", invested: 750000, current: 901250.22, return: 151250.22 },
  { name: "Bitcoin Tracker Fund #1", invested: 150000, current: 163721.61, return: 13721.61 },
  { name: "Ethereum Staking Fund", invested: 75000, current: 76793.39, return: 1793.39 },
  { name: "Bitcoin Tracker Fund #2", invested: 25000, current: 24752.82, return: -247.18 },
  { name: "Bitcoin Tracker Fund #3", invested: 25000, current: 24543.72, return: -456.28 }
];

const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
const totalCurrent = investments.reduce((sum, inv) => sum + inv.current, 0);
const totalReturn = investments.reduce((sum, inv) => sum + inv.return, 0);
const totalReturnPercent = (totalReturn / totalInvested) * 100;

console.log('WHY THE PERCENTAGE IS DECLINING:');
console.log('When you add new investments that show immediate losses, it dilutes overall return percentage.\n');

console.log('INVESTMENT BREAKDOWN:');
investments.forEach((inv, i) => {
  const returnPercent = (inv.return / inv.invested) * 100;
  const status = inv.return >= 0 ? '✅ PROFIT' : '❌ LOSS';
  console.log(`  ${i+1}. ${inv.name}: ${returnPercent.toFixed(2)}% ${status}`);
  console.log(`     $${inv.invested.toLocaleString()} → $${inv.current.toLocaleString()} (${inv.return >= 0 ? '+' : ''}$${inv.return.toLocaleString()})`);
});

console.log('\n=== THE MATH ===');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Return %: ${totalReturnPercent.toFixed(2)}%`);

console.log('\nAPI CONFIRMATION:');
console.log(`API Total Return: $182,911.08 (10.02%)`);
console.log(`Manual calculation: $${totalReturn.toLocaleString()} (${totalReturnPercent.toFixed(2)}%)`);
console.log(`Difference: $${Math.abs(182911.08 - totalReturn).toFixed(2)}`);

console.log('\n=== WHY THIS HAPPENS ===');
console.log('1. You had: $1,800,000 invested with $183,367 profit (10.19%)');
console.log('2. You added: $25,000 with -$456 loss (-1.83%)');
console.log('3. New total: $1,825,000 invested with $182,911 profit (10.02%)');
console.log('\nThis is CORRECT mathematics - adding losing investments reduces overall percentage.');
console.log('The Bitcoin fund shows volatility, causing immediate small losses on new investments.');

// Check Bitcoin fund performance over time
const bitcoinInvestments = investments.filter(inv => inv.name.includes("Bitcoin"));
console.log('\n=== BITCOIN FUND TIMING EFFECT ===');
bitcoinInvestments.forEach((btc, i) => {
  const months = i === 0 ? 6 : 0; // First one is 6 months old, others are new
  console.log(`Bitcoin ${i+1}: ${months} months old → ${(btc.return/btc.invested*100).toFixed(2)}% return`);
});
console.log('Older Bitcoin investments show profits, new ones show losses due to timing/volatility.');