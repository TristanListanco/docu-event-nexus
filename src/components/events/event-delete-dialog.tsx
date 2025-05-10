
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEvents } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { Event } from "@/types/models";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EventDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventDeleted: () => void;
}

export default function EventDeleteDialog({ 
  open, 
  onOpenChange, 
  event,
  onEventDeleted
}: EventDeleteDialogProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!password.trim()) {
      setError("Please enter your password to confirm");
      return;
    }

    if (!user) {
      setError("You must be logged in to delete an event");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify user password first
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      });
      
      if (authError) {
        throw new Error("Incorrect password. Please try again.");
      }

      // Delete the event
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id)
        .eq('user_id', user.id);
        
      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: "Event Deleted",
        description: `${event.name} has been successfully deleted.`
      });
      
      onEventDeleted();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the event{" "}
            <span className="font-semibold">{event.name}</span> and all associated
            assignments and records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Label htmlFor="password" className="text-sm font-medium">
            Enter your password to confirm deletion
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            placeholder="Your password"
            required
          />
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete Event"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
