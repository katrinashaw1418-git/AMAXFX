// PROJECTION ANALYSIS - Current vs Future Performance
console.log('=== PROJECTION ANALYSIS ===');

// Current status
const currentStatus = {
  date: "2025-08-01",
  invested: 1800000,
  currentValue: 1983367,
  totalReturn: 183367,
  returnPercent: 10.19
};

// Key projection milestones from API
const projections = [
  { date: "2025-11-01", value: 2049096, totalReturn: 65729, returnPercent: 3.31 },
  { date: "2026-08-01", value: 2259645, totalReturn: 276277, returnPercent: 13.93 },
  { date: "2027-08-01", value: 2574406, totalReturn: 591039, returnPercent: 29.80 },
  { date: "2028-08-01", value: 2933014, totalReturn: 949646, returnPercent: 47.88 },
  { date: "2029-08-01", value: 3341574, totalReturn: 1358206, returnPercent: 68.48 },
  { date: "2030-08-01", value: 3807045, totalReturn: 1823678, returnPercent: 91.95 },
  { date: "2032-08-01", value: 4941536, totalReturn: 2958168, returnPercent: 149.15 }
];

console.log('CURRENT PERFORMANCE:');
console.log(`Date: ${currentStatus.date}`);
console.log(`Invested: $${currentStatus.invested.toLocaleString()}`);
console.log(`Current Value: $${currentStatus.currentValue.toLocaleString()}`);
console.log(`Total Return: $${currentStatus.totalReturn.toLocaleString()} (${currentStatus.returnPercent}%)`);

console.log('\n=== FUTURE PROJECTIONS ===');
projections.forEach((proj, i) => {
  const yearsFromNow = i === 0 ? 0.25 : Math.ceil((i + 1) / 2) + 0.5;
  const annualGrowthRate = proj.returnPercent > currentStatus.returnPercent 
    ? ((proj.returnPercent / currentStatus.returnPercent) ** (1/yearsFromNow) - 1) * 100 
    : 0;
  
  console.log(`\n${proj.date} (+${yearsFromNow} years):`);
  console.log(`  Portfolio Value: $${proj.value.toLocaleString()}`);
  console.log(`  Total Return: $${proj.totalReturn.toLocaleString()} (${proj.returnPercent}%)`);
  console.log(`  Growth from current: $${(proj.value - currentStatus.currentValue).toLocaleString()}`);
  console.log(`  Implied annual growth: ${annualGrowthRate.toFixed(1)}%`);
});

// Verify projections are increasing
console.log('\n=== PROJECTION VERIFICATION ===');
let allIncreasing = true;
for (let i = 1; i < projections.length; i++) {
  const current = projections[i];
  const previous = projections[i-1];
  const isIncreasing = current.value > previous.value && current.totalReturn > previous.totalReturn;
  
  if (!isIncreasing) {
    allIncreasing = false;
    console.log(`❌ ${current.date}: Value decreased from ${previous.value} to ${current.value}`);
  }
}

if (allIncreasing) {
  console.log('✅ ALL PROJECTIONS ARE INCREASING CORRECTLY');
  console.log(`✅ Portfolio grows from $${currentStatus.currentValue.toLocaleString()} to $${projections[projections.length-1].value.toLocaleString()}`);
  console.log(`✅ Return grows from ${currentStatus.returnPercent}% to ${projections[projections.length-1].returnPercent}%`);
} else {
  console.log('❌ PROJECTION ISSUES FOUND');
}