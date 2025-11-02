import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaffMember, StaffViewMode } from "@/types/models";
import StaffHeader from "@/components/staff/staff-header";
import { fetchStaffAttendanceData, generateAttendanceReportPDF } from "@/utils/attendance-report-generator";
import { toast } from "@/hooks/use-toast";
import StaffViewControls from "@/components/staff/staff-view-controls";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";
import StaffListItem from "@/components/staff/staff-list-item";
import StaffDetailModal from "@/components/staff/staff-detail-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [selectedStaffForDetail, setSelectedStaffForDetail] = useState<StaffMember | null>(null);

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

  const handleGenerateReport = async () => {
    try {
      toast({
        title: "Generating Report",
        description: "Please wait while we fetch attendance data...",
      });

      const attendanceData = await fetchStaffAttendanceData(staff);
      generateAttendanceReportPDF(attendanceData);

      toast({
        title: "Report Generated",
        description: "Your attendance report has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate attendance report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <StaffHeader 
        onAddStaff={() => setIsAddDialogOpen(true)}
        onGenerateReport={handleGenerateReport}
        totalStaff={staff.length}
      />
      
      <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0">
        <div className="flex-shrink-0 mb-6">
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
                      : "Get started by adding your first staff member."
                    }
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
                      onEdit={(staff) => setEditingStaff(staff)}
                      onDelete={(staff) => setDeletingStaff(staff)}
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

      <StaffDetailModal
        staff={selectedStaffForDetail}
        open={!!selectedStaffForDetail}
        onOpenChange={(open) => !open && setSelectedStaffForDetail(null)}
      />
    </div>
  );
}
