// COMPLETE TERM EXPIRY CALCULATION - Using Midpoint IRR and Midpoint Terms
console.log('=== STEP-BY-STEP CALCULATION VERIFICATION ===');
console.log('Using actual Filter Products data with midpoint IRR and midpoint terms\n');

// Define midpoint IRR and midpoint terms based on product descriptions
const productMidpoints = {
  1: { // Real Estate Equity Fund
    name: 'Real Estate Equity Fund',
    irr: 0.085, // Exact 8.5% from target_net_irr
    termYears: 2.0, // 24 months = 2.0 years
    description: 'Core Plus Strategy - 8.5% IRR, 24 months'
  },
  2: { // Bitcoin Tracker Fund  
    name: 'Bitcoin Tracker Fund',
    irr: 0.60, // Market-based historical 60%+ (using 60% midpoint)
    termYears: 1.0, // 12 months = 1.0 year
    description: 'Market-based (historical 60%+ annualized) - 60% IRR, 12 months'
  },
  3: { // Corporate Credit Fund
    name: 'Corporate Credit Fund',
    irr: 0.11, // Midpoint IRR targeting 11% from description
    termYears: 1.5, // 18 months = 1.5 years
    description: 'Midpoint IRR targeting 11% - 11% IRR, 18 months'
  },
  4: { // Web3 Innovation Fund
    name: 'Web3 Innovation Fund',
    irr: 0.18, // Midpoint IRR targeting 18% from description
    termYears: 4.0, // Midpoint of 3-5 years = 4.0 years
    description: 'Midpoint IRR targeting 18% - 18% IRR, 3-5 years (4.0 year midpoint)'
  },
  5: { // Ethereum Staking Fund
    name: 'Ethereum Staking Fund',
    irr: 0.0575, // Midpoint IRR targeting 5.75% from description
    termYears: 2.0, // Open-ended (using 2 years as reasonable term)
    description: 'Midpoint IRR targeting 5.75% - 5.75% IRR, Open-ended (2.0 years)'
  }
};

// Actual user investments from Filter Products
const actualInvestments = [
  { id: 26, productId: 1, invested: 500000, investmentDate: '2025-04-03' },
  { id: 29, productId: 2, invested: 150000, investmentDate: '2025-02-02' },
  { id: 36, productId: 2, invested: 50000, investmentDate: '2025-08-01' },
  { id: 37, productId: 2, invested: 25000, investmentDate: '2025-08-02' },
  { id: 27, productId: 3, invested: 300000, investmentDate: '2025-05-03' },
  { id: 28, productId: 4, invested: 750000, investmentDate: '2024-08-01' },
  { id: 30, productId: 5, invested: 75000, investmentDate: '2025-06-02' }
];

console.log('PRODUCT MIDPOINT IRR AND TERM DEFINITIONS:');
Object.entries(productMidpoints).forEach(([id, product]) => {
  console.log(`Product ${id}: ${product.name}`);
  console.log(`  ${product.description}`);
  console.log(`  IRR: ${(product.irr * 100).toFixed(2)}%, Term: ${product.termYears} years\n`);
});

const currentDate = new Date('2025-08-02');
let totalInvested = 0;
let totalCurrentValue = 0;
let totalTermExpiryValue = 0;

console.log('STEP-BY-STEP INDIVIDUAL INVESTMENT CALCULATIONS:');
console.log('Formula: Current Value = Principal × (1 + IRR)^min(TimeElapsed, TermLimit)\n');

actualInvestments.forEach((investment, index) => {
  const product = productMidpoints[investment.productId];
  const investmentDate = new Date(investment.investmentDate);
  
  // Calculate time elapsed in years with high precision
  const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
  const timeElapsed = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25));
  const effectiveTime = Math.min(timeElapsed, product.termYears);
  
  // Current value calculation with exact compound interest
  const currentGrowthFactor = Math.pow(1 + product.irr, effectiveTime);
  const currentValue = Math.floor(investment.invested * currentGrowthFactor);
  const currentReturn = currentValue - investment.invested;
  
  // Term expiry calculation
  const termExpiryGrowthFactor = Math.pow(1 + product.irr, product.termYears);
  const termExpiryValue = Math.floor(investment.invested * termExpiryGrowthFactor);
  const termExpiryReturn = termExpiryValue - investment.invested;
  
  console.log(`${index + 1}. ${product.name} (Investment ID ${investment.id})`);
  console.log(`   Investment Date: ${investment.investmentDate}`);
  console.log(`   Principal: $${investment.invested.toLocaleString()}`);
  console.log(`   IRR: ${(product.irr * 100).toFixed(2)}%, Term Limit: ${product.termYears} years`);
  console.log(`   Time Elapsed: ${timeElapsed.toFixed(4)} years`);
  console.log(`   Effective Time (capped): ${effectiveTime.toFixed(4)} years`);
  console.log(`   Current Calculation: $${investment.invested.toLocaleString()} × (1 + ${(product.irr * 100).toFixed(2)}%)^${effectiveTime.toFixed(4)}`);
  console.log(`   Current Growth Factor: ${currentGrowthFactor.toFixed(6)}`);
  console.log(`   Current Value: $${currentValue.toLocaleString()} (+$${currentReturn.toLocaleString()})`);
  console.log(`   Term Expiry Calculation: $${investment.invested.toLocaleString()} × (1 + ${(product.irr * 100).toFixed(2)}%)^${product.termYears}`);
  console.log(`   Term Expiry Growth Factor: ${termExpiryGrowthFactor.toFixed(6)}`);
  console.log(`   Term Expiry Value: $${termExpiryValue.toLocaleString()} (+$${termExpiryReturn.toLocaleString()})\n`);
  
  totalInvested += investment.invested;
  totalCurrentValue += currentValue;
  totalTermExpiryValue += termExpiryValue;
});

const totalCurrentReturn = totalCurrentValue - totalInvested;
const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
const currentReturnPercent = (totalCurrentReturn / totalInvested) * 100;
const termExpiryReturnPercent = (totalTermExpiryReturn / totalInvested) * 100;

console.log('===== PORTFOLIO TOTALS VERIFICATION =====');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Current Return: +$${totalCurrentReturn.toLocaleString()} (${currentReturnPercent.toFixed(1)}%)`);
console.log(`Total Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`Total Term Expiry Return: +$${totalTermExpiryReturn.toLocaleString()} (${termExpiryReturnPercent.toFixed(1)}%)`);

console.log('\n===== CALCULATION METHODOLOGY =====');
console.log('✓ Using exact investment amounts from Filter Products');
console.log('✓ Using midpoint IRR values from product descriptions');
console.log('✓ Using midpoint terms where ranges exist');
console.log('✓ Applying compound interest formula: Principal × (1 + IRR)^Time');
console.log('✓ Time capping at individual product term limits');
console.log('✓ Math.floor() rounding for currency precision');
console.log('✓ High precision time calculations (365.25 days/year)');
console.log('✓ Real-time calculations as of August 2, 2025');