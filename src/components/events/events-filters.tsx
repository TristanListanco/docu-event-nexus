
import { Input } from "@/components/ui/input";

type SortOption = "name" | "date" | "status";
type FilterOption = "all" | "upcoming" | "ongoing" | "elapsed" | "completed" | "cancelled";

interface EventsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filterBy: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  isArchived?: boolean;
}

export default function EventsFilters({
  searchQuery,
  onSearchChange,
  isArchived = false
}: EventsFiltersProps) {
  return (
    <div className="w-full">
      <Input
        placeholder={`Search ${isArchived ? 'archived ' : ''}events...`}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
