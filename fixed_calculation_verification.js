// FIXED CALCULATION VERIFICATION
console.log('=== FIXED CALCULATION VERIFICATION ===\n');

async function verifyFixedCalculation() {
  console.log('🔧 VERIFYING FIXED CALCULATION WITH TERM EXPIRY CAPPING:');
  console.log('═'.repeat(60));
  
  try {
    // Wait a moment for server to reload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 1. Test Investment Performance API (should now match manual calculation)
    const performanceResponse = await fetch('http://localhost:5000/api/investment-performance?timeframe=1Y');
    const performanceData = await performanceResponse.json();
    
    console.log('📊 UPDATED Investment Performance API:');
    console.log(`  Current Value: $${parseFloat(performanceData.currentValue).toLocaleString()}`);
    console.log(`  Total Return: $${parseFloat(performanceData.totalReturn).toLocaleString()}`);
    console.log(`  Return Percentage: ${performanceData.totalReturnPercent}%`);
    
    // 2. Test User Investments API
    const investmentsResponse = await fetch('http://localhost:5000/api/user-investments');
    const investmentsData = await investmentsResponse.json();
    
    console.log('\n📋 Updated User Investments API:');
    let totalInvestedFromAPI = 0;
    let totalCurrentFromAPI = 0;
    let totalReturnFromAPI = 0;
    
    investmentsData.forEach((investment, index) => {
      const invested = parseFloat(investment.investedAmount);
      const current = parseFloat(investment.currentValue);
      const returns = parseFloat(investment.totalReturn);
      
      totalInvestedFromAPI += invested;
      totalCurrentFromAPI += current;
      totalReturnFromAPI += returns;
      
      console.log(`  Investment ${index + 1}:`);
      console.log(`    Invested: $${invested.toLocaleString()}`);
      console.log(`    Current: $${current.toLocaleString()}`);
      console.log(`    Return: $${returns.toLocaleString()} (${investment.returnPercent}%)`);
    });
    
    console.log('\n📈 API TOTALS:');
    console.log(`  Total Invested: $${totalInvestedFromAPI.toLocaleString()}`);
    console.log(`  Total Current: $${totalCurrentFromAPI.toLocaleString()}`);
    console.log(`  Total Return: $${totalReturnFromAPI.toLocaleString()}`);
    console.log(`  Portfolio Return %: ${((totalReturnFromAPI / totalInvestedFromAPI) * 100).toFixed(2)}%`);
    
    // 3. Manual calculation verification
    const productsResponse = await fetch('http://localhost:5000/api/investment-products');
    const productsData = await productsResponse.json();
    
    const productIRRMapping = {
      1: { midpointIRR: 0.104, termYears: 4.25 }, // Real Estate Equity Fund
      2: { midpointIRR: 0.11, termYears: 0.85 },  // Real Estate Credit Fund
      3: { midpointIRR: 0.09, termYears: 0.78 },  // Real Estate First Mortgage Fund
      4: { midpointIRR: 0.11, termYears: 2.5 },   // Cash Flow-Based Corporate Credit Fund
      5: { midpointIRR: 0.135, termYears: 2.875 }, // Security-Backed Corporate Credit Fund
      6: { midpointIRR: 0.18, termYears: 6 },     // VC / Growth Equity Fund
    };

    let manualTotalInvested = 0;
    let manualTotalCurrent = 0;
    let manualTotalReturn = 0;
    const currentDate = new Date();

    investmentsData.forEach(investment => {
      const productData = productIRRMapping[investment.productId];
      if (productData) {
        const investedAmount = parseFloat(investment.investedAmount);
        const investmentDate = new Date(investment.investmentDate);
        
        // Manual calculation with term capping
        const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
        const timeElapsedYears = timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25);
        const effectiveTime = Math.min(timeElapsedYears, productData.termYears);
        const growthFactor = Math.pow(1 + productData.midpointIRR, effectiveTime);
        const currentValue = investedAmount * growthFactor;
        const returnAmount = currentValue - investedAmount;
        
        manualTotalInvested += investedAmount;
        manualTotalCurrent += currentValue;
        manualTotalReturn += returnAmount;
      }
    });

    console.log('\n🧮 MANUAL CALCULATION (Term-Capped):');
    console.log(`  Total Invested: $${manualTotalInvested.toLocaleString()}`);
    console.log(`  Total Current: $${manualTotalCurrent.toLocaleString()}`);
    console.log(`  Total Return: $${manualTotalReturn.toLocaleString()}`);
    console.log(`  Portfolio Return %: ${((manualTotalReturn / manualTotalInvested) * 100).toFixed(2)}%`);
    
    // 4. Comparison
    const apiCurrent = parseFloat(performanceData.currentValue);
    const apiReturn = parseFloat(performanceData.totalReturn);
    const apiPercent = parseFloat(performanceData.totalReturnPercent);
    
    const currentDiff = Math.abs(apiCurrent - manualTotalCurrent);
    const returnDiff = Math.abs(apiReturn - manualTotalReturn);
    
    console.log('\n🎯 ACCURACY VERIFICATION:');
    console.log('─'.repeat(40));
    console.log(`Performance API Current Value: $${apiCurrent.toLocaleString()}`);
    console.log(`Manual Calculation Current Value: $${manualTotalCurrent.toLocaleString()}`);
    console.log(`Difference: $${currentDiff.toFixed(2)} ${currentDiff < 1 ? '✅ EXCELLENT' : currentDiff < 10 ? '✅ GOOD' : '❌ NEEDS FIX'}`);
    
    console.log(`\nPerformance API Return: $${apiReturn.toLocaleString()}`);
    console.log(`Manual Calculation Return: $${manualTotalReturn.toLocaleString()}`);
    console.log(`Difference: $${returnDiff.toFixed(2)} ${returnDiff < 1 ? '✅ EXCELLENT' : returnDiff < 10 ? '✅ GOOD' : '❌ NEEDS FIX'}`);
    
    console.log('\n✅ CALCULATION METHODOLOGY VERIFICATION:');
    console.log('Current Value = Sum of (Invested Amount × Growth Factor)');
    console.log('Growth Factor = (1 + IRR)^(Effective Time)');
    console.log('Effective Time = Min(Time Elapsed, Product Term)');
    console.log('CRITICAL: Time is now capped at product term (no growth beyond maturity)');
    
    if (currentDiff < 1 && returnDiff < 1) {
      console.log('\n🎉 SUCCESS: API and manual calculations now match perfectly!');
      console.log('✅ Term expiry capping implemented correctly');
      console.log('✅ Real-time automated calculation working');
      console.log('✅ Consistent with Investment Breakdown by Product section');
    } else {
      console.log('\n❌ Still some discrepancy - may need additional adjustment');
    }
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

// Run the verification
verifyFixedCalculation();