import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Check, Pill, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { today } from "@/lib/dateUtil";

export default function Medications() {
  const { user } = useAuth();
  const [meds, setMeds] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name:"", dose:"", times:"08:00" });

  const load = async () => {
    if (!user) return;
    const [a,b] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id",user.id).eq("active",true),
      supabase.from("medication_logs").select("*").eq("user_id",user.id).gte("taken_at", today()),
    ]);
    setMeds(a.data||[]); setLogs(b.data||[]);
  };
  useEffect(()=>{ load(); },[user]);

  // 1-min check; toast 5 minutes around scheduled times if not yet taken today
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0,5);
      meds.forEach(m => {
        (m.schedule_times||[]).forEach((t:string) => {
          if (t === hhmm && !logs.some(l => l.medication_id === m.id && new Date(l.taken_at).toDateString() === now.toDateString())) {
            toast(`💊 Time for ${m.name}`, { description: `${m.dose} scheduled at ${t}` });
          }
        });
      });
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [meds, logs]);

  const add = async (e:any) => { e.preventDefault();
    const times = f.times.split(",").map(s=>s.trim()).filter(Boolean);
    const { error } = await supabase.from("medications").insert({ user_id: user!.id, name: f.name, dose: f.dose, schedule_times: times });
    if (error) toast.error(error.message); else { setShow(false); setF({name:"",dose:"",times:"08:00"}); load(); }
  };
  const taken = async (m:any) => {
    await supabase.from("medication_logs").insert({ user_id: user!.id, medication_id: m.id, status: "taken" });
    load(); toast.success("Marked as taken");
  };
  const del = async (id:string) => { await supabase.from("medications").update({ active:false }).eq("id", id); load(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-extrabold">Medications</h2>
        <button onClick={()=>setShow(s=>!s)} className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4"/>Add</button>
      </div>
      {show && (
        <form onSubmit={add} className="glass-card rounded-2xl p-4 grid sm:grid-cols-3 gap-2">
          <input required value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Name" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <input value={f.dose} onChange={e=>setF({...f,dose:e.target.value})} placeholder="Dose (e.g. 400mg)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <input value={f.times} onChange={e=>setF({...f,times:e.target.value})} placeholder="Times (08:00,14:00)" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <button className="sm:col-span-3 py-2 rounded-lg bg-gradient-brand text-primary-foreground font-semibold">Save medication</button>
        </form>
      )}
      <div className="space-y-2">
        {meds.map(m => {
          const tToday = logs.filter(l => l.medication_id === m.id);
          return (
            <div key={m.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-soft flex items-center justify-center"><Pill className="w-5 h-5 text-primary"/></div>
              <div className="flex-1">
                <p className="font-semibold">{m.name} <span className="text-xs text-muted-foreground">{m.dose}</span></p>
                <p className="text-xs text-muted-foreground">Schedule: {(m.schedule_times||[]).join(", ")} · Taken today: {tToday.length}/{(m.schedule_times||[]).length||1}</p>
              </div>
              <button onClick={()=>taken(m)} className="px-3 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-semibold flex items-center gap-1"><Check className="w-3 h-3"/>Taken</button>
              <button onClick={()=>del(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
            </div>
          );
        })}
        {meds.length===0 && <p className="text-sm text-muted-foreground">No medications yet.</p>}
      </div>
    </div>
  );
}
