import { useEffect, useState } from "react";
import { useProfile } from "@/lib/useProfile";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useTheme, themes } from "@/providers/ThemeProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Calendar, LogOut, MessageCircle, Save, Sparkles, User as UserIcon, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { profile, update } = useProfile();
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { themeId, setTheme } = useTheme();
  const [pkg, setPkg] = useState<any>(null);
  const [f, setF] = useState<any>({});
  useEffect(() => { if (profile) setF(profile); }, [profile]);
  useEffect(() => { (async () => {
    if (!user) return;
    const { data } = await supabase.from("packages").select("*").eq("user_id", user.id).eq("status","active").order("end_date",{ascending:false}).limit(1).maybeSingle();
    setPkg(data);
  })(); }, [user]);

  const save = async () => {
    await update({
      full_name: f.full_name, phone: f.phone, gender: f.gender, dob: f.dob,
      height_cm: f.height_cm ? parseFloat(f.height_cm) : null,
      target_weight_kg: f.target_weight_kg ? parseFloat(f.target_weight_kg) : null,
      goal: f.goal,
      daily_calorie_goal: parseInt(f.daily_calorie_goal)||2000,
      daily_water_goal_ml: parseInt(f.daily_water_goal_ml)||2500,
      daily_step_goal: parseInt(f.daily_step_goal)||10000,
      sleep_goal_hr: parseFloat(f.sleep_goal_hr)||8,
      coach_phone: f.coach_phone,
    });
    toast.success("Profile saved");
  };

  const coach = () => {
    const phone = (f.coach_phone||"").replace(/\D/g,"");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-brand-3 p-6 text-primary-foreground shadow-brand flex items-center gap-4 flex-wrap">
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center font-display font-extrabold text-3xl">
          {(f.full_name || user?.email || "U").slice(0,1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl font-extrabold truncate">{f.full_name || "Member"}</h2>
          <p className="opacity-90 text-sm truncate">{user?.email}</p>
          <p className="opacity-90 text-xs mt-1 flex items-center gap-1.5"><Sparkles className="w-3 h-3"/>{profile?.loyalty_points || 0} loyalty points</p>
        </div>
        <button onClick={coach} className="px-4 py-2 rounded-xl bg-white text-foreground font-semibold flex items-center gap-2"><MessageCircle className="w-4 h-4"/>Coach</button>
	      {isAdmin && (
	        <a href="/admin" className="px-4 py-2 rounded-xl bg-white/20 text-foreground font-semibold flex items-center gap-2">
	          <Shield className="w-4 h-4" /> Admin Panel
	        </a>
	      )}
      </div>

      {pkg && (
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary"/>
          <div className="flex-1">
            <p className="font-semibold">{pkg.name}</p>
            <p className="text-xs text-muted-foreground">Active until {new Date(pkg.end_date).toLocaleDateString()}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-gradient-soft text-xs font-semibold">{pkg.status}</span>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4"/>Personal info</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Full name" value={f.full_name||""} onChange={(v:string)=>setF({...f,full_name:v})}/>
          <Input label="Phone" value={f.phone||""} onChange={(v:string)=>setF({...f,phone:v})}/>
          <Select label="Gender" value={f.gender||""} options={["","Male","Female","Other"]} onChange={(v:string)=>setF({...f,gender:v})}/>
          <Input label="Date of birth" type="date" value={f.dob||""} onChange={(v:string)=>setF({...f,dob:v})}/>
          <Input label="Height (cm)" type="number" value={f.height_cm||""} onChange={(v:string)=>setF({...f,height_cm:v})}/>
          <Input label="Target weight (kg)" type="number" value={f.target_weight_kg||""} onChange={(v:string)=>setF({...f,target_weight_kg:v})}/>
          <Select label="Goal" value={f.goal||"weight_loss"} options={["weight_loss","muscle_gain","maintenance","endurance"]} onChange={(v:string)=>setF({...f,goal:v})}/>
          <Input label="Coach WhatsApp" value={f.coach_phone||""} onChange={(v:string)=>setF({...f,coach_phone:v})}/>
        </div>
        <h4 className="font-semibold mt-6 mb-3">Daily targets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input label="Calories" type="number" value={f.daily_calorie_goal||""} onChange={(v:string)=>setF({...f,daily_calorie_goal:v})}/>
          <Input label="Water (ml)" type="number" value={f.daily_water_goal_ml||""} onChange={(v:string)=>setF({...f,daily_water_goal_ml:v})}/>
          <Input label="Steps" type="number" value={f.daily_step_goal||""} onChange={(v:string)=>setF({...f,daily_step_goal:v})}/>
          <Input label="Sleep (hr)" type="number" value={f.sleep_goal_hr||""} onChange={(v:string)=>setF({...f,sleep_goal_hr:v})}/>
        </div>
        <button onClick={save} className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold flex items-center gap-2"><Save className="w-4 h-4"/>Save</button>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3">Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {themes.map(t => (
            <button key={t.id} onClick={()=>setTheme(t.id)} className={`p-3 rounded-xl border text-left transition ${themeId===t.id?"border-primary ring-brand":"border-border"}`}>
              <div className="flex gap-1 mb-2">{t.swatch.map((c,i)=><span key={i} className="w-5 h-5 rounded-full" style={{background:c}}/>)}</div>
              <span className="text-sm font-semibold">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={signOut} className="w-full py-3 rounded-2xl border border-border bg-card font-semibold flex items-center justify-center gap-2 text-muted-foreground hover:text-destructive hover:border-destructive transition"><LogOut className="w-4 h-4"/>Sign out</button>
    </div>
  );
}
function Input({label, ...p}: any) {
  return <label className="block">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    <input {...p} onChange={(e:any)=>p.onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-brand"/>
  </label>;
}
function Select({label, options, ...p}: any) {
  return <label className="block">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    <select {...p} onChange={(e:any)=>p.onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none capitalize">
      {options.map((o:string)=><option key={o} value={o}>{o.replace(/_/g," ")||"—"}</option>)}
    </select>
  </label>;
}
