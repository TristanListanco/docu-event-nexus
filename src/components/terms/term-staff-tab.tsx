import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember, StaffViewMode } from "@/types/models";
import { toast } from "@/hooks/use-toast";
import StaffViewControls from "@/components/staff/staff-view-controls";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";
import StaffListItem from "@/components/staff/staff-list-item";
import StaffDetailModal from "@/components/staff/staff-detail-modal";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

interface TermStaffTabProps {
  termId: string;
  isArchive: boolean;
}

export default function TermStaffTab({ termId, isArchive }: TermStaffTabProps) {
  const { staff } = useStaff(termId);

  const [viewMode, setViewMode] = useState<StaffViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState<StaffMember | null>(null);

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "all" || member.roles.includes(roleFilter as any);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 md:px-6 border-b">
        <h2 className="text-lg font-semibold">Staff Members ({staff.length})</h2>
        {!isArchive && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)} className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} size="icon" className="sm:hidden">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
        <div className="flex-shrink-0 mb-4">
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
        </div>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardContent className="flex-1 min-h-0 p-0">
            {filteredStaff.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center py-8 px-6">
                <div>
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No staff members found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || roleFilter !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "Get started by adding your first staff member."}
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-4 p-6">
                  {filteredStaff.map((member) => (
                    <StaffListItem
                      key={member.id}
                      staff={member}
                      onEdit={isArchive ? undefined : (staff) => setEditingStaff(staff)}
                      onDelete={isArchive ? undefined : (staff) => setDeletingStaff(staff)}
                      onNameClick={(staff) => setSelectedStaffForDetail(staff)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {!isArchive && (
        <>
          <StaffFormDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onStaffAdded={() => setIsAddDialogOpen(false)}
            termId={termId}
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
        </>
      )}

      <StaffDetailModal
        staff={selectedStaffForDetail}
        open={!!selectedStaffForDetail}
        onOpenChange={(open) => !open && setSelectedStaffForDetail(null)}
      />
    </div>
  );
}
