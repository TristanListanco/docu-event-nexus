
import { useState } from "react";
import EventsFilters from "./events-filters";

type FilterOption = "all" | "upcoming" | "ongoing" | "elapsed" | "completed" | "cancelled";
type SortOption = "date" | "name" | "status";

interface EventsPageFiltersProps {
  onFiltersChange: (filters: {
    searchQuery: string;
    sortBy: SortOption;
    filterBy: FilterOption;
  }) => void;
  isArchived?: boolean;
}

export default function EventsPageFilters({ onFiltersChange, isArchived = false }: EventsPageFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onFiltersChange({ searchQuery: query, sortBy, filterBy });
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    onFiltersChange({ searchQuery, sortBy: sort, filterBy });
  };

  const handleFilterChange = (filter: FilterOption) => {
    setFilterBy(filter);
    onFiltersChange({ searchQuery, sortBy, filterBy: filter });
  };

  return (
    <EventsFilters
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
      sortBy={sortBy}
      onSortChange={handleSortChange}
      filterBy={filterBy}
      onFilterChange={handleFilterChange}
      isArchived={isArchived}
    />
  );
}
