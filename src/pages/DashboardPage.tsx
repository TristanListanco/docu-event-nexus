import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTerms } from "@/hooks/use-terms";
import { SemesterType } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Calendar, MoreVertical, Archive, ChevronRight, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeTerms, loading, createTerm, archiveTerm } = useTerms();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [semester, setSemester] = useState<SemesterType>("1st Semester");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !schoolYear.trim()) return;
    setCreating(true);
    try {
      const termId = await createTerm(name.trim(), schoolYear.trim(), semester);
      setDialogOpen(false);
      setName("");
      setSchoolYear("");
      setSemester("1st Semester");
      navigate(`/terms/${termId}`);
    } finally {
      setCreating(false);
    }
  };

  const handleArchive = async (termId: string) => {
    await archiveTerm(termId);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your academic terms</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Term
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Term</DialogTitle>
              <DialogDescription>
                {activeTerms.length > 0
                  ? "Creating a new term will automatically archive the current active term. Staff will be copied over."
                  : "Set up your first academic term to start managing events and staff."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="term-name">Term Name</Label>
                <Input
                  id="term-name"
                  placeholder="e.g. CCS DOCU"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-year">School Year</Label>
                <Input
                  id="school-year"
                  placeholder="e.g. 2025-2026"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={semester} onValueChange={(v) => setSemester(v as SemesterType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Semester">1st Semester</SelectItem>
                    <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !name.trim() || !schoolYear.trim()}>
                {creating ? "Creating..." : "Create Term"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeTerms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Term</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first academic term to start managing events and staff.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Term
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeTerms.map((term) => (
            <Card
              key={term.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/terms/${term.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{term.name}</CardTitle>
                  <CardDescription>
                    A.Y. {term.schoolYear} | {term.semester}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(term.id);
                        }}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Term
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(term.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
