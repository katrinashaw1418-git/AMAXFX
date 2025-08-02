// Term Expiry Value Discrepancy Analysis
// User shows: $2,409,595 (+$559,595) which doesn't match table calculations

console.log('=== TERM EXPIRY VALUE DISCREPANCY ANALYSIS ===');

// All investment data from database (should match what frontend calculates)
const portfolioInvestments = [
  { product: 'RE Equity', invested: 600000, irr: 0.104, termYears: 4.25 },
  { product: 'RE Credit', invested: 175000, irr: 0.11, termYears: 0.85 },
  { product: 'RE Mortgage', invested: 325000, irr: 0.09, termYears: 0.78 },
  { product: 'Corp Credit', invested: 750000, irr: 0.11, termYears: 2.5 },
  { product: 'Security Credit', invested: 125000, irr: 0.135, termYears: 2.875 },
  { product: 'VC Fund', invested: 200000, irr: 0.18, termYears: 6.0 }
];

console.log('INDIVIDUAL PRODUCT TERM EXPIRY CALCULATIONS:');

let totalInvested = 0;
let totalTermExpiryValue = 0;

portfolioInvestments.forEach(investment => {
  const termExpiryGrowthFactor = Math.pow(1 + investment.irr, investment.termYears);
  const termExpiryValue = Math.floor(investment.invested * termExpiryGrowthFactor);
  const termExpiryReturn = Math.floor(termExpiryValue - investment.invested);
  
  console.log(`${investment.product}:`);
  console.log(`  Invested: $${investment.invested.toLocaleString()}`);
  console.log(`  Growth Factor: (1 + ${investment.irr})^${investment.termYears} = ${termExpiryGrowthFactor.toFixed(6)}`);
  console.log(`  Term Expiry Value: $${termExpiryValue.toLocaleString()}`);
  console.log(`  Term Expiry Return: +$${termExpiryReturn.toLocaleString()}`);
  console.log('');
  
  totalInvested += investment.invested;
  totalTermExpiryValue += termExpiryValue;
});

const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
const totalReturnPercent = (totalTermExpiryReturn / totalInvested) * 100;

console.log('=== TOTAL PORTFOLIO TERM EXPIRY ===');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`Total Term Expiry Return: +$${totalTermExpiryReturn.toLocaleString()}`);
console.log(`Total Return Percentage: ${totalReturnPercent.toFixed(1)}%`);

console.log('\n=== COMPARISON WITH USER\'S DISPLAYED VALUES ===');
console.log(`User Shows: $2,409,595 (+$559,595) at 30.2%`);
console.log(`Calculated: $${totalTermExpiryValue.toLocaleString()} (+$${totalTermExpiryReturn.toLocaleString()}) at ${totalReturnPercent.toFixed(1)}%`);

const discrepancy = Math.abs(2409595 - totalTermExpiryValue);
console.log(`Discrepancy: $${discrepancy.toLocaleString()}`);

if (discrepancy > 0) {
  console.log('\n=== POSSIBLE CAUSES OF DISCREPANCY ===');
  console.log('1. Frontend may be using different investment amounts than database');
  console.log('2. Frontend may be using different IRR values');
  console.log('3. Frontend may be using different term lengths');
  console.log('4. Frontend may have different rounding/calculation logic');
  console.log('5. Database may have additional investments not included in calculation');
}

// Check if it matches the $1,850,000 investment total we expect
console.log('\n=== INVESTMENT TOTAL VERIFICATION ===');
console.log(`Expected Total Investment: $1,850,000`);
console.log(`Calculated Total Investment: $${totalInvested.toLocaleString()}`);
console.log(`Match: ${totalInvested === 1850000 ? '✓' : '✗'}`);

// Calculate what the term expiry should be for $1,850,000
if (totalInvested === 1850000) {
  console.log('\n=== CORRECT TERM EXPIRY FOR $1,850,000 PORTFOLIO ===');
  console.log(`This matches the Performance by Period and Return by Period tables`);
} else {
  console.log('\n=== INVESTIGATING MISMATCH ===');
  console.log(`The investment total doesn't match expected $1,850,000`);
  console.log(`Need to check what the frontend Investment Breakdown is actually calculating`);
}