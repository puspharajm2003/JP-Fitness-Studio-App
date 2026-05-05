import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Plus, TrendingDown, Ruler, Scale } from "lucide-react";
import { toast } from "sonner";

export default function Progress() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [weights, setWeights] = useState<any[]>([]);
  const [meas, setMeas] = useState<any[]>([]);
  const [w, setW] = useState(""); const [showM, setShowM] = useState(false);
  const [m, setM] = useState({ chest_in:"", waist_in:"", hips_in:"", arms_in:"", thighs_in:"" });

  const load = async () => {
    if (!user) return;
    const [a,b] = await Promise.all([
      supabase.from("weight_logs").select("*").eq("user_id",user.id).order("date",{ascending:true}).limit(60),
      supabase.from("measurement_logs").select("*").eq("user_id",user.id).order("date",{ascending:false}).limit(20),
    ]);
    setWeights(a.data||[]); setMeas(b.data||[]);
  };
  useEffect(() => { load(); }, [user]);

  const addWeight = async (e:any) => { e.preventDefault();
    const val = parseFloat(w); if (!val) return;
    const { error } = await supabase.from("weight_logs").insert({ user_id:user!.id, weight_kg: val });
    if (error) toast.error(error.message); else { toast.success("Weight logged"); setW(""); load(); }
  };
  const addMeas = async (e:any) => { e.preventDefault();
    const payload:any = { user_id: user!.id };
    Object.entries(m).forEach(([k,v]) => { if (v) payload[k] = parseFloat(v); });
    const { error } = await supabase.from("measurement_logs").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Measurements saved"); setShowM(false); setM({chest_in:"",waist_in:"",hips_in:"",arms_in:"",thighs_in:""}); load(); }
  };

  const start = weights[0]?.weight_kg, latest = weights[weights.length-1]?.weight_kg;
  const lost = start && latest ? (start - latest).toFixed(1) : "0";
  const target = profile?.target_weight_kg;
  const max = Math.max(...weights.map(x=>x.weight_kg), 0); const min = Math.min(...weights.map(x=>x.weight_kg), max);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-3">
        <Card title="Current" value={latest?`${latest} kg`:"—"} icon={Scale} />
        <Card title="Total Lost" value={`${lost} kg`} icon={TrendingDown} hi />
        <Card title="Target" value={target?`${target} kg`:"Set in profile"} icon={Ruler} />
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">Weight progress</h3>
          <form onSubmit={addWeight} className="flex gap-2">
            <input value={w} onChange={e=>setW(e.target.value)} type="number" step="0.1" placeholder="kg" className="w-24 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
            <button className="px-4 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4"/>Log</button>
          </form>
        </div>
        <div className="h-44 flex items-end gap-1.5">
          {weights.length === 0 && <p className="text-sm text-muted-foreground m-auto">No data yet — log your first weight above.</p>}
          {weights.map((d,i) => {
            const h = max === min ? 50 : ((d.weight_kg - min)/(max-min)) * 90 + 10;
            return (
              <div key={d.id} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-gradient-brand transition-all" style={{height:`${h}%`}} title={`${d.weight_kg} kg`} />
                {i % Math.ceil(weights.length/8) === 0 && <span className="text-[9px] text-muted-foreground">{new Date(d.date).getDate()}/{new Date(d.date).getMonth()+1}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold">Inches / Measurements</h3>
          <button onClick={()=>setShowM(s=>!s)} className="px-4 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4"/>Add</button>
        </div>
        {showM && (
          <form onSubmit={addMeas} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {(["chest_in","waist_in","hips_in","arms_in","thighs_in"] as const).map(k => (
              <input key={k} placeholder={k.replace("_in","").replace(/^./,c=>c.toUpperCase())+" (in)"} value={(m as any)[k]} onChange={e=>setM({...m,[k]:e.target.value})} type="number" step="0.1" className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
            ))}
            <button className="col-span-2 md:col-span-5 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold">Save measurements</button>
          </form>
        )}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <th className="py-2">Date</th><th>Chest</th><th>Waist</th><th>Hips</th><th>Arms</th><th>Thighs</th>
            </tr></thead>
            <tbody>
              {meas.map(r => <tr key={r.id} className="border-b border-border/50">
                <td className="py-2">{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.chest_in??"—"}</td><td>{r.waist_in??"—"}</td><td>{r.hips_in??"—"}</td><td>{r.arms_in??"—"}</td><td>{r.thighs_in??"—"}</td>
              </tr>)}
              {meas.length === 0 && <tr><td colSpan={6} className="py-4 text-muted-foreground text-center">No measurements yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function Card({title,value,icon:Icon,hi}:any){
  return <div className={`rounded-2xl p-5 ${hi?"bg-gradient-brand text-primary-foreground shadow-brand":"glass-card"}`}>
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80"><Icon className="w-4 h-4"/>{title}</div>
    <p className="font-display text-2xl font-extrabold mt-2">{value}</p>
  </div>;
}
