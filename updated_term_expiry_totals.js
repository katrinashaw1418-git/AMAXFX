// UPDATED TERM EXPIRY PORTFOLIO TOTALS CALCULATION
console.log('=== PORTFOLIO TERM EXPIRY TOTALS VERIFICATION ===\n');

// Investment mapping using actual database amounts and corrected product terms
const productTerms = {
  1: { name: 'Real Estate Equity Fund', termYears: 4.25, irr: 0.104 },
  2: { name: 'Real Estate Credit Fund', termYears: 0.85, irr: 0.11 },
  3: { name: 'Real Estate First Mortgage Fund', termYears: 0.78, irr: 0.09 },
  4: { name: 'Cash Flow-Based Corporate Credit Fund', termYears: 2.5, irr: 0.11 },
  5: { name: 'Security-Backed Corporate Credit Fund', termYears: 2.875, irr: 0.135 }
};

const userInvestments = [
  { id: 26, productId: 1, amount: 500000.00 },
  { id: 27, productId: 3, amount: 300000.00 },
  { id: 28, productId: 4, amount: 750000.00 },
  { id: 29, productId: 2, amount: 150000.00 },
  { id: 30, productId: 5, amount: 75000.00 },
  { id: 36, productId: 2, amount: 50000.00 },
  { id: 37, productId: 2, amount: 25000.00 }
];

console.log('📊 CORRECTED TERM EXPIRY CALCULATIONS:');
console.log('════════════════════════════════════════');

let totalInvested = 0;
let totalTermExpiryValue = 0;

userInvestments.forEach(investment => {
  const product = productTerms[investment.productId];
  if (product) {
    const termExpiryGrowthFactor = Math.pow(1 + product.irr, product.termYears);
    const termExpiryValue = investment.amount * termExpiryGrowthFactor;
    
    totalInvested += investment.amount;
    totalTermExpiryValue += termExpiryValue;
    
    console.log(`${product.name}:`);
    console.log(`  Investment: $${investment.amount.toLocaleString()}`);
    console.log(`  Term: ${product.termYears} years @ ${(product.irr * 100).toFixed(1)}%`);
    console.log(`  Growth Factor: ${termExpiryGrowthFactor.toFixed(6)}`);
    console.log(`  Value at Expiry: $${termExpiryValue.toFixed(2)}`);
    console.log(`  Return: $${(termExpiryValue - investment.amount).toFixed(2)}`);
    console.log('');
  }
});

const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
const totalTermExpiryPercent = (totalTermExpiryReturn / totalInvested) * 100;

console.log('🏆 PORTFOLIO TERM EXPIRY TOTALS:');
console.log('═══════════════════════════════════════');
console.log(`Total Portfolio Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Value at Term Expiry: $${totalTermExpiryValue.toFixed(2)}`);
console.log(`Total Expected Return: $${totalTermExpiryReturn.toFixed(2)}`);
console.log(`Portfolio Return at Term Expiry: ${totalTermExpiryPercent.toFixed(2)}%`);

console.log('\n📝 SUMMARY FOR DASHBOARD:');
console.log('══════════════════════════════════════');
console.log(`• Current Portfolio: $${totalInvested.toLocaleString()} invested`);
console.log(`• Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`• Expected Return: +$${totalTermExpiryReturn.toFixed(0)} (${totalTermExpiryPercent.toFixed(1)}%)`);
console.log('• Based on actual product terms (not 7-year projections)');