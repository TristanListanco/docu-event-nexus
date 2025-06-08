
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, Plus } from "lucide-react";

interface StaffHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onAddStaff: () => void;
}

export default function StaffHeader({ loading, onRefresh, onAddStaff }: StaffHeaderProps) {
  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onRefresh} disabled={loading} size="icon">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={onAddStaff} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
