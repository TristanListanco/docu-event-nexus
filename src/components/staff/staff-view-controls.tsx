
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StaffViewControlsProps {
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

export default function StaffViewControls({
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}: StaffViewControlsProps) {
  return (
    <div className="flex items-center space-x-2 mb-6">
      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="role">Role</SelectItem>
          <SelectItem value="email">Email</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={sortOrder} onValueChange={onSortOrderChange}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">A-Z</SelectItem>
          <SelectItem value="desc">Z-A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
