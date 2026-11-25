/*
# Selam Academy — Flexible Evaluation Weights & Multi-Quiz / Multi-Assignment Support
Allows up to 5 quizzes with customizable weights, up to 5 assignments with customizable
weights, plus customizable weights for Mid-Exam and Final Exam per subject/semester.
*/

-- 1. Drop rigid fixed-weight CHECK constraints on grades so custom weights up to 100 are allowed
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.grades'::regclass
      AND contype = 'c'
      AND (
        pg_get_constraintdef(oid) ILIKE '%quiz%'
        OR pg_get_constraintdef(oid) ILIKE '%assignment%'
        OR pg_get_constraintdef(oid) ILIKE '%mid_exam%'
        OR pg_get_constraintdef(oid) ILIKE '%final_exam%'
      )
  ) LOOP
    EXECUTE format('ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.grades
  ADD CONSTRAINT grades_quiz_nonneg CHECK (quiz >= 0 AND quiz <= 100),
  ADD CONSTRAINT grades_assignment_nonneg CHECK (assignment >= 0 AND assignment <= 100),
  ADD CONSTRAINT grades_mid_exam_nonneg CHECK (mid_exam >= 0 AND mid_exam <= 100),
  ADD CONSTRAINT grades_final_exam_nonneg CHECK (final_exam >= 0 AND final_exam <= 100);

-- 2. Add JSONB columns to store individual quiz breakdown (Q1..Q5), assignment breakdown (A1..A5), and custom weight scheme
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS evaluation_scheme jsonb NOT NULL DEFAULT '{"quizWeights":[10],"assignmentWeights":[15],"midWeight":25,"finalWeight":50}'::jsonb;

ALTER TABLE public.grades
  ADD COLUMN IF NOT EXISTS quiz_scores jsonb NOT NULL DEFAULT '[0]'::jsonb,
  ADD COLUMN IF NOT EXISTS assignment_scores jsonb NOT NULL DEFAULT '[0]'::jsonb,
  ADD COLUMN IF NOT EXISTS evaluation_scheme jsonb;

-- Allow teachers to update their assigned subject's evaluation_scheme
DROP POLICY IF EXISTS "teacher_update_own_subject_scheme" ON public.subjects;
CREATE POLICY "teacher_update_own_subject_scheme" ON public.subjects FOR UPDATE
  TO authenticated
  USING (
    public.fn_user_role() IN ('director','ict','teacher')
  )
  WITH CHECK (
    public.fn_user_role() IN ('director','ict','teacher')
  );

-- Backfill existing seeded grades so quiz_scores and assignment_scores match existing totals
UPDATE public.grades
SET quiz_scores = jsonb_build_array(quiz)
WHERE quiz_scores = '[0]'::jsonb AND quiz > 0;

UPDATE public.grades
SET assignment_scores = jsonb_build_array(assignment)
WHERE assignment_scores = '[0]'::jsonb AND assignment > 0;