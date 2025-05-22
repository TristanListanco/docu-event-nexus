
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember, StaffRole } from "@/types/models";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";
import { Plus, Search, Camera, Video, Users } from "lucide-react";
import { StaffScheduleDisplay } from "@/components/staff/staff-schedule-display";

export default function StaffPage() {
  const { staff, loading, loadStaff } = useStaff();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRole, setActiveRole] = useState<"All" | StaffRole>("All");
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  
  // Filter staff based on active filters
  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = activeRole === "All" || member.role === activeRole;
    return matchesSearch && matchesRole;
  });
  
  // Group staff by role
  const videographers = staff.filter(member => member.role === "Videographer");
  const photographers = staff.filter(member => member.role === "Photographer");
  
  // Handle opening edit dialog
  const handleEditStaff = (member: StaffMember) => {
    setSelectedStaff(member);
    setEditDialogOpen(true);
  };
  
  // Handle opening delete dialog
  const handleDeleteStaff = (member: StaffMember) => {
    setSelectedStaff(member);
    setDeleteDialogOpen(true);
  };

  // Handle staff added/deleted callbacks
  const handleStaffAdded = () => {
    loadStaff();
  };
  
  const handleStaffDeleted = () => {
    loadStaff();
  };
  
  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members, their roles, and schedules
          </p>
        </div>
        <Button className="mt-4 sm:mt-0" onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>
      
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videographers</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videographers.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for video assignments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photographers</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{photographers.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for photo assignments
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="All" value={activeRole} onValueChange={(v) => setActiveRole(v as any)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="All">All Staff</TabsTrigger>
            <TabsTrigger value="Videographer">Videographers</TabsTrigger>
            <TabsTrigger value="Photographer">Photographers</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="All" className="mt-0">
          <ScrollArea className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <StaffCard
                    key={member.id}
                    staff={member}
                    onEdit={() => handleEditStaff(member)}
                    onDelete={() => handleDeleteStaff(member)}
                  />
                ))
              ) : (
                <div className="col-span-3 py-12 text-center">
                  <p className="text-muted-foreground">No staff members found</p>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="Videographer" className="mt-0">
          <ScrollArea className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <StaffCard
                    key={member.id}
                    staff={member}
                    onEdit={() => handleEditStaff(member)}
                    onDelete={() => handleDeleteStaff(member)}
                  />
                ))
              ) : (
                <div className="col-span-3 py-12 text-center">
                  <p className="text-muted-foreground">No videographers found</p>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="Photographer" className="mt-0">
          <ScrollArea className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredStaff.length > 0 ? (
                filteredStaff.map((member) => (
                  <StaffCard
                    key={member.id}
                    staff={member}
                    onEdit={() => handleEditStaff(member)}
                    onDelete={() => handleDeleteStaff(member)}
                  />
                ))
              ) : (
                <div className="col-span-3 py-12 text-center">
                  <p className="text-muted-foreground">No photographers found</p>
                </div>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Add staff dialog - Pass the onStaffAdded prop */}
      <StaffFormDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onStaffAdded={handleStaffAdded}
      />
      
      {/* Edit staff dialog */}
      {selectedStaff && (
        <StaffEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          staff={selectedStaff}
        />
      )}
      
      {/* Delete staff dialog - Fix the props to use staffId and staffName */}
      {selectedStaff && (
        <StaffDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
          onStaffDeleted={handleStaffDeleted}
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
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              {staff.photoUrl ? (
                <img 
                  src={staff.photoUrl} 
                  alt={staff.name}
                  className="h-full w-full object-cover rounded-full" 
                />
              ) : (
                <span className="text-xl font-semibold text-primary">
                  {staff.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-base">{staff.name}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mt-1">
                  {staff.role}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <StaffScheduleDisplay staff={staff} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
