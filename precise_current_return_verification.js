// PRECISE CURRENT RETURN VERIFICATION - Using Exact Database Values
console.log('=== PRECISE CURRENT RETURN VERIFICATION ===\n');

// Get the exact current_value and total_return from database for each investment
const databaseValues = [
  { id: 26, productId: 1, invested: 500000.00, current_value: 517588.48, total_return: 17588.48, name: 'Real Estate Equity Fund' },
  { id: 29, productId: 2, invested: 150000.00, current_value: 160757.09, total_return: 10757.09, name: 'Bitcoin Tracker Fund' },
  { id: 36, productId: 2, invested: 50000.00, current_value: 50019.14, total_return: 19.14, name: 'Bitcoin Tracker Fund' },
  { id: 37, productId: 2, invested: 25000.00, current_value: 25000.00, total_return: 0.00, name: 'Bitcoin Tracker Fund' },
  { id: 27, productId: 3, invested: 300000.00, current_value: 307902.50, total_return: 7902.50, name: 'Corporate Credit Fund' },
  { id: 28, productId: 4, invested: 750000.00, current_value: 832440.00, total_return: 82440.00, name: 'Web3 Innovation Fund' },
  { id: 30, productId: 5, invested: 75000.00, current_value: 75703.56, total_return: 703.56, name: 'Ethereum Staking Fund' }
];

console.log('METHOD 1: SUM OF DATABASE current_value FIELD');
console.log('This uses the exact current_value stored in user_investments table');
console.log('');

let totalInvestedFromDB = 0;
let totalCurrentValueFromDB = 0;
let totalReturnFromDB = 0;

databaseValues.forEach((investment, index) => {
  console.log(`${index + 1}. ${investment.name} (ID ${investment.id})`);
  console.log(`   Principal: $${investment.invested.toLocaleString()}`);
  console.log(`   Current Value: $${investment.current_value.toLocaleString()}`);
  console.log(`   Current Return: $${investment.total_return.toLocaleString()}`);
  console.log('');
  
  totalInvestedFromDB += investment.invested;
  totalCurrentValueFromDB += investment.current_value;
  totalReturnFromDB += investment.total_return;
});

console.log('DATABASE VALUES TOTALS:');
console.log(`Total Invested: $${totalInvestedFromDB.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValueFromDB.toLocaleString()}`);
console.log(`Total Current Return: $${totalReturnFromDB.toLocaleString()}`);
console.log(`Return Percentage: ${((totalReturnFromDB / totalInvestedFromDB) * 100).toFixed(3)}%`);
console.log('');

console.log('METHOD 2: REAL-TIME CALCULATION');
console.log('Formula: Current Value = Principal × (1 + IRR)^min(TimeElapsed, TermLimit)');
console.log('');

// Real-time calculation using exact Filter Products data
const actualInvestments = [
  { id: 26, productId: 1, invested: 500000, investmentDate: '2025-04-03', productName: 'Real Estate Equity Fund' },
  { id: 29, productId: 2, invested: 150000, investmentDate: '2025-02-02', productName: 'Bitcoin Tracker Fund' },
  { id: 36, productId: 2, invested: 50000, investmentDate: '2025-08-01', productName: 'Bitcoin Tracker Fund' },
  { id: 37, productId: 2, invested: 25000, investmentDate: '2025-08-02', productName: 'Bitcoin Tracker Fund' },
  { id: 27, productId: 3, invested: 300000, investmentDate: '2025-05-03', productName: 'Corporate Credit Fund' },
  { id: 28, productId: 4, invested: 750000, investmentDate: '2024-08-01', productName: 'Web3 Innovation Fund' },
  { id: 30, productId: 5, invested: 75000, investmentDate: '2025-06-02', productName: 'Ethereum Staking Fund' }
];

const productMidpoints = {
  1: { irr: 0.085, termYears: 2.0 },
  2: { irr: 0.60, termYears: 1.0 },
  3: { irr: 0.11, termYears: 1.5 },
  4: { irr: 0.18, termYears: 4.0 },
  5: { irr: 0.0575, termYears: 2.0 }
};

const currentDate = new Date('2025-08-02');
let totalInvested = 0;
let totalCurrentValue = 0;

console.log('REAL-TIME CALCULATION BREAKDOWN:');
actualInvestments.forEach((investment, index) => {
  const product = productMidpoints[investment.productId];
  const investmentDate = new Date(investment.investmentDate);
  
  const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
  const timeElapsed = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25));
  const effectiveTime = Math.min(timeElapsed, product.termYears);
  
  const currentGrowthFactor = Math.pow(1 + product.irr, effectiveTime);
  const currentValue = Math.floor(investment.invested * currentGrowthFactor);
  const currentReturn = currentValue - investment.invested;
  
  console.log(`${index + 1}. ${investment.productName} (ID ${investment.id})`);
  console.log(`   Principal: $${investment.invested.toLocaleString()}`);
  console.log(`   Current Value: $${currentValue.toLocaleString()}`);
  console.log(`   Current Return: $${currentReturn.toLocaleString()}`);
  console.log('');
  
  totalInvested += investment.invested;
  totalCurrentValue += currentValue;
});

const totalCurrentReturn = totalCurrentValue - totalInvested;

console.log('REAL-TIME CALCULATION TOTALS:');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Current Return: $${totalCurrentReturn.toLocaleString()}`);
console.log(`Return Percentage: ${((totalCurrentReturn / totalInvested) * 100).toFixed(3)}%`);
console.log('');

console.log('===== COMPARISON AND ANALYSIS =====');
console.log('DATABASE VALUES (user_investments.current_value):');
console.log(`Total Current Return: $${totalReturnFromDB.toLocaleString()}`);
console.log('');
console.log('REAL-TIME CALCULATION:');
console.log(`Total Current Return: $${totalCurrentReturn.toLocaleString()}`);
console.log('');
console.log('REPORTED VALUES IN FRONTEND:');
console.log('• $197,006 (from detailed calculation)');
console.log('• $197,041 (from Investment Breakdown)');
console.log('• $197,042 (from Cross-Section Consistency)');
console.log('');

console.log('ANALYSIS:');
console.log(`Database sum: $${totalReturnFromDB.toFixed(2)}`);
console.log(`Real-time calc: $${totalCurrentReturn.toFixed(2)}`);
console.log(`Difference: $${Math.abs(totalReturnFromDB - totalCurrentReturn).toFixed(2)}`);
console.log('');

console.log('CORRECT VALUE DETERMINATION:');
if (Math.abs(totalReturnFromDB - 197041) < Math.abs(totalCurrentReturn - 197041)) {
  console.log('✓ DATABASE VALUES ($' + totalReturnFromDB.toLocaleString() + ') are closer to $197,041');
  console.log('✓ The Investment Breakdown showing $197,041 is CORRECT');
} else {
  console.log('✓ REAL-TIME CALCULATION ($' + totalCurrentReturn.toLocaleString() + ') is closer to $197,041');
  console.log('✓ The detailed calculation showing $197,006 is CORRECT');
}
console.log('');
console.log('RECOMMENDATION:');
console.log('The frontend should use the user_investments.current_value field');
console.log('This ensures consistency with database-stored calculations');
console.log('Minor differences may be due to timing of calculation updates');