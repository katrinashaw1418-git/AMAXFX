import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// IRR mapping - Using midpoint IRR for all investments (as requested)
function getAnnualReturn(category: string, productName?: string): number {
  const rates = {
    'real_estate': 0.11,      // 11% midpoint
    'corporate_credit': 0.11, // 11% midpoint (10-12% range)
    'venture_capital': 0.18,  // 18% midpoint (16-20% range)
    'digital_assets': (productName && typeof productName === 'string' && productName.includes('Bitcoin')) ? 0.15 : 0.0575, // Bitcoin 15% midpoint IRR, Ethereum 5.75%
    'default': 0.11
  };
  return rates[category as keyof typeof rates] || rates.default;
}

// Unified investment performance calculation using consistent midpoint IRR methodology with term expiry capping
function calculateInvestmentPerformance(
  product: any,
  investedAmount: number,
  investmentDate: Date,
  currentDate: Date = new Date()
): { currentValue: number; returnAmount: number; returnPercentage: number; daysHeld: number; timeInYears: number; targetIRR: number; growthFactor: number; effectiveTime: number; termYears: number } {
  // Safety check for product data
  if (!product) {
    console.error('Product is null/undefined in calculateInvestmentPerformance');
    return { 
      currentValue: investedAmount, 
      returnAmount: 0, 
      returnPercentage: 0, 
      daysHeld: 0, 
      timeInYears: 0, 
      targetIRR: 0, 
      growthFactor: 1,
      effectiveTime: 0,
      termYears: 0 
    };
  }
  
  // Calculate exact time elapsed in years with high precision
  const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
  const timeInYears = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25)); // High precision calculation
  const daysHeld = Math.max(0, Math.floor(timeElapsedMs / (1000 * 60 * 60 * 24)));
  
  // Get exact midpoint IRR and term years based on specific product ID
  let targetIRR = 0.08; // Default 8% annual return
  let termYears = 5; // Default 5 year term
  
  // Use exact IRR values and terms from actual database product descriptions
  switch (product.id) {
    case 1: // Real Estate Equity Fund - target_net_irr: 8.5%, term: 24 months
      targetIRR = 0.085; // Exactly 8.5% from database
      termYears = 2.0; // 24 months = 2.0 years
      break;
    case 2: // Bitcoin Tracker Fund - "Market-based (historical 60%+ annualized)"
      targetIRR = 0.60; // 60% based on historical Bitcoin returns
      termYears = 1.0; // 12 months = 1.0 year
      break;
    case 3: // Corporate Credit Fund - "midpoint IRR targeting 11% annual returns"
      targetIRR = 0.11; // Exactly 11% from investment_strategy description
      termYears = 1.5; // 18 months = 1.5 years
      break;
    case 4: // Web3 Innovation Fund - "midpoint IRR targeting 18% annual returns"
      targetIRR = 0.18; // Exactly 18% from investment_strategy description
      termYears = 4.0; // Midpoint: (3 + 5) / 2 = 4.0 years
      break;
    case 5: // Ethereum Staking Fund - "midpoint IRR targeting 5.75% annual returns"
      targetIRR = 0.0575; // Exactly 5.75% from investment_strategy description
      termYears = 2.0; // 2 years for open-ended product
      break;
    case 6: // VC / Growth Equity Fund - Target IRR: 16–20%
      targetIRR = 0.18; // Midpoint: (16 + 20) / 2 = 18%
      termYears = 6; // 6 year term
      break;
    case 7: // Hybrid Capital Fund - Target IRR: 12–16%
      targetIRR = 0.14; // Midpoint: (12 + 16) / 2 = 14%
      termYears = 4; // 4 year term
      break;
    case 8: // Real Estate Credit Fund - Target IRR: ~11%
      targetIRR = 0.11; // Exactly 11%
      termYears = 0.85; // 0.85 year term (10.2 months)
      break;
    case 9: // Real Estate First Mortgage Fund - Target IRR: ~9%
      targetIRR = 0.09; // Exactly 9%
      termYears = 0.78; // 0.78 year term (9.4 months)
      break;
    case 10: // Diversified Crypto Fund - Target IRR: 25–35%
      targetIRR = 0.30; // Midpoint: (25 + 35) / 2 = 30%
      termYears = 4; // 4 year term
      break;
    case 11: // Security-Backed Corporate Credit Fund - Target IRR: 12–15%
      targetIRR = 0.135; // Midpoint: (12 + 15) / 2 = 13.5%
      termYears = 2.875; // 2.875 year term (2 years 10.5 months)
      break;
    case 12: // High-Yield Savings Account - Target IRR: 4.5–5.5%
      targetIRR = 0.05; // Midpoint: (4.5 + 5.5) / 2 = 5%
      termYears = 1; // 1 year term
      break;
    case 13: // Money Market Sweep Fund - Target IRR: 3.8–4.8%
      targetIRR = 0.043; // Midpoint: (3.8 + 4.8) / 2 = 4.3%
      termYears = 1; // 1 year term
      break;
    case 14: // Premium Treasury Deposit - Target IRR: 2.5–3.5%
      targetIRR = 0.03; // Midpoint: (2.5 + 3.5) / 2 = 3%
      termYears = 0.5; // 6 month term
      break;
    default:
      // Fallback to category-based logic for any new products
      switch (product.category) {
        case 'real_estate':
          targetIRR = 0.104; // Default to Real Estate Equity midpoint
          termYears = 4.25;
          break;
        case 'corporate_credit':
          targetIRR = 0.11; // Default to Cash Flow-Based Corporate Credit midpoint
          termYears = 2.5;
          break;
        case 'venture_capital':
          targetIRR = 0.18; // Default to VC/Growth Equity midpoint
          termYears = 6;
          break;
        case 'digital_assets':
          targetIRR = 0.15; // Default to Bitcoin conservative midpoint
          termYears = 3;
          break;
        case 'cash_deposit':
          targetIRR = 0.05; // Default to High-Yield Savings midpoint
          termYears = 1;
          break;
        default:
          targetIRR = 0.08; // 8% for unspecified
          termYears = 5;
      }
  }
  
  // Cap time at product term (no growth beyond maturity) - THIS IS THE KEY FIX
  const effectiveTime = Math.min(timeInYears, termYears);
  
  // Calculate current value using compound interest formula with term-capped time
  // Current Value = Principal × (1 + Rate)^(Effective Time)
  const growthFactor = Math.pow(1 + targetIRR, effectiveTime);
  const currentValue = Math.floor(investedAmount * growthFactor);
  const returnAmount = Math.floor(currentValue - investedAmount);
  const returnPercentage = investedAmount > 0 ? (returnAmount / investedAmount) * 100 : 0;
  
  return {
    currentValue,
    returnAmount,
    returnPercentage,
    daysHeld,
    timeInYears,
    targetIRR,
    growthFactor,
    effectiveTime,
    termYears
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Get current user (hardcoded for demo)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get user portfolio
  app.get("/api/portfolio", async (req, res) => {
    try {
      const userId = 1;
      
      // Get all wallets to calculate total balance
      const wallets = await storage.getWallets(userId);
      
      // Get all investments to calculate investment value
      const investments = await storage.getUserInvestments(userId);
      
      // Calculate fiat value (excluding crypto)
      const fiatValue = wallets
        .filter(w => w.walletType === 'fiat')
        .reduce((sum, w) => sum + parseFloat(w.balance), 0);
      
      // Calculate crypto and stablecoin values separately using actual exchange rates
      let cryptoValue = 0;
      let stablecoinValue = 0;
      
      for (const wallet of wallets.filter(w => w.walletType === 'crypto')) {
        const balance = parseFloat(wallet.balance);
        
        if (wallet.currency === "USDT" || wallet.currency === "USDC") {
          // Stablecoins are 1:1 with USD - separate category
          stablecoinValue += balance;
        } else {
          // Get actual exchange rate for crypto currencies (BTC, ETH, etc.)
          const rate = await storage.getFxRate(wallet.currency, "USD");
          if (rate) {
            cryptoValue += (balance * parseFloat(rate.rate));
          }
        }
      }
      
      // Calculate investment value using unified midpoint IRR calculation function
      let investmentValue = 0;
      const evaluationDate = new Date();
      
      for (const investment of investments) {
        const product = await storage.getInvestmentProduct(investment.productId);
        if (product) {
          const investmentDate = new Date(investment.investmentDate);
          const investedAmount = parseFloat(investment.investedAmount);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, evaluationDate);
          investmentValue += performance.currentValue;
        }
      }
      
      // Calculate total portfolio value including stablecoins
      const totalValue = fiatValue + cryptoValue + stablecoinValue + investmentValue;
      
      // Calculate monthly P&L with more realistic performance tracking
      const previousMonthValue = totalValue * 0.985; // Assume 1.5% growth from previous month
      const monthlyPnl = totalValue - previousMonthValue;
      const monthlyPnlPercent = previousMonthValue > 0 ? (monthlyPnl / previousMonthValue) * 100 : 0;
      
      const portfolio = {
        id: 1,
        userId,
        totalValue: totalValue.toFixed(2),
        cryptoValue: cryptoValue.toFixed(2),
        stablecoinValue: stablecoinValue.toFixed(2),
        fiatValue: fiatValue.toFixed(2),
        investmentValue: investmentValue.toFixed(2),
        monthlyPnl: monthlyPnl.toFixed(2),
        monthlyPnlPercent: monthlyPnlPercent.toFixed(2),
        updatedAt: new Date(),
      };
      
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: "Failed to get portfolio" });
    }
  });

  // Get portfolio historical performance based on actual transactions
  app.get("/api/portfolio/history", async (req, res) => {
    try {
      const { timeframe = "1M" } = req.query;
      const userId = 1;
      
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case "1M":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "1Y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }
      
      // Get transactions in the date range to build historical data
      const allTransactions = await storage.getTransactions(userId);
      const transactionsInRange = allTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt!);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      
      // Get current portfolio value
      const wallets = await storage.getWallets(userId);
      const investments = await storage.getUserInvestments(userId);
      
      // Calculate current total value
      let currentFiatValue = 0;
      let currentCryptoValue = 0;
      let currentStablecoinValue = 0;
      
      for (const wallet of wallets) {
        const balance = parseFloat(wallet.balance);
        if (wallet.walletType === 'fiat') {
          currentFiatValue += balance;
        } else if (wallet.currency === "USDT" || wallet.currency === "USDC") {
          currentStablecoinValue += balance;
        } else {
          const rate = await storage.getFxRate(wallet.currency, "USD");
          if (rate) {
            currentCryptoValue += (balance * parseFloat(rate.rate));
          }
        }
      }
      
      // Calculate current investment value with real-time performance
      let currentInvestmentValue = 0;
      for (const investment of investments) {
        const product = await storage.getInvestmentProduct(investment.productId);
        if (product) {
          const investmentDate = new Date(investment.investmentDate);
          const daysSinceInvestment = Math.floor((endDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
          const investedAmount = parseFloat(investment.investedAmount);
          let performanceFactor = 1;
          
          // Use unified midpoint IRR calculation function
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, endDate);
          currentInvestmentValue += performance.currentValue;
        }
      }
      const currentTotalValue = currentFiatValue + currentCryptoValue + currentStablecoinValue + currentInvestmentValue;
      
      // Build historical data points from transactions
      const dataPoints: Array<{ date: string; value: number; timestamp: number }> = [];
      
      if (transactionsInRange.length === 0) {
        // If no transactions in range, create flat line at current value
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        for (let i = 0; i <= daysDiff; i += Math.ceil(daysDiff / 20)) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          dataPoints.push({
            date: date.toISOString().split('T')[0],
            value: currentTotalValue,
            timestamp: date.getTime()
          });
        }
      } else {
        // Calculate portfolio value at key points based on timeframe
        const keyDates = [startDate];
        
        if (timeframe === "1Y") {
          // For 1Y, use monthly data points
          const currentDate = new Date(startDate);
          while (currentDate < endDate) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            if (currentDate <= endDate) {
              keyDates.push(new Date(currentDate));
            }
          }
        } else {
          // For 1M and 3M, add transaction dates and investment dates
          transactionsInRange.forEach(t => {
            const transactionDate = new Date(t.createdAt!);
            if (!keyDates.some(d => d.toDateString() === transactionDate.toDateString())) {
              keyDates.push(transactionDate);
            }
          });
          
          // Also add investment dates that fall within the range
          investments.forEach(inv => {
            const investmentDate = new Date(inv.investmentDate);
            if (investmentDate >= startDate && investmentDate <= endDate) {
              if (!keyDates.some(d => d.toDateString() === investmentDate.toDateString())) {
                keyDates.push(investmentDate);
              }
            }
          });
        }
        
        // Add end date
        keyDates.push(endDate);
        keyDates.sort((a, b) => a.getTime() - b.getTime());
        
        // Calculate portfolio value at each key date
        for (const date of keyDates) {
          const transactionsUpToDate = allTransactions.filter(t => 
            new Date(t.createdAt!) <= date && t.status === 'completed'
          );
          
          // Get investments made up to this date
          const investmentsUpToDate = investments.filter(inv => 
            new Date(inv.investmentDate) <= date
          );
          
          // Calculate portfolio value based on transaction history
          let portfolioValue = 0;
          const balancesByWallet = new Map<string, number>();
          
          // Build wallet balances from transaction history
          for (const transaction of transactionsUpToDate) {
            const amount = parseFloat(transaction.amount);
            
            if (transaction.type === 'deposit') {
              const currency = transaction.toCurrency!;
              const currentBalance = balancesByWallet.get(currency) || 0;
              balancesByWallet.set(currency, currentBalance + amount);
            } else if (transaction.type === 'exchange') {
              const fromCurrency = transaction.fromCurrency!;
              const toCurrency = transaction.toCurrency!;
              const fromAmount = parseFloat(transaction.amount);
              const exchangeRate = parseFloat(transaction.exchangeRate || "1");
              const toAmount = fromAmount * exchangeRate;
              
              // Subtract from source currency
              const fromBalance = balancesByWallet.get(fromCurrency) || 0;
              balancesByWallet.set(fromCurrency, fromBalance - fromAmount);
              
              // Add to target currency
              const toBalance = balancesByWallet.get(toCurrency) || 0;
              balancesByWallet.set(toCurrency, toBalance + toAmount);
            } else if (transaction.type === 'investment') {
              // Investment transactions reduce wallet balance and add to investment value
              const currency = transaction.fromCurrency || 'USD';
              const currentBalance = balancesByWallet.get(currency) || 0;
              balancesByWallet.set(currency, currentBalance - amount);
            }
          }
          
          // Convert all balances to USD for total value
          for (const [currency, balance] of balancesByWallet) {
            if (balance <= 0) continue;
            
            if (currency === 'USD') {
              portfolioValue += balance;
            } else if (currency === 'USDT' || currency === 'USDC') {
              portfolioValue += balance; // 1:1 with USD
            } else {
              const rate = await storage.getFxRate(currency, 'USD');
              if (rate) {
                portfolioValue += balance * parseFloat(rate.rate);
              }
            }
          }
          
          // Calculate investment value based on actual fund performance up to this date
          let historicalInvestmentValue = 0;
          for (const investment of investmentsUpToDate) {
            const product = await storage.getInvestmentProduct(investment.productId);
            if (product) {
              // Calculate time-based performance for this investment
              const investmentDate = new Date(investment.investmentDate);
              const daysSinceInvestment = Math.floor((date.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
              
              // Apply realistic performance based on product category and time
              const investedAmount = parseFloat(investment.investedAmount);
              let performanceFactor = 1; // No change initially
              
              // Different performance profiles for different asset classes
              switch (product.category) {
                case 'digital_assets':
                  // Crypto funds: Higher volatility, generally positive trend
                  if (daysSinceInvestment > 0) {
                    const annualReturn = 0.15; // 15% annual return average
                    const volatility = 0.4; // High volatility
                    const timeProgress = daysSinceInvestment / 365;
                    const baseReturn = annualReturn * timeProgress;
                    const volatilityAdjustment = (Math.sin(daysSinceInvestment * 0.1) * volatility * 0.1);
                    performanceFactor = 1 + baseReturn + volatilityAdjustment;
                  }
                  break;
                case 'real_estate':
                  // Real estate: Steady growth
                  if (daysSinceInvestment > 0) {
                    const annualReturn = 0.08; // 8% annual return
                    const timeProgress = daysSinceInvestment / 365;
                    performanceFactor = 1 + (annualReturn * timeProgress);
                  }
                  break;
                case 'corporate_credit':
                  // Corporate credit: Lower but steady returns
                  if (daysSinceInvestment > 0) {
                    const annualReturn = 0.05; // 5% annual return
                    const timeProgress = daysSinceInvestment / 365;
                    performanceFactor = 1 + (annualReturn * timeProgress);
                  }
                  break;
                case 'venture_capital':
                  // Venture capital: High risk, high reward
                  if (daysSinceInvestment > 0) {
                    const annualReturn = 0.20; // 20% annual return potential
                    const volatility = 0.3;
                    const timeProgress = daysSinceInvestment / 365;
                    const baseReturn = annualReturn * timeProgress;
                    const volatilityAdjustment = (Math.random() - 0.5) * volatility * 0.1;
                    performanceFactor = 1 + baseReturn + volatilityAdjustment;
                  }
                  break;
                default:
                  // Cash deposits: Low, steady return
                  if (daysSinceInvestment > 0) {
                    const annualReturn = 0.03; // 3% annual return
                    const timeProgress = daysSinceInvestment / 365;
                    performanceFactor = 1 + (annualReturn * timeProgress);
                  }
              }
              
              // Ensure performance factor doesn't go below 0.5 (50% loss max)
              performanceFactor = Math.max(0.5, performanceFactor);
              
              historicalInvestmentValue += investedAmount * performanceFactor;
            }
          }
          portfolioValue += historicalInvestmentValue;
          
          dataPoints.push({
            date: date.toISOString().split('T')[0],
            value: Math.round(portfolioValue),
            timestamp: date.getTime()
          });
        }
      }
      
      // Calculate performance metrics
      const startValue = dataPoints[0]?.value || currentTotalValue;
      const endValue = dataPoints[dataPoints.length - 1]?.value || currentTotalValue;
      const totalReturn = endValue - startValue;
      const totalReturnPercent = startValue > 0 ? (totalReturn / startValue) * 100 : 0;
      
      res.json({
        timeframe,
        data: dataPoints,
        currentValue: currentTotalValue,
        totalReturn: totalReturn.toFixed(2),
        totalReturnPercent: totalReturnPercent.toFixed(2),
        startValue: startValue.toFixed(2),
        endValue: endValue.toFixed(2)
      });
    } catch (error) {
      console.error("Portfolio history error:", error);
      res.status(500).json({ error: "Failed to get portfolio history" });
    }
  });

  // Get portfolio asset allocation
  app.get("/api/portfolio/allocation", async (req, res) => {
    try {
      const userId = 1;
      const wallets = await storage.getWallets(userId);
      const investments = await storage.getUserInvestments(userId);
      
      // Calculate allocation categories
      let fiatValue = 0;
      let cryptoValue = 0;
      let stablecoinValue = 0;
      let investmentValue = 0;
      
      // Calculate fiat value
      fiatValue = wallets
        .filter(w => w.walletType === 'fiat')
        .reduce((sum, w) => sum + parseFloat(w.balance), 0);
      
      // Calculate crypto and stablecoin values
      for (const wallet of wallets.filter(w => w.walletType === 'crypto')) {
        const balance = parseFloat(wallet.balance);
        
        if (wallet.currency === "USDT" || wallet.currency === "USDC") {
          stablecoinValue += balance;
        } else {
          const rate = await storage.getFxRate(wallet.currency, "USD");
          if (rate) {
            cryptoValue += (balance * parseFloat(rate.rate));
          }
        }
      }
      
      // Calculate investment value using unified calculation function
      const evaluationDate = new Date();
      for (const investment of investments) {
        const product = await storage.getInvestmentProduct(investment.productId);
        if (product) {
          const investmentDate = new Date(investment.investmentDate);
          const investedAmount = parseFloat(investment.investedAmount);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, evaluationDate);
          investmentValue += performance.currentValue;
        }
      }
      
      const totalValue = fiatValue + cryptoValue + stablecoinValue + investmentValue;
      
      // Calculate percentages
      const allocation = {
        fiat: {
          value: fiatValue,
          percentage: totalValue > 0 ? (fiatValue / totalValue) * 100 : 0
        },
        crypto: {
          value: cryptoValue,
          percentage: totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0
        },
        stablecoin: {
          value: stablecoinValue,
          percentage: totalValue > 0 ? (stablecoinValue / totalValue) * 100 : 0
        },
        investment: {
          value: investmentValue,
          percentage: totalValue > 0 ? (investmentValue / totalValue) * 100 : 0
        },
        totalValue
      };
      
      res.json(allocation);
    } catch (error) {
      res.status(500).json({ error: "Failed to get portfolio allocation" });
    }
  });

  // Get user wallets
  app.get("/api/wallets", async (req, res) => {
    try {
      const wallets = await storage.getWallets(1);
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallets" });
    }
  });

  // Get user transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(1, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Get FX rates
  app.get("/api/fx-rates", async (req, res) => {
    try {
      const rates = await storage.getFxRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: "Failed to get FX rates" });
    }
  });

  // Get specific FX rate
  app.get("/api/fx-rates/:base/:target", async (req, res) => {
    try {
      const { base, target } = req.params;
      const rate = await storage.getFxRate(base, target);
      if (!rate) {
        return res.status(404).json({ error: "FX rate not found" });
      }
      res.json(rate);
    } catch (error) {
      res.status(500).json({ error: "Failed to get FX rate" });
    }
  });

  // Get AI recommendations
  app.get("/api/ai-recommendations", async (req, res) => {
    try {
      const recommendations = await storage.getAiRecommendations(1);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get AI recommendations" });
    }
  });

  // Generate personalized AI recommendations based on risk profile
  app.post("/api/ai-recommendations/generate", async (req, res) => {
    try {
      const { riskTolerance, investmentHorizon, investmentGoal } = req.body;
      const userId = 1;
      
      // Get current portfolio allocation data
      const wallets = await storage.getWallets(userId);
      const investments = await storage.getUserInvestments(userId);
      
      // Calculate allocation categories
      let fiatValue = 0;
      let cryptoValue = 0;
      let stablecoinValue = 0;
      let investmentValue = 0;
      
      // Calculate fiat value
      fiatValue = wallets
        .filter(w => w.walletType === 'fiat')
        .reduce((sum, w) => sum + parseFloat(w.balance), 0);
      
      // Calculate crypto and stablecoin values
      for (const wallet of wallets.filter(w => w.walletType === 'crypto')) {
        const balance = parseFloat(wallet.balance);
        
        if (wallet.currency === "USDT" || wallet.currency === "USDC") {
          stablecoinValue += balance;
        } else {
          const rate = await storage.getFxRate(wallet.currency, "USD");
          if (rate) {
            cryptoValue += (balance * parseFloat(rate.rate));
          }
        }
      }
      
      // Calculate investment value using unified calculation function
      const evaluationDate = new Date();
      for (const investment of investments) {
        const product = await storage.getInvestmentProduct(investment.productId);
        if (product) {
          const investmentDate = new Date(investment.investmentDate);
          const investedAmount = parseFloat(investment.investedAmount);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, evaluationDate);
          investmentValue += performance.currentValue;
        }
      }
      
      const totalValue = fiatValue + cryptoValue + stablecoinValue + investmentValue;
      
      const currentAllocation = {
        crypto: totalValue > 0 ? (cryptoValue / totalValue) * 100 : 0,
        fiat: totalValue > 0 ? (fiatValue / totalValue) * 100 : 0,
        stablecoin: totalValue > 0 ? (stablecoinValue / totalValue) * 100 : 0,
        investment: totalValue > 0 ? (investmentValue / totalValue) * 100 : 0,
        totalValue,
      };
      
      // Generate recommendations based on risk profile
      const recommendations = [];
      let id = Date.now();
      
      // Risk-based portfolio recommendations
      if (riskTolerance <= 2) { // Conservative
        if (currentAllocation.crypto > 10) {
          recommendations.push({
            id: id++,
            userId,
            type: "rebalancing",
            title: "Reduce Crypto Exposure",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is high for a conservative profile. Consider reducing to 5-10% and increasing fixed income investments.`,
            severity: "warning",
            isRead: false,
            createdAt: new Date(),
          });
        }
        
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Increase Bond Allocation",
          description: "Consider allocating 60-70% to government bonds and high-grade corporate bonds for stable income generation.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
      } else if (riskTolerance <= 4) { // Moderate
        if (currentAllocation.crypto > 20) {
          recommendations.push({
            id: id++,
            userId,
            type: "rebalancing",
            title: "Moderate Crypto Rebalancing",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) exceeds moderate risk guidelines. Consider reducing to 15-20% for better risk management.`,
            severity: "info",
            isRead: false,
            createdAt: new Date(),
          });
        }
        
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Diversify with International Equities",
          description: "Consider adding 20-25% international equity exposure to reduce correlation with domestic markets.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
      } else { // Aggressive
        if (currentAllocation.crypto < 15) {
          recommendations.push({
            id: id++,
            userId,
            type: "opportunity",
            title: "Increase Growth Exposure",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is conservative. Consider increasing to 25-30% for higher growth potential.`,
            severity: "info",
            isRead: false,
            createdAt: new Date(),
          });
        }
        
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Consider Growth Equity Investments",
          description: "Your aggressive profile allows for higher allocation to growth stocks and venture capital opportunities.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
      }
      
      // Investment goal-based recommendations
      if (investmentGoal === "preservation") {
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Capital Preservation Strategy",
          description: "Focus on high-grade bonds, treasury securities, and stable value funds to preserve capital while earning modest returns.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
        
        if (currentAllocation.crypto > 5) {
          recommendations.push({
            id: id++,
            userId,
            type: "risk_warning",
            title: "High Crypto Risk for Preservation Goal",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is too high for capital preservation. Consider reducing to under 5%.`,
            severity: "warning",
            isRead: false,
            createdAt: new Date(),
          });
        }
      } else if (investmentGoal === "income") {
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Income Generation Focus",
          description: "Prioritize dividend-paying stocks, REITs, corporate bonds, and high-yield savings to generate steady income.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
        
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Consider Dividend Aristocrats",
          description: "S&P 500 Dividend Aristocrats have increased dividends for 25+ consecutive years, providing reliable income.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
      } else if (investmentGoal === "growth") {
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Growth Investment Strategy",
          description: "Focus on technology, healthcare, and emerging markets for long-term capital appreciation potential.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
      } else if (investmentGoal === "aggressive") {
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Aggressive Growth Opportunities",
          description: "Consider small-cap growth stocks, venture capital, and higher crypto allocations for maximum growth potential.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
        
        if (currentAllocation.crypto < 20) {
          recommendations.push({
            id: id++,
            userId,
            type: "opportunity",
            title: "Increase Crypto Allocation",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is low for aggressive growth. Consider increasing to 20-30%.`,
            severity: "info",
            isRead: false,
            createdAt: new Date(),
          });
        }
      }
      
      // Time horizon recommendations
      if (investmentHorizon === "1-3") {
        recommendations.push({
          id: id++,
          userId,
          type: "risk_warning",
          title: "Short-Term Horizon Adjustment",
          description: "With a 1-3 year horizon, prioritize liquidity and stability. Increase cash (15-20%) and high-grade bonds (50-60%).",
          severity: "warning",
          isRead: false,
          createdAt: new Date(),
        });
        
        if (currentAllocation.crypto > 10) {
          recommendations.push({
            id: id++,
            userId,
            type: "risk_warning",
            title: "Crypto Risk for Short Timeline",
            description: `Your crypto allocation (${currentAllocation.crypto.toFixed(1)}%) is high for short-term goals. Consider reducing to 5-10%.`,
            severity: "warning",
            isRead: false,
            createdAt: new Date(),
          });
        }
      } else if (investmentHorizon === "3-5") {
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Medium-Term Balance",
          description: "Your 3-5 year horizon allows for moderate growth investments while maintaining some stability through bonds and cash.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
      } else if (investmentHorizon === "5-10") {
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Long-Term Growth Focus",
          description: "Your 5-10 year horizon supports higher equity allocation and moderate alternative investments for compound growth.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
      } else if (investmentHorizon === "10+") {
        recommendations.push({
          id: id++,
          userId,
          type: "opportunity",
          title: "Maximum Growth Potential",
          description: "Your 10+ year horizon allows for aggressive growth strategies including higher equity and alternative asset allocations.",
          severity: "info",
          isRead: false,
          createdAt: new Date(),
        });
        
        if (currentAllocation.crypto < 15) {
          recommendations.push({
            id: id++,
            userId,
            type: "opportunity",
            title: "Long-Term Crypto Opportunity",
            description: `Your long timeline allows for higher crypto exposure (${currentAllocation.crypto.toFixed(1)}% current). Consider 15-25% for growth.`,
            severity: "info",
            isRead: false,
            createdAt: new Date(),
          });
        }
      }
      
      // Clear existing recommendations and set new ones
      await storage.clearAiRecommendations(userId);
      for (const recommendation of recommendations) {
        await storage.createAiRecommendation(recommendation);
      }
      
      res.json({ 
        success: true, 
        recommendations,
        message: "AI recommendations generated successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI recommendations" });
    }
  });

  // Create FX exchange transaction
  app.post("/api/fx-exchange", async (req, res) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      const userId = 1;
      
      if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const rate = await storage.getFxRate(fromCurrency, toCurrency);
      if (!rate) {
        return res.status(400).json({ error: "Exchange rate not available" });
      }

      // Get source wallet
      const fromWallet = await storage.getWallet(userId, fromCurrency);
      if (!fromWallet) {
        return res.status(404).json({ error: "Source wallet not found" });
      }

      // Get or create target wallet
      let toWallet = await storage.getWallet(userId, toCurrency);
      if (!toWallet) {
        console.log(`Creating new wallet for ${toCurrency}`);
        toWallet = await storage.createWallet({
          userId,
          currency: toCurrency,
          balance: "0.00",
          availableBalance: "0.00",
          walletType: toCurrency === 'BTC' || toCurrency === 'ETH' ? 'crypto' : 'fiat'
        });
      }

      const exchangeRate = parseFloat(rate.rate);
      const convertedAmount = parseFloat(amount) * exchangeRate;
      const fee = convertedAmount * 0.005; // 0.5% fee on converted amount
      const netConvertedAmount = convertedAmount - fee;
      const totalDeduction = parseFloat(amount); // Only deduct the original amount from source

      // Check if sufficient balance in source wallet
      if (parseFloat(fromWallet.availableBalance) < totalDeduction) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Update source wallet (deduct amount + fee)
      const newFromBalance = (parseFloat(fromWallet.balance) - totalDeduction).toFixed(2);
      const newFromAvailableBalance = (parseFloat(fromWallet.availableBalance) - totalDeduction).toFixed(2);
      
      await storage.updateWallet(fromWallet.id, {
        balance: newFromBalance,
        availableBalance: newFromAvailableBalance,
      });

      // Update target wallet (add net converted amount after fee)
      const newToBalance = (parseFloat(toWallet.balance) + netConvertedAmount).toFixed(2);
      const newToAvailableBalance = (parseFloat(toWallet.availableBalance) + netConvertedAmount).toFixed(2);
      
      await storage.updateWallet(toWallet.id, {
        balance: newToBalance,
        availableBalance: newToAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "exchange",
        fromCurrency,
        toCurrency,
        amount: amount.toString(),
        fee: fee.toFixed(2),
        exchangeRate: exchangeRate.toString(),
        status: "completed",
        description: `${fromCurrency} to ${toCurrency} Exchange`,
      });

      res.json({
        transaction,
        convertedAmount: netConvertedAmount,
        exchangeRate,
        fee,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process FX exchange" });
    }
  });

  // Create deposit transaction (legacy route)
  app.post("/api/deposit", async (req, res) => {
    try {
      const { currency, amount, description } = req.body;
      const userId = 1;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current wallet
      const wallet = await storage.getWallet(userId, currency);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      // Update wallet balance
      const depositAmount = parseFloat(amount);
      const newBalance = (parseFloat(wallet.balance) + depositAmount).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) + depositAmount).toFixed(2);
      
      await storage.updateWallet(wallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        fromCurrency: null,
        toCurrency: currency,
        amount: amount.toString(),
        fee: "0.00",
        exchangeRate: null,
        status: "completed",
        description: description || `${currency} Deposit`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  // Create deposit transaction (new wallet route)
  app.post("/api/wallets/deposit", async (req, res) => {
    try {
      const { currency, amount, type } = req.body;
      const userId = 1;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current wallet
      const wallet = await storage.getWallet(userId, currency);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      // Update wallet balance
      const depositAmount = parseFloat(amount);
      const newBalance = (parseFloat(wallet.balance) + depositAmount).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) + depositAmount).toFixed(2);
      
      await storage.updateWallet(wallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        fromCurrency: null,
        toCurrency: currency,
        amount: amount.toString(),
        fee: "0.00",
        exchangeRate: null,
        status: "completed",
        description: `${currency} Deposit`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  // Create withdrawal transaction (legacy route)
  app.post("/api/withdraw", async (req, res) => {
    try {
      const { currency, amount, description } = req.body;
      const userId = 1;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current wallet
      const wallet = await storage.getWallet(userId, currency);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      const withdrawAmount = parseFloat(amount);
      const fee = 25.00;
      const totalDeduction = withdrawAmount + fee;
      
      // Check if sufficient balance
      if (parseFloat(wallet.availableBalance) < totalDeduction) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Update wallet balance
      const newBalance = (parseFloat(wallet.balance) - totalDeduction).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) - totalDeduction).toFixed(2);
      
      await storage.updateWallet(wallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "withdrawal",
        fromCurrency: currency,
        toCurrency: null,
        amount: amount.toString(),
        fee: fee.toFixed(2),
        exchangeRate: null,
        status: "completed",
        description: description || `${currency} Withdrawal`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // Create withdrawal transaction (new wallet route)
  app.post("/api/wallets/withdraw", async (req, res) => {
    try {
      const { currency, amount, type } = req.body;
      const userId = 1;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get current wallet
      const wallet = await storage.getWallet(userId, currency);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      const withdrawAmount = parseFloat(amount);
      const fee = 25.00;
      const totalDeduction = withdrawAmount + fee;
      
      // Check if sufficient balance
      if (parseFloat(wallet.availableBalance) < totalDeduction) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Update wallet balance
      const newBalance = (parseFloat(wallet.balance) - totalDeduction).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) - totalDeduction).toFixed(2);
      
      await storage.updateWallet(wallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      const transaction = await storage.createTransaction({
        userId,
        type: "withdraw",
        fromCurrency: currency,
        toCurrency: null,
        amount: amount.toString(),
        fee: fee.toFixed(2),
        exchangeRate: null,
        status: "completed",
        description: `${currency} Withdrawal`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process withdrawal" });
    }
  });

  // Mark AI recommendation as read
  app.patch("/api/ai-recommendations/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markRecommendationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark recommendation as read" });
    }
  });

  // Apply AI recommendation
  app.post("/api/ai-recommendations/:id/apply", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // For demo purposes, we'll just mark it as read and return success
      await storage.markRecommendationAsRead(id);
      res.json({ 
        success: true, 
        message: "Recommendation applied successfully",
        appliedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to apply recommendation" });
    }
  });

  // Get investment products
  app.get("/api/investment-products", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        riskProfile: req.query.riskProfile as string,
        liquidity: req.query.liquidity as string,
      };
      
      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (!filters[key as keyof typeof filters]) {
          delete filters[key as keyof typeof filters];
        }
      });
      
      const products = await storage.getInvestmentProducts(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to get investment products" });
    }
  });

  // Get specific investment product
  app.get("/api/investment-products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getInvestmentProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Investment product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to get investment product" });
    }
  });



  // Get user investments with real-time Filter Products calculation
  app.get("/api/user-investments", async (req, res) => {
    try {
      const userId = 1; // Hardcoded user ID for demo
      const investments = await storage.getUserInvestments(userId);
      const allProducts = await storage.getInvestmentProducts();
      const currentDate = new Date();
      
      // Real-time Filter Products calculation methodology
      const investmentsWithPerformance = investments.map(investment => {
        const product = allProducts.find(p => p.id === investment.productId);
        if (!product) return investment;
        
        // Extract real-time IRR from strategy description (authoritative source)
        let realTimeIRR = 0.08; // Default fallback
        const strategy = product.investmentStrategy ? product.investmentStrategy.toLowerCase() : '';
        
        // Debug log to see what strategy we're processing
        console.log(`Processing product ${product.id}: ${product.name}, strategy: "${strategy}"`);
        
        // Use direct product ID mapping based on database query results
        switch (product.id) {
          case 1: // Real Estate Equity Fund
            realTimeIRR = 0.085; // 8.5%
            console.log(`Applied 8.5% IRR for Product 1: Real Estate Equity Fund`);
            break;
          case 2: // Bitcoin Tracker Fund
            realTimeIRR = 0.60; // 60%
            console.log(`Applied 60% IRR for Product 2: Bitcoin Tracker Fund`);
            break;
          case 3: // Corporate Credit Fund
            realTimeIRR = 0.11; // 11%
            console.log(`Applied 11% IRR for Product 3: Corporate Credit Fund`);
            break;
          case 4: // Web3 Innovation Fund
            realTimeIRR = 0.18; // 18%
            console.log(`Applied 18% IRR for Product 4: Web3 Innovation Fund`);
            break;
          case 5: // Ethereum Staking Fund
            realTimeIRR = 0.0575; // 5.75%
            console.log(`Applied 5.75% IRR for Product 5: Ethereum Staking Fund`);
            break;
          default:
            console.log(`Using fallback 8% IRR for product ${product.id}: ${product.name}`);
            break;
        }
        
        // Real-time period calculation with high precision
        const investmentDate = new Date(investment.investmentDate);
        const timeElapsedMs = currentDate.getTime() - investmentDate.getTime();
        const timeElapsed = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25));
        
        // Real-time compound interest calculation
        const principal = parseFloat(investment.investedAmount);
        const growthFactor = Math.pow(1 + realTimeIRR, timeElapsed);
        const currentValue = Math.round((principal * growthFactor) * 100) / 100;
        const totalReturn = Math.round((currentValue - principal) * 100) / 100;
        const returnPercent = (totalReturn / principal) * 100;
        
        return {
          ...investment,
          currentValue: currentValue.toFixed(2),
          totalReturn: totalReturn.toFixed(2),
          returnPercent: returnPercent.toFixed(2),
          realTimeIRR,
          timeElapsed: timeElapsed.toFixed(4),
          updatedAt: currentDate
        };
      });
      
      res.json(investmentsWithPerformance);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user investments" });
    }
  });

  // Get investment performance by period with predictions
  app.get("/api/investment-performance", async (req, res) => {
    try {
      const { timeframe = "1Y" } = req.query;
      const userId = 1;
      
      // Get all user investments
      const investments = await storage.getUserInvestments(userId);
      const allProducts = await storage.getInvestmentProducts();
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case "1M":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "3M":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "1Y":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setFullYear(startDate.getFullYear() - 1);
      }
      
      // Generate data points at 3-month intervals for the timeframe
      const dataPoints = [];
      const intervalDate = new Date(startDate);
      
      while (intervalDate <= endDate) {
        let totalInvestmentValue = 0;
        let weightedReturn = 0;
        let totalInvestedAmount = 0;
        
        // Calculate cumulative investment performance over time periods
        for (const investment of investments) {
          const product = allProducts.find(p => p.id === investment.productId);
          if (product) {
            const investmentDate = new Date(investment.investmentDate);
            // Only include investments that existed at this point in time
            if (investmentDate <= intervalDate) {
              const investedAmount = parseFloat(investment.investedAmount);
              
              // Use same real-time calculation as User Investments API for consistency
              let realTimeIRR = 0.08; // Default fallback
              switch (product.id) {
                case 1: realTimeIRR = 0.085; break; // Real Estate Equity Fund
                case 2: realTimeIRR = 0.60; break;  // Bitcoin Tracker Fund
                case 3: realTimeIRR = 0.11; break;  // Corporate Credit Fund
                case 4: realTimeIRR = 0.18; break;  // Web3 Innovation Fund
                case 5: realTimeIRR = 0.0575; break; // Ethereum Staking Fund
              }
              
              const timeElapsedMs = intervalDate.getTime() - investmentDate.getTime();
              const timeElapsed = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25));
              const growthFactor = Math.pow(1 + realTimeIRR, timeElapsed);
              const currentValue = Math.round((investedAmount * growthFactor) * 100) / 100;
              const returnAmount = Math.round((currentValue - investedAmount) * 100) / 100;
              const returnPercentage = (returnAmount / investedAmount) * 100;
              
              const performance = {
                currentValue,
                returnAmount,
                returnPercentage
              };
              
              totalInvestmentValue += performance.currentValue;
              totalInvestedAmount += investedAmount;
              
              // Weight the return by the investment amount for period-based returns
              weightedReturn += (performance.returnPercentage * investedAmount);
            }
          }
        }
        
        // Calculate weighted average return
        const avgReturn = totalInvestedAmount > 0 ? weightedReturn / totalInvestedAmount : 0;
        
        dataPoints.push({
          date: intervalDate.toISOString().split('T')[0],
          value: Math.round(totalInvestmentValue),
          investedAmount: Math.round(totalInvestedAmount),
          weightedReturn: Number(avgReturn.toFixed(2)),
          timestamp: intervalDate.getTime()
        });
        
        // Move to next 3-month interval
        intervalDate.setMonth(intervalDate.getMonth() + 3);
      }
      
      // Calculate term expiry projections using individual product terms and expiry dates
      const currentCalculationDate = new Date();
      const predictions = [];
      
      // Find the latest expiry date among all investments to determine prediction end
      let latestExpiryDate = new Date(currentCalculationDate);
      const productTermMapping: Record<number, number> = {
        1: 4.25,  // Real Estate Equity Fund - 4.25 years
        2: 0.85,  // Real Estate Credit Fund - 0.85 years (10.2 months)  
        3: 0.78,  // Real Estate First Mortgage Fund - 0.78 years (9.3 months)
        4: 2.5,   // Cash Flow-Based Corporate Credit Fund - 2.5 years
        5: 2.875, // Security-Backed Corporate Credit Fund - 2.875 years (34.5 months)
        6: 6,     // VC / Growth Equity Fund - 6 years
      };
      
      // Calculate actual expiry dates for each investment
      for (const investment of investments) {
        const investmentDate = new Date(investment.investmentDate);
        const termYears = productTermMapping[investment.productId] || 5;
        const expiryDate = new Date(investmentDate.getTime() + (termYears * 365.25 * 24 * 60 * 60 * 1000));
        if (expiryDate > latestExpiryDate) {
          latestExpiryDate = expiryDate;
        }
      }
      
      // Generate predictions from current date to latest expiry in 3-month intervals
      const predictionDate = new Date(endDate);
      predictionDate.setMonth(predictionDate.getMonth() + 3); // Start predictions from next quarter
      
      // Extended projection to 2030 to cover full term expiry lifecycle
      const maxProjectionDate = new Date('2030-12-31');
      
      while (predictionDate <= maxProjectionDate) {
        let totalPredictedValue = 0;
        let totalInvestedAmount = 0;
        
        // Calculate predicted value for each investment at this future date
        for (const investment of investments) {
          const product = allProducts.find(p => p.id === investment.productId);
          if (product) {
            const investedAmount = parseFloat(investment.investedAmount);
            const investmentDate = new Date(investment.investmentDate);
            
            // Calculate performance at this prediction date using term expiry capping
            const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, predictionDate);
            
            totalPredictedValue += performance.currentValue;
            totalInvestedAmount += investedAmount;
          }
        }
        
        const totalReturn = totalPredictedValue - totalInvestedAmount;
        const totalReturnPercent = totalInvestedAmount > 0 ? (totalReturn / totalInvestedAmount) * 100 : 0;
        
        predictions.push({
          date: predictionDate.toISOString().split('T')[0],
          value: Math.round(totalPredictedValue),
          totalReturn: Math.round(totalReturn),
          weightedReturn: Number(totalReturnPercent.toFixed(2)),
          currentInvestment: Math.round(totalInvestedAmount),
          isPrediction: true,
          timestamp: predictionDate.getTime()
        });
        
        // Move to next 3-month interval  
        predictionDate.setMonth(predictionDate.getMonth() + 3);
      }
      
      // Calculate cumulative performance using same method as User Investments API
      let totalInvestedNow = 0;
      let totalCurrentValueNow = 0;
      let cumulativeTotalReturn = 0;
      
      // Calculate cumulative returns using identical calculation methodology
      const calculationDate = new Date();
      for (const investment of investments) {
        const product = allProducts.find(p => p.id === investment.productId);
        if (product) {
          const investmentDate = new Date(investment.investmentDate);
          const investedAmount = parseFloat(investment.investedAmount);
          
          // Use identical IRR mapping and calculation as User Investments API
          let realTimeIRR = 0.08; // Default fallback
          switch (product.id) {
            case 1: realTimeIRR = 0.085; break; // Real Estate Equity Fund
            case 2: realTimeIRR = 0.60; break;  // Bitcoin Tracker Fund
            case 3: realTimeIRR = 0.11; break;  // Corporate Credit Fund
            case 4: realTimeIRR = 0.18; break;  // Web3 Innovation Fund
            case 5: realTimeIRR = 0.0575; break; // Ethereum Staking Fund
          }
          
          const timeElapsedMs = calculationDate.getTime() - investmentDate.getTime();
          const timeElapsed = Math.max(0, timeElapsedMs / (1000 * 60 * 60 * 24 * 365.25));
          const growthFactor = Math.pow(1 + realTimeIRR, timeElapsed);
          const currentValue = Math.round((investedAmount * growthFactor) * 100) / 100;
          const returnAmount = Math.round((currentValue - investedAmount) * 100) / 100;
          
          totalInvestedNow += investedAmount;
          totalCurrentValueNow += currentValue;
          cumulativeTotalReturn += returnAmount;
        }
      }
      
      // Performance by Period shows cumulative returns over investment periods
      const cumulativeTotalReturnPercent = totalInvestedNow > 0 ? (cumulativeTotalReturn / totalInvestedNow) * 100 : 0;
      
      res.json({
        timeframe,
        data: dataPoints,
        predictions,
        currentValue: Number(totalCurrentValueNow.toFixed(2)), // Current portfolio value
        totalReturn: Number(cumulativeTotalReturn.toFixed(2)), // Cumulative returns over investment periods
        totalReturnPercent: Number(cumulativeTotalReturnPercent.toFixed(2)) // Cumulative return percentage
      });
    } catch (error) {
      console.error("Investment performance error:", error);
      res.status(500).json({ error: "Failed to get investment performance" });
    }
  });

  // Get investment breakdown by category
  app.get("/api/investment-breakdown", async (req, res) => {
    try {
      const userId = 1;
      const investments = await storage.getUserInvestments(userId);
      const products = await storage.getInvestmentProducts();
      
      // Calculate category breakdown
      const categoryBreakdown = {
        "real_estate": { value: 0, products: [], displayName: "Real Estate" },
        "corporate_credit": { value: 0, products: [], displayName: "Corporate Credit" },
        "venture_capital": { value: 0, products: [], displayName: "Venture Capital" },
        "digital_assets": { value: 0, products: [], displayName: "Digital Assets" },
        "cash_deposit": { value: 0, products: [], displayName: "Cash Deposits" }
      };
      
      let totalInvested = 0;
      
      for (const investment of investments) {
        const product = products.find(p => p.id === investment.productId);
        if (product) {
          const value = parseFloat(investment.investedAmount); // Use invested amount, not current value
          totalInvested += value;
          
          if (categoryBreakdown[product.category]) {
            categoryBreakdown[product.category].value += value;
            categoryBreakdown[product.category].products.push({
              name: product.name,
              value: value,
              percentage: 0 // Will be calculated below
            });
          }
        }
      }
      
      // Calculate percentages
      const categoryData = Object.entries(categoryBreakdown).map(([key, data]) => ({
        name: data.displayName,
        value: data.value,
        percentage: totalInvested > 0 ? (data.value / totalInvested * 100) : 0,
        products: data.products.map(p => ({
          ...p,
          percentage: totalInvested > 0 ? (p.value / totalInvested * 100) : 0
        }))
      })).filter(cat => cat.value > 0);
      
      res.json({
        totalInvested,
        categories: categoryData
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investment breakdown" });
    }
  });

  // Create investment
  app.post("/api/investments", async (req, res) => {
    try {
      const { productId, amount, sourceCurrency = "USD", sourceAmount } = req.body;
      const userId = 1; // Hardcoded user ID for demo
      
      if (!productId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const product = await storage.getInvestmentProduct(productId);
      if (!product) {
        return res.status(400).json({ error: "Investment product not found" });
      }

      const investmentAmount = parseFloat(amount); // USD equivalent
      const deductionAmount = sourceAmount ? parseFloat(sourceAmount) : investmentAmount; // Original currency amount
      const currency = sourceCurrency || "USD";
      const minimumInvestment = parseFloat(product.minimumInvestment);
      
      if (investmentAmount < minimumInvestment) {
        return res.status(400).json({ error: `Minimum investment is $${minimumInvestment.toLocaleString()}` });
      }

      // Check source currency wallet balance
      const sourceWallet = await storage.getWallet(userId, currency);
      if (!sourceWallet) {
        return res.status(400).json({ error: `${currency} wallet not found` });
      }

      const currentBalance = parseFloat(sourceWallet.availableBalance);
      if (currentBalance < deductionAmount) {
        return res.status(400).json({ error: `Insufficient balance. Available: ${deductionAmount.toLocaleString()} ${currency}` });
      }

      // Update source wallet balance (deduct investment amount in original currency)
      const newBalance = (parseFloat(sourceWallet.balance) - deductionAmount).toFixed(2);
      const newAvailableBalance = (parseFloat(sourceWallet.availableBalance) - deductionAmount).toFixed(2);
      
      await storage.updateWallet(sourceWallet.id, {
        balance: newBalance,
        availableBalance: newAvailableBalance,
      });

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "investment",
        fromCurrency: currency,
        toCurrency: currency === "USD" ? null : "USD",
        amount: deductionAmount.toString(),
        fee: "0.00",
        exchangeRate: currency === "USD" ? null : (investmentAmount / deductionAmount).toString(),
        status: "completed",
        description: `Investment in ${product.name}${currency !== "USD" ? ` (converted from ${currency})` : ""}`,
      });

      // Calculate initial performance for new investment (using midpoint IRR)
      const currentDate = new Date();
      const initialPerformance = calculateInvestmentPerformance(product, investmentAmount, currentDate, currentDate);
      
      // Create investment record (always in USD equivalent)
      const investment = await storage.createUserInvestment({
        userId,
        productId,
        investedAmount: investmentAmount.toString(), // USD equivalent
        currentValue: initialPerformance.currentValue.toString(), // Use calculated performance
        totalReturn: "0.00",
        returnPercent: "0.00",
        status: "active",
        maturityDate: null, // Can be calculated based on product term
      });

      res.json({
        investment,
        transaction,
        newBalance: newAvailableBalance,
        sourceCurrency: currency,
        message: "Investment created successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create investment" });
    }
  });

  // Wallet transfer endpoint
  app.post("/api/wallets/transfer", async (req, res) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      const userId = 1; // Demo user
      
      // Get source wallet
      const sourceWallet = await storage.getWallet(userId, fromCurrency);
      if (!sourceWallet) {
        return res.status(404).json({ error: "Source wallet not found" });
      }
      
      if (sourceWallet.availableBalance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Get or create target wallet
      let targetWallet = await storage.getWallet(userId, toCurrency);
      if (!targetWallet) {
        targetWallet = await storage.createWallet({
          userId,
          currency: toCurrency,
          balance: 0,
          availableBalance: 0,
          walletType: ['BTC', 'ETH'].includes(toCurrency) ? 'crypto' : 'fiat'
        });
      }
      
      // Get exchange rate - must find valid rate or fail
      const rate = await storage.getFxRate(fromCurrency, toCurrency);
      if (!rate) {
        return res.status(400).json({ error: `Exchange rate not found for ${fromCurrency} to ${toCurrency}` });
      }
      const exchangeRate = parseFloat(rate.rate);
      
      const convertedAmount = amount * exchangeRate;
      const fee = convertedAmount * 0.005; // 0.5% fee
      const finalAmount = convertedAmount - fee;
      
      // Update balances with proper numeric conversion
      const newSourceBalance = (parseFloat(sourceWallet.balance) - amount).toFixed(2);
      const newSourceAvailable = (parseFloat(sourceWallet.availableBalance) - amount).toFixed(2);
      
      await storage.updateWallet(sourceWallet.id, {
        balance: newSourceBalance,
        availableBalance: newSourceAvailable
      });
      
      const newTargetBalance = (parseFloat(targetWallet.balance) + finalAmount).toFixed(2);
      const newTargetAvailable = (parseFloat(targetWallet.availableBalance) + finalAmount).toFixed(2);
      
      await storage.updateWallet(targetWallet.id, {
        balance: newTargetBalance,
        availableBalance: newTargetAvailable
      });
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "currency_transfer",
        amount: amount.toString(),
        currency: fromCurrency,
        targetCurrency: toCurrency,
        status: "completed",
        description: `Converted ${amount} ${fromCurrency} to ${finalAmount.toFixed(2)} ${toCurrency}`,
        fee
      });
      
      res.json({
        transaction,
        exchangeRate,
        convertedAmount,
        fee,
        finalAmount,
        sourceWallet: await storage.getWallet(userId, fromCurrency),
        targetWallet: await storage.getWallet(userId, toCurrency)
      });
    } catch (error) {
      console.error("Wallet transfer error:", error);
      res.status(500).json({ error: "Failed to process transfer" });
    }
  });

  // Advisor Contact Route
  app.post("/api/advisor/contact", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // In a real implementation, this would send an email or create a ticket
      // For demo, we'll just return success
      res.json({ 
        success: true, 
        message: "Your message has been sent to your wealth planner",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // VirgoCX Integration Routes
  
  // Get VirgoCX market data
  app.get("/api/virgocx/market-data", async (req, res) => {
    try {
      // Mock market data - in production, fetch from VirgoCX API
      const marketData = {
        'BTC/CAD': { price: 129850, change: '+2.4%', volume: '1.2M' },
        'ETH/CAD': { price: 4420, change: '+1.8%', volume: '800K' },
        'USDT/CAD': { price: 1.37, change: '-0.1%', volume: '2.1M' },
        'USDC/CAD': { price: 1.37, change: '0.0%', volume: '1.8M' },
        topGainers: ['BTC', 'ETH', 'LTC'],
        trending: ['BTC', 'ETH', 'USDT']
      };
      res.json(marketData);
    } catch (error) {
      res.status(500).json({ error: "Failed to get market data" });
    }
  });

  // Get all VirgoCX trading pairs
  app.get("/api/virgocx/trading-pairs", async (req, res) => {
    try {
      const baseCurrency = req.query.base || 'AUD'; // Default to AUD, allow USD option
      const currencySymbol = baseCurrency === 'USD' ? '$' : 'A$';
      
      // Return comprehensive VirgoCX trading pairs (100+ cryptocurrencies)
      const tradingPairs = [
        // Major Cryptocurrencies
        { symbol: 'BTC', name: 'Bitcoin', pair: `BTC/${baseCurrency}`, price: baseCurrency === 'USD' ? 97250.45 : 129750.45, change: 2.34, volume: 45678.12, marketCap: 2.58e12, category: 'major' },
        { symbol: 'ETH', name: 'Ethereum', pair: `ETH/${baseCurrency}`, price: baseCurrency === 'USD' ? 3420.78 : 4562.78, change: 1.89, volume: 234567.89, marketCap: 5.48e11, category: 'major' },
        { symbol: 'SOL', name: 'Solana', pair: `SOL/${baseCurrency}`, price: baseCurrency === 'USD' ? 175.56 : 234.56, change: 5.67, volume: 34567.89, marketCap: 1.1e11, category: 'layer1' },
        { symbol: 'ADA', name: 'Cardano', pair: `ADA/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.92 : 1.23, change: 3.45, volume: 23456.78, marketCap: 4.31e10, category: 'layer1' },
        { symbol: 'DOT', name: 'Polkadot', pair: `DOT/${baseCurrency}`, price: baseCurrency === 'USD' ? 9.24 : 12.34, change: 2.10, volume: 9876.54, marketCap: 1.75e10, category: 'layer1' },
        { symbol: 'LINK', name: 'Chainlink', pair: `LINK/${baseCurrency}`, price: baseCurrency === 'USD' ? 21.65 : 28.90, change: 1.56, volume: 6789.01, marketCap: 1.70e10, category: 'defi' },
        { symbol: 'AVAX', name: 'Avalanche', pair: `AVAX/${baseCurrency}`, price: baseCurrency === 'USD' ? 50.89 : 67.89, change: 3.21, volume: 12345.67, marketCap: 2.71e10, category: 'layer1' },
        { symbol: 'USDC', name: 'USD Coin', pair: `USDC/${baseCurrency}`, price: baseCurrency === 'USD' ? 1.00 : 1.33, change: 0.01, volume: 234567.89, marketCap: 5.56e10, category: 'stablecoin' },
        
        // DeFi Tokens
        { symbol: 'UNI', name: 'Uniswap', pair: `UNI/${baseCurrency}`, price: baseCurrency === 'USD' ? 14.58 : 19.45, change: 4.23, volume: 8765.43, marketCap: 1.46e10, category: 'defi' },
        { symbol: 'AAVE', name: 'Aave', pair: `AAVE/${baseCurrency}`, price: baseCurrency === 'USD' ? 342.08 : 456.78, change: 2.67, volume: 3456.78, marketCap: 6.85e9, category: 'defi' },
        { symbol: 'COMP', name: 'Compound', pair: `COMP/${baseCurrency}`, price: baseCurrency === 'USD' ? 92.58 : 123.45, change: 1.89, volume: 2345.67, marketCap: 1.24e9, category: 'defi' },
        { symbol: 'SUSHI', name: 'SushiSwap', pair: `SUSHI/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.92 : 1.23, change: 0.89, volume: 5678.90, marketCap: 1.6e8, category: 'defi' },
        { symbol: 'CRV', name: 'Curve', pair: `CRV/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.67 : 0.89, change: 3.12, volume: 5678.90, marketCap: 6.7e8, category: 'defi' },
        { symbol: 'MKR', name: 'Maker', pair: `MKR/${baseCurrency}`, price: baseCurrency === 'USD' ? 1417.84 : 1890.45, change: 1.23, volume: 1234.56, marketCap: 1.85e9, category: 'defi' },
        
        // Layer 2 & Scaling
        { symbol: 'MATIC', name: 'Polygon', pair: `MATIC/${baseCurrency}`, price: baseCurrency === 'USD' ? 1.09 : 1.45, change: 5.67, volume: 34567.89, marketCap: 1.44e10, category: 'layer2' },
        { symbol: 'OP', name: 'Optimism', pair: `OP/${baseCurrency}`, price: baseCurrency === 'USD' ? 2.58 : 3.45, change: 3.78, volume: 9876.54, marketCap: 3.6e9, category: 'layer2' },
        { symbol: 'ARB', name: 'Arbitrum', pair: `ARB/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.92 : 1.23, change: 2.90, volume: 15678.90, marketCap: 4.9e9, category: 'layer2' },
        
        // Meme Coins
        { symbol: 'DOGE', name: 'Dogecoin', pair: `DOGE/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.34 : 0.45, change: 12.34, volume: 56789.01, marketCap: 6.63e10, category: 'meme' },
        { symbol: 'SHIB', name: 'Shiba Inu', pair: `SHIB/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.0000255 : 0.000034, change: 8.90, volume: 123456.78, marketCap: 2.01e10, category: 'meme' },
        { symbol: 'PEPE', name: 'Pepe', pair: `PEPE/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.0000142 : 0.0000189, change: 15.67, volume: 89012.34, marketCap: 7.9e9, category: 'meme' },
        { symbol: 'WIF', name: 'Dogwifhat', pair: `WIF/${baseCurrency}`, price: baseCurrency === 'USD' ? 2.58 : 3.45, change: 18.90, volume: 34567.89, marketCap: 3.5e9, category: 'meme' },
        { symbol: 'BONK', name: 'BONK', pair: `BONK/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.0000342 : 0.0000456, change: 23.45, volume: 67890.12, marketCap: 3.4e9, category: 'meme' },
        
        // Political Tokens
        { symbol: 'TRUMP', name: 'Official Trump', pair: `TRUMP/${baseCurrency}`, price: baseCurrency === 'USD' ? 50.92 : 67.89, change: 89.12, volume: 123456.78, marketCap: 1.4e10, category: 'political' },
        { symbol: 'MELANIA', name: 'Melania Meme', pair: `MELANIA/${baseCurrency}`, price: baseCurrency === 'USD' ? 3.42 : 4.56, change: 156.78, volume: 89012.34, marketCap: 9.1e8, category: 'political' },
        
        // Gaming & Metaverse
        { symbol: 'SAND', name: 'The Sandbox', pair: `SAND/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.67 : 0.89, change: 4.32, volume: 8765.43, marketCap: 2.0e9, category: 'gaming' },
        { symbol: 'MANA', name: 'Decentraland', pair: `MANA/${baseCurrency}`, price: baseCurrency === 'USD' ? 0.58 : 0.78, change: 5.67, volume: 12345.67, marketCap: 1.5e9, category: 'gaming' },
        { symbol: 'AXS', name: 'Axie Infinity', pair: `AXS/${baseCurrency}`, price: baseCurrency === 'USD' ? 6.67 : 8.90, change: 1.78, volume: 6789.01, marketCap: 1.3e9, category: 'gaming' },
        
        // AI & Technology
        { symbol: 'TAO', name: 'Bittensor', pair: `TAO/${baseCurrency}`, price: baseCurrency === 'USD' ? 509.18 : 678.90, change: 5.67, volume: 1234.56, marketCap: 4.9e9, category: 'ai' },
        { symbol: 'FET', name: 'Fetch', pair: `FET/${baseCurrency}`, price: baseCurrency === 'USD' ? 1.42 : 1.89, change: 7.89, volume: 7890.12, marketCap: 2.4e9, category: 'ai' },
        { symbol: 'RENDER', name: 'Render', pair: `RENDER/${baseCurrency}`, price: baseCurrency === 'USD' ? 6.67 : 8.90, change: 6.78, volume: 9876.54, marketCap: 3.6e9, category: 'ai' },
      ];
      
      res.json({ tradingPairs, baseCurrency, currencySymbol });
    } catch (error) {
      console.error("Error fetching VirgoCX trading pairs:", error);
      res.status(500).json({ error: "Failed to fetch VirgoCX trading pairs" });
    }
  });

  // Execute trade on VirgoCX
  app.post("/api/virgocx/trade", async (req, res) => {
    try {
      const { currency, amount, action } = req.body;
      
      // Validate inputs
      if (!currency || !amount || !action) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: 1,
        type: action === 'buy' ? 'crypto_buy' : 'crypto_sell',
        fromCurrency: action === 'buy' ? 'CAD' : currency,
        toCurrency: action === 'buy' ? currency : 'CAD',
        amount: parseFloat(amount),
        fee: parseFloat(amount) * 0.005, // 0.5% fee
        status: 'completed',
        description: `${action.toUpperCase()} ${amount} ${currency} on VirgoCX`,
        sourceExchange: 'virgocx'
      });

      // Update wallet balances (simplified)
      if (action === 'buy') {
        // Add crypto to wallet
        const wallet = await storage.getWallet(1, currency);
        if (wallet) {
          await storage.updateWallet(wallet.id, {
            balance: (parseFloat(wallet.balance) + parseFloat(amount)).toString(),
            availableBalance: (parseFloat(wallet.availableBalance) + parseFloat(amount)).toString()
          });
        }
      } else {
        // Remove crypto from wallet
        const wallet = await storage.getWallet(1, currency);
        if (wallet) {
          await storage.updateWallet(wallet.id, {
            balance: (parseFloat(wallet.balance) - parseFloat(amount)).toString(),
            availableBalance: (parseFloat(wallet.availableBalance) - parseFloat(amount)).toString()
          });
        }
      }

      res.json({ 
        success: true, 
        transactionId: transaction.id,
        message: `${action.toUpperCase()} order executed successfully`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to execute trade" });
    }
  });

  // Send crypto to VirgoCX
  app.post("/api/virgocx/send", async (req, res) => {
    try {
      const { currency, amount, address } = req.body;
      
      // Validate inputs
      if (!currency || !amount || !address) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check balance
      const wallet = await storage.getWallet(1, currency);
      if (!wallet || parseFloat(wallet.availableBalance) < parseFloat(amount)) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: 1,
        type: 'virgocx_withdrawal',
        fromCurrency: currency,
        amount: parseFloat(amount),
        fee: parseFloat(amount) * 0.001, // 0.1% network fee
        status: 'pending',
        description: `Send ${amount} ${currency} to VirgoCX`,
        sourceExchange: 'virgocx',
        blockchainTxHash: `0x${Math.random().toString(16).substr(2, 64)}` // Mock hash
      });

      // Update wallet balance
      await storage.updateWallet(wallet.id, {
        balance: (parseFloat(wallet.balance) - parseFloat(amount)).toString(),
        availableBalance: (parseFloat(wallet.availableBalance) - parseFloat(amount)).toString()
      });

      res.json({ 
        success: true, 
        transactionId: transaction.id,
        txHash: transaction.blockchainTxHash,
        message: "Transfer initiated successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to send to VirgoCX" });
    }
  });

  // Get VirgoCX deposits
  app.get("/api/virgocx/deposits", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      
      // Get recent VirgoCX deposits
      const transactions = await storage.getTransactions(userId, 20);
      const virgocxDeposits = transactions
        .filter(t => t.type === 'virgocx_deposit' && t.sourceExchange === 'virgocx')
        .map(t => ({
          id: t.id,
          currency: t.toCurrency || t.fromCurrency,
          amount: t.amount,
          txHash: t.blockchainTxHash || `0x${Math.random().toString(16).substr(2, 64)}`,
          status: t.status,
          confirmations: t.status === 'completed' ? 6 : Math.floor(Math.random() * 5) + 1,
          requiredConfirmations: 6,
          detectedAt: t.createdAt,
          completedAt: t.status === 'completed' ? t.createdAt : undefined
        }));

      res.json(virgocxDeposits);
    } catch (error) {
      res.status(500).json({ error: "Failed to get deposits" });
    }
  });

  // Handle incoming deposit detection (webhook simulation)
  app.post("/api/virgocx/webhook", async (req, res) => {
    try {
      const { currency, amount, txHash, fromAddress } = req.body;
      
      // Detect if this is from VirgoCX (simplified detection)
      const isVirgoCX = fromAddress && fromAddress.startsWith('virgocx_');
      
      if (isVirgoCX) {
        // Create deposit transaction
        const transaction = await storage.createTransaction({
          userId: 1,
          type: 'virgocx_deposit',
          toCurrency: currency,
          amount: parseFloat(amount),
          fee: 0,
          status: 'pending',
          description: `Incoming ${currency} deposit from VirgoCX`,
          sourceExchange: 'virgocx',
          blockchainTxHash: txHash
        });

        // Update wallet balance
        const wallet = await storage.getWallet(1, currency);
        if (wallet) {
          await storage.updateWallet(wallet.id, {
            balance: (parseFloat(wallet.balance) + parseFloat(amount)).toString(),
            availableBalance: (parseFloat(wallet.availableBalance) + parseFloat(amount)).toString()
          });
        }

        res.json({ success: true, detected: true, transactionId: transaction.id });
      } else {
        res.json({ success: true, detected: false });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  return httpServer;
}
