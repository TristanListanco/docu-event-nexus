import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { Term, SemesterType } from "@/types/models";
import { toast } from "./use-toast";

export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadTerms = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("terms")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Term[] = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        schoolYear: t.school_year,
        semester: t.semester as SemesterType,
        isArchived: t.is_archived,
        createdAt: t.created_at,
        archivedAt: t.archived_at,
      }));

      setTerms(mapped);
    } catch (error: any) {
      console.error("Error loading terms:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getActiveTerm = (): Term | undefined => {
    return terms.find((t) => !t.isArchived);
  };

  const createTerm = async (name: string, schoolYear: string, semester: SemesterType) => {
    try {
      if (!user) throw new Error("User not authenticated");

      // Archive the current active term first
      const activeTerm = getActiveTerm();
      if (activeTerm) {
        await supabase
          .from("terms")
          .update({ is_archived: true, archived_at: new Date().toISOString() })
          .eq("id", activeTerm.id)
          .eq("user_id", user.id);
      }

      // Create new term
      const { data: newTerm, error } = await supabase
        .from("terms")
        .insert({
          name,
          school_year: schoolYear,
          semester,
          user_id: user.id,
          is_archived: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-copy staff from previous active term
      if (activeTerm) {
        await copyStaffToNewTerm(activeTerm.id, newTerm.id);
      }

      toast({
        title: "Term Created",
        description: `${name} has been created successfully.`,
      });

      await loadTerms();
      return newTerm.id;
    } catch (error: any) {
      console.error("Error creating term:", error.message);
      toast({
        title: "Error Creating Term",
        description: error.message || "Could not create term.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const copyStaffToNewTerm = async (oldTermId: string, newTermId: string) => {
    if (!user) return;

    try {
      // Get staff from old term
      const { data: oldStaff } = await supabase
        .from("staff_members")
        .select("*")
        .eq("term_id", oldTermId)
        .eq("user_id", user.id);

      if (!oldStaff || oldStaff.length === 0) return;

      for (const staff of oldStaff) {
        // Insert new staff member for new term
        const { data: newStaff, error: staffErr } = await supabase
          .from("staff_members")
          .insert({
            name: staff.name,
            email: staff.email,
            role: staff.role,
            position: staff.position,
            photo_url: staff.photo_url,
            user_id: user.id,
            term_id: newTermId,
          })
          .select()
          .single();

        if (staffErr || !newStaff) continue;

        // Copy roles
        const { data: oldRoles } = await supabase
          .from("staff_roles")
          .select("*")
          .eq("staff_id", staff.id)
          .eq("user_id", user.id);

        if (oldRoles && oldRoles.length > 0) {
          await supabase.from("staff_roles").insert(
            oldRoles.map((r: any) => ({
              staff_id: newStaff.id,
              role: r.role,
              user_id: user.id,
              term_id: newTermId,
            }))
          );
        }

        // Copy subject schedules and schedules
        const { data: oldSubjectSchedules } = await supabase
          .from("subject_schedules")
          .select("*")
          .eq("staff_id", staff.id)
          .eq("user_id", user.id);

        if (oldSubjectSchedules) {
          for (const ss of oldSubjectSchedules) {
            const { data: newSS } = await supabase
              .from("subject_schedules")
              .insert({
                staff_id: newStaff.id,
                subject: ss.subject,
                user_id: user.id,
                term_id: newTermId,
              })
              .select()
              .single();

            if (!newSS) continue;

            const { data: oldSchedules } = await supabase
              .from("schedules")
              .select("*")
              .eq("subject_schedule_id", ss.id)
              .eq("user_id", user.id);

            if (oldSchedules && oldSchedules.length > 0) {
              await supabase.from("schedules").insert(
                oldSchedules.map((s: any) => ({
                  staff_id: newStaff.id,
                  subject_schedule_id: newSS.id,
                  day_of_week: s.day_of_week,
                  start_time: s.start_time,
                  end_time: s.end_time,
                  user_id: user.id,
                  term_id: newTermId,
                }))
              );
            }
          }
        }
      }

      toast({
        title: "Staff Copied",
        description: `${oldStaff.length} staff members copied to the new term.`,
      });
    } catch (error: any) {
      console.error("Error copying staff:", error.message);
      toast({
        title: "Warning",
        description: "Term created but staff could not be copied from previous term.",
        variant: "destructive",
      });
    }
  };

  const archiveTerm = async (termId: string) => {
    try {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("terms")
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq("id", termId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Term Archived",
        description: "The term has been archived.",
      });

      await loadTerms();
    } catch (error: any) {
      console.error("Error archiving term:", error.message);
      toast({
        title: "Error",
        description: error.message || "Could not archive term.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadTerms();
    }
  }, [user]);

  return {
    terms,
    loading,
    loadTerms,
    createTerm,
    archiveTerm,
    getActiveTerm,
    activeTerms: terms.filter((t) => !t.isArchived),
    archivedTerms: terms.filter((t) => t.isArchived),
  };
}
