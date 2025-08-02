// PRECISE CALCULATION TO IDENTIFY 1 CENT DISCREPANCY
console.log('=== IDENTIFYING 1 CENT DISCREPANCY: $116,908.84 vs $116,908.85 ===\n');

// Exact investment data with precise calculations
const investments = [
  {
    id: 37,
    name: 'Bitcoin Tracker Fund',
    principal: 25000,
    investmentDate: '2025-08-02',
    annualRate: 0.15,
    daysHeld: 0
  },
  {
    id: 26,
    name: 'Real Estate Equity Fund',
    principal: 500000,
    investmentDate: '2025-04-03',
    annualRate: 0.11,
    daysHeld: 120
  },
  {
    id: 27,
    name: 'Corporate Credit Fund',
    principal: 300000,
    investmentDate: '2025-05-03',
    annualRate: 0.11,
    daysHeld: 90
  },
  {
    id: 29,
    name: 'Bitcoin Tracker Fund',
    principal: 150000,
    investmentDate: '2025-02-02',
    annualRate: 0.15,
    daysHeld: 180
  },
  {
    id: 28,
    name: 'Web3 Innovation Fund',
    principal: 750000,
    investmentDate: '2024-08-01',
    annualRate: 0.18,
    daysHeld: 365
  },
  {
    id: 30,
    name: 'Ethereum Staking Fund',
    principal: 75000,
    investmentDate: '2025-06-02',
    annualRate: 0.0575,
    daysHeld: 60
  },
  {
    id: 36,
    name: 'Bitcoin Tracker Fund',
    principal: 50000,
    investmentDate: '2025-08-01',
    annualRate: 0.15,
    daysHeld: 1
  }
];

console.log('🔬 ULTRA-PRECISE CALCULATION BREAKDOWN:\n');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

investments.forEach((inv, index) => {
  const timeInYears = inv.daysHeld / 365.25;
  
  // High precision calculation
  const currentValue = inv.principal * Math.pow(1 + inv.annualRate, timeInYears);
  const investmentReturn = currentValue - inv.principal;
  
  totalInvested += inv.principal;
  totalCurrentValue += currentValue;
  totalReturn += investmentReturn;
  
  console.log(`${index + 1}. ${inv.name}`);
  console.log(`   💰 Principal: $${inv.principal.toLocaleString()}`);
  console.log(`   ⏱️  Days Held: ${inv.daysHeld} (${timeInYears.toFixed(8)} years)`);
  console.log(`   📈 Annual Rate: ${(inv.annualRate * 100).toFixed(2)}%`);
  console.log(`   🧮 Calculation: ${inv.principal} × (1 + ${inv.annualRate})^${timeInYears.toFixed(8)}`);
  console.log(`   🎯 Current Value (High Precision): $${currentValue.toFixed(8)}`);
  console.log(`   🎯 Current Value (Rounded): $${currentValue.toFixed(2)}`);
  console.log(`   💵 Return: +$${investmentReturn.toFixed(8)}`);
  console.log('');
});

console.log('=' .repeat(80));
console.log('📊 PRECISION ANALYSIS:');
console.log('=' .repeat(80));

console.log(`💰 Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`🎯 Total Current Value (High Precision): $${totalCurrentValue.toFixed(8)}`);
console.log(`🎯 Total Current Value (2 decimals): $${totalCurrentValue.toFixed(2)}`);
console.log(`💵 Total Return (High Precision): $${totalReturn.toFixed(8)}`);
console.log(`💵 Total Return (2 decimals): $${totalReturn.toFixed(2)}`);
console.log('');

console.log('🔍 ROUNDING ANALYSIS:');
console.log(`Expected Value 1: $116,908.84`);
console.log(`Expected Value 2: $116,908.85`);
console.log(`Calculated Value: $${totalReturn.toFixed(2)}`);
console.log(`High Precision: $${totalReturn.toFixed(8)}`);
console.log('');

// Test different rounding methods
console.log('🧮 DIFFERENT ROUNDING METHODS:');
console.log(`Math.round(return * 100) / 100: $${(Math.round(totalReturn * 100) / 100).toFixed(2)}`);
console.log(`Math.floor(return * 100) / 100: $${(Math.floor(totalReturn * 100) / 100).toFixed(2)}`);
console.log(`Math.ceil(return * 100) / 100: $${(Math.ceil(totalReturn * 100) / 100).toFixed(2)}`);
console.log(`toFixed(2): $${totalReturn.toFixed(2)}`);
console.log('');

// Check if any individual investment has rounding issues
console.log('🔎 INDIVIDUAL INVESTMENT ROUNDING CHECK:');
let sumOfRoundedReturns = 0;
investments.forEach((inv, index) => {
  const timeInYears = inv.daysHeld / 365.25;
  const currentValue = inv.principal * Math.pow(1 + inv.annualRate, timeInYears);
  const investmentReturn = currentValue - inv.principal;
  const roundedReturn = Math.round(investmentReturn * 100) / 100;
  
  sumOfRoundedReturns += roundedReturn;
  
  console.log(`${index + 1}. ${inv.name}:`);
  console.log(`   Raw Return: $${investmentReturn.toFixed(8)}`);
  console.log(`   Rounded Return: $${roundedReturn.toFixed(2)}`);
  console.log(`   Difference: $${(investmentReturn - roundedReturn).toFixed(8)}`);
});

console.log('');
console.log('📊 ROUNDING IMPACT ANALYSIS:');
console.log(`Sum of individually rounded returns: $${sumOfRoundedReturns.toFixed(2)}`);
console.log(`Total return then rounded: $${totalReturn.toFixed(2)}`);
console.log(`Difference: $${Math.abs(sumOfRoundedReturns - totalReturn).toFixed(8)}`);

console.log('\n✅ DISCREPANCY IDENTIFICATION:');
const diff1 = Math.abs(totalReturn - 116908.84);
const diff2 = Math.abs(totalReturn - 116908.85);
console.log(`Difference from $116,908.84: $${diff1.toFixed(8)}`);
console.log(`Difference from $116,908.85: $${diff2.toFixed(8)}`);
console.log(`Closest match: $116,908.${diff1 < diff2 ? '84' : '85'}`);

// Check exact calculation with today's date
const today = new Date('2025-08-02');
console.log('\n📅 DATE VERIFICATION:');
console.log(`Today's Date: ${today.toDateString()}`);
console.log(`Calculation Date Reference: August 2, 2025`);

// Final recommendation
console.log('\n💡 RECOMMENDATION:');
console.log('The discrepancy likely comes from:');
console.log('1. Different rounding methods between frontend and backend');
console.log('2. Precision differences in floating point calculations');
console.log('3. Individual vs aggregate rounding strategies');
console.log('4. Date calculation variations (leap year, exact days)');