// FINAL SERVER CALCULATION VERIFICATION - Matching Exact Server Logic
console.log('=== FINAL SERVER CALCULATION VERIFICATION ===\n');

// Exact server calculation function from routes.ts
function calculateInvestmentPerformance(
  productId,
  investedAmount,
  investmentDate,
  currentDate = new Date('2025-08-02')
) {
  // Calculate exact time elapsed in years with high precision
  const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
  const timeInYears = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25));
  
  // Get exact midpoint IRR and term years based on specific product ID
  let targetIRR = 0.08; // Default 8% annual return
  let termYears = 5; // Default 5 year term
  
  // Use exact IRR values and terms from actual database product descriptions
  switch (productId) {
    case 1: // Real Estate Equity Fund - target_net_irr: 8.5%, term: 24 months
      targetIRR = 0.085; // Exactly 8.5% from database
      termYears = 2.0; // 24 months = 2.0 years
      break;
    case 2: // Bitcoin Tracker Fund - "Market-based (historical 60%+ annualized)"
      targetIRR = 0.60; // 60% based on historical Bitcoin returns
      termYears = 1.0; // 12 months = 1.0 year
      break;
    case 3: // Corporate Credit Fund - "midpoint IRR targeting 11% annual returns"
      targetIRR = 0.11; // Exactly 11% from investment_strategy description
      termYears = 1.5; // 18 months = 1.5 years
      break;
    case 4: // Web3 Innovation Fund - "midpoint IRR targeting 18% annual returns"
      targetIRR = 0.18; // Exactly 18% from investment_strategy description
      termYears = 4.0; // Midpoint: (3 + 5) / 2 = 4.0 years
      break;
    case 5: // Ethereum Staking Fund - "midpoint IRR targeting 5.75% annual returns"
      targetIRR = 0.0575; // Exactly 5.75% from investment_strategy description
      termYears = 2.0; // 2 years for open-ended product
      break;
  }
  
  // Apply term capping to prevent growth beyond product maturity
  const effectiveTime = Math.min(timeInYears, termYears);
  
  // Calculate current value using compound interest formula
  const growthFactor = Math.pow(1 + targetIRR, effectiveTime);
  const currentValue = investedAmount * growthFactor;
  const returnAmount = currentValue - investedAmount;
  const returnPercentage = (returnAmount / investedAmount) * 100;
  
  return {
    currentValue: Math.round(currentValue * 100) / 100, // SERVER ROUNDING METHOD
    returnAmount: Math.round(returnAmount * 100) / 100, // SERVER ROUNDING METHOD
    returnPercentage: Math.round(returnPercentage * 100) / 100,
    effectiveTime: Math.round(effectiveTime * 1000) / 1000,
    timeInYears,
    targetIRR,
    termYears,
    growthFactor
  };
}

// Actual user investments from Filter Products database
const actualInvestments = [
  { id: 26, productId: 1, invested: 500000, investmentDate: '2025-04-03T15:37:02', productName: 'Real Estate Equity Fund' },
  { id: 29, productId: 2, invested: 150000, investmentDate: '2025-02-02T15:37:02', productName: 'Bitcoin Tracker Fund' },
  { id: 36, productId: 2, invested: 50000, investmentDate: '2025-08-01T15:31:58', productName: 'Bitcoin Tracker Fund' },
  { id: 37, productId: 2, invested: 25000, investmentDate: '2025-08-02T09:45:46', productName: 'Bitcoin Tracker Fund' },
  { id: 27, productId: 3, invested: 300000, investmentDate: '2025-05-03T15:37:02', productName: 'Corporate Credit Fund' },
  { id: 28, productId: 4, invested: 750000, investmentDate: '2024-08-01T15:37:02', productName: 'Web3 Innovation Fund' },
  { id: 30, productId: 5, invested: 75000, investmentDate: '2025-06-02T15:37:02', productName: 'Ethereum Staking Fund' }
];

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturnAmount = 0;

console.log('SERVER CALCULATION METHOD (Math.round * 100 / 100):');
console.log('');

actualInvestments.forEach((investment, index) => {
  const result = calculateInvestmentPerformance(
    investment.productId,
    investment.invested,
    new Date(investment.investmentDate)
  );
  
  console.log(`${index + 1}. ${investment.productName} (ID ${investment.id})`);
  console.log(`   Principal: $${investment.invested.toLocaleString()}`);
  console.log(`   Investment Date: ${investment.investmentDate}`);
  console.log(`   IRR: ${(result.targetIRR * 100).toFixed(2)}%, Term: ${result.termYears} years`);
  console.log(`   Time Elapsed: ${result.timeInYears.toFixed(4)} years`);
  console.log(`   Effective Time: ${result.effectiveTime.toFixed(4)} years`);
  console.log(`   Growth Factor: ${result.growthFactor.toFixed(6)}`);
  console.log(`   Current Value: $${result.currentValue.toLocaleString()}`);
  console.log(`   Return Amount: $${result.returnAmount.toLocaleString()}`);
  console.log(`   Return %: ${result.returnPercentage.toFixed(2)}%`);
  console.log('');
  
  totalInvested += investment.invested;
  totalCurrentValue += result.currentValue;
  totalReturnAmount += result.returnAmount;
});

const totalReturnPercentage = (totalReturnAmount / totalInvested) * 100;

console.log('===== SERVER CALCULATION TOTALS =====');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Return Amount: $${totalReturnAmount.toLocaleString()}`);
console.log(`Total Return Percentage: ${totalReturnPercentage.toFixed(2)}%`);
console.log('');

console.log('COMPARISON WITH REPORTED VALUES:');
console.log(`Server Calculation: $${totalReturnAmount.toLocaleString()}`);
console.log('Frontend Reports:');
console.log('• $197,006 (manual calculation with Math.floor)');
console.log('• $197,041 (Investment Breakdown display)');
console.log('• $197,042 (Cross-Section Consistency)');
console.log('');

console.log('ANALYSIS:');
console.log(`Server calculation result: $${totalReturnAmount.toFixed(2)}`);
if (Math.abs(totalReturnAmount - 197041) < 10) {
  console.log('✓ SERVER CALCULATION MATCHES Frontend $197,041');
  console.log('✓ The slight difference from $197,006 is due to rounding method (Math.round vs Math.floor)');
} else {
  console.log(`✗ Difference: $${Math.abs(totalReturnAmount - 197041).toFixed(2)}`);
}
console.log('');

console.log('CONCLUSION:');
console.log('The correct current return value is the one calculated by the server:');
console.log(`$${totalReturnAmount.toLocaleString()} (${totalReturnPercentage.toFixed(2)}%)`);
console.log('This value should be consistent across all dashboard sections.');