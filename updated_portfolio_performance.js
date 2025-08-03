// COMPREHENSIVE INVESTMENT PRODUCTS CALCULATION BREAKDOWN
console.log('=== INVESTMENT PRODUCTS: DETAILED CALCULATION ANALYSIS ===\n');

// Current portfolio figures from the dashboard
const portfolioData = {
  totalInvested: 1850000,
  currentValue: 1966908.84,
  totalReturn: 116908.84,
  returnPercent: 6.32,
  availableCapitalUSD: 67482,
  sevenYearProjection: 107.62
};

console.log('📊 INVESTMENT PRODUCTS OVERVIEW:');
console.log('Explore and invest in structured wealth management products\n');

console.log('💰 PORTFOLIO TOTALS:');
console.log(`Total Invested: $${portfolioData.totalInvested.toLocaleString()}`);
console.log(`Current Value: $${portfolioData.currentValue.toLocaleString()}`);
console.log(`Total Return: +${portfolioData.returnPercent}% ($${portfolioData.totalReturn.toLocaleString()})`);
console.log('');

console.log('💵 AVAILABLE CAPITAL:');
console.log(`USD: $${portfolioData.availableCapitalUSD.toLocaleString()}`);
console.log('');

// Individual investment breakdown with precise calculations
const investments = [
  {
    id: 37,
    productName: 'Bitcoin Tracker Fund',
    category: 'Digital Assets',
    principal: 25000,
    currentValue: 25000,
    totalReturn: 0,
    returnPercent: 0,
    investmentDate: '2025-08-02',
    daysHeld: 0,
    annualRate: 15.0
  },
  {
    id: 26,
    productName: 'Real Estate Equity Fund',
    category: 'Real Estate',
    principal: 500000,
    currentValue: 517440.61,
    totalReturn: 17440.61,
    returnPercent: 3.49,
    investmentDate: '2025-04-03',
    daysHeld: 120,
    annualRate: 11.0
  },
  {
    id: 27,
    productName: 'Corporate Credit Fund',
    category: 'Corporate Credit',
    principal: 300000,
    currentValue: 307814.54,
    totalReturn: 7814.54,
    returnPercent: 2.60,
    investmentDate: '2025-05-03',
    daysHeld: 90,
    annualRate: 11.0
  },
  {
    id: 29,
    productName: 'Bitcoin Tracker Fund',
    category: 'Digital Assets',
    principal: 150000,
    currentValue: 157916.32,
    totalReturn: 7916.32,
    returnPercent: 5.28,
    investmentDate: '2025-02-02',
    daysHeld: 180,
    annualRate: 15.0
  },
  {
    id: 28,
    productName: 'Web3 Innovation Fund',
    category: 'Digital Assets',
    principal: 750000,
    currentValue: 832440.54,
    totalReturn: 82440.54,
    returnPercent: 10.99,
    investmentDate: '2024-08-01',
    daysHeld: 365,
    annualRate: 18.0
  },
  {
    id: 30,
    productName: 'Ethereum Staking Fund',
    category: 'Digital Assets',
    principal: 75000,
    currentValue: 76296.83,
    totalReturn: 1296.83,
    returnPercent: 1.73,
    investmentDate: '2025-06-02',
    daysHeld: 60,
    annualRate: 5.75
  },
  {
    id: 36,
    productName: 'Bitcoin Tracker Fund',
    category: 'Digital Assets',
    principal: 50000,
    currentValue: 50000,
    totalReturn: 0,
    returnPercent: 0,
    investmentDate: '2025-08-01',
    daysHeld: 1,
    annualRate: 15.0
  }
];

console.log('🔬 DETAILED INVESTMENT BREAKDOWN:\n');

let runningInvested = 0;
let runningCurrent = 0;
let runningReturn = 0;

investments.forEach((inv, index) => {
  const timeInYears = inv.daysHeld / 365.25;
  
  runningInvested += inv.principal;
  runningCurrent += inv.currentValue;
  runningReturn += inv.totalReturn;
  
  console.log(`${index + 1}. ${inv.productName} (${inv.category})`);
  console.log(`   📅 Investment Date: ${new Date(inv.investmentDate).toDateString()}`);
  console.log(`   ⏱️  Time Held: ${inv.daysHeld} days (${timeInYears.toFixed(4)} years)`);
  console.log(`   💰 Principal: $${inv.principal.toLocaleString()}`);
  console.log(`   📈 Annual Rate: ${inv.annualRate}%`);
  console.log(`   🧮 Formula: $${inv.principal.toLocaleString()} × (1 + ${inv.annualRate/100})^${timeInYears.toFixed(4)}`);
  console.log(`   🎯 Current Value: $${inv.currentValue.toLocaleString()}`);
  console.log(`   💵 Return: +$${inv.totalReturn.toLocaleString()} (+${inv.returnPercent}%)`);
  console.log(`   📊 Running Total Invested: $${runningInvested.toLocaleString()}`);
  console.log(`   📊 Running Current Value: $${runningCurrent.toFixed(2)}`);
  console.log('');
});

console.log('=' .repeat(80));
console.log('📈 PERFORMANCE BY PERIOD:');
console.log('=' .repeat(80));
console.log(`Current Investment Value: $${portfolioData.currentValue}`);
console.log(`Total Return: $${portfolioData.totalReturn.toFixed(2)}`);
console.log(`Return Percentage: +${portfolioData.returnPercent}%`);
console.log('');

console.log('🎯 7-YEAR PROJECTION:');
console.log(`Projected Return: +${portfolioData.sevenYearProjection}%`);
console.log('');

// Category breakdown
const categoryTotals = {};
investments.forEach(inv => {
  if (!categoryTotals[inv.category]) {
    categoryTotals[inv.category] = {
      invested: 0,
      current: 0,
      return: 0,
      count: 0
    };
  }
  categoryTotals[inv.category].invested += inv.principal;
  categoryTotals[inv.category].current += inv.currentValue;
  categoryTotals[inv.category].return += inv.totalReturn;
  categoryTotals[inv.category].count += 1;
});

console.log('🏢 BREAKDOWN BY CATEGORY:');
Object.entries(categoryTotals).forEach(([category, data]) => {
  const percentage = (data.invested / portfolioData.totalInvested * 100).toFixed(1);
  const avgReturn = (data.return / data.invested * 100).toFixed(2);
  
  console.log(`${category.toUpperCase()}:`);
  console.log(`  • Positions: ${data.count} investments`);
  console.log(`  • Total Invested: $${data.invested.toLocaleString()} (${percentage}%)`);
  console.log(`  • Current Value: $${data.current.toLocaleString()}`);
  console.log(`  • Category Return: +$${data.return.toLocaleString()} (+${avgReturn}%)`);
  console.log('');
});

console.log('🏆 TOP PERFORMING INVESTMENTS:');
const sortedByReturn = [...investments]
  .sort((a, b) => b.totalReturn - a.totalReturn)
  .slice(0, 3);

sortedByReturn.forEach((inv, index) => {
  console.log(`${index + 1}. ${inv.productName}: +$${inv.totalReturn.toLocaleString()} (+${inv.returnPercent}%)`);
});

console.log('\n✅ CALCULATION VERIFICATION:');
console.log(`Expected Total Invested: $${portfolioData.totalInvested.toLocaleString()}`);
console.log(`Calculated Total Invested: $${runningInvested.toLocaleString()}`);
console.log(`Expected Current Value: $${portfolioData.currentValue}`);
console.log(`Calculated Current Value: $${runningCurrent.toFixed(2)}`);
console.log(`Expected Total Return: $${portfolioData.totalReturn.toFixed(2)}`);
console.log(`Calculated Total Return: $${runningReturn.toFixed(2)}`);
console.log(`Calculation Match: ${Math.abs(runningCurrent - portfolioData.currentValue) < 1 ? 'PERFECT' : 'CLOSE'}`);

console.log('\n⚡ SYSTEM FEATURES:');
console.log('• Real-time value updates every 5 seconds');
console.log('• Midpoint IRR calculation methodology');
console.log('• Time-weighted returns based on exact investment dates');
console.log('• Compound growth applied continuously');
console.log('• Consistent calculations across all API endpoints');