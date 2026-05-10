import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export interface Profile {
  id: string; full_name: string | null; phone: string | null; avatar_url: string | null;
  gender: string | null; dob: string | null; height_cm: number | null;
  goal: string | null; target_weight_kg: number | null;
  daily_calorie_goal: number; daily_water_goal_ml: number; daily_step_goal: number; sleep_goal_hr: number;
  theme: string; coach_phone: string; loyalty_points: number;
  coach_id: string | null; coach_name: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(data as any); setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Periodic refresh every 30s for near-real-time updates (replaces broken Supabase realtime channel)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  const update = async (patch: Partial<Profile>) => {
    if (!user) return { error: new Error("No user") };
    const { data, error } = await supabase.from("profiles").update(patch as any).eq("id", user.id).select().single();
    if (error) return { error };
    if (data) setProfile(data as any);
    return { data };
  };

  return { profile, loading, refresh, update };
};

