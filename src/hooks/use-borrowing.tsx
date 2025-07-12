
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BorrowingRecord, BorrowingFormData } from "@/types/borrowing";
import { useAuth } from "./use-auth";
import { toast } from "@/hooks/use-toast";

export const useBorrowing = () => {
  const [records, setRecords] = useState<BorrowingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRecords = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('borrowing_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching borrowing records:', error);
      toast({
        title: "Error",
        description: "Failed to load borrowing records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const addRecord = async (formData: BorrowingFormData) => {
    if (!user) return false;

    try {
      const status = formData.dateReturned && formData.timeReturned ? 'returned' : 'borrowed';
      
      const { error } = await supabase
        .from('borrowing_records')
        .insert({
          borrower_name: formData.borrowerName,
          equipment_names: formData.equipmentNames,
          date_taken: formData.dateTaken,
          time_taken: formData.timeTaken,
          date_returned: formData.dateReturned || null,
          time_returned: formData.timeReturned || null,
          status,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Borrowing record added successfully",
      });

      await fetchRecords();
      return true;
    } catch (error) {
      console.error('Error adding borrowing record:', error);
      toast({
        title: "Error",
        description: "Failed to add borrowing record",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateRecord = async (id: string, formData: BorrowingFormData) => {
    if (!user) return false;

    try {
      const status = formData.dateReturned && formData.timeReturned ? 'returned' : 'borrowed';
      
      const { error } = await supabase
        .from('borrowing_records')
        .update({
          borrower_name: formData.borrowerName,
          equipment_names: formData.equipmentNames,
          date_taken: formData.dateTaken,
          time_taken: formData.timeTaken,
          date_returned: formData.dateReturned || null,
          time_returned: formData.timeReturned || null,
          status
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Borrowing record updated successfully",
      });

      await fetchRecords();
      return true;
    } catch (error) {
      console.error('Error updating borrowing record:', error);
      toast({
        title: "Error",
        description: "Failed to update borrowing record",
        variant: "destructive",
      });
      return false;
    }
  };

  const markAsReturned = async (id: string) => {
    if (!user) return false;

    try {
      const now = new Date();
      const dateReturned = now.toISOString().split('T')[0];
      const timeReturned = now.toTimeString().slice(0, 5);

      const { error } = await supabase
        .from('borrowing_records')
        .update({
          date_returned: dateReturned,
          time_returned: timeReturned,
          status: 'returned'
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Equipment marked as returned",
      });

      await fetchRecords();
      return true;
    } catch (error) {
      console.error('Error marking as returned:', error);
      toast({
        title: "Error",
        description: "Failed to mark equipment as returned",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteRecord = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('borrowing_records')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Borrowing record deleted successfully",
      });

      await fetchRecords();
      return true;
    } catch (error) {
      console.error('Error deleting borrowing record:', error);
      toast({
        title: "Error",
        description: "Failed to delete borrowing record",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    markAsReturned,
    deleteRecord,
    refetch: fetchRecords
  };
};
