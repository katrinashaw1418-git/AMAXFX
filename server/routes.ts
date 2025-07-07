import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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
      const portfolio = await storage.getPortfolio(1);
      if (!portfolio) {
        return res.status(404).json({ error: "Portfolio not found" });
      }
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ error: "Failed to get portfolio" });
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

  // Create FX exchange transaction
  app.post("/api/fx-exchange", async (req, res) => {
    try {
      const { fromCurrency, toCurrency, amount } = req.body;
      
      if (!fromCurrency || !toCurrency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const rate = await storage.getFxRate(fromCurrency, toCurrency);
      if (!rate) {
        return res.status(400).json({ error: "Exchange rate not available" });
      }

      const exchangeRate = parseFloat(rate.rate);
      const spread = parseFloat(rate.spread);
      const fee = parseFloat(amount) * spread;
      const convertedAmount = parseFloat(amount) * exchangeRate;

      const transaction = await storage.createTransaction({
        userId: 1,
        type: "exchange",
        fromCurrency,
        toCurrency,
        amount: amount.toString(),
        fee: fee.toString(),
        exchangeRate: exchangeRate.toString(),
        status: "completed",
        description: `${fromCurrency} to ${toCurrency} Exchange`,
      });

      res.json({
        transaction,
        convertedAmount,
        exchangeRate,
        fee,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process FX exchange" });
    }
  });

  // Create deposit transaction
  app.post("/api/deposit", async (req, res) => {
    try {
      const { currency, amount, description } = req.body;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transaction = await storage.createTransaction({
        userId: 1,
        type: "deposit",
        fromCurrency: null,
        toCurrency: currency,
        amount: amount.toString(),
        fee: "0.00",
        exchangeRate: null,
        status: "pending",
        description: description || `${currency} Deposit`,
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  // Create withdrawal transaction
  app.post("/api/withdraw", async (req, res) => {
    try {
      const { currency, amount, description } = req.body;
      
      if (!currency || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const transaction = await storage.createTransaction({
        userId: 1,
        type: "withdrawal",
        fromCurrency: currency,
        toCurrency: null,
        amount: amount.toString(),
        fee: "25.00",
        exchangeRate: null,
        status: "pending",
        description: description || `${currency} Withdrawal`,
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

  return httpServer;
}
