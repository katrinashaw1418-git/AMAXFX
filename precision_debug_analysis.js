// PRECISION DEBUG ANALYSIS
console.log('=== PRECISION DEBUG ANALYSIS ===\n');

async function debugPrecisionIssues() {
  console.log('🔍 DEBUGGING PRECISION DISCREPANCIES:');
  console.log('═'.repeat(50));
  
  try {
    // Get the raw data
    const investmentsResponse = await fetch('http://localhost:5000/api/user-investments');
    const investmentsData = await investmentsResponse.json();
    
    console.log('🔬 DETAILED PRECISION COMPARISON PER INVESTMENT:');
    console.log('─'.repeat(70));
    
    const productIRRMapping = {
      1: { midpointIRR: 0.104, termYears: 4.25 },
      2: { midpointIRR: 0.11, termYears: 0.85 },
      3: { midpointIRR: 0.09, termYears: 0.78 },
      4: { midpointIRR: 0.11, termYears: 2.5 },
      5: { midpointIRR: 0.135, termYears: 2.875 },
      6: { midpointIRR: 0.18, termYears: 6 },
    };

    const currentDate = new Date();
    let totalDifference = 0;
    
    investmentsData.forEach((investment, index) => {
      const productData = productIRRMapping[investment.productId];
      if (productData) {
        const investedAmount = parseFloat(investment.investedAmount);
        const apiCurrentValue = parseFloat(investment.currentValue);
        const investmentDate = new Date(investment.investmentDate);
        
        // Manual calculation with exact same methodology as server
        const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
        const daysHeld = Math.max(0, Math.floor(timeElapsedMs / (1000 * 60 * 60 * 24)));
        const timeInYears = daysHeld / 365.25; // Exact same as server
        const effectiveTime = Math.min(timeInYears, productData.termYears);
        const growthFactor = Math.pow(1 + productData.midpointIRR, effectiveTime);
        const manualCurrentValue = investedAmount * growthFactor;
        
        const difference = Math.abs(apiCurrentValue - manualCurrentValue);
        totalDifference += difference;
        
        console.log(`Investment ${index + 1} (Product ${investment.productId}):`);
        console.log(`  Invested: $${investedAmount.toLocaleString()}`);
        console.log(`  Investment Date: ${investmentDate.toISOString()}`);
        console.log(`  Days Held: ${daysHeld}`);
        console.log(`  Time Elapsed: ${timeInYears.toFixed(6)} years`);
        console.log(`  Effective Time: ${effectiveTime.toFixed(6)} years`);
        console.log(`  IRR: ${(productData.midpointIRR * 100).toFixed(1)}%`);
        console.log(`  Growth Factor: ${growthFactor.toFixed(8)}`);
        console.log(`  API Current Value: $${apiCurrentValue.toFixed(2)}`);
        console.log(`  Manual Current Value: $${manualCurrentValue.toFixed(2)}`);
        console.log(`  Difference: $${difference.toFixed(6)} ${difference < 0.01 ? '✅' : '❌'}`);
        console.log('');
      }
    });
    
    console.log(`📊 TOTAL PRECISION ANALYSIS:`);
    console.log(`Total Cumulative Difference: $${totalDifference.toFixed(2)}`);
    
    if (totalDifference < 1) {
      console.log('✅ Precision is excellent (under $1 total difference)');
    } else if (totalDifference < 10) {
      console.log('⚠️ Precision is acceptable but could be improved');
    } else {
      console.log('❌ Precision needs improvement');
    }
    
    // Check if there's a systematic bias
    console.log('\n🔍 POTENTIAL CAUSES OF DISCREPANCY:');
    console.log('1. Rounding differences in intermediate calculations');
    console.log('2. Different precision in time calculation');
    console.log('3. Server using different date/time for "current" moment');
    console.log('4. Floating point precision differences');
    
    // Let's check the exact current time the server is using
    console.log('\n⏰ TIME SYNCHRONIZATION CHECK:');
    console.log(`Client current time: ${currentDate.toISOString()}`);
    console.log(`Client timestamp: ${currentDate.getTime()}`);
    
  } catch (error) {
    console.error('Error during precision analysis:', error.message);
  }
}

// Run the precision debug
debugPrecisionIssues();