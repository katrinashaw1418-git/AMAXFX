// FINAL CALCULATION VERIFICATION - Comprehensive Test
console.log('=== FINAL MIDPOINT IRR CALCULATION VERIFICATION ===\n');

// Test the exact same logic as the fixed calculateInvestmentPerformance function
function testCalculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate = new Date()) {
  const daysHeld = Math.max(0, Math.floor((currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const timeInYears = daysHeld / 365.25;
  
  let targetIRR = 0.08; // Default 8% annual return
  
  switch (product.category) {
    case 'real_estate':
      targetIRR = 0.11; // 11% for real estate
      break;
    case 'corporate_credit':
      targetIRR = 0.11; // 11% for corporate credit
      break;
    case 'venture_capital':
      targetIRR = 0.18; // 18% for venture capital
      break;
    case 'digital_assets':
      if (product.name?.toLowerCase().includes('bitcoin')) {
        targetIRR = 0.15; // 15% for Bitcoin (conservative midpoint, not 60% market rate)
      } else if (product.name?.toLowerCase().includes('ethereum')) {
        targetIRR = 0.0575; // 5.75% for Ethereum staking
      } else {
        targetIRR = 0.12; // 12% for other digital assets
      }
      break;
    default:
      targetIRR = 0.08; // 8% for unspecified categories
  }
  
  const growthFactor = Math.pow(1 + targetIRR, timeInYears);
  const currentValue = investedAmount * growthFactor;
  const returnAmount = currentValue - investedAmount;
  const returnPercentage = investedAmount > 0 ? (returnAmount / investedAmount) * 100 : 0;
  
  return {
    currentValue,
    returnAmount,
    returnPercentage,
    daysHeld,
    timeInYears,
    targetIRR,
    growthFactor
  };
}

// Define test investments that match the database
const currentDate = new Date('2025-08-02');
const testInvestments = [
  {
    id: 37,
    productId: 2,
    product: { category: "digital_assets", name: "Bitcoin Tracker Fund" },
    investedAmount: 25000,
    investmentDate: new Date('2025-08-02')
  },
  {
    id: 26,
    productId: 1,
    product: { category: "real_estate", name: "Real Estate Credit Fund" },
    investedAmount: 500000,
    investmentDate: new Date('2025-04-03')
  },
  {
    id: 27,
    productId: 3,
    product: { category: "corporate_credit", name: "Corporate Credit Fund" },
    investedAmount: 300000,
    investmentDate: new Date('2025-05-03')
  },
  {
    id: 29,
    productId: 2,
    product: { category: "digital_assets", name: "Bitcoin Tracker Fund" },
    investedAmount: 150000,
    investmentDate: new Date('2025-02-02')
  },
  {
    id: 28,
    productId: 4,
    product: { category: "venture_capital", name: "VC/Growth Equity Fund" },
    investedAmount: 750000,
    investmentDate: new Date('2024-08-02')
  },
  {
    id: 30,
    productId: 5,
    product: { category: "digital_assets", name: "Ethereum Staking Fund" },
    investedAmount: 75000,
    investmentDate: new Date('2025-06-02')
  },
  {
    id: 36,
    productId: 2,
    product: { category: "digital_assets", name: "Bitcoin Tracker Fund" },
    investedAmount: 50000,
    investmentDate: new Date('2025-08-01')
  }
];

console.log('TESTING UNIFIED calculateInvestmentPerformance FUNCTION:\n');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

testInvestments.forEach((investment, index) => {
  const performance = testCalculateInvestmentPerformance(
    investment.product,
    investment.investedAmount,
    investment.investmentDate,
    currentDate
  );
  
  totalInvested += investment.investedAmount;
  totalCurrentValue += performance.currentValue;
  totalReturn += performance.returnAmount;
  
  console.log(`${index + 1}. ${investment.product.name} (ID: ${investment.id})`);
  console.log(`   Principal: $${investment.investedAmount.toLocaleString()}`);
  console.log(`   Days Held: ${performance.daysHeld} days`);
  console.log(`   Time: ${performance.timeInYears.toFixed(4)} years`);
  console.log(`   Target IRR: ${(performance.targetIRR * 100).toFixed(2)}%`);
  console.log(`   Growth Factor: ${performance.growthFactor.toFixed(6)}`);
  console.log(`   Current Value: $${performance.currentValue.toFixed(2)}`);
  console.log(`   Return: $${performance.returnAmount.toFixed(2)} (${performance.returnPercentage.toFixed(2)}%)`);
  console.log('');
});

const overallReturnPercentage = (totalReturn / totalInvested) * 100;

console.log('=== UNIFIED CALCULATION RESULTS ===\n');
console.log(`Total Principal: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toFixed(2)}`);
console.log(`Total Return: $${totalReturn.toFixed(2)}`);
console.log(`Overall Return: ${overallReturnPercentage.toFixed(2)}%`);

console.log('\n=== ENDPOINT COMPARISON ===\n');
console.log('Expected Results (Unified Function):');
console.log(`• Total Return: $${totalReturn.toFixed(2)} (${overallReturnPercentage.toFixed(2)}%)`);
console.log('');

console.log('Current API Results:');
console.log('• user-investments: $116,908.84 (6.32%) ❌');
console.log('• investment-performance: $171,870.52 (9.29%) ❌');
console.log('• portfolio: $1,966,908.85 investment value ❌');
console.log('');

console.log('✅ All endpoints should match the unified calculation:');
console.log(`✅ Expected: $${totalReturn.toFixed(2)} (${overallReturnPercentage.toFixed(2)}%)`);

console.log('\n=== ROOT CAUSE ANALYSIS ===\n');
console.log('ISSUE IDENTIFIED:');
console.log('1. user-investments endpoint uses correct calculateInvestmentPerformance function');
console.log('2. investment-performance endpoint may have different calculation logic');
console.log('3. Need to ensure ALL endpoints use the same unified function');

console.log('\n=== IMPLEMENTATION VERIFICATION ===\n');
console.log('Database Values vs. Calculated Values:');
testInvestments.forEach((investment, index) => {
  const performance = testCalculateInvestmentPerformance(
    investment.product,
    investment.investedAmount,
    investment.investmentDate,
    currentDate
  );
  
  // These should match the database values we updated earlier
  console.log(`${investment.id}: DB should show $${performance.currentValue.toFixed(2)} (Return: $${performance.returnAmount.toFixed(2)})`);
});

console.log('\n🔧 NEXT STEPS:');
console.log('1. Verify investment-performance endpoint uses unified calculation');
console.log('2. Check for any caching or old calculation methods');
console.log('3. Ensure database values match calculated values');
console.log('4. Test all endpoints return consistent results');
console.log('5. Validate new investment inputs work correctly');