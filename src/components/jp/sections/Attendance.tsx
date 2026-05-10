import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  ClipboardCheck, Flame, Trophy, CheckCircle2, 
  Fingerprint, Zap, Sparkles, Calendar, Clock, 
  ChevronRight, Shield, Award, Activity, Heart
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import gsap from "gsap";

export default function Attendance() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [logs, setLogs] = useState<any[]>([]);
  const [todayDone, setTodayDone] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("attendance").select("*").eq("user_id", user.id).order("check_in", {ascending:false}).limit(60);
    setLogs(data || []);
    const t = new Date().toISOString().slice(0,10);
    setTodayDone((data||[]).some((d:any) => d.date === t));
  };
  useEffect(() => { load(); }, [user]);

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
     // Award loyalty points
     const newPoints = (profile?.loyalty_points || 0) + 10;
     await supabase.from("profiles").update({ loyalty_points: newPoints }).eq("id", user.id);
     // Log point change
     try {
       await supabase.from("loyalty_point_logs").insert({
         user_id: user.id,
         points_change: 10,
         reason: "check-in",
         related_id: null,
       });
     } catch (e) {
       console.warn("Loyalty table missing:", e);
     }
     // Refresh profile to update loyalty_points in UI
     await refresh();
     toast.success(`Checked in! +10 loyalty points (Total: ${newPoints} pts)`);
     load();
   };

  // Build last 30-day calendar grid
  const days = Array.from({length: 30}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0,10);
    return { key, day: d.getDate(), present: logs.some(l => l.date === key) };
  });
  const streak = (() => { let s = 0; for (let i = days.length-1; i>=0; i--) { if (days[i].present) s++; else break; } return s; })();
  const points = profile?.loyalty_points || 0;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".attendance-animate"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power4.out" }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Premium Presence Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-8 md:p-12 text-white shadow-2xl border border-white/10 group attendance-animate">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--brand-1))]/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-[hsl(var(--brand-1))]/20 transition-all duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(var(--brand-2))]/10 rounded-full blur-[80px] -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[hsl(var(--brand-1))]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[hsl(var(--brand-1))] border border-[hsl(var(--brand-1))]/20">
                <Shield className="w-3 h-3" />
                Active Verification System
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                Presence <span className="bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">Verified</span>.
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-sm md:text-base leading-relaxed">
                Your commitment is tracked via neural presence logs. Maintain your <span className="text-white font-bold">{streak}-day streak</span> to unlock elite rewards.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                disabled={todayDone} 
                onClick={checkIn}
                className={cn(
                  "px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 relative overflow-hidden group",
                  todayDone 
                    ? "bg-white/10 text-white/40 cursor-not-allowed border border-white/10" 
                    : "bg-white text-slate-900 hover:scale-105 active:scale-95"
                )}
              >
                {todayDone ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Verified for Today
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5 group-hover:animate-pulse" />
                    Verify Presence
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Status Column */}
          <div className="lg:col-span-1 space-y-8">
             <div className="flex items-center justify-between px-2 attendance-animate">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Loyalty Status</h3>
              <Award className="w-5 h-5 text-[hsl(var(--brand-1))]" />
            </div>

            <GlassCard className="p-8 attendance-animate bg-gradient-to-br from-slate-900 to-[#1e293b] text-white border-white/10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-2xl font-black">Elite Credit</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Loyalty Points Balance</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[hsl(var(--brand-1))] shadow-inner">
                  <Trophy className="w-7 h-7" />
                </div>
              </div>

              <div className="text-center space-y-2 mb-8">
                <div className="text-7xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {points}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[hsl(var(--brand-1))]">
                  PTS Earned
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tier Status</span>
                  <span className="px-3 py-1 rounded-full bg-[hsl(var(--brand-1))]/20 text-[hsl(var(--brand-1))] text-[9px] font-black uppercase tracking-widest border border-[hsl(var(--brand-1))]/20">
                    Premium Member
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Next Milestone</span>
                  <span className="text-xs font-black">{(Math.floor(points/100) + 1) * 100} PTS</span>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4 attendance-animate">
              <GlassCard className="p-6 text-center border-l-4 border-l-orange-500">
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Streak</p>
                <p className="text-2xl font-black">{streak} Days</p>
              </GlassCard>
              <GlassCard className="p-6 text-center border-l-4 border-l-sky-500">
                <Activity className="w-6 h-6 text-sky-500 mx-auto mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intensity</p>
                <p className="text-2xl font-black">Elite</p>
              </GlassCard>
            </div>
          </div>

          {/* Activity Matrix Column */}
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6 attendance-animate">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Activity Matrix</h3>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>

              <GlassCard className="p-10">
                <div className="flex items-center justify-between mb-8">
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">30-Day Presence History</div>
                   <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-md bg-[hsl(var(--brand-1))]" />
                       <span className="text-[9px] font-black uppercase text-slate-500">Present</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-md bg-slate-100 dark:bg-white/5" />
                       <span className="text-[9px] font-black uppercase text-slate-500">Absent</span>
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 md:gap-4">
                  {days.map(d => (
                    <div 
                      key={d.key} 
                      className={cn(
                        "aspect-square rounded-[1rem] flex flex-col items-center justify-center transition-all duration-500 relative group overflow-hidden border",
                        d.present 
                          ? "bg-gradient-to-br from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white border-transparent shadow-lg scale-105" 
                          : "bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5 hover:border-[hsl(var(--brand-1))]/50"
                      )}
                    >
                      <span className="text-[10px] font-black">{d.day}</span>
                      {d.present && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 pt-8 border-t border-slate-100 dark:border-white/5">
                   <span>Operational Metrics</span>
                   <span>{logs.length} Total Verification Events</span>
                </div>
              </GlassCard>
            </section>

            <section className="space-y-6 attendance-animate">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400 px-2">Recent Synchronizations</h3>
              <div className="grid gap-4">
                {logs.slice(0, 3).map(l => (
                  <GlassCard key={l.id} className="p-6 flex items-center justify-between group hover:bg-white/80 dark:hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {new Date(l.check_in).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Logged at {new Date(l.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">+10 PTS</span>
                       <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </GlassCard>
                ))}
              </div>
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

