
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, SortAsc, SortDesc } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface StaffViewControlsProps {
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function StaffViewControls({
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  searchQuery,
  onSearchChange
}: StaffViewControlsProps) {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 mb-6">
      {/* Search Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sort Controls Row */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          <>
            {/* Mobile: Icon buttons */}
            <Select value={sortBy} onValueChange={onSortByChange}>
              <SelectTrigger className="w-12 p-2">
                <Filter className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </>
        ) : (
          <>
            {/* Desktop: Full selects */}
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
          </>
        )}
      </div>
    </div>
  );
}
