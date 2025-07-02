
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Edit, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import NotificationsPanel from "@/components/notifications/notifications-panel";
import { Event } from "@/types/models";

interface EventsHeaderProps {
  onAddEvent: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  // New props for event actions in header
  event?: Event;
  onEditEvent?: () => void;
  onDeleteEvent?: () => void;
  onCancelEvent?: () => void;
  showEventActions?: boolean;
}

export default function EventsHeader({ 
  onAddEvent, 
  onRefresh, 
  isRefreshing,
  event,
  onEditEvent,
  onDeleteEvent,
  onCancelEvent,
  showEventActions = false
}: EventsHeaderProps) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          {showEventActions && event ? event.name : "Events"}
        </h1>
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="relative z-50">
            <NotificationsPanel />
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="hidden sm:flex"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="sm:hidden"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          {showEventActions && onEditEvent && onDeleteEvent && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditEvent}
                className="hidden sm:flex"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onEditEvent}
                className="sm:hidden"
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              {onCancelEvent && event?.status !== "Cancelled" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancelEvent}
                    className="hidden sm:flex border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Event
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onCancelEvent}
                    className="sm:hidden border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteEvent}
                className="hidden sm:flex"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={onDeleteEvent}
                className="sm:hidden"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {!showEventActions && (
            <>
              <Button onClick={onAddEvent} className="hidden sm:flex">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
              <Button onClick={onAddEvent} size="icon" className="sm:hidden">
                <Plus className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
