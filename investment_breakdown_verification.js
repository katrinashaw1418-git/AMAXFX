// Investment Breakdown Frontend vs Database Comparison
// Investigating why Term Expiry shows $2,409,595 instead of calculated $3,145,836

console.log('=== INVESTMENT BREAKDOWN DISCREPANCY INVESTIGATION ===');

// Database investment amounts (actual data)
const databaseInvestments = {
  'Real Estate Equity Fund': 600000,    // RE Equity 
  'Real Estate Credit Fund': 175000,    // RE Credit
  'Real Estate Mortgage Fund': 325000,  // RE Mortgage  
  'Corporate Credit Fund': 750000,      // Corp Credit (updated from 450k)
  'Security Credit Fund': 125000,       // Security Credit
  'Venture Capital Fund': 200000        // VC Fund
};

// Frontend expected amounts (what tables show)
const frontendExpected = {
  'Real Estate Equity Fund': 600000,    // Same
  'Real Estate Credit Fund': 175000,    // Same
  'Real Estate Mortgage Fund': 325000,  // Same
  'Corporate Credit Fund': 450000,      // Different! Frontend expects 450k but DB has 750k
  'Security Credit Fund': 125000,       // Same
  'Venture Capital Fund': 200000        // Same
};

console.log('DATABASE vs FRONTEND INVESTMENT AMOUNTS:');
Object.keys(databaseInvestments).forEach(product => {
  const dbAmount = databaseInvestments[product];
  const frontendAmount = frontendExpected[product];
  const match = dbAmount === frontendAmount;
  
  console.log(`${product}:`);
  console.log(`  Database: $${dbAmount.toLocaleString()}`);
  console.log(`  Frontend Expected: $${frontendAmount.toLocaleString()}`);
  console.log(`  Match: ${match ? '✓' : '✗ MISMATCH'}`);
  if (!match) {
    console.log(`  Difference: $${Math.abs(dbAmount - frontendAmount).toLocaleString()}`);
  }
  console.log('');
});

const dbTotal = Object.values(databaseInvestments).reduce((sum, amount) => sum + amount, 0);
const frontendTotal = Object.values(frontendExpected).reduce((sum, amount) => sum + amount, 0);

console.log('=== TOTALS ===');
console.log(`Database Total: $${dbTotal.toLocaleString()}`);
console.log(`Frontend Expected Total: $${frontendTotal.toLocaleString()}`);
console.log(`Difference: $${Math.abs(dbTotal - frontendTotal).toLocaleString()}`);

// Calculate term expiry with frontend expected amounts
console.log('\n=== TERM EXPIRY WITH FRONTEND EXPECTED AMOUNTS ===');

const irrMappings = {
  'Real Estate Equity Fund': { irr: 0.104, termYears: 4.25 },
  'Real Estate Credit Fund': { irr: 0.11, termYears: 0.85 },
  'Real Estate Mortgage Fund': { irr: 0.09, termYears: 0.78 },
  'Corporate Credit Fund': { irr: 0.11, termYears: 2.5 },
  'Security Credit Fund': { irr: 0.135, termYears: 2.875 },
  'Venture Capital Fund': { irr: 0.18, termYears: 6.0 }
};

let frontendTermExpiryTotal = 0;

Object.keys(frontendExpected).forEach(product => {
  const invested = frontendExpected[product];
  const { irr, termYears } = irrMappings[product];
  const termExpiryGrowthFactor = Math.pow(1 + irr, termYears);
  const termExpiryValue = Math.floor(invested * termExpiryGrowthFactor);
  
  console.log(`${product}: $${invested.toLocaleString()} → $${termExpiryValue.toLocaleString()}`);
  frontendTermExpiryTotal += termExpiryValue;
});

const frontendTermExpiryReturn = frontendTermExpiryTotal - frontendTotal;
console.log(`\nFrontend Expected Term Expiry: $${frontendTermExpiryTotal.toLocaleString()} (+$${frontendTermExpiryReturn.toLocaleString()})`);
console.log(`User Shows: $2,409,595 (+$559,595)`);
console.log(`Match: ${frontendTermExpiryTotal === 2409595 ? '✓ PERFECT MATCH' : '✗ Still different'}`);

console.log('\n=== ROOT CAUSE ===');
console.log('The Investment Breakdown component is using the userInvestments API data,');
console.log('which shows $750,000 for Corporate Credit Fund instead of expected $450,000.');
console.log('This creates inconsistency between:');
console.log('1. Investment Breakdown (uses actual DB amounts)');
console.log('2. Performance by Period tables (uses expected amounts)');
console.log('3. Return by Period tables (uses expected amounts)');

console.log('\n=== SOLUTION NEEDED ===');
console.log('Either:');
console.log('A) Update all tables to use actual $750,000 Corporate Credit amount, OR');
console.log('B) Update database to have $450,000 Corporate Credit amount to match tables');