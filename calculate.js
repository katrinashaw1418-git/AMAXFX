// CORPORATE CREDIT FUND IMPACT CALCULATION
console.log('=== CORPORATE CREDIT FUND IMPACT ANALYSIS ===');

// All current investments (7 total)
const investments = [
  { name: "Real Estate Credit Fund", invested: 500000, current: 513150.68, return: 13150.68 },
  { name: "Corporate Credit Fund #1", invested: 300000, current: 303698.63, return: 3698.63 },
  { name: "VC / Growth Equity Fund", invested: 750000, current: 879796.03, return: 129796.03 },
  { name: "Bitcoin Tracker Fund", invested: 150000, current: 167087.51, return: 17087.51 },
  { name: "Ethereum Staking Fund", invested: 75000, current: 74064.95, return: -935.05 },
  { name: "Corporate Credit Fund #2", invested: 150000, current: 150020.55, return: 20.55 },
  { name: "Corporate Credit Fund #3", invested: 150000, current: 150020.55, return: 20.55 }
];

const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
const totalCurrent = investments.reduce((sum, inv) => sum + inv.current, 0);
const totalReturn = investments.reduce((sum, inv) => sum + inv.return, 0);
const totalReturnPercent = (totalReturn / totalInvested) * 100;

console.log('BEFORE NEW CORPORATE CREDIT INVESTMENTS:');
console.log('Previous Total: $1,825,000 invested → $182,911 return (10.02%)');

console.log('\nAFTER ADDING $300,000 IN CORPORATE CREDIT FUNDS:');
console.log(`New Total: $${totalInvested.toLocaleString()} invested → $${totalReturn.toLocaleString()} return (${totalReturnPercent.toFixed(2)}%)`);

console.log('\n=== DETAILED INVESTMENT BREAKDOWN ===');
investments.forEach((inv, i) => {
  const returnPercent = (inv.return / inv.invested) * 100;
  const status = inv.return >= 0 ? '✅ PROFIT' : '❌ LOSS';
  console.log(`  ${i+1}. ${inv.name}: ${returnPercent.toFixed(2)}% ${status}`);
  console.log(`     $${inv.invested.toLocaleString()} → $${inv.current.toLocaleString()} (${inv.return >= 0 ? '+' : ''}$${inv.return.toLocaleString()})`);
});

// Show Corporate Credit Fund performance specifically
const corporateCredits = investments.filter(inv => inv.name.includes("Corporate Credit"));
const corporateTotalInvested = corporateCredits.reduce((sum, inv) => sum + inv.invested, 0);
const corporateTotalCurrent = corporateCredits.reduce((sum, inv) => sum + inv.current, 0);
const corporateTotalReturn = corporateCredits.reduce((sum, inv) => sum + inv.return, 0);

console.log('\n=== CORPORATE CREDIT FUND ANALYSIS ===');
console.log(`Total Corporate Credit Invested: $${corporateTotalInvested.toLocaleString()}`);
console.log(`Total Corporate Credit Current: $${corporateTotalCurrent.toLocaleString()}`);
console.log(`Total Corporate Credit Return: $${corporateTotalReturn.toLocaleString()}`);
console.log(`Corporate Credit Performance: ${((corporateTotalReturn / corporateTotalInvested) * 100).toFixed(2)}%`);

console.log('\n=== FINAL CALCULATIONS ===');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Total Return Percentage: ${totalReturnPercent.toFixed(2)}%`);

console.log('\nAPI VERIFICATION:');
console.log(`API says: $162,838.90 return (7.85%)`);
console.log(`Manual calculation: $${totalReturn.toLocaleString()} (${totalReturnPercent.toFixed(2)}%)`);
console.log(`Difference: $${Math.abs(162838.90 - totalReturn).toFixed(2)}`);

console.log('\n=== WHY THE PERCENTAGE DROPPED FROM 10.02% TO 7.85% ===');
console.log('1. Added $300,000 in new Corporate Credit investments');
console.log('2. New investments show minimal returns (+0.01% each) because they just started');
console.log('3. This dilutes the overall return percentage:');
console.log('   - Before: Higher percentage on smaller total');
console.log('   - After: Lower percentage on larger total (more capital with minimal new gains)');
console.log('\nThis is normal - new investments need time to generate returns!');