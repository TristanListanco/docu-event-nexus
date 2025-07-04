
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, GraduationCap } from "lucide-react";

interface AddEventOptionsProps {
  staffAvailabilityMode: string;
  setStaffAvailabilityMode: (value: string) => void;
  sendEmailNotifications: boolean;
  setSendEmailNotifications: (value: boolean) => void;
}

export default function AddEventOptions({
  staffAvailabilityMode,
  setStaffAvailabilityMode,
  sendEmailNotifications,
  setSendEmailNotifications
}: AddEventOptionsProps) {
  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
      <h3 className="text-lg font-semibold">Options</h3>
      
      {/* Staff Availability Mode */}
      <div className="space-y-3">
        <Label>Staff Availability</Label>
        <RadioGroup
          value={staffAvailabilityMode}
          onValueChange={setStaffAvailabilityMode}
          className="grid gap-3"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="normal" id="normal" />
            <Label htmlFor="normal" className="font-normal">
              Normal (respect schedule conflicts)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ignore" id="ignore" />
            <Label htmlFor="ignore" className="font-normal">
              Show all staff (ignore schedule conflicts)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ccs" id="ccs" />
            <Label htmlFor="ccs" className="flex items-center font-normal">
              <GraduationCap className="h-4 w-4 mr-2" />
              CCS-only Event (BCA, CCC, CSC, ISY, ITE, ITN, ITD classes suspended)
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      {/* Send Email Notifications checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="sendEmails"
          checked={sendEmailNotifications}
          onCheckedChange={(checked) => setSendEmailNotifications(!!checked)}
        />
        <Label htmlFor="sendEmails" className="flex items-center">
          <Mail className="h-4 w-4 mr-2" />
          Send email notifications to assigned staff
        </Label>
      </div>
    </div>
  );
}
