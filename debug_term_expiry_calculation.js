// DEBUG TERM EXPIRY CALCULATION
console.log('=== DEBUG TERM EXPIRY CALCULATION ===\n');

// Get actual investment data from API
const investments = [
  { productId: 4, amount: 750000, name: 'Web3 Innovation Fund' },
  { productId: 2, amount: 25000, name: 'Bitcoin Tracker Fund' }, 
  { productId: 1, amount: 500000, name: 'Real Estate Equity Fund' },
  { productId: 3, amount: 300000, name: 'Corporate Credit Fund' },
  { productId: 2, amount: 150000, name: 'Bitcoin Tracker Fund' },
  { productId: 5, amount: 75000, name: 'Ethereum Staking Fund' },
  { productId: 2, amount: 50000, name: 'Bitcoin Tracker Fund' }
];

const productMapping = {
  1: { irr: 0.085, term: 2.0 },   // Real Estate Equity
  2: { irr: 0.60, term: 1.0 },    // Bitcoin Tracker  
  3: { irr: 0.11, term: 1.5 },    // Corporate Credit
  4: { irr: 0.18, term: 4.0 },    // Web3 Innovation
  5: { irr: 0.0575, term: 2.0 }   // Ethereum Staking
};

let totalInvested = 0;
let totalTermExpiry = 0;

console.log('ACTUAL API DATA CALCULATIONS:');
investments.forEach((inv, index) => {
  const product = productMapping[inv.productId];
  const termExpiryValue = inv.amount * Math.pow(1 + product.irr, product.term);
  const termReturn = termExpiryValue - inv.amount;
  
  totalInvested += inv.amount;
  totalTermExpiry += termExpiryValue;
  
  console.log(`${index + 1}. ${inv.name}: $${inv.amount.toLocaleString()} → $${Math.round(termExpiryValue).toLocaleString()} (+$${Math.round(termReturn).toLocaleString()})`);
});

const totalReturn = totalTermExpiry - totalInvested;
const returnPercent = (totalReturn / totalInvested) * 100;

console.log('\nCORRECT TOTALS WITH ACTUAL DATA:');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Term Expiry Value: $${Math.round(totalTermExpiry).toLocaleString()}`);
console.log(`Term Expiry Return: $${Math.round(totalReturn).toLocaleString()}`);
console.log(`Return Percentage: ${returnPercent.toFixed(1)}%`);
console.log('');

console.log('ISSUE ANALYSIS:');
if (returnPercent > 50) {
  console.log('❌ Return percentage is too high - suggests wrong calculation');
  console.log('❌ Dashboard showing 53.4% but should be lower');
  console.log('❌ Frontend may be using wrong IRR mapping or old data');
} else {
  console.log('✅ Return percentage looks correct');
}

console.log('\nCONCLUSION:');
console.log(`Expected dashboard display: $${Math.round(totalTermExpiry).toLocaleString()} (+$${Math.round(totalReturn).toLocaleString()} at ${returnPercent.toFixed(1)}%)`);
console.log('If dashboard shows different values, frontend calculation is incorrect');