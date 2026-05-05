import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Bell, GlassWater, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { today } from "@/lib/dateUtil";

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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-brand-3 p-6 text-primary-foreground shadow-brand">
        <p className="text-xs uppercase tracking-widest opacity-90 flex items-center gap-1.5"><Bell className="w-3 h-3"/>Reminders every 2 hours until goal</p>
        <h2 className="font-display text-3xl font-extrabold mt-1">{ml} <span className="text-base font-normal opacity-80">/ {goal} ml</span></h2>
      </div>

      <div className="glass-card rounded-3xl p-8 flex items-center gap-8 flex-wrap justify-center">
        <div onClick={add} className="relative w-40 h-52 rounded-b-[40px] rounded-t-2xl border-4 border-primary/40 overflow-hidden cursor-pointer bg-secondary shadow-soft">
          <div ref={fillRef} className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-sky-400 to-blue-600" style={{height:"0%"}}>
            <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 animate-pulse"/>
          </div>
          <GlassWater className="absolute inset-0 m-auto w-12 h-12 text-white/80 z-10"/>
        </div>
        <div className="text-center sm:text-left">
          <p className="font-display text-5xl font-extrabold text-gradient-brand">{Math.round(pct)}%</p>
          <p className="text-sm text-muted-foreground mb-4">Tap the glass or button to log {STEP}ml</p>
          <div className="flex gap-2 justify-center">
            <button onClick={sub} className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center"><Minus className="w-4 h-4"/></button>
            <button onClick={add} className="px-6 py-3 rounded-xl bg-gradient-brand text-primary-foreground font-semibold shadow-brand flex items-center gap-2"><Plus className="w-4 h-4"/>+250ml</button>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3">Today's logs</h3>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {logs.map(l => <li key={l.id} className="px-3 py-2 rounded-lg bg-secondary text-sm flex items-center gap-2"><GlassWater className="w-4 h-4 text-primary"/>{l.amount_ml}ml<span className="ml-auto text-xs text-muted-foreground">{new Date(l.logged_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span></li>)}
          {logs.length===0 && <li className="text-sm text-muted-foreground col-span-full">Nothing logged yet today.</li>}
        </ul>
      </div>
    </div>
  );
}
