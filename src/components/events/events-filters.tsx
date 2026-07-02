// Search bar removed as part of dashboard rehaul.
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

export default function EventsFilters(_props: EventsFiltersProps) {
  return null;
}
