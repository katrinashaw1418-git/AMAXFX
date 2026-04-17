import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Home,
  Wallet,
  History,
  Shield,
  User,
  ChevronRight,
  ArrowRightLeft,
  Bitcoin,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAVY = "#002366";

const navigation = [
  { name: "Dashboard",                      href: "/dashboard",    icon: Home           },
  { name: "Transfer In / Transfer Out",     href: "/wallets",      icon: Wallet         },
  { name: "FX Conversion",                  href: "/fx-exchange",  icon: ArrowRightLeft },
  { name: "Digital Asset Exchange",         href: "/crypto",       icon: Bitcoin        },
  { name: "Transactions",                   href: "/transactions", icon: History        },
  { name: "Compliance",                     href: "/compliance",   icon: Shield         },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  function handleNav(href: string) {
    navigate(href);
    onNavClick?.();
  }

  return (
    <div className="flex flex-col h-full" style={{ background: NAVY }}>
      {/* Logo Section */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <img src="/amax-logo-new.png" alt="AMAX" className="w-10 h-10 flex-shrink-0" />
        <div>
          <h1 className="text-base font-bold text-white leading-tight tracking-widest">AMAX GLOBAL</h1>
          <p className="text-xs text-white/60">FX &amp; Digital Payments</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Button
              key={item.name}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left font-medium transition-colors",
                isActive
                  ? "bg-white/20 text-white hover:bg-white/25"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              onClick={() => handleNav(item.href)}
            >
              <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
              {item.name}
            </Button>
          );
        })}
      </nav>

      {/* Regulatory labels */}
      <div className="px-4 pb-2 space-y-1">
        <p className="text-[10px] text-white/40 px-3">FX &amp; Remittance — AUSTRAC registered</p>
        <p className="text-[10px] text-white/40 px-3">DCE — AUSTRAC registered</p>
      </div>

      {/* User Profile Section */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </p>
            <p className="text-xs text-white/50">
              {user?.email === "demo@amaxglobal.com.au"
                ? "Simulation Account"
                : user?.kycStatus === "verified" ? "Verified Client" : "Client"}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:shadow-xl">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64 border-0">
          <SidebarContent onNavClick={onClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
