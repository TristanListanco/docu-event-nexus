
import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember } from "@/types/models";
import StaffHeader from "@/components/staff/staff-header";
import StaffViewControls from "@/components/staff/staff-view-controls";
import StaffListItem from "@/components/staff/staff-list-item";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";

export default function StaffPage() {
  const { staff, loading } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"All" | "Photographer" | "Videographer">("All");

  // Filter staff based on search and role
  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "All" || member.roles?.includes(filterRole as any);
    return matchesSearch && matchesRole;
  });

  const handleEdit = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setEditDialogOpen(true);
  };

  const handleDelete = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setDeleteDialogOpen(true);
  };

  const handleStaffUpdated = () => {
    // Staff list will auto-refresh through the hook
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <StaffHeader onAddStaff={() => setAddDialogOpen(true)} />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <StaffViewControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterRole={filterRole}
            onFilterRoleChange={setFilterRole}
          />

          <div className="space-y-4">
            {filteredStaff.map((member) => (
              <StaffListItem
                key={member.id}
                staff={member}
                onEdit={() => handleEdit(member)}
                onDelete={() => handleDelete(member)}
              />
            ))}
          </div>

          {filteredStaff.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No staff members found.</p>
            </div>
          )}
        </div>
      </div>

      <StaffFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onStaffAdded={handleStaffUpdated}
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
