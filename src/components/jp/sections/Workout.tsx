import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Dumbbell, Plus, Calendar, Activity, Trash2, Moon, Zap, 
  Sparkles, Clock, Flame, ChevronRight, Trophy, Heart, Timer, Target,
  RefreshCw, History, Shield, Info, Scale, Ruler, User
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import gsap from "gsap";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const todayDay = DAYS[(new Date().getDay()+6)%7];

export default function Workout() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [logs, setLogs] = useState<any[]>([]);
  const [plan, setPlan] = useState<any[]>([]);
  const [day, setDay] = useState(todayDay);
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState({ name:"", duration_min:"", calories:"", muscle_groups:"" });

  // Recovery data
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [recoveryMsg, setRecoveryMsg] = useState("Loading recovery data...");
  const [sleepScore, setSleepScore] = useState(0);

  const load = async () => {
    if (!user) return;
    const [a,b] = await Promise.all([
      supabase.from("workout_logs").select("*").eq("user_id",user.id).order("date",{ascending:false}).limit(20),
      supabase.from("workout_plans").select("*").eq("user_id",user.id),
    ]);
    setLogs(a.data||[]); setPlan(b.data||[]);
  };

  // Load sleep data for recovery
  useEffect(() => {
    if (!user) return;
    supabase.from("sleep_logs").select("hours,date,quality").eq("user_id",user.id)
      .gte("date", new Date(Date.now()-3*864e5).toISOString().slice(0,10))
      .order("date",{ascending:false}).then(({data}) => {
        setSleepData(data||[]);
        const lastSleep = data?.[0];
        const sleepHours = lastSleep?.hours || 0;
        const goalSleep = profile?.sleep_goal_hr || 8;
        const score = Math.min(100, Math.round((sleepHours / goalSleep) * 100));
        setSleepScore(score);
        if (sleepHours < goalSleep - 2) {
          setRecoveryMsg(`Rest day recommended - only ${sleepHours}h sleep last night`);
        } else if (sleepHours < goalSleep) {
          setRecoveryMsg(`Light training - moderate recovery (${sleepHours}h sleep)`);
        } else {
          setRecoveryMsg(`Good recovery - ${sleepHours}h sleep, ready to train!`);
        }
      });
  }, [user, profile]);

  useEffect(()=>{ load(); },[user]);

  const addLog = async (e:any) => { e.preventDefault();
    const { error } = await supabase.from("workout_logs").insert({
      user_id: user!.id, name: form.name,
      duration_min: parseInt(form.duration_min)||0, calories: parseInt(form.calories)||0,
      muscle_groups: form.muscle_groups.split(",").map(s=>s.trim()).filter(Boolean),
    });
    if (error) toast.error(error.message); else { toast.success("Workout logged 💪"); setShowLog(false); setForm({name:"",duration_min:"",calories:"",muscle_groups:""}); load(); }
  };
  const del = async (id:string) => { await supabase.from("workout_logs").delete().eq("id",id); load(); };

  const todaysExercises = plan.find(p => p.day_of_week === day)?.exercises || [];

  // Recovery: muscle groups worked in last 3 days
  const recent = logs.filter(l => Date.now() - new Date(l.date).getTime() < 3*864e5);
  const usedGroups = Array.from(new Set(recent.flatMap(l => l.muscle_groups || [])));
  const allGroups = ["Chest","Back","Legs","Shoulders","Arms","Core","Glutes"];

  const addPlanItem = async (name:string) => {
    const existing = plan.find(p => p.day_of_week === day);
    const newEx = [...(existing?.exercises||[]), { name }];
    if (existing) await supabase.from("workout_plans").update({ exercises: newEx }).eq("id", existing.id);
    else await supabase.from("workout_plans").insert({ user_id: user!.id, title: `${day} Plan`, day_of_week: day, exercises: newEx });
    load();
  };
  const removePlanItem = async (idx:number) => {
    const existing = plan.find(p => p.day_of_week === day);
    if (!existing) return;
    const newEx = existing.exercises.filter((_:any,i:number)=>i!==idx);
    await supabase.from("workout_plans").update({ exercises: newEx }).eq("id", existing.id);
    load();
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".workout-animate"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power4.out" }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Premium Athletic Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-8 md:p-12 text-white shadow-2xl border border-white/10 group workout-animate">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--brand-1))]/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-[hsl(var(--brand-1))]/20 transition-all duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(var(--brand-2))]/10 rounded-full blur-[80px] -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[hsl(var(--brand-1))]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[hsl(var(--brand-1))] border border-[hsl(var(--brand-1))]/20">
                <Trophy className="w-3 h-3" />
                Elite Performance Tracker
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                Athletic <span className="bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">Optimization</span>.
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-sm md:text-base leading-relaxed">
                {logs.filter(l=>Date.now()-new Date(l.date).getTime()<7*864e5).length} sessions completed this week. Your current output is <span className="text-white font-bold">Optimal</span>.
              </p>
            </div>

            <button 
              onClick={()=>setShowLog(s=>!s)}
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 self-start md:self-center"
            >
              <Plus className="w-4 h-4" />
              Log Session
            </button>
          </div>
        </div>

        {showLog && (
          <GlassCard className="p-8 workout-animate">
            <form onSubmit={addLog} className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black tracking-tight">Record Workout</h3>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Entry Protocol</div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputGroup icon={Dumbbell} label="Workout Name" placeholder="Strength Training" value={form.name} onChange={v => setForm({...form, name: v})} />
                <InputGroup icon={Activity} label="Muscle Groups" placeholder="Chest, Back" value={form.muscle_groups} onChange={v => setForm({...form, muscle_groups: v})} />
                <InputGroup icon={Timer} label="Duration" placeholder="60 min" value={form.duration_min} onChange={v => setForm({...form, duration_min: v})} type="number" />
                <InputGroup icon={Flame} label="Burn" placeholder="500 kcal" value={form.calories} onChange={v => setForm({...form, calories: v})} type="number" />
              </div>
              <button className="w-full py-5 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                Sync with Database
              </button>
            </form>
          </GlassCard>
        )}

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Left Column: Recovery Insights */}
          <div className="lg:col-span-1 space-y-8">
            <div className="flex items-center justify-between px-2 workout-animate">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Biological Status</h3>
              <Sparkles className="w-5 h-5 text-[hsl(var(--brand-1))]" />
            </div>

            <GlassCard className="p-8 workout-animate">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-2xl font-black">Recovery Score</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Based on sleep & load</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[hsl(var(--brand-1))] shadow-inner">
                  <Zap className="w-7 h-7" />
                </div>
              </div>

              <div className="text-center space-y-4 mb-8">
                <div className="text-7xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                  {sleepScore}%
                </div>
                <div className="px-4 py-2 rounded-full bg-[hsl(var(--brand-1))]/10 text-[hsl(var(--brand-1))] text-[10px] font-black uppercase tracking-widest inline-block border border-[hsl(var(--brand-1))]/20">
                  {recoveryMsg}
                </div>
              </div>

              <div className="h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] rounded-full transition-all duration-1000"
                  style={{ width: `${sleepScore}%` }}
                />
              </div>
            </GlassCard>


            <div className="grid grid-cols-2 gap-4 workout-animate">
              {allGroups.map(g => {
                const fresh = !usedGroups.includes(g);
                return (
                  <GlassCard key={g} className={cn(
                    "p-5 border-l-4 transition-all duration-500 hover:scale-105",
                    fresh ? "border-emerald-500 bg-emerald-500/[0.03]" : "border-slate-300 dark:border-slate-700 opacity-60"
                  )}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{g}</p>
                    <p className={cn(
                      "text-sm font-black mt-1",
                      fresh ? "text-emerald-500" : "text-slate-400"
                    )}>
                      {fresh ? "Optimum" : "Resting"}
                    </p>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* Right Column: Daily Plan & Sessions */}
          <div className="lg:col-span-2 space-y-12">
            
            <section className="space-y-6 workout-animate">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Training Protocol</h3>
                <div className="flex gap-1.5 bg-white/50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 backdrop-blur-xl">
                  {DAYS.map(d => (
                    <button 
                      key={d} 
                      onClick={()=>setDay(d)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                        day === d ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xl scale-110" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      )}
                    >
                      {d[0]}
                    </button>
                  ))}
                </div>
              </div>

              <GlassCard className="p-8">
                <div className="space-y-6">
                  {todaysExercises.length === 0 ? (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-16 h-16 rounded-[2rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto text-slate-300">
                        <Dumbbell className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Zero tasks assigned for {day}</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {todaysExercises.map((ex:any,i:number) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 group hover:bg-white/60 dark:hover:bg-white/[0.05] transition-all">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                              <Dumbbell className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black">{ex.name}</h4>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Reps: High Intensity</p>
                            </div>
                          </div>
                          <button 
                            onClick={()=>removePlanItem(i)}
                            className="p-3 rounded-xl text-slate-400 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                    <AddExercise onAdd={addPlanItem} />
                  </div>
                </div>
              </GlassCard>
            </section>

            <section className="space-y-6 workout-animate">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400 px-2">Session History</h3>
              <div className="grid gap-4">
                {logs.map(l => (
                  <GlassCard key={l.id} className="p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[hsl(var(--brand-1))] shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Activity className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-[hsl(var(--brand-1))] transition-colors">{l.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(l.date).toLocaleDateString()}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="text-[10px] font-black text-[hsl(var(--brand-1))]">{l.calories} KCAL BURN</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="hidden md:flex gap-6">
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Duration</p>
                          <p className="text-sm font-black">{l.duration_min}m</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Intensity</p>
                          <p className="text-sm font-black">High</p>
                        </div>
                      </div>
                      <button onClick={()=>del(l.id)} className="p-3 rounded-xl text-slate-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </GlassCard>
                ))}
                {logs.length === 0 && (
                  <GlassCard className="p-12 text-center opacity-60 italic text-slate-400">
                    No session logs found in database.
                  </GlassCard>
                )}
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

function InputGroup({ icon: Icon, label, placeholder, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <input 
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold text-sm outline-none focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 transition-all placeholder:text-slate-400"
      />
    </div>
  );
}

function AddExercise({onAdd}:{onAdd:(n:string)=>void}) {
  const [v,setV] = useState("");
  return (
    <form onSubmit={e=>{e.preventDefault(); if(v){onAdd(v); setV("");}}} className="flex gap-3">
      <input 
        value={v} 
        onChange={e=>setV(e.target.value)} 
        placeholder="Add New Exercise Protocol..." 
        className="flex-1 px-6 py-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold outline-none focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 transition-all"
      />
      <button className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
        Add
      </button>
    </form>
  );
}
function WorkoutVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any).from("workout_videos")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }: any) => {
        setVideos(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return null;
  if (videos.length === 0) return null;

  return (
    <div className="space-y-6 workout-animate">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Video Protocol Library</h3>
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        {videos.map((vid) => {
          // Extract YouTube ID
          let videoId = "";
          try {
            const url = new URL(vid.url);
            if (url.hostname === "youtu.be") videoId = url.pathname.slice(1);
            else if (url.hostname.includes("youtube.com")) videoId = url.searchParams.get("v") || "";
          } catch(e) {}

          return (
            <GlassCard key={vid.id} className="p-0 overflow-hidden group">
              <div className="aspect-video bg-slate-900 relative">
                {videoId ? (
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={vid.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/20">
                    Invalid Video Source
                  </div>
                )}
              </div>
              <div className="p-6">
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{vid.title}</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Assigned by {vid.coach_name || "Admin"}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
