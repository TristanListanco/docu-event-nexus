
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">Manage your scheduled events</p>
          </div>
          <Button onClick={() => navigate("/events/new")}>
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>
      
      <div className="p-4 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder cards for events - in real app, these would be populated from data */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                  SPECOM
                </div>
              </div>
              <CardTitle className="mt-2">Thesis Defense</CardTitle>
              <p className="text-muted-foreground text-sm">May 15, 2025</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">📍 AVR Room</p>
              <p className="text-sm">🕒 9:00 AM - 11:00 AM</p>
              <div className="flex justify-between mt-2">
                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded-full">
                  Upcoming
                </span>
                <span className="text-xs text-muted-foreground">
                  Log ID: EV-2025-001
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div className="rounded-full bg-primary/10 w-10 h-10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                  LITCOM
                </div>
              </div>
              <CardTitle className="mt-2">Department Meeting</CardTitle>
              <p className="text-muted-foreground text-sm">May 20, 2025</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">📍 Conference Room</p>
              <p className="text-sm">🕒 1:00 PM - 3:00 PM</p>
              <div className="flex justify-between mt-2">
                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded-full">
                  Upcoming
                </span>
                <span className="text-xs text-muted-foreground">
                  Log ID: EV-2025-002
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
