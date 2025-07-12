
export interface BorrowingRecord {
  id: string;
  borrowerName: string;
  equipmentNames: string[];
  dateTaken: string;
  timeTaken: string;
  dateReturned?: string;
  timeReturned?: string;
  status: 'borrowed' | 'returned';
  createdAt: string;
  userId: string;
}

export interface BorrowingFormData {
  borrowerName: string;
  equipmentNames: string[];
  dateTaken: string;
  timeTaken: string;
  dateReturned?: string;
  timeReturned?: string;
}
