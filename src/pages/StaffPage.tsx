
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStaff } from "@/hooks/use-staff";
import { StaffMember, StaffRole } from "@/types/models";
import { StaffFormDialog } from "@/components/staff/staff-form-dialog";
import { StaffEditDialog } from "@/components/staff/staff-edit-dialog";
import { StaffDeleteDialog } from "@/components/staff/staff-delete-dialog";
import { StaffScheduleDisplay } from "@/components/staff/staff-schedule-display";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function StaffPage() {
  const [openAddStaffDialog, setOpenAddStaffDialog] = useState(false);
  const [openEditStaffDialog, setOpenEditStaffDialog] = useState(false);
  const [openDeleteStaffDialog, setOpenDeleteStaffDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const { staff, isLoading, error, refetchStaff } = useStaff();

  const videographers = staff.filter((s) => s.role === "Videographer");
  const photographers = staff.filter((s) => s.role === "Photographer");

  // Calculate number of class schedules for each staff member
  const getClassSchedulesCount = (staffMember: StaffMember) => {
    return staffMember.schedule ? staffMember.schedule.length : 0;
  };
  
  const totalVideoSchedules = videographers.reduce(
    (total, v) => total + getClassSchedulesCount(v), 
    0
  );
  
  const totalPhotoSchedules = photographers.reduce(
    (total, p) => total + getClassSchedulesCount(p), 
    0
  );

  const handleEditStaff = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setOpenEditStaffDialog(true);
  };

  const handleDeleteStaff = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setOpenDeleteStaffDialog(true);
  };

  const handleStaffAdded = () => {
    refetchStaff();
  };

  const handleStaffUpdated = () => {
    refetchStaff();
  };

  const handleStaffDeleted = () => {
    refetchStaff();
  };

  if (isLoading) {
    return <div className="container py-6">Loading staff data...</div>;
  }

  if (error) {
    return <div className="container py-6">Error loading staff: {error}</div>;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Staff Members</h1>
        <Button onClick={() => setOpenAddStaffDialog(true)}>Add Staff</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Videographers ({videographers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              Total Class Schedules: {totalVideoSchedules}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photographers ({photographers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              Total Class Schedules: {totalPhotoSchedules}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Class Schedules</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell>{staffMember.name}</TableCell>
                  <TableCell>
                    <Badge variant={staffMember.role === "Videographer" ? "default" : "secondary"}>
                      {staffMember.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <span>{getClassSchedulesCount(staffMember)} schedules</span>
                      <StaffScheduleDisplay schedule={staffMember.schedule || []} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStaff(staffMember)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStaff(staffMember)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StaffFormDialog
        open={openAddStaffDialog}
        onOpenChange={setOpenAddStaffDialog}
        onStaffAdded={handleStaffAdded}
      />

      {selectedStaff && (
        <>
          <StaffEditDialog
            open={openEditStaffDialog}
            onOpenChange={setOpenEditStaffDialog}
            staff={selectedStaff}
            onStaffUpdated={handleStaffUpdated}
          />
          <StaffDeleteDialog
            open={openDeleteStaffDialog}
            onOpenChange={setOpenDeleteStaffDialog}
            staffId={selectedStaff.id}
            staffName={selectedStaff.name}
            onStaffDeleted={handleStaffDeleted}
          />
        </>
      )}
    </div>
  );
}
