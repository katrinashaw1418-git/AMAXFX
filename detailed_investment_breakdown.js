// DETAILED INVESTMENT BREAKDOWN BY PRODUCT - VERIFY INCONSISTENCY
console.log('=== INVESTIGATING INVESTMENT PRODUCTS VS PERFORMANCE DISCREPANCY ===\n');

// Define the unified calculation function
function calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate = new Date()) {
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
        targetIRR = 0.15; // 15% for Bitcoin (conservative midpoint)
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

// Investment data from user-investments API
const userInvestments = [
  { id: 37, productId: 2, investedAmount: 25000.00, investmentDate: new Date('2025-08-02T09:45:46.000Z') },
  { id: 26, productId: 1, investedAmount: 500000.00, investmentDate: new Date('2025-04-03T15:37:02.000Z') },
  { id: 27, productId: 3, investedAmount: 300000.00, investmentDate: new Date('2025-05-03T15:37:02.000Z') },
  { id: 29, productId: 2, investedAmount: 150000.00, investmentDate: new Date('2025-02-02T15:37:02.000Z') },
  { id: 28, productId: 4, investedAmount: 750000.00, investmentDate: new Date('2024-08-01T15:37:02.000Z') },
  { id: 30, productId: 5, investedAmount: 75000.00, investmentDate: new Date('2025-06-02T15:37:02.000Z') },
  { id: 36, productId: 2, investedAmount: 50000.00, investmentDate: new Date('2025-08-01T15:31:58.000Z') }
];

// Product mapping
const productMapping = {
  1: { name: "Real Estate Credit Fund", category: "real_estate" },
  2: { name: "Bitcoin Tracker Fund", category: "digital_assets" },
  3: { name: "Corporate Credit Fund", category: "corporate_credit" },
  4: { name: "VC/Growth Equity Fund", category: "venture_capital" },
  5: { name: "Ethereum Staking Fund", category: "digital_assets" }
};

const currentDate = new Date('2025-08-02');

console.log('🔍 CALCULATION METHOD A: Individual Investment Calculation (Investment Products Page)');
console.log('===================================================================================\n');

let methodATotalInvested = 0;
let methodATotalCurrentValue = 0;
let methodATotalReturn = 0;

userInvestments.forEach(investment => {
  const product = productMapping[investment.productId];
  const performance = calculateInvestmentPerformance(
    product,
    investment.investedAmount,
    investment.investmentDate,
    currentDate
  );
  
  methodATotalInvested += investment.investedAmount;
  methodATotalCurrentValue += performance.currentValue;
  methodATotalReturn += performance.returnAmount;
  
  console.log(`Investment ${investment.id} (${product.name}):`);
  console.log(`  Principal: $${investment.investedAmount.toLocaleString()}`);
  console.log(`  Days Held: ${performance.daysHeld} days (${performance.timeInYears.toFixed(4)} years)`);
  console.log(`  IRR: ${(performance.targetIRR * 100).toFixed(2)}%`);
  console.log(`  Growth Factor: ${performance.growthFactor.toFixed(6)}`);
  console.log(`  Current Value: $${performance.currentValue.toFixed(2)}`);
  console.log(`  Return: $${performance.returnAmount.toFixed(2)} (${performance.returnPercentage.toFixed(2)}%)`);
  console.log('');
});

const methodAReturnPercent = (methodATotalReturn / methodATotalInvested) * 100;

console.log('📊 METHOD A TOTALS (Investment Products calculation):');
console.log(`Total Invested: $${methodATotalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${methodATotalCurrentValue.toFixed(2)}`);
console.log(`Total Return: $${methodATotalReturn.toFixed(2)}`);
console.log(`Return Percentage: ${methodAReturnPercent.toFixed(2)}%`);
console.log('');

// Now group by product for comparison
console.log('🔍 CALCULATION METHOD B: Product-Grouped Calculation');
console.log('=====================================================\n');

const productGroups = {};
userInvestments.forEach(investment => {
  const productId = investment.productId;
  if (!productGroups[productId]) {
    productGroups[productId] = {
      product: productMapping[productId],
      investments: []
    };
  }
  productGroups[productId].investments.push(investment);
});

let methodBTotalInvested = 0;
let methodBTotalCurrentValue = 0;
let methodBTotalReturn = 0;

Object.values(productGroups).forEach(group => {
  let productInvested = 0;
  let productCurrentValue = 0;
  let productReturn = 0;
  
  console.log(`${group.product.name} (${group.product.category}):`);
  
  group.investments.forEach(investment => {
    const performance = calculateInvestmentPerformance(
      group.product,
      investment.investedAmount,
      investment.investmentDate,
      currentDate
    );
    
    productInvested += investment.investedAmount;
    productCurrentValue += performance.currentValue;
    productReturn += performance.returnAmount;
    
    console.log(`  Investment ${investment.id}: $${investment.investedAmount.toLocaleString()} → $${performance.currentValue.toFixed(2)} (+$${performance.returnAmount.toFixed(2)})`);
  });
  
  const productReturnPercent = (productReturn / productInvested) * 100;
  console.log(`  Product Total: $${productInvested.toLocaleString()} → $${productCurrentValue.toFixed(2)} (+$${productReturn.toFixed(2)}, ${productReturnPercent.toFixed(2)}%)`);
  console.log('');
  
  methodBTotalInvested += productInvested;
  methodBTotalCurrentValue += productCurrentValue;
  methodBTotalReturn += productReturn;
});

const methodBReturnPercent = (methodBTotalReturn / methodBTotalInvested) * 100;

console.log('📊 METHOD B TOTALS (Product-grouped calculation):');
console.log(`Total Invested: $${methodBTotalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${methodBTotalCurrentValue.toFixed(2)}`);
console.log(`Total Return: $${methodBTotalReturn.toFixed(2)}`);
console.log(`Return Percentage: ${methodBReturnPercent.toFixed(2)}%`);
console.log('');

// Check consistency
console.log('✅ CONSISTENCY CHECK:');
console.log(`Method A vs Method B Invested: ${Math.abs(methodATotalInvested - methodBTotalInvested) < 0.01 ? 'CONSISTENT' : 'INCONSISTENT'}`);
console.log(`Method A vs Method B Current Value: ${Math.abs(methodATotalCurrentValue - methodBTotalCurrentValue) < 0.01 ? 'CONSISTENT' : 'INCONSISTENT'}`);
console.log(`Method A vs Method B Return: ${Math.abs(methodATotalReturn - methodBTotalReturn) < 0.01 ? 'CONSISTENT' : 'INCONSISTENT'}`);
console.log('');

// Calculate 7-year projections
console.log('🚀 7-YEAR PROJECTIONS BY PRODUCT:');
console.log('=================================\n');

const sevenYearsFromNow = new Date(currentDate);
sevenYearsFromNow.setFullYear(sevenYearsFromNow.getFullYear() + 7);

Object.values(productGroups).forEach(group => {
  let productInvested = 0;
  let product7YearValue = 0;
  
  group.investments.forEach(investment => {
    const performance = calculateInvestmentPerformance(
      group.product,
      investment.investedAmount,
      investment.investmentDate,
      sevenYearsFromNow
    );
    
    productInvested += investment.investedAmount;
    product7YearValue += performance.currentValue;
  });
  
  const product7YearReturn = product7YearValue - productInvested;
  const product7YearPercent = (product7YearReturn / productInvested) * 100;
  
  console.log(`${group.product.name}:`);
  console.log(`  Current Investment: $${productInvested.toLocaleString()}`);
  console.log(`  7-Year Projected Value: $${product7YearValue.toFixed(2)}`);
  console.log(`  7-Year Return: $${product7YearReturn.toFixed(2)} (${product7YearPercent.toFixed(2)}%)`);
  console.log('');
});

console.log('🎯 FINAL VERIFICATION - EXPECTED VALUES:');
console.log('=========================================');
console.log('Both Investment Products and Investment Performance sections should show:');
console.log(`✓ Total Invested: $${methodATotalInvested.toLocaleString()}`);
console.log(`✓ Current Value: $${methodATotalCurrentValue.toFixed(2)}`);
console.log(`✓ Total Return: $${methodATotalReturn.toFixed(2)}`);
console.log(`✓ Return Percentage: ${methodAReturnPercent.toFixed(2)}%`);
console.log('');
console.log('🔧 ACTION REQUIRED:');
console.log('Update both frontend sections to use the same calculation source for consistency.');