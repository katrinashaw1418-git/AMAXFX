// Quick calculation to identify discrepancy
const values = [513150.68, 303698.63, 920856.41, 157334.06, 79539.03];
const sum = values.reduce((a, b) => a + b, 0);

console.log('Individual Investment Values:');
values.forEach((val, i) => console.log(`  ${i+1}: $${val.toLocaleString()}`));
console.log(`\nManual Sum: $${sum.toLocaleString()}`);
console.log(`Portfolio says: $1,974,578.81`);
console.log(`Portfolio allocation: $1,963,250.00`);
console.log(`\nDiscrepancy: $${(1974578.81 - sum).toFixed(2)}`);
console.log(`Between portfolio methods: $${(1974578.81 - 1963250.00).toFixed(2)}`);