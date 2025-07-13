import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronRight } from "lucide-react";

export default function QuickActions() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-between p-4 h-auto"
            onClick={() => window.open('https://virgocx.com/account', '_blank')}
          >
            <div className="flex items-center space-x-3">
              <PlusCircle className="w-4 h-4 text-secondary" />
              <span className="font-medium">VirgoCX Account</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
