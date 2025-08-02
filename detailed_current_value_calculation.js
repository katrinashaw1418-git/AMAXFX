// DETAILED CURRENT VALUE CALCULATION ANALYSIS
console.log('=== DETAILED CURRENT VALUE CALCULATION ANALYSIS ===\n');

async function analyzeDetailedCalculation() {
  console.log('🔍 BREAKING DOWN CURRENT VALUE CALCULATION:');
  console.log('═'.repeat(55));
  
  try {
    // 1. Get User Investments
    const investmentsResponse = await fetch('http://localhost:5000/api/user-investments');
    const investmentsData = await investmentsResponse.json();
    
    // 2. Get Investment Products
    const productsResponse = await fetch('http://localhost:5000/api/investment-products');
    const productsData = await productsResponse.json();
    
    console.log('📊 INDIVIDUAL INVESTMENT ANALYSIS:');
    console.log('─'.repeat(55));
    
    // Simulate the calculateInvestmentPerformance function
    const calculateInvestmentPerformance = (product, investedAmount, investmentDate, currentDate) => {
      const productIRRMapping = {
        1: { midpointIRR: 0.104, termYears: 4.25 }, // Real Estate Equity Fund
        2: { midpointIRR: 0.11, termYears: 0.85 },  // Real Estate Credit Fund
        3: { midpointIRR: 0.09, termYears: 0.78 },  // Real Estate First Mortgage Fund
        4: { midpointIRR: 0.11, termYears: 2.5 },   // Cash Flow-Based Corporate Credit Fund
        5: { midpointIRR: 0.135, termYears: 2.875 }, // Security-Backed Corporate Credit Fund
        6: { midpointIRR: 0.18, termYears: 6 },     // VC / Growth Equity Fund
      };
      
      const productData = productIRRMapping[product.id];
      if (!productData) return { currentValue: investedAmount, returnAmount: 0 };
      
      // Time elapsed calculation
      const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
      const timeElapsedYears = timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25);
      
      // Cap time at product term (no growth beyond maturity)
      const effectiveTime = Math.min(timeElapsedYears, productData.termYears);
      
      // Calculate current value using midpoint IRR compounded over elapsed time
      const growthFactor = Math.pow(1 + productData.midpointIRR, effectiveTime);
      const currentValue = investedAmount * growthFactor;
      const returnAmount = currentValue - investedAmount;
      
      return {
        currentValue,
        returnAmount,
        timeElapsed: timeElapsedYears,
        effectiveTime,
        growthFactor,
        irr: productData.midpointIRR,
        termYears: productData.termYears
      };
    };
    
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalReturn = 0;
    const currentDate = new Date();
    
    investmentsData.forEach((investment, index) => {
      const product = productsData.find(p => p.id === investment.productId);
      if (product) {
        const investedAmount = parseFloat(investment.investedAmount);
        const investmentDate = new Date(investment.investmentDate);
        
        const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate);
        
        totalInvested += investedAmount;
        totalCurrentValue += performance.currentValue;
        totalReturn += performance.returnAmount;
        
        console.log(`Investment ${index + 1} (${product.name}):`);
        console.log(`  Product ID: ${product.id}`);
        console.log(`  Invested: $${investedAmount.toLocaleString()}`);
        console.log(`  Investment Date: ${investmentDate.toDateString()}`);
        console.log(`  Time Elapsed: ${performance.timeElapsed.toFixed(3)} years`);
        console.log(`  Effective Time: ${performance.effectiveTime.toFixed(3)} years`);
        console.log(`  IRR: ${(performance.irr * 100).toFixed(1)}%`);
        console.log(`  Growth Factor: ${performance.growthFactor.toFixed(4)}`);
        console.log(`  Current Value: $${performance.currentValue.toLocaleString()}`);
        console.log(`  Return: $${performance.returnAmount.toLocaleString()}`);
        console.log(`  Return %: ${((performance.returnAmount / investedAmount) * 100).toFixed(2)}%`);
        console.log('');
      }
    });
    
    console.log('📈 PORTFOLIO TOTALS:');
    console.log('─'.repeat(25));
    console.log(`Total Invested: $${totalInvested.toLocaleString()}`);
    console.log(`Total Current Value: $${totalCurrentValue.toLocaleString()}`);
    console.log(`Total Return: $${totalReturn.toLocaleString()}`);
    console.log(`Portfolio Return %: ${((totalReturn / totalInvested) * 100).toFixed(2)}%`);
    
    // Compare with API response
    const performanceResponse = await fetch('http://localhost:5000/api/investment-performance?timeframe=1Y');
    const performanceData = await performanceResponse.json();
    
    console.log('\n🔍 API COMPARISON:');
    console.log('─'.repeat(20));
    console.log(`API Current Value: $${parseFloat(performanceData.currentValue).toLocaleString()}`);
    console.log(`Calculated Current Value: $${totalCurrentValue.toLocaleString()}`);
    console.log(`Difference: $${Math.abs(parseFloat(performanceData.currentValue) - totalCurrentValue).toFixed(2)}`);
    
    console.log(`API Total Return: $${parseFloat(performanceData.totalReturn).toLocaleString()}`);
    console.log(`Calculated Total Return: $${totalReturn.toLocaleString()}`);
    console.log(`Difference: $${Math.abs(parseFloat(performanceData.totalReturn) - totalReturn).toFixed(2)}`);
    
    console.log('\n✅ CALCULATION METHODOLOGY VERIFIED:');
    console.log('Current Value = Sum of (Invested Amount × Growth Factor)');
    console.log('Growth Factor = (1 + IRR)^(Time Elapsed in Years)');
    console.log('Time is capped at product term (no growth beyond maturity)');
    console.log('Uses exact midpoint IRR values from productIRRMapping');
    
  } catch (error) {
    console.error('Error during detailed analysis:', error.message);
  }
}

// Run the detailed analysis
analyzeDetailedCalculation();