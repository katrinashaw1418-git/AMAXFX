// INVESTMENT RETURN CALCULATION USING TARGET IRR RANGES
console.log('=== TARGET IRR JUSTIFIED RETURNS CALCULATION ===\n');

// Current investments with target IRR ranges
const investments = [
  { 
    name: "Real Estate Credit Fund", 
    invested: 500000, 
    currentReturn: 2.63,
    targetIrrRange: "~11%",
    targetIrrMid: 11.0,
    term: "~10.2 months (rolling)"
  },
  { 
    name: "Corporate Credit Fund", 
    invested: 300000, 
    currentReturn: 1.23,
    targetIrrRange: "10–12%",
    targetIrrMid: 11.0,
    term: "2–3 years"
  },
  { 
    name: "VC / Growth Equity Fund", 
    invested: 750000, 
    currentReturn: 22.75,
    targetIrrRange: "16–20%",
    targetIrrMid: 18.0,
    term: "5–7+ years"
  },
  { 
    name: "Bitcoin Tracker Fund", 
    invested: 150000, 
    currentReturn: 3.42,
    targetIrrRange: "Market-based (historical 60%+ annualized)",
    targetIrrMid: 15.0, // Conservative estimate for current market
    term: "Open-ended"
  },
  { 
    name: "Ethereum Staking Fund", 
    invested: 75000, 
    currentReturn: 6.25,
    targetIrrRange: "4.5–7% APY",
    targetIrrMid: 5.75,
    term: "Open-ended"
  }
];

console.log('JUSTIFIED RETURNS USING TARGET IRR:\n');

let totalInvested = 0;
let totalCurrentReturn = 0;
let totalTargetReturn = 0;
let totalTargetValue = 0;
let totalCurrentValue = 0;

investments.forEach((inv, i) => {
  totalInvested += inv.invested;
  
  // Current values
  const currentReturnAmount = inv.invested * (inv.currentReturn / 100);
  const currentValue = inv.invested + currentReturnAmount;
  totalCurrentReturn += currentReturnAmount;
  totalCurrentValue += currentValue;
  
  // Target values based on target IRR
  const targetReturnAmount = inv.invested * (inv.targetIrrMid / 100);
  const targetValue = inv.invested + targetReturnAmount;
  totalTargetReturn += targetReturnAmount;
  totalTargetValue += targetValue;
  
  console.log(`${i+1}. ${inv.name}`);
  console.log(`   Invested: $${inv.invested.toLocaleString()}`);
  console.log(`   Target IRR: ${inv.targetIrrRange}`);
  console.log(`   Using Target IRR: ${inv.targetIrrMid}%`);
  console.log(`   Current Return: ${inv.currentReturn}% ($${currentReturnAmount.toLocaleString()})`);
  console.log(`   Target Return: ${inv.targetIrrMid}% ($${targetReturnAmount.toLocaleString()})`);
  console.log(`   Current Value: $${currentValue.toLocaleString()}`);
  console.log(`   Target Value: $${targetValue.toLocaleString()}`);
  console.log(`   Gap: $${(targetReturnAmount - currentReturnAmount).toLocaleString()}`);
  console.log('');
});

console.log('PORTFOLIO COMPARISON:\n');

const currentPortfolioReturn = (totalCurrentReturn / totalInvested) * 100;
const targetPortfolioReturn = (totalTargetReturn / totalInvested) * 100;

console.log('CURRENT PORTFOLIO:');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current Return: $${totalCurrentReturn.toLocaleString()}`);
console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
console.log(`Current Portfolio Return: ${currentPortfolioReturn.toFixed(2)}%`);

console.log('\nTARGET IRR PORTFOLIO:');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Target Return: $${totalTargetReturn.toLocaleString()}`);
console.log(`Total Target Value: $${totalTargetValue.toLocaleString()}`);
console.log(`Target Portfolio Return: ${targetPortfolioReturn.toFixed(2)}%`);

console.log('\nGAP ANALYSIS:');
const returnGap = totalTargetReturn - totalCurrentReturn;
const percentageGap = targetPortfolioReturn - currentPortfolioReturn;

console.log(`Return Gap: $${returnGap.toLocaleString()}`);
console.log(`Percentage Gap: ${percentageGap.toFixed(2)} percentage points`);

console.log('\nJUSTIFICATION USING TARGET IRR:');
console.log(`• If all investments met their target IRR, portfolio return would be ${targetPortfolioReturn.toFixed(2)}%`);
console.log(`• Current return of ${currentPortfolioReturn.toFixed(2)}% represents ${((currentPortfolioReturn/targetPortfolioReturn)*100).toFixed(1)}% of target performance`);
console.log(`• VC Fund exceeds target (22.75% vs 18% target), offsetting underperforming funds`);
console.log(`• Real Estate and Corporate Credit are likely in ramp-up phase toward target returns`);
console.log(`• Ethereum Staking is performing above target (6.25% vs 5.75% target)`);

console.log('\nTIME FACTOR CONSIDERATIONS:');
console.log(`• Real Estate Credit: Target ~11% over ~10.2 months (currently early stage)`);
console.log(`• Corporate Credit: Target 11% over 2-3 years (currently early stage)`);
console.log(`• VC Fund: Target 18% over 5-7+ years (performing ahead of schedule)`);
console.log(`• Bitcoin/Ethereum: Open-ended, market dependent`);