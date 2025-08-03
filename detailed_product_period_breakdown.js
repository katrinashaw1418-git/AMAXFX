// Create detailed product-by-product breakdown by period for cumulative returns
// This will generate the data for the summary table showing cumulative return by product each period

console.log("=== CUMULATIVE RETURN BY PRODUCT FOR EACH PERIOD ===\n");

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

// Generate periods
const periods = [];
const endDate = new Date('2025-01-02');
const startDate = new Date('2024-01-02');

let currentPeriod = new Date(startDate);
while (currentPeriod <= endDate) {
  const quarterLabel = `Q${Math.floor(currentPeriod.getMonth() / 3) + 1}'${currentPeriod.getFullYear().toString().slice(-2)}`;
  
  const productBreakdown = {};
  let periodTotalInvested = 0;
  let periodTotalReturn = 0;
  
  // Calculate for each product
  investments.forEach(investment => {
    const investmentDate = new Date(investment.investmentDate);
    
    if (investmentDate <= currentPeriod) {
      const product = productData[investment.productId];
      const performance = calculateInvestmentPerformance(product, investment.investedAmount, investmentDate, currentPeriod);
      
      periodTotalInvested += investment.investedAmount;
      periodTotalReturn += performance.returnAmount;
      
      productBreakdown[product.shortName] = {
        invested: investment.investedAmount,
        currentValue: performance.currentValue,
        returnAmount: performance.returnAmount,
        returnPercent: performance.returnPercentage
      };
    }
  });
  
  periods.push({
    quarter: quarterLabel,
    date: currentPeriod.toISOString().split('T')[0],
    productBreakdown,
    totalInvested: periodTotalInvested,
    totalReturn: periodTotalReturn
  });
  
  currentPeriod.setMonth(currentPeriod.getMonth() + 3);
}

// Generate table format
console.log("Product Breakdown by Period - Cumulative Returns");
console.log("=".repeat(120));

// Header
let header = "Period".padEnd(12);
Object.values(productData).forEach(product => {
  header += product.shortName.padEnd(18);
});
header += "Total Return".padEnd(15);
console.log(header);
console.log("=".repeat(120));

// Data rows
periods.forEach(period => {
  if (period.totalInvested === 0) return; // Skip empty periods
  
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

console.log("\n" + "=".repeat(120));
console.log("Legend:");
console.log("- Shows cumulative return amount and percentage for each product by period");
console.log("- Only includes investments made before or on the period date");
console.log("- Each product contributes to total cumulative return based on IRR and time elapsed");

