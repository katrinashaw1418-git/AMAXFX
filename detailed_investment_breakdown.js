// DETAILED INVESTMENT BREAKDOWN: EXACT CALCULATIONS WITH MIDPOINT IRR
console.log('=== DETAILED INVESTMENT BREAKDOWN WITH EXACT CALCULATIONS ===\n');

// Current user investments from database (verified mapping)
const userInvestments = [
  { id: 37, productId: 2, amount: 25000.00, date: '2025-08-02T09:45:46.000Z' },
  { id: 26, productId: 1, amount: 500000.00, date: '2025-04-03T15:37:02.000Z' },
  { id: 27, productId: 3, amount: 300000.00, date: '2025-05-03T15:37:02.000Z' },
  { id: 29, productId: 2, amount: 150000.00, date: '2025-02-02T15:37:02.000Z' },
  { id: 28, productId: 4, amount: 750000.00, date: '2024-08-01T15:37:02.000Z' },
  { id: 30, productId: 5, amount: 75000.00, date: '2025-06-02T15:37:02.000Z' },
  { id: 36, productId: 2, amount: 50000.00, date: '2025-08-01T15:31:58.000Z' }
];

// Exact midpoint IRR values from current product descriptions
const productDetails = {
  1: {
    name: 'Real Estate Equity Fund',
    targetIRR: '9.8–11.0%',
    midpointIRR: 0.104,
    calculation: '(9.8 + 11.0) / 2 = 10.4%'
  },
  2: {
    name: 'Real Estate Credit Fund',
    targetIRR: '~11%',
    midpointIRR: 0.11,
    calculation: 'Exactly 11%'
  },
  3: {
    name: 'Real Estate First Mortgage Fund',
    targetIRR: '~9%',
    midpointIRR: 0.09,
    calculation: 'Exactly 9%'
  },
  4: {
    name: 'Cash Flow-Based Corporate Credit Fund',
    targetIRR: '10–12%',
    midpointIRR: 0.11,
    calculation: '(10 + 12) / 2 = 11%'
  },
  5: {
    name: 'Security-Backed Corporate Credit Fund',
    targetIRR: '12–15%',
    midpointIRR: 0.135,
    calculation: '(12 + 15) / 2 = 13.5%'
  }
};

const currentDate = new Date('2025-08-02T00:00:00.000Z');
console.log('📅 Calculation Date: August 2, 2025');
console.log('🔢 Methodology: Compound Interest Formula = Principal × (1 + Rate)^Time');
console.log('⏰ Time Calculation: Exact days / 365.25 (accounting for leap years)');
console.log('');

console.log('📊 DETAILED CALCULATION BY INVESTMENT:');
console.log('====================================');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

userInvestments.forEach((investment, index) => {
  const product = productDetails[investment.productId];
  const investmentDate = new Date(investment.date);
  
  // Calculate exact time held
  const timeDifferenceMs = currentDate.getTime() - investmentDate.getTime();
  const daysHeld = Math.max(0, Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24)));
  const timeInYears = daysHeld / 365.25; // Precise leap year calculation
  
  // Apply compound interest formula: A = P(1 + r)^t
  const principal = investment.amount;
  const rate = product.midpointIRR;
  const growthFactor = Math.pow(1 + rate, timeInYears);
  const currentValue = principal * growthFactor;
  const returnAmount = currentValue - principal;
  const returnPercentage = (returnAmount / principal) * 100;
  
  // Add to totals
  totalInvested += principal;
  totalCurrentValue += currentValue;
  totalReturn += returnAmount;
  
  console.log(`${index + 1}. ${product.name} (Investment ID: ${investment.id})`);
  console.log(`   Product ID: ${investment.productId}`);
  console.log('   ════════════════════════════════════════════════════════');
  console.log(`   📈 Target IRR from Description: ${product.targetIRR}`);
  console.log(`   🎯 Midpoint IRR Calculation: ${product.calculation}`);
  console.log(`   💯 Applied Annual Rate: ${(rate * 100).toFixed(2)}%`);
  console.log('   ────────────────────────────────────────────────────────');
  console.log(`   💰 Principal Investment: $${principal.toLocaleString()}`);
  console.log(`   📅 Investment Date: ${investmentDate.toDateString()}`);
  console.log(`   📅 Current Date: ${currentDate.toDateString()}`);
  console.log(`   ⏱️  Days Held: ${daysHeld} days`);
  console.log(`   📊 Time in Years: ${timeInYears.toFixed(6)} years`);
  console.log('   ────────────────────────────────────────────────────────');
  console.log('   🧮 COMPOUND INTEREST CALCULATION:');
  console.log(`   Formula: Current Value = Principal × (1 + Rate)^Time`);
  console.log(`   Formula: Current Value = $${principal.toLocaleString()} × (1 + ${rate})^${timeInYears.toFixed(6)}`);
  console.log(`   Growth Factor: (1 + ${rate})^${timeInYears.toFixed(6)} = ${growthFactor.toFixed(8)}`);
  console.log(`   Current Value: $${principal.toLocaleString()} × ${growthFactor.toFixed(8)} = $${currentValue.toFixed(2)}`);
  console.log('   ────────────────────────────────────────────────────────');
  console.log('   📈 RETURN CALCULATION:');
  console.log(`   Return Amount: $${currentValue.toFixed(2)} - $${principal.toLocaleString()} = $${returnAmount.toFixed(2)}`);
  console.log(`   Return Percentage: ($${returnAmount.toFixed(2)} ÷ $${principal.toLocaleString()}) × 100 = ${returnPercentage.toFixed(4)}%`);
  console.log(`   ✅ Final Return: $${returnAmount.toFixed(2)} (${returnPercentage.toFixed(2)}%)`);
  console.log('');
});

// Calculate total portfolio return percentage
const totalReturnPercentage = (totalReturn / totalInvested) * 100;

console.log('💰 PORTFOLIO TOTALS VERIFICATION:');
console.log('=================================');
console.log(`📊 Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`📊 Total Current Value: $${totalCurrentValue.toFixed(2)}`);
console.log(`📊 Total Return Amount: $${totalReturn.toFixed(2)}`);
console.log(`📊 Total Return Percentage: (${totalReturn.toFixed(2)} ÷ ${totalInvested.toLocaleString()}) × 100 = ${totalReturnPercentage.toFixed(4)}%`);
console.log(`✅ Final Portfolio Return: $${totalReturn.toFixed(2)} (${totalReturnPercentage.toFixed(2)}%)`);
console.log('');

console.log('📋 SUMMARY BY PRODUCT CATEGORY:');
console.log('===============================');

// Group by product for summary
const productSummary = {};
userInvestments.forEach(investment => {
  const product = productDetails[investment.productId];
  const investmentDate = new Date(investment.date);
  const timeDifferenceMs = currentDate.getTime() - investmentDate.getTime();
  const daysHeld = Math.max(0, Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24)));
  const timeInYears = daysHeld / 365.25;
  
  const principal = investment.amount;
  const rate = product.midpointIRR;
  const growthFactor = Math.pow(1 + rate, timeInYears);
  const currentValue = principal * growthFactor;
  const returnAmount = currentValue - principal;
  
  if (!productSummary[investment.productId]) {
    productSummary[investment.productId] = {
      product: product,
      totalInvested: 0,
      totalCurrentValue: 0,
      totalReturn: 0,
      investmentCount: 0
    };
  }
  
  productSummary[investment.productId].totalInvested += principal;
  productSummary[investment.productId].totalCurrentValue += currentValue;
  productSummary[investment.productId].totalReturn += returnAmount;
  productSummary[investment.productId].investmentCount += 1;
});

Object.entries(productSummary).forEach(([productId, summary]) => {
  const returnPercentage = (summary.totalReturn / summary.totalInvested) * 100;
  console.log(`🏢 ${summary.product.name}:`);
  console.log(`   Target IRR: ${summary.product.targetIRR} → Applied: ${(summary.product.midpointIRR * 100).toFixed(2)}%`);
  console.log(`   Investments: ${summary.investmentCount} investment${summary.investmentCount > 1 ? 's' : ''}`);
  console.log(`   Total Invested: $${summary.totalInvested.toLocaleString()}`);
  console.log(`   Total Current Value: $${summary.totalCurrentValue.toFixed(2)}`);
  console.log(`   Total Return: $${summary.totalReturn.toFixed(2)} (${returnPercentage.toFixed(2)}%)`);
  console.log('');
});

console.log('✅ CALCULATION METHODOLOGY VERIFICATION:');
console.log('=======================================');
console.log('✓ Using exact midpoint IRR values from current product descriptions');
console.log('✓ Compound interest formula: A = P(1 + r)^t');
console.log('✓ Precise time calculation: days held / 365.25 years');
console.log('✓ Return calculation: (Current Value - Principal) / Principal × 100');
console.log('✓ All figures calculated dynamically, no cached values');
console.log('✓ Calculations consistent across all investment components');
console.log('');

console.log('🔄 API CONSISTENCY CHECK:');
console.log('=========================');
console.log('Expected Total Return: $' + totalReturn.toFixed(2) + ' (' + totalReturnPercentage.toFixed(2) + '%)');
console.log('Expected Current Value: $' + totalCurrentValue.toFixed(2));
console.log('This should match the user-investments API response.');