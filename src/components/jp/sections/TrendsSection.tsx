import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

type Period = "weekly" | "monthly";

export default function TrendsSection() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [period, setPeriod] = useState<Period>("weekly");
  const [stepTrend, setStepTrend] = useState<any[]>([]);
  const [sleepTrend, setSleepTrend] = useState<any[]>([]);
  const [waterTrend, setWaterTrend] = useState<any[]>([]);
  const [weightTrend, setWeightTrend] = useState<any[]>([]);
  const [calorieTrend, setCalorieTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const days = period === "weekly" ? 7 : 30;
      const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
      try {
        const [steps, sleep, water, weight, food] = await Promise.all([
          supabase.from("step_logs").select("date,steps").eq("user_id", user.id).gte("date", since).order("date"),
          supabase.from("sleep_logs").select("date,hours").eq("user_id", user.id).gte("date", since).order("date"),
          supabase.from("water_logs").select("date,amount_ml").eq("user_id", user.id).gte("date", since).order("date"),
          supabase.from("weight_logs").select("date,weight_kg").eq("user_id", user.id).gte("date", since).order("date"),
          supabase.from("food_logs").select("date,kcal").eq("user_id", user.id).gte("date", since).order("date"),
        ]);

        const agg = (rows: any[], key: string) => {
          const map: Record<string, number> = {};
          (rows?.data || []).forEach((r: any) => { map[r.date] = (map[r.date] || 0) + (r[key] || 0); });
          return Object.entries(map).map(([date, value]) => ({ date, value }));
        };

        setStepTrend(agg(steps, "steps"));
        setSleepTrend(agg(sleep, "hours"));
        setWaterTrend(agg(water, "amount_ml"));
        setWeightTrend(agg(weight, "weight_kg"));
        setCalorieTrend(agg(food, "kcal"));
      } catch (err) {
        console.error("Trend load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Progress Trends
        </h3>
        <div className="flex bg-secondary rounded-xl p-1">
          {(["weekly", "monthly"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                period === p ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading charts...</p>
      ) : (
        <div className="space-y-6">
          {/* Steps Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Steps vs Goal</h4>
            <ChartContainer config={{ steps: { label: "Steps", color: "#3b82f6" } }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stepTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-steps)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            {stepTrend.length === 0 && (
              <p className="text-center py-4 text-muted-foreground text-sm">No step data yet.</p>
            )}
          </div>

          {/* Sleep Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Sleep Hours</h4>
            <ChartContainer config={{ sleep: { label: "Hours", color: "#8b5cf6" } }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sleepTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-sleep)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            {sleepTrend.length === 0 && (
              <p className="text-center py-4 text-muted-foreground text-sm">No sleep data yet.</p>
            )}
          </div>

          {/* Water Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Water Intake (ml)</h4>
            <ChartContainer config={{ water: { label: "Water (ml)", color: "#06b6d4" } }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={waterTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-water)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            {waterTrend.length === 0 && (
              <p className="text-center py-4 text-muted-foreground text-sm">No water data yet.</p>
            )}
          </div>

          {/* Weight Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Weight (kg)</h4>
            <ChartContainer config={{ weight: { label: "Weight (kg)", color: "#f59e0b" } }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-weight)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            {weightTrend.length === 0 && (
              <p className="text-center py-4 text-muted-foreground text-sm">No weight data yet.</p>
            )}
          </div>

          {/* Calories Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Calories Consumed</h4>
            <ChartContainer config={{ calories: { label: "Calories", color: "#ef4444" } }}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={calorieTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="value" stroke="var(--color-calories)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            {calorieTrend.length === 0 && (
              <p className="text-center py-4 text-muted-foreground text-sm">No calorie data yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
