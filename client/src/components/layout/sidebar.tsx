import { useLocation } from "wouter";
import amaxLogo from "@assets/3c8c85ce-03be-4cb4-b79b-87dc422125c5_1776242034356.png";
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
      <div className="flex items-center justify-center px-4 py-3" style={{ background: "rgba(7,17,31,0.97)", borderBottom: "1px solid #152e4a" }}>
        <img src={amaxLogo} alt="AMAX Global" className="h-14 w-auto" />
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
