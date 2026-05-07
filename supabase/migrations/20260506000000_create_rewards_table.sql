-- Create rewards table for validation
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  cost INT NOT NULL CHECK (cost > 0),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Allow public to view active rewards
CREATE POLICY "rewards view active" ON public.rewards
  FOR SELECT USING (is_active = true);

-- Insert default rewards
INSERT INTO public.rewards (name, cost, description) VALUES
  ('10% Gym Membership Discount', 500, 'Get 10% off your monthly membership'),
  ('1 Personal Trainer Session', 1200, 'One-on-one training session'),
  ('Free Diet Consultation', 800, 'Personalized nutrition planning'),
  ('JP Branded Bottle', 600, 'High-quality sports bottle'),
  ('Premium Plan Month', 2500, 'Access to premium features for one month'),
  ('Recovery Massage Voucher', 1500, '30-minute recovery massage')
ON CONFLICT (name) DO NOTHING;