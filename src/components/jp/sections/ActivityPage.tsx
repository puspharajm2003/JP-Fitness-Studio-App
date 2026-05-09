import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Footprints, Moon, Plus, Sparkles, TrendingUp, 
  Calendar, Zap, Activity, Info, ChevronRight, 
  Trophy, Clock, Target
} from "lucide-react";
import { toast } from "sonner";
import { today } from "@/lib/dateUtil";
import { cn } from "@/lib/utils";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from "recharts";
import ActivityAnalysis from "./ActivityAnalysis";

type View = "daily" | "weekly" | "monthly";

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function ActivityPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [steps, setSteps] = useState<any[]>([]);
  const [sleep, setSleep] = useState<any[]>([]);
  const [view, setView] = useState<View>("weekly");
  const [s, setS] = useState(""); 
  const [h, setH] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    try {
      const [a, b] = await Promise.all([
        supabase.from("step_logs").select("*").eq("user_id", user.id).gte("date", since).order("date"),
        supabase.from("sleep_logs").select("*").eq("user_id", user.id).gte("date", since).order("date"),
      ]);
      setSteps(a.data || []); 
      setSleep(b.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const logSteps = async (e: any) => { 
    e.preventDefault();
    const v = parseInt(s); 
    if (!v || isNaN(v)) return;
    const { error } = await supabase.from("step_logs").upsert({ user_id: user!.id, date: today(), steps: v }, { onConflict: "user_id,date" });
    if (error) {
      toast.error(error.message);
    } else {
      setS(""); 
      load(); 
      toast.success("Daily steps logged ✨"); 
    }
  };

  const logSleep = async (e: any) => { 
    e.preventDefault();
    const v = parseFloat(h); 
    if (!v || isNaN(v)) return;
    const { error } = await supabase.from("sleep_logs").insert({ user_id: user!.id, hours: v });
    if (error) {
      toast.error(error.message);
    } else {
      setH(""); 
      load(); 
      toast.success("Sleep duration logged 🌙"); 
    }
  };

  const days = view === "daily" ? 1 : view === "weekly" ? 7 : 30;
  
  const stepData = useMemo(() => lastN(steps, days, "steps"), [steps, days]);
  const sleepData = useMemo(() => lastN(sleep, days, "hours"), [sleep, days]);

  const avgSteps = Math.round(stepData.reduce((a,b) => a+b.value, 0) / stepData.length) || 0;
  const avgSleep = (sleepData.reduce((a,b) => a+b.value, 0) / sleepData.length).toFixed(1) || "0";

  if (showAnalysis) return <ActivityAnalysis onBack={() => setShowAnalysis(false)} />;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/10">
            <Activity className="w-3 h-3" />
            Metabolic Intelligence
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
            Daily <span className="text-primary">Motion</span>.
          </h1>
        </div>

        <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          {(["daily", "weekly", "monthly"] as View[]).map(v => (
            <button 
              key={v} 
              onClick={() => setView(v)} 
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === v 
                  ? "bg-white dark:bg-slate-800 text-primary shadow-lg shadow-primary/5" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 px-4">
        
        {/* Steps Tracking */}
        <GlassCard className="p-10 group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-lg">
                  <Footprints className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Activity Pulse</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Physical Compliance</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={logSteps} className="flex gap-3">
              <div className="relative">
                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={s} 
                  onChange={e => setS(e.target.value)} 
                  type="number" 
                  placeholder="steps" 
                  className="w-32 pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button className="p-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 active:scale-95 transition-all">
                <TrendingUp className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
             <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Steps</p>
                <p className="text-3xl font-black">{avgSteps.toLocaleString()}</p>
             </div>
             <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Goal</p>
                <p className="text-3xl font-black text-emerald-500">{(profile?.daily_step_goal || 10000).toLocaleString()}</p>
             </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stepData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[8, 8, 8, 8]}
                  fill="hsl(var(--primary))"
                >
                  {stepData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value >= (profile?.daily_step_goal || 10000) ? "#10b981" : "hsl(var(--primary))"} 
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Sleep Tracking */}
        <GlassCard className="p-10 group">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shadow-lg">
                  <Moon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Recovery Depth</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Neurological Recharge</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={logSleep} className="flex gap-3">
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={h} 
                  onChange={e => setH(e.target.value)} 
                  type="number" 
                  step="0.1" 
                  placeholder="hours" 
                  className="w-32 pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button className="p-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 active:scale-95 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
             <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Sleep</p>
                <p className="text-3xl font-black">{avgSleep}<span className="text-xs ml-1 text-slate-400 font-bold">hrs</span></p>
             </div>
             <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sleep Goal</p>
                <p className="text-3xl font-black text-indigo-500">{profile?.sleep_goal_hr || 8}<span className="text-xs ml-1 text-slate-400 font-bold">hrs</span></p>
             </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sleepData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorSleep)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* Health Insight Card */}
      <div className="px-4">
        <GlassCard className="p-10 flex flex-col md:flex-row items-center gap-10 bg-primary/5 border-primary/20">
           <div className="w-24 h-24 rounded-[2rem] bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/40 shrink-0">
             <Trophy className="w-10 h-10" />
           </div>
           <div className="space-y-3 text-center md:text-left">
             <h4 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">Consistency is your <span className="text-primary">Superpower</span>.</h4>
             <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
               Your activity logs show a {avgSteps > 8000 ? "high" : "moderate"} physical output this week. Maintaining this rhythm will accelerate your {profile?.goal || "fitness"} goals.
             </p>
           </div>
           <div className="md:ml-auto">
              <button 
                onClick={() => setShowAnalysis(true)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                View Full Analysis
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </GlassCard>
      </div>

    </div>
  );
}

function lastN(rows: any[], n: number, key: string) {
  const out: { label: string, value: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); 
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const matches = rows.filter(r => r.date === ds);
    const sum = matches.reduce((a, r) => a + (r[key] || 0), 0);
    out.push({ 
      label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" }), 
      value: sum 
    });
  }
  return out;
}
