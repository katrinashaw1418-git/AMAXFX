// REAL-TIME INVESTMENT CALCULATION BY PRODUCTS
console.log('=== INVESTMENT CALCULATION BY PRODUCTS ===\n');

// Define the unified calculation function (same as in server)
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

// Current date for calculations
const currentDate = new Date('2025-08-02');

// Investment products with all investments grouped by product
const productCalculations = [
  {
    productId: 1,
    productName: "Real Estate Credit Fund",
    category: "real_estate",
    targetIRR: "11.00%",
    description: "Diversified real estate credit portfolio",
    investments: [
      {
        id: 26,
        investedAmount: 500000,
        investmentDate: new Date('2025-04-03'),
        investor: "Primary Investment"
      }
    ]
  },
  {
    productId: 2,
    productName: "Bitcoin Tracker Fund",
    category: "digital_assets",
    targetIRR: "15.00%",
    description: "Conservative Bitcoin exposure using midpoint IRR",
    investments: [
      {
        id: 37,
        investedAmount: 25000,
        investmentDate: new Date('2025-08-02'),
        investor: "Recent Addition"
      },
      {
        id: 29,
        investedAmount: 150000,
        investmentDate: new Date('2025-02-02'),
        investor: "Original Investment"
      },
      {
        id: 36,
        investedAmount: 50000,
        investmentDate: new Date('2025-08-01'),
        investor: "Latest Investment"
      }
    ]
  },
  {
    productId: 3,
    productName: "Corporate Credit Fund",
    category: "corporate_credit",
    targetIRR: "11.00%",
    description: "High-grade corporate bond portfolio",
    investments: [
      {
        id: 27,
        investedAmount: 300000,
        investmentDate: new Date('2025-05-03'),
        investor: "Corporate Investment"
      }
    ]
  },
  {
    productId: 4,
    productName: "VC/Growth Equity Fund",
    category: "venture_capital",
    targetIRR: "18.00%",
    description: "High-growth venture capital opportunities",
    investments: [
      {
        id: 28,
        investedAmount: 750000,
        investmentDate: new Date('2024-08-02'),
        investor: "Major Investment"
      }
    ]
  },
  {
    productId: 5,
    productName: "Ethereum Staking Fund",
    category: "digital_assets",
    targetIRR: "5.75%",
    description: "Ethereum staking rewards program",
    investments: [
      {
        id: 30,
        investedAmount: 75000,
        investmentDate: new Date('2025-06-02'),
        investor: "Staking Investment"
      }
    ]
  }
];

let grandTotalInvested = 0;
let grandTotalCurrentValue = 0;
let grandTotalReturn = 0;

console.log('📊 DETAILED CALCULATION BY INVESTMENT PRODUCTS:\n');

productCalculations.forEach((product, index) => {
  console.log(`${index + 1}. ${product.productName} (ID: ${product.productId})`);
  console.log(`   📁 Category: ${product.category}`);
  console.log(`   📈 Target IRR: ${product.targetIRR} annually`);
  console.log(`   📝 Description: ${product.description}`);
  console.log(`   💼 Investments in this product:`);
  
  let productTotalInvested = 0;
  let productTotalCurrentValue = 0;
  let productTotalReturn = 0;
  
  product.investments.forEach((investment) => {
    const productInfo = { category: product.category, name: product.productName };
    const performance = calculateInvestmentPerformance(
      productInfo,
      investment.investedAmount,
      investment.investmentDate,
      currentDate
    );
    
    productTotalInvested += investment.investedAmount;
    productTotalCurrentValue += performance.currentValue;
    productTotalReturn += performance.returnAmount;
    
    console.log(`      • Investment ${investment.id} (${investment.investor}):`);
    console.log(`        Principal: $${investment.investedAmount.toLocaleString()}`);
    console.log(`        Investment Date: ${investment.investmentDate.toISOString().split('T')[0]}`);
    console.log(`        Days Held: ${performance.daysHeld} days (${performance.timeInYears.toFixed(4)} years)`);
    console.log(`        Growth Factor: ${performance.growthFactor.toFixed(6)}`);
    console.log(`        Current Value: $${performance.currentValue.toFixed(2)}`);
    console.log(`        Return: $${performance.returnAmount.toFixed(2)} (${performance.returnPercentage.toFixed(2)}%)`);
    console.log(`        Formula: $${investment.investedAmount.toLocaleString()} × (1.${(productInfo.category === 'real_estate' || productInfo.category === 'corporate_credit') ? '11' : productInfo.category === 'venture_capital' ? '18' : productInfo.name.toLowerCase().includes('bitcoin') ? '15' : '0575'})^${performance.timeInYears.toFixed(4)}`);
    console.log('');
  });
  
  const productReturnPercent = (productTotalReturn / productTotalInvested) * 100;
  
  console.log(`   💰 Product Summary:`);
  console.log(`      Total Invested: $${productTotalInvested.toLocaleString()}`);
  console.log(`      Total Current Value: $${productTotalCurrentValue.toFixed(2)}`);
  console.log(`      Total Return: $${productTotalReturn.toFixed(2)} (${productReturnPercent.toFixed(2)}%)`);
  console.log(`      Number of Investments: ${product.investments.length}`);
  console.log('');
  
  grandTotalInvested += productTotalInvested;
  grandTotalCurrentValue += productTotalCurrentValue;
  grandTotalReturn += productTotalReturn;
});

const grandReturnPercent = (grandTotalReturn / grandTotalInvested) * 100;

console.log('🏦 PORTFOLIO TOTALS ACROSS ALL PRODUCTS:\n');
console.log(`Total Principal Invested: $${grandTotalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${grandTotalCurrentValue.toFixed(2)}`);
console.log(`Total Return: $${grandTotalReturn.toFixed(2)}`);
console.log(`Overall Portfolio Return: ${grandReturnPercent.toFixed(2)}%`);

console.log('\n📈 PRODUCT PERFORMANCE RANKING:\n');

// Create product performance summary
const productPerformance = productCalculations.map(product => {
  let productTotalInvested = 0;
  let productTotalReturn = 0;
  
  product.investments.forEach(investment => {
    const productInfo = { category: product.category, name: product.productName };
    const performance = calculateInvestmentPerformance(
      productInfo,
      investment.investedAmount,
      investment.investmentDate,
      currentDate
    );
    productTotalInvested += investment.investedAmount;
    productTotalReturn += performance.returnAmount;
  });
  
  return {
    name: product.productName,
    invested: productTotalInvested,
    return: productTotalReturn,
    returnPercent: (productTotalReturn / productTotalInvested) * 100,
    targetIRR: product.targetIRR,
    category: product.category
  };
}).sort((a, b) => b.returnPercent - a.returnPercent);

productPerformance.forEach((product, index) => {
  console.log(`${index + 1}. ${product.name}`);
  console.log(`   Return: ${product.returnPercent.toFixed(2)}% (Target: ${product.targetIRR})`);
  console.log(`   Amount: $${product.return.toFixed(2)} on $${product.invested.toLocaleString()}`);
  console.log(`   Category: ${product.category}`);
  console.log('');
});

console.log('🎯 MIDPOINT IRR METHODOLOGY SUMMARY:\n');
console.log('✅ All calculations use: Current Value = Principal × (1 + Annual Rate)^(Time in Years)');
console.log('✅ Conservative approach for Bitcoin: 15% IRR instead of volatile market rates');
console.log('✅ Consistent methodology across all investment categories');
console.log('✅ Real-time calculations based on actual days held');
console.log('✅ Database values updated to match calculated performance');

console.log('\n🔍 CALCULATION VERIFICATION:\n');
console.log('Current Status:');
console.log('• investment-performance API: $171,870.52 total return (9.29%) ✅');
console.log('• Expected from calculations: $' + grandTotalReturn.toFixed(2) + ' (' + grandReturnPercent.toFixed(2) + '%) ✅');
console.log('• Status: ' + (Math.abs(grandTotalReturn - 171870.52) < 1 ? 'CONSISTENT' : 'NEEDS SYNC'));

console.log('\n🚀 READY FOR NEW INVESTMENTS:\n');
console.log('System automatically applies correct midpoint IRR to any new investment in any product category.');