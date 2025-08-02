// Complete calculation covering entire term until expiry date for each product
// This will show cumulative returns across the full investment lifecycle

console.log("=== COMPLETE CUMULATIVE RETURN CALCULATION TO TERM EXPIRY ===\n");

const investments = [
  { id: 37, productId: 2, investedAmount: 85000, investmentDate: '2024-03-15' }, // Real Estate Credit Fund
  { id: 38, productId: 1, investedAmount: 350000, investmentDate: '2024-04-10' }, // Real Estate Equity Fund  
  { id: 39, productId: 3, investedAmount: 150000, investmentDate: '2024-05-20' }, // Real Estate First Mortgage Fund
  { id: 40, productId: 4, investedAmount: 450000, investmentDate: '2024-06-12' }, // Cash Flow-Based Corporate Credit Fund
  { id: 41, productId: 5, investedAmount: 565000, investmentDate: '2024-07-08' }, // Security-Backed Corporate Credit Fund
  { id: 42, productId: 6, investedAmount: 250000, investmentDate: '2024-08-25' }, // VC / Growth Equity Fund
];

const productData = {
  1: { name: "Real Estate Equity Fund", shortName: "RE Equity", midpointIRR: 0.104, termYears: 4.25 },
  2: { name: "Real Estate Credit Fund", shortName: "RE Credit", midpointIRR: 0.11, termYears: 0.85 },
  3: { name: "Real Estate First Mortgage Fund", shortName: "RE Mortgage", midpointIRR: 0.09, termYears: 0.78 },
  4: { name: "Cash Flow-Based Corporate Credit Fund", shortName: "Corp Credit", midpointIRR: 0.11, termYears: 2.5 },
  5: { name: "Security-Backed Corporate Credit Fund", shortName: "Security Credit", midpointIRR: 0.135, termYears: 2.875 },
  6: { name: "VC / Growth Equity Fund", shortName: "VC Fund", midpointIRR: 0.18, termYears: 6 }
};

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

// Generate extended periods covering full term expiry
const periods = [];
const startDate = new Date('2024-01-02');
const endDate = new Date('2030-12-31'); // Extended to cover all term expiries

console.log("QUARTERLY PERIODS TO TERM EXPIRY:");
console.log("=".repeat(120));

let currentPeriod = new Date(startDate);
while (currentPeriod <= endDate) {
  const quarterLabel = `Q${Math.floor(currentPeriod.getMonth() / 3) + 1}'${currentPeriod.getFullYear().toString().slice(-2)}`;
  
  const productBreakdown = {};
  let periodTotalInvested = 0;
  let periodTotalCurrentValue = 0;
  let periodTotalReturn = 0;
  
  // Calculate for each product
  investments.forEach(investment => {
    const investmentDate = new Date(investment.investmentDate);
    
    if (investmentDate <= currentPeriod) {
      const product = productData[investment.productId];
      const performance = calculateInvestmentPerformance(product, investment.investedAmount, investmentDate, currentPeriod);
      
      periodTotalInvested += investment.investedAmount;
      periodTotalCurrentValue += performance.currentValue;
      periodTotalReturn += performance.returnAmount;
      
      productBreakdown[product.shortName] = {
        invested: investment.investedAmount,
        currentValue: performance.currentValue,
        returnAmount: performance.returnAmount,
        returnPercent: performance.returnPercentage,
        effectiveTime: performance.effectiveTime,
        termYears: product.termYears
      };
    }
  });
  
  if (periodTotalInvested > 0) {
    const overallReturnPercent = (periodTotalReturn / periodTotalInvested) * 100;
    
    periods.push({
      quarter: quarterLabel,
      date: currentPeriod.toISOString().split('T')[0],
      productBreakdown,
      totalInvested: periodTotalInvested,
      totalCurrentValue: periodTotalCurrentValue,
      totalReturn: periodTotalReturn,
      returnPercent: overallReturnPercent
    });
  }
  
  currentPeriod.setMonth(currentPeriod.getMonth() + 3);
}

// Show key milestone periods
const keyPeriods = periods.filter((period, index) => {
  return index < 8 || // First 8 periods
         period.quarter.includes('Q1') || // All Q1 periods
         index === periods.length - 1; // Last period
});

console.log("CUMULATIVE RETURN BY PERIOD (KEY MILESTONES):");
console.log("Period\t\tTotal Invested\tCurrent Value\tCumulative Return\tReturn %");
console.log("=".repeat(80));

keyPeriods.forEach(period => {
  console.log(`${period.quarter}\t\t$${period.totalInvested.toLocaleString()}\t$${period.totalCurrentValue.toLocaleString()}\t$${period.totalReturn.toLocaleString()}\t\t${period.returnPercent.toFixed(2)}%`);
});

console.log("\n" + "=".repeat(120));
console.log("DETAILED PRODUCT BREAKDOWN BY PERIOD (EXTENDED TO TERM EXPIRY):");
console.log("=".repeat(120));

// Enhanced product breakdown table
let header = "Period".padEnd(12);
Object.values(productData).forEach(product => {
  header += product.shortName.padEnd(18);
});
header += "Total Return".padEnd(15);
console.log(header);
console.log("=".repeat(120));

keyPeriods.forEach(period => {
  let row = period.quarter.padEnd(12);
  
  Object.values(productData).forEach(product => {
    const breakdown = period.productBreakdown[product.shortName];
    if (breakdown) {
      const returnDisplay = `$${breakdown.returnAmount.toLocaleString()} (${breakdown.returnPercent.toFixed(1)}%)`;
      row += returnDisplay.padEnd(18);
    } else {
      row += "-".padEnd(18);
    }
  });
  
  row += `$${period.totalReturn.toLocaleString()}`.padEnd(15);
  console.log(row);
});

// Generate final term expiry summary
console.log("\n" + "=".repeat(120));
console.log("TERM EXPIRY PROJECTIONS BY PRODUCT:");
console.log("=".repeat(120));

investments.forEach(investment => {
  const product = productData[investment.productId];
  const investmentDate = new Date(investment.investmentDate);
  const termExpiryDate = new Date(investmentDate);
  termExpiryDate.setMonth(termExpiryDate.getMonth() + (product.termYears * 12));
  
  const termExpiryValue = investment.investedAmount * Math.pow(1 + product.midpointIRR, product.termYears);
  const termExpiryReturn = termExpiryValue - investment.investedAmount;
  const termExpiryPercent = (termExpiryReturn / investment.investedAmount) * 100;
  
  console.log(`${product.name}:`);
  console.log(`  Investment Date: ${investmentDate.toISOString().split('T')[0]}`);
  console.log(`  Term Expiry Date: ${termExpiryDate.toISOString().split('T')[0]}`);
  console.log(`  Invested: $${investment.investedAmount.toLocaleString()}`);
  console.log(`  Term Expiry Value: $${termExpiryValue.toLocaleString()}`);
  console.log(`  Term Expiry Return: $${termExpiryReturn.toLocaleString()} (${termExpiryPercent.toFixed(1)}%)`);
  console.log("");
});

// Calculate overall portfolio term expiry
let totalInvested = 0;
let totalTermExpiryValue = 0;

investments.forEach(investment => {
  const product = productData[investment.productId];
  totalInvested += investment.investedAmount;
  totalTermExpiryValue += investment.investedAmount * Math.pow(1 + product.midpointIRR, product.termYears);
});

const portfolioTermExpiryReturn = totalTermExpiryValue - totalInvested;
const portfolioTermExpiryPercent = (portfolioTermExpiryReturn / totalInvested) * 100;

console.log("PORTFOLIO TERM EXPIRY SUMMARY:");
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Portfolio Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
console.log(`Portfolio Term Expiry Return: $${portfolioTermExpiryReturn.toLocaleString()} (${portfolioTermExpiryPercent.toFixed(1)}%)`);

// Export data for graph update
console.log("\n" + "=".repeat(120));
console.log("CHART DATA POINTS (JSON FORMAT):");
console.log(JSON.stringify(periods.slice(0, 20), null, 2)); // First 20 periods for graph
