// Investment Breakdown Calculation Verification for Corp Credit
// This should match the exact calculation used in the Investment Breakdown component

const corpCreditData = {
  totalInvested: 450000, // Corp Credit investment amount
  midpointIRR: 0.11,     // 11% IRR
  termYears: 2.5         // 2.5 year term
};

console.log('=== Investment Breakdown Corp Credit Calculation ===');
console.log(`Total Invested: $${corpCreditData.totalInvested.toLocaleString()}`);
console.log(`Midpoint IRR: ${corpCreditData.midpointIRR * 100}%`);
console.log(`Term: ${corpCreditData.termYears} years`);

// Calculate term expiry projection (what Investment Breakdown shows)
const termExpiryGrowthFactor = Math.pow(1 + corpCreditData.midpointIRR, corpCreditData.termYears);
console.log(`Growth Factor: (1 + ${corpCreditData.midpointIRR})^${corpCreditData.termYears} = ${termExpiryGrowthFactor.toFixed(6)}`);

const termExpiryValue = Math.floor(corpCreditData.totalInvested * termExpiryGrowthFactor);
const termExpiryReturn = Math.floor(termExpiryValue - corpCreditData.totalInvested);
const termExpiryPercent = ((termExpiryReturn / corpCreditData.totalInvested) * 100);

console.log(`Term Expiry Value: $${corpCreditData.totalInvested.toLocaleString()} × ${termExpiryGrowthFactor.toFixed(6)} = $${termExpiryValue.toLocaleString()}`);
console.log(`Term Expiry Return: $${termExpiryValue.toLocaleString()} - $${corpCreditData.totalInvested.toLocaleString()} = $${termExpiryReturn.toLocaleString()}`);
console.log(`Term Expiry Percent: ${termExpiryPercent.toFixed(1)}%`);

console.log('\n=== Expected Investment Breakdown Display ===');
console.log(`Term Expiry Projection: $${termExpiryValue.toLocaleString()} (+$${termExpiryReturn.toLocaleString()})`);
console.log(`This should match: $584,144 (+$134,144) instead of $973,573.424 (+$223,573.424)`);

// Also check current value calculation (should come from server API)
console.log('\n=== Current Value (from server API) ===');
console.log('The current return should come from the server API calculateInvestmentPerformance function');
console.log('For August 2025 (1.0486 years): $52,039 current return');
console.log('For Q2\'25 (0.9446 years): $46,618 table return');
console.log('Current discrepancy: showing $82,677 instead of correct server value');