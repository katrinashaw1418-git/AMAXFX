// TARGET IRR ANALYSIS: Current Returns vs Target IRR
console.log('=== TARGET IRR ANALYSIS ===\n');

// Current actual returns from our portfolio
const currentReturns = [
  { name: "Real Estate Credit Fund", current: 2.63, invested: 500000, targetIrr: "~11%" },
  { name: "Corporate Credit Fund", current: 1.23, invested: 300000, targetIrr: "10–12%" },
  { name: "VC / Growth Equity Fund", current: 22.75, invested: 750000, targetIrr: "16–20%" },
  { name: "Bitcoin Tracker Fund", current: 3.42, invested: 150000, targetIrr: "Market-based (historical 60%+ annualized)" },
  { name: "Ethereum Staking Fund", current: 6.25, invested: 75000, targetIrr: "4.5–7% APY (staking rewards)" }
];

console.log('CURRENT PERFORMANCE vs TARGET IRR:\n');

currentReturns.forEach((investment, i) => {
  console.log(`${i+1}. ${investment.name}`);
  console.log(`   Current Return: ${investment.current.toFixed(2)}%`);
  console.log(`   Target IRR: ${investment.targetIrr}`);
  console.log(`   Invested Amount: $${investment.invested.toLocaleString()}`);
  
  // Analysis of performance vs target
  let analysis = "";
  switch(investment.name) {
    case "Real Estate Credit Fund":
      analysis = "UNDERPERFORMING - Currently 2.63% vs ~11% target. Likely early in investment cycle.";
      break;
    case "Corporate Credit Fund":
      analysis = "UNDERPERFORMING - Currently 1.23% vs 10-12% target. Early stage investment.";
      break;
    case "VC / Growth Equity Fund":
      analysis = "OUTPERFORMING - Currently 22.75% vs 16-20% target. Strong portfolio performance.";
      break;
    case "Bitcoin Tracker Fund":
      analysis = "UNDERPERFORMING - Currently 3.42% vs historical 60%+ target. Market dependent.";
      break;
    case "Ethereum Staking Fund":
      analysis = "ON TARGET - Currently 6.25% vs 4.5-7% target. Within expected range.";
      break;
  }
  
  console.log(`   Performance Analysis: ${analysis}`);
  console.log('');
});

console.log('PORTFOLIO SUMMARY:');
const totalInvested = currentReturns.reduce((sum, inv) => sum + inv.invested, 0);
const weightedReturn = currentReturns.reduce((sum, inv) => sum + (inv.current * inv.invested / totalInvested), 0);

console.log(`Total Portfolio Invested: $${totalInvested.toLocaleString()}`);
console.log(`Weighted Average Return: ${weightedReturn.toFixed(2)}%`);
console.log(`Current Total Return: $197,319 (11.12%)`);

console.log('\nKEY INSIGHTS:');
console.log('• VC Fund is the main driver of performance (22.75% return on largest investment)');
console.log('• Real Estate and Corporate Credit funds are underperforming targets but likely early-stage');
console.log('• Ethereum Staking is performing within target range');
console.log('• Bitcoin Tracker is market-dependent and currently below historical averages');
console.log('• Overall portfolio return of 11.12% is reasonable given fund mix and timing');