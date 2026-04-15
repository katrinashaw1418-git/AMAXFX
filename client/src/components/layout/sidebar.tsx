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

const navigation = [
  { name: "Dashboard",   href: "/dashboard",   icon: Home            },
  { name: "Transfer In / Transfer Out", href: "/wallets", icon: Wallet },
  { name: "FX Conversion", href: "/fx-exchange",  icon: ArrowRightLeft  },
  { name: "Digital Asset Exchange", href: "/crypto", icon: Bitcoin   },
  { name: "Transactions",href: "/transactions", icon: History         },
  { name: "Compliance",  href: "/compliance",   icon: Shield          },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  function handleNav(href: string) {
    navigate(href);
    onNavClick?.();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="px-6 py-4 bg-primary border-b border-primary/80 flex items-center space-x-3">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Back coin — full circle with 4-pointed sparkle star */}
            <circle cx="9" cy="9" r="7.5" stroke="hsl(207,90%,54%)" strokeWidth="2"/>
            <path d="M9,4.5 L10.3,7.7 L13.5,9 L10.3,10.3 L9,13.5 L7.7,10.3 L4.5,9 L7.7,7.7 Z" fill="hsl(207,90%,54%)"/>
            {/* Front coin — open arc (right/bottom portion only) with lightning bolt */}
            <path d="M9.5,16.5 A7.5,7.5 0 1 1 16.5,9.5" stroke="hsl(207,90%,54%)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M18,13 L15,18 L17.5,18 L15,22.5 L20,17 L17.5,17 Z" fill="hsl(207,90%,54%)"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AMAX</h1>
          <p className="text-xs text-white/70">FX &amp; Digital Payments</p>
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
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-left font-medium",
                isActive
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={() => handleNav(item.href)}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.name}
            </Button>
          );
        })}
      </nav>

      {/* Regulatory labels */}
      <div className="px-4 pb-2 space-y-1">
        <p className="text-[10px] text-gray-400 px-3">FX & Remittance — AUSTRAC registered</p>
        <p className="text-[10px] text-gray-400 px-3">DCE — AUSTRAC registered</p>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </p>
            <p className="text-xs text-gray-500">
              {user?.email === "demo@amaxglobal.com.au"
                ? "Simulation Account"
                : user?.kycStatus === "verified" ? "Verified Client" : "Client"}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:shadow-lg lg:border-r lg:border-gray-200 lg:z-50">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onNavClick={onClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
