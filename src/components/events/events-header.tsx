
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import NotificationsPanel from "@/components/notifications/notifications-panel";

interface EventsHeaderProps {
  onAddEvent: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function EventsHeader({ onAddEvent, onRefresh, isRefreshing }: EventsHeaderProps) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
        <div className="flex items-center space-x-4">
          <NotificationsPanel />
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button onClick={onAddEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>
    </div>
  );
}
