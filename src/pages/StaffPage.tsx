
import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaffMember, StaffViewMode } from "@/types/models";
import StaffHeader from "@/components/staff/staff-header";
import StaffViewControls from "@/components/staff/staff-view-controls";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";
import StaffListItem from "@/components/staff/staff-list-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function StaffPage() {
  const { staff, addStaff, updateStaff, deleteStaff } = useStaff();
  const isMobile = useIsMobile();
  
  const [viewMode, setViewMode] = useState<StaffViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "all" || member.roles.includes(roleFilter as any);
    return matchesSearch && matchesRole;
  });

  const handleAddStaff = async (staffData: Omit<StaffMember, "id">) => {
    await addStaff(staffData);
    setIsAddDialogOpen(false);
  };

  const handleUpdateStaff = async (id: string, updates: Partial<StaffMember>) => {
    await updateStaff(id, updates);
    setEditingStaff(null);
  };

  const handleDeleteStaff = async (id: string) => {
    await deleteStaff(id);
    setDeletingStaff(null);
  };

  return (
    <div className="flex h-screen flex-col">
      <StaffHeader onAddStaff={() => setIsAddDialogOpen(true)} />
      
      <div className="flex-1 overflow-hidden p-6">
        <div className="space-y-6">
          <StaffViewControls
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Members ({filteredStaff.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStaff.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No staff members found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || roleFilter !== "all" 
                      ? "Try adjusting your search or filter criteria."
                      : "Get started by adding your first staff member."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStaff.map((member) => (
                    <StaffListItem
                      key={member.id}
                      staff={member}
                      onEdit={(staff) => setEditingStaff(staff)}
                      onDelete={(staff) => setDeletingStaff(staff)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <StaffFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onStaffAdded={() => setIsAddDialogOpen(false)}
      />

      {editingStaff && (
        <StaffEditDialog
          staff={editingStaff}
          open={!!editingStaff}
          onOpenChange={(open) => !open && setEditingStaff(null)}
          onStaffUpdated={() => setEditingStaff(null)}
        />
      )}

      {deletingStaff && (
        <StaffDeleteDialog
          staff={deletingStaff}
          open={!!deletingStaff}
          onOpenChange={(open) => !open && setDeletingStaff(null)}
          onStaffDeleted={() => setDeletingStaff(null)}
        />
      )}
    </div>
  );
}
