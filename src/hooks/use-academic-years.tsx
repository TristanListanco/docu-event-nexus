import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "./use-toast";

export type Semester = "1st Semester" | "2nd Semester" | "Summer";

export interface AcademicYear {
  id: string;
  user_id: string;
  start_year: number;
  end_year: number;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface Term {
  id: string;
  name: string;
  school_year: string;
  semester: Semester;
  is_archived: boolean;
  archived_at: string | null;
  academic_year_id: string | null;
  user_id: string;
}

interface Ctx {
  loading: boolean;
  years: AcademicYear[];
  terms: Term[];
  activeYear: AcademicYear | null;
  activeTerm: Term | null;
  isReadOnly: boolean;
  selectYear: (id: string) => void;
  refresh: () => Promise<void>;
  createYear: (startYear: number) => Promise<AcademicYear | null>;
  createTerm: (academicYearId: string, semester: Semester) => Promise<Term | null>;
  archiveYear: (id: string) => Promise<boolean>;
}

const AcademicYearsContext = createContext<Ctx | undefined>(undefined);

export function AcademicYearsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setYears([]);
      setTerms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [{ data: ys }, { data: ts }] = await Promise.all([
        (supabase as any).from("academic_years").select("*").eq("user_id", user.id).order("start_year", { ascending: false }),
        supabase.from("terms").select("*").eq("user_id", user.id),
      ]);
      setYears((ys as AcademicYear[]) || []);
      setTerms((ts as unknown as Term[]) || []);
    } catch (e: any) {
      console.error("AcademicYears load error", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Default selection: newest non-archived, else newest
  useEffect(() => {
    if (selectedYearId && years.some(y => y.id === selectedYearId)) return;
    const active = years.find(y => !y.is_archived) || years[0];
    setSelectedYearId(active?.id ?? null);
  }, [years, selectedYearId]);

  const activeYear = years.find(y => y.id === selectedYearId) ?? null;
  const activeTerm = activeYear
    ? (terms.filter(t => t.academic_year_id === activeYear.id && !t.is_archived).sort((a, b) => a.semester.localeCompare(b.semester))[0]
       || terms.filter(t => t.academic_year_id === activeYear.id)[0]
       || null)
    : null;
  const isReadOnly = !!activeYear?.is_archived;

  const createYear = async (startYear: number) => {
    if (!user) return null;
    // Auto-archive previous years
    const prevIds = years.filter(y => !y.is_archived).map(y => y.id);
    if (prevIds.length) {
      await (supabase as any).from("academic_years").update({ is_archived: true, archived_at: new Date().toISOString() }).in("id", prevIds);
      await supabase.from("terms").update({ is_archived: true, archived_at: new Date().toISOString() }).in("academic_year_id", prevIds);
    }
    const { data, error } = await (supabase as any)
      .from("academic_years")
      .insert({ user_id: user.id, start_year: startYear, end_year: startYear + 1 })
      .select()
      .single();
    if (error) {
      toast({ title: "Could not create academic year", description: error.message, variant: "destructive" });
      return null;
    }
    await refresh();
    setSelectedYearId(data.id);
    return data as AcademicYear;
  };

  const createTerm = async (academicYearId: string, semester: Semester) => {
    if (!user) return null;
    const ay = years.find(y => y.id === academicYearId);
    if (!ay) return null;
    // Auto-archive previous terms in this year
    const prevTermIds = terms.filter(t => t.academic_year_id === academicYearId && !t.is_archived).map(t => t.id);
    if (prevTermIds.length) {
      await supabase.from("terms").update({ is_archived: true, archived_at: new Date().toISOString() }).in("id", prevTermIds);
    }
    const schoolYear = `${ay.start_year}-${ay.end_year}`;
    const { data, error } = await (supabase as any)
      .from("terms")
      .insert({
        user_id: user.id,
        academic_year_id: academicYearId,
        school_year: schoolYear,
        semester,
        name: `${semester} ${schoolYear}`,
        is_archived: false,
      })
      .select()
      .single();
    if (error) {
      toast({ title: "Could not create term", description: error.message, variant: "destructive" });
      return null;
    }
    await refresh();
    return data as Term;
  };

  const archiveYear = async (id: string) => {
    const now = new Date().toISOString();
    const { error: e1 } = await (supabase as any)
      .from("academic_years")
      .update({ is_archived: true, archived_at: now })
      .eq("id", id);
    if (e1) {
      toast({ title: "Archive failed", description: e1.message, variant: "destructive" });
      return false;
    }
    await supabase.from("terms").update({ is_archived: true, archived_at: now }).eq("academic_year_id", id);
    await refresh();
    return true;
  };

  const selectYear = (id: string) => setSelectedYearId(id);

  return (
    <AcademicYearsContext.Provider value={{ loading, years, terms, activeYear, activeTerm, isReadOnly, selectYear, refresh, createYear, createTerm, archiveYear }}>
      {children}
    </AcademicYearsContext.Provider>
  );
}

export function useAcademicYears() {
  const ctx = useContext(AcademicYearsContext);
  if (!ctx) throw new Error("useAcademicYears must be used within AcademicYearsProvider");
  return ctx;
}
