
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

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
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  isArchived = false
}: EventsFiltersProps) {
  const isMobile = useIsMobile();

  const getFilterOptions = () => {
    if (isArchived) {
      return [
        { value: "all", label: "All Archived" },
        { value: "elapsed", label: "Elapsed" },
        { value: "completed", label: "Completed" }
      ];
    }
    
    return [
      { value: "all", label: "All Events" },
      { value: "upcoming", label: "Upcoming" },
      { value: "ongoing", label: "On Going" },
      { value: "cancelled", label: "Cancelled" }
    ];
  };

  const filterOptions = getFilterOptions();

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Input
          placeholder={`Search ${isArchived ? 'archived ' : ''}events...`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-popover border border-border shadow-md" sideOffset={4}>
              <Select value={filterBy} onValueChange={(value: FilterOption) => onFilterChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <SortAsc className="h-4 w-4" />
                Sort
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 bg-popover border border-border shadow-md" sideOffset={4}>
              <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="status">Sort by Status</SelectItem>
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder={`Search ${isArchived ? 'archived ' : ''}events...`}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <Select value={filterBy} onValueChange={(value: FilterOption) => onFilterChange(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-md">
            {filterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-md">
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
