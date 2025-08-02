// TERM EXPIRY PROJECTION VERIFICATION - BASED ON ACTUAL PRODUCT TERMS
console.log('=== TERM EXPIRY PROJECTION VERIFICATION ===\n');

// Actual product terms from database
const productTerms = {
  1: { name: 'Real Estate Equity Fund', term: '2–6.5 years', midpointTerm: 4.25, irr: 0.104 },
  2: { name: 'Real Estate Credit Fund', term: '~10.2 months (rolling)', midpointTerm: 0.85, irr: 0.11 },
  3: { name: 'Real Estate First Mortgage Fund', term: '~9.4 months', midpointTerm: 0.78, irr: 0.09 },
  4: { name: 'Cash Flow-Based Corporate Credit Fund', term: '2–3 years', midpointTerm: 2.5, irr: 0.11 },
  5: { name: 'Security-Backed Corporate Credit Fund', term: '30–39 months', midpointTerm: 2.875, irr: 0.135 }
};

// Current investments
const userInvestments = [
  { id: 26, productId: 1, amount: 500000.00 },
  { id: 27, productId: 3, amount: 300000.00 },
  { id: 28, productId: 4, amount: 750000.00 },
  { id: 29, productId: 2, amount: 150000.00 },
  { id: 30, productId: 5, amount: 75000.00 },
  { id: 36, productId: 2, amount: 50000.00 },
  { id: 37, productId: 2, amount: 25000.00 }
];

console.log('📊 TERM EXPIRY CALCULATIONS BY PRODUCT:');
console.log('======================================');

// Group investments by product
const productGroups = {};
userInvestments.forEach(investment => {
  const productId = investment.productId;
  if (!productGroups[productId]) {
    productGroups[productId] = {
      product: productTerms[productId],
      investments: [],
      totalInvested: 0
    };
  }
  productGroups[productId].investments.push(investment);
  productGroups[productId].totalInvested += investment.amount;
});

Object.entries(productGroups).forEach(([productId, group]) => {
  console.log(`\n${group.product.name}`);
  console.log('═'.repeat(50));
  console.log(`Product Term: ${group.product.term}`);
  console.log(`Midpoint Term: ${group.product.midpointTerm} years`);
  console.log(`Target IRR: ${(group.product.irr * 100).toFixed(1)}%`);
  console.log(`Total Invested: $${group.totalInvested.toLocaleString()}`);
  console.log('');
  
  // Calculate term expiry projection
  const termExpiryGrowthFactor = Math.pow(1 + group.product.irr, group.product.midpointTerm);
  const termExpiryValue = group.totalInvested * termExpiryGrowthFactor;
  const termExpiryReturn = termExpiryValue - group.totalInvested;
  const termExpiryPercent = (termExpiryReturn / group.totalInvested) * 100;
  
  console.log('🧮 TERM EXPIRY CALCULATION:');
  console.log('──────────────────────────────────────────────────────');
  console.log(`Formula: Future Value = Principal × (1 + IRR)^Term`);
  console.log(`Formula: Future Value = $${group.totalInvested.toLocaleString()} × (1 + ${group.product.irr})^${group.product.midpointTerm}`);
  console.log(`Growth Factor: (1 + ${group.product.irr})^${group.product.midpointTerm} = ${termExpiryGrowthFactor.toFixed(8)}`);
  console.log(`Value at Term Expiry: $${termExpiryValue.toFixed(2)}`);
  console.log(`Expected Return: $${termExpiryReturn.toFixed(2)}`);
  console.log(`Return Percentage: ${termExpiryPercent.toFixed(2)}%`);
  console.log('');
  
  // Calculate 7-year projection for comparison
  const sevenYearGrowthFactor = Math.pow(1 + group.product.irr, 7);
  const sevenYearValue = group.totalInvested * sevenYearGrowthFactor;
  const sevenYearReturn = sevenYearValue - group.totalInvested;
  const sevenYearPercent = (sevenYearReturn / group.totalInvested) * 100;
  
  console.log('🔮 7-YEAR PROJECTION (FOR COMPARISON):');
  console.log('──────────────────────────────────────────────────────');
  console.log(`Growth Factor: (1 + ${group.product.irr})^7 = ${sevenYearGrowthFactor.toFixed(8)}`);
  console.log(`7-Year Value: $${sevenYearValue.toFixed(2)}`);
  console.log(`7-Year Return: $${sevenYearReturn.toFixed(2)} (${sevenYearPercent.toFixed(1)}%)`);
  console.log('');
  
  console.log('📈 COMPARISON:');
  console.log('──────────────────────────────────────────────────────');
  if (group.product.midpointTerm < 7) {
    console.log(`✅ Term expiry (${group.product.midpointTerm}y) is SHORTER than 7 years`);
    console.log(`   Lower return at term expiry: ${termExpiryPercent.toFixed(1)}% vs ${sevenYearPercent.toFixed(1)}%`);
  } else {
    console.log(`⚠️  Term expiry (${group.product.midpointTerm}y) is LONGER than 7 years`);
    console.log(`   Higher return at term expiry: ${termExpiryPercent.toFixed(1)}% vs ${sevenYearPercent.toFixed(1)}%`);
  }
});

console.log('\n\n💰 PORTFOLIO TERM EXPIRY SUMMARY:');
console.log('═'.repeat(40));

let totalInvestedPortfolio = 0;
let totalTermExpiryValue = 0;

Object.values(productGroups).forEach(group => {
  const termExpiryGrowthFactor = Math.pow(1 + group.product.irr, group.product.midpointTerm);
  const termExpiryValue = group.totalInvested * termExpiryGrowthFactor;
  
  totalInvestedPortfolio += group.totalInvested;
  totalTermExpiryValue += termExpiryValue;
  
  console.log(`${group.product.name}:`);
  console.log(`  Term: ${group.product.term} (${group.product.midpointTerm}y)`);
  console.log(`  Invested: $${group.totalInvested.toLocaleString()}`);
  console.log(`  Value at Expiry: $${termExpiryValue.toFixed(2)}`);
  console.log(`  Return: $${(termExpiryValue - group.totalInvested).toFixed(2)} (${((termExpiryValue - group.totalInvested) / group.totalInvested * 100).toFixed(1)}%)`);
  console.log('');
});

const totalTermExpiryReturn = totalTermExpiryValue - totalInvestedPortfolio;
const portfolioTermExpiryPercent = (totalTermExpiryReturn / totalInvestedPortfolio) * 100;

console.log('🏆 PORTFOLIO TOTALS:');
console.log('══════════════════════════════════════════════════════');
console.log(`Total Portfolio Invested: $${totalInvestedPortfolio.toLocaleString()}`);
console.log(`Total Value at Various Term Expiries: $${totalTermExpiryValue.toFixed(2)}`);
console.log(`Total Expected Return: $${totalTermExpiryReturn.toFixed(2)}`);
console.log(`Portfolio-Wide Return: ${portfolioTermExpiryPercent.toFixed(2)}%`);

console.log('\n\n✅ METHODOLOGY NOTES:');
console.log('═'.repeat(30));
console.log('✓ Uses actual product term descriptions from database');
console.log('✓ Calculates midpoint of term ranges (e.g., 2-3 years = 2.5 years)');
console.log('✓ Rolling terms use monthly averages (e.g., 10.2 months = 0.85 years)');
console.log('✓ Compound interest formula: FV = PV × (1 + r)^t');
console.log('✓ Each product expires at different times based on actual terms');
console.log('✓ More realistic than generic 7-year projections for all products');