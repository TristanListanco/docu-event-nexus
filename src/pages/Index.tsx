import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users } from "lucide-react";
import YearSwitcher from "@/components/dashboard/year-switcher";
import EventsPage from "./EventsPage";
import StaffPage from "./StaffPage";
import { useAcademicYears } from "@/hooks/use-academic-years";

export default function Index() {
  const navigate = useNavigate();
  const { loading, years } = useAcademicYears();

  useEffect(() => {
    if (loading) return;
    const hasActive = years.some(y => !y.is_archived);
    if (!hasActive) navigate("/onboarding", { replace: true });
  }, [loading, years, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="p-4 flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage events and staff for the selected term.</p>
          </div>
          <YearSwitcher />
        </div>
      </div>

      <Tabs defaultValue="events" className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList className="mt-2">
            <TabsTrigger value="events" className="gap-2"><Calendar className="h-4 w-4" /> Events</TabsTrigger>
            <TabsTrigger value="staff" className="gap-2"><Users className="h-4 w-4" /> Staff</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="events" className="flex-1 mt-0">
          <EventsPage />
        </TabsContent>
        <TabsContent value="staff" className="flex-1 mt-0">
          <StaffPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
