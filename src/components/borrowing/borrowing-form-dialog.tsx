
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { BorrowingRecord, BorrowingFormData } from "@/types/borrowing";

interface BorrowingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: BorrowingRecord;
  onSave: (data: BorrowingFormData) => void;
}

export default function BorrowingFormDialog({
  open,
  onOpenChange,
  record,
  onSave
}: BorrowingFormDialogProps) {
  const [formData, setFormData] = useState<BorrowingFormData>({
    borrowerName: "",
    equipmentNames: [],
    dateTaken: "",
    timeTaken: "",
    dateReturned: "",
    timeReturned: ""
  });
  const [newEquipment, setNewEquipment] = useState("");

  useEffect(() => {
    if (record) {
      setFormData({
        borrowerName: record.borrower_name,
        equipmentNames: record.equipment_names,
        dateTaken: record.date_taken,
        timeTaken: record.time_taken,
        dateReturned: record.date_returned || "",
        timeReturned: record.time_returned || ""
      });
    } else {
      setFormData({
        borrowerName: "",
        equipmentNames: [],
        dateTaken: "",
        timeTaken: "",
        dateReturned: "",
        timeReturned: ""
      });
    }
  }, [record, open]);

  const handleAddEquipment = () => {
    if (newEquipment.trim()) {
      setFormData(prev => ({
        ...prev,
        equipmentNames: [...prev.equipmentNames, newEquipment.trim()]
      }));
      setNewEquipment("");
    }
  };

  const handleRemoveEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipmentNames: prev.equipmentNames.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {record ? "Edit Borrowing Record" : "Add New Borrowing Record"}
          </DialogTitle>
          <DialogDescription>
            Fill in the borrowing details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="borrowerName">User/Borrower's Name</Label>
            <Input
              id="borrowerName"
              value={formData.borrowerName}
              onChange={(e) => setFormData(prev => ({ ...prev, borrowerName: e.target.value }))}
              placeholder="Enter borrower's name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Equipment Names</Label>
            <div className="flex gap-2">
              <Input
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                placeholder="Enter equipment name"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
              />
              <Button
                type="button"
                onClick={handleAddEquipment}
                size="sm"
                disabled={!newEquipment.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[2rem]">
              {formData.equipmentNames.map((equipment, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {equipment}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveEquipment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateTaken">Date Taken</Label>
              <Input
                id="dateTaken"
                type="date"
                value={formData.dateTaken}
                onChange={(e) => setFormData(prev => ({ ...prev, dateTaken: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeTaken">Time Taken</Label>
              <Input
                id="timeTaken"
                type="time"
                value={formData.timeTaken}
                onChange={(e) => setFormData(prev => ({ ...prev, timeTaken: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateReturned">Date Returned</Label>
              <Input
                id="dateReturned"
                type="date"
                value={formData.dateReturned}
                onChange={(e) => setFormData(prev => ({ ...prev, dateReturned: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeReturned">Time Returned</Label>
              <Input
                id="timeReturned"
                type="time"
                value={formData.timeReturned}
                onChange={(e) => setFormData(prev => ({ ...prev, timeReturned: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.borrowerName || formData.equipmentNames.length === 0}>
              {record ? "Update Record" : "Add Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
