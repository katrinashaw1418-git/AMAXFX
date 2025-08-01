// Quick calculation to verify current consistency across all endpoints
console.log('=== CURRENT API RESPONSES ===');

// Portfolio allocation endpoint
const portfolioAllocation = {
  fiat: 627517,
  crypto: 1515362.697,
  stablecoin: 214500,
  investment: 1949158.918913328,
  totalValue: 4306538.615913328
};

// Portfolio endpoint 
const portfolio = {
  totalValue: 4306538.62,
  cryptoValue: 1515362.70,
  stablecoinValue: 214500.00,
  fiatValue: 627517.00,
  investmentValue: 1949158.92
};

// Individual investments from user-investments endpoint
const individualInvestments = [513150.68, 303698.63, 890990.76, 165871.35, 75447.50];
const sumIndividual = individualInvestments.reduce((a, b) => a + b, 0);

console.log('1. PORTFOLIO ALLOCATION ENDPOINT:');
console.log(`   Investment Value: $${portfolioAllocation.investment.toLocaleString()}`);
console.log(`   Total Value: $${portfolioAllocation.totalValue.toLocaleString()}`);

console.log('\n2. PORTFOLIO ENDPOINT:');
console.log(`   Investment Value: $${portfolio.investmentValue.toLocaleString()}`);
console.log(`   Total Value: $${portfolio.totalValue.toLocaleString()}`);

console.log('\n3. INDIVIDUAL INVESTMENTS:');
individualInvestments.forEach((val, i) => console.log(`   Investment ${i+1}: $${val.toLocaleString()}`));
console.log(`   Manual Sum: $${sumIndividual.toLocaleString()}`);

console.log('\n=== CONSISTENCY CHECK ===');
const diff1 = Math.abs(portfolioAllocation.investment - portfolio.investmentValue);
const diff2 = Math.abs(sumIndividual - portfolio.investmentValue);
const diff3 = Math.abs(portfolioAllocation.totalValue - portfolio.totalValue);

console.log(`Portfolio Allocation vs Portfolio Investment: $${diff1.toFixed(2)} ${diff1 < 1 ? '✅' : '❌'}`);
console.log(`Individual Sum vs Portfolio Investment: $${diff2.toFixed(2)} ${diff2 < 1 ? '✅' : '❌'}`);
console.log(`Portfolio Allocation vs Portfolio Total: $${diff3.toFixed(2)} ${diff3 < 1 ? '✅' : '❌'}`);

if (diff1 < 1 && diff2 < 1 && diff3 < 1) {
  console.log('\n🎉 ALL CALCULATIONS ARE CONSISTENT! 🎉');
} else {
  console.log('\n⚠️  INCONSISTENCIES FOUND - NEED TO FIX');
}