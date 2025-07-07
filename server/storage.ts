import { 
  users, wallets, portfolios, transactions, fxRates, aiRecommendations,
  type User, type InsertUser, type Wallet, type InsertWallet, 
  type Portfolio, type InsertPortfolio, type Transaction, type InsertTransaction,
  type FxRate, type InsertFxRate, type AiRecommendation, type InsertAiRecommendation
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Portfolios
  getPortfolio(userId: number): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(userId: number, portfolio: Partial<InsertPortfolio>): Promise<Portfolio | undefined>;

  // Wallets
  getWallets(userId: number): Promise<Wallet[]>;
  getWallet(userId: number, currency: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, wallet: Partial<InsertWallet>): Promise<Wallet | undefined>;

  // Transactions
  getTransactions(userId: number, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;

  // FX Rates
  getFxRates(): Promise<FxRate[]>;
  getFxRate(baseCurrency: string, targetCurrency: string): Promise<FxRate | undefined>;
  createFxRate(rate: InsertFxRate): Promise<FxRate>;
  updateFxRate(id: number, rate: Partial<InsertFxRate>): Promise<FxRate | undefined>;

  // AI Recommendations
  getAiRecommendations(userId: number): Promise<AiRecommendation[]>;
  createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation>;
  markRecommendationAsRead(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private portfolios: Map<number, Portfolio> = new Map();
  private wallets: Map<number, Wallet[]> = new Map();
  private transactions: Map<number, Transaction[]> = new Map();
  private fxRates: Map<string, FxRate> = new Map();
  private aiRecommendations: Map<number, AiRecommendation[]> = new Map();
  private currentUserId = 1;
  private currentPortfolioId = 1;
  private currentWalletId = 11;
  private currentTransactionId = 13;
  private currentFxRateId = 49;
  private currentAiRecommendationId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create demo user
    const demoUser: User = {
      id: 1,
      username: "johnchen",
      email: "john.chen@example.com",
      password: "hashed_password",
      firstName: "John",
      lastName: "Chen",
      kycStatus: "verified",
      userTier: "premium",
      createdAt: new Date(),
    };
    this.users.set(1, demoUser);

    // Create demo portfolio
    const demoPortfolio: Portfolio = {
      id: 1,
      userId: 1,
      totalValue: "4164500.00",
      cryptoValue: "1109500.00",
      fiatValue: "3055000.00",
      monthlyPnl: "47392.00",
      monthlyPnlPercent: "18.50",
      updatedAt: new Date(),
    };
    this.portfolios.set(1, demoPortfolio);

    // Create demo wallets
    const demoWallets: Wallet[] = [
      {
        id: 1,
        userId: 1,
        currency: "USD",
        balance: "67482.00",
        availableBalance: "67482.00",
        walletType: "fiat",
        updatedAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        currency: "CAD",
        balance: "89365.00",
        availableBalance: "89365.00",
        walletType: "fiat",
        updatedAt: new Date(),
      },
      {
        id: 3,
        userId: 1,
        currency: "EUR",
        balance: "45820.00",
        availableBalance: "45820.00",
        walletType: "fiat",
        updatedAt: new Date(),
      },
      {
        id: 4,
        userId: 1,
        currency: "GBP",
        balance: "38750.00",
        availableBalance: "38750.00",
        walletType: "fiat",
        updatedAt: new Date(),
      },
      {
        id: 5,
        userId: 1,
        currency: "AUD",
        balance: "72100.00",
        availableBalance: "72100.00",
        walletType: "fiat",
        updatedAt: new Date(),
      },
      {
        id: 6,
        userId: 1,
        currency: "HKD",
        balance: "285500.00",
        availableBalance: "285500.00",
        walletType: "fiat",
        updatedAt: new Date(),
      },
      {
        id: 7,
        userId: 1,
        currency: "BTC",
        balance: "12.5847",
        availableBalance: "12.5847",
        walletType: "crypto",
        updatedAt: new Date(),
      },
      {
        id: 8,
        userId: 1,
        currency: "ETH",
        balance: "85.2341",
        availableBalance: "85.2341",
        walletType: "crypto",
        updatedAt: new Date(),
      },
      {
        id: 9,
        userId: 1,
        currency: "USDT",
        balance: "125000.00",
        availableBalance: "125000.00",
        walletType: "crypto",
        updatedAt: new Date(),
      },
      {
        id: 10,
        userId: 1,
        currency: "USDC",
        balance: "89500.00",
        availableBalance: "89500.00",
        walletType: "crypto",
        updatedAt: new Date(),
      },
    ];
    this.wallets.set(1, demoWallets);

    // Create demo transactions
    const demoTransactions: Transaction[] = [
      {
        id: 1,
        userId: 1,
        type: "deposit",
        fromCurrency: null,
        toCurrency: "CAD",
        amount: "25000.00",
        fee: "0.00",
        exchangeRate: null,
        status: "completed",
        description: "Wire Transfer from Bank of Montreal",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        id: 2,
        userId: 1,
        type: "exchange",
        fromCurrency: "USD",
        toCurrency: "CAD",
        amount: "10000.00",
        fee: "50.00",
        exchangeRate: "1.3421",
        status: "completed",
        description: "USD to CAD Exchange",
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
      },
      {
        id: 3,
        userId: 1,
        type: "crypto_buy",
        fromCurrency: "USD",
        toCurrency: "BTC",
        amount: "0.5",
        fee: "25.00",
        exchangeRate: "43500.00",
        status: "completed",
        description: "Bitcoin Purchase",
        createdAt: new Date(Date.now() - 259200000), // 3 days ago
      },
      {
        id: 4,
        userId: 1,
        type: "transfer",
        fromCurrency: "USD",
        toCurrency: "USD",
        amount: "50000.00",
        fee: "25.00",
        exchangeRate: null,
        status: "pending",
        description: "International Wire to Hong Kong",
        createdAt: new Date(Date.now() - 345600000), // 4 days ago
      },
      {
        id: 5,
        userId: 1,
        type: "exchange",
        fromCurrency: "USD",
        toCurrency: "GBP",
        amount: "10000.00",
        fee: "25.00",
        exchangeRate: "0.7891",
        status: "completed",
        description: "Currency exchange USD to GBP",
        createdAt: new Date(Date.now() - 432000000), // 5 days ago
      },
      {
        id: 6,
        userId: 1,
        type: "exchange",
        fromCurrency: "CAD",
        toCurrency: "AUD",
        amount: "15000.00",
        fee: "35.00",
        exchangeRate: "1.1045",
        status: "completed",
        description: "Currency exchange CAD to AUD",
        createdAt: new Date(Date.now() - 518400000), // 6 days ago
      },
      {
        id: 7,
        userId: 1,
        type: "deposit",
        fromCurrency: null,
        toCurrency: "HKD",
        amount: "50000.00",
        fee: "0.00",
        exchangeRate: null,
        status: "completed",
        description: "Bank deposit from HSBC Hong Kong",
        createdAt: new Date(Date.now() - 604800000), // 7 days ago
      },
      {
        id: 8,
        userId: 1,
        type: "transfer",
        fromCurrency: "EUR",
        toCurrency: "GBP",
        amount: "5000.00",
        fee: "18.00",
        exchangeRate: "0.9249",
        status: "pending",
        description: "Cross-border transfer to UK",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        id: 9,
        userId: 1,
        type: "crypto_buy",
        fromCurrency: "USD",
        toCurrency: "USDT",
        amount: "25000.00",
        fee: "12.50",
        exchangeRate: "1.0000",
        status: "completed",
        description: "USD to USDT conversion",
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
      },
      {
        id: 10,
        userId: 1,
        type: "crypto_buy",
        fromCurrency: "USD",
        toCurrency: "USDC",
        amount: "15000.00",
        fee: "7.50",
        exchangeRate: "1.0000",
        status: "completed",
        description: "USD to USDC conversion",
        createdAt: new Date(Date.now() - 259200000), // 3 days ago
      },
      {
        id: 11,
        userId: 1,
        type: "crypto_deposit",
        fromCurrency: null,
        toCurrency: "USDT",
        amount: "50000.00",
        fee: "15.00",
        exchangeRate: null,
        status: "completed",
        description: "USDT deposit from external wallet",
        createdAt: new Date(Date.now() - 345600000), // 4 days ago
      },
      {
        id: 12,
        userId: 1,
        type: "stablecoin_swap",
        fromCurrency: "USDT",
        toCurrency: "USDC",
        amount: "10000.00",
        fee: "5.00",
        exchangeRate: "0.9998",
        status: "completed",
        description: "USDT to USDC swap",
        createdAt: new Date(Date.now() - 432000000), // 5 days ago
      },
    ];
    this.transactions.set(1, demoTransactions);

    // Create demo FX rates
    const demoFxRates: FxRate[] = [
      {
        id: 1,
        baseCurrency: "USD",
        targetCurrency: "CAD",
        rate: "1.3421",
        spread: "0.005",
        updatedAt: new Date(),
      },
      {
        id: 2,
        baseCurrency: "USD",
        targetCurrency: "EUR",
        rate: "0.8532",
        spread: "0.004",
        updatedAt: new Date(),
      },
      {
        id: 3,
        baseCurrency: "USD",
        targetCurrency: "GBP",
        rate: "0.7891",
        spread: "0.003",
        updatedAt: new Date(),
      },
      {
        id: 4,
        baseCurrency: "USD",
        targetCurrency: "AUD",
        rate: "1.4825",
        spread: "0.005",
        updatedAt: new Date(),
      },
      {
        id: 5,
        baseCurrency: "USD",
        targetCurrency: "HKD",
        rate: "7.8234",
        spread: "0.004",
        updatedAt: new Date(),
      },
      {
        id: 6,
        baseCurrency: "CAD",
        targetCurrency: "EUR",
        rate: "0.6354",
        spread: "0.006",
        updatedAt: new Date(),
      },
      {
        id: 7,
        baseCurrency: "CAD",
        targetCurrency: "GBP",
        rate: "0.5882",
        spread: "0.005",
        updatedAt: new Date(),
      },
      {
        id: 8,
        baseCurrency: "EUR",
        targetCurrency: "GBP",
        rate: "0.9249",
        spread: "0.004",
        updatedAt: new Date(),
      },
      {
        id: 9,
        baseCurrency: "GBP",
        targetCurrency: "AUD",
        rate: "1.8792",
        spread: "0.005",
        updatedAt: new Date(),
      },
      {
        id: 10,
        baseCurrency: "AUD",
        targetCurrency: "HKD",
        rate: "5.2758",
        spread: "0.006",
        updatedAt: new Date(),
      },
      // Stablecoin exchange rates
      {
        id: 11,
        baseCurrency: "USDT",
        targetCurrency: "USD",
        rate: "0.9998",
        spread: "0.001",
        updatedAt: new Date(),
      },
      {
        id: 12,
        baseCurrency: "USDC",
        targetCurrency: "USD",
        rate: "1.0001",
        spread: "0.001",
        updatedAt: new Date(),
      },
      {
        id: 13,
        baseCurrency: "USD",
        targetCurrency: "USDT",
        rate: "1.0002",
        spread: "0.001",
        updatedAt: new Date(),
      },
      {
        id: 14,
        baseCurrency: "USD",
        targetCurrency: "USDC",
        rate: "0.9999",
        spread: "0.001",
        updatedAt: new Date(),
      },
      {
        id: 15,
        baseCurrency: "USDT",
        targetCurrency: "USDC",
        rate: "1.0003",
        spread: "0.001",
        updatedAt: new Date(),
      },
      {
        id: 16,
        baseCurrency: "USDC",
        targetCurrency: "USDT",
        rate: "0.9997",
        spread: "0.001",
        updatedAt: new Date(),
      },
      // Stablecoin to other currencies
      {
        id: 17,
        baseCurrency: "USDT",
        targetCurrency: "CAD",
        rate: "1.3423",
        spread: "0.005",
        updatedAt: new Date(),
      },
      {
        id: 18,
        baseCurrency: "USDC",
        targetCurrency: "CAD",
        rate: "1.3420",
        spread: "0.005",
        updatedAt: new Date(),
      },
      {
        id: 19,
        baseCurrency: "USDT",
        targetCurrency: "EUR",
        rate: "0.8533",
        spread: "0.004",
        updatedAt: new Date(),
      },
      {
        id: 20,
        baseCurrency: "USDC",
        targetCurrency: "EUR",
        rate: "0.8531",
        spread: "0.004",
        updatedAt: new Date(),
      },
      // Bitcoin exchange rates
      {
        id: 21,
        baseCurrency: "BTC",
        targetCurrency: "USD",
        rate: "43250.00",
        spread: "0.01",
        updatedAt: new Date(),
      },
      {
        id: 22,
        baseCurrency: "USD",
        targetCurrency: "BTC",
        rate: "0.000023",
        spread: "0.01",
        updatedAt: new Date(),
      },
      {
        id: 23,
        baseCurrency: "BTC",
        targetCurrency: "CAD",
        rate: "58012.50",
        spread: "0.015",
        updatedAt: new Date(),
      },
      {
        id: 24,
        baseCurrency: "BTC",
        targetCurrency: "EUR",
        rate: "36890.25",
        spread: "0.015",
        updatedAt: new Date(),
      },
      {
        id: 25,
        baseCurrency: "BTC",
        targetCurrency: "GBP",
        rate: "34125.75",
        spread: "0.015",
        updatedAt: new Date(),
      },
      {
        id: 26,
        baseCurrency: "BTC",
        targetCurrency: "AUD",
        rate: "64090.00",
        spread: "0.015",
        updatedAt: new Date(),
      },
      {
        id: 27,
        baseCurrency: "BTC",
        targetCurrency: "HKD",
        rate: "338235.50",
        spread: "0.015",
        updatedAt: new Date(),
      },
      // Ethereum exchange rates
      {
        id: 28,
        baseCurrency: "ETH",
        targetCurrency: "USD",
        rate: "2580.00",
        spread: "0.008",
        updatedAt: new Date(),
      },
      {
        id: 29,
        baseCurrency: "USD",
        targetCurrency: "ETH",
        rate: "0.000388",
        spread: "0.008",
        updatedAt: new Date(),
      },
      {
        id: 30,
        baseCurrency: "ETH",
        targetCurrency: "CAD",
        rate: "3462.18",
        spread: "0.012",
        updatedAt: new Date(),
      },
      {
        id: 31,
        baseCurrency: "ETH",
        targetCurrency: "EUR",
        rate: "2201.30",
        spread: "0.012",
        updatedAt: new Date(),
      },
      {
        id: 32,
        baseCurrency: "ETH",
        targetCurrency: "GBP",
        rate: "2035.86",
        spread: "0.012",
        updatedAt: new Date(),
      },
      // BTC to ETH and vice versa
      {
        id: 33,
        baseCurrency: "BTC",
        targetCurrency: "ETH",
        rate: "16.76",
        spread: "0.02",
        updatedAt: new Date(),
      },
      {
        id: 34,
        baseCurrency: "ETH",
        targetCurrency: "BTC",
        rate: "0.0597",
        spread: "0.02",
        updatedAt: new Date(),
      },
      // Stablecoin to crypto rates
      {
        id: 35,
        baseCurrency: "USDT",
        targetCurrency: "BTC",
        rate: "0.000023",
        spread: "0.01",
        updatedAt: new Date(),
      },
      {
        id: 36,
        baseCurrency: "USDT",
        targetCurrency: "ETH",
        rate: "0.000388",
        spread: "0.008",
        updatedAt: new Date(),
      },
      {
        id: 37,
        baseCurrency: "USDC",
        targetCurrency: "BTC",
        rate: "0.000023",
        spread: "0.01",
        updatedAt: new Date(),
      },
      {
        id: 38,
        baseCurrency: "USDC",
        targetCurrency: "ETH",
        rate: "0.000388",
        spread: "0.008",
        updatedAt: new Date(),
      },
      // Reverse crypto to stablecoin rates
      {
        id: 39,
        baseCurrency: "BTC",
        targetCurrency: "USDT",
        rate: "43248.00",
        spread: "0.01",
        updatedAt: new Date(),
      },
      {
        id: 40,
        baseCurrency: "BTC",
        targetCurrency: "USDC",
        rate: "43252.00",
        spread: "0.01",
        updatedAt: new Date(),
      },
      {
        id: 41,
        baseCurrency: "ETH",
        targetCurrency: "USDT",
        rate: "2578.50",
        spread: "0.008",
        updatedAt: new Date(),
      },
      {
        id: 42,
        baseCurrency: "ETH",
        targetCurrency: "USDC",
        rate: "2581.50",
        spread: "0.008",
        updatedAt: new Date(),
      },
      // Additional stablecoin to fiat rates
      {
        id: 43,
        baseCurrency: "USDT",
        targetCurrency: "GBP",
        rate: "0.7893",
        spread: "0.003",
        updatedAt: new Date(),
      },
      {
        id: 44,
        baseCurrency: "USDT",
        targetCurrency: "AUD",
        rate: "1.4827",
        spread: "0.005",
        updatedAt: new Date(),
      },
      {
        id: 45,
        baseCurrency: "USDT",
        targetCurrency: "HKD",
        rate: "7.8236",
        spread: "0.004",
        updatedAt: new Date(),
      },
      {
        id: 46,
        baseCurrency: "USDC",
        targetCurrency: "GBP",
        rate: "0.7890",
        spread: "0.003",
        updatedAt: new Date(),
      },
      {
        id: 47,
        baseCurrency: "USDC",
        targetCurrency: "AUD",
        rate: "1.4823",
        spread: "0.005",
        updatedAt: new Date(),
      },
      {
        id: 48,
        baseCurrency: "USDC",
        targetCurrency: "HKD",
        rate: "7.8232",
        spread: "0.004",
        updatedAt: new Date(),
      },
    ];
    
    demoFxRates.forEach(rate => {
      this.fxRates.set(`${rate.baseCurrency}-${rate.targetCurrency}`, rate);
    });

    // Create demo AI recommendations
    const demoRecommendations: AiRecommendation[] = [
      {
        id: 1,
        userId: 1,
        type: "rebalancing",
        title: "Rebalancing Suggestion",
        description: "Consider reducing crypto allocation by 5% and increasing fixed income exposure for better risk-adjusted returns.",
        severity: "info",
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        type: "opportunity",
        title: "Opportunity Alert",
        description: "Canadian bond yields are attractive. Consider 10-15% allocation to CAD government bonds.",
        severity: "info",
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 3,
        userId: 1,
        type: "risk_warning",
        title: "Risk Warning",
        description: "High correlation between your tech stocks and crypto holdings. Diversification recommended.",
        severity: "warning",
        isRead: false,
        createdAt: new Date(),
      },
    ];
    this.aiRecommendations.set(1, demoRecommendations);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      kycStatus: insertUser.kycStatus || "pending",
      userTier: insertUser.userTier || "standard",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Portfolio methods
  async getPortfolio(userId: number): Promise<Portfolio | undefined> {
    return Array.from(this.portfolios.values()).find(portfolio => portfolio.userId === userId);
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = this.currentPortfolioId++;
    const portfolio: Portfolio = {
      ...insertPortfolio,
      id,
      updatedAt: new Date(),
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async updatePortfolio(userId: number, updatePortfolio: Partial<InsertPortfolio>): Promise<Portfolio | undefined> {
    const portfolio = Array.from(this.portfolios.values()).find(p => p.userId === userId);
    if (!portfolio) return undefined;
    
    const updatedPortfolio = { ...portfolio, ...updatePortfolio, updatedAt: new Date() };
    this.portfolios.set(portfolio.id, updatedPortfolio);
    return updatedPortfolio;
  }

  // Wallet methods
  async getWallets(userId: number): Promise<Wallet[]> {
    return this.wallets.get(userId) || [];
  }

  async getWallet(userId: number, currency: string): Promise<Wallet | undefined> {
    const userWallets = this.wallets.get(userId) || [];
    return userWallets.find(wallet => wallet.currency === currency);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.currentWalletId++;
    const wallet: Wallet = {
      ...insertWallet,
      id,
      updatedAt: new Date(),
    };
    
    const userWallets = this.wallets.get(insertWallet.userId) || [];
    userWallets.push(wallet);
    this.wallets.set(insertWallet.userId, userWallets);
    
    return wallet;
  }

  async updateWallet(id: number, updateWallet: Partial<InsertWallet>): Promise<Wallet | undefined> {
    for (const [userId, userWallets] of Array.from(this.wallets.entries())) {
      const walletIndex = userWallets.findIndex((w: Wallet) => w.id === id);
      if (walletIndex !== -1) {
        const updatedWallet = { ...userWallets[walletIndex], ...updateWallet, updatedAt: new Date() };
        userWallets[walletIndex] = updatedWallet;
        this.wallets.set(userId, userWallets);
        return updatedWallet;
      }
    }
    return undefined;
  }

  // Transaction methods
  async getTransactions(userId: number, limit?: number): Promise<Transaction[]> {
    const userTransactions = this.transactions.get(userId) || [];
    return limit ? userTransactions.slice(0, limit) : userTransactions;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      id,
      userId: insertTransaction.userId,
      type: insertTransaction.type,
      fromCurrency: insertTransaction.fromCurrency || null,
      toCurrency: insertTransaction.toCurrency || null,
      amount: insertTransaction.amount,
      fee: insertTransaction.fee,
      exchangeRate: insertTransaction.exchangeRate || null,
      status: insertTransaction.status,
      description: insertTransaction.description,
      createdAt: new Date(),
    };
    
    const userTransactions = this.transactions.get(insertTransaction.userId) || [];
    userTransactions.unshift(transaction); // Add to beginning for newest first
    this.transactions.set(insertTransaction.userId, userTransactions);
    
    return transaction;
  }

  async updateTransaction(id: number, updateTransaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    for (const [userId, userTransactions] of Array.from(this.transactions.entries())) {
      const transactionIndex = userTransactions.findIndex((t: Transaction) => t.id === id);
      if (transactionIndex !== -1) {
        const updatedTransaction = { ...userTransactions[transactionIndex], ...updateTransaction };
        userTransactions[transactionIndex] = updatedTransaction;
        this.transactions.set(userId, userTransactions);
        return updatedTransaction;
      }
    }
    return undefined;
  }

  // FX Rate methods
  async getFxRates(): Promise<FxRate[]> {
    return Array.from(this.fxRates.values());
  }

  async getFxRate(baseCurrency: string, targetCurrency: string): Promise<FxRate | undefined> {
    return this.fxRates.get(`${baseCurrency}-${targetCurrency}`);
  }

  async createFxRate(insertFxRate: InsertFxRate): Promise<FxRate> {
    const id = this.currentFxRateId++;
    const fxRate: FxRate = {
      ...insertFxRate,
      id,
      updatedAt: new Date(),
    };
    
    this.fxRates.set(`${fxRate.baseCurrency}-${fxRate.targetCurrency}`, fxRate);
    return fxRate;
  }

  async updateFxRate(id: number, updateFxRate: Partial<InsertFxRate>): Promise<FxRate | undefined> {
    for (const [key, fxRate] of Array.from(this.fxRates.entries())) {
      if (fxRate.id === id) {
        const updatedFxRate = { ...fxRate, ...updateFxRate, updatedAt: new Date() };
        this.fxRates.set(key, updatedFxRate);
        return updatedFxRate;
      }
    }
    return undefined;
  }

  // AI Recommendation methods
  async getAiRecommendations(userId: number): Promise<AiRecommendation[]> {
    return this.aiRecommendations.get(userId) || [];
  }

  async createAiRecommendation(insertRecommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    const id = this.currentAiRecommendationId++;
    const recommendation: AiRecommendation = {
      id,
      userId: insertRecommendation.userId,
      type: insertRecommendation.type,
      title: insertRecommendation.title,
      description: insertRecommendation.description,
      severity: insertRecommendation.severity,
      isRead: insertRecommendation.isRead || false,
      createdAt: new Date(),
    };
    
    const userRecommendations = this.aiRecommendations.get(insertRecommendation.userId) || [];
    userRecommendations.unshift(recommendation); // Add to beginning for newest first
    this.aiRecommendations.set(insertRecommendation.userId, userRecommendations);
    
    return recommendation;
  }

  async markRecommendationAsRead(id: number): Promise<void> {
    for (const [userId, userRecommendations] of Array.from(this.aiRecommendations.entries())) {
      const recommendationIndex = userRecommendations.findIndex((r: AiRecommendation) => r.id === id);
      if (recommendationIndex !== -1) {
        userRecommendations[recommendationIndex].isRead = true;
        this.aiRecommendations.set(userId, userRecommendations);
        break;
      }
    }
  }
}

export const storage = new MemStorage();
