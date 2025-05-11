
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, MoreVertical, Plus, RefreshCw, Trash2 } from "lucide-react";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember } from "@/types/models";

export default function StaffPage() {
  const { staff, loading, loadStaff } = useStaff();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | "Videographer" | "Photographer">("All");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Filter staff based on search query and role
  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (roleFilter === "All" || member.role === roleFilter)
  );

  // Handle edit action
  const handleEdit = (member: StaffMember) => {
    setSelectedStaff(member);
    setEditDialogOpen(true);
  };

  // Handle delete action
  const handleDelete = (member: StaffMember) => {
    setSelectedStaff(member);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
          <p className="text-muted-foreground">Manage your staff members and their schedules</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadStaff} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
            <StaffFormDialog 
              open={addDialogOpen}
              onOpenChange={setAddDialogOpen}
              onStaffAdded={loadStaff}
            />
          </div>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search staff members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={roleFilter === "All" ? "default" : "outline"}
            onClick={() => setRoleFilter("All")}
          >
            All
          </Button>
          <Button
            variant={roleFilter === "Videographer" ? "default" : "outline"}
            onClick={() => setRoleFilter("Videographer")}
          >
            Videographers
          </Button>
          <Button
            variant={roleFilter === "Photographer" ? "default" : "outline"}
            onClick={() => setRoleFilter("Photographer")}
          >
            Photographers
          </Button>
        </div>
      </div>

      {/* Staff grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl">{member.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleEdit(member)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(member)}
                    className="text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10">
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="text-sm font-medium leading-none">{member.role}</div>
                  <div className="text-xs text-muted-foreground">
                    {member.schedules?.length || 0} scheduled classes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      {selectedStaff && (
        <>
          <StaffEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            staff={selectedStaff}
            onStaffUpdated={loadStaff}
          />

          <StaffDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            staffId={selectedStaff.id}
            staffName={selectedStaff.name}
            onStaffDeleted={loadStaff}
          />
        </>
      )}
    </div>
  );
}
