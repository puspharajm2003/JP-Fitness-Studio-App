-- Migration: Create loyalty_point_logs table for tracking point changes
CREATE TABLE public.loyalty_point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_change INT NOT NULL, -- positive for earn, negative for redeem
  reason TEXT NOT NULL, -- e.g., 'check-in', 'redemption: Reward Name'
  related_id UUID, -- optional reference to related record (attendance, redemption, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.loyalty_point_logs ENABLE ROW LEVEL SECURITY;

-- Policy: users can select their own point logs
CREATE POLICY "own point logs" ON public.loyalty_point_logs
  FOR SELECT USING (auth.uid() = user_id);
