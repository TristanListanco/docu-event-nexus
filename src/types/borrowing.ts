
export interface BorrowingRecord {
  id: string;
  borrower_name: string;
  equipment_names: string[];
  date_taken: string;
  time_taken: string;
  date_returned?: string;
  time_returned?: string;
  status: 'borrowed' | 'returned';
  created_at: string;
  user_id: string;
}

export interface BorrowingFormData {
  borrowerName: string;
  equipmentNames: string[];
  dateTaken: string;
  timeTaken: string;
  dateReturned?: string;
  timeReturned?: string;
}
