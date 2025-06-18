
import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember } from "@/types/models";
import StaffHeader from "@/components/staff/staff-header";
import StaffViewControls from "@/components/staff/staff-view-controls";
import StaffListItem from "@/components/staff/staff-list-item";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";
import StaffPageSkeleton from "@/components/loading/staff-page-skeleton";
import { isStaffOnLeaveToday } from "@/hooks/staff/staff-availability";

export default function StaffPage() {
  const { staff, loading, loadStaff } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort staff based on search and selected criteria
  const filteredAndSortedStaff = staff
    .filter((member) => {
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        member.roles.some(role => role.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "role":
          comparison = a.roles.join(", ").localeCompare(b.roles.join(", "));
          break;
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const handleEdit = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setEditDialogOpen(true);
  };

  const handleDelete = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setDeleteDialogOpen(true);
  };

  const handleStaffAdded = async () => {
    await loadStaff();
    setAddDialogOpen(false);
  };

  const handleStaffUpdated = async () => {
    await loadStaff();
  };

  if (loading) {
    return <StaffPageSkeleton />;
  }

  return (
    <div className="flex h-screen flex-col animate-fade-in">
      <div className="animate-slide-in-right">
        <StaffHeader onAddStaff={() => setAddDialogOpen(true)} />
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 animate-fade-in-up">
          <StaffViewControls
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="space-y-4">
            {filteredAndSortedStaff.map((member, index) => (
              <div
                key={member.id}
                className="animate-fade-in-up stagger-animation"
                style={{ '--stagger': index } as React.CSSProperties}
              >
                <StaffListItem
                  staff={member}
                  onEdit={() => handleEdit(member)}
                  onDelete={() => handleDelete(member)}
                  isOnLeave={isStaffOnLeaveToday(member)}
                />
              </div>
            ))}
          </div>

          {filteredAndSortedStaff.length === 0 && (
            <div className="text-center py-8 animate-fade-in">
              <p className="text-muted-foreground">
                {searchQuery ? "No staff members found matching your search." : "No staff members found."}
              </p>
            </div>
          )}
        </div>
      </div>

      <StaffFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onStaffAdded={handleStaffAdded}
      />

      {selectedStaff && (
        <>
          <StaffEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            staff={selectedStaff}
            onStaffUpdated={handleStaffUpdated}
          />
          
          <StaffDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            staff={selectedStaff}
          />
        </>
      )}
    </div>
  );
}
