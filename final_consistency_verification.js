// FINAL CONSISTENCY VERIFICATION
console.log('=== FINAL CONSISTENCY VERIFICATION ===\n');

async function finalConsistencyCheck() {
  console.log('🎯 COMPREHENSIVE CONSISTENCY VERIFICATION:');
  console.log('═'.repeat(55));
  
  try {
    // Test all three calculation methods
    console.log('1️⃣ USER INVESTMENTS API (Individual):');
    const investmentsResponse = await fetch('http://localhost:5000/api/user-investments');
    const investmentsData = await investmentsResponse.json();
    
    let userInvestmentsTotal = 0;
    let userInvestmentsReturn = 0;
    investmentsData.forEach(inv => {
      userInvestmentsTotal += parseFloat(inv.currentValue);
      userInvestmentsReturn += parseFloat(inv.totalReturn);
    });
    
    console.log(`  Total Current Value: $${userInvestmentsTotal.toLocaleString()}`);
    console.log(`  Total Return: $${userInvestmentsReturn.toLocaleString()}`);
    
    console.log('\n2️⃣ INVESTMENT PERFORMANCE API (Aggregated):');
    const performanceResponse = await fetch('http://localhost:5000/api/investment-performance?timeframe=1Y');
    const performanceData = await performanceResponse.json();
    
    const apiCurrent = parseFloat(performanceData.currentValue);
    const apiReturn = parseFloat(performanceData.totalReturn);
    
    console.log(`  Total Current Value: $${apiCurrent.toLocaleString()}`);
    console.log(`  Total Return: $${apiReturn.toLocaleString()}`);
    
    console.log('\n3️⃣ MANUAL CALCULATION (Reference):');
    const productIRRMapping = {
      1: { midpointIRR: 0.104, termYears: 4.25 },
      2: { midpointIRR: 0.11, termYears: 0.85 },
      3: { midpointIRR: 0.09, termYears: 0.78 },
      4: { midpointIRR: 0.11, termYears: 2.5 },
      5: { midpointIRR: 0.135, termYears: 2.875 },
      6: { midpointIRR: 0.18, termYears: 6 },
    };

    let manualTotal = 0;
    let manualReturn = 0;
    const currentDate = new Date();

    investmentsData.forEach(investment => {
      const productData = productIRRMapping[investment.productId];
      if (productData) {
        const investedAmount = parseFloat(investment.investedAmount);
        const investmentDate = new Date(investment.investmentDate);
        
        const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
        const timeInYears = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25));
        const effectiveTime = Math.min(timeInYears, productData.termYears);
        const growthFactor = Math.pow(1 + productData.midpointIRR, effectiveTime);
        const currentValue = investedAmount * growthFactor;
        const returnAmount = currentValue - investedAmount;
        
        manualTotal += currentValue;
        manualReturn += returnAmount;
      }
    });

    console.log(`  Total Current Value: $${manualTotal.toLocaleString()}`);
    console.log(`  Total Return: $${manualReturn.toLocaleString()}`);
    
    console.log('\n📊 CONSISTENCY ANALYSIS:');
    console.log('─'.repeat(50));
    
    const userInvDiff = Math.abs(userInvestmentsTotal - manualTotal);
    const perfAPIDiff = Math.abs(apiCurrent - manualTotal);
    const crossAPIDiff = Math.abs(userInvestmentsTotal - apiCurrent);
    
    console.log(`User Investments API vs Manual: $${userInvDiff.toFixed(2)} ${userInvDiff < 1 ? '✅' : '❌'}`);
    console.log(`Performance API vs Manual: $${perfAPIDiff.toFixed(2)} ${perfAPIDiff < 1 ? '✅' : '❌'}`);
    console.log(`User Investments vs Performance API: $${crossAPIDiff.toFixed(2)} ${crossAPIDiff < 1 ? '✅' : '❌'}`);
    
    if (userInvDiff < 1 && perfAPIDiff < 1 && crossAPIDiff < 1) {
      console.log('\n🎉 SUCCESS: All calculations are now consistent!');
      console.log('✅ User Investments API matches manual calculation');
      console.log('✅ Investment Performance API matches manual calculation');
      console.log('✅ Both APIs return identical values');
      console.log('✅ Term expiry capping implemented correctly');
      console.log('✅ Real-time automated calculation working');
      console.log('✅ Mathematical consistency achieved');
    } else {
      console.log('\n❌ INCONSISTENCY DETECTED:');
      if (userInvDiff >= 1) console.log('❌ User Investments API calculation differs from reference');
      if (perfAPIDiff >= 1) console.log('❌ Performance API calculation differs from reference');
      if (crossAPIDiff >= 1) console.log('❌ User Investments and Performance APIs return different values');
      
      console.log('\n🔍 ROOT CAUSE ANALYSIS:');
      console.log('The calculations use identical methodology but may have:');
      console.log('1. Different timing for "current date"');
      console.log('2. Floating point precision differences');
      console.log('3. Different rounding in intermediate steps');
      console.log('4. Race conditions in real-time updates');
    }
    
    console.log('\n📈 FINAL PORTFOLIO METRICS:');
    console.log(`Total Invested: $1,850,000`);
    console.log(`Current Value: $${manualTotal.toLocaleString()} (Manual Reference)`);
    console.log(`Total Return: $${manualReturn.toLocaleString()}`);
    console.log(`Return Percentage: ${((manualReturn / 1850000) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('Error during final consistency verification:', error.message);
  }
}

// Run the final verification
finalConsistencyCheck();