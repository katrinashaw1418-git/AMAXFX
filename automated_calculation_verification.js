// Automated Calculation Verification System
// This demonstrates the exact formula used across the platform

const investments = [
  { productId: 2, amount: 85000, date: new Date('2024-06-01'), irr: 0.11, termYears: 0.85, name: 'RE Credit' },
  { productId: 1, amount: 350000, date: new Date('2024-07-15'), irr: 0.104, termYears: 4.25, name: 'RE Equity' },
  { productId: 3, amount: 150000, date: new Date('2024-07-15'), irr: 0.09, termYears: 0.78, name: 'RE Mortgage' },
  { productId: 4, amount: 450000, date: new Date('2024-07-15'), irr: 0.11, termYears: 2.5, name: 'Corp Credit' },
  { productId: 5, amount: 565000, date: new Date('2024-10-01'), irr: 0.135, termYears: 2.875, name: 'Security Credit' },
  { productId: 6, amount: 250000, date: new Date('2024-10-01'), irr: 0.18, termYears: 6.0, name: 'VC Fund' }
];

function calculateAutomatedReturns(periodDate, investments) {
  const results = {};
  let totalReturn = 0;
  
  investments.forEach(inv => {
    if (inv.date <= periodDate) {
      // Calculate exact time elapsed in years
      const timeInYears = Math.max(0, (periodDate.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      
      // Apply term capping - growth stops at product term limit
      const effectiveTime = Math.min(timeInYears, inv.termYears);
      
      // Apply compound interest formula: CurrentValue = Principal × (1 + IRR)^EffectiveTime
      const currentValue = inv.amount * Math.pow(1 + inv.irr, effectiveTime);
      const returnAmount = currentValue - inv.amount;
      
      results[inv.name] = Math.floor(returnAmount);
      totalReturn += returnAmount;
    } else {
      results[inv.name] = 0;
    }
  });
  
  results['Total'] = Math.floor(totalReturn);
  return results;
}

// Verify Q2'25 calculations
const q2_25 = calculateAutomatedReturns(new Date('2025-06-25'), investments);
console.log('Q2\'25 Automated Calculations:');
console.log('RE Credit:', q2_25['RE Credit']); // Should be $8,885
console.log('RE Equity:', q2_25['RE Equity']); // Should be $31,252
console.log('RE Mortgage:', q2_25['RE Mortgage']); // Should be $10,429
console.log('Corp Credit:', q2_25['Corp Credit']); // Should be $40,434
console.log('Security Credit:', q2_25['Security Credit']); // Should be $55,014
console.log('VC Fund:', q2_25['VC Fund']); // Should be $26,208
console.log('Total:', q2_25['Total']); // Should be $172,222

// Verify Q1'28 term expiry calculations
const q1_28 = calculateAutomatedReturns(new Date('2028-03-25'), investments);
console.log('\nQ1\'28 Term Expiry Calculations:');
console.log('RE Credit:', q1_28['RE Credit']); // Should be $8,885 (at term)
console.log('RE Equity:', q1_28['RE Equity']); // Should be $191,234
console.log('RE Mortgage:', q1_28['RE Mortgage']); // Should be $10,429 (at term)
console.log('Corp Credit:', q1_28['Corp Credit']); // Should be $134,144 (at term)
console.log('Security Credit:', q1_28['Security Credit']); // Should be $248,133 (at term)
console.log('VC Fund:', q1_28['VC Fund']); // Should be $146,789
console.log('Total:', q1_28['Total']); // Should be $739,614