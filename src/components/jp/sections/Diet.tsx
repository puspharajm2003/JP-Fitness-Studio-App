import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Apple, FileText, Plus, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { today } from "@/lib/dateUtil";

export default function Diet() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [foods, setFoods] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFood, setNewFood] = useState({ name:"", kcal:"", meal_time:"Lunch" });

  const load = async () => {
    if (!user) return;
    const [a,b] = await Promise.all([
      supabase.from("food_logs").select("*").eq("user_id",user.id).eq("date",today()).order("created_at",{ascending:false}),
      supabase.from("diet_plans").select("*").eq("user_id",user.id).order("assigned_date",{ascending:false}),
    ]);
    setFoods(a.data||[]); setPlans(b.data||[]);
  };
  useEffect(()=>{ load(); },[user]);

  const aiSuggest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meal-suggest", {
        body: { goal: profile?.goal, calorie_goal: profile?.daily_calorie_goal, gender: profile?.gender, current_kcal: foods.reduce((s,f)=>s+(f.kcal||0),0) },
      });
      if (error) throw error;
      setSuggestions(data.meals || []);
      toast.success("Personalized meal ideas ready!");
    } catch (e:any) { toast.error(e.message || "AI suggestion failed"); }
    finally { setLoading(false); }
  };

  const saveSuggestion = async (m: any) => {
    const { error } = await supabase.from("food_logs").insert({
      user_id: user!.id, name: m.name, kcal: m.kcal, protein_g: m.protein_g, carbs_g: m.carbs_g, fat_g: m.fat_g,
      vitamins: m.vitamins, minerals: m.minerals, meal_time: m.meal_time,
    });
    if (error) toast.error(error.message); else { toast.success("Added to diary"); load(); }
  };

  const addManual = async (e:any) => { e.preventDefault();
    if (!newFood.name || !newFood.kcal) return;
    const { error } = await supabase.from("food_logs").insert({ user_id: user!.id, name: newFood.name, kcal: parseInt(newFood.kcal), meal_time: newFood.meal_time });
    if (error) toast.error(error.message); else { setNewFood({name:"",kcal:"",meal_time:"Lunch"}); load(); }
  };

  const del = async (id:string) => { await supabase.from("food_logs").delete().eq("id",id); load(); };

  const uploadPlan = async (e:any) => {
    const file = e.target.files?.[0]; if (!file) return;
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("diet-plans").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("diet-plans").getPublicUrl(path);
    await supabase.from("diet_plans").insert({ user_id: user!.id, title: file.name, file_url: data.publicUrl });
    toast.success("Diet plan uploaded"); load();
  };

  const totalKcal = foods.reduce((s,f)=>s+(f.kcal||0),0);
  const target = profile?.daily_calorie_goal || 2000;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-brand-3 p-6 text-primary-foreground shadow-brand">
        <p className="text-xs uppercase tracking-wider opacity-90">Today's intake</p>
        <h2 className="font-display text-3xl font-extrabold">{totalKcal} <span className="text-base font-normal opacity-90">/ {target} kcal</span></h2>
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white" style={{width:`${Math.min(100,(totalKcal/target)*100)}%`}}/></div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent"/>AI meal ideas for your goals</h3>
            <p className="text-xs text-muted-foreground">Personalized for {profile?.goal === "weight_loss" ? "weight loss" : profile?.goal || "your goal"}</p>
          </div>
          <button onClick={aiSuggest} disabled={loading} className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-60">
            <Wand2 className="w-4 h-4"/>{loading ? "Thinking…" : "Suggest"}
          </button>
        </div>
        {suggestions.length === 0 && <p className="text-sm text-muted-foreground">Tap Suggest to get 4 meal ideas with vitamins & minerals targeted to your needs.</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {suggestions.map((m,i) => (
            <div key={i} className="rounded-xl p-4 border border-border bg-card animate-pop">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-accent">{m.meal_time}</p>
                  <h4 className="font-display font-bold mt-0.5">{m.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                </div>
                <span className="text-sm font-bold text-primary">{m.kcal} kcal</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {[...(m.vitamins||[]), ...(m.minerals||[])].map((t:string)=> <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-soft text-foreground border border-border">{t}</span>)}
              </div>
              <button onClick={()=>saveSuggestion(m)} className="mt-3 text-xs font-semibold text-primary hover:underline">+ Add to diary</button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Apple className="w-4 h-4"/>Today's diary</h3>
        <form onSubmit={addManual} className="flex flex-wrap gap-2 mb-4">
          <input value={newFood.name} onChange={e=>setNewFood({...newFood,name:e.target.value})} placeholder="Food name" className="flex-1 min-w-32 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <input value={newFood.kcal} onChange={e=>setNewFood({...newFood,kcal:e.target.value})} type="number" placeholder="kcal" className="w-24 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <select value={newFood.meal_time} onChange={e=>setNewFood({...newFood,meal_time:e.target.value})} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none">
            {["Breakfast","Lunch","Dinner","Snack"].map(x=><option key={x}>{x}</option>)}
          </select>
          <button className="px-4 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4"/>Add</button>
        </form>
        <ul className="divide-y divide-border">
          {foods.map(f => (
            <li key={f.id} className="py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-soft flex items-center justify-center"><Apple className="w-4 h-4 text-primary"/></div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.meal_time} · {f.kcal} kcal</p>
              </div>
              <button onClick={()=>del(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
            </li>
          ))}
          {foods.length===0 && <li className="py-4 text-sm text-muted-foreground">No food logged today.</li>}
        </ul>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold flex items-center gap-2"><FileText className="w-4 h-4"/>Diet Plans</h3>
          <label className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4"/>Upload
            <input type="file" accept="image/*,.pdf" onChange={uploadPlan} className="hidden"/>
          </label>
        </div>
        <div className="space-y-2">
          {plans.map(p => (
            <a key={p.id} href={p.file_url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary transition">
              <FileText className="w-4 h-4 text-primary"/>
              <div className="flex-1">
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground">Assigned {new Date(p.assigned_date).toLocaleDateString()}</p>
              </div>
            </a>
          ))}
          {plans.length === 0 && <p className="text-sm text-muted-foreground">No diet plans yet.</p>}
        </div>
      </div>
    </div>
  );
}
