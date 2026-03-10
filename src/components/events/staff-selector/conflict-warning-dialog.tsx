import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lock, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConflictWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffName: string;
  conflicts: Array<{ startTime: string; endTime: string; reason: string }>;
  onConfirm: () => void;
}

export default function ConflictWarningDialog({
  open,
  onOpenChange,
  staffName,
  conflicts,
  onConfirm,
}: ConflictWarningDialogProps) {
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setError("Unable to verify. Please try again.");
        return;
      }

      // Re-authenticate with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        setError("Incorrect password. Please try again.");
        return;
      }

      // Password verified - proceed with adding the conflicting staff
      onConfirm();
      onOpenChange(false);
      setPassword("");
      setError("");

      toast({
        title: "Staff Added",
        description: `${staffName} has been added despite schedule conflicts.`,
      });
    } catch (err: any) {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setPassword("");
    setError("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Schedule Conflict Warning
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                <span className="font-semibold text-foreground">{staffName}</span> has 
                schedule conflicts during this event time:
              </p>
              
              <div className="space-y-2">
                {conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20"
                  >
                    <Clock className="h-4 w-4 text-destructive shrink-0" />
                    <div className="text-sm">
                      <Badge variant="destructive" className="text-xs mr-2">
                        {conflict.startTime} - {conflict.endTime}
                      </Badge>
                      <span className="text-muted-foreground">{conflict.reason}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                To proceed with adding this staff member despite the conflict, please verify your identity by entering your password.
              </p>

              <div className="space-y-2 pt-2">
                <Label htmlFor="conflict-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password Verification
                </Label>
                <Input
                  id="conflict-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={verifying}>
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={verifying || !password}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {verifying ? "Verifying..." : "Confirm & Add Staff"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
