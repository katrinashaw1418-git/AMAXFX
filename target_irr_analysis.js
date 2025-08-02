// COMPLETE CALCULATION BREAKDOWN - CURRENT DATABASE VS TARGET IRR
console.log('=== INVESTMENT CALCULATION VERIFICATION ===\n');

console.log('DATABASE CURRENT VALUES:');
console.log('ID | Product Name                    | Invested    | Current     | Return      | Return%');
console.log('---|--------------------------------|-------------|-------------|-------------|--------');
console.log('37 | Bitcoin Tracker ($25k)         | $25,000     | $25,000     | $0          | 0.00%');
console.log('26 | Real Estate Credit Fund        | $500,000    | $518,082.19 | $18,082.19  | 3.62%');
console.log('27 | Corporate Credit Fund           | $300,000    | $308,136.99 | $8,136.99   | 2.71%');
console.log('29 | Bitcoin Tracker (Original)     | $150,000    | $158,136.99 | $8,136.99   | 5.42%');
console.log('28 | VC/Growth Equity Fund           | $750,000    | $832,500    | $82,500     | 11.00%');
console.log('30 | Ethereum Staking Fund           | $75,000     | $76,356.16  | $1,356.16   | 1.81%');
console.log('36 | Bitcoin Tracker ($50k)         | $50,000     | $50,000     | $0          | 0.00%');
console.log('---|--------------------------------|-------------|-------------|-------------|--------');
console.log('   | TOTALS                         | $1,850,000  | $1,968,212  | $118,212    | 6.39%');

console.log('\n=== DETAILED CALCULATION ANALYSIS ===\n');

// Investment details with exact dates and rates
const investments = [
  {
    id: 37,
    name: "Bitcoin Tracker ($25k)",
    principal: 25000,
    dbCurrent: 25000,
    dbReturn: 0,
    investmentDate: new Date('2025-08-02'),
    targetIRR: 0.15,
    category: "Digital Assets"
  },
  {
    id: 26,
    name: "Real Estate Credit Fund",
    principal: 500000,
    dbCurrent: 518082.19,
    dbReturn: 18082.19,
    investmentDate: new Date('2025-04-03'),
    targetIRR: 0.11,
    category: "Real Estate"
  },
  {
    id: 27,
    name: "Corporate Credit Fund",
    principal: 300000,
    dbCurrent: 308136.99,
    dbReturn: 8136.99,
    investmentDate: new Date('2025-05-03'),
    targetIRR: 0.11,
    category: "Corporate Credit"
  },
  {
    id: 29,
    name: "Bitcoin Tracker (Original)",
    principal: 150000,
    dbCurrent: 158136.99,
    dbReturn: 8136.99,
    investmentDate: new Date('2025-02-02'),
    targetIRR: 0.15,
    category: "Digital Assets"
  },
  {
    id: 28,
    name: "VC/Growth Equity Fund",
    principal: 750000,
    dbCurrent: 832500,
    dbReturn: 82500,
    investmentDate: new Date('2024-08-02'),
    targetIRR: 0.18,
    category: "Venture Capital"
  },
  {
    id: 30,
    name: "Ethereum Staking Fund",
    principal: 75000,
    dbCurrent: 76356.16,
    dbReturn: 1356.16,
    investmentDate: new Date('2025-06-02'),
    targetIRR: 0.0575,
    category: "Digital Assets"
  },
  {
    id: 36,
    name: "Bitcoin Tracker ($50k)",
    principal: 50000,
    dbCurrent: 50000,
    dbReturn: 0,
    investmentDate: new Date('2025-08-01'),
    targetIRR: 0.15,
    category: "Digital Assets"
  }
];

const currentDate = new Date('2025-08-02');
let totalPrincipal = 0;
let totalDBCurrent = 0;
let totalDBReturn = 0;
let totalCalculatedCurrent = 0;
let totalCalculatedReturn = 0;

console.log('INVESTMENT-BY-INVESTMENT DETAILED BREAKDOWN:\n');

investments.forEach((investment, index) => {
  const daysHeld = Math.max(0, Math.floor((currentDate.getTime() - investment.investmentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const timeInYears = daysHeld / 365.25;
  const growthFactor = Math.pow(1 + investment.targetIRR, timeInYears);
  const calculatedCurrent = investment.principal * growthFactor;
  const calculatedReturn = calculatedCurrent - investment.principal;
  const calculatedReturnPercent = (calculatedReturn / investment.principal) * 100;
  const dbReturnPercent = (investment.dbReturn / investment.principal) * 100;
  
  totalPrincipal += investment.principal;
  totalDBCurrent += investment.dbCurrent;
  totalDBReturn += investment.dbReturn;
  totalCalculatedCurrent += calculatedCurrent;
  totalCalculatedReturn += calculatedReturn;
  
  console.log(`${index + 1}. ${investment.name} (ID: ${investment.id})`);
  console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   📊 INVESTMENT DETAILS:`);
  console.log(`   • Category: ${investment.category}`);
  console.log(`   • Principal: $${investment.principal.toLocaleString()}`);
  console.log(`   • Investment Date: ${investment.investmentDate.toISOString().split('T')[0]}`);
  console.log(`   • Days Held: ${daysHeld} days`);
  console.log(`   • Time Held: ${timeInYears.toFixed(4)} years`);
  console.log(`   • Target IRR: ${(investment.targetIRR * 100).toFixed(2)}% annual`);
  console.log('');
  console.log(`   🧮 MIDPOINT IRR CALCULATION:`);
  console.log(`   • Formula: Current Value = Principal × (1 + IRR)^Time`);
  console.log(`   • Calculation: $${investment.principal.toLocaleString()} × (1 + ${investment.targetIRR})^${timeInYears.toFixed(4)}`);
  console.log(`   • Growth Factor: ${growthFactor.toFixed(6)}`);
  console.log(`   • Calculated Current: $${calculatedCurrent.toFixed(2)}`);
  console.log(`   • Calculated Return: $${calculatedReturn.toFixed(2)} (${calculatedReturnPercent.toFixed(2)}%)`);
  console.log('');
  console.log(`   💾 DATABASE VALUES:`);
  console.log(`   • Database Current: $${investment.dbCurrent.toFixed(2)}`);
  console.log(`   • Database Return: $${investment.dbReturn.toFixed(2)} (${dbReturnPercent.toFixed(2)}%)`);
  console.log('');
  console.log(`   📈 PERFORMANCE ANALYSIS:`);
  if (Math.abs(calculatedCurrent - investment.dbCurrent) < 1) {
    console.log(`   • ✅ Perfect Match: Database values align with midpoint IRR calculations`);
  } else if (investment.dbCurrent > calculatedCurrent) {
    console.log(`   • ⬆️  Database shows higher performance than midpoint IRR target`);
  } else {
    console.log(`   • ⬇️  Database shows lower performance than midpoint IRR target`);
  }
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('📊 OVERALL PORTFOLIO ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

console.log('💰 TOTALS COMPARISON:');
console.log(`• Total Principal Invested: $${totalPrincipal.toLocaleString()}`);
console.log(`• Database Current Value: $${totalDBCurrent.toFixed(2)}`);
console.log(`• Database Total Return: $${totalDBReturn.toFixed(2)} (${(totalDBReturn/totalPrincipal*100).toFixed(2)}%)`);
console.log(`• Calculated Current Value: $${totalCalculatedCurrent.toFixed(2)}`);
console.log(`• Calculated Total Return: $${totalCalculatedReturn.toFixed(2)} (${(totalCalculatedReturn/totalPrincipal*100).toFixed(2)}%)`);
console.log(`• Difference: $${(totalCalculatedReturn - totalDBReturn).toFixed(2)}`);

console.log('\n🏷️ BREAKDOWN BY CATEGORY:\n');

const categoryBreakdown = {};
investments.forEach(investment => {
  if (!categoryBreakdown[investment.category]) {
    categoryBreakdown[investment.category] = {
      count: 0,
      principal: 0,
      dbCurrent: 0,
      dbReturn: 0
    };
  }
  categoryBreakdown[investment.category].count += 1;
  categoryBreakdown[investment.category].principal += investment.principal;
  categoryBreakdown[investment.category].dbCurrent += investment.dbCurrent;
  categoryBreakdown[investment.category].dbReturn += investment.dbReturn;
});

Object.entries(categoryBreakdown).forEach(([category, data]) => {
  const returnPercent = (data.dbReturn / data.principal) * 100;
  const portfolioWeight = (data.principal / totalPrincipal) * 100;
  
  console.log(`${category}:`);
  console.log(`   • Investments: ${data.count}`);
  console.log(`   • Principal: $${data.principal.toLocaleString()}`);
  console.log(`   • Current Value: $${data.dbCurrent.toFixed(2)}`);
  console.log(`   • Total Return: $${data.dbReturn.toFixed(2)} (${returnPercent.toFixed(2)}%)`);
  console.log(`   • Portfolio Weight: ${portfolioWeight.toFixed(1)}%`);
  console.log('');
});

console.log('🚀 7-YEAR PROJECTION ANALYSIS:\n');

let total7YearValue = 0;
investments.forEach((investment, index) => {
  const daysHeld = Math.max(0, Math.floor((currentDate.getTime() - investment.investmentDate.getTime()) / (1000 * 60 * 60 * 24)));
  const timeInYears = daysHeld / 365.25;
  const currentGrowthFactor = Math.pow(1 + investment.targetIRR, timeInYears);
  const currentValue = investment.principal * currentGrowthFactor;
  
  const sevenYearGrowthFactor = Math.pow(1 + investment.targetIRR, 7);
  const sevenYearValue = currentValue * sevenYearGrowthFactor;
  const sevenYearGain = sevenYearValue - currentValue;
  const sevenYearGainPercent = (sevenYearGain / currentValue) * 100;
  
  total7YearValue += sevenYearValue;
  
  console.log(`${index + 1}. ${investment.name}`);
  console.log(`   • Current: $${currentValue.toFixed(2)}`);
  console.log(`   • 7-Year Factor: ${sevenYearGrowthFactor.toFixed(4)}`);
  console.log(`   • 7-Year Value: $${sevenYearValue.toFixed(2)}`);
  console.log(`   • 7-Year Gain: $${sevenYearGain.toFixed(2)} (${sevenYearGainPercent.toFixed(1)}%)`);
  console.log('');
});

const total7YearGain = total7YearValue - totalCalculatedCurrent;
const total7YearGainPercent = (total7YearGain / totalCalculatedCurrent) * 100;
const averageAnnualReturn = (Math.pow(total7YearValue / totalCalculatedCurrent, 1/7) - 1) * 100;

console.log('📈 7-YEAR PORTFOLIO PROJECTION:');
console.log(`• Current Portfolio: $${totalCalculatedCurrent.toFixed(2)}`);
console.log(`• 7-Year Projected: $${total7YearValue.toFixed(2)}`);
console.log(`• 7-Year Gain: $${total7YearGain.toFixed(2)} (${total7YearGainPercent.toFixed(1)}%)`);
console.log(`• Average Annual Return: ${averageAnnualReturn.toFixed(2)}%`);

console.log('\n✅ FINAL VERIFICATION:');
console.log(`• Portfolio shows $${totalPrincipal.toLocaleString()} invested`);
console.log(`• Database return: $${totalDBReturn.toFixed(2)} (${(totalDBReturn/totalPrincipal*100).toFixed(2)}%)`);
console.log(`• Midpoint IRR calculation: $${totalCalculatedReturn.toFixed(2)} (${(totalCalculatedReturn/totalPrincipal*100).toFixed(2)}%)`);
console.log(`• All 7 investments tracked with consistent methodology`);