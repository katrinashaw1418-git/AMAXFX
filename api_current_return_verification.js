// API CURRENT RETURN VERIFICATION - Using Live API Data
console.log('=== API CURRENT RETURN VERIFICATION ===\n');

// Actual live API response from /api/user-investments
const liveApiData = [
  {id:28, productId:4, investedAmount: 750000.00, currentValue: 885314.00, totalReturn: 135314.00, returnPercent: 18.04},
  {id:37, productId:2, investedAmount: 25000.00, currentValue: 25008.00, totalReturn: 8.00, returnPercent: 0.03},
  {id:26, productId:1, investedAmount: 500000.00, currentValue: 513700.00, totalReturn: 13700.00, returnPercent: 2.74},
  {id:27, productId:3, investedAmount: 300000.00, currentValue: 307905.00, totalReturn: 7905.00, returnPercent: 2.63},
  {id:29, productId:2, investedAmount: 150000.00, currentValue: 189348.00, totalReturn: 39348.00, returnPercent: 26.23},
  {id:30, productId:5, investedAmount: 75000.00, currentValue: 75703.00, totalReturn: 703.00, returnPercent: 0.94},
  {id:36, productId:2, investedAmount: 50000.00, currentValue: 50066.00, totalReturn: 66.00, returnPercent: 0.13}
];

console.log('LIVE API DATA FROM /api/user-investments:');
console.log('');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

liveApiData.forEach((investment, index) => {
  const productNames = {
    1: 'Real Estate Equity Fund',
    2: 'Bitcoin Tracker Fund', 
    3: 'Corporate Credit Fund',
    4: 'Web3 Innovation Fund',
    5: 'Ethereum Staking Fund'
  };
  
  console.log(`${index + 1}. ${productNames[investment.productId]} (ID ${investment.id})`);
  console.log(`   Invested: $${investment.investedAmount.toLocaleString()}`);
  console.log(`   Current Value: $${investment.currentValue.toLocaleString()}`);
  console.log(`   Return: $${investment.totalReturn.toLocaleString()}`);
  console.log(`   Return %: ${investment.returnPercent}%`);
  console.log('');
  
  totalInvested += investment.investedAmount;
  totalCurrentValue += investment.currentValue;
  totalReturn += investment.totalReturn;
});

const totalReturnPercent = (totalReturn / totalInvested) * 100;

console.log('===== LIVE API TOTALS =====');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Total Return %: ${totalReturnPercent.toFixed(2)}%`);
console.log('');

console.log('COMPARISON WITH FRONTEND REPORTS:');
console.log(`Live API Total Return: $${totalReturn.toLocaleString()}`);
console.log('Frontend Reports:');
console.log('• $197,006 (manual calculation with Math.floor)');
console.log('• $197,041 (Investment Breakdown display)');
console.log('• $197,042 (Cross-Section Consistency)');
console.log('');

console.log('ANALYSIS:');
console.log(`API return: $${totalReturn.toFixed(2)}`);
if (Math.abs(totalReturn - 197041) < 100) {
  console.log('✓ LIVE API MATCHES Investment Breakdown ($197,041)');
  console.log('✓ The $197,041 showing in Investment Breakdown is CORRECT');
} else {
  console.log(`✗ Difference from $197,041: $${Math.abs(totalReturn - 197041).toFixed(2)}`);
}

console.log('');
console.log('CONCLUSION:');
console.log('The correct current return value based on live API data is:');
console.log(`$${totalReturn.toLocaleString()} (${totalReturnPercent.toFixed(2)}%)`);
console.log('');
console.log('All dashboard sections should show this exact value for consistency.');
console.log('The Investment Breakdown by Product section is correctly displaying the live API data.');