// COMPREHENSIVE TERM EXPIRY CONSISTENCY VERIFICATION
console.log('=== TERM EXPIRY CONSISTENCY VERIFICATION ===\n');

// Test all API endpoints to ensure consistent calculations
const endpoints = [
  'http://localhost:5000/api/investment-performance?timeframe=1Y',
  'http://localhost:5000/api/user-investments',
  'http://localhost:5000/api/portfolio'
];

async function testEndpointConsistency() {
  console.log('📡 TESTING API ENDPOINT CONSISTENCY:');
  console.log('═'.repeat(50));
  
  try {
    // Test investment performance endpoint
    const performanceResponse = await fetch('http://localhost:5000/api/investment-performance?timeframe=1Y');
    const performanceData = await performanceResponse.json();
    
    console.log('📊 Investment Performance API:');
    console.log(`Current Value: $${parseFloat(performanceData.currentValue).toLocaleString()}`);
    console.log(`Total Return: $${parseFloat(performanceData.totalReturn).toLocaleString()}`);
    console.log(`Return Percentage: ${performanceData.totalReturnPercent}%`);
    
    // Test user investments endpoint
    const investmentsResponse = await fetch('http://localhost:5000/api/user-investments');
    const investmentsData = await investmentsResponse.json();
    
    console.log('\n📋 User Investments API:');
    console.log(`Number of investments: ${investmentsData.length}`);
    
    let totalInvested = 0;
    let totalCurrentValue = 0;
    
    investmentsData.forEach(inv => {
      totalInvested += parseFloat(inv.investedAmount);
      totalCurrentValue += parseFloat(inv.currentValue);
    });
    
    console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
    console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
    console.log(`Total Return: $${(totalCurrentValue - totalInvested).toLocaleString()}`);
    console.log(`Return Percentage: ${((totalCurrentValue - totalInvested) / totalInvested * 100).toFixed(2)}%`);
    
    // Test portfolio endpoint
    const portfolioResponse = await fetch('http://localhost:5000/api/portfolio');
    const portfolioData = await portfolioResponse.json();
    
    console.log('\n💼 Portfolio API:');
    console.log(`Total Value: $${parseFloat(portfolioData.totalValue).toLocaleString()}`);
    console.log(`Investment Value: $${parseFloat(portfolioData.investmentValue).toLocaleString()}`);
    
    // Verify consistency
    console.log('\n🔍 CONSISTENCY CHECK:');
    console.log('═'.repeat(30));
    
    const investmentPerformanceValue = parseFloat(performanceData.currentValue);
    const userInvestmentsTotalValue = totalCurrentValue;
    const portfolioInvestmentValue = parseFloat(portfolioData.investmentValue);
    
    const isConsistent = Math.abs(investmentPerformanceValue - userInvestmentsTotalValue) < 1 &&
                        Math.abs(investmentPerformanceValue - portfolioInvestmentValue) < 1;
    
    if (isConsistent) {
      console.log('✅ ALL ENDPOINTS CONSISTENT!');
      console.log(`Common Value: $${investmentPerformanceValue.toLocaleString()}`);
    } else {
      console.log('❌ INCONSISTENCY DETECTED:');
      console.log(`Investment Performance: $${investmentPerformanceValue.toLocaleString()}`);
      console.log(`User Investments Total: $${userInvestmentsTotalValue.toLocaleString()}`);
      console.log(`Portfolio Investment: $${portfolioInvestmentValue.toLocaleString()}`);
    }
    
    // Calculate and verify term expiry projections
    console.log('\n🎯 TERM EXPIRY PROJECTION CALCULATIONS:');
    console.log('═'.repeat(45));
    
    const productTerms = {
      1: { name: 'Real Estate Equity Fund', termYears: 4.25, irr: 0.104 },
      2: { name: 'Real Estate Credit Fund', termYears: 0.85, irr: 0.11 },
      3: { name: 'Real Estate First Mortgage Fund', termYears: 0.78, irr: 0.09 },
      4: { name: 'Cash Flow-Based Corporate Credit Fund', termYears: 2.5, irr: 0.11 },
      5: { name: 'Security-Backed Corporate Credit Fund', termYears: 2.875, irr: 0.135 }
    };
    
    let totalTermExpiryValue = 0;
    
    investmentsData.forEach(inv => {
      const product = productTerms[inv.productId];
      if (product) {
        const investedAmount = parseFloat(inv.investedAmount);
        const termExpiryGrowthFactor = Math.pow(1 + product.irr, product.termYears);
        const termExpiryValue = investedAmount * termExpiryGrowthFactor;
        
        totalTermExpiryValue += termExpiryValue;
        
        console.log(`${product.name}:`);
        console.log(`  Invested: $${investedAmount.toLocaleString()}`);
        console.log(`  Term: ${product.termYears} years @ ${(product.irr * 100).toFixed(1)}%`);
        console.log(`  Value at Expiry: $${termExpiryValue.toFixed(2)}`);
        console.log('');
      }
    });
    
    const totalTermExpiryReturn = totalTermExpiryValue - totalInvested;
    const portfolioTermExpiryPercent = (totalTermExpiryReturn / totalInvested) * 100;
    
    console.log('📈 PORTFOLIO TERM EXPIRY SUMMARY:');
    console.log('─'.repeat(35));
    console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
    console.log(`Value at Term Expiry: $${totalTermExpiryValue.toLocaleString()}`);
    console.log(`Expected Return: $${totalTermExpiryReturn.toLocaleString()}`);
    console.log(`Portfolio Return: ${portfolioTermExpiryPercent.toFixed(2)}%`);
    
  } catch (error) {
    console.error('Error testing endpoints:', error.message);
  }
}

// Run the test
testEndpointConsistency();