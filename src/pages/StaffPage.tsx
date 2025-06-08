import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import StaffHeader from "@/components/staff/staff-header";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";
import StaffListItem from "@/components/staff/staff-list-item";
import StaffViewControls from "@/components/staff/staff-view-controls";
import { StaffMember, StaffRole } from "@/types/models";

export default function StaffPage() {
  const { staff, loading } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterRole, setFilterRole] = useState<StaffRole | "All">("All");

  const filteredStaff = staff.filter((member) => {
    if (filterRole === "All") return true;
    return member.roles.includes(filterRole);
  });

  const handleEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditDialogOpen(true);
  };

  const handleDelete = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setDeleteDialogOpen(true);
  };

  const handleStaffUpdated = () => {
    // Staff list will auto-refresh through the hook
  };

  const handleStaffAdded = () => {
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
            filterRole={filterRole}
            onFilterRoleChange={setFilterRole}
          />

          {staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-muted-foreground mb-4">No staff members found</p>
            </div>
          ) : (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-2"
            }>
              {filteredStaff.map((member) => (
                <StaffListItem
                  key={member.id}
                  staff={member}
                  viewMode={viewMode}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
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
