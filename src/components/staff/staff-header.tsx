
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface StaffHeaderProps {
  onAddStaff: () => void;
}

export default function StaffHeader({ onAddStaff }: StaffHeaderProps) {
  return (
    <div className="border-b">
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={onAddStaff} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
