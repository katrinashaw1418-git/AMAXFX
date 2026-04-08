import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/auth";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import WalletsNew from "@/pages/wallets-new";
import FxExchange from "@/pages/fx-exchange";
import Crypto from "@/pages/crypto";
import Transactions from "@/pages/transactions";
import Compliance from "@/pages/compliance";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import PrivacyPolicy from "@/pages/privacy-policy";
import Terms from "@/pages/terms";
import AmlPolicy from "@/pages/aml-policy";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import AdminCompliance from "@/pages/admin-compliance";
import { Loader2 } from "lucide-react";

function ProtectedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/dashboard"    component={Dashboard}    />
        <Route path="/wallets"      component={WalletsNew}   />
        <Route path="/fx-exchange"  component={FxExchange}   />
        <Route path="/crypto"       component={Crypto}       />
        <Route path="/transactions" component={Transactions} />
        <Route path="/compliance"   component={Compliance}   />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/"               component={Landing}        />
      <Route path="/privacy-policy" component={PrivacyPolicy}  />
      <Route path="/terms"          component={Terms}          />
      <Route path="/aml-policy"     component={AmlPolicy}      />
      <Route path="/admin-compliance" component={AdminCompliance} />
      <Route path="/login"          component={Login}          />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword}  />
      <Route component={ProtectedApp} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
