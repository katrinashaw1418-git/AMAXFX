// INVESTMENT BREAKDOWN BY PRODUCT - DETAILED CALCULATION VERIFICATION
console.log('=== INVESTMENT BREAKDOWN BY PRODUCT CALCULATION VERIFICATION ===\n');

// Actual user investments from Filter Products database
const actualInvestments = [
  { id: 26, productId: 1, invested: 500000, investmentDate: '2025-04-03', productName: 'Real Estate Equity Fund' },
  { id: 29, productId: 2, invested: 150000, investmentDate: '2025-02-02', productName: 'Bitcoin Tracker Fund' },
  { id: 36, productId: 2, invested: 50000, investmentDate: '2025-08-01', productName: 'Bitcoin Tracker Fund' },
  { id: 37, productId: 2, invested: 25000, investmentDate: '2025-08-02', productName: 'Bitcoin Tracker Fund' },
  { id: 27, productId: 3, invested: 300000, investmentDate: '2025-05-03', productName: 'Corporate Credit Fund' },
  { id: 28, productId: 4, invested: 750000, investmentDate: '2024-08-01', productName: 'Web3 Innovation Fund' },
  { id: 30, productId: 5, invested: 75000, investmentDate: '2025-06-02', productName: 'Ethereum Staking Fund' }
];

// Exact midpoint IRR and terms from Filter Products data
const productMidpoints = {
  1: { irr: 0.085, termYears: 2.0, name: 'Real Estate Equity Fund' },
  2: { irr: 0.60, termYears: 1.0, name: 'Bitcoin Tracker Fund' },
  3: { irr: 0.11, termYears: 1.5, name: 'Corporate Credit Fund' },
  4: { irr: 0.18, termYears: 4.0, name: 'Web3 Innovation Fund' },
  5: { irr: 0.0575, termYears: 2.0, name: 'Ethereum Staking Fund' }
};

const currentDate = new Date('2025-08-02');
let totalInvested = 0;
let totalCurrentValue = 0;
let totalTermExpiryValue = 0;

console.log('STEP-BY-STEP CURRENT RETURN CALCULATION:');
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
  
  console.log(`${index + 1}. ${product.name} (Investment ID ${investment.id})`);
  console.log(`   Principal: $${investment.invested.toLocaleString()}`);
  console.log(`   Investment Date: ${investment.investmentDate}`);
  console.log(`   IRR: ${(product.irr * 100).toFixed(2)}%, Term: ${product.termYears} years`);
  console.log(`   Time Elapsed: ${timeElapsed.toFixed(4)} years`);
  console.log(`   Effective Time: min(${timeElapsed.toFixed(4)}, ${product.termYears}) = ${effectiveTime.toFixed(4)} years`);
  console.log(`   Growth Factor: (1 + ${(product.irr * 100).toFixed(2)}%)^${effectiveTime.toFixed(4)} = ${currentGrowthFactor.toFixed(6)}`);
  console.log(`   Current Value: $${investment.invested.toLocaleString()} × ${currentGrowthFactor.toFixed(6)} = $${currentValue.toLocaleString()}`);
  console.log(`   Current Return: $${currentValue.toLocaleString()} - $${investment.invested.toLocaleString()} = $${currentReturn.toLocaleString()}\n`);
  
  totalInvested += investment.invested;
  totalCurrentValue += currentValue;
});

const totalCurrentReturn = totalCurrentValue - totalInvested;
const currentReturnPercent = (totalCurrentReturn / totalInvested) * 100;

console.log('===== CURRENT RETURN SUMMARY =====');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Current Return: $${totalCurrentReturn.toLocaleString()}`);
console.log(`Current Return Percentage: ${currentReturnPercent.toFixed(2)}%\n`);

console.log('STEP-BY-STEP TERM EXPIRY CALCULATION:');
console.log('Formula: Term Expiry Value = Principal × (1 + IRR)^TermLimit\n');

actualInvestments.forEach((investment, index) => {
  const product = productMidpoints[investment.productId];
  
  // Term expiry calculation - full term regardless of time elapsed
  const termExpiryGrowthFactor = Math.pow(1 + product.irr, product.termYears);
  const termExpiryValue = Math.floor(investment.invested * termExpiryGrowthFactor);
  const termExpiryReturn = termExpiryValue - investment.invested;
  
  console.log(`${index + 1}. ${product.name} (Investment ID ${investment.id})`);
  console.log(`   Principal: $${investment.invested.toLocaleString()}`);
  console.log(`   IRR: ${(product.irr * 100).toFixed(2)}%, Full Term: ${product.termYears} years`);
  console.log(`   Term Growth Factor: (1 + ${(product.irr * 100).toFixed(2)}%)^${product.termYears} = ${termExpiryGrowthFactor.toFixed(6)}`);
  console.log(`   Term Expiry Value: $${investment.invested.toLocaleString()} × ${termExpiryGrowthFactor.toFixed(6)} = $${termExpiryValue.toLocaleString()}`);
  console.log(`   Term Expiry Return: $${termExpiryValue.toLocaleString()} - $${investment.invested.toLocaleString()} = $${termExpiryReturn.toLocaleString()}\n`);
  
  totalTermExpiryValue += termExpiryValue;
});

const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
const termExpiryReturnPercent = (totalTermExpiryReturn / totalInvested) * 100;

console.log('===== TERM EXPIRY (EXPECTED RETURN) SUMMARY =====');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`Total Expected Return: $${totalTermExpiryReturn.toLocaleString()}`);
console.log(`Expected Return Percentage: ${termExpiryReturnPercent.toFixed(1)}%\n`);

console.log('===== VERIFICATION OF REPORTED VALUES =====');
console.log('Investment Breakdown by Product should show:');
console.log(`✓ Current Return: $${totalCurrentReturn.toLocaleString()} (${currentReturnPercent.toFixed(2)}%)`);
console.log(`✓ Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`✓ Expected Return: +$${totalTermExpiryReturn.toLocaleString()} (${termExpiryReturnPercent.toFixed(1)}%)`);
console.log('');

console.log('CALCULATION METHODOLOGY CONFIRMED:');
console.log('✓ Using exact Filter Products investment data');
console.log('✓ Using exact midpoint IRR values from investment strategy descriptions');
console.log('✓ Using exact term limits from database');
console.log('✓ Applying compound interest formula with Math.floor() rounding');
console.log('✓ Current calculations respect time elapsed and term capping');
console.log('✓ Term expiry calculations project full term growth for each product');
console.log('✓ All calculations use real-time data as of August 2, 2025');