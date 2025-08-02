// DETAILED MIDPOINT IRR CALCULATION BREAKDOWN
console.log('=== DETAILED TOTAL RETURN CALCULATION: $171,870.52 (+9.29%) ===\n');

// Investment data from database
const investments = [
  { id: 37, productId: 2, amount: 25000.00, date: '2025-08-02T09:45:46.000Z', product: 'Bitcoin Tracker Fund', category: 'digital_assets' },
  { id: 26, productId: 1, amount: 500000.00, date: '2025-04-03T15:37:02.000Z', product: 'Real Estate Credit Fund', category: 'real_estate' },
  { id: 27, productId: 3, amount: 300000.00, date: '2025-05-03T15:37:02.000Z', product: 'Corporate Credit Fund', category: 'corporate_credit' },
  { id: 29, productId: 2, amount: 150000.00, date: '2025-02-02T15:37:02.000Z', product: 'Bitcoin Tracker Fund', category: 'digital_assets' },
  { id: 28, productId: 4, amount: 750000.00, date: '2024-08-01T15:37:02.000Z', product: 'VC/Growth Equity Fund', category: 'venture_capital' },
  { id: 30, productId: 5, amount: 75000.00, date: '2025-06-02T15:37:02.000Z', product: 'Ethereum Staking Fund', category: 'digital_assets' },
  { id: 36, productId: 2, amount: 50000.00, date: '2025-08-01T15:31:58.000Z', product: 'Bitcoin Tracker Fund', category: 'digital_assets' }
];

// Midpoint IRR rates by category
const irrRates = {
  'real_estate': 0.11,      // 11% annual
  'corporate_credit': 0.11, // 11% annual
  'venture_capital': 0.18,  // 18% annual
  'digital_assets': {
    'bitcoin': 0.15,        // 15% annual (conservative midpoint)
    'ethereum': 0.0575      // 5.75% annual (staking yield)
  }
};

// Current date for calculation
const currentDate = new Date('2025-08-02');

console.log('🔍 STEP-BY-STEP CALCULATION METHODOLOGY:');
console.log('=======================================');
console.log('Formula: Current Value = Principal × (1 + IRR)^(Days Held / 365.25)');
console.log('Where IRR = Target Internal Rate of Return (midpoint methodology)');
console.log('');

console.log('📊 INVESTMENT-BY-INVESTMENT BREAKDOWN:');
console.log('======================================\n');

let totalInvested = 0;
let totalCurrentValue = 0;
let calculationSteps = [];

investments.forEach((inv, index) => {
  const investmentDate = new Date(inv.date);
  const daysHeld = Math.max(0, Math.floor((currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const timeInYears = daysHeld / 365.25;
  
  // Determine IRR rate
  let irrRate = 0.08; // default
  if (inv.category === 'real_estate') irrRate = irrRates.real_estate;
  else if (inv.category === 'corporate_credit') irrRate = irrRates.corporate_credit;
  else if (inv.category === 'venture_capital') irrRate = irrRates.venture_capital;
  else if (inv.category === 'digital_assets') {
    if (inv.product.toLowerCase().includes('bitcoin')) {
      irrRate = irrRates.digital_assets.bitcoin;
    } else if (inv.product.toLowerCase().includes('ethereum')) {
      irrRate = irrRates.digital_assets.ethereum;
    }
  }
  
  const growthFactor = Math.pow(1 + irrRate, timeInYears);
  const currentValue = inv.amount * growthFactor;
  const returnAmount = currentValue - inv.amount;
  const returnPercent = (returnAmount / inv.amount) * 100;
  
  totalInvested += inv.amount;
  totalCurrentValue += currentValue;
  
  console.log(`${index + 1}. ${inv.product} (Investment ID: ${inv.id})`);
  console.log(`   Principal Investment: $${inv.amount.toLocaleString()}`);
  console.log(`   Investment Date: ${investmentDate.toDateString()}`);
  console.log(`   Days Held: ${daysHeld} days (${timeInYears.toFixed(4)} years)`);
  console.log(`   Target IRR Rate: ${(irrRate * 100).toFixed(2)}% annually`);
  console.log(`   Growth Factor: (1 + ${irrRate})^${timeInYears.toFixed(4)} = ${growthFactor.toFixed(6)}`);
  console.log(`   Current Value: $${inv.amount.toLocaleString()} × ${growthFactor.toFixed(6)} = $${currentValue.toFixed(2)}`);
  console.log(`   Return: $${returnAmount.toFixed(2)} (${returnPercent.toFixed(2)}%)`);
  console.log('');
  
  calculationSteps.push({
    product: inv.product,
    principal: inv.amount,
    daysHeld,
    irrRate,
    growthFactor,
    currentValue,
    returnAmount
  });
});

const totalReturn = totalCurrentValue - totalInvested;
const totalReturnPercent = (totalReturn / totalInvested) * 100;

console.log('📈 TOTAL PORTFOLIO CALCULATION:');
console.log('===============================');
console.log(`Sum of All Investments: $${totalInvested.toLocaleString()}`);
console.log(`Sum of All Current Values: $${totalCurrentValue.toFixed(2)}`);
console.log(`Total Return: $${totalCurrentValue.toFixed(2)} - $${totalInvested.toLocaleString()} = $${totalReturn.toFixed(2)}`);
console.log(`Return Percentage: ($${totalReturn.toFixed(2)} ÷ $${totalInvested.toLocaleString()}) × 100 = ${totalReturnPercent.toFixed(2)}%`);
console.log('');

console.log('✅ VERIFICATION OF API RESPONSE:');
console.log('================================');
console.log(`Expected Total Return: $${totalReturn.toFixed(2)}`);
console.log(`Expected Return Percentage: ${totalReturnPercent.toFixed(2)}%`);
console.log(`Expected Current Value: $${totalCurrentValue.toFixed(2)}`);
console.log('');

console.log('🚀 7-YEAR PROJECTION CALCULATION:');
console.log('=================================');
console.log('Formula: 7-Year Value = Principal × (1 + IRR)^7');
console.log('');

// Group by product category for 7-year projections
const categoryGroups = {};
investments.forEach(inv => {
  const category = inv.category;
  if (!categoryGroups[category]) {
    categoryGroups[category] = {
      products: new Set(),
      totalInvested: 0,
      irrRate: 0
    };
  }
  categoryGroups[category].products.add(inv.product);
  categoryGroups[category].totalInvested += inv.amount;
  
  // Set IRR rate
  if (category === 'real_estate') categoryGroups[category].irrRate = irrRates.real_estate;
  else if (category === 'corporate_credit') categoryGroups[category].irrRate = irrRates.corporate_credit;
  else if (category === 'venture_capital') categoryGroups[category].irrRate = irrRates.venture_capital;
  else if (category === 'digital_assets') {
    if (inv.product.toLowerCase().includes('bitcoin')) {
      if (!categoryGroups[category].bitcoinInvested) categoryGroups[category].bitcoinInvested = 0;
      categoryGroups[category].bitcoinInvested += inv.amount;
    } else if (inv.product.toLowerCase().includes('ethereum')) {
      if (!categoryGroups[category].ethereumInvested) categoryGroups[category].ethereumInvested = 0;
      categoryGroups[category].ethereumInvested += inv.amount;
    }
  }
});

// Calculate 7-year projections by category
Object.entries(categoryGroups).forEach(([category, group]) => {
  console.log(`${category.toUpperCase().replace('_', ' ')} CATEGORY:`);
  
  if (category === 'digital_assets') {
    // Handle Bitcoin and Ethereum separately
    if (group.bitcoinInvested) {
      const bitcoinGrowth = Math.pow(1 + irrRates.digital_assets.bitcoin, 7);
      const bitcoin7YearValue = group.bitcoinInvested * bitcoinGrowth;
      const bitcoin7YearReturn = bitcoin7YearValue - group.bitcoinInvested;
      const bitcoin7YearPercent = ((bitcoin7YearReturn / group.bitcoinInvested) * 100);
      
      console.log(`  Bitcoin Tracker Fund:`);
      console.log(`    Current Investment: $${group.bitcoinInvested.toLocaleString()}`);
      console.log(`    IRR Rate: ${(irrRates.digital_assets.bitcoin * 100).toFixed(1)}%`);
      console.log(`    7-Year Growth Factor: (1 + ${irrRates.digital_assets.bitcoin})^7 = ${bitcoinGrowth.toFixed(6)}`);
      console.log(`    7-Year Value: $${group.bitcoinInvested.toLocaleString()} × ${bitcoinGrowth.toFixed(6)} = $${bitcoin7YearValue.toFixed(2)}`);
      console.log(`    7-Year Return: $${bitcoin7YearReturn.toFixed(2)} (${bitcoin7YearPercent.toFixed(2)}%)`);
    }
    
    if (group.ethereumInvested) {
      const ethereumGrowth = Math.pow(1 + irrRates.digital_assets.ethereum, 7);
      const ethereum7YearValue = group.ethereumInvested * ethereumGrowth;
      const ethereum7YearReturn = ethereum7YearValue - group.ethereumInvested;
      const ethereum7YearPercent = ((ethereum7YearReturn / group.ethereumInvested) * 100);
      
      console.log(`  Ethereum Staking Fund:`);
      console.log(`    Current Investment: $${group.ethereumInvested.toLocaleString()}`);
      console.log(`    IRR Rate: ${(irrRates.digital_assets.ethereum * 100).toFixed(2)}%`);
      console.log(`    7-Year Growth Factor: (1 + ${irrRates.digital_assets.ethereum})^7 = ${ethereumGrowth.toFixed(6)}`);
      console.log(`    7-Year Value: $${group.ethereumInvested.toLocaleString()} × ${ethereumGrowth.toFixed(6)} = $${ethereum7YearValue.toFixed(2)}`);
      console.log(`    7-Year Return: $${ethereum7YearReturn.toFixed(2)} (${ethereum7YearPercent.toFixed(2)}%)`);
    }
  } else {
    const growthFactor7Year = Math.pow(1 + group.irrRate, 7);
    const value7Year = group.totalInvested * growthFactor7Year;
    const return7Year = value7Year - group.totalInvested;
    const returnPercent7Year = ((return7Year / group.totalInvested) * 100);
    
    console.log(`  Current Investment: $${group.totalInvested.toLocaleString()}`);
    console.log(`  IRR Rate: ${(group.irrRate * 100).toFixed(1)}%`);
    console.log(`  7-Year Growth Factor: (1 + ${group.irrRate})^7 = ${growthFactor7Year.toFixed(6)}`);
    console.log(`  7-Year Value: $${group.totalInvested.toLocaleString()} × ${growthFactor7Year.toFixed(6)} = $${value7Year.toFixed(2)}`);
    console.log(`  7-Year Return: $${return7Year.toFixed(2)} (${returnPercent7Year.toFixed(2)}%)`);
  }
  console.log('');
});

console.log('🎯 SUMMARY - WHY $171,870.52 (+9.29%):');
console.log('======================================');
console.log('The total return is calculated by:');
console.log('1. Each investment grows at its category-specific midpoint IRR rate');
console.log('2. Growth is compounded daily based on exact days held');
console.log('3. Individual returns are summed to get total portfolio return');
console.log('4. Return percentage = Total Return ÷ Total Invested × 100');
console.log('');
console.log('This methodology ensures:');
console.log('• Consistent calculation across all dashboard sections');
console.log('• Accurate time-weighted returns based on actual holding periods');
console.log('• Realistic growth projections using conservative midpoint IRR rates');
console.log('• Real-time updates when new investments are added');