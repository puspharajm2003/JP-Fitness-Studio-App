import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Footprints, Moon, Plus } from "lucide-react";
import { toast } from "sonner";
import { today } from "@/lib/dateUtil";

type View = "daily" | "weekly" | "monthly";

export default function ActivityPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [steps, setSteps] = useState<any[]>([]);
  const [sleep, setSleep] = useState<any[]>([]);
  const [view, setView] = useState<View>("weekly");
  const [s, setS] = useState(""); const [h, setH] = useState("");

  const load = async () => {
    if (!user) return;
    const since = new Date(Date.now()-30*864e5).toISOString().slice(0,10);
    const [a,b] = await Promise.all([
      supabase.from("step_logs").select("*").eq("user_id",user.id).gte("date",since).order("date"),
      supabase.from("sleep_logs").select("*").eq("user_id",user.id).gte("date",since).order("date"),
    ]);
    setSteps(a.data||[]); setSleep(b.data||[]);
  };
  useEffect(()=>{ load(); },[user]);

  const logSteps = async (e:any) => { e.preventDefault();
    const v = parseInt(s); if (!v) return;
    const { error } = await supabase.from("step_logs").upsert({ user_id: user!.id, date: today(), steps: v }, { onConflict:"user_id,date" });
    if (error) toast.error(error.message); else { setS(""); load(); toast.success("Steps saved"); }
  };
  const logSleep = async (e:any) => { e.preventDefault();
    const v = parseFloat(h); if (!v) return;
    const { error } = await supabase.from("sleep_logs").insert({ user_id: user!.id, hours: v });
    if (error) toast.error(error.message); else { setH(""); load(); toast.success("Sleep logged"); }
  };

  const days = view === "daily" ? 1 : view === "weekly" ? 7 : 30;
  const stepData = lastN(steps, days, "steps");
  const sleepData = lastN(sleep, days, "hours");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-secondary rounded-xl p-1 w-fit">
        {(["daily","weekly","monthly"] as View[]).map(v => <button key={v} onClick={()=>setView(v)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize ${view===v?"bg-gradient-brand text-primary-foreground":"text-muted-foreground"}`}>{v}</button>)}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold flex items-center gap-2"><Footprints className="w-4 h-4"/>Steps</h3>
          <form onSubmit={logSteps} className="flex gap-2">
            <input value={s} onChange={e=>setS(e.target.value)} type="number" placeholder="steps today" className="w-32 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
            <button className="px-3 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold"><Plus className="w-4 h-4"/></button>
          </form>
        </div>
        <Bars data={stepData} goal={profile?.daily_step_goal||10000}/>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold flex items-center gap-2"><Moon className="w-4 h-4"/>Sleep</h3>
          <form onSubmit={logSleep} className="flex gap-2">
            <input value={h} onChange={e=>setH(e.target.value)} type="number" step="0.1" placeholder="hours" className="w-24 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
            <button className="px-3 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold"><Plus className="w-4 h-4"/></button>
          </form>
        </div>
        <Bars data={sleepData} goal={profile?.sleep_goal_hr||8}/>
      </div>
    </div>
  );
}
function lastN(rows:any[], n:number, key:string){
  const out:{label:string,value:number}[] = [];
  for (let i=n-1;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = d.toISOString().slice(0,10);
    const matches = rows.filter(r => r.date === ds);
    const sum = matches.reduce((a,r)=>a+(r[key]||0), 0);
    out.push({ label: d.toLocaleDateString(undefined,{weekday:"short"}), value: sum });
  }
  return out;
}
function Bars({data,goal}:{data:{label:string,value:number}[], goal:number}) {
  const max = Math.max(goal, ...data.map(d=>d.value), 1);
  return <div className="h-44 flex items-end gap-1.5">
    {data.map((d,i) => <div key={i} className="flex-1 flex flex-col items-center gap-1">
      <div className="w-full rounded-t-md bg-gradient-brand transition-all" style={{height:`${(d.value/max)*100}%`}} title={String(d.value)}/>
      <span className="text-[9px] text-muted-foreground">{d.label}</span>
    </div>)}
  </div>;
}
