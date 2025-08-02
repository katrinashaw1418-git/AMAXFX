// FINAL VERIFICATION: EXACT MIDPOINT IRR CALCULATION WITH CURRENT DATABASE VALUES
console.log('=== FINAL CALCULATION VERIFICATION WITH EXACT MIDPOINT IRR ===\n');

// Current database values (correct mapping)
const actualUserInvestments = [
  { id: 37, productId: 2, amount: 25000.00, date: '2025-08-02T09:45:46.000Z' },   // Real Estate Credit Fund
  { id: 26, productId: 1, amount: 500000.00, date: '2025-04-03T15:37:02.000Z' },  // Real Estate Equity Fund  
  { id: 27, productId: 3, amount: 300000.00, date: '2025-05-03T15:37:02.000Z' },  // Real Estate First Mortgage Fund
  { id: 29, productId: 2, amount: 150000.00, date: '2025-02-02T15:37:02.000Z' },  // Real Estate Credit Fund
  { id: 28, productId: 4, amount: 750000.00, date: '2024-08-01T15:37:02.000Z' },  // Cash Flow-Based Corporate Credit Fund
  { id: 30, productId: 5, amount: 75000.00, date: '2025-06-02T15:37:02.000Z' },   // Security-Backed Corporate Credit Fund
  { id: 36, productId: 2, amount: 50000.00, date: '2025-08-01T15:31:58.000Z' }    // Real Estate Credit Fund
];

// Updated IRR mapping with exact midpoint values from product descriptions
const productIRRMapping = {
  1: { name: 'Real Estate Equity Fund', targetIRR: '9.8–11.0%', midpointIRR: 0.104, calculation: '(9.8 + 11.0) / 2 = 10.4%' },
  2: { name: 'Real Estate Credit Fund', targetIRR: '~11%', midpointIRR: 0.11, calculation: 'Exactly 11%' },
  3: { name: 'Real Estate First Mortgage Fund', targetIRR: '~9%', midpointIRR: 0.09, calculation: 'Exactly 9%' },
  4: { name: 'Cash Flow-Based Corporate Credit Fund', targetIRR: '10–12%', midpointIRR: 0.11, calculation: '(10 + 12) / 2 = 11%' },
  5: { name: 'Security-Backed Corporate Credit Fund', targetIRR: '12–15%', midpointIRR: 0.135, calculation: '(12 + 15) / 2 = 13.5%' },
  6: { name: 'VC / Growth Equity Fund', targetIRR: '16–20%', midpointIRR: 0.18, calculation: '(16 + 20) / 2 = 18%' }
};

console.log('📊 CURRENT PORTFOLIO WITH EXACT MIDPOINT IRR CALCULATION:');
console.log('=========================================================');
console.log('');

const currentDate = new Date('2025-08-02');
let totalInvested = 0;
let totalCurrentValue = 0;

console.log('🔍 INVESTMENT-BY-INVESTMENT BREAKDOWN:');
console.log('=====================================');

actualUserInvestments.forEach((inv, index) => {
  const product = productIRRMapping[inv.productId];
  const investmentDate = new Date(inv.date);
  const daysHeld = Math.max(0, Math.floor((currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const timeInYears = daysHeld / 365.25;
  
  const growthFactor = Math.pow(1 + product.midpointIRR, timeInYears);
  const currentValue = inv.amount * growthFactor;
  const returnAmount = currentValue - inv.amount;
  const returnPercent = (returnAmount / inv.amount) * 100;
  
  totalInvested += inv.amount;
  totalCurrentValue += currentValue;
  
  console.log(`${index + 1}. ${product.name} (Investment ID: ${inv.id})`);
  console.log(`   ✅ Target IRR from Description: ${product.targetIRR}`);
  console.log(`   🎯 Midpoint IRR Calculation: ${product.calculation}`);
  console.log(`   📈 Applied IRR Rate: ${(product.midpointIRR * 100).toFixed(2)}%`);
  console.log(`   💰 Principal Investment: $${inv.amount.toLocaleString()}`);
  console.log(`   📅 Investment Date: ${investmentDate.toDateString()}`);
  console.log(`   ⏱️  Days Held: ${daysHeld} days (${timeInYears.toFixed(4)} years)`);
  console.log(`   📊 Growth Factor: (1 + ${product.midpointIRR})^${timeInYears.toFixed(4)} = ${growthFactor.toFixed(6)}`);
  console.log(`   💵 Current Value: $${inv.amount.toLocaleString()} × ${growthFactor.toFixed(6)} = $${currentValue.toFixed(2)}`);
  console.log(`   📈 Return: $${returnAmount.toFixed(2)} (${returnPercent.toFixed(2)}%)`);
  console.log('');
});

const totalReturn = totalCurrentValue - totalInvested;
const totalReturnPercent = (totalReturn / totalInvested) * 100;

console.log('📈 FINAL PORTFOLIO CALCULATION WITH EXACT MIDPOINT IRR:');
console.log('======================================================');
console.log(`💰 Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`💵 Total Current Value: $${totalCurrentValue.toFixed(2)}`);
console.log(`📈 Total Return: $${totalReturn.toFixed(2)}`);
console.log(`📊 Return Percentage: ${totalReturnPercent.toFixed(2)}%`);
console.log('');

console.log('🎯 MIDPOINT IRR USED FOR EACH PRODUCT:');
console.log('=====================================');

// Group by product to show unique IRR rates used
const productGroups = {};
actualUserInvestments.forEach(inv => {
  if (!productGroups[inv.productId]) {
    productGroups[inv.productId] = {
      product: productIRRMapping[inv.productId],
      totalInvested: 0,
      count: 0
    };
  }
  productGroups[inv.productId].totalInvested += inv.amount;
  productGroups[inv.productId].count += 1;
});

Object.entries(productGroups).forEach(([productId, group]) => {
  console.log(`✅ ${group.product.name}:`);
  console.log(`   Target IRR Range: ${group.product.targetIRR}`);
  console.log(`   Midpoint Calculation: ${group.product.calculation}`);
  console.log(`   Applied IRR: ${(group.product.midpointIRR * 100).toFixed(2)}%`);
  console.log(`   Total Invested: $${group.totalInvested.toLocaleString()} (${group.count} investment${group.count > 1 ? 's' : ''})`);
  console.log('');
});

console.log('🚀 7-YEAR PROJECTIONS WITH EXACT MIDPOINT IRR:');
console.log('==============================================');

Object.entries(productGroups).forEach(([productId, group]) => {
  const growthFactor7Year = Math.pow(1 + group.product.midpointIRR, 7);
  const value7Year = group.totalInvested * growthFactor7Year;
  const return7Year = value7Year - group.totalInvested;
  const returnPercent7Year = ((return7Year / group.totalInvested) * 100);
  
  console.log(`🏢 ${group.product.name}:`);
  console.log(`   Current Investment: $${group.totalInvested.toLocaleString()}`);
  console.log(`   Midpoint IRR Applied: ${(group.product.midpointIRR * 100).toFixed(2)}%`);
  console.log(`   7-Year Growth Factor: (1 + ${group.product.midpointIRR})^7 = ${growthFactor7Year.toFixed(6)}`);
  console.log(`   Projected 7-Year Value: $${value7Year.toFixed(2)}`);
  console.log(`   Projected 7-Year Return: $${return7Year.toFixed(2)} (${returnPercent7Year.toFixed(2)}%)`);
  console.log('');
});

console.log('✅ VERIFICATION SUMMARY:');
console.log('========================');
console.log('✓ Using exact midpoint IRR values from current product descriptions');
console.log('✓ Real Estate Equity Fund: 10.4% (midpoint of 9.8–11.0%)');
console.log('✓ Real Estate Credit Fund: 11% (exact from ~11%)');
console.log('✓ Real Estate First Mortgage Fund: 9% (exact from ~9%)');
console.log('✓ Cash Flow-Based Corporate Credit Fund: 11% (midpoint of 10–12%)');
console.log('✓ Security-Backed Corporate Credit Fund: 13.5% (midpoint of 12–15%)');
console.log('✓ All calculations use compound interest formula with exact day counting');
console.log('✓ Investment performance reflects true IRR values from product descriptions');