-- Update storage policies to allow coach access to diet plan files
-- First, make the bucket public again for simplicity (can be restricted later)
UPDATE storage.buckets SET public = true WHERE id = 'diet-plans';

-- Drop existing policies
DROP POLICY IF EXISTS "diet user read" ON storage.objects;
DROP POLICY IF EXISTS "diet user upload" ON storage.objects;
DROP POLICY IF EXISTS "diet user update" ON storage.objects;
DROP POLICY IF EXISTS "diet user delete" ON storage.objects;

-- Create new policies that allow coaches to access their clients' files
CREATE POLICY "diet user read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'diet-plans' AND 
    (
      auth.uid()::text = (storage.foldername(name))[1] OR  -- Owner can read
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE ur.role = 'coach' AND ur.user_id = auth.uid() AND p.id = (storage.foldername(name))[1]::uuid
      )  -- Coach can read their clients' files
    )
  );

CREATE POLICY "diet user upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'diet-plans' AND 
    (
      auth.uid()::text = (storage.foldername(name))[1] OR  -- Owner can upload
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE ur.role = 'coach' AND ur.user_id = auth.uid() AND p.id = (storage.foldername(name))[1]::uuid
      )  -- Coach can upload for their clients
    )
  );

CREATE POLICY "diet user update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'diet-plans' AND 
    (
      auth.uid()::text = (storage.foldername(name))[1] OR  -- Owner can update
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE ur.role = 'coach' AND ur.user_id = auth.uid() AND p.id = (storage.foldername(name))[1]::uuid
      )  -- Coach can update their clients' files
    )
  );

CREATE POLICY "diet user delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'diet-plans' AND 
    (
      auth.uid()::text = (storage.foldername(name))[1] OR  -- Owner can delete
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.user_roles ur ON p.id = ur.user_id
        WHERE ur.role = 'coach' AND ur.user_id = auth.uid() AND p.id = (storage.foldername(name))[1]::uuid
      )  -- Coach can delete their clients' files
    )
  );