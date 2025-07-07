import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, Clock, Circle } from "lucide-react";

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KycModal({ isOpen, onClose }: KycModalProps) {
  const [step, setStep] = useState(1);

  const steps = [
    { id: 1, title: "Identity Document", icon: CheckCircle, status: "completed", color: "text-green-600" },
    { id: 2, title: "Address Verification", icon: Clock, status: "pending", color: "text-yellow-600" },
    { id: 3, title: "Risk Assessment", icon: Circle, status: "waiting", color: "text-gray-400" },
  ];

  const getStepBgColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50";
      case "pending":
        return "bg-yellow-50";
      default:
        return "bg-gray-50";
    }
  };

  const getStepTextColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-800";
      case "pending":
        return "text-yellow-800";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-semibold mb-2">
              Complete KYC Verification
            </DialogTitle>
            <p className="text-gray-600">
              Verify your identity to access full platform features
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className={`flex items-center space-x-3 p-3 rounded-lg ${getStepBgColor(step.status)}`}>
                <Icon className={`w-5 h-5 ${step.color}`} />
                <span className={getStepTextColor(step.status)}>{step.title}</span>
              </div>
            );
          })}
        </div>
        
        <div className="space-y-3 mt-6">
          <Button className="w-full" onClick={onClose}>
            Continue Verification
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Complete Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
