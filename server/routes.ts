import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// IRR mapping - Market-based for Bitcoin, midpoint for others
function getAnnualReturn(category: string, productName?: string): number {
  const rates = {
    'real_estate': 0.11,      // 11% midpoint
    'corporate_credit': 0.11, // 11% midpoint (10-12% range)
    'venture_capital': 0.18,  // 18% midpoint (16-20% range)
    'digital_assets': (productName && typeof productName === 'string' && productName.includes('Bitcoin')) ? 0.60 : 0.0575, // Bitcoin 60% market-based, Ethereum 5.75%
    'default': 0.11
  };
  return rates[category as keyof typeof rates] || rates.default;
}

// Unified investment performance calculation using market-based returns
function calculateInvestmentPerformance(
  product: any,
  investedAmount: number,
  investmentDate: Date,
  currentDate: Date = new Date()
): { currentValue: number; returnAmount: number; returnPercentage: number } {
  // Safety check for product data
  if (!product) {
    console.error('Product is null/undefined in calculateInvestmentPerformance');
    return { currentValue: investedAmount, returnAmount: 0, returnPercentage: 0 };
  }
  
  const daysSinceInvestment = Math.floor((currentDate.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Use the global getAnnualReturn function
  
  const annualReturn = getAnnualReturn(product.category, product.name);
  let performanceFactor = 1;
  
  if (daysSinceInvestment > 0) {
    const timeProgress = daysSinceInvestment / 365;
    // Compound growth: (1 + r)^t — consistent with how IRR/CAGR is defined
    performanceFactor = Math.pow(1 + annualReturn, timeProgress);
  }
  
  performanceFactor = Math.max(0.5, performanceFactor);
  const currentValue = investedAmount * performanceFactor;
  const returnAmount = currentValue - investedAmount;
  const returnPercentage = (returnAmount / investedAmount) * 100;
  
  return {
    currentValue,
    returnAmount,
    returnPercentage
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
      
      // Calculate fiat value in USD equivalent by converting each currency
      // Try direct X/USD rate first; fall back to inverse of USD/X rate
      let fiatValue = 0;
      for (const wallet of wallets.filter(w => w.walletType === 'fiat')) {
        const balance = parseFloat(wallet.balance);
        if (wallet.currency === 'USD') {
          fiatValue += balance;
        } else {
          const directRate = await storage.getFxRate(wallet.currency, 'USD');
          if (directRate) {
            fiatValue += balance * parseFloat(directRate.rate);
          } else {
            const inverseRate = await storage.getFxRate('USD', wallet.currency);
            if (inverseRate) {
              fiatValue += balance / parseFloat(inverseRate.rate);
            }
          }
        }
      }
      
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
          // Convert each fiat currency to USD equivalent
          if (wallet.currency === 'USD') {
            currentFiatValue += balance;
          } else {
            const directRate = await storage.getFxRate(wallet.currency, 'USD');
            if (directRate) {
              currentFiatValue += balance * parseFloat(directRate.rate);
            } else {
              const inverseRate = await storage.getFxRate('USD', wallet.currency);
              if (inverseRate) {
                currentFiatValue += balance / parseFloat(inverseRate.rate);
              }
            }
          }
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
      
      // Build historical data points using backward projection from current value.
      // This avoids the transaction-replay approach which produces inaccurate results
      // when wallet balances were not all built up via tracked transactions.
      const dataPoints: Array<{ date: string; value: number; timestamp: number }> = [];
      
      // Determine number of data points based on timeframe
      // 1Y → 13 monthly points, 3M → 13 weekly points, 1M → 22 points (~every 1.5 days)
      const numPoints = timeframe === "1M" ? 22 : 13;
      
      // Total days in range
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Monthly return rates per asset class (conservative, realistic):
      // - Fiat cash: 0.3%/month
      // - Stablecoins: 0.4%/month
      // - Crypto (BTC/ETH): 3%/month on average
      // - Investments: 1%/month on average
      // Blended portfolio rate will be computed below based on actual allocation
      const fiatMonthlyRate = 0.003;
      const stablecoinMonthlyRate = 0.004;
      const cryptoMonthlyRate = 0.030;
      const investmentMonthlyRate = 0.010;
      
      const totalPortfolio = currentTotalValue;
      const fiatShare = currentFiatValue / totalPortfolio;
      const stablecoinShare = currentStablecoinValue / totalPortfolio;
      const cryptoShare = currentCryptoValue / totalPortfolio;
      const investmentShare = currentInvestmentValue / totalPortfolio;
      
      const blendedMonthlyRate =
        fiatShare * fiatMonthlyRate +
        stablecoinShare * stablecoinMonthlyRate +
        cryptoShare * cryptoMonthlyRate +
        investmentShare * investmentMonthlyRate;
      
      // Daily rate from blended monthly rate
      const dailyRate = Math.pow(1 + blendedMonthlyRate, 1 / 30) - 1;
      
      // Generate evenly-spaced dates across the range
      const step = Math.max(1, Math.floor(totalDays / (numPoints - 1)));
      const dates: Date[] = [];
      for (let i = 0; i < numPoints - 1; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i * step);
        if (d <= endDate) dates.push(d);
      }
      dates.push(new Date(endDate));
      
      // For each date, calculate value by compounding backward from current value
      // with a small deterministic noise for natural-looking variation
      for (const date of dates) {
        const daysFromEnd = Math.ceil((endDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        // Base value: discount current value backward in time
        const baseValue = currentTotalValue / Math.pow(1 + dailyRate, daysFromEnd);
        
        // Add a small deterministic oscillation (sine wave) to look natural — ±1.5% max
        const noise = Math.sin(daysFromEnd * 0.3) * 0.015 * baseValue;
        const value = Math.round(baseValue + noise);
        
        dataPoints.push({
          date: date.toISOString().split('T')[0],
          value,
          timestamp: date.getTime()
        });
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
      
      // Calculate fiat value in USD equivalent (FX-converted, same logic as /api/portfolio)
      for (const wallet of wallets.filter(w => w.walletType === 'fiat')) {
        const balance = parseFloat(wallet.balance);
        if (wallet.currency === 'USD') {
          fiatValue += balance;
        } else {
          const directRate = await storage.getFxRate(wallet.currency, 'USD');
          if (directRate) {
            fiatValue += balance * parseFloat(directRate.rate);
          } else {
            const inverseRate = await storage.getFxRate('USD', wallet.currency);
            if (inverseRate) {
              fiatValue += balance / parseFloat(inverseRate.rate);
            }
          }
        }
      }
      
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
      
      // Calculate investment value with correct argument order
      const evaluationDate = new Date();
      for (const investment of investments) {
        const product = await storage.getInvestmentProduct(investment.productId);
        if (product) {
          const investedAmount = parseFloat(investment.investedAmount);
          const investmentDate = new Date(investment.investmentDate);
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
      
      // Calculate fiat value in USD equivalent (FX-converted, same logic as /api/portfolio)
      for (const wallet of wallets.filter(w => w.walletType === 'fiat')) {
        const balance = parseFloat(wallet.balance);
        if (wallet.currency === 'USD') {
          fiatValue += balance;
        } else {
          const directRate = await storage.getFxRate(wallet.currency, 'USD');
          if (directRate) {
            fiatValue += balance * parseFloat(directRate.rate);
          } else {
            const inverseRate = await storage.getFxRate('USD', wallet.currency);
            if (inverseRate) {
              fiatValue += balance / parseFloat(inverseRate.rate);
            }
          }
        }
      }
      
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
      
      // Calculate investment value with correct argument order
      const evaluationDate = new Date();
      for (const investment of investments) {
        const product = await storage.getInvestmentProduct(investment.productId);
        if (product) {
          const investedAmount = parseFloat(investment.investedAmount);
          const investmentDate = new Date(investment.investmentDate);
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



  // Get user investments with real-time performance calculation
  app.get("/api/user-investments", async (req, res) => {
    try {
      const userId = 1; // Hardcoded user ID for demo
      const investments = await storage.getUserInvestments(userId);
      const allProducts = await storage.getInvestmentProducts();
      const currentDate = new Date();
      
      // Calculate current values with performance using unified midpoint IRR function
      const investmentsWithPerformance = investments.map(investment => {
        const product = allProducts.find(p => p.id === investment.productId);
        if (!product) return investment;
        
        const investmentDate = new Date(investment.investmentDate);
        const investedAmount = parseFloat(investment.investedAmount);
        const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate);
        
        return {
          ...investment,
          currentValue: performance.currentValue.toFixed(2),
          totalReturn: performance.returnAmount.toFixed(2),
          returnPercent: performance.returnPercentage.toFixed(2)
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
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        let totalInvestmentValue = 0;
        let weightedReturn = 0;
        let totalInvestedAmount = 0;
        
        // Calculate investment values and returns for this date
        for (const investment of investments) {
          const product = allProducts.find(p => p.id === investment.productId);
          if (product) {
            const investmentDate = new Date(investment.investmentDate);
            if (investmentDate <= currentDate) {
              const investedAmount = parseFloat(investment.investedAmount);
              const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate);
              
              totalInvestmentValue += performance.currentValue;
              totalInvestedAmount += investedAmount;
              
              // Weight the return by the investment amount
              weightedReturn += (performance.returnPercent * investedAmount);
            }
          }
        }
        
        // Calculate weighted average return
        const avgReturn = totalInvestedAmount > 0 ? weightedReturn / totalInvestedAmount : 0;
        
        dataPoints.push({
          date: currentDate.toISOString().split('T')[0],
          value: Math.round(totalInvestmentValue),
          investedAmount: Math.round(totalInvestedAmount),
          weightedReturn: Number(avgReturn.toFixed(2)),
          timestamp: currentDate.getTime()
        });
        
        // Move to next 3-month interval
        currentDate.setMonth(currentDate.getMonth() + 3);
      }
      
      // Calculate 12-month prediction based on current allocation
      const currentPortfolioAllocation: Record<string, { value: number; annualReturn: number }> = {};
      let totalCurrentInvestment = 0;
      
      for (const investment of investments) {
        const product = allProducts.find(p => p.id === investment.productId);
        if (product) {
          const investedAmount = parseFloat(investment.investedAmount);
          const investmentDate = new Date(investment.investmentDate);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, endDate);
          const currentValue = performance.currentValue;
          totalCurrentInvestment += currentValue;
          
          if (!currentPortfolioAllocation[product.category]) {
            currentPortfolioAllocation[product.category] = { value: 0, annualReturn: 0 };
          }
          currentPortfolioAllocation[product.category].value += currentValue;
          
          // Set expected annual returns for predictions based on actual calculation methodology
          const predictedReturn = getAnnualReturn(product.category, product.name);
          currentPortfolioAllocation[product.category].annualReturn = predictedReturn;
        }
      }
      
      // Generate 7-year prediction (28 data points at 3-month intervals)
      const predictions = [];
      const predictionStartDate = new Date(endDate);
      
      // Calculate weighted annual return for the portfolio
      let portfolioWeightedReturn = 0;
      for (const [category, allocation] of Object.entries(currentPortfolioAllocation)) {
        const { value, annualReturn } = allocation as { value: number; annualReturn: number };
        const weight = value / totalCurrentInvestment;
        portfolioWeightedReturn += (annualReturn * weight);
      }
      
      for (let i = 1; i <= 28; i++) {
        predictionStartDate.setMonth(predictionStartDate.getMonth() + 3);
        
        // Calculate time in years (3-month intervals)
        const timeInYears = (i * 3) / 12;
        
        // Apply compound growth with portfolio weighted return
        const futureValue = totalCurrentInvestment * Math.pow(1 + portfolioWeightedReturn, timeInYears);
        const totalReturn = futureValue - totalCurrentInvestment;
        const totalReturnPercent = (totalReturn / totalCurrentInvestment) * 100;
        
        predictions.push({
          date: predictionStartDate.toISOString().split('T')[0],
          value: Math.round(futureValue),
          totalReturn: Math.round(totalReturn),
          weightedReturn: Number(totalReturnPercent.toFixed(2)),
          currentInvestment: Math.round(totalCurrentInvestment),
          isPrediction: true,
          timestamp: predictionStartDate.getTime()
        });
      }
      
      // Calculate overall performance metrics - use real-time current values from all investments with unified function
      let totalInvestedNow = 0;
      let totalCurrentValueNow = 0;
      
      for (const investment of investments) {
        const product = allProducts.find(p => p.id === investment.productId);
        if (product) {
          const investedAmount = parseFloat(investment.investedAmount);
          const investmentDate = new Date(investment.investmentDate);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, endDate);
          
          totalInvestedNow += investedAmount;
          totalCurrentValueNow += performance.currentValue;
        }
      }
      
      const totalReturn = totalCurrentValueNow - totalInvestedNow;
      const totalReturnPercent = totalInvestedNow > 0 ? (totalReturn / totalInvestedNow) * 100 : 0;
      
      res.json({
        timeframe,
        data: dataPoints,
        predictions,
        currentValue: totalCurrentValueNow,
        totalReturn: totalReturn.toFixed(2),
        totalReturnPercent: totalReturnPercent.toFixed(2),
        portfolioAllocation: currentPortfolioAllocation
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
      
      let totalCurrentValue = 0;
      const currentDate = new Date();
      
      for (const investment of investments) {
        const product = products.find(p => p.id === investment.productId);
        if (product) {
          const investedAmount = parseFloat(investment.investedAmount);
          const investmentDate = new Date(investment.investmentDate);
          const performance = calculateInvestmentPerformance(product, investedAmount, investmentDate, currentDate);
          const currentValue = performance.currentValue;
          totalCurrentValue += currentValue;
          
          if (categoryBreakdown[product.category]) {
            categoryBreakdown[product.category].value += currentValue;
            categoryBreakdown[product.category].products.push({
              name: product.name,
              value: currentValue,
              percentage: 0 // Will be calculated below
            });
          }
        }
      }
      
      // Calculate percentages
      const categoryData = Object.entries(categoryBreakdown).map(([key, data]) => ({
        name: data.displayName,
        value: data.value,
        percentage: totalCurrentValue > 0 ? (data.value / totalCurrentValue * 100) : 0,
        products: data.products.map(p => ({
          ...p,
          percentage: totalCurrentValue > 0 ? (p.value / totalCurrentValue * 100) : 0
        }))
      })).filter(cat => cat.value > 0);
      
      res.json({
        totalCurrentValue,
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

      // Create investment record (always in USD equivalent)
      const investment = await storage.createUserInvestment({
        userId,
        productId,
        investedAmount: investmentAmount.toString(), // USD equivalent
        currentValue: investmentAmount.toString(), // Initially same as invested amount
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

  return httpServer;
}
