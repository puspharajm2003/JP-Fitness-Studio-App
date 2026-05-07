-- Add unique constraint to prevent duplicate check-ins at database level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'attendance' AND constraint_name = 'attendance_user_id_date_unique'
  ) THEN
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_user_id_date_unique UNIQUE (user_id, date);
  END IF;
END $$;