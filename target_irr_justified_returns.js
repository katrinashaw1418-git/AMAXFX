// 7-YEAR PROJECTION ANALYSIS - Detailed Breakdown
console.log('=== 7-YEAR PROJECTION: +107.62% DETAILED CALCULATION ===\n');

// Current portfolio state
const currentPortfolio = {
  totalInvested: 1850000,
  currentValue: 1966908.84,
  currentReturn: 116908.84,
  currentReturnPct: 6.32
};

// Individual investments with their midpoint IRR rates
const investments = [
  {
    id: 37,
    name: 'Bitcoin Tracker Fund',
    principal: 25000,
    currentValue: 25000,
    rate: 0.15,
    daysHeld: 0,
    timeInYears: 0.0000
  },
  {
    id: 26,
    name: 'Real Estate Equity Fund',
    principal: 500000,
    currentValue: 517440.61,
    rate: 0.11,
    daysHeld: 120,
    timeInYears: 0.3285
  },
  {
    id: 27,
    name: 'Corporate Credit Fund',
    principal: 300000,
    currentValue: 307814.54,
    rate: 0.11,
    daysHeld: 90,
    timeInYears: 0.2464
  },
  {
    id: 29,
    name: 'Bitcoin Tracker Fund',
    principal: 150000,
    currentValue: 157916.32,
    rate: 0.15,
    daysHeld: 180,
    timeInYears: 0.4928
  },
  {
    id: 28,
    name: 'Web3 Innovation Fund',
    principal: 750000,
    currentValue: 832440.54,
    rate: 0.18,
    daysHeld: 365,
    timeInYears: 0.9993
  },
  {
    id: 30,
    name: 'Ethereum Staking Fund',
    principal: 75000,
    currentValue: 76296.83,
    rate: 0.0575,
    daysHeld: 60,
    timeInYears: 0.1643
  },
  {
    id: 36,
    name: 'Bitcoin Tracker Fund',
    principal: 50000,
    currentValue: 50000,
    rate: 0.15,
    daysHeld: 1,
    timeInYears: 0.0027
  }
];

console.log('🎯 7-YEAR PROJECTION BY INVESTMENT:\n');

let projected7YearTotal = 0;

investments.forEach((inv, index) => {
  // Calculate 7-year projection from original investment date
  const totalTimeIn7Years = inv.timeInYears + 7;
  const projected7YearValue = inv.principal * Math.pow(1 + inv.rate, totalTimeIn7Years);
  const total7YearReturn = projected7YearValue - inv.principal;
  const total7YearReturnPct = (total7YearReturn / inv.principal) * 100;
  
  projected7YearTotal += projected7YearValue;
  
  console.log(`${index + 1}. ${inv.name}`);
  console.log(`   💰 Principal: $${inv.principal.toLocaleString()}`);
  console.log(`   📈 Rate: ${(inv.rate * 100).toFixed(2)}% annual`);
  console.log(`   ⏱️  Total Time: ${totalTimeIn7Years.toFixed(4)} years`);
  console.log(`   🧮 Formula: $${inv.principal.toLocaleString()} × (1 + ${inv.rate})^${totalTimeIn7Years.toFixed(4)}`);
  console.log(`   🎯 7-Year Value: $${projected7YearValue.toFixed(2)}`);
  console.log(`   💵 7-Year Return: +$${total7YearReturn.toFixed(2)} (+${total7YearReturnPct.toFixed(2)}%)`);
  console.log('');
});

console.log('=' .repeat(80));
console.log('📊 7-YEAR PORTFOLIO PROJECTION SUMMARY:');
console.log('=' .repeat(80));

const total7YearReturn = projected7YearTotal - currentPortfolio.totalInvested;
const total7YearReturnPct = (total7YearReturn / currentPortfolio.totalInvested) * 100;

console.log(`💰 Original Investment: $${currentPortfolio.totalInvested.toLocaleString()}`);
console.log(`🎯 7-Year Projected Value: $${projected7YearTotal.toFixed(2)}`);
console.log(`💵 7-Year Total Return: +$${total7YearReturn.toFixed(2)}`);
console.log(`📈 7-Year Return Percentage: +${total7YearReturnPct.toFixed(2)}%`);
console.log('');

console.log('✅ VERIFICATION:');
console.log(`Expected: +107.62%`);
console.log(`Calculated: +${total7YearReturnPct.toFixed(2)}%`);
console.log(`Match: ${Math.abs(total7YearReturnPct - 107.62) < 1 ? 'YES' : 'NO'}`);
console.log('');

console.log('🏆 7-YEAR TOP PERFORMERS BY ABSOLUTE RETURN:');
const sortedBy7YearReturn = investments.map(inv => {
  const totalTimeIn7Years = inv.timeInYears + 7;
  const projected7YearValue = inv.principal * Math.pow(1 + inv.rate, totalTimeIn7Years);
  const total7YearReturn = projected7YearValue - inv.principal;
  const total7YearReturnPct = (total7YearReturn / inv.principal) * 100;
  
  return {
    name: inv.name,
    principal: inv.principal,
    projected7YearValue: projected7YearValue,
    total7YearReturn: total7YearReturn,
    total7YearReturnPct: total7YearReturnPct
  };
}).sort((a, b) => b.total7YearReturn - a.total7YearReturn);

sortedBy7YearReturn.forEach((inv, index) => {
  console.log(`${index + 1}. ${inv.name}:`);
  console.log(`   $${inv.principal.toLocaleString()} → $${inv.projected7YearValue.toFixed(2)}`);
  console.log(`   Return: +$${inv.total7YearReturn.toFixed(2)} (+${inv.total7YearReturnPct.toFixed(2)}%)`);
});

console.log('\n🔍 METHODOLOGY BREAKDOWN:');
console.log('• Compound Growth Formula: Principal × (1 + Rate)^(Total Years)');
console.log('• Total Years = Current Years Held + 7 Additional Years');
console.log('• Each investment compounds at its specific midpoint IRR rate');
console.log('• Conservative approach: Bitcoin 15% vs market volatility');
console.log('• Consistent rates: Real Estate/Corporate 11%, VC 18%, Ethereum 5.75%');

console.log('\n💡 KEY INSIGHTS:');
console.log(`• Highest contributor: Web3 Innovation Fund (+$${sortedBy7YearReturn[0].total7YearReturn.toFixed(0)})`);
console.log(`• Compound effect: 7 years doubles most investments`);
console.log(`• Portfolio diversification across 4 asset categories`);
console.log(`• Total portfolio value would reach $${(projected7YearTotal/1000000).toFixed(1)}M in 7 years`);