// CURRENT INVESTMENT VALUE CALCULATION ANALYSIS
console.log('=== CURRENT INVESTMENT VALUE CALCULATION ANALYSIS ===\n');

async function analyzeCurrentValueCalculation() {
  console.log('🔍 ANALYZING CURRENT INVESTMENT VALUE DISCREPANCY:');
  console.log('═'.repeat(60));
  
  try {
    // 1. Get User Investments (raw data)
    const investmentsResponse = await fetch('http://localhost:5000/api/user-investments');
    const investmentsData = await investmentsResponse.json();
    
    console.log('📋 USER INVESTMENTS RAW DATA:');
    let totalInvestedAmount = 0;
    investmentsData.forEach((investment, index) => {
      const invested = parseFloat(investment.investedAmount);
      totalInvestedAmount += invested;
      console.log(`  Investment ${index + 1}:`);
      console.log(`    Product ID: ${investment.productId}`);
      console.log(`    Invested Amount: $${invested.toLocaleString()}`);
      console.log(`    Investment Date: ${investment.investmentDate}`);
    });
    console.log(`\n  TOTAL INVESTED AMOUNT: $${totalInvestedAmount.toLocaleString()}`);
    
    // 2. Get Investment Performance API response
    const performanceResponse = await fetch('http://localhost:5000/api/investment-performance?timeframe=1Y');
    const performanceData = await performanceResponse.json();
    
    console.log('\n📊 INVESTMENT PERFORMANCE API RESPONSE:');
    console.log(`  Current Value: $${parseFloat(performanceData.currentValue).toLocaleString()}`);
    console.log(`  Total Return: $${parseFloat(performanceData.totalReturn).toLocaleString()}`);
    console.log(`  Return Percentage: ${performanceData.totalReturnPercent}%`);
    
    // 3. Analyze the discrepancy
    const apiCurrentValue = parseFloat(performanceData.currentValue);
    const apiTotalReturn = parseFloat(performanceData.totalReturn);
    const apiReturnPercent = parseFloat(performanceData.totalReturnPercent);
    
    console.log('\n🚨 DISCREPANCY ANALYSIS:');
    console.log('─'.repeat(40));
    console.log(`Total Invested (Sum of investments): $${totalInvestedAmount.toLocaleString()}`);
    console.log(`API Current Value: $${apiCurrentValue.toLocaleString()}`);
    console.log(`API Total Return: $${apiTotalReturn.toLocaleString()}`);
    console.log(`API Return %: ${apiReturnPercent}%`);
    
    // Calculate what current value should be based on total return
    const calculatedCurrentValue = totalInvestedAmount + apiTotalReturn;
    console.log(`\nCalculated Current Value (Invested + Return): $${calculatedCurrentValue.toLocaleString()}`);
    
    // Calculate what return percentage should be
    const calculatedReturnPercent = (apiTotalReturn / totalInvestedAmount) * 100;
    console.log(`Calculated Return % (Return / Invested): ${calculatedReturnPercent.toFixed(2)}%`);
    
    // Check for consistency
    const valueDifference = Math.abs(apiCurrentValue - calculatedCurrentValue);
    const percentDifference = Math.abs(apiReturnPercent - calculatedReturnPercent);
    
    console.log('\n❌ CONSISTENCY CHECKS:');
    console.log(`Value Consistency: ${valueDifference < 0.01 ? '✅ PASS' : '❌ FAIL'}`);
    if (valueDifference >= 0.01) {
      console.log(`  Difference: $${valueDifference.toLocaleString()}`);
    }
    console.log(`Percentage Consistency: ${percentDifference < 0.01 ? '✅ PASS' : '❌ FAIL'}`);
    if (percentDifference >= 0.01) {
      console.log(`  Difference: ${percentDifference.toFixed(2)}%`);
    }
    
    // 4. Check how the API calculates current value
    console.log('\n🔍 INVESTIGATING API CALCULATION METHOD:');
    console.log('Let me check what the Investment Performance API is actually doing...');
    
    // Simulate the calculation logic used in the API
    console.log('\n📈 EXPECTED CALCULATION LOGIC:');
    console.log('Current Value should be calculated as:');
    console.log('  Method 1: Sum of all invested amounts + growth over time');
    console.log('  Method 2: Each investment grown by time elapsed × IRR');
    console.log('  Method 3: Portfolio value based on current market performance');
    
    // Show what the correct calculation should be
    console.log('\n✅ CORRECT CALCULATION SHOULD BE:');
    console.log(`  Total Invested: $${totalInvestedAmount.toLocaleString()}`);
    console.log(`  Total Return: $${apiTotalReturn.toLocaleString()}`);
    console.log(`  Current Value: $${(totalInvestedAmount + apiTotalReturn).toLocaleString()}`);
    console.log(`  Return Percentage: ${((apiTotalReturn / totalInvestedAmount) * 100).toFixed(2)}%`);
    
    console.log('\n🎯 ISSUE IDENTIFIED:');
    if (Math.abs(apiCurrentValue - totalInvestedAmount - apiTotalReturn) > 0.01) {
      console.log('❌ The API Current Value does NOT equal Total Invested + Total Return');
      console.log('❌ This indicates the current value calculation is incorrect');
      console.log('🔧 REQUIRED FIX: Update API to use: Current Value = Total Invested + Total Return');
    } else {
      console.log('✅ Current Value calculation is correct');
    }
    
  } catch (error) {
    console.error('Error during analysis:', error.message);
  }
}

// Run the analysis
analyzeCurrentValueCalculation();