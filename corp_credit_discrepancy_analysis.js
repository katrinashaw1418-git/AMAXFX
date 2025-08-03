// Corporate Credit Fund Discrepancy Analysis
// User shows: $750,000 invested, $832,677 current value, $82,677 return, $973,573 term expiry
// Expected: $450,000 invested based on our calculations

console.log('=== CORPORATE CREDIT FUND DISCREPANCY ANALYSIS ===');

// User's displayed values
const userDisplayed = {
  invested: 750000,
  currentValue: 832677,
  currentReturn: 82677,
  termExpiryValue: 973573,
  termExpiryReturn: 223573,
  investmentDate: new Date('2024-08-02'), // Aug 2, 2024
  holdingPeriod: '1 year'
};

// Our expected values  
const expectedData = {
  invested: 450000,
  investmentDate: new Date('2024-07-15'), // July 15, 2024
  irr: 0.11,
  termYears: 2.5
};

console.log('USER DISPLAYED VALUES:');
console.log(`Invested: $${userDisplayed.invested.toLocaleString()}`);
console.log(`Current Value: $${userDisplayed.currentValue.toLocaleString()}`);
console.log(`Current Return: $${userDisplayed.currentReturn.toLocaleString()}`);
console.log(`Term Expiry: $${userDisplayed.termExpiryValue.toLocaleString()} (+$${userDisplayed.termExpiryReturn.toLocaleString()})`);
console.log(`Investment Date: ${userDisplayed.investmentDate.toDateString()}`);
console.log(`Holding Period: ${userDisplayed.holdingPeriod}`);

console.log('\nOUR EXPECTED VALUES:');
console.log(`Invested: $${expectedData.invested.toLocaleString()}`);
console.log(`Investment Date: ${expectedData.investmentDate.toDateString()}`);
console.log(`IRR: ${expectedData.irr * 100}%`);
console.log(`Term: ${expectedData.termYears} years`);

// Calculate what the user's values should be with current date
const currentDate = new Date(); // Current date
const timeElapsedUser = Math.max(0, (currentDate.getTime() - userDisplayed.investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
const timeElapsedExpected = Math.max(0, (currentDate.getTime() - expectedData.investmentDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

console.log(`\n=== TIME CALCULATIONS ===`);
console.log(`Current Date: ${currentDate.toDateString()}`);
console.log(`User's Time Elapsed: ${timeElapsedUser.toFixed(4)} years`);
console.log(`Expected Time Elapsed: ${timeElapsedExpected.toFixed(4)} years`);

// Calculate correct values for $750,000 investment from Aug 2, 2024
console.log('\n=== CORRECT CALCULATION FOR USER\'S $750,000 INVESTMENT ===');
const effectiveTimeUser = Math.min(timeElapsedUser, expectedData.termYears);
const growthFactorUser = Math.pow(1 + expectedData.irr, effectiveTimeUser);
const correctCurrentValueUser = Math.floor(userDisplayed.invested * growthFactorUser);
const correctReturnUser = Math.floor(correctCurrentValueUser - userDisplayed.invested);

console.log(`Effective Time: min(${timeElapsedUser.toFixed(4)}, ${expectedData.termYears}) = ${effectiveTimeUser.toFixed(4)} years`);
console.log(`Growth Factor: (1.11)^${effectiveTimeUser.toFixed(4)} = ${growthFactorUser.toFixed(6)}`);
console.log(`Correct Current Value: $${userDisplayed.invested.toLocaleString()} × ${growthFactorUser.toFixed(6)} = $${correctCurrentValueUser.toLocaleString()}`);
console.log(`Correct Current Return: $${correctCurrentValueUser.toLocaleString()} - $${userDisplayed.invested.toLocaleString()} = $${correctReturnUser.toLocaleString()}`);

// Calculate correct term expiry for $750,000
const termExpiryGrowthFactor = Math.pow(1 + expectedData.irr, expectedData.termYears);
const correctTermExpiryValue = Math.floor(userDisplayed.invested * termExpiryGrowthFactor);
const correctTermExpiryReturn = Math.floor(correctTermExpiryValue - userDisplayed.invested);

console.log(`\nCorrect Term Expiry Value: $${userDisplayed.invested.toLocaleString()} × ${termExpiryGrowthFactor.toFixed(6)} = $${correctTermExpiryValue.toLocaleString()}`);
console.log(`Correct Term Expiry Return: $${correctTermExpiryValue.toLocaleString()} - $${userDisplayed.invested.toLocaleString()} = $${correctTermExpiryReturn.toLocaleString()}`);

console.log('\n=== SUMMARY OF CORRECTIONS NEEDED ===');
console.log(`Current Return: Should be $${correctReturnUser.toLocaleString()} instead of $${userDisplayed.currentReturn.toLocaleString()}`);
console.log(`Term Expiry: Should be $${correctTermExpiryValue.toLocaleString()} (+$${correctTermExpiryReturn.toLocaleString()}) instead of $${userDisplayed.termExpiryValue.toLocaleString()} (+$${userDisplayed.termExpiryReturn.toLocaleString()})`);

// Check if there's actually a different investment amount in the database
console.log('\n=== POSSIBLE CAUSE ===');
console.log('The discrepancy suggests the database may have multiple Corporate Credit investments totaling $750,000');
console.log('instead of the single $450,000 investment we\'ve been calculating with.');
console.log('Need to check actual database investment amounts for Corporate Credit Fund (product ID 4).');