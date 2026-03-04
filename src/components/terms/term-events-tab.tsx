import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "@/hooks/events/use-events";
import { useIsMobile } from "@/hooks/use-mobile";
import EventsPageContent from "@/components/events/events-page-content";
import EventActionsManager from "@/components/events/event-actions-manager";
import AddEventDialog from "@/components/events/add-event-dialog";
import AddEventSheet from "@/components/events/add-event-sheet";
import { getEventStatus } from "@/components/events/event-status-utils";
import { Event } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, FileText } from "lucide-react";
import NotificationsPanel from "@/components/notifications/notifications-panel";
import { fetchStaffAttendanceData, generateAttendanceReportPDF } from "@/utils/attendance-report-generator";
import { useStaff } from "@/hooks/use-staff";
import { toast } from "@/hooks/use-toast";
import EventsPageSkeleton from "@/components/loading/events-page-skeleton";

interface TermEventsTabProps {
  termId: string;
  isArchive: boolean;
}

export default function TermEventsTab({ termId, isArchive }: TermEventsTabProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { events, loading, loadEvents } = useEvents(termId);
  const { staff } = useStaff(termId);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [addEventSheetOpen, setAddEventSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const eventActions = EventActionsManager({
    onEventUpdated: () => {},
    onEventDeleted: () => {},
  });

  const handleEventClick = (event: Event) => {
    const prefix = isArchive ? `/archive/${termId}` : `/terms/${termId}`;
    navigate(`${prefix}/events/${event.id}`);
  };

  const handleEditEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    if (!isArchive) eventActions.editHandler(e, event);
  };

  const handleDeleteEvent = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    if (!isArchive) eventActions.deleteHandler(e, event);
  };

  const handleAddEvent = () => {
    if (isMobile) {
      setAddEventSheetOpen(true);
    } else {
      setAddEventDialogOpen(true);
    }
  };

  const handleEventAdded = async () => {
    await loadEvents();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      toast({
        title: "Generating Report",
        description: "Please wait while we fetch attendance data...",
      });
      const attendanceData = await fetchStaffAttendanceData(staff);
      generateAttendanceReportPDF(attendanceData);
      toast({
        title: "Report Generated",
        description: "Your attendance report has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate attendance report.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <EventsPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 md:px-6 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Events ({events.length})</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative z-50">
            <NotificationsPanel />
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerateReport} className="hidden sm:flex">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" size="icon" onClick={handleGenerateReport} className="sm:hidden">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="hidden sm:flex">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="sm:hidden">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          {!isArchive && (
            <>
              <Button onClick={handleAddEvent} className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
              <Button onClick={handleAddEvent} size="icon" className="sm:hidden">
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Events content */}
      <div className="flex-1 overflow-hidden">
        <EventsPageContent
          events={events}
          onEventClick={handleEventClick}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          getEventStatus={getEventStatus}
        />
      </div>

      {!isArchive && (
        <>
          <AddEventDialog
            open={addEventDialogOpen}
            onOpenChange={setAddEventDialogOpen}
            onEventAdded={handleEventAdded}
            termId={termId}
          />
          <AddEventSheet
            open={addEventSheetOpen}
            onOpenChange={setAddEventSheetOpen}
            onEventAdded={handleEventAdded}
            termId={termId}
          />
          {eventActions.dialogs}
        </>
      )}
    </div>
  );
}
