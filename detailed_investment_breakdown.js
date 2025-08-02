// DETAILED INVESTMENT CALCULATION BREAKDOWN
console.log('=== COMPREHENSIVE INVESTMENT CALCULATION REPORT ===\n');

// Define the product rates based on our midpoint IRR system
const productRates = {
  1: { name: 'Real Estate Equity Fund', rate: 0.11, category: 'real_estate' },
  2: { name: 'Corporate Credit Fund', rate: 0.11, category: 'corporate_credit' },
  3: { name: 'Venture Capital Fund', rate: 0.18, category: 'venture_capital' },
  4: { name: 'Bitcoin Tracker Fund', rate: 0.15, category: 'digital_assets' },
  5: { name: 'Ethereum Staking Fund', rate: 0.0575, category: 'digital_assets' }
};

// Current investments with dates (from API data)
const investments = [
  { id: 37, productId: 2, amount: 25000, date: '2025-08-02' },  // Today - 0 days
  { id: 26, productId: 1, amount: 500000, date: '2025-04-03' }, // 120 days ago
  { id: 27, productId: 3, amount: 300000, date: '2025-05-03' }, // 90 days ago
  { id: 29, productId: 2, amount: 150000, date: '2025-02-02' }, // 180 days ago
  { id: 28, productId: 4, amount: 750000, date: '2024-08-01' }, // 365 days ago
  { id: 30, productId: 5, amount: 75000, date: '2025-06-02' },  // 60 days ago
  { id: 36, productId: 2, amount: 50000, date: '2025-08-01' }   // 1 day ago
];

console.log('🔬 INDIVIDUAL INVESTMENT DETAILED CALCULATIONS:\n');

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

investments.forEach((inv, index) => {
  const product = productRates[inv.productId];
  const investDate = new Date(inv.date);
  const currentDate = new Date('2025-08-02'); // Using current date
  const daysHeld = Math.floor((currentDate - investDate) / (1000 * 60 * 60 * 24));
  const timeInYears = daysHeld / 365.25;
  
  // Calculate current value using midpoint IRR formula
  const currentValue = inv.amount * Math.pow(1 + product.rate, timeInYears);
  const returnAmount = currentValue - inv.amount;
  const returnPercent = (returnAmount / inv.amount) * 100;
  
  console.log(`Investment ${index + 1}: ${product.name}`);
  console.log(`  📅 Investment Date: ${investDate.toDateString()}`);
  console.log(`  ⏱️  Days Held: ${daysHeld} days (${timeInYears.toFixed(4)} years)`);
  console.log(`  💰 Principal: $${inv.amount.toLocaleString()}`);
  console.log(`  📈 Annual Rate: ${(product.rate * 100).toFixed(2)}%`);
  console.log(`  🧮 Calculation: $${inv.amount.toLocaleString()} × (1 + ${product.rate})^${timeInYears.toFixed(4)}`);
  console.log(`  🎯 Current Value: $${currentValue.toFixed(2)}`);
  console.log(`  💵 Return: $${returnAmount.toFixed(2)} (${returnPercent.toFixed(2)}%)`);
  console.log(`  📊 Category: ${product.category.replace('_', ' ').toUpperCase()}`);
  console.log('');
  
  totalInvested += inv.amount;
  totalCurrentValue += currentValue;
  totalReturn += returnAmount;
});

console.log('=' .repeat(60));
console.log('📊 PORTFOLIO SUMMARY:');
console.log('=' .repeat(60));
console.log(`💰 Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`🎯 Current Value: $${totalCurrentValue.toFixed(2)}`);
console.log(`💵 Total Return: $${totalReturn.toFixed(2)}`);
console.log(`📈 Overall Return: ${(totalReturn/totalInvested*100).toFixed(2)}%`);
console.log('');

console.log('🔍 CATEGORY BREAKDOWN:');
const categoryTotals = {};
investments.forEach(inv => {
  const product = productRates[inv.productId];
  const timeInYears = Math.floor((new Date('2025-08-02') - new Date(inv.date)) / (1000 * 60 * 60 * 24)) / 365.25;
  const currentValue = inv.amount * Math.pow(1 + product.rate, timeInYears);
  
  if (!categoryTotals[product.category]) {
    categoryTotals[product.category] = { invested: 0, current: 0, return: 0 };
  }
  categoryTotals[product.category].invested += inv.amount;
  categoryTotals[product.category].current += currentValue;
  categoryTotals[product.category].return += currentValue - inv.amount;
});

Object.entries(categoryTotals).forEach(([category, data]) => {
  const percentage = (data.invested / totalInvested * 100).toFixed(1);
  console.log(`${category.replace('_', ' ').toUpperCase()}:`);
  console.log(`  • Invested: $${data.invested.toLocaleString()} (${percentage}%)`);
  console.log(`  • Current: $${data.current.toFixed(2)}`);
  console.log(`  • Return: $${data.return.toFixed(2)} (${(data.return/data.invested*100).toFixed(2)}%)`);
});

console.log('\n⚡ CALCULATION METHODOLOGY:');
console.log('Formula: Current Value = Principal × (1 + Annual Rate)^(Time in Years)');
console.log('Time Calculation: Days Held ÷ 365.25 (accounting for leap years)');
console.log('Compound Growth: Applied continuously based on exact investment duration');
console.log('\n🎯 MIDPOINT IRR RATES:');
console.log('• Real Estate: 11.00% annual');
console.log('• Corporate Credit: 11.00% annual');
console.log('• Venture Capital: 18.00% annual');
console.log('• Bitcoin Tracker: 15.00% annual (conservative)');
console.log('• Ethereum Staking: 5.75% annual');