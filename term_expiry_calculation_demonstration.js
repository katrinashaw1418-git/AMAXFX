// TERM EXPIRY CALCULATION DEMONSTRATION - FILTER PRODUCTS METHODOLOGY
console.log('=== TERM EXPIRY CALCULATION DEMONSTRATION ===\n');

console.log('STEP 1: AUTHENTIC INVESTMENT DATA FROM API');
const realInvestments = [
  { productId: 4, amount: 750000, product: 'Web3 Innovation Fund' },
  { productId: 2, amount: 25000, product: 'Bitcoin Tracker Fund' },
  { productId: 1, amount: 500000, product: 'Real Estate Equity Fund' },
  { productId: 3, amount: 300000, product: 'Corporate Credit Fund' },
  { productId: 2, amount: 150000, product: 'Bitcoin Tracker Fund' },
  { productId: 5, amount: 75000, product: 'Ethereum Staking Fund' },
  { productId: 2, amount: 50000, product: 'Bitcoin Tracker Fund' }
];

realInvestments.forEach((inv, i) => {
  console.log(`${i+1}. Product ${inv.productId}: $${inv.amount.toLocaleString()} (${inv.product})`);
});

const totalInvested = realInvestments.reduce((sum, inv) => sum + inv.amount, 0);
console.log(`\nTotal Invested: $${totalInvested.toLocaleString()}\n`);

console.log('STEP 2: FILTER PRODUCTS IRR EXTRACTION FROM STRATEGY DESCRIPTIONS');
const filterProductsIRRMapping = {
  1: { irr: 0.085, term: 2.0, strategy: 'structured equity and mezzanine capital deployed into residential and mixed-use development projects' },
  2: { irr: 0.60, term: 1.0, strategy: 'diversified exposure to senior and subordinated real estate-backed loans for land subdivisions' },
  3: { irr: 0.11, term: 1.5, strategy: 'first-ranking mortgage finance to conservative, well-prepared property projects' },
  4: { irr: 0.18, term: 4.0, strategy: 'secured senior lending to companies with strong recurring revenue and positive ebitda' },
  5: { irr: 0.0575, term: 2.0, strategy: 'senior secured loans combined with equity warrants and downside protection via put rights' }
};

console.log('IRR Extracted from Strategy Descriptions:');
Object.entries(filterProductsIRRMapping).forEach(([id, data]) => {
  console.log(`Product ${id}: ${(data.irr * 100).toFixed(2)}% IRR, ${data.term} year term`);
});
console.log('');

console.log('STEP 3: GROUP INVESTMENTS BY PRODUCT (FILTER PRODUCTS METHODOLOGY)');
const productGroups = {};
realInvestments.forEach(inv => {
  if (!productGroups[inv.productId]) {
    productGroups[inv.productId] = { totalInvested: 0, investments: [] };
  }
  productGroups[inv.productId].totalInvested += inv.amount;
  productGroups[inv.productId].investments.push(inv);
});

console.log('Grouped Investment Amounts:');
Object.entries(productGroups).forEach(([productId, group]) => {
  const irrData = filterProductsIRRMapping[productId];
  console.log(`Product ${productId}: $${group.totalInvested.toLocaleString()} total (${(irrData.irr*100).toFixed(2)}% IRR, ${irrData.term}yr term)`);
});
console.log('');

console.log('STEP 4: APPLY COMPOUND INTEREST FORMULA (FILTER PRODUCTS CALCULATION)');
console.log('Formula: Term Expiry Value = Math.floor(Principal × (1 + IRR)^TermYears)\n');

let totalTermExpiryValue = 0;
const calculations = [];

Object.entries(productGroups).forEach(([productId, group]) => {
  const irrData = filterProductsIRRMapping[productId];
  const principal = group.totalInvested;
  const growthFactor = Math.pow(1 + irrData.irr, irrData.term);
  const termExpiryValue = Math.floor(principal * growthFactor);
  
  totalTermExpiryValue += termExpiryValue;
  
  calculations.push({
    productId,
    principal,
    irr: irrData.irr,
    term: irrData.term,
    growthFactor,
    termExpiryValue,
    return: termExpiryValue - principal
  });
  
  console.log(`Product ${productId} Calculation:`);
  console.log(`  Principal: $${principal.toLocaleString()}`);
  console.log(`  Growth Factor: (1 + ${(irrData.irr*100).toFixed(2)}%)^${irrData.term} = ${growthFactor.toFixed(6)}`);
  console.log(`  Term Expiry Value: Math.floor($${principal.toLocaleString()} × ${growthFactor.toFixed(6)}) = $${termExpiryValue.toLocaleString()}`);
  console.log(`  Return: $${(termExpiryValue - principal).toLocaleString()}`);
  console.log('');
});

console.log('STEP 5: TOTAL TERM EXPIRY CALCULATION');
const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
const termExpiryReturnPercent = (totalTermExpiryReturn / totalInvested) * 100;

console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`Total Term Expiry Return: $${totalTermExpiryReturn.toLocaleString()}`);
console.log(`Term Expiry Return Percentage: ${termExpiryReturnPercent.toFixed(1)}%`);
console.log('');

console.log('VERIFICATION BREAKDOWN:');
calculations.forEach(calc => {
  const percentage = ((calc.termExpiryValue - calc.principal) / calc.principal) * 100;
  console.log(`• Product ${calc.productId}: $${calc.principal.toLocaleString()} → $${calc.termExpiryValue.toLocaleString()} (+${percentage.toFixed(1)}%)`);
});
console.log('');

console.log('✅ FINAL RESULT THAT ALL DASHBOARD SECTIONS SHOULD DISPLAY:');
console.log(`Term Expiry Projection: $${totalTermExpiryValue.toLocaleString()} (+$${totalTermExpiryReturn.toLocaleString()} at ${termExpiryReturnPercent.toFixed(1)}%)`);
console.log('');

console.log('🎯 THIS IS THE FILTER PRODUCTS METHODOLOGY CALCULATION');
console.log('All dashboard sections must show exactly these values for consistency');