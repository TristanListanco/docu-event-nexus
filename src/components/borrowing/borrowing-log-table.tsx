
import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BorrowingRecord } from "@/types/borrowing";

interface BorrowingLogTableProps {
  records: BorrowingRecord[];
  onEdit: (record: BorrowingRecord) => void;
  onDelete: (id: string) => void;
  onMarkReturned: (id: string) => void;
}

export default function BorrowingLogTable({
  records,
  onEdit,
  onDelete,
  onMarkReturned
}: BorrowingLogTableProps) {
  const formatDateTime = (date: string, time: string) => {
    return `${format(new Date(date), "MMM dd, yyyy")} ${time}`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User/Borrower's Name</TableHead>
            <TableHead>Equipment Names</TableHead>
            <TableHead>Date & Time Taken</TableHead>
            <TableHead>Date & Time Returned</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No borrowing records found
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.borrower_name}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {record.equipment_names.map((equipment, index) => (
                      <Badge key={index} variant="secondary" className="mr-1">
                        {equipment}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(record.date_taken, record.time_taken)}</TableCell>
                <TableCell>
                  {record.date_returned && record.time_returned
                    ? formatDateTime(record.date_returned, record.time_returned)
                    : "-"
                  }
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={record.status === 'returned' ? 'default' : 'destructive'}
                  >
                    {record.status === 'returned' ? 'Returned' : 'Borrowed'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {record.status === 'borrowed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMarkReturned(record.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(record.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
