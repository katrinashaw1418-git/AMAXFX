// PORTFOLIO CALCULATION BREAKDOWN - EXACT TERM EXPIRY ANALYSIS
console.log('=== PORTFOLIO CALCULATION BREAKDOWN - TERM EXPIRY ANALYSIS ===\n');

console.log('📊 INVESTMENT PORTFOLIO COMPOSITION ($1,875,000 Total Invested):');
console.log('• Real Estate Equity Fund: $500,000');
console.log('• Bitcoin Tracker Fund: $250,000 (includes new $25,000)');
console.log('• Corporate Credit Fund: $300,000'); 
console.log('• Web3 Innovation Fund: $750,000');
console.log('• Ethereum Staking Fund: $75,000');
console.log('');

console.log('🎯 IRR VALUES FROM FILTER PRODUCTS (Strategy Descriptions):');
console.log('• Real Estate Equity: 8.5% (structured equity, downside protection)');
console.log('• Bitcoin Tracker: 60% (market-based historical returns)');
console.log('• Corporate Credit: 11% (midpoint IRR targeting)');
console.log('• Web3 Innovation: 18% (midpoint IRR targeting)');
console.log('• Ethereum Staking: 5.75% (midpoint IRR targeting)');
console.log('');

console.log('⏰ TERM LIMITS (Years):');
console.log('• Real Estate Equity: 2.0 years');
console.log('• Bitcoin Tracker: 1.0 year');
console.log('• Corporate Credit: 1.5 years');
console.log('• Web3 Innovation: 4.0 years');
console.log('• Ethereum Staking: 2.0 years');
console.log('');

console.log('🧮 TERM EXPIRY CALCULATIONS:');
console.log('Formula: Principal × (1 + IRR)^TermYears');
console.log('');

// Real Estate Equity Fund
const realestate_principal = 500000;
const realestate_irr = 0.085;
const realestate_term = 2.0;
const realestate_value = realestate_principal * Math.pow(1 + realestate_irr, realestate_term);
const realestate_return = realestate_value - realestate_principal;
console.log(`1. Real Estate Equity Fund:`);
console.log(`   $500,000 × (1.085)^2.0 = $500,000 × 1.177225 = $${Math.floor(realestate_value).toLocaleString()}`);
console.log(`   Return: +$${Math.floor(realestate_return).toLocaleString()}`);
console.log('');

// Bitcoin Tracker Fund
const bitcoin_principal = 250000;
const bitcoin_irr = 0.60;
const bitcoin_term = 1.0;
const bitcoin_value = bitcoin_principal * Math.pow(1 + bitcoin_irr, bitcoin_term);
const bitcoin_return = bitcoin_value - bitcoin_principal;
console.log(`2. Bitcoin Tracker Fund:`);
console.log(`   $250,000 × (1.60)^1.0 = $250,000 × 1.60 = $${Math.floor(bitcoin_value).toLocaleString()}`);
console.log(`   Return: +$${Math.floor(bitcoin_return).toLocaleString()}`);
console.log('');

// Corporate Credit Fund
const corp_principal = 300000;
const corp_irr = 0.11;
const corp_term = 1.5;
const corp_value = corp_principal * Math.pow(1 + corp_irr, corp_term);
const corp_return = corp_value - corp_principal;
console.log(`3. Corporate Credit Fund:`);
console.log(`   $300,000 × (1.11)^1.5 = $300,000 × 1.1698 = $${Math.floor(corp_value).toLocaleString()}`);
console.log(`   Return: +$${Math.floor(corp_return).toLocaleString()}`);
console.log('');

// Web3 Innovation Fund
const web3_principal = 750000;
const web3_irr = 0.18;
const web3_term = 4.0;
const web3_value = web3_principal * Math.pow(1 + web3_irr, web3_term);
const web3_return = web3_value - web3_principal;
console.log(`4. Web3 Innovation Fund:`);
console.log(`   $750,000 × (1.18)^4.0 = $750,000 × 1.9388 = $${Math.floor(web3_value).toLocaleString()}`);
console.log(`   Return: +$${Math.floor(web3_return).toLocaleString()}`);
console.log('');

// Ethereum Staking Fund
const eth_principal = 75000;
const eth_irr = 0.0575;
const eth_term = 2.0;
const eth_value = eth_principal * Math.pow(1 + eth_irr, eth_term);
const eth_return = eth_value - eth_principal;
console.log(`5. Ethereum Staking Fund:`);
console.log(`   $75,000 × (1.0575)^2.0 = $75,000 × 1.1183 = $${Math.floor(eth_value).toLocaleString()}`);
console.log(`   Return: +$${Math.floor(eth_return).toLocaleString()}`);
console.log('');

// Portfolio Totals
const total_invested = realestate_principal + bitcoin_principal + corp_principal + web3_principal + eth_principal;
const total_value = Math.floor(realestate_value) + Math.floor(bitcoin_value) + Math.floor(corp_value) + Math.floor(web3_value) + Math.floor(eth_value);
const total_return = total_value - total_invested;
const total_percent = (total_return / total_invested) * 100;

console.log('💰 PORTFOLIO TOTALS:');
console.log(`Total Invested: $${total_invested.toLocaleString()}`);
console.log(`Term Expiry Value: $${total_value.toLocaleString()}`);
console.log(`Total Return: +$${total_return.toLocaleString()} (${total_percent.toFixed(1)}%)`);
console.log('');

console.log('🔍 VERIFICATION:');
console.log(`Expected: +$1,002,404 (53.5%)`);
console.log(`Calculated: +$${total_return.toLocaleString()} (${total_percent.toFixed(1)}%)`);
console.log(`Match: ${Math.abs(total_return - 1002404) < 1000 ? '✅ YES' : '❌ NO'}`);
console.log('');

console.log('📈 BIGGEST CONTRIBUTORS:');
console.log(`1. Web3 Innovation Fund: +$${Math.floor(web3_return).toLocaleString()} (${((web3_return/total_return)*100).toFixed(1)}% of total return)`);
console.log(`2. Bitcoin Tracker Fund: +$${Math.floor(bitcoin_return).toLocaleString()} (${((bitcoin_return/total_return)*100).toFixed(1)}% of total return)`);
console.log(`3. Real Estate Equity Fund: +$${Math.floor(realestate_return).toLocaleString()} (${((realestate_return/total_return)*100).toFixed(1)}% of total return)`);
console.log(`4. Corporate Credit Fund: +$${Math.floor(corp_return).toLocaleString()} (${((corp_return/total_return)*100).toFixed(1)}% of total return)`);
console.log(`5. Ethereum Staking Fund: +$${Math.floor(eth_return).toLocaleString()} (${((eth_return/total_return)*100).toFixed(1)}% of total return)`);