import { useState } from "react";
import { useStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  User,
  UserCheck,
  UserX,
  Edit,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StaffMember, StaffRole } from "@/types/models";
import StaffFormDialog from "@/components/staff/staff-form-dialog";
import StaffEditDialog from "@/components/staff/staff-edit-dialog";
import StaffDeleteDialog from "@/components/staff/staff-delete-dialog";

export default function StaffPage() {
  const { staff, loadStaff } = useStaff();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter staff based on search query
  const filteredStaff = staff.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStaffUpdated = async () => {
    await loadStaff();
  };

  const handleEditClick = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setDeleteDialogOpen(true);
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case "Videographer":
        return <Badge variant="secondary">Videographer</Badge>;
      case "Photographer":
        return <Badge>Photographer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          </div>
          <Button onClick={() => setFormDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Staff
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search staff..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="text-center p-8 border rounded-lg">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No staff found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by adding your first staff member"}
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setFormDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Statistics</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staffMember) => (
                  <TableRow key={staffMember.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={staffMember.photoUrl} alt={staffMember.name} />
                          <AvatarFallback>
                            {staffMember.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {staffMember.name}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(staffMember.role)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center">
                          <UserCheck className="h-3 w-3 mr-1 text-green-500" />
                          <span className="text-xs text-muted-foreground">
                            {staffMember.statistics.completed} Completed
                          </span>
                        </div>
                        <div className="flex items-center">
                          <UserX className="h-3 w-3 mr-1 text-red-500" />
                          <span className="text-xs text-muted-foreground">
                            {staffMember.statistics.absent} Absent
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditClick(staffMember)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteClick(staffMember)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <StaffFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onStaffAdded={handleStaffUpdated}
      />

      {selectedStaff && (
        <StaffEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          staff={selectedStaff}
          onStaffUpdated={handleStaffUpdated}
        />
      )}

      {selectedStaff && (
        <StaffDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          staffId={selectedStaff.id}
          staffName={selectedStaff.name}
          onStaffDeleted={handleStaffUpdated}
        />
      )}
    </div>
  );
}
