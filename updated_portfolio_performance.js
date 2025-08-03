// UPDATED Portfolio Performance Using ACTUAL Database Investment Amounts
// This will show the correct calculations for all sections based on real data

console.log('=== ACTUAL DATABASE INVESTMENT AMOUNTS ===');

// Based on actual database query results
const actualInvestments = [
  { product: 'Real Estate Equity Fund', invested: 500000, investmentDate: '2025-04-03', irr: 0.104, termYears: 4.25 },
  { product: 'Bitcoin Tracker Fund', invested: 225000, investmentDate: '2025-02-02', irr: 0.12, termYears: 5.0 },  // 150k + 50k + 25k
  { product: 'Corporate Credit Fund', invested: 300000, investmentDate: '2025-05-03', irr: 0.11, termYears: 2.5 },
  { product: 'Web3 Innovation Fund', invested: 750000, investmentDate: '2024-08-01', irr: 0.11, termYears: 2.5 }, // This is the main Corporate Credit
  { product: 'Ethereum Staking Fund', invested: 75000, investmentDate: '2025-06-02', irr: 0.135, termYears: 2.875 }
];

let totalInvested = 0;
let totalTermExpiryValue = 0;

console.log('INDIVIDUAL PRODUCT CALCULATIONS (USING ACTUAL DB AMOUNTS):');

actualInvestments.forEach(investment => {
  const termExpiryGrowthFactor = Math.pow(1 + investment.irr, investment.termYears);
  const termExpiryValue = Math.floor(investment.invested * termExpiryGrowthFactor);
  const termExpiryReturn = Math.floor(termExpiryValue - investment.invested);
  
  // Calculate current value based on time elapsed
  const currentDate = new Date('2025-08-02');
  const investmentDate = new Date(investment.investmentDate);
  const timeElapsed = Math.max(0, (currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const effectiveTime = Math.min(timeElapsed, investment.termYears);
  const currentGrowthFactor = Math.pow(1 + investment.irr, effectiveTime);
  const currentValue = Math.floor(investment.invested * currentGrowthFactor);
  const currentReturn = Math.floor(currentValue - investment.invested);
  
  console.log(`${investment.product}:`);
  console.log(`  Invested: $${investment.invested.toLocaleString()}`);
  console.log(`  Investment Date: ${investment.investmentDate}`);
  console.log(`  Time Elapsed: ${timeElapsed.toFixed(4)} years`);
  console.log(`  Current Value: $${currentValue.toLocaleString()}`);
  console.log(`  Current Return: +$${currentReturn.toLocaleString()}`);
  console.log(`  Term Expiry Value: $${termExpiryValue.toLocaleString()}`);
  console.log(`  Term Expiry Return: +$${termExpiryReturn.toLocaleString()}`);
  console.log('');
  
  totalInvested += investment.invested;
  totalTermExpiryValue += termExpiryValue;
});

const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
const totalReturnPercent = (totalTermExpiryReturn / totalInvested) * 100;

console.log('=== CORRECTED PORTFOLIO TOTALS ===');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`Total Term Expiry Return: +$${totalTermExpiryReturn.toLocaleString()}`);
console.log(`Total Return Percentage: ${totalReturnPercent.toFixed(1)}%`);

console.log('\n=== COMPARISON WITH DISPLAYED VALUES ===');
console.log(`User's Investment Breakdown Shows: $2,409,595 (+$559,595) at 30.2%`);
console.log(`Corrected Calculation Should Show: $${totalTermExpiryValue.toLocaleString()} (+$${totalTermExpiryReturn.toLocaleString()}) at ${totalReturnPercent.toFixed(1)}%`);

// Now calculate Q2'25 values for table consistency
console.log('\n=== Q2\'25 TABLE VALUES (for Performance by Period) ===');
const q2_25_date = new Date('2025-06-25');

actualInvestments.forEach(investment => {
  const investmentDate = new Date(investment.investmentDate);
  const timeElapsed = Math.max(0, (q2_25_date.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const effectiveTime = Math.min(timeElapsed, investment.termYears);
  const growthFactor = Math.pow(1 + investment.irr, effectiveTime);
  const q2_25_value = Math.floor(investment.invested * growthFactor);
  const q2_25_return = Math.floor(q2_25_value - investment.invested);
  
  console.log(`${investment.product} Q2'25: $${q2_25_return.toLocaleString()}`);
});

console.log('\n=== ACTION NEEDED ===');
console.log('Update the Investment Performance Chart and all tables to use these actual database amounts');
console.log('This will ensure perfect consistency between:');
console.log('1. Investment Breakdown by Product');
console.log('2. Performance by Period (quarterly tables)');
console.log('3. Return by Period (quarterly tables)');
console.log('4. Investment Performance Chart');
console.log('All sections will then show mathematically consistent values.');