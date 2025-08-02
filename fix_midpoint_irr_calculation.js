// CORRECTED CALCULATION USING ACTUAL API DATA
console.log('=== FIXING 1 CENT DISCREPANCY: USING ACTUAL API VALUES ===\n');

// These are the actual values from the dashboard/API
const actualInvestments = [
  { id: 37, principal: 25000, currentValue: 25000, return: 0, daysHeld: 0 },
  { id: 26, principal: 500000, currentValue: 517440.61, return: 17440.61, daysHeld: 120 },
  { id: 27, principal: 300000, currentValue: 307814.54, return: 7814.54, daysHeld: 90 },
  { id: 29, principal: 150000, currentValue: 157916.32, return: 7916.32, daysHeld: 180 },
  { id: 28, principal: 750000, currentValue: 832440.54, return: 82440.54, daysHeld: 365 },
  { id: 30, principal: 75000, currentValue: 76296.83, return: 1296.83, daysHeld: 60 },
  { id: 36, principal: 50000, currentValue: 50000, return: 0, daysHeld: 1 }
];

console.log('🎯 ACTUAL VALUES FROM SYSTEM:\n');

let totalInvested = 0;
let totalCurrent = 0;
let totalReturn = 0;

actualInvestments.forEach((inv, index) => {
  totalInvested += inv.principal;
  totalCurrent += inv.currentValue;
  totalReturn += inv.return;
  
  console.log(`${index + 1}. Investment ID ${inv.id}:`);
  console.log(`   💰 Principal: $${inv.principal.toLocaleString()}`);
  console.log(`   🎯 Current Value: $${inv.currentValue.toLocaleString()}`);
  console.log(`   💵 Return: +$${inv.return.toLocaleString()}`);
  console.log(`   ⏱️  Days Held: ${inv.daysHeld}`);
  console.log('');
});

console.log('=' .repeat(80));
console.log('📊 CALCULATION TOTALS:');
console.log('=' .repeat(80));
console.log(`💰 Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`🎯 Total Current Value: $${totalCurrent.toFixed(2)}`);
console.log(`💵 Total Return: $${totalReturn.toFixed(2)}`);
console.log('');

console.log('🔍 PRECISION ANALYSIS:');
console.log(`Total Current (High Precision): ${totalCurrent}`);
console.log(`Total Return (High Precision): ${totalReturn}`);
console.log('');

console.log('✅ DISCREPANCY CHECK:');
console.log(`Expected Return 1: $116,908.84`);
console.log(`Expected Return 2: $116,908.85`);
console.log(`Calculated Return: $${totalReturn.toFixed(2)}`);
console.log(`Exact Calculation: $${totalReturn}`);

const diff84 = Math.abs(totalReturn - 116908.84);
const diff85 = Math.abs(totalReturn - 116908.85);

console.log(`Difference from .84: $${diff84.toFixed(8)}`);
console.log(`Difference from .85: $${diff85.toFixed(8)}`);
console.log(`Closest match: $116,908.${diff84 < diff85 ? '84' : '85'}`);

// Check individual precision
console.log('\n🔬 INDIVIDUAL VALUE PRECISION:');
actualInvestments.forEach((inv, index) => {
  const precise = parseFloat(inv.currentValue.toFixed(8));
  const rounded = parseFloat(inv.currentValue.toFixed(2));
  const diff = Math.abs(precise - rounded);
  
  console.log(`${index + 1}. ID ${inv.id}: $${inv.currentValue} (precision: ${diff < 0.001 ? 'GOOD' : 'ROUNDING'})`);
});

// Manual addition check
console.log('\n🧮 MANUAL ADDITION VERIFICATION:');
const sum1 = 25000;
const sum2 = sum1 + 517440.61;
const sum3 = sum2 + 307814.54;
const sum4 = sum3 + 157916.32;
const sum5 = sum4 + 832440.54;
const sum6 = sum5 + 76296.83;
const sum7 = sum6 + 50000;

console.log(`Step by step addition:`);
console.log(`25000`);
console.log(`+ 517440.61 = ${sum2}`);
console.log(`+ 307814.54 = ${sum3}`);
console.log(`+ 157916.32 = ${sum4}`);
console.log(`+ 832440.54 = ${sum5}`);
console.log(`+ 76296.83 = ${sum6}`);
console.log(`+ 50000 = ${sum7}`);
console.log(`Final: $${sum7.toFixed(2)}`);
console.log(`Return: $${(sum7 - 1850000).toFixed(2)}`);

console.log('\n💡 CONCLUSION:');
if (Math.abs(totalReturn - 116908.84) < 0.01) {
  console.log('✅ MATCH: The calculation matches $116,908.84');
} else if (Math.abs(totalReturn - 116908.85) < 0.01) {
  console.log('✅ MATCH: The calculation matches $116,908.85');
} else {
  console.log('❌ MISMATCH: Need to investigate data source differences');
  console.log(`Actual total return: $${totalReturn}`);
}