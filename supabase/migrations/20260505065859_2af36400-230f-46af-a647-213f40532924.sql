
UPDATE storage.buckets SET public = false WHERE id = 'diet-plans';
DROP POLICY IF EXISTS "diet read public" ON storage.objects;
CREATE POLICY "diet user read" ON storage.objects FOR SELECT USING (bucket_id = 'diet-plans' AND auth.uid()::text = (storage.foldername(name))[1]);
