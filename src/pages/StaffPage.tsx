import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, RefreshCw, Edit, Trash2, Video, Camera, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog"; 
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog"; 
import { Button } from "@/components/ui/button";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember } from "@/types/models";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { staff, loading, loadStaff } = useStaff();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filter staff based on search query and role
  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const videographers = filteredStaff.filter(member => member.role === "Videographer");
  const photographers = filteredStaff.filter(member => member.role === "Photographer");

  const handleEditStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditDialogOpen(true);
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => loadStaff()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <StaffFormDialog />
          </div>
        </div>
      </div>
      
      <div className="p-4 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-lg">Loading staff members...</p>
            </div>
          </div>
        ) : staff.length > 0 ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Staff ({filteredStaff.length})</TabsTrigger>
              <TabsTrigger value="videographers">Videographers ({videographers.length})</TabsTrigger>
              <TabsTrigger value="photographers">Photographers ({photographers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {filteredStaff.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStaff.map(member => (
                    <StaffCard 
                      key={member.id} 
                      staff={member} 
                      onEdit={() => handleEditStaff(member)}
                      onDelete={() => handleDeleteStaff(member)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyStateMessage searchQuery={searchQuery} />
              )}
            </TabsContent>
            <TabsContent value="videographers" className="mt-4">
              {videographers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {videographers.map(member => (
                    <StaffCard 
                      key={member.id} 
                      staff={member} 
                      onEdit={() => handleEditStaff(member)}
                      onDelete={() => handleDeleteStaff(member)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyStateMessage searchQuery={searchQuery} role="Videographers" />
              )}
            </TabsContent>
            <TabsContent value="photographers" className="mt-4">
              {photographers.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {photographers.map(member => (
                    <StaffCard 
                      key={member.id} 
                      staff={member} 
                      onEdit={() => handleEditStaff(member)}
                      onDelete={() => handleDeleteStaff(member)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyStateMessage searchQuery={searchQuery} role="Photographers" />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyStateMessage searchQuery={searchQuery} />
        )}
      </div>

      {/* Edit Staff Dialog */}
      {selectedStaff && (
        <StaffEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          staff={selectedStaff}
          onStaffUpdated={loadStaff}
        />
      )}

      {/* Delete Staff Dialog */}
      {selectedStaff && (
        <StaffDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          staff={selectedStaff}
          onStaffDeleted={loadStaff}
        />
      )}
    </div>
  );
}

interface StaffCardProps {
  staff: StaffMember;
  onEdit: () => void;
  onDelete: () => void;
}

function StaffCard({ staff, onEdit, onDelete }: StaffCardProps) {
  const { name, role, email, photoUrl, schedules } = staff;
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {role === "Videographer" ? (
                <Video className="h-6 w-6 text-primary" />
              ) : (
                <Camera className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-muted-foreground">{role}</span>
                {email && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 mr-1" />
                    <span>{email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <Edit className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {schedules.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">CLASS SCHEDULES</p>
            <div className="space-y-1">
              {schedules.map((schedule, index) => {
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                return (
                  <div key={index} className="text-xs bg-muted p-1.5 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{schedule.subject}</span>
                      <span>{dayNames[schedule.dayOfWeek]}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Attendance counter section has been removed */}
      </CardContent>
    </Card>
  );
}

function EmptyStateMessage({ searchQuery, role }: { searchQuery: string; role?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg">
      <Users className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No staff members found</h3>
      <p className="text-muted-foreground text-center mt-2">
        {searchQuery ? 
          `No staff members match your search criteria. Try a different search term.` : 
          role ? 
          `You haven't added any ${role.toLowerCase()} yet.` :
          "You haven't added any staff members yet. Click the 'Add Staff Member' button to get started."}
      </p>
    </div>
  );
}
