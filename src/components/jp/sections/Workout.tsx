import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Dumbbell, Plus, Calendar, Activity, Trash2, Moon, Zap } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-brand p-6 text-primary-foreground shadow-brand flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-90">This week</p>
          <h2 className="font-display text-3xl font-extrabold">{logs.filter(l=>Date.now()-new Date(l.date).getTime()<7*864e5).length} workouts</h2>
        </div>
        <button onClick={()=>setShowLog(s=>!s)} className="px-5 py-2.5 rounded-xl bg-white text-foreground font-semibold flex items-center gap-2"><Plus className="w-4 h-4"/>Log workout</button>
      </div>

      {showLog && (
        <form onSubmit={addLog} className="glass-card rounded-2xl p-4 grid sm:grid-cols-2 gap-2 animate-pop">
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Workout name" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <input value={form.muscle_groups} onChange={e=>setForm({...form,muscle_groups:e.target.value})} placeholder="Muscles (Chest, Back)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <input value={form.duration_min} onChange={e=>setForm({...form,duration_min:e.target.value})} type="number" placeholder="Duration (min)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <input value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})} type="number" placeholder="Calories burned" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <button className="sm:col-span-2 py-2 rounded-lg bg-gradient-brand text-primary-foreground font-semibold">Save</button>
        </form>
      )}

      {/* Recovery Insights */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/>Recovery insights</h3>

        {/* Recovery Score */}
        <div className="mb-4 p-4 rounded-xl bg-gradient-soft">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold">Recovery Score: {sleepScore}%</p>
              <p className="text-xs text-muted-foreground">{recoveryMsg}</p>
            </div>
          </div>
          {/* Progress bar for recovery score */}
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${sleepScore}%` }} />
          </div>
        </div>

        {/* Sleep info */}
        {sleepData.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Moon className="w-4 h-4" />
            <span>Last 3 days: {sleepData.map(s => `${s.hours}h`).join(", ")}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allGroups.map(g => {
            const fresh = !usedGroups.includes(g);
            return (
              <div key={g} className={`p-3 rounded-xl border ${fresh?"border-primary/40 bg-gradient-soft":"border-border bg-secondary"}`}>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{g}</p>
                <p className={`text-sm font-bold mt-1 ${fresh?"text-primary":"text-muted-foreground"}`}>{fresh?"Ready":"Recovering"}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-display font-bold flex items-center gap-2"><Calendar className="w-4 h-4"/>Daily plan</h3>
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {DAYS.map(d => <button key={d} onClick={()=>setDay(d)} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${day===d?"bg-gradient-brand text-primary-foreground":"text-muted-foreground"}`}>{d}</button>)}
          </div>
        </div>
        <ul className="space-y-1.5 mb-3">
          {todaysExercises.map((ex:any,i:number) => (
            <li key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm">
              <Dumbbell className="w-4 h-4 text-primary"/><span className="flex-1">{ex.name}</span>
              <button onClick={()=>removePlanItem(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5"/></button>
            </li>
          ))}
          {todaysExercises.length === 0 && <li className="text-sm text-muted-foreground">No exercises planned. Add some below.</li>}
        </ul>
        <AddExercise onAdd={addPlanItem} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3">Recent sessions</h3>
        <ul className="divide-y divide-border">
          {logs.map(l => (
            <li key={l.id} className="py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-soft flex items-center justify-center"><Dumbbell className="w-4 h-4 text-primary"/></div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{l.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(l.date).toLocaleDateString()} · {l.duration_min} min · {l.calories} kcal · {(l.muscle_groups||[]).join(", ")}</p>
              </div>
              <button onClick={()=>del(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
            </li>
          ))}
          {logs.length === 0 && <li className="py-4 text-sm text-muted-foreground">No workouts logged.</li>}
        </ul>
      </div>
    </div>
  );
}

function AddExercise({onAdd}:{onAdd:(n:string)=>void}) {
  const [v,setV] = useState("");
  return <form onSubmit={e=>{e.preventDefault(); if(v){onAdd(v); setV("");}}} className="flex gap-2">
    <input value={v} onChange={e=>setV(e.target.value)} placeholder="Add exercise (e.g. Bench Press 4x8)" className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
    <button className="px-3 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold"><Plus className="w-4 h-4"/></button>
  </form>;
}
