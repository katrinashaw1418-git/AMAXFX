// PORTFOLIO CALCULATION BREAKDOWN - FINAL FIX VERIFICATION
console.log('=== FINAL PORTFOLIO CALCULATION BREAKDOWN ===\n');

// Simulate API data we're seeing
const userInvestments = [
  { id: 28, productId: 4, investedAmount: "750000.00", productName: "Cash Flow-Based Corporate Credit Fund" },
  { id: 38, productId: 2, investedAmount: "25000.00", productName: "Real Estate Credit Fund" },
  { id: 39, productId: 3, investedAmount: "25000.00", productName: "Real Estate First Mortgage Fund" }, // NEW INVESTMENT
  { id: 37, productId: 2, investedAmount: "25000.00", productName: "Real Estate Credit Fund" },
  { id: 26, productId: 1, investedAmount: "500000.00", productName: "Real Estate Equity Fund" },
  { id: 27, productId: 3, investedAmount: "300000.00", productName: "Real Estate First Mortgage Fund" }, // EXISTING
  { id: 29, productId: 2, investedAmount: "150000.00", productName: "Real Estate Credit Fund" },
  { id: 30, productId: 5, investedAmount: "75000.00", productName: "Security-Backed Corporate Credit Fund" },
  { id: 36, productId: 2, investedAmount: "50000.00", productName: "Real Estate Credit Fund" }
];

console.log('✅ TOTAL INVESTMENTS DETECTED:', userInvestments.length);

// Group by product ID
const productGroups = {};
userInvestments.forEach(inv => {
  if (!productGroups[inv.productId]) {
    productGroups[inv.productId] = { investments: [], totalInvested: 0 };
  }
  productGroups[inv.productId].investments.push(inv);
  productGroups[inv.productId].totalInvested += parseFloat(inv.investedAmount);
});

console.log('\n📊 INVESTMENT BREAKDOWN BY PRODUCT:');
Object.entries(productGroups).forEach(([productId, data]) => {
  console.log(`Product ${productId}: ${data.investments.length} investments, $${data.totalInvested.toLocaleString()} total`);
  data.investments.forEach(inv => {
    console.log(`  - Investment ${inv.id}: $${parseFloat(inv.investedAmount).toLocaleString()}`);
  });
});

// Calculate totals
const totalInvested = userInvestments.reduce((sum, inv) => sum + parseFloat(inv.investedAmount), 0);
console.log('\n💰 TOTAL INVESTED:', `$${totalInvested.toLocaleString()}`);

console.log('\n🎯 REAL ESTATE FIRST MORTGAGE FUND (Product 3):');
if (productGroups[3]) {
  console.log(`• Total Investments: ${productGroups[3].investments.length}`);
  console.log(`• Total Amount: $${productGroups[3].totalInvested.toLocaleString()}`);
  console.log('• Investment Details:');
  productGroups[3].investments.forEach(inv => {
    const isNew = inv.id === 39;
    console.log(`  - ID ${inv.id}: $${parseFloat(inv.investedAmount).toLocaleString()} ${isNew ? '(NEW!)' : '(existing)'}`);
  });
} else {
  console.log('❌ NO PRODUCT 3 INVESTMENTS FOUND');
}

console.log('\n✅ DASHBOARD SHOULD DISPLAY:');
console.log('• Investment Breakdown by Product section');
console.log('• Real Estate First Mortgage Fund with combined total');
console.log('• Total Portfolio: $1,900,000 invested');
console.log('• Real-time calculations every 5 seconds');