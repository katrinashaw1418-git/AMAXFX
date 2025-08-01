// Test new database calculation vs unified function
const investmentData = [
  { id: 7, productId: 2, invested: 150000, investmentDate: '2024-02-15', product: 'Bitcoin Tracker Fund', category: 'digital_assets' },
  { id: 8, productId: 1, invested: 300000, investmentDate: '2024-01-20', product: 'Real Estate Equity Fund', category: 'real_estate' },
  { id: 9, productId: 4, invested: 750000, investmentDate: '2023-12-10', product: 'Web3 Innovation Fund', category: 'digital_assets' },
  { id: 10, productId: 5, invested: 175000, investmentDate: '2024-03-05', product: 'Ethereum Staking Fund', category: 'digital_assets' },
  { id: 11, productId: 3, invested: 400000, investmentDate: '2024-04-18', product: 'Corporate Credit Fund', category: 'corporate_credit' }
];

// Calculate using the same logic as the unified function
const currentDate = new Date();
let totalInvested = 0;
let totalCurrentValue = 0;

for (const inv of investmentData) {
  const investmentDate = new Date(inv.investmentDate);
  const daysSinceInvestment = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  const investedAmount = inv.invested;
  let performanceFactor = 1;
  
  if (daysSinceInvestment >= 0) {
    const timeProgress = Math.max(daysSinceInvestment / 365, 1/365);
    let annualReturn = 0;
    
    switch (inv.category) {
      case 'digital_assets':
        annualReturn = 0.15;
        const volatility = 0.4;
        const baseReturn = annualReturn * timeProgress;
        const seed = investmentDate.getTime() + daysSinceInvestment;
        const volatilityAdjustment = (Math.sin(seed * 0.001) * volatility * 0.1);
        performanceFactor = 1 + baseReturn + volatilityAdjustment;
        break;
      case 'real_estate':
        annualReturn = 0.08;
        performanceFactor = 1 + (annualReturn * timeProgress);
        break;
      case 'corporate_credit':
        annualReturn = 0.05;
        performanceFactor = 1 + (annualReturn * timeProgress);
        break;
    }
  }
  
  performanceFactor = Math.max(0.5, performanceFactor);
  const currentValue = investedAmount * performanceFactor;
  
  totalInvested += investedAmount;
  totalCurrentValue += currentValue;
  
  console.log(`${inv.product}: $${investedAmount.toLocaleString()} → $${currentValue.toLocaleString()} (${daysSinceInvestment} days, ${((currentValue/investedAmount - 1) * 100).toFixed(2)}%)`);
}

const totalReturn = totalCurrentValue - totalInvested;
const returnPercent = (totalReturn / totalInvested) * 100;

console.log('\n=== UNIFIED CALCULATION RESULTS ===');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Current: $${totalCurrentValue.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Return Percent: ${returnPercent.toFixed(2)}%`);