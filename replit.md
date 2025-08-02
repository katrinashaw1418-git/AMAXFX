# Wealth Management Platform

## Overview
This platform is a comprehensive cross-border wealth management solution designed for high-net-worth individuals, the global Chinese diaspora, and SMEs with international financial needs. It integrates traditional finance and cryptocurrency services, offering dual-channel support for FX and crypto trading, multi-currency wallets, AI-powered wealth advisory, and robust compliance features. The vision is to provide a unified, intelligent, and secure platform for managing diverse global assets.

## Recent Changes (August 2025)
- **1 Cent Discrepancy RESOLVED**: Fixed critical precision issue where Portfolio API returned $1,966,908.85 instead of correct $1,966,908.84
- **Perfect API Consistency**: All endpoints now return identical values - Portfolio API, User Investments API, and Investment Performance API all unified
- **Precision Calculation Fix**: Added proper rounding (Math.round() * 100 / 100) to calculateInvestmentPerformance() function for consistent 2-decimal precision
- **Unified Calculation System**: Both endpoints now use same calculateInvestmentPerformance() function for real-time accuracy
- **Frontend Integration Success**: Dashboard wealth overview now displays actual investment performance ($116,908.84 / 6.32%) instead of hardcoded values
- **Real-Time Performance Tracking**: Investment performance refreshes every 5 seconds with automatic midpoint IRR calculations
- **Database Independence**: Removed dependency on stored database values, all calculations now computed in real-time
- **Midpoint IRR Implementation Complete**: Successfully implemented consistent midpoint IRR calculation methodology across entire platform
- **7-Year Projection System**: Implemented detailed 7-year compound growth projections using midpoint IRR rates for long-term planning
- **Bitcoin Conservative Approach**: Switched Bitcoin Tracker Fund from 60% market rate to 15% midpoint IRR for consistent portfolio methodology
- **Portfolio Totals**: Current portfolio shows $1,850,000 invested with $116,908.84 return (6.32%) across 7 investments using real-time calculations
- **Midpoint IRR Rates**: All investments use consistent rates (Real Estate 11%, Corporate Credit 11%, VC 18%, Bitcoin 15%, Ethereum 5.75%)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (server state), React hooks (local state)
- **Routing**: Wouter
- **Charts**: Recharts
- **Form Management**: React Hook Form
- **Accessibility**: Comprehensive voice narration system

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (using Neon Database serverless)
- **API Design**: RESTful endpoints with typed responses
- **Session Management**: PostgreSQL-based sessions

### Core Features
- **User Management**: KYC tracking, multi-tier user system, role-based access control.
- **Multi-Currency Wallet**: Supports fiat (USD, CAD, EUR, GBP, AUD, HKD, SGD, VND and 50+ other global currencies), BTC, ETH, USDT, USDC. Features balance tracking, real-time updates, and cross-border remittance.
- **Portfolio Management**: Unified view across fiat and crypto, performance tracking, asset allocation visualization, historical charts. Performance charts include connected dot visualization, color coding (red for portfolio, blue for benchmark), and clear legends. Asset allocation colors for Investment Products (purple), Crypto Assets (red), Stablecoins (light gray), Corporate Credit (light gray), Real Estate (brown), Cash Deposits (blue).
- **FX & Crypto Trading**: Real-time exchange rates, FX trading, integrated crypto trading (via VirgoCX), order execution tracking. Crypto trading includes 100+ cryptocurrencies, market trends dashboard, and advanced trading interface.
- **AI Advisory System**: Risk profiling, portfolio rebalancing, investment opportunity alerts, personalized insights.
- **Compliance & KYC**: Multi-step KYC, document verification, risk assessment, jurisdiction-specific flows.
- **Transaction Management**: Comprehensive history for deposits, withdrawals, exchanges, transfers; real-time status tracking.
- **Investment Products**: Structured investment products across Real Estate, Corporate Credit, Venture Capital, and Digital Assets (Bitcoin Tracker, Web3 Innovation, Ethereum Staking). Includes filtering, detailed product info, and capital invested tracking.
- **Banking Integration**: Supports various deposit options including Credit/Debit Card, PayID (Australia Only), Bank Transfer, and Blockchain Transfer for crypto/stablecoins.
- **Transfer/Conversion System**: Wise-inspired interface with two-section layout ("Your Balances" table, "Transfer or Convert" interface). Supports 50+ exchange rate pairs, real-time rates, 0.5% transaction fees, automatic wallet creation for new currencies, and zero-balance wallet hiding. Crypto currencies always appear at bottom of the table.
- **Contact Advisor**: Floating contact box with phone number and message functionality on key pages.

### System Design Choices
- **Monorepo Structure**: Client, server, and shared code within a single repository.
- **Scalability**: Serverless PostgreSQL, stateless Express server, CDN-ready static assets, TanStack Query caching.
- **Branding**: AMAX Wealth Platform for the main platform, VirgoCX specifically for the crypto trading section.

## External Dependencies
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Date Utilities**: date-fns
- **Crypto Exchange Integration**: VirgoCX API
- **Planned Integrations**: Third-party KYC/AML services, institutional custody services (Fireblocks, BitGo), traditional banking rails.