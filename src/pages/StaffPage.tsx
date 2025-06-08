
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
  const { staff, loading, loadStaff } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Sort staff based on selected criteria
  const sortedStaff = staff.sort((a, b) => {
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

  // Check if staff member is on leave today
  const isStaffOnLeave = (staffMember: StaffMember) => {
    const today = new Date().toISOString().split('T')[0];
    return staffMember.leaveDates.some(leave => 
      today >= leave.startDate && today <= leave.endDate
    );
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
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />

          <div className="space-y-4">
            {sortedStaff.map((member) => (
              <StaffListItem
                key={member.id}
                staff={member}
                onEdit={() => handleEdit(member)}
                onDelete={() => handleDelete(member)}
                isOnLeave={isStaffOnLeave(member)}
              />
            ))}
          </div>

          {sortedStaff.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No staff members found.</p>
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
