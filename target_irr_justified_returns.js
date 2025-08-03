// INVESTMENT RETURN CALCULATION USING MIDPOINT IRR 
console.log('=== MEDIUM IRR PORTFOLIO RETURN CALCULATION ===\n');

// Investment returns calculated using midpoint IRR values instead of current performance
const investments = [
  { 
    name: "Real Estate Credit Fund", 
    invested: 500000, 
    currentReturn: 2.63, // Actual current
    targetIrrRange: "~11%",
    midpointIrr: 11.0, // Use this for calculation
    term: "~10.2 months (rolling)"
  },
  { 
    name: "Corporate Credit Fund", 
    invested: 300000, 
    currentReturn: 1.23, // Actual current
    targetIrrRange: "10–12%",
    midpointIrr: 11.0, // Midpoint of 10-12%
    term: "2–3 years"
  },
  { 
    name: "VC / Growth Equity Fund", 
    invested: 750000, 
    currentReturn: 22.75, // Actual current
    targetIrrRange: "16–20%",
    midpointIrr: 18.0, // Midpoint of 16-20%
    term: "5–7+ years"
  },
  { 
    name: "Bitcoin Tracker Fund", 
    invested: 150000, 
    currentReturn: 3.42, // Actual current
    targetIrrRange: "Market-based (historical 60%+ annualized)",
    midpointIrr: 15.0, // Conservative midpoint estimate
    term: "Open-ended"
  },
  { 
    name: "Ethereum Staking Fund", 
    invested: 75000, 
    currentReturn: 6.25, // Actual current
    targetIrrRange: "4.5–7% APY",
    midpointIrr: 5.75, // Midpoint of 4.5-7%
    term: "Open-ended"
  }
];

console.log('PORTFOLIO USING MIDPOINT IRR CALCULATION:\n');

let totalInvested = 0;
let totalCurrentReturn = 0;
let totalMidpointReturn = 0;
let totalMidpointValue = 0;
let totalCurrentValue = 0;

investments.forEach((inv, i) => {
  totalInvested += inv.invested;
  
  // Current actual values
  const currentReturnAmount = inv.invested * (inv.currentReturn / 100);
  const currentValue = inv.invested + currentReturnAmount;
  totalCurrentReturn += currentReturnAmount;
  totalCurrentValue += currentValue;
  
  // Midpoint IRR calculated values - THIS IS THE KEY CALCULATION
  const midpointReturnAmount = inv.invested * (inv.midpointIrr / 100);
  const midpointValue = inv.invested + midpointReturnAmount;
  totalMidpointReturn += midpointReturnAmount;
  totalMidpointValue += midpointValue;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Invested: $${inv.invested.toLocaleString()}`);
  console.log(`   Target IRR Range: ${inv.targetIrrRange}`);
  console.log(`   Midpoint IRR Used: ${inv.midpointIrr}%`);
  console.log(`   Actual Current Return: ${inv.currentReturn}% ($${currentReturnAmount.toLocaleString()})`);
  console.log(`   MIDPOINT IRR RETURN: ${inv.midpointIrr}% ($${midpointReturnAmount.toLocaleString()})`);
  console.log(`   Midpoint IRR Value: $${midpointValue.toLocaleString()}`);
  console.log('');
});

console.log('=== MIDPOINT IRR PORTFOLIO SUMMARY ===\n');

const currentPortfolioReturn = (totalCurrentReturn / totalInvested) * 100;
const midpointPortfolioReturn = (totalMidpointReturn / totalInvested) * 100;

console.log('COMPARISON:');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`\nActual Current Portfolio:`);
console.log(`  Return: $${totalCurrentReturn.toLocaleString()} (${currentPortfolioReturn.toFixed(2)}%)`);
console.log(`  Total Value: $${totalCurrentValue.toLocaleString()}`);

console.log(`\nMIDPOINT IRR PORTFOLIO:`);
console.log(`  Return: $${totalMidpointReturn.toLocaleString()} (${midpointPortfolioReturn.toFixed(2)}%)`);
console.log(`  Total Value: $${totalMidpointValue.toLocaleString()}`);

console.log('\nMIDPOINT IRR CALCULATION BREAKDOWN:');
console.log(`Real Estate: $500,000 × 11% = $${(500000 * 0.11).toLocaleString()}`);
console.log(`Corporate Credit: $300,000 × 11% = $${(300000 * 0.11).toLocaleString()}`);
console.log(`VC Fund: $750,000 × 18% = $${(750000 * 0.18).toLocaleString()}`);
console.log(`Bitcoin: $150,000 × 15% = $${(150000 * 0.15).toLocaleString()}`);
console.log(`Ethereum: $75,000 × 5.75% = $${(75000 * 0.0575).toLocaleString()}`);
console.log(`TOTAL MIDPOINT RETURN: $${totalMidpointReturn.toLocaleString()}`);

const weightedAvgMidpointIrr = ((500000 * 11 + 300000 * 11 + 750000 * 18 + 150000 * 15 + 75000 * 5.75) / totalInvested);
console.log(`\nWeighted Average Midpoint IRR: ${weightedAvgMidpointIrr.toFixed(2)}%`);
console.log(`This equals: $${totalInvested.toLocaleString()} × ${weightedAvgMidpointIrr.toFixed(2)}% = $${totalMidpointReturn.toLocaleString()}`);

console.log('\n=== MIDPOINT IRR JUSTIFICATION ===');
console.log(`Using midpoint IRR values, the portfolio should generate:`);
console.log(`• Portfolio Return: ${midpointPortfolioReturn.toFixed(2)}% ($${totalMidpointReturn.toLocaleString()})`);
console.log(`• This represents the expected return if all funds hit their midpoint targets`);
console.log(`• Actual current return: ${currentPortfolioReturn.toFixed(2)}% ($${totalCurrentReturn.toLocaleString()})`);
console.log(`• Performance ratio: ${((currentPortfolioReturn/midpointPortfolioReturn)*100).toFixed(1)}% of midpoint potential`);

console.log('\nMIDPOINT IRR PORTFOLIO COMPOSITION:');
console.log(`• Real Estate (28.2%): 11% IRR on $500K = $55K`);
console.log(`• Corporate Credit (16.9%): 11% IRR on $300K = $33K`);
console.log(`• VC Fund (42.3%): 18% IRR on $750K = $135K`);
console.log(`• Bitcoin (8.5%): 15% IRR on $150K = $22.5K`);
console.log(`• Ethereum (4.2%): 5.75% IRR on $75K = $4.3K`);
console.log(`• TOTAL: ${midpointPortfolioReturn.toFixed(2)}% return = $${totalMidpointReturn.toLocaleString()}`);