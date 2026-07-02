This is a major architectural change. Here's the plan:

## 1. Academic Year (Instance) + Term Model

**Database changes:**
- Rework `terms` table (or add `academic_years`) so we have two levels:
  - `academic_years`: `id`, `user_id`, `start_year` (int), `end_year` (int, = start_year+1), `is_archived` (bool), `archived_at`, timestamps. Unique constraint on `(user_id, start_year)`.
  - Modify `terms`: link to `academic_year_id`, keep `semester` ("1st" or "2nd"), `is_archived`, `is_active`. Unique on `(academic_year_id, semester)`.
- Events, staff_members, staff_assignments, etc. remain scoped to `term_id`.
- Add RLS so users only see their own academic years/terms.
- Archived academic years and their terms become read-only (enforced via RLS + UI).

## 2. Onboarding Flow

Replace the current landing when the user has no active academic year with a multi-step onboarding:

```text
Step 1: Create Academic Year
  → dropdown: "2026 - 2027", "2027 - 2028", ... (current year → +5, no past years,
     no years the user already has)
Step 2: Create Term
  → radio: 1st Semester / 2nd Semester
Step 3: Add Staff + Schedules (skippable — "Skip for now")
  → reuses existing staff form; can add multiple; "Finish" button
```

After onboarding the user lands on the main dashboard for that term.

## 3. Main Page Rehaul (integrates Staff)

- Remove **Staff** from the sidebar (`main-layout.tsx`).
- Main page (Index/dashboard) becomes the workspace for the active term:
  - Top: Academic Year selector + active term indicator + "New Term" / "New Year" actions
  - Tabs: **Events** | **Staff** (staff management moves here)
  - Events tab: current events UI **without the search bar** (per #4)
  - Staff tab: current staff list, add/edit staff, schedules, leave dates
- Events routes (`/events`, `/events/:id`, `/events/add`) remain; the sidebar link stays but Staff link goes.

## 4. Archive Academic Year (password-protected, read-only)

- New "Archive Year" button on the year selector; opens a password-verification dialog (reuses the pattern from `conflict-warning-dialog`).
- On archive: sets `is_archived=true` on academic_year and all its terms; RLS + client guards block all writes on events/staff for archived years.
- Archived years appear in a separate "Archived" section, view-only.

## 5. Developer Section in About

- New "Developer" card at the bottom of `AboutPage.tsx`.
- **Clear All Data** button → warning dialog → password input → on confirm, delete for the current user: events, staff_assignments, staff_members, schedules, subject_schedules, leave_dates, terms, academic_years, notifications, borrowing_records, staff_roles. Signs out afterward.
- Implemented via a Supabase edge function `clear-user-data` that verifies the JWT and password, then cascades deletes.

## 6. Remove Events Search Bar (item #4)

- Strip the search input from `events-filters.tsx` (keep sort + filter).
- Drop `searchQuery` state from `events-page-content.tsx` and `events-page-filters.tsx`.

---

## Technical notes

- **DB migration ordering:** create `academic_years`, backfill from existing `terms` (each existing term becomes AY = derived from `school_year` string, or creates a placeholder AY), add `academic_year_id` FK to `terms`, then drop the redundant `school_year` column from terms. Include GRANTs + RLS + `has_role`-style policies scoped to `user_id`.
- **Edge function `clear-user-data`:** JWT-verified, uses service role internally to delete rows where `user_id = auth.uid()` across all owned tables in the correct FK order.
- **Archive enforcement:** RLS `USING/WITH CHECK` clauses reject updates/inserts when the parent academic year is archived. Client hides edit buttons in that state.
- **Onboarding state:** detect "needs onboarding" via `select count(*) from academic_years where user_id = auth.uid() and is_archived = false`. If zero → route to `/onboarding`.
- **Routing:** add `/onboarding` (protected, public within auth). Remove `/staff` sidebar item; the staff *page* becomes a tab component embedded in the dashboard.

---

## Files touched (high-level)

- Migration: new tables + policies + backfill
- New: `src/pages/OnboardingPage.tsx`, `src/components/onboarding/*`
- New: `src/components/developer/clear-data-dialog.tsx`
- New: `supabase/functions/clear-user-data/index.ts`
- Modified: `src/App.tsx` (routes), `src/components/layout/main-layout.tsx` (remove Staff), `src/pages/Index.tsx` (dashboard with Events/Staff tabs), `src/pages/AboutPage.tsx` (Developer section), `src/components/events/events-filters.tsx` + related (remove search), `src/hooks/use-events.tsx` + staff hooks (scope by active AY/term).

---

## Open questions before I build

1. When the user creates a **new academic year**, should the previous year auto-archive, or stay editable in parallel?
2. Can a user have **multiple active terms** at once (e.g. both 1st and 2nd sem live), or only one active term per year?
3. For onboarding step 3 (Add Staff), do you want the schedule editor there too, or just name + role, with schedules added later from the Staff tab?
4. After "Clear All Data", should the account itself be deleted, or just wiped so the user can start fresh onboarding?

Please answer these four, then I'll implement.