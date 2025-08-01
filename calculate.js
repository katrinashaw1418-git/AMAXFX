// Manual calculation based on individual investments
const individualInvestments = [
  { invested: 150000, current: 513150.68 },  // Bitcoin Tracker
  { invested: 300000, current: 303698.63 },  // Real Estate 
  { invested: 750000, current: 920856.41 },  // Web3 Innovation
  { invested: 175000, current: 157334.06 },  // Ethereum Staking
  { invested: 400000, current: 79539.03 },   // Corporate Credit
];

const totalInvested = individualInvestments.reduce((sum, inv) => sum + inv.invested, 0);
const totalCurrent = individualInvestments.reduce((sum, inv) => sum + inv.current, 0);
const totalReturn = totalCurrent - totalInvested;
const returnPercent = (totalReturn / totalInvested) * 100;

console.log('EXPECTED CALCULATION:');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Return Percent: ${returnPercent.toFixed(2)}%`);

console.log('\nBUT CHART SHOWS:');
console.log('Total Return: $163,879 (+9.23%)');
console.log('\nDISCREPANCY:');
console.log(`Expected: $${totalReturn.toLocaleString()} (${returnPercent.toFixed(2)}%)`);
console.log(`Chart Shows: $163,879 (9.23%)`);
console.log(`Difference: $${(totalReturn - 163879).toLocaleString()}`);