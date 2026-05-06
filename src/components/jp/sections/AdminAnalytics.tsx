import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { TrendingUp, Users, Activity, Scale, Droplets, Moon, ArrowLeft, RefreshCcw, Sparkles, Trophy, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Analytics {
  totalMembers: number;
  avgWeightLoss: number;
  avgSteps: number;
  avgSleep: number;
  avgWater: number;
  topPerformers: { name: string; workouts: number; steps: number }[];
}

const SYNC_INTERVAL = 60000; // 1m for complex analytics

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setIsSyncing(true);
    try {
      // Get all members
      const { data: members } = await supabase.from("profiles").select("id, full_name");

      if (!members?.length) {
        setData({ totalMembers: 0, avgWeightLoss: 0, avgSteps: 0, avgSleep: 0, avgWater: 0, topPerformers: [] });
        return;
      }

      const memberIds = members.map(m => m.id);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

      const [stepsRes, sleepRes, waterRes, workoutsRes] = await Promise.all([
        supabase.from("step_logs").select("user_id, steps").gte("date", thirtyDaysAgo).in("user_id", memberIds),
        supabase.from("sleep_logs").select("user_id, hours").gte("date", thirtyDaysAgo).in("user_id", memberIds),
        supabase.from("water_logs").select("user_id, amount_ml").gte("date", thirtyDaysAgo).in("user_id", memberIds),
        supabase.from("workout_logs").select("user_id").gte("date", thirtyDaysAgo).in("user_id", memberIds)
      ]);

      const avgSteps = stepsRes.data?.length ? Math.round(stepsRes.data.reduce((sum, s) => sum + (s.steps || 0), 0) / stepsRes.data.length) : 0;
      const avgSleep = sleepRes.data?.length ? (sleepRes.data.reduce((sum, s) => sum + (s.hours || 0), 0) / sleepRes.data.length).toFixed(1) : "0";
      const avgWater = waterRes.data?.length ? Math.round(waterRes.data.reduce((sum, w) => sum + (w.amount_ml || 0), 0) / waterRes.data.length) : 0;

      const workoutCounts: Record<string, number> = {};
      workoutsRes.data?.forEach(w => { workoutCounts[w.user_id] = (workoutCounts[w.user_id] || 0) + 1; });

      const stepCounts: Record<string, number> = {};
      stepsRes.data?.forEach(s => { stepCounts[s.user_id] = (stepCounts[s.user_id] || 0) + (s.steps || 0); });

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
        avgWeightLoss: 0,
        avgSteps,
        avgSleep: parseFloat(avgSleep),
        avgWater,
        topPerformers,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { 
    load(true);
    const id = setInterval(() => load(false), SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
       <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/admin" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-all mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Badge variant="outline" className="rounded-full bg-purple-500/5 text-purple-600 border-purple-500/20 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              Global Performance
            </Badge>
            {isSyncing && <RefreshCcw className="w-3.5 h-3.5 text-primary animate-spin" />}
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-black tracking-tight">Analytics <span className="text-muted-foreground/30 font-normal">Core</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Aggregated member data and behavioral insights.</p>
        </div>
        <button onClick={() => load(true)} className="px-6 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-sm shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
          <RefreshCcw className={cn("w-4 h-4", isSyncing && "animate-spin")} /> Re-Calculate
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCardUltra icon={Users} label="Total Members" value={data?.totalMembers || 0} color="blue" />
        <StatCardUltra icon={Activity} label="Avg Daily Steps" value={data?.avgSteps.toLocaleString() || "0"} color="emerald" />
        <StatCardUltra icon={Moon} label="Avg Sleep Cycle" value={`${data?.avgSleep || 0}h`} color="indigo" />
        <StatCardUltra icon={Droplets} label="Avg Hydration" value={`${data?.avgWater || 0}ml`} color="sky" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-white dark:bg-slate-900 overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy className="w-48 h-48" />
               </div>
               <h3 className="font-display font-black text-2xl mb-2 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" /> Performance Leaders
               </h3>
               <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-10">Last 30 Days Activity Matrix</p>

               {loading ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                    <p className="font-display font-black text-slate-400 uppercase tracking-widest text-sm">Processing Data Matrix...</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {data?.topPerformers.map((p, i) => (
                     <div key={i} className="flex items-center gap-4 p-5 rounded-[24px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50 hover:scale-[1.01] transition-all">
                       <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-primary-foreground font-black text-lg shadow-brand transform rotate-2">
                         {i + 1}
                       </div>
                       <div className="flex-1">
                         <p className="font-bold text-base mb-1">{p.name}</p>
                         <div className="flex items-center gap-3">
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">{p.workouts} WORKOUTS</Badge>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="font-black text-xl text-primary">{p.steps.toLocaleString()}</p>
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Steps</p>
                       </div>
                     </div>
                   ))}
                   {(!data?.topPerformers || data.topPerformers.length === 0) && (
                     <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <Zap className="w-12 h-12 mb-2" />
                        <p className="font-bold uppercase tracking-widest text-xs text-center">No high-activity profiles detected<br/>in the last 30 days</p>
                     </div>
                   )}
                 </div>
               )}
            </div>
         </div>

         <div className="lg:col-span-1">
            <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-slate-900 text-white flex flex-col h-full">
               <h3 className="font-display font-black text-2xl mb-2">Health Targets</h3>
               <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-10">Studio Benchmarks</p>
               
               <div className="flex-1 space-y-10">
                  <TargetItem label="Step Consistency" value={68} color="bg-blue-400" />
                  <TargetItem label="Sleep Regularity" value={54} color="bg-indigo-400" />
                  <TargetItem label="Water Intake" value={82} color="bg-sky-400" />
                  <TargetItem label="Weight Goals" value={42} color="bg-purple-400" />
               </div>

               <div className="mt-12 p-6 rounded-[24px] bg-white/5 border border-white/10 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Member Retention Risk</p>
                  <p className="text-2xl font-display font-black text-amber-400">MODERATE</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCardUltra({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    indigo: "bg-indigo-500",
    sky: "bg-sky-500",
  };
  return (
    <div className="glass-card rounded-[32px] p-7 border-none shadow-premium bg-white dark:bg-slate-900 group hover:scale-[1.02] transition-all duration-300">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 mb-6", colors[color])}>
        <Icon className="w-7 h-7" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">{label}</p>
      <p className="font-display text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function TargetItem({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
        <span className="text-slate-400">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
