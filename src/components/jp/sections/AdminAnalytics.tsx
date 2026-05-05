import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { TrendingUp, Users, Activity, Scale, Droplets, Moon } from "lucide-react";
import { toast } from "sonner";

interface Analytics {
  totalMembers: number;
  avgWeightLoss: number;
  avgSteps: number;
  avgSleep: number;
  avgWater: number;
  topPerformers: { name: string; workouts: number; steps: number }[];
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      // Get all members
      const { data: members } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (!members?.length) {
        setData({
          totalMembers: 0,
          avgWeightLoss: 0,
          avgSteps: 0,
          avgSleep: 0,
          avgWater: 0,
          topPerformers: [],
        });
        setLoading(false);
        return;
      }

      const memberIds = members.map(m => m.id);

      // Get weight logs for trend
      const { data: weights } = await supabase
        .from("weight_logs")
        .select("user_id, weight_kg, date")
        .in("user_id", memberIds)
        .order("date", { ascending: true });

      // Get step logs (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
      const { data: steps } = await supabase
        .from("step_logs")
        .select("user_id, steps")
        .gte("date", thirtyDaysAgo)
        .in("user_id", memberIds);

      // Get sleep logs (last 30 days)
      const { data: sleep } = await supabase
        .from("sleep_logs")
        .select("user_id, hours")
        .gte("date", thirtyDaysAgo)
        .in("user_id", memberIds);

      // Get water logs (last 30 days)
      const { data: water } = await supabase
        .from("water_logs")
        .select("user_id, amount_ml")
        .gte("date", thirtyDaysAgo)
        .in("user_id", memberIds);

      // Get workout counts (last 30 days)
      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("user_id", { count: "exact" })
        .gte("date", thirtyDaysAgo)
        .in("user_id", memberIds);

      // Calculate averages
      const avgSteps = steps?.length
        ? Math.round(steps.reduce((sum, s) => sum + (s.steps || 0), 0) / steps.length)
        : 0;

      const avgSleep = sleep?.length
        ? (sleep.reduce((sum, s) => sum + (s.hours || 0), 0) / sleep.length).toFixed(1)
        : "0";

      const avgWater = water?.length
        ? Math.round(water.reduce((sum, w) => sum + (w.amount_ml || 0), 0) / water.length)
        : 0;

      // Top performers (by workout count)
      const workoutCounts: Record<string, number> = {};
      workouts?.forEach(w => {
        workoutCounts[w.user_id] = (workoutCounts[w.user_id] || 0) + 1;
      });

      const stepCounts: Record<string, number> = {};
      steps?.forEach(s => {
        stepCounts[s.user_id] = (stepCounts[s.user_id] || 0) + (s.steps || 0);
      });

      const topPerformers = members
        .map(m => ({
          name: m.full_name || "Unknown",
          workouts: workoutCounts[m.id] || 0,
          steps: stepCounts[m.id] || 0,
        }))
        .sort((a, b) => b.workouts - a.workouts)
        .slice(0, 5);

      setData({
        totalMembers: members.length,
        avgWeightLoss: 0, // Would need more complex calculation
        avgSteps,
        avgSleep: parseFloat(avgSleep),
        avgWater,
        topPerformers,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-extrabold">Member Progress Analytics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Members" value={data?.totalMembers || 0} />
        <StatCard icon={Activity} label="Avg Steps (30d)" value={data?.avgSteps.toLocaleString() || "0"} />
        <StatCard icon={Moon} label="Avg Sleep (30d)" value={`${data?.avgSleep || 0}h`} />
        <StatCard icon={Droplets} label="Avg Water (30d)" value={`${data?.avgWater || 0}ml`} />
      </div>

      {/* Top Performers */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Top Performers (Last 30 Days)
        </h3>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-3">
            {data?.topPerformers.map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.workouts} workouts</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{p.steps.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">steps</p>
                </div>
              </div>
            ))}
            {(!data?.topPerformers || data.topPerformers.length === 0) && (
              <p className="text-center py-4 text-muted-foreground">No workout data yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-extrabold mt-1">{value}</p>
    </div>
  );
}
