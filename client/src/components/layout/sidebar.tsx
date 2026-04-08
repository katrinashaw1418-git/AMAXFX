import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Home,
  Wallet,
  History,
  Shield,
  Coins,
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
  { name: "eWallet",     href: "/wallets",      icon: Wallet          },
  { name: "FX Exchange", href: "/fx-exchange",  icon: ArrowRightLeft  },
  { name: "Crypto",      href: "/crypto",       icon: Bitcoin         },
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
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AMAX</h1>
            <p className="text-xs text-gray-500">FX & Digital Payments</p>
          </div>
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
              {user?.kycStatus === "verified" ? "Verified Client" : "Client"}
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
