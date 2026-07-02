import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAcademicYears, type Semester } from "@/hooks/use-academic-years";
import { useStaff } from "@/hooks/use-staff";
import { CheckCircle2, GraduationCap, CalendarRange, UserPlus } from "lucide-react";
import type { StaffRole } from "@/types/models";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { years, activeYear, createYear, createTerm, loading, refresh } = useAcademicYears();
  const { addStaff } = useStaff();
  const [step, setStep] = useState(1);
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [semester, setSemester] = useState<Semester>("1st Semester");
  const [createdYearId, setCreatedYearId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("Photographer");
  const [staffEmail, setStaffEmail] = useState("");

  // If user already onboarded, redirect
  useEffect(() => {
    if (!loading && years.some(y => !y.is_archived)) {
      navigate("/", { replace: true });
    }
  }, [loading, years, navigate]);

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const used = new Set(years.map(y => y.start_year));
    const out: number[] = [];
    for (let y = now; y <= now + 6; y++) if (!used.has(y)) out.push(y);
    return out;
  }, [years]);

  const handleCreateYear = async () => {
    setBusy(true);
    const ay = await createYear(startYear);
    setBusy(false);
    if (ay) {
      setCreatedYearId(ay.id);
      setStep(2);
    }
  };

  const handleCreateTerm = async () => {
    if (!createdYearId) return;
    setBusy(true);
    const t = await createTerm(createdYearId, semester);
    setBusy(false);
    if (t) setStep(3);
  };

  const handleAddStaff = async () => {
    if (!staffName.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await addStaff({
        name: staffName.trim(),
        roles: [staffRole],
        email: staffEmail.trim() || undefined,
        schedules: [],
        subjectSchedules: [],
        leaveDates: [],
      } as any);
      setStaffName("");
      setStaffEmail("");
      toast({ title: "Member added" });
    } finally {
      setBusy(false);
    }
  };

  const finishOnboarding = async () => {
    await refresh();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <StepDot active={step >= 1} done={step > 1} label="Academic Year" />
          <span className="opacity-50">—</span>
          <StepDot active={step >= 2} done={step > 2} label="Term" />
          <span className="opacity-50">—</span>
          <StepDot active={step >= 3} done={false} label="Members" />
        </div>

        {step === 1 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Create your academic year</CardTitle>
                  <CardDescription>Pick the starting year for this instance.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Academic year</Label>
                <Select value={String(startYear)} onValueChange={v => setStartYear(Number(v))}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={String(y)}>{y} — {y + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {yearOptions.length === 0 && (
                  <p className="text-xs text-destructive mt-2">All near-future years are already in use.</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreateYear} disabled={busy || !yearOptions.length}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CalendarRange className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Add a semester / term</CardTitle>
                  <CardDescription>Choose the term you want to start with.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={semester} onValueChange={v => setSemester(v as Semester)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["1st Semester", "2nd Semester", "Summer"] as Semester[]).map(s => (
                  <label key={s} className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors">
                    <RadioGroupItem value={s} />
                    <span className="font-medium">{s}</span>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleCreateTerm} disabled={busy}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Add members (optional)</CardTitle>
                  <CardDescription>Quick add. You can set class schedules later from the Staff tab.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <Label>Name</Label>
                  <Input value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={staffRole} onValueChange={v => setStaffRole(v as StaffRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Photographer">Photographer</SelectItem>
                      <SelectItem value="Videographer">Videographer</SelectItem>
                      <SelectItem value="Working Com">Working Com</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email (optional)</Label>
                  <Input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} placeholder="name@example.com" />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" onClick={handleAddStaff} disabled={busy || !staffName.trim()}>
                  Add member
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={finishOnboarding}>Skip for now</Button>
                  <Button onClick={finishOnboarding}>Finish</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-foreground" : ""}`}>
      <span className={`h-6 w-6 flex items-center justify-center rounded-full border ${done ? "bg-primary text-primary-foreground border-primary" : active ? "border-primary" : ""}`}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : null}
      </span>
      <span className="text-xs md:text-sm">{label}</span>
    </div>
  );
}
