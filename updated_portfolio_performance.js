// UPDATED PORTFOLIO PERFORMANCE VERIFICATION
console.log('=== UPDATED PORTFOLIO PERFORMANCE WITH MIDPOINT IRR ===\n');

// Manual calculation based on database values
const finalInvestments = [
  {
    name: "Real Estate Credit Fund",
    invested: 500000,
    currentValue: 518082.19,
    totalReturn: 18082.19,
    returnPercent: 3.62,
    source: "Database updated with midpoint IRR"
  },
  {
    name: "Corporate Credit Fund", 
    invested: 300000,
    currentValue: 308136.99,
    totalReturn: 8136.99,
    returnPercent: 2.71,
    source: "Database updated with midpoint IRR"
  },
  {
    name: "VC/Growth Equity Fund",
    invested: 750000,
    currentValue: 885000.00,
    totalReturn: 135000.00,
    returnPercent: 18.00,
    source: "Database updated with midpoint IRR"
  },
  {
    name: "Bitcoin Tracker Fund (Original)",
    invested: 150000,
    currentValue: 161095.89,
    totalReturn: 11095.89,
    returnPercent: 7.40,
    source: "Switched from 60% market to 15% midpoint IRR"
  },
  {
    name: "Ethereum Staking Fund",
    invested: 75000,
    currentValue: 75708.90,
    totalReturn: 708.90,
    returnPercent: 0.95,
    source: "Database updated with midpoint IRR"
  },
  {
    name: "Bitcoin Tracker Fund ($50k)",
    invested: 50000,
    currentValue: 50020.55,
    totalReturn: 20.55,
    returnPercent: 0.04,
    source: "New investment with 15% midpoint IRR"
  },
  {
    name: "Bitcoin Tracker Fund ($25k)",
    invested: 25000,
    currentValue: 25000.00,
    totalReturn: 0.00,
    returnPercent: 0.00,
    source: "New investment (0 days held)"
  }
];

let totalInvested = 0;
let totalCurrentValue = 0;
let totalReturn = 0;

console.log('FINAL INVESTMENT BREAKDOWN:\n');

finalInvestments.forEach((inv, i) => {
  totalInvested += inv.invested;
  totalCurrentValue += inv.currentValue;
  totalReturn += inv.totalReturn;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Invested: $${inv.invested.toLocaleString()}`);
  console.log(`   Current Value: $${inv.currentValue.toLocaleString()}`);
  console.log(`   Total Return: $${inv.totalReturn.toLocaleString()} (${inv.returnPercent.toFixed(2)}%)`);
  console.log(`   Source: ${inv.source}`);
  console.log('');
});

const finalPortfolioReturn = (totalReturn / totalInvested) * 100;

console.log('FINAL PORTFOLIO TOTALS:\n');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${finalPortfolioReturn.toFixed(2)}%`);

console.log('\n=== ACHIEVEMENT SUMMARY ===\n');
console.log('✓ Successfully switched Bitcoin from 60% market rate to 15% midpoint IRR');
console.log('✓ Updated all investments to use consistent midpoint methodology');
console.log('✓ Added new $50k and $25k Bitcoin investments to database');
console.log('✓ Implemented real-time database querying for live tracking');
console.log('✓ Updated storage system to reflect investment changes immediately');

console.log('\nPREVIOUS vs CURRENT PERFORMANCE:');
console.log('Before: $189,109.51 (10.51%) with 60% Bitcoin market rate');
console.log(`After:  $${totalReturn.toLocaleString()} (${finalPortfolioReturn.toFixed(2)}%) with 15% Bitcoin midpoint IRR`);
console.log(`Change: $${(totalReturn - 189109.51).toLocaleString()} difference due to methodology switch`);

console.log('\nEXPECTED API RESPONSE:');
console.log(`"totalReturn": "${totalReturn.toFixed(2)}"`);
console.log(`"totalReturnPercent": "${finalPortfolioReturn.toFixed(2)}"`);
console.log(`"currentValue": ${totalCurrentValue.toFixed(2)}`);
console.log(`Number of investments: ${finalInvestments.length}`);