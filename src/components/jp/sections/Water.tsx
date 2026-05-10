import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Bell, GlassWater, Minus, Plus, Clock, 
  Droplet, Zap, Sparkles, Waves, RefreshCw, 
  ChevronRight, Info, Activity, Shield, Trophy, Trash2
} from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { today } from "@/lib/dateUtil";
import { cn } from "@/lib/utils";

const STEP = 250;
const REMIND_KEY = "jp-water-last-remind";
const INTERVAL = 2 * 60 * 60 * 1000;

export default function Water() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const goal = profile?.daily_water_goal_ml || 2500;
  const [ml, setMl] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const fillRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("water_logs").select("*").eq("user_id", user.id).eq("date", today()).order("logged_at",{ascending:false});
    setLogs(data||[]);
    setMl((data||[]).reduce((s:any,r:any)=>s+(r.amount_ml||0),0));
  };
  useEffect(()=>{ load(); },[user]);

  const pct = Math.min(100, (ml/goal)*100);
  useEffect(() => { if (fillRef.current) gsap.to(fillRef.current, { height:`${pct}%`, duration:.7, ease:"power2.out" }); }, [pct]);

  // Persistent 2-hour reminder
  useEffect(() => {
    if (!user) return;
    const tick = () => {
      const last = parseInt(localStorage.getItem(REMIND_KEY) || "0");
      const now = Date.now();
      if (ml < goal && now - last >= INTERVAL) {
        toast("💧 Hydration reminder", { description: `${goal-ml}ml left to hit your goal.` });
        localStorage.setItem(REMIND_KEY, String(now));
      }
    };
    tick(); // catch-up reminder on app open
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [ml, goal, user]);

  const add = async () => {
    const { error } = await supabase.from("water_logs").insert({ user_id: user!.id, amount_ml: STEP });
    if (error) toast.error(error.message); else { toast.success(`+${STEP}ml logged`); load(); }
  };
  const sub = async () => {
    if (logs[0]) { await supabase.from("water_logs").delete().eq("id", logs[0].id); load(); }
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".water-animate"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power4.out" }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Premium Hydration Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-8 md:p-12 text-white shadow-2xl border border-white/10 group water-animate">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-sky-500/20 transition-all duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-sky-400 border border-sky-500/20">
                <Shield className="w-3 h-3" />
                Cellular Hydration Protocol
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                Aquatic <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">Saturation</span>.
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-sm md:text-base leading-relaxed">
                Optimizing metabolic efficiency via precise volumetric hydration tracking. Current saturation is <span className="text-white font-bold">{ml}ml</span>.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
                 <Bell className="w-4 h-4 text-sky-400 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Interval: 120m</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mr-2">Status: Active Monitoring</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Main Controls & Visualization */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2 water-animate">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Saturation Level</h3>
              <Waves className="w-5 h-5 text-sky-500" />
            </div>

            <GlassCard className="p-10 flex flex-col items-center justify-center text-center space-y-10 water-animate overflow-hidden group">
               {/* Advanced Water Tank */}
               <div 
                 onClick={add}
                 className="relative w-48 h-64 rounded-b-[4rem] rounded-t-[2rem] border-4 border-slate-200 dark:border-white/10 overflow-hidden cursor-pointer bg-slate-50 dark:bg-white/5 shadow-2xl group-hover:scale-105 transition-all duration-700 active:scale-95"
               >
                 <div 
                   ref={fillRef} 
                   className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 via-sky-500 to-sky-400 transition-all duration-1000"
                   style={{ height: `${pct}%` }}
                 >
                    {/* Liquid Effects */}
                    <div className="absolute top-0 left-0 right-0 h-4 bg-white/20 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Droplet className={cn(
                      "w-12 h-12 transition-all duration-1000",
                      ml >= goal ? "text-white" : "text-slate-200 dark:text-white/20"
                    )} />
                 </div>
                 
                 {/* Scale markers */}
                 <div className="absolute right-3 inset-y-0 py-8 flex flex-col justify-between pointer-events-none opacity-20">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-4 h-0.5 bg-slate-900 dark:bg-white" />)}
                 </div>
               </div>

               <div className="space-y-4">
                  <div className="text-7xl font-black tracking-tighter text-slate-900 dark:text-white">
                    {Math.round(pct)}%
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-black uppercase tracking-widest text-slate-500 border border-slate-200 dark:border-white/5">
                      Target: {goal}ml
                    </span>
                    {ml >= goal && (
                      <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                        Goal Optimized
                      </span>
                    )}
                  </div>
               </div>

               <div className="flex gap-4 w-full max-w-sm">
                  <button 
                    onClick={sub}
                    className="p-5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all border border-slate-200 dark:border-white/10"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={add}
                    className="flex-1 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Plus className="w-5 h-5" />
                    Intake {STEP}ml
                  </button>
               </div>
            </GlassCard>
          </div>

          {/* Logs & Insights */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2 water-animate">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Temporal Logs</h3>
              <Clock className="w-5 h-5 text-slate-400" />
            </div>

            <section className="water-animate">
              <GlassCard className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-2xl font-black">Hydration Sequence</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Today's Intake Timeline</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shadow-inner">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {logs.map(l => (
                    <div key={l.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between group hover:border-sky-500/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center">
                          <Droplet className="w-5 h-5 text-sky-500" />
                        </div>
                        <div>
                          <p className="text-sm font-black">{l.amount_ml}ml</p>
                          <p className="text-[9px] font-black uppercase text-slate-400">{new Date(l.logged_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</p>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          const { error } = await supabase.from("water_logs").delete().eq("id", l.id);
                          if (error) toast.error(error.message); else { toast.success("Log removed"); load(); }
                        }}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="col-span-2 py-12 text-center space-y-4">
                      <Droplet className="w-10 h-10 mx-auto text-slate-200" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">No hydration events recorded.</p>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10">
                    <Info className="w-5 h-5 text-sky-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 leading-relaxed">
                      Maintain a consistent {STEP}ml intake every 2 hours for optimal metabolic turnover.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </section>

            <section className="water-animate">
              <GlassCard className="p-8 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-xl font-black uppercase tracking-widest">Hydration Streak</h4>
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-center space-y-4">
                  <div className="text-5xl font-black tracking-tighter">Verified Active</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Protocol Status: Optimal</p>
                </div>
              </GlassCard>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children, className, variant = "default", onClick }: any) {
  const variants: any = {
    default: "bg-white/60 dark:bg-black/40 border-slate-200 dark:border-white/10",
    interactive: "bg-white/60 dark:bg-black/40 border-slate-200 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500",
  };
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-[2.5rem] border backdrop-blur-xl shadow-xl overflow-hidden",
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
