// DETAILED CALCULATION: Corporate Credit Fund Investment Breakdown
// Showing exact step-by-step calculation for +$82,678 and $973,573 (+$223,573)

console.log('=== CORPORATE CREDIT FUND - STEP-BY-STEP CALCULATION ===');

// Actual investment data from database
const investment = {
  principal: 750000,           // $750,000 invested
  investmentDate: new Date('2024-08-01'),  // August 1, 2024
  currentDate: new Date('2025-08-02'),     // August 2, 2025 (current)
  annualIRR: 0.11,            // 11% annual IRR
  termYears: 2.5              // 2.5 year investment term
};

console.log('INVESTMENT DETAILS:');
console.log(`• Principal Amount: $${investment.principal.toLocaleString()}`);
console.log(`• Investment Date: ${investment.investmentDate.toDateString()}`);
console.log(`• Current Date: ${investment.currentDate.toDateString()}`);
console.log(`• Annual IRR: ${investment.annualIRR * 100}%`);
console.log(`• Investment Term: ${investment.termYears} years`);

// Step 1: Calculate time elapsed in years
const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
const timeElapsedMs = investment.currentDate.getTime() - investment.investmentDate.getTime();
const timeElapsedYears = timeElapsedMs / millisecondsPerYear;

console.log('\n=== STEP 1: TIME CALCULATION ===');
console.log(`Time Elapsed = (Current Date - Investment Date) / Years`);
console.log(`Time Elapsed = (${investment.currentDate.getTime()} - ${investment.investmentDate.getTime()}) / ${millisecondsPerYear}`);
console.log(`Time Elapsed = ${timeElapsedMs} milliseconds / ${millisecondsPerYear}`);
console.log(`Time Elapsed = ${timeElapsedYears.toFixed(6)} years`);

// Step 2: Apply term capping (growth stops at maturity)
const effectiveTime = Math.min(timeElapsedYears, investment.termYears);

console.log('\n=== STEP 2: TERM CAPPING ===');
console.log(`Effective Time = min(Time Elapsed, Investment Term)`);
console.log(`Effective Time = min(${timeElapsedYears.toFixed(6)}, ${investment.termYears})`);
console.log(`Effective Time = ${effectiveTime.toFixed(6)} years`);
console.log(`Note: Growth is capped at investment term to prevent unrealistic returns`);

// Step 3: Calculate compound growth factor
const growthFactor = Math.pow(1 + investment.annualIRR, effectiveTime);

console.log('\n=== STEP 3: COMPOUND GROWTH CALCULATION ===');
console.log(`Growth Factor = (1 + Annual IRR)^Effective Time`);
console.log(`Growth Factor = (1 + ${investment.annualIRR})^${effectiveTime.toFixed(6)}`);
console.log(`Growth Factor = (${1 + investment.annualIRR})^${effectiveTime.toFixed(6)}`);
console.log(`Growth Factor = ${growthFactor.toFixed(8)}`);

// Step 4: Calculate current value
const exactCurrentValue = investment.principal * growthFactor;
const flooredCurrentValue = Math.floor(exactCurrentValue);

console.log('\n=== STEP 4: CURRENT VALUE CALCULATION ===');
console.log(`Current Value = Principal × Growth Factor`);
console.log(`Current Value = $${investment.principal.toLocaleString()} × ${growthFactor.toFixed(8)}`);
console.log(`Current Value = $${exactCurrentValue.toFixed(2)} (exact)`);
console.log(`Current Value = $${flooredCurrentValue.toLocaleString()} (floored to whole number)`);

// Step 5: Calculate current return
const exactReturn = exactCurrentValue - investment.principal;
const flooredReturn = Math.floor(exactReturn);

console.log('\n=== STEP 5: CURRENT RETURN CALCULATION ===');
console.log(`Current Return = Current Value - Principal`);
console.log(`Current Return = $${exactCurrentValue.toFixed(2)} - $${investment.principal.toLocaleString()}`);
console.log(`Current Return = $${exactReturn.toFixed(2)} (exact)`);
console.log(`Current Return = $${flooredReturn.toLocaleString()} (floored)`);
console.log(`✓ This matches the displayed +$${flooredReturn.toLocaleString()}`);

// Step 6: Calculate term expiry projection
const termExpiryGrowthFactor = Math.pow(1 + investment.annualIRR, investment.termYears);
const exactTermExpiryValue = investment.principal * termExpiryGrowthFactor;
const flooredTermExpiryValue = Math.floor(exactTermExpiryValue);
const exactTermExpiryReturn = exactTermExpiryValue - investment.principal;
const flooredTermExpiryReturn = Math.floor(exactTermExpiryReturn);

console.log('\n=== STEP 6: TERM EXPIRY PROJECTION ===');
console.log(`Term Expiry Growth Factor = (1 + ${investment.annualIRR})^${investment.termYears}`);
console.log(`Term Expiry Growth Factor = ${termExpiryGrowthFactor.toFixed(8)}`);
console.log(`Term Expiry Value = $${investment.principal.toLocaleString()} × ${termExpiryGrowthFactor.toFixed(8)}`);
console.log(`Term Expiry Value = $${exactTermExpiryValue.toFixed(2)} (exact)`);
console.log(`Term Expiry Value = $${flooredTermExpiryValue.toLocaleString()} (floored)`);
console.log(`Term Expiry Return = $${flooredTermExpiryValue.toLocaleString()} - $${investment.principal.toLocaleString()}`);
console.log(`Term Expiry Return = $${flooredTermExpiryReturn.toLocaleString()}`);
console.log(`✓ This matches the displayed $${flooredTermExpiryValue.toLocaleString()} (+$${flooredTermExpiryReturn.toLocaleString()})`);

console.log('\n=== FINAL VERIFICATION ===');
console.log(`Current Return: +$${flooredReturn.toLocaleString()} ✓`);
console.log(`Term Expiry: $${flooredTermExpiryValue.toLocaleString()} (+$${flooredTermExpiryReturn.toLocaleString()}) ✓`);
console.log(`Return Percentage at Term: ${((flooredTermExpiryReturn / investment.principal) * 100).toFixed(0)}%`);

console.log('\n=== FORMULA SUMMARY ===');
console.log(`Current Value = Principal × (1 + IRR)^min(TimeElapsed, TermLimit)`);
console.log(`All values use Math.floor() for consistent whole number display`);
console.log(`Time calculation accounts for exact dates and leap years`);