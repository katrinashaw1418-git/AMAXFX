// Debug Corporate Credit Fund Calculation Discrepancy
// Investment: $450,000 invested July 15, 2024, IRR: 11%, Term: 2.5 years

const corpCreditInvestment = {
  amount: 450000,
  date: new Date('2024-07-15'),
  irr: 0.11,
  termYears: 2.5,
  name: 'Corp Credit'
};

function calculateCorpCreditReturn(targetDate, investment) {
  console.log(`\n=== Corp Credit Calculation for ${targetDate.toISOString().split('T')[0]} ===`);
  console.log(`Investment Amount: $${investment.amount.toLocaleString()}`);
  console.log(`Investment Date: ${investment.date.toISOString().split('T')[0]}`);
  console.log(`IRR: ${investment.irr * 100}%`);
  console.log(`Term: ${investment.termYears} years`);
  
  // Calculate time elapsed
  const timeInYears = Math.max(0, (targetDate.getTime() - investment.date.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  console.log(`Time Elapsed: ${timeInYears.toFixed(4)} years`);
  
  // Apply term capping
  const effectiveTime = Math.min(timeInYears, investment.termYears);
  console.log(`Effective Time (capped): ${effectiveTime.toFixed(4)} years`);
  
  // Calculate using compound interest formula
  const growthFactor = Math.pow(1 + investment.irr, effectiveTime);
  console.log(`Growth Factor: (1 + ${investment.irr})^${effectiveTime.toFixed(4)} = ${growthFactor.toFixed(6)}`);
  
  const currentValue = investment.amount * growthFactor;
  const returnAmount = currentValue - investment.amount;
  
  console.log(`Current Value: $${investment.amount.toLocaleString()} × ${growthFactor.toFixed(6)} = $${currentValue.toFixed(2)}`);
  console.log(`Return Amount: $${currentValue.toFixed(2)} - $${investment.amount.toLocaleString()} = $${returnAmount.toFixed(2)}`);
  console.log(`Return Amount (floor): $${Math.floor(returnAmount).toLocaleString()}`);
  
  return {
    timeInYears,
    effectiveTime,
    growthFactor,
    currentValue,
    returnAmount: Math.floor(returnAmount)
  };
}

// Current date calculation (approximately August 2, 2025)
const currentDate = new Date('2025-08-02');
const currentCalc = calculateCorpCreditReturn(currentDate, corpCreditInvestment);

// Term expiry calculation (2.5 years from July 15, 2024 = January 15, 2027)
const termExpiryDate = new Date('2027-01-15');
const termExpiryCalc = calculateCorpCreditReturn(termExpiryDate, corpCreditInvestment);

console.log(`\n=== SUMMARY ===`);
console.log(`Current Return (Aug 2025): $${currentCalc.returnAmount.toLocaleString()}`);
console.log(`Term Expiry Return (Jan 2027): $${termExpiryCalc.returnAmount.toLocaleString()}`);
console.log(`Term Expiry Current Value: $${Math.floor(termExpiryCalc.currentValue).toLocaleString()}`);

// Check what the table should show for Q2'25 specifically
const q2_25_date = new Date('2025-06-25');
const q2_25_calc = calculateCorpCreditReturn(q2_25_date, corpCreditInvestment);
console.log(`\nQ2'25 Table Value: $${q2_25_calc.returnAmount.toLocaleString()}`);