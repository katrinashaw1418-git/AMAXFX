// DETAILED INVESTMENT CALCULATIONS - MIDPOINT IRR METHODOLOGY
console.log('=== DETAILED CALCULATION ANALYSIS ===\n');

console.log('FORMULA: Current Value = Principal × (1 + Annual Rate)^(Days Held / 365.25)\n');

// Get current date for calculation
const currentDate = new Date('2025-08-02'); // Using consistent calculation date

// Define all investments with their exact details
const investments = [
  {
    id: 26,
    name: "Real Estate Credit Fund",
    principal: 500000,
    investmentDate: new Date('2025-04-03'),
    targetIRR: 0.11, // 11% annual
    category: "Real Estate"
  },
  {
    id: 27,
    name: "Corporate Credit Fund",
    principal: 300000,
    investmentDate: new Date('2025-05-03'),
    targetIRR: 0.11, // 11% annual
    category: "Corporate Credit"
  },
  {
    id: 28,
    name: "VC/Growth Equity Fund",
    principal: 750000,
    investmentDate: new Date('2024-08-02'),
    targetIRR: 0.18, // 18% annual
    category: "Venture Capital"
  },
  {
    id: 29,
    name: "Bitcoin Tracker Fund (Original)",
    principal: 150000,
    investmentDate: new Date('2025-02-02'),
    targetIRR: 0.15, // 15% annual (midpoint IRR, not 60% market)
    category: "Digital Assets"
  },
  {
    id: 30,
    name: "Ethereum Staking Fund",
    principal: 75000,
    investmentDate: new Date('2025-06-02'),
    targetIRR: 0.0575, // 5.75% annual
    category: "Digital Assets"
  },
  {
    id: 36,
    name: "Bitcoin Tracker Fund ($50k)",
    principal: 50000,
    investmentDate: new Date('2025-08-01'),
    targetIRR: 0.15, // 15% annual
    category: "Digital Assets"
  },
  {
    id: 37,
    name: "Bitcoin Tracker Fund ($25k)",
    principal: 25000,
    investmentDate: new Date('2025-08-02'),
    targetIRR: 0.15, // 15% annual
    category: "Digital Assets"
  }
];

console.log('INVESTMENT-BY-INVESTMENT DETAILED CALCULATIONS:\n');

let totalPrincipal = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

investments.forEach((investment, index) => {
  // Calculate days held
  const daysHeld = Math.floor((currentDate.getTime() - investment.investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate time factor in years
  const timeInYears = daysHeld / 365.25;
  
  // Calculate growth factor using midpoint IRR
  const growthFactor = Math.pow(1 + investment.targetIRR, timeInYears);
  
  // Calculate current value and return
  const currentValue = investment.principal * growthFactor;
  const totalReturnAmount = currentValue - investment.principal;
  const returnPercentage = (totalReturnAmount / investment.principal) * 100;
  
  // Add to totals
  totalPrincipal += investment.principal;
  totalCurrentValue += currentValue;
  totalReturn += totalReturnAmount;
  
  console.log(`${index + 1}. ${investment.name} (ID: ${investment.id})`);
  console.log(`   Category: ${investment.category}`);
  console.log(`   Principal Investment: $${investment.principal.toLocaleString()}`);
  console.log(`   Investment Date: ${investment.investmentDate.toISOString().split('T')[0]}`);
  console.log(`   Days Held: ${daysHeld} days`);
  console.log(`   Time in Years: ${timeInYears.toFixed(4)} years`);
  console.log(`   Target IRR: ${(investment.targetIRR * 100).toFixed(2)}% annual`);
  console.log(`   Growth Factor Calculation: (1 + ${investment.targetIRR})^${timeInYears.toFixed(4)}`);
  console.log(`   Growth Factor: ${growthFactor.toFixed(6)}`);
  console.log(`   Current Value Calculation: $${investment.principal.toLocaleString()} × ${growthFactor.toFixed(6)}`);
  console.log(`   Current Value: $${currentValue.toFixed(2)}`);
  console.log(`   Total Return: $${totalReturnAmount.toFixed(2)}`);
  console.log(`   Return Percentage: ${returnPercentage.toFixed(2)}%`);
  console.log(`   Annualized Return: ${((Math.pow(currentValue / investment.principal, 1 / timeInYears) - 1) * 100).toFixed(2)}%`);
  console.log('');
});

// Calculate overall portfolio metrics
const overallReturnPercentage = (totalReturn / totalPrincipal) * 100;
const weightedAverageTimeInYears = investments.reduce((sum, inv) => {
  const daysHeld = Math.floor((currentDate.getTime() - inv.investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeInYears = daysHeld / 365.25;
  const weight = inv.principal / totalPrincipal;
  return sum + (timeInYears * weight);
}, 0);

console.log('=== OVERALL PORTFOLIO SUMMARY ===\n');
console.log(`Total Principal Invested: $${totalPrincipal.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toFixed(2)}`);
console.log(`Total Return Amount: $${totalReturn.toFixed(2)}`);
console.log(`Overall Return Percentage: ${overallReturnPercentage.toFixed(2)}%`);
console.log(`Number of Investments: ${investments.length}`);
console.log(`Weighted Average Holding Period: ${weightedAverageTimeInYears.toFixed(2)} years`);

// Portfolio annualized return calculation
const portfolioAnnualizedReturn = (Math.pow(totalCurrentValue / totalPrincipal, 1 / weightedAverageTimeInYears) - 1) * 100;
console.log(`Portfolio Annualized Return: ${portfolioAnnualizedReturn.toFixed(2)}%`);

console.log('\n=== BREAKDOWN BY CATEGORY ===\n');

// Group by category
const categoryBreakdown = {};
investments.forEach(investment => {
  const daysHeld = Math.floor((currentDate.getTime() - investment.investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeInYears = daysHeld / 365.25;
  const growthFactor = Math.pow(1 + investment.targetIRR, timeInYears);
  const currentValue = investment.principal * growthFactor;
  const totalReturnAmount = currentValue - investment.principal;
  
  if (!categoryBreakdown[investment.category]) {
    categoryBreakdown[investment.category] = {
      principal: 0,
      currentValue: 0,
      totalReturn: 0,
      count: 0
    };
  }
  
  categoryBreakdown[investment.category].principal += investment.principal;
  categoryBreakdown[investment.category].currentValue += currentValue;
  categoryBreakdown[investment.category].totalReturn += totalReturnAmount;
  categoryBreakdown[investment.category].count += 1;
});

Object.entries(categoryBreakdown).forEach(([category, data]) => {
  const returnPercentage = (data.totalReturn / data.principal) * 100;
  const portfolioWeight = (data.principal / totalPrincipal) * 100;
  
  console.log(`${category}:`);
  console.log(`   Number of Investments: ${data.count}`);
  console.log(`   Total Principal: $${data.principal.toLocaleString()}`);
  console.log(`   Current Value: $${data.currentValue.toFixed(2)}`);
  console.log(`   Total Return: $${data.totalReturn.toFixed(2)}`);
  console.log(`   Return Percentage: ${returnPercentage.toFixed(2)}%`);
  console.log(`   Portfolio Weight: ${portfolioWeight.toFixed(1)}%`);
  console.log('');
});

console.log('=== CALCULATION METHODOLOGY VERIFICATION ===\n');
console.log('✓ All calculations use midpoint IRR methodology');
console.log('✓ Bitcoin investments use 15% rate (conservative approach vs 60% market rate)');
console.log('✓ Time calculations account for exact holding periods in days');
console.log('✓ Growth factors calculated as (1 + rate)^(time_in_years)');
console.log('✓ Current values calculated as Principal × Growth Factor');
console.log('✓ Returns calculated as Current Value - Principal');
console.log('✓ Percentages calculated as (Return / Principal) × 100');

console.log('\n=== 7-YEAR PROJECTION ANALYSIS ===\n');

let total7YearValue = 0;
console.log('7-Year Projections (using current values as baseline):\n');

investments.forEach((investment, index) => {
  const daysHeld = Math.floor((currentDate.getTime() - investment.investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const timeInYears = daysHeld / 365.25;
  const currentGrowthFactor = Math.pow(1 + investment.targetIRR, timeInYears);
  const currentValue = investment.principal * currentGrowthFactor;
  
  // Project 7 years from current value
  const sevenYearGrowthFactor = Math.pow(1 + investment.targetIRR, 7);
  const sevenYearValue = currentValue * sevenYearGrowthFactor;
  const sevenYearGain = sevenYearValue - currentValue;
  const sevenYearGainPercent = (sevenYearGain / currentValue) * 100;
  
  total7YearValue += sevenYearValue;
  
  console.log(`${index + 1}. ${investment.name}`);
  console.log(`   Current Value: $${currentValue.toFixed(2)}`);
  console.log(`   7-Year Growth Factor: (1 + ${investment.targetIRR})^7 = ${sevenYearGrowthFactor.toFixed(4)}`);
  console.log(`   7-Year Projected Value: $${sevenYearValue.toFixed(2)}`);
  console.log(`   7-Year Gain: $${sevenYearGain.toFixed(2)} (${sevenYearGainPercent.toFixed(1)}%)`);
  console.log('');
});

const total7YearGain = total7YearValue - totalCurrentValue;
const total7YearGainPercent = (total7YearGain / totalCurrentValue) * 100;

console.log('7-YEAR PORTFOLIO PROJECTION SUMMARY:');
console.log(`Current Portfolio Value: $${totalCurrentValue.toFixed(2)}`);
console.log(`7-Year Projected Value: $${total7YearValue.toFixed(2)}`);
console.log(`7-Year Total Gain: $${total7YearGain.toFixed(2)}`);
console.log(`7-Year Gain Percentage: ${total7YearGainPercent.toFixed(1)}%`);
console.log(`Average Annual Return (7-year): ${((Math.pow(total7YearValue / totalCurrentValue, 1/7) - 1) * 100).toFixed(2)}%`);

console.log(`\nFINAL VERIFICATION: Portfolio total shows $${totalPrincipal.toLocaleString()} invested with $${totalReturn.toFixed(2)} return (${overallReturnPercentage.toFixed(2)}%)`);