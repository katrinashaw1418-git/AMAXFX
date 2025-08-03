import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import WalletsNew from "@/pages/wallets-new";
import FxExchange from "@/pages/fx-exchange";
import Portfolio from "@/pages/portfolio";
import AiAdvisory from "@/pages/ai-advisory";
import Transactions from "@/pages/transactions";
import Compliance from "@/pages/compliance";
import Investments from "@/pages/investments";
import FundInvestments from "@/pages/fund-investments";
import CryptoTrading from "@/pages/crypto-trading";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/wallets" component={WalletsNew} />
        <Route path="/fx-exchange" component={FxExchange} />
        <Route path="/portfolio" component={Portfolio} />
        <Route path="/ai-advisory" component={AiAdvisory} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/compliance" component={Compliance} />
        <Route path="/investments" component={Investments} />
        <Route path="/fund-investments" component={FundInvestments} />
        <Route path="/crypto-trading" component={CryptoTrading} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
