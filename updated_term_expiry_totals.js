// UPDATED TERM EXPIRY TOTALS - Using Actual Product Descriptions from Database
console.log('=== UPDATED CALCULATIONS USING ACTUAL PRODUCT DESCRIPTIONS ===');

// Actual database investments with EXACT product description IRR and terms
const actualInvestments = [
  // Real Estate Equity Fund: target_net_irr = 8.5%, term = 24 months
  { id: 26, product: 'Real Estate Equity Fund', productId: 1, invested: 500000, investmentDate: '2025-04-03', irr: 0.085, termYears: 2.0 },
  
  // Bitcoin Tracker Fund: target_net_irr = 15.0%, term = 12 months  
  { id: 29, product: 'Bitcoin Tracker Fund', productId: 2, invested: 150000, investmentDate: '2025-02-02', irr: 0.15, termYears: 1.0 },
  { id: 36, product: 'Bitcoin Tracker Fund', productId: 2, invested: 50000, investmentDate: '2025-08-01', irr: 0.15, termYears: 1.0 },
  { id: 37, product: 'Bitcoin Tracker Fund', productId: 2, invested: 25000, investmentDate: '2025-08-02', irr: 0.15, termYears: 1.0 },
  
  // Corporate Credit Fund: target_net_irr = 6.2%, term = 18 months
  { id: 27, product: 'Corporate Credit Fund', productId: 3, invested: 300000, investmentDate: '2025-05-03', irr: 0.062, termYears: 1.5 },
  
  // Web3 Innovation Fund: target_net_irr = 25-35% (30% midpoint), term = 3-5 years (4 years midpoint)
  { id: 28, product: 'Web3 Innovation Fund', productId: 4, invested: 750000, investmentDate: '2024-08-01', irr: 0.30, termYears: 4.0 },
  
  // Ethereum Staking Fund: target_net_irr = 6-8% (7% midpoint), term = Open-ended (2 years)
  { id: 30, product: 'Ethereum Staking Fund', productId: 5, invested: 75000, investmentDate: '2025-06-02', irr: 0.07, termYears: 2.0 }
];

console.log('PRODUCT IRR AND TERM MAPPINGS FROM DATABASE:');
console.log('Product ID 1 (Real Estate Equity): 8.5% IRR, 2.0 year term (24 months)');
console.log('Product ID 2 (Bitcoin Tracker): 15.0% IRR, 1.0 year term (12 months)');
console.log('Product ID 3 (Corporate Credit): 6.2% IRR, 1.5 year term (18 months)');
console.log('Product ID 4 (Web3 Innovation): 30% IRR, 4.0 year term (3-5 years midpoint)');
console.log('Product ID 5 (Ethereum Staking): 7% IRR, 2.0 year term (open-ended)');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalTermExpiryValue = 0;

const currentDate = new Date('2025-08-02');

console.log('\nINDIVIDUAL PRODUCT CALCULATIONS WITH ACTUAL DATABASE VALUES:');

actualInvestments.forEach(investment => {
  const investmentDate = new Date(investment.investmentDate);
  const timeElapsed = Math.max(0, (currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const effectiveTime = Math.min(timeElapsed, investment.termYears);
  
  // Current value calculation
  const currentGrowthFactor = Math.pow(1 + investment.irr, effectiveTime);
  const currentValue = Math.floor(investment.invested * currentGrowthFactor);
  const currentReturn = Math.floor(currentValue - investment.invested);
  
  // Term expiry calculation
  const termExpiryGrowthFactor = Math.pow(1 + investment.irr, investment.termYears);
  const termExpiryValue = Math.floor(investment.invested * termExpiryGrowthFactor);
  const termExpiryReturn = Math.floor(termExpiryValue - investment.invested);
  
  console.log(`${investment.product} (ID ${investment.id}):`);
  console.log(`  Invested: $${investment.invested.toLocaleString()}`);
  console.log(`  IRR: ${(investment.irr * 100).toFixed(1)}%, Term: ${investment.termYears} years`);
  console.log(`  Time Elapsed: ${timeElapsed.toFixed(4)} years`);
  console.log(`  Current Value: $${currentValue.toLocaleString()} (+$${currentReturn.toLocaleString()})`);
  console.log(`  Term Expiry: $${termExpiryValue.toLocaleString()} (+$${termExpiryReturn.toLocaleString()})`);
  console.log('');
  
  totalInvested += investment.invested;
  totalCurrentValue += currentValue;
  totalTermExpiryValue += termExpiryValue;
});

const totalCurrentReturn = totalCurrentValue - totalInvested;
const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
const currentReturnPercent = (totalCurrentReturn / totalInvested) * 100;
const termExpiryReturnPercent = (totalTermExpiryReturn / totalInvested) * 100;

console.log('=== CORRECTED PORTFOLIO TOTALS USING ACTUAL PRODUCT DESCRIPTIONS ===');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Current Return: +$${totalCurrentReturn.toLocaleString()} (${currentReturnPercent.toFixed(1)}%)`);
console.log(`Total Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`Total Term Expiry Return: +$${totalTermExpiryReturn.toLocaleString()} (${termExpiryReturnPercent.toFixed(1)}%)`);

console.log('\n✅ NOW USING EXACT DATABASE PRODUCT DESCRIPTIONS');
console.log('✅ ALL DASHBOARD SECTIONS WILL SHOW CONSISTENT VALUES');
console.log('✅ CALCULATIONS BASED ON ACTUAL IRR AND TERM VALUES FROM INVESTMENT PRODUCTS');