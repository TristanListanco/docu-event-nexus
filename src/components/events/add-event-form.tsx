
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventType } from "@/types/models";

interface AddEventFormProps {
  name: string;
  setName: (value: string) => void;
  organizer: string;
  setOrganizer: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  type: EventType;
  setType: (value: EventType) => void;
}

export default function AddEventForm({
  name,
  setName,
  organizer,
  setOrganizer,
  location,
  setLocation,
  type,
  setType
}: AddEventFormProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Event Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Event Name"
          required
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="organizer">Organizer/s</Label>
        <Input
          id="organizer"
          type="text"
          value={organizer}
          onChange={(e) => setOrganizer(e.target.value)}
          placeholder="Event Organizer/s"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Event Location</Label>
        <Input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Event Location"
          required
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Event Type</Label>
        <Select value={type} onValueChange={(value) => setType(value as EventType)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SPECOM">SPECOM</SelectItem>
            <SelectItem value="LITCOM">LITCOM</SelectItem>
            <SelectItem value="CUACOM">CUACOM</SelectItem>
            <SelectItem value="SPODACOM">SPODACOM</SelectItem>
            <SelectItem value="General">General</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
