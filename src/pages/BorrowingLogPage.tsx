
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BorrowingLogTable from "@/components/borrowing/borrowing-log-table";
import BorrowingFormDialog from "@/components/borrowing/borrowing-form-dialog";
import { useBorrowing } from "@/hooks/use-borrowing";
import { BorrowingRecord, BorrowingFormData } from "@/types/borrowing";

export default function BorrowingLogPage() {
  const { records, loading, addRecord, updateRecord, markAsReturned, deleteRecord } = useBorrowing();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BorrowingRecord | undefined>();

  const handleEdit = (record: BorrowingRecord) => {
    setEditingRecord(record);
    setFormDialogOpen(true);
  };

  const handleSave = async (formData: BorrowingFormData) => {
    if (editingRecord) {
      await updateRecord(editingRecord.id, formData);
    } else {
      await addRecord(formData);
    }
    setEditingRecord(undefined);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this borrowing record?')) {
      await deleteRecord(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setFormDialogOpen(open);
    if (!open) {
      setEditingRecord(undefined);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Borrowing Log</h1>
          <p className="text-muted-foreground">
            Track equipment borrowing and returns
          </p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Borrowing Records</CardTitle>
          <CardDescription>
            Manage equipment borrowing and return records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BorrowingLogTable
            records={records}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkReturned={markAsReturned}
          />
        </CardContent>
      </Card>

      <BorrowingFormDialog
        open={formDialogOpen}
        onOpenChange={handleDialogClose}
        record={editingRecord}
        onSave={handleSave}
      />
    </div>
  );
}
