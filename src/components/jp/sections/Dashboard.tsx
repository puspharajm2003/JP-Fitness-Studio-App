import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { today } from "@/lib/dateUtil";
import { Activity, ClipboardCheck, Dumbbell, Flame, Footprints, GlassWater, MessageCircle, Moon, Scale, Sparkles, TrendingDown, Trophy, TrendingUp, CheckCircle, AlertCircle, X, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import TrendsSection from "./TrendsSection";

type SensorStatus = "idle" | "active" | "syncing" | "synced" | "error";

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [stats, setStats] = useState({ steps: 0, water: 0, weight: 0, attendance: 0, kcal: 0, workouts: 0, sleep: 0 });
  const [pkg, setPkg] = useState<any>(null);
  const [deviceSteps, setDeviceSteps] = useState<number | null>(null);
  const [deviceSleep, setDeviceSleep] = useState<number | null>(null);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>("idle");
  const [showSensorModal, setShowSensorModal] = useState(false);

  const loadStats = useCallback(async () => {
    if (!user) return;
    const t = today();
    const [steps, water, weight, attCount, food, workouts, p, sleepLog] = await Promise.all([
      supabase.from("step_logs").select("steps").eq("user_id", user.id).eq("date", t).maybeSingle(),
      supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("date", t),
      supabase.from("weight_logs").select("weight_kg,date").eq("user_id", user.id).order("date",{ascending:false}).limit(1),
      supabase.from("attendance").select("id", { count:"exact", head:true }).eq("user_id", user.id).gte("date", new Date(Date.now()-30*864e5).toISOString().slice(0,10)),
      supabase.from("food_logs").select("kcal").eq("user_id", user.id).eq("date", t),
      supabase.from("workout_logs").select("id",{count:"exact",head:true}).eq("user_id", user.id).gte("date", new Date(Date.now()-7*864e5).toISOString().slice(0,10)),
      supabase.from("packages").select("*").eq("user_id", user.id).eq("status","active").order("end_date",{ascending:true}).limit(1).maybeSingle(),
      supabase.from("sleep_logs").select("hours").eq("user_id", user.id).eq("date", t).maybeSingle(),
    ]);
    setStats({
      steps: steps.data?.steps ?? 0,
      water: (water.data ?? []).reduce((s,r)=>s+(r.amount_ml||0),0),
      weight: weight.data?.[0]?.weight_kg ?? 0,
      attendance: attCount.count ?? 0,
      kcal: (food.data ?? []).reduce((s,r)=>s+(r.kcal||0),0),
      workouts: workouts.count ?? 0,
      sleep: sleepLog.data?.hours ?? 0,
    });
    setPkg(p.data);
  }, [user]);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Try to read device step data via Sensor API (available on Android Chrome)
  useEffect(() => {
    let sensor: any = null;
    try {
      if ("Accelerometer" in window) {
        let stepCount = 0;
        let lastMagnitude = 0;
        const threshold = 12;
        sensor = new (window as any).Accelerometer({ frequency: 10 });
        sensor.addEventListener("reading", () => {
          const mag = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2);
          if (lastMagnitude > threshold && mag < threshold) {
            stepCount++;
            setDeviceSteps(stepCount);
          }
          lastMagnitude = mag;
        });
        sensor.addEventListener("error", () => setSensorStatus("error"));
        sensor.start();
        setSensorStatus("active");
      } else {
        setSensorStatus("error");
      }
    } catch {
      setSensorStatus("error");
    }
    return () => { if (sensor) try { sensor.stop(); } catch {} };
  }, []);

  // Estimate sleep from user's last known data
  useEffect(() => {
    if (stats.sleep > 0) setDeviceSleep(stats.sleep);
  }, [stats.sleep]);

  // Auto-sync device steps to Supabase every 30s
  useEffect(() => {
    if (deviceSteps && deviceSteps > 0 && user) {
      const syncTimeout = setTimeout(async () => {
        setSensorStatus("syncing");
        const totalSteps = stats.steps + deviceSteps;
        const { error } = await supabase.from("step_logs").upsert(
          { user_id: user.id, date: today(), steps: totalSteps },
          { onConflict: "user_id,date" }
        );
        if (!error) {
          setSensorStatus("synced");
          setTimeout(() => setSensorStatus("active"), 3000);
        } else {
          setSensorStatus("error");
        }
      }, 30000);
      return () => clearTimeout(syncTimeout);
    }
  }, [deviceSteps, user, stats.steps]);

   const checkIn = async () => {
     if (!user) return;
     const t = new Date().toISOString().slice(0, 10);
     const { error } = await supabase.from("attendance").insert({ user_id: user.id, date: t });
     if (error) {
       // Handle unique constraint violation (duplicate check-in for today)
       if (error.code === '23505') {
         toast("Already checked in today! Come back tomorrow 💪", { icon: "✅" });
       } else {
         toast.error(error.message);
       }
       return;
     }
     // Update points on profile
     const newPoints = (profile?.loyalty_points || 0) + 10;
     await supabase.from("profiles").update({ loyalty_points: newPoints }).eq("id", user.id);
     // Log point change
     await supabase.from("loyalty_point_logs").insert({
       user_id: user.id,
       points_change: 10,
       reason: "check-in",
       related_id: null,
     });
     // Refresh profile to update loyalty_points in UI
     await refresh();
     toast.success(`Checked in! +10 points (Total: ${newPoints} pts)`);
     loadStats();
   };

  const coachMsg = () => {
    const phone = (profile?.coach_phone||"").replace(/\D/g,"");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent("Hi Coach, I need help with my plan.")}`, "_blank");
  };

  const daysLeft = pkg ? Math.max(0, Math.ceil((new Date(pkg.end_date).getTime()-Date.now())/864e5)) : null;
  const displaySteps = (deviceSteps || 0) + stats.steps;
  const stepGoal = profile?.daily_step_goal || 10000;
  const stepPercent = Math.min(100, (displaySteps / stepGoal) * 100);
  const sleepGoal = profile?.sleep_goal_hr || 8;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand-3 p-7 md:p-10 text-primary-foreground shadow-brand">
        <div className="absolute -top-20 -right-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur text-xs font-semibold mb-3">
            <Sparkles className="w-3 h-3" /> Welcome back
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">Hi, {profile?.full_name || "Champion"}!</h1>
          <p className="opacity-90 mt-2 max-w-lg">Stay consistent today. {profile?.goal === "weight_loss" ? "Every small calorie deficit counts." : "Keep building strength!"}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={checkIn} className="px-5 py-2.5 rounded-xl bg-white text-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform">
              <ClipboardCheck className="w-4 h-4" /> Check in
            </button>
            <button onClick={coachMsg} className="px-5 py-2.5 rounded-xl bg-black/20 backdrop-blur text-white font-semibold flex items-center gap-2 hover:bg-black/30 transition-colors">
              <MessageCircle className="w-4 h-4" /> Message Coach
            </button>
          </div>
        </div>
      </div>

      {pkg && daysLeft !== null && daysLeft <= 7 && (
        <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4 flex items-center gap-3">
          <Trophy className="w-5 h-5 text-accent" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Package "{pkg.name}" expires in {daysLeft} day{daysLeft!==1?"s":""}</p>
            <p className="text-xs text-muted-foreground">Renew with your coach to keep your streak alive.</p>
          </div>
          <Link to="/profile" className="px-3 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-semibold">Renew</Link>
        </div>
      )}

      {/* Steps & Sleep Real-time cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Steps card with circular progress */}
        <Link to="/activity" className="glass-card rounded-2xl p-4 hover:scale-[1.02] transition-transform animate-pop relative">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Footprints className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex flex-col items-end gap-1">
               {deviceSteps !== null && (
                 <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse">
                   LIVE
                 </span>
               )}
               {sensorStatus === "syncing" && (
                 <span className="text-[8px] flex items-center gap-1 text-emerald-600 font-bold">
                   <CheckCircle className="w-2.5 h-2.5" /> Synced
                 </span>
               )}
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Steps Today</p>
          <p className="font-display text-2xl font-extrabold">{displaySteps.toLocaleString()}</p>
          <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000" style={{ width: `${stepPercent}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">/ {stepGoal.toLocaleString()} goal</p>
        </Link>

        {/* Sleep card */}
        <Link to="/activity" className="glass-card rounded-2xl p-4 hover:scale-[1.02] transition-transform animate-pop">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-600" />
            </div>
            {stats.sleep > 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold">
                LOGGED
              </span>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sleep</p>
          <p className="font-display text-2xl font-extrabold">{stats.sleep > 0 ? `${stats.sleep}h` : "—"}</p>
          <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-400 transition-all duration-1000"
              style={{ width: `${Math.min(100, (stats.sleep / sleepGoal) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">/ {sleepGoal}h goal</p>
        </Link>
      </div>

      {/* Main stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={GlassWater} label="Water" value={`${stats.water}ml`} sub={`/ ${profile?.daily_water_goal_ml || 2500}`} to="/water" />
        <StatTile icon={Flame} label="Calories" value={`${stats.kcal}`} sub={`/ ${profile?.daily_calorie_goal || 2000}`} to="/diet" />
        <StatTile icon={Dumbbell} label="Workouts" value={`${stats.workouts}`} sub="this week" to="/workout" />
        <StatTile icon={Scale} label="Weight" value={stats.weight ? `${stats.weight}kg` : "—"} sub="latest" to="/progress" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <QuickCard to="/progress" icon={Scale} title="Weight & Inches" desc={stats.weight ? `Current: ${stats.weight} kg` : "Log your first measurement"} accent />
        <QuickCard to="/attendance" icon={ClipboardCheck} title="Attendance" desc={`${stats.attendance} check-ins last 30 days`} />
        <QuickCard to="/diet" icon={Activity} title="Today's Diet Plan" desc="View AI meal suggestions for your goals" />
        <QuickCard to="/rewards" icon={Trophy} title={`${profile?.loyalty_points || 0} pts`} desc="Redeem PT sessions & gym discounts" />
      </div>

      {/* Trends Section */}
      <TrendsSection />
    </div>
  );
}

function StatTile({ icon:Icon, label, value, sub, to }: any) {
  return (
    <Link to={to} className="glass-card rounded-2xl p-4 hover:scale-[1.02] transition-transform animate-pop">
      <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center mb-2"><Icon className="w-5 h-5" style={{color:"hsl(var(--primary))"}} /></div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Link>
  );
}
function QuickCard({ to, icon:Icon, title, desc, accent }: any) {
  return (
    <Link to={to} className={`rounded-2xl p-5 flex items-center gap-4 transition-transform hover:scale-[1.01] ${accent ? "bg-gradient-brand text-primary-foreground shadow-brand" : "glass-card"}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent ? "bg-white/20" : "bg-gradient-soft"}`}>
        <Icon className="w-5 h-5" style={accent?{}:{color:"hsl(var(--primary))"}} />
      </div>
      <div className="flex-1">
        <p className="font-display font-bold">{title}</p>
        <p className={`text-xs ${accent?"opacity-90":"text-muted-foreground"}`}>{desc}</p>
      </div>
    </Link>
  );
}
