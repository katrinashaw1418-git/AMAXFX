// API vs EXPECTED CALCULATION DISCREPANCY ANALYSIS
console.log('=== API CALCULATION DISCREPANCY ANALYSIS ===\n');

console.log('CRITICAL ISSUE IDENTIFIED:');
console.log('Expected Portfolio Return: $172,271.60 (9.31%)');
console.log('API Portfolio Return: $118,212.33 (6.39%)');
console.log('Missing Return: $54,059.27 (2.92% difference)');

console.log('\nTHE PROBLEM:');
console.log('✗ API is using old calculation methodology');
console.log('✗ Database has correct midpoint IRR values but API not reflecting them');
console.log('✗ Investment performance endpoint shows lower returns than database');

console.log('\nDATABASE VALUES (Correct):');
const dbValues = [
  { name: "Real Estate", invested: 500000, current: 518082.19, return: 18082.19 },
  { name: "Corporate Credit", invested: 300000, current: 308136.99, return: 8136.99 },
  { name: "VC/Growth", invested: 750000, current: 885000.00, return: 135000.00 },
  { name: "Bitcoin Original", invested: 150000, current: 161095.89, return: 11095.89 },
  { name: "Ethereum", invested: 75000, current: 75708.90, return: 708.90 },
  { name: "Bitcoin $50k", invested: 50000, current: 50020.55, return: 20.55 },
  { name: "Bitcoin $25k", invested: 25000, current: 25000.00, return: 0.00 }
];

let dbTotalInvested = 0;
let dbTotalReturn = 0;

dbValues.forEach(inv => {
  dbTotalInvested += inv.invested;
  dbTotalReturn += inv.return;
  console.log(`${inv.name}: $${inv.return.toLocaleString()} return`);
});

console.log(`\nDatabase Total Return: $${dbTotalReturn.toLocaleString()}`);
console.log(`Database Return %: ${(dbTotalReturn / dbTotalInvested * 100).toFixed(2)}%`);

console.log('\nAPI VALUES (Incorrect):');
console.log('API Total Return: $118,212.33');
console.log('API Return %: 6.39%');

console.log('\nROOT CAUSE:');
console.log('The investment-performance API endpoint is not using the updated database values');
console.log('It appears to be calculating from old/memory values instead of current database');

console.log('\nSOLUTION REQUIRED:');
console.log('1. Update investment-performance API to use database values directly');
console.log('2. Ensure API calculation matches database values exactly');
console.log('3. Verify real-time synchronization between database and API');

console.log('\nEXPECTED vs ACTUAL:');
console.log(`Expected: $${dbTotalReturn.toLocaleString()} (${(dbTotalReturn / dbTotalInvested * 100).toFixed(2)}%)`);
console.log(`API Shows: $118,212.33 (6.39%)`);
console.log(`Difference: $${(dbTotalReturn - 118212.33).toLocaleString()} missing`);

console.log('\nNEXT STEPS:');
console.log('Fix the investment-performance endpoint calculation logic');
console.log('Ensure it pulls from the same database source as user-investments');
console.log('Verify all 7 investments are included in performance calculations');