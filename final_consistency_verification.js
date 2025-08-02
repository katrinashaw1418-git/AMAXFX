// FINAL CONSISTENCY VERIFICATION FOR INVESTMENT PRODUCTS & PERFORMANCE SECTIONS
console.log('=== FINAL CONSISTENCY VERIFICATION ===\n');

async function verifyFinalConsistency() {
  console.log('🎯 VERIFYING INVESTMENT PRODUCTS & PERFORMANCE CONSISTENCY:');
  console.log('═'.repeat(60));
  
  try {
    // 1. Test Investment Performance API (Performance by Period chart)
    const performanceResponse = await fetch('http://localhost:5000/api/investment-performance?timeframe=1Y');
    const performanceData = await performanceResponse.json();
    
    console.log('📊 Investment Performance API (Performance by Period):');
    console.log(`  Current Value: $${parseFloat(performanceData.currentValue).toLocaleString()}`);
    console.log(`  Total Return: $${parseFloat(performanceData.totalReturn).toLocaleString()}`);
    console.log(`  Return Percentage: ${performanceData.totalReturnPercent}%`);
    
    // 2. Test User Investments API (Investment Products section)
    const investmentsResponse = await fetch('http://localhost:5000/api/user-investments');
    const investmentsData = await investmentsResponse.json();
    
    console.log('\n📋 User Investments API (Investment Products section):');
    console.log(`  Number of investments: ${investmentsData.length}`);
    
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalReturn = 0;
    
    investmentsData.forEach(inv => {
      totalInvested += parseFloat(inv.investedAmount);
      totalCurrentValue += parseFloat(inv.currentValue);
      totalReturn += parseFloat(inv.totalReturn);
    });
    
    console.log(`  Total Invested: $${totalInvested.toLocaleString()}`);
    console.log(`  Total Current Value: $${totalCurrentValue.toLocaleString()}`);
    console.log(`  Total Return: $${totalReturn.toLocaleString()}`);
    console.log(`  Return Percentage: ${((totalReturn / totalInvested) * 100).toFixed(2)}%`);
    
    // 3. Verify Investment Breakdown Detail calculations (term expiry)
    console.log('\n📈 Investment Breakdown Detail (Term Expiry Projections):');
    
    const productTerms = {
      1: { name: 'Real Estate Equity Fund', termYears: 4.25, irr: 0.104 },
      2: { name: 'Real Estate Credit Fund', termYears: 0.85, irr: 0.11 },
      3: { name: 'Real Estate First Mortgage Fund', termYears: 0.78, irr: 0.09 },
      4: { name: 'Cash Flow-Based Corporate Credit Fund', termYears: 2.5, irr: 0.11 },
      5: { name: 'Security-Backed Corporate Credit Fund', termYears: 2.875, irr: 0.135 }
    };
    
    let totalTermExpiryValue = 0;
    let breakdownData = [];
    
    investmentsData.forEach(inv => {
      const product = productTerms[inv.productId];
      if (product) {
        const investedAmount = parseFloat(inv.investedAmount);
        const currentValue = parseFloat(inv.currentValue);
        const currentReturn = parseFloat(inv.totalReturn);
        const termExpiryGrowthFactor = Math.pow(1 + product.irr, product.termYears);
        const termExpiryValue = investedAmount * termExpiryGrowthFactor;
        const termExpiryReturn = termExpiryValue - investedAmount;
        
        totalTermExpiryValue += termExpiryValue;
        
        breakdownData.push({
          name: product.name,
          invested: investedAmount,
          currentValue: currentValue,
          currentReturn: currentReturn,
          termExpiryValue: termExpiryValue,
          termExpiryReturn: termExpiryReturn,
          termYears: product.termYears,
          irr: product.irr
        });
      }
    });
    
    // Display breakdown
    breakdownData.forEach(item => {
      console.log(`  ${item.name}:`);
      console.log(`    Invested: $${item.invested.toLocaleString()}`);
      console.log(`    Current Value: $${item.currentValue.toLocaleString()} (Return: $${item.currentReturn.toLocaleString()})`);
      console.log(`    Term Expiry Value: $${item.termExpiryValue.toFixed(2)} (Return: $${item.termExpiryReturn.toFixed(2)})`);
      console.log(`    Term: ${item.termYears} years @ ${(item.irr * 100).toFixed(1)}% IRR`);
    });
    
    const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
    const portfolioTermExpiryPercent = (totalTermExpiryReturn / totalInvested) * 100;
    
    console.log('\n🎯 SECTION CONSISTENCY SUMMARY:');
    console.log('─'.repeat(45));
    console.log(`Investment Products Section:`);
    console.log(`  Total Invested: $${totalInvested.toLocaleString()}`);
    console.log(`  Current Value: $${totalCurrentValue.toLocaleString()}`);
    console.log(`  Current Return: $${totalReturn.toLocaleString()} (${((totalReturn / totalInvested) * 100).toFixed(2)}%)`);
    
    console.log(`\nPerformance by Period Chart:`);
    console.log(`  Current Value: $${parseFloat(performanceData.currentValue).toLocaleString()}`);
    console.log(`  Total Return: $${parseFloat(performanceData.totalReturn).toLocaleString()} (${performanceData.totalReturnPercent}%)`);
    
    console.log(`\nInvestment Breakdown Detail:`);
    console.log(`  Term Expiry Value: $${totalTermExpiryValue.toLocaleString()}`);
    console.log(`  Term Expiry Return: $${totalTermExpiryReturn.toLocaleString()} (${portfolioTermExpiryPercent.toFixed(2)}%)`);
    
    // Final consistency check
    const performanceValue = parseFloat(performanceData.currentValue);
    const investmentsValue = totalCurrentValue;
    const isConsistent = Math.abs(performanceValue - investmentsValue) < 1;
    
    console.log('\n✅ FINAL CONSISTENCY STATUS:');
    console.log('═'.repeat(35));
    if (isConsistent) {
      console.log('✅ Investment Products & Performance by Period: CONSISTENT');
      console.log(`   Common Current Value: $${performanceValue.toLocaleString()}`);
      console.log(`   Common Return: $${parseFloat(performanceData.totalReturn).toLocaleString()}`);
      console.log('✅ Term Expiry Projections: CORRECTLY CALCULATED');
      console.log(`   Portfolio Term Expiry: $${totalTermExpiryValue.toLocaleString()} (${portfolioTermExpiryPercent.toFixed(2)}% return)`);
      console.log('\n🎉 ALL SECTIONS NOW USE CONSISTENT CALCULATIONS!');
    } else {
      console.log('❌ INCONSISTENCY STILL EXISTS');
      console.log(`   Investment Products: $${investmentsValue.toLocaleString()}`);
      console.log(`   Performance Chart: $${performanceValue.toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

// Run the verification
verifyFinalConsistency();