import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTerms } from "@/hooks/use-terms";
import { Term } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import TermEventsTab from "@/components/terms/term-events-tab";
import TermStaffTab from "@/components/terms/term-staff-tab";

export default function TermDetailPage() {
  const { termId } = useParams<{ termId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { terms, loading } = useTerms();
  const isArchive = location.pathname.startsWith("/archive");

  const term = terms.find((t) => t.id === termId);

  // Determine initial tab from URL or default
  const [activeTab, setActiveTab] = useState("events");

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!term) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Term Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested term could not be found.</p>
        <Button onClick={() => navigate(isArchive ? "/archive" : "/")}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center gap-3 p-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isArchive ? "/archive" : "/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
              {term.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              A.Y. {term.schoolYear} | {term.semester}
              {isArchive && (
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  Archived
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-4 md:px-6">
          <TabsList className="h-12 bg-transparent p-0 gap-4">
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-3 pt-3"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-3 pt-3"
            >
              <Users className="h-4 w-4 mr-2" />
              Staff
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="events" className="flex-1 mt-0 min-h-0">
          <TermEventsTab termId={termId!} isArchive={isArchive} />
        </TabsContent>

        <TabsContent value="staff" className="flex-1 mt-0 min-h-0">
          <TermStaffTab termId={termId!} isArchive={isArchive} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
