
INSERT INTO storage.buckets (id, name, public) VALUES ('diet-plans', 'diet-plans', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "diet read public" ON storage.objects FOR SELECT USING (bucket_id = 'diet-plans');
CREATE POLICY "diet user upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'diet-plans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "diet user update" ON storage.objects FOR UPDATE USING (bucket_id = 'diet-plans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "diet user delete" ON storage.objects FOR DELETE USING (bucket_id = 'diet-plans' AND auth.uid()::text = (storage.foldername(name))[1]);
