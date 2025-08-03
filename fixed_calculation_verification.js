// FIXED: Corporate Credit Calculation Based on User's Actual Data
// User shows: $750,000 invested on Aug 2, 2024, current return $82,677

console.log('=== CORPORATE CREDIT FUND - CORRECTED CALCULATION ===');

const actualData = {
  invested: 750000,
  investmentDate: new Date('2024-08-02'), // Aug 2, 2024  
  irr: 0.11,
  termYears: 2.5,
  currentDate: new Date('2025-08-02') // Current date
};

console.log(`Investment Amount: $${actualData.invested.toLocaleString()}`);
console.log(`Investment Date: ${actualData.investmentDate.toDateString()}`);
console.log(`Current Date: ${actualData.currentDate.toDateString()}`);
console.log(`IRR: ${actualData.irr * 100}%`);
console.log(`Term: ${actualData.termYears} years`);

// Calculate exact time elapsed
const timeInYears = Math.max(0, (actualData.currentDate.getTime() - actualData.investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
console.log(`\nTime Elapsed: ${timeInYears.toFixed(4)} years (exactly 1 year)`);

// Apply term capping
const effectiveTime = Math.min(timeInYears, actualData.termYears);
console.log(`Effective Time (capped): ${effectiveTime.toFixed(4)} years`);

// Calculate using automated compound interest formula  
const growthFactor = Math.pow(1 + actualData.irr, effectiveTime);
console.log(`Growth Factor: (1 + ${actualData.irr})^${effectiveTime.toFixed(4)} = ${growthFactor.toFixed(6)}`);

const currentValue = Math.floor(actualData.invested * growthFactor);
const returnAmount = Math.floor(currentValue - actualData.invested);

console.log(`\n=== CURRENT VALUE CALCULATION ===`);
console.log(`Current Value: $${actualData.invested.toLocaleString()} × ${growthFactor.toFixed(6)} = $${currentValue.toLocaleString()}`);
console.log(`Return Amount: $${currentValue.toLocaleString()} - $${actualData.invested.toLocaleString()} = $${returnAmount.toLocaleString()}`);
console.log(`Return Percentage: ${((returnAmount / actualData.invested) * 100).toFixed(2)}%`);

// Calculate term expiry projection
const termExpiryGrowthFactor = Math.pow(1 + actualData.irr, actualData.termYears);
const termExpiryValue = Math.floor(actualData.invested * termExpiryGrowthFactor);
const termExpiryReturn = Math.floor(termExpiryValue - actualData.invested);

console.log(`\n=== TERM EXPIRY PROJECTION ===`);
console.log(`Term Expiry Growth Factor: (1.11)^${actualData.termYears} = ${termExpiryGrowthFactor.toFixed(6)}`);
console.log(`Term Expiry Value: $${actualData.invested.toLocaleString()} × ${termExpiryGrowthFactor.toFixed(6)} = $${termExpiryValue.toLocaleString()}`);
console.log(`Term Expiry Return: $${termExpiryValue.toLocaleString()} - $${actualData.invested.toLocaleString()} = $${termExpiryReturn.toLocaleString()}`);
console.log(`Term Expiry Percentage: ${((termExpiryReturn / actualData.invested) * 100).toFixed(0)}%`);

console.log(`\n=== VERIFICATION WITH USER'S DISPLAYED VALUES ===`);
console.log(`User Shows - Current Return: $82,677`);
console.log(`Calculated - Current Return: $${returnAmount.toLocaleString()}`);
console.log(`Match: ${returnAmount === 82677 ? '✓ CORRECT' : '✗ MISMATCH - off by $' + Math.abs(returnAmount - 82677)}`);

console.log(`\nUser Shows - Term Expiry: $973,573 (+$223,573)`);
console.log(`Calculated - Term Expiry: $${termExpiryValue.toLocaleString()} (+$${termExpiryReturn.toLocaleString()})`);
console.log(`Match: ${termExpiryValue === 973573 && termExpiryReturn === 223573 ? '✓ CORRECT' : '✗ MISMATCH'}`);

// Also calculate for Q2'25 table verification
const q2_25_date = new Date('2025-06-25');
const q2_25_timeInYears = Math.max(0, (q2_25_date.getTime() - actualData.investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
const q2_25_effectiveTime = Math.min(q2_25_timeInYears, actualData.termYears);
const q2_25_growthFactor = Math.pow(1 + actualData.irr, q2_25_effectiveTime);
const q2_25_currentValue = Math.floor(actualData.invested * q2_25_growthFactor);
const q2_25_return = Math.floor(q2_25_currentValue - actualData.invested);

console.log(`\n=== Q2'25 TABLE VALUE (for verification) ===`);
console.log(`Q2'25 Date: ${q2_25_date.toDateString()}`);
console.log(`Q2'25 Time Elapsed: ${q2_25_timeInYears.toFixed(4)} years`);
console.log(`Q2'25 Return: $${q2_25_return.toLocaleString()}`);
console.log(`This should match the table value for Corp Credit in Q2'25`);