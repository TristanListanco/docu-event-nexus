
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, LayoutGrid } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

type ViewMode = "grid" | "list";
type SortOption = "name" | "date" | "status";
type FilterOption = "all" | "upcoming" | "ongoing" | "elapsed" | "completed" | "cancelled";

interface EventsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterBy: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

export default function EventsFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  filterBy,
  onFilterChange
}: EventsFiltersProps) {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 mb-6">
      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Select value={filterBy} onValueChange={(value: FilterOption) => onFilterChange(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">On Going</SelectItem>
            <SelectItem value="elapsed">Elapsed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort and View Mode Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Only show view mode toggle on desktop/tablet */}
        {!isMobile && (
          <ToggleGroup type="single" value={viewMode} onValueChange={(value: ViewMode) => value && onViewModeChange(value)}>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
    </div>
  );
}
