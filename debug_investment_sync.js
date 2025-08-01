// DEBUG: Investment Data Synchronization Issue
console.log('=== INVESTMENT DATA SYNCHRONIZATION DEBUG ===\n');

// Database shows 7 investments, API returns 5 - there's a sync issue
console.log('DATABASE INVESTMENTS (from SQL query):');
console.log('ID 28: VC Fund - $750,000 (2024-08-01)');
console.log('ID 29: Bitcoin Fund - $150,000 (2025-02-02)');
console.log('ID 26: Real Estate - $500,000 (2025-04-03)');
console.log('ID 27: Corporate Credit - $300,000 (2025-05-03)');
console.log('ID 30: Ethereum - $75,000 (2025-06-02)');
console.log('ID 31: Bitcoin Fund (NEW 1) - $50,000 (2025-08-01)');
console.log('ID 32: Bitcoin Fund (NEW 2) - $25,000 (2025-08-01)');
console.log('TOTAL: 7 investments');
console.log('');

console.log('API RETURNS:');
console.log('Only 5 investments visible in /api/user-investments');
console.log('Missing: The 2 new Bitcoin investments (IDs 31, 32)');
console.log('');

console.log('ROOT CAUSE:');
console.log('• Database has all 7 investments correctly stored');
console.log('• API layer is not returning the latest investments');
console.log('• This causes calculation inconsistencies');
console.log('');

console.log('EXPECTED BEHAVIOR:');
console.log('1. API should return all 7 active investments');
console.log('2. Total invested should be: $1,850,000 (not $1,775,000)');
console.log('3. Bitcoin allocation should include all 3 Bitcoin investments');
console.log('4. Portfolio percentage should reflect the actual total');
console.log('');

console.log('IMPACT:');
console.log('• Investment Products display shows incomplete data');
console.log('• Performance by Period chart uses outdated calculations');
console.log('• User sees inconsistent portfolio values');
console.log('• Real-time tracking not functioning properly');

// Calculate what the corrected values should be
const correctInvestments = [
  { name: "Real Estate", invested: 500000, rate: 0.11, days: 120 },
  { name: "Corporate Credit", invested: 300000, rate: 0.11, days: 90 },
  { name: "VC Fund", invested: 750000, rate: 0.18, days: 365 },
  { name: "Bitcoin (Original)", invested: 150000, rate: 0.60, days: 180 },
  { name: "Ethereum", invested: 75000, rate: 0.0575, days: 60 },
  { name: "Bitcoin (New 1)", invested: 50000, rate: 0.60, days: 0 },  // Today
  { name: "Bitcoin (New 2)", invested: 25000, rate: 0.60, days: 0 }   // Today
];

let totalInvested = 0;
let totalReturn = 0;
correctInvestments.forEach(inv => {
  const timeProgress = inv.days / 365;
  const performanceFactor = Math.max(0.5, 1 + (inv.rate * timeProgress));
  const currentValue = inv.invested * performanceFactor;
  const returnAmount = currentValue - inv.invested;
  
  totalInvested += inv.invested;
  totalReturn += returnAmount;
});

console.log('');
console.log('CORRECTED CALCULATIONS:');
console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
console.log(`Total Return: $${totalReturn.toLocaleString()}`);
console.log(`Portfolio Return: ${((totalReturn / totalInvested) * 100).toFixed(2)}%`);
console.log('');
console.log('CURRENT API VALUES (INCORRECT):');
console.log('Total Invested: $1,775,000 (missing $75,000)');
console.log('Total Return: $189,109.51');
console.log('Portfolio Return: 10.65%');
console.log('');
console.log('NEXT STEPS:');
console.log('1. Fix API to return all active investments');
console.log('2. Update calculations to include all investments');
console.log('3. Verify real-time updates work with complete data');
console.log('4. Test investment tracking with all 7 investments');