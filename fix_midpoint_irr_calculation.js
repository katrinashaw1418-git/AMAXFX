// FIX MIDPOINT IRR CALCULATION - Update Database Values
console.log('=== FIXING MIDPOINT IRR CALCULATION INCONSISTENCIES ===\n');

// Define the correct investment data with midpoint IRR calculations
const currentDate = new Date('2025-08-02');

const investmentUpdates = [
  {
    id: 37,
    name: "Bitcoin Tracker ($25k)",
    principal: 25000,
    investmentDate: new Date('2025-08-02'),
    targetIRR: 0.15,
    category: "Digital Assets",
    productId: 2
  },
  {
    id: 26,
    name: "Real Estate Credit Fund",
    principal: 500000,
    investmentDate: new Date('2025-04-03'),
    targetIRR: 0.11,
    category: "Real Estate",
    productId: 1
  },
  {
    id: 27,
    name: "Corporate Credit Fund",
    principal: 300000,
    investmentDate: new Date('2025-05-03'),
    targetIRR: 0.11,
    category: "Corporate Credit",
    productId: 3
  },
  {
    id: 29,
    name: "Bitcoin Tracker (Original)",
    principal: 150000,
    investmentDate: new Date('2025-02-02'),
    targetIRR: 0.15,
    category: "Digital Assets",
    productId: 2
  },
  {
    id: 28,
    name: "VC/Growth Equity Fund",
    principal: 750000,
    investmentDate: new Date('2024-08-02'),
    targetIRR: 0.18,
    category: "Venture Capital",
    productId: 4
  },
  {
    id: 30,
    name: "Ethereum Staking Fund",
    principal: 75000,
    investmentDate: new Date('2025-06-02'),
    targetIRR: 0.0575,
    category: "Digital Assets",
    productId: 5
  },
  {
    id: 36,
    name: "Bitcoin Tracker ($50k)",
    principal: 50000,
    investmentDate: new Date('2025-08-01'),
    targetIRR: 0.15,
    category: "Digital Assets",
    productId: 2
  }
];

console.log('CALCULATING CORRECT VALUES USING MIDPOINT IRR:\n');

let totalPrincipal = 0;
let totalCurrentValue = 0;
let totalReturn = 0;
const updateStatements = [];

investmentUpdates.forEach((investment, index) => {
  const daysHeld = Math.max(0, Math.floor((currentDate.getTime() - investment.investmentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const timeInYears = daysHeld / 365.25;
  const growthFactor = Math.pow(1 + investment.targetIRR, timeInYears);
  const currentValue = investment.principal * growthFactor;
  const totalReturnAmount = currentValue - investment.principal;
  const returnPercentage = (totalReturnAmount / investment.principal) * 100;
  
  totalPrincipal += investment.principal;
  totalCurrentValue += currentValue;
  totalReturn += totalReturnAmount;
  
  console.log(`${index + 1}. ${investment.name} (ID: ${investment.id})`);
  console.log(`   Principal: $${investment.principal.toLocaleString()}`);
  console.log(`   Days Held: ${daysHeld} days`);
  console.log(`   Time: ${timeInYears.toFixed(4)} years`);
  console.log(`   Target IRR: ${(investment.targetIRR * 100).toFixed(2)}%`);
  console.log(`   Growth Factor: ${growthFactor.toFixed(6)}`);
  console.log(`   Correct Current Value: $${currentValue.toFixed(2)}`);
  console.log(`   Correct Return: $${totalReturnAmount.toFixed(2)} (${returnPercentage.toFixed(2)}%)`);
  
  // Generate SQL update statement
  updateStatements.push(`UPDATE user_investments SET 
    current_value = '${currentValue.toFixed(2)}', 
    total_return = '${totalReturnAmount.toFixed(2)}' 
    WHERE id = ${investment.id};`);
  
  console.log('');
});

const overallReturnPercentage = (totalReturn / totalPrincipal) * 100;

console.log('CORRECTED PORTFOLIO TOTALS:\n');
console.log(`Total Principal: $${totalPrincipal.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toFixed(2)}`);
console.log(`Total Return: $${totalReturn.toFixed(2)}`);
console.log(`Overall Return: ${overallReturnPercentage.toFixed(2)}%`);

console.log('\n=== SQL UPDATE STATEMENTS ===\n');
updateStatements.forEach(statement => {
  console.log(statement);
});

console.log('\n=== VERIFICATION CHECK ===\n');
console.log('Before Fix:');
console.log('Database Total Return: $118,212.33 (6.39%)');
console.log('Investment-Performance API: $173,044.52 (9.35%)');
console.log('');
console.log('After Fix (Expected):');
console.log(`Database Total Return: $${totalReturn.toFixed(2)} (${overallReturnPercentage.toFixed(2)}%)`);
console.log(`Investment-Performance API: $${totalReturn.toFixed(2)} (${overallReturnPercentage.toFixed(2)}%)`);
console.log('');
console.log('✅ Both should now match perfectly using consistent midpoint IRR methodology');

console.log('\n=== IMPLEMENTATION PLAN ===\n');
console.log('1. Update user_investments table with corrected current_value and total_return');
console.log('2. Verify unified calculateInvestmentPerformance function uses midpoint IRR');
console.log('3. Test all API endpoints return consistent values');
console.log('4. Confirm new investments automatically use correct calculations');
console.log('5. Validate 7-year projections use same methodology');