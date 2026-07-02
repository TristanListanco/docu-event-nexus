
-- 1. academic_years table
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT academic_years_user_start_unique UNIQUE (user_id, start_year),
  CONSTRAINT academic_years_year_range CHECK (end_year = start_year + 1)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own academic_years"
  ON public.academic_years FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Add academic_year_id to terms
ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE;

-- 3. Backfill existing terms
DO $$
DECLARE
  t RECORD;
  ay_id UUID;
  start_y INT;
BEGIN
  FOR t IN SELECT id, user_id, school_year FROM public.terms WHERE academic_year_id IS NULL LOOP
    start_y := NULLIF(split_part(t.school_year, '-', 1), '')::INT;
    IF start_y IS NULL THEN CONTINUE; END IF;

    SELECT id INTO ay_id FROM public.academic_years WHERE user_id = t.user_id AND start_year = start_y;
    IF ay_id IS NULL THEN
      INSERT INTO public.academic_years (user_id, start_year, end_year)
      VALUES (t.user_id, start_y, start_y + 1)
      RETURNING id INTO ay_id;
    END IF;

    UPDATE public.terms SET academic_year_id = ay_id WHERE id = t.id;
  END LOOP;
END $$;

-- 4. Unique (academic_year_id, semester) per year
CREATE UNIQUE INDEX IF NOT EXISTS terms_ay_semester_unique
  ON public.terms(academic_year_id, semester)
  WHERE academic_year_id IS NOT NULL;

-- 5. updated_at trigger for academic_years
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS academic_years_set_updated_at ON public.academic_years;
CREATE TRIGGER academic_years_set_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
