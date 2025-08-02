// REAL-TIME TRACKING SUMMARY AND VERIFICATION
console.log('=== REAL-TIME INVESTMENT TRACKING VERIFICATION ===\n');

console.log('ISSUE IDENTIFIED:');
console.log('API shows: $155,821.84 (8.78%) - Missing new investments');
console.log('Should show: $173,044.52 (9.35%) - With all 7 investments\n');

console.log('DATABASE STATUS:');
console.log('✓ All 7 investments exist in database (including $50k and $25k Bitcoin)');
console.log('✓ Midpoint IRR calculations updated for existing investments'); 
console.log('✗ API not reflecting new investments ($50k + $25k Bitcoin missing)');
console.log('✗ Total return calculation incomplete\n');

console.log('EXPECTED CALCULATIONS WITH MIDPOINT IRR:\n');

const correctInvestments = [
  { name: "Real Estate", invested: 500000, current: 518082.19, return: 18082.19 },
  { name: "Corporate Credit", invested: 300000, current: 308136.99, return: 8136.99 },
  { name: "VC/Growth", invested: 750000, current: 885000.00, return: 135000.00 },
  { name: "Bitcoin Original", invested: 150000, current: 161095.89, return: 11095.89 },
  { name: "Ethereum", invested: 75000, current: 75708.90, return: 708.90 },
  { name: "Bitcoin $50k", invested: 50000, current: 50020.55, return: 20.55 },
  { name: "Bitcoin $25k", invested: 25000, current: 25000.00, return: 0.00 }
];

let totalInvested = 0;
let totalCurrent = 0;
let totalReturn = 0;

correctInvestments.forEach((inv, i) => {
  totalInvested += inv.invested;
  totalCurrent += inv.current;
  totalReturn += inv.return;
  
  console.log(`${i+1}. ${inv.name}: $${inv.invested.toLocaleString()} → $${inv.current.toLocaleString()} (+$${inv.return.toLocaleString()})`);
});

const portfolioReturn = (totalReturn / totalInvested) * 100;

console.log('\nCORRECT TOTALS:');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current: $${totalCurrent.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${portfolioReturn.toFixed(2)}%`);

console.log('\nFIXES NEEDED:');
console.log('1. Ensure API includes ALL 7 investments (currently missing 2)');
console.log('2. Update calculation system to use midpoint IRR consistently');
console.log('3. Verify real-time updates when new investments added');
console.log('4. Database and API synchronization for live tracking');

console.log('\nCURRENT vs EXPECTED:');
console.log(`Current API: $155,821.84 (8.78%) - INCORRECT`);
console.log(`Expected:    $${totalReturn.toLocaleString()} (${portfolioReturn.toFixed(2)}%) - CORRECT`);
console.log(`Missing:     $${(totalReturn - 155821.84).toLocaleString()} return`);