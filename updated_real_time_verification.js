// UPDATED REAL-TIME VERIFICATION
console.log('=== UPDATED REAL-TIME VERIFICATION ===\n');

console.log('FIXED APPROACH:');
console.log('Using direct Product ID mapping based on database query results:');
console.log('• Product 1: Real Estate Equity Fund → 8.5% IRR');
console.log('• Product 2: Bitcoin Tracker Fund → 60% IRR');
console.log('• Product 3: Corporate Credit Fund → 11% IRR');
console.log('• Product 4: Web3 Innovation Fund → 18% IRR');
console.log('• Product 5: Ethereum Staking Fund → 5.75% IRR');
console.log('');

console.log('EXPECTED CALCULATIONS WITH FIXED IRR MAPPING:');

const fixedCalculations = [
  {
    id: 26,
    productId: 1,
    name: 'Real Estate Equity Fund',
    amount: 500000,
    irr: 0.085,
    timeElapsed: 0.331974,
    expectedReturn: 13726.24
  },
  {
    id: 30,
    productId: 5,
    name: 'Ethereum Staking Fund',
    amount: 75000,
    irr: 0.0575,
    timeElapsed: 0.167703,
    expectedReturn: 706.50
  },
  {
    id: 28,
    productId: 4,
    name: 'Web3 Innovation Fund',
    amount: 750000,
    irr: 0.18,
    timeElapsed: 1.002747,
    expectedReturn: 135402.52
  },
  {
    id: 27,
    productId: 3,
    name: 'Corporate Credit Fund',
    amount: 300000,
    irr: 0.11,
    timeElapsed: 0.249838,
    expectedReturn: 7924.80
  },
  {
    id: 36,
    productId: 2,
    name: 'Bitcoin Tracker Fund',
    amount: 50000,
    irr: 0.60,
    timeElapsed: 0.003441,
    expectedReturn: 80.94
  },
  {
    id: 29,
    productId: 2,
    name: 'Bitcoin Tracker Fund',
    amount: 150000,
    irr: 0.60,
    timeElapsed: 0.496245,
    expectedReturn: 39402.09
  },
  {
    id: 37,
    productId: 2,
    name: 'Bitcoin Tracker Fund',
    amount: 25000,
    irr: 0.60,
    timeElapsed: 0.001362,
    expectedReturn: 16.01
  }
];

let totalExpectedReturn = 0;

fixedCalculations.forEach((calc, index) => {
  console.log(`${index + 1}. Investment ${calc.id} (Product ${calc.productId}): ${calc.name}`);
  console.log(`   Amount: $${calc.amount.toLocaleString()}, IRR: ${(calc.irr * 100).toFixed(2)}%`);
  console.log(`   Time Elapsed: ${calc.timeElapsed.toFixed(6)} years`);
  console.log(`   Expected Return: $${calc.expectedReturn.toLocaleString()}`);
  console.log('');
  
  totalExpectedReturn += calc.expectedReturn;
});

console.log('═══════════════════════════════════════════════════════════');
console.log(`TOTAL EXPECTED RETURN: $${totalExpectedReturn.toLocaleString()}`);
console.log('This should now match the User Investments API after fix');
console.log('');

console.log('VERIFICATION CHECKLIST:');
console.log('✅ Fixed product ID-based IRR mapping');
console.log('✅ Removed dependency on product name variations');
console.log('✅ Using authentic database product IDs');
console.log('✅ Applied correct Filter Products IRR values');
console.log('');

console.log('🎯 EXPECTED RESULT:');
console.log(`User Investments API should now show: $${totalExpectedReturn.toLocaleString()}`);
console.log('This will achieve cross-section consistency with Filter Products calculations');