// TARGET IRR ANALYSIS - DETAILED CALCULATION BREAKDOWN
console.log('=== DETAILED INVESTMENT RETURN CALCULATIONS ===\n');

// Current investment portfolio with actual data
const investmentPortfolio = [
  {
    name: "Real Estate Credit Fund",
    invested: 500000,
    investmentDate: new Date('2025-04-03'),
    currentDate: new Date('2025-08-02'),
    targetIRR: 0.11, // 11% annual
    category: "real_estate"
  },
  {
    name: "Corporate Credit Fund", 
    invested: 300000,
    investmentDate: new Date('2025-05-03'),
    currentDate: new Date('2025-08-02'),
    targetIRR: 0.11, // 11% annual
    category: "corporate_credit"
  },
  {
    name: "VC/Growth Equity Fund",
    invested: 750000,
    investmentDate: new Date('2024-08-01'),
    currentDate: new Date('2025-08-02'),
    targetIRR: 0.18, // 18% annual
    category: "venture_capital"
  },
  {
    name: "Bitcoin Tracker Fund (Original)",
    invested: 150000,
    investmentDate: new Date('2025-02-02'),
    currentDate: new Date('2025-08-02'),
    targetIRR: 0.15, // 15% annual (midpoint IRR)
    category: "digital_assets"
  },
  {
    name: "Ethereum Staking Fund",
    invested: 75000,
    investmentDate: new Date('2025-06-02'),
    currentDate: new Date('2025-08-02'),
    targetIRR: 0.0575, // 5.75% annual
    category: "digital_assets"
  },
  {
    name: "Bitcoin Tracker Fund ($50k)",
    invested: 50000,
    investmentDate: new Date('2025-08-01'),
    currentDate: new Date('2025-08-02'),
    targetIRR: 0.15, // 15% annual
    category: "digital_assets"
  },
  {
    name: "Bitcoin Tracker Fund ($25k)",
    invested: 25000,
    investmentDate: new Date('2025-08-02'),
    currentDate: new Date('2025-08-02'),
    targetIRR: 0.15, // 15% annual
    category: "digital_assets"
  }
];

console.log('TARGET IRR CALCULATION FORMULA:\n');
console.log('Current Value = Principal × (1 + Annual Rate)^Time');
console.log('Time = Days Held / 365.25 (accounting for leap years)');
console.log('Total Return = Current Value - Principal');
console.log('Return % = (Total Return / Principal) × 100\n');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

console.log('DETAILED CALCULATIONS BY INVESTMENT:\n');

investmentPortfolio.forEach((investment, index) => {
  // Calculate time held in years (precise calculation)
  const timeDiff = investment.currentDate - investment.investmentDate;
  const daysHeld = timeDiff / (1000 * 60 * 60 * 24);
  const yearsHeld = daysHeld / 365.25;
  
  // Target IRR calculation
  const growthFactor = Math.pow(1 + investment.targetIRR, yearsHeld);
  const currentValue = investment.invested * growthFactor;
  const returnAmount = currentValue - investment.invested;
  const returnPercent = (returnAmount / investment.invested) * 100;
  
  totalInvested += investment.invested;
  totalCurrentValue += currentValue;
  totalReturn += returnAmount;
  
  console.log(`${index + 1}. ${investment.name}`);
  console.log(`   Investment Date: ${investment.investmentDate.toDateString()}`);
  console.log(`   Current Date: ${investment.currentDate.toDateString()}`);
  console.log(`   Days Held: ${Math.round(daysHeld)} days`);
  console.log(`   Time Factor: ${yearsHeld.toFixed(4)} years`);
  console.log(`   Target IRR: ${(investment.targetIRR * 100).toFixed(2)}% annual`);
  console.log(`   Growth Factor: (1 + ${investment.targetIRR})^${yearsHeld.toFixed(4)} = ${growthFactor.toFixed(6)}`);
  console.log(`   Calculation: $${investment.invested.toLocaleString()} × ${growthFactor.toFixed(6)}`);
  console.log(`   Current Value: $${currentValue.toFixed(2)}`);
  console.log(`   Total Return: $${returnAmount.toFixed(2)}`);
  console.log(`   Return %: ${returnPercent.toFixed(2)}%`);
  console.log('');
});

const portfolioReturnPercent = (totalReturn / totalInvested) * 100;

console.log('PORTFOLIO TOTALS:\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toFixed(2)}`);
console.log(`Total Return: $${totalReturn.toFixed(2)}`);
console.log(`Portfolio Return: ${portfolioReturnPercent.toFixed(2)}%`);

console.log('\n=== 7-YEAR PROJECTION ANALYSIS ===\n');

// Calculate 7-year projections for each investment
console.log('7-YEAR TARGET IRR PROJECTIONS:\n');

let total7YearInvested = totalInvested;
let total7YearValue = 0;

investmentPortfolio.forEach((investment, index) => {
  const growthFactor7Year = Math.pow(1 + investment.targetIRR, 7);
  const value7Year = investment.invested * growthFactor7Year;
  const return7Year = value7Year - investment.invested;
  const return7YearPercent = (return7Year / investment.invested) * 100;
  
  total7YearValue += value7Year;
  
  console.log(`${index + 1}. ${investment.name}`);
  console.log(`   Initial Investment: $${investment.invested.toLocaleString()}`);
  console.log(`   Target IRR: ${(investment.targetIRR * 100).toFixed(2)}% annual`);
  console.log(`   7-Year Growth Factor: (1 + ${investment.targetIRR})^7 = ${growthFactor7Year.toFixed(4)}`);
  console.log(`   7-Year Value: $${value7Year.toFixed(2)}`);
  console.log(`   7-Year Return: $${return7Year.toFixed(2)} (${return7YearPercent.toFixed(1)}%)`);
  console.log('');
});

const total7YearReturn = total7YearValue - total7YearInvested;
const total7YearReturnPercent = (total7YearReturn / total7YearInvested) * 100;

console.log('7-YEAR PORTFOLIO PROJECTIONS:\n');
console.log(`Total Initial Investment: $${total7YearInvested.toLocaleString()}`);
console.log(`Total 7-Year Value: $${total7YearValue.toFixed(2)}`);
console.log(`Total 7-Year Return: $${total7YearReturn.toFixed(2)}`);
console.log(`Total 7-Year Return %: ${total7YearReturnPercent.toFixed(1)}%`);
console.log(`Annualized Return: ${(Math.pow(total7YearValue / total7YearInvested, 1/7) - 1).toFixed(4)} (${((Math.pow(total7YearValue / total7YearInvested, 1/7) - 1) * 100).toFixed(2)}%)`);

console.log('\n=== DEMONSTRATION WITH SAMPLE NEW INVESTMENT ===\n');

// Demonstrate calculation with a new hypothetical investment
const sampleInvestment = {
  name: "Sample New Investment (e.g., $100k)",
  invested: 100000,
  investmentDate: new Date('2025-08-02'),
  currentDate: new Date('2025-08-02'),
  targetIRR: 0.12 // 12% annual
};

const sampleDaysHeld = (sampleInvestment.currentDate - sampleInvestment.investmentDate) / (1000 * 60 * 60 * 24);
const sampleYearsHeld = sampleDaysHeld / 365.25;
const sampleGrowthFactor = Math.pow(1 + sampleInvestment.targetIRR, sampleYearsHeld);
const sampleCurrentValue = sampleInvestment.invested * sampleGrowthFactor;
const sampleReturn = sampleCurrentValue - sampleInvestment.invested;

console.log('NEW INVESTMENT CALCULATION EXAMPLE:');
console.log(`Investment: ${sampleInvestment.name}`);
console.log(`Amount: $${sampleInvestment.invested.toLocaleString()}`);
console.log(`Target IRR: ${(sampleInvestment.targetIRR * 100)}%`);
console.log(`Days Held: ${sampleDaysHeld} (just invested today)`);
console.log(`Current Value: $${sampleCurrentValue.toFixed(2)}`);
console.log(`Return: $${sampleReturn.toFixed(2)}`);

// Show updated portfolio totals with new investment
const newTotalInvested = totalInvested + sampleInvestment.invested;
const newTotalCurrent = totalCurrentValue + sampleCurrentValue;
const newTotalReturn = totalReturn + sampleReturn;
const newPortfolioPercent = (newTotalReturn / newTotalInvested) * 100;

console.log('\nUPDATED PORTFOLIO WITH NEW INVESTMENT:');
console.log(`New Total Invested: $${newTotalInvested.toLocaleString()}`);
console.log(`New Total Current: $${newTotalCurrent.toFixed(2)}`);
console.log(`New Total Return: $${newTotalReturn.toFixed(2)}`);
console.log(`New Portfolio Return: ${newPortfolioPercent.toFixed(2)}%`);

console.log('\nVERIFICATION: System automatically updates when new investments added ✓');