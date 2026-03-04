import { useNavigate } from "react-router-dom";
import { useTerms } from "@/hooks/use-terms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronRight, Archive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArchivePage() {
  const navigate = useNavigate();
  const { archivedTerms, loading } = useTerms();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Archive</h1>
        <p className="text-muted-foreground">View past academic terms (read-only)</p>
      </div>

      {archivedTerms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Archived Terms</h3>
            <p className="text-muted-foreground text-center">
              Archived terms will appear here once you create a new term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {archivedTerms.map((term) => (
            <Card
              key={term.id}
              className="cursor-pointer hover:shadow-md transition-shadow opacity-80"
              onClick={() => navigate(`/archive/${term.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{term.name}</CardTitle>
                  <CardDescription>
                    A.Y. {term.schoolYear} | {term.semester}
                  </CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Archived {term.archivedAt ? new Date(term.archivedAt).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
