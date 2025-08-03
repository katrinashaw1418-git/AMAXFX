// Detailed Cumulative Return Calculation by Period
// This script shows the exact calculation methodology for Performance by Period chart

console.log("=== CUMULATIVE RETURN CALCULATION BY PERIOD ===\n");

// Investment data from database
const investments = [
  { id: 37, productId: 2, investedAmount: 85000, investmentDate: '2024-03-15' }, // Real Estate Credit Fund
  { id: 38, productId: 1, investedAmount: 350000, investmentDate: '2024-04-10' }, // Real Estate Equity Fund  
  { id: 39, productId: 3, investedAmount: 150000, investmentDate: '2024-05-20' }, // Real Estate First Mortgage Fund
  { id: 40, productId: 4, investedAmount: 450000, investmentDate: '2024-06-12' }, // Cash Flow-Based Corporate Credit Fund
  { id: 41, productId: 5, investedAmount: 565000, investmentDate: '2024-07-08' }, // Security-Backed Corporate Credit Fund
  { id: 42, productId: 6, investedAmount: 250000, investmentDate: '2024-08-25' }, // VC / Growth Equity Fund
];

// Product IRR and term mapping
const productData = {
  1: { name: "Real Estate Equity Fund", midpointIRR: 0.104, termYears: 4.25 },
  2: { name: "Real Estate Credit Fund", midpointIRR: 0.11, termYears: 0.85 },
  3: { name: "Real Estate First Mortgage Fund", midpointIRR: 0.09, termYears: 0.78 },
  4: { name: "Cash Flow-Based Corporate Credit Fund", midpointIRR: 0.11, termYears: 2.5 },
  5: { name: "Security-Backed Corporate Credit Fund", midpointIRR: 0.135, termYears: 2.875 },
  6: { name: "VC / Growth Equity Fund", midpointIRR: 0.18, termYears: 6 }
};

// Calculation function
function calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate) {
  const timeElapsed = (currentDate - investmentDate) / (365.25 * 24 * 60 * 60 * 1000);
  const effectiveTime = Math.min(timeElapsed, product.termYears);
  const growthFactor = Math.pow(1 + product.midpointIRR, effectiveTime);
  const currentValue = investedAmount * growthFactor;
  const returnAmount = currentValue - investedAmount;
  const returnPercentage = (returnAmount / investedAmount) * 100;
  
  return {
    currentValue: Math.round(currentValue * 100) / 100,
    returnAmount: Math.round(returnAmount * 100) / 100,
    returnPercentage: Math.round(returnPercentage * 100) / 100,
    effectiveTime: Math.round(effectiveTime * 1000) / 1000
  };
}

// Generate quarterly data points for 1 year lookback
const periods = [];
const endDate = new Date('2025-01-02'); // Current date
const startDate = new Date('2024-01-02'); // 1 year ago

console.log("QUARTERLY CALCULATION PERIODS:");
console.log("================================");

let currentPeriod = new Date(startDate);
while (currentPeriod <= endDate) {
  const quarterLabel = `Q${Math.floor(currentPeriod.getMonth() / 3) + 1}'${currentPeriod.getFullYear().toString().slice(-2)}`;
  
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let cumulativeReturn = 0;
  
  console.log(`\n--- ${quarterLabel} (${currentPeriod.toISOString().split('T')[0]}) ---`);
  
  investments.forEach(investment => {
    const investmentDate = new Date(investment.investmentDate);
    
    // Only include investments that existed at this point in time
    if (investmentDate <= currentPeriod) {
      const product = productData[investment.productId];
      const performance = calculateInvestmentPerformance(product, investment.investedAmount, investmentDate, currentPeriod);
      
      totalInvested += investment.investedAmount;
      totalCurrentValue += performance.currentValue;
      cumulativeReturn += performance.returnAmount;
      
      console.log(`  ${product.name}:`);
      console.log(`    Invested: $${investment.investedAmount.toLocaleString()}`);
      console.log(`    Time Elapsed: ${performance.effectiveTime} years`);
      console.log(`    Current Value: $${performance.currentValue.toLocaleString()}`);
      console.log(`    Return: $${performance.returnAmount.toLocaleString()} (${performance.returnPercentage.toFixed(2)}%)`);
    }
  });
  
  const overallReturnPercent = totalInvested > 0 ? (cumulativeReturn / totalInvested) * 100 : 0;
  
  console.log(`  PERIOD TOTALS:`);
  console.log(`    Total Invested: $${totalInvested.toLocaleString()}`);
  console.log(`    Total Current Value: $${totalCurrentValue.toLocaleString()}`);
  console.log(`    Cumulative Return: $${cumulativeReturn.toLocaleString()} (${overallReturnPercent.toFixed(2)}%)`);
  
  periods.push({
    quarter: quarterLabel,
    date: currentPeriod.toISOString().split('T')[0],
    totalInvested,
    totalCurrentValue,
    cumulativeReturn,
    returnPercent: overallReturnPercent
  });
  
  // Move to next quarter
  currentPeriod.setMonth(currentPeriod.getMonth() + 3);
}

console.log("\n\n=== SUMMARY TABLE ===");
console.log("Period\t\tTotal Invested\tCurrent Value\tCumulative Return\tReturn %");
console.log("=".repeat(80));

periods.forEach(period => {
  console.log(`${period.quarter}\t\t$${period.totalInvested.toLocaleString()}\t$${period.totalCurrentValue.toLocaleString()}\t$${period.cumulativeReturn.toLocaleString()}\t\t${period.returnPercent.toFixed(2)}%`);
});

console.log("\n=== CALCULATION METHODOLOGY ===");
console.log("1. For each quarter, include only investments made before or on that date");
console.log("2. Calculate each investment's performance using: CurrentValue = Invested × (1 + IRR)^EffectiveTime");
console.log("3. EffectiveTime = Min(TimeElapsed, ProductTerm) to cap growth at product maturity");
console.log("4. Cumulative Return = Sum of all individual investment returns for that period");
console.log("5. Return % = (Cumulative Return / Total Invested) × 100");

