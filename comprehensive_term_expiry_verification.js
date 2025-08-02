// COMPREHENSIVE DISCREPANCY ANALYSIS
console.log('=== DISCREPANCY ANALYSIS BETWEEN DASHBOARD SECTIONS ===\n');

// Expected values from step-by-step calculation
const expectedValues = {
  totalInvested: 1850000,
  currentValue: 2047006,
  currentReturn: 197006,
  currentReturnPercent: 10.6,
  termExpiryValue: 2837404,
  termExpiryReturn: 987404,
  termExpiryReturnPercent: 53.4
};

// Actual values shown in different dashboard sections
const dashboardSections = {
  investmentBreakdown: {
    name: 'Investment Breakdown by Product',
    totalInvested: 1850000,
    currentValue: 2047032,
    currentReturn: 197032,
    currentReturnPercent: 10.65,
    termExpiryValue: 2409595,
    termExpiryReturn: 559595,
    termExpiryReturnPercent: 30.2
  },
  performanceByPeriod: {
    name: 'Performance by Period (Q2\'25)',
    totalInvested: 1850000,
    currentValue: 1965395,
    currentReturn: 115395,
    currentReturnPercent: 6.24,
    termExpiryValue: 2697647,
    termExpiryReturn: 847647,
    termExpiryReturnPercent: 45.8
  },
  returnByPeriod: {
    name: 'Return by Period (Q2\'25)',
    currentReturn: 115395,
    currentReturnPercent: 6.24,
    termExpiryReturn: 847647
  }
};

console.log('EXPECTED VALUES (from step-by-step calculation):');
console.log(`Total Invested: $${expectedValues.totalInvested.toLocaleString()}`);
console.log(`Current Value: $${expectedValues.currentValue.toLocaleString()}`);
console.log(`Current Return: +$${expectedValues.currentReturn.toLocaleString()} (${expectedValues.currentReturnPercent}%)`);
console.log(`Term Expiry Value: $${expectedValues.termExpiryValue.toLocaleString()}`);
console.log(`Term Expiry Return: +$${expectedValues.termExpiryReturn.toLocaleString()} (${expectedValues.termExpiryReturnPercent}%)\n`);

Object.entries(dashboardSections).forEach(([key, section]) => {
  console.log(`${section.name.toUpperCase()}:`);
  if (section.totalInvested) console.log(`Total Invested: $${section.totalInvested.toLocaleString()}`);
  if (section.currentValue) console.log(`Current Value: $${section.currentValue.toLocaleString()}`);
  if (section.currentReturn) console.log(`Current Return: $${section.currentReturn.toLocaleString()}`);
  if (section.currentReturnPercent) console.log(`Return %: ${section.currentReturnPercent}%`);
  if (section.termExpiryValue) console.log(`Term Expiry Value: $${section.termExpiryValue.toLocaleString()}`);
  if (section.termExpiryReturn) console.log(`Expected Return: +$${section.termExpiryReturn.toLocaleString()}`);
  if (section.termExpiryReturnPercent) console.log(`Expected Return %: ${section.termExpiryReturnPercent}%`);
  console.log('');
});

console.log('DISCREPANCY ANALYSIS:\n');

// Current Value discrepancies
console.log('1. CURRENT VALUE DISCREPANCIES:');
console.log(`Expected Current Value: $${expectedValues.currentValue.toLocaleString()}`);
console.log(`Investment Breakdown shows: $${dashboardSections.investmentBreakdown.currentValue.toLocaleString()} (diff: $${(dashboardSections.investmentBreakdown.currentValue - expectedValues.currentValue).toLocaleString()})`);
console.log(`Performance by Period shows: $${dashboardSections.performanceByPeriod.currentValue.toLocaleString()} (diff: $${(dashboardSections.performanceByPeriod.currentValue - expectedValues.currentValue).toLocaleString()})`);
console.log('');

// Current Return discrepancies
console.log('2. CURRENT RETURN DISCREPANCIES:');
console.log(`Expected Current Return: $${expectedValues.currentReturn.toLocaleString()} (${expectedValues.currentReturnPercent}%)`);
console.log(`Investment Breakdown shows: $${dashboardSections.investmentBreakdown.currentReturn.toLocaleString()} (${dashboardSections.investmentBreakdown.currentReturnPercent}%)`);
console.log(`Performance by Period shows: $${dashboardSections.performanceByPeriod.currentReturn.toLocaleString()} (${dashboardSections.performanceByPeriod.currentReturnPercent}%)`);
console.log(`Return by Period shows: $${dashboardSections.returnByPeriod.currentReturn.toLocaleString()} (${dashboardSections.returnByPeriod.currentReturnPercent}%)`);
console.log('');

// Term Expiry discrepancies
console.log('3. TERM EXPIRY VALUE DISCREPANCIES:');
console.log(`Expected Term Expiry Value: $${expectedValues.termExpiryValue.toLocaleString()}`);
console.log(`Investment Breakdown shows: $${dashboardSections.investmentBreakdown.termExpiryValue.toLocaleString()} (diff: $${(dashboardSections.investmentBreakdown.termExpiryValue - expectedValues.termExpiryValue).toLocaleString()})`);
console.log(`Performance by Period shows: $${dashboardSections.performanceByPeriod.termExpiryValue.toLocaleString()} (diff: $${(dashboardSections.performanceByPeriod.termExpiryValue - expectedValues.termExpiryValue).toLocaleString()})`);
console.log('');

console.log('4. POSSIBLE CAUSES OF DISCREPANCIES:');
console.log('a) Different calculation formulas being used across components');
console.log('b) Different IRR values being applied (some using old 15% vs new 60% for Bitcoin)');
console.log('c) Different term limits being applied');
console.log('d) Some components using cached data vs real-time calculations');
console.log('e) Frontend components not updated to use unified calculation function');
console.log('f) Time calculations having different precision or reference dates');
console.log('g) Rounding differences (Math.floor vs other rounding methods)');
console.log('');

console.log('5. NEXT STEPS TO FIX DISCREPANCIES:');
console.log('✓ Verify all components use the same calculateInvestmentPerformance function');
console.log('✓ Ensure all components use 60% IRR for Bitcoin Tracker Fund');
console.log('✓ Check that all components use identical time calculation methods');
console.log('✓ Verify all components apply term capping correctly');
console.log('✓ Ensure consistent Math.floor() rounding across all sections');
console.log('✓ Update frontend components to call unified backend calculation APIs');
console.log('✓ Remove any hardcoded values or cached calculations from frontend');