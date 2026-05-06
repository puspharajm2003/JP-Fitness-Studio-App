import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Plus, TrendingDown, TrendingUp, Ruler, Scale, Target, ArrowDown, ArrowUp, Minus, Zap } from "lucide-react";
import { toast } from "sonner";

// SVG body silhouette component — renders male or female based on gender
function BodySilhouette({ gender, progress, startWeight, currentWeight, targetWeight }: {
  gender: string | null;
  progress: number; // 0-100, how much toward goal
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
}) {
  const isFemale = gender?.toLowerCase() === "female";
  const diff = currentWeight - startWeight;
  const isLoss = diff < 0;
  const isGain = diff > 0;

  // Color based on progress direction
  const progressColor = isLoss
    ? `hsl(${120 + Math.min(progress, 100) * 1.2}, 70%, 50%)`  // green for loss
    : isGain
      ? `hsl(${200 + Math.min(progress, 100) * 0.6}, 70%, 55%)`  // blue for gain
      : "hsl(var(--primary))";

  const bgColor = isLoss ? "from-emerald-500/10 to-teal-500/10" : isGain ? "from-blue-500/10 to-indigo-500/10" : "from-gray-500/10 to-gray-500/10";

  return (
    <div className={`relative rounded-3xl bg-gradient-to-b ${bgColor} p-6 flex flex-col items-center gap-4 overflow-hidden`}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-current blur-3xl" />
        <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-current blur-3xl" />
      </div>

      {/* Body SVG */}
      <div className="relative w-32 h-52 md:w-40 md:h-64">
        <svg viewBox="0 0 200 320" className="w-full h-full" style={{ filter: `drop-shadow(0 4px 20px ${progressColor}40)` }}>
          {isFemale ? (
            // Female silhouette
            <g>
              {/* Head */}
              <circle cx="100" cy="38" r="28" fill={progressColor} opacity="0.9" />
              {/* Neck */}
              <rect x="90" y="64" width="20" height="16" rx="4" fill={progressColor} opacity="0.85" />
              {/* Torso — hourglass */}
              <path d="M60,80 Q55,85 52,100 Q48,120 55,140 Q60,155 65,165 Q75,180 80,190 L120,190 Q125,180 135,165 Q140,155 145,140 Q152,120 148,100 Q145,85 140,80 Z" fill={progressColor} opacity="0.8" />
              {/* Left arm */}
              <path d="M52,90 Q35,100 28,130 Q24,150 30,160" stroke={progressColor} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.75" />
              {/* Right arm */}
              <path d="M148,90 Q165,100 172,130 Q176,150 170,160" stroke={progressColor} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.75" />
              {/* Left leg */}
              <path d="M80,190 Q75,220 72,250 Q70,280 68,310" stroke={progressColor} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.7" />
              {/* Right leg */}
              <path d="M120,190 Q125,220 128,250 Q130,280 132,310" stroke={progressColor} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.7" />
            </g>
          ) : (
            // Male silhouette
            <g>
              {/* Head */}
              <circle cx="100" cy="35" r="30" fill={progressColor} opacity="0.9" />
              {/* Neck */}
              <rect x="87" y="63" width="26" height="16" rx="4" fill={progressColor} opacity="0.85" />
              {/* Torso — broader */}
              <path d="M55,79 Q48,85 45,100 Q42,130 50,155 Q55,170 65,185 L75,190 L125,190 L135,185 Q145,170 150,155 Q158,130 155,100 Q152,85 145,79 Z" fill={progressColor} opacity="0.8" />
              {/* Left arm */}
              <path d="M48,88 Q30,100 22,135 Q18,155 24,165" stroke={progressColor} strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.75" />
              {/* Right arm */}
              <path d="M152,88 Q170,100 178,135 Q182,155 176,165" stroke={progressColor} strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.75" />
              {/* Left leg */}
              <path d="M78,190 Q74,220 70,255 Q68,285 66,312" stroke={progressColor} strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.7" />
              {/* Right leg */}
              <path d="M122,190 Q126,220 130,255 Q132,285 134,312" stroke={progressColor} strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.7" />
            </g>
          )}
          {/* Progress ring around head */}
          <circle cx="100" cy="38" r="36" fill="none" stroke={progressColor} strokeWidth="3" opacity="0.3" strokeDasharray={`${Math.PI * 72 * (progress / 100)} ${Math.PI * 72}`} transform="rotate(-90, 100, 38)" />
        </svg>
      </div>

      {/* Stats below body */}
      <div className="relative grid grid-cols-3 gap-4 w-full text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Start</p>
          <p className="font-display font-bold text-lg">{startWeight || "—"}</p>
          <p className="text-[10px] text-muted-foreground">kg</p>
        </div>
        <div className="relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            {isLoss ? <ArrowDown className="w-4 h-4 text-emerald-500" /> :
              isGain ? <ArrowUp className="w-4 h-4 text-blue-500" /> :
                <Minus className="w-4 h-4 text-muted-foreground" />}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Current</p>
          <p className="font-display font-extrabold text-2xl" style={{ color: progressColor }}>{currentWeight || "—"}</p>
          <p className="text-[10px] text-muted-foreground">kg</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Target</p>
          <p className="font-display font-bold text-lg">{targetWeight || "—"}</p>
          <p className="text-[10px] text-muted-foreground">kg</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color: progressColor }}>
            {Math.abs(diff).toFixed(1)} kg {isLoss ? "lost" : isGain ? "gained" : ""}
          </span>
          <span className="text-xs text-muted-foreground">{Math.min(Math.round(progress), 100)}% to goal</span>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${progressColor}80, ${progressColor})` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const { profile, update } = useProfile();
  const [weights, setWeights] = useState<any[]>([]);
  const [meas, setMeas] = useState<any[]>([]);
  const [w, setW] = useState(""); const [showM, setShowM] = useState(false);
  const [m, setM] = useState({ chest_in:"", waist_in:"", hips_in:"", arms_in:"", thighs_in:"" });
  const [goalWeight, setGoalWeight] = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);

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

  const saveGoal = async () => {
    const val = parseFloat(goalWeight);
    if (!val) return;
    await update({ target_weight_kg: val });
    toast.success(`Weight goal set to ${val} kg`);
    setShowGoalInput(false);
    setGoalWeight("");
  };

  const start = weights.length > 0 ? weights[0].weight_kg : null;
  const latest = weights.length > 0 ? weights[weights.length-1].weight_kg : null;
  const target = profile?.target_weight_kg;
  
  const max = weights.length > 0 ? Math.max(...weights.map(x=>x.weight_kg)) : 0; 
  const min = weights.length > 0 ? Math.min(...weights.map(x=>x.weight_kg)) : 0;
  const goalType = profile?.goal || (target && latest && target < latest ? "weight_loss" : "weight_gain");

  const diff = start && latest ? (latest - start) : 0;
  const remaining = latest && target ? (target - latest) : null;

  // Calculate progress toward goal
  const progressPercent = (() => {
    if (!start || !latest || !target) return 0;
    const totalNeeded = Math.abs(start - target);
    if (totalNeeded === 0) return 100;
    
    let achieved = 0;
    if (goalType === "weight_loss") {
      achieved = start - latest;
    } else {
      achieved = latest - start;
    }
    
    return Math.max(0, Math.min(100, (achieved / totalNeeded) * 100));
  })();

  const [dailyGoals, setDailyGoals] = useState({ kcal: profile?.daily_calorie_goal || 2000, steps: profile?.daily_step_goal || 10000 });
  const [showDailyGoals, setShowDailyGoals] = useState(false);

  const saveDailyGoals = async () => {
    await update({ daily_calorie_goal: dailyGoals.kcal, daily_step_goal: dailyGoals.steps });
    toast.success("Daily goals updated!");
    setShowDailyGoals(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <StatCard title="Current Weight" value={latest?`${latest} kg`:"—"} icon={Scale} />
        <StatCard title={goalType === "weight_loss" ? "Total Lost" : "Total Gained"} value={`${Math.abs(diff).toFixed(1)} kg`} icon={goalType === "weight_loss" ? TrendingDown : TrendingUp} hi />
        <StatCard 
           title="Remaining" 
           value={remaining !== null ? `${Math.abs(remaining).toFixed(1)} kg` : (target ? "No logs yet" : "Set Goal ↓")} 
           icon={Target} 
        />
      </div>

      {/* Daily Goals Prompt */}
      <div className="glass-card rounded-2xl p-5 border-primary/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm">Daily Fitness Goals</h4>
              <p className="text-[10px] text-muted-foreground">Keep your intake and activity in check</p>
            </div>
          </div>
          <button onClick={() => setShowDailyGoals(!showDailyGoals)} className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-bold hover:bg-secondary/80">
            {showDailyGoals ? "Close" : "Adjust Goals"}
          </button>
        </div>
        
        {showDailyGoals ? (
          <div className="grid grid-cols-2 gap-3 animate-pop">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Daily Calorie Goal</label>
              <input 
                type="number" 
                value={dailyGoals.kcal} 
                onChange={e => setDailyGoals({...dailyGoals, kcal: parseInt(e.target.value)})}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Daily Step Goal</label>
              <input 
                type="number" 
                value={dailyGoals.steps} 
                onChange={e => setDailyGoals({...dailyGoals, steps: parseInt(e.target.value)})}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm outline-none"
              />
            </div>
            <button onClick={saveDailyGoals} className="col-span-2 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-bold text-sm shadow-brand mt-1">
              Save Daily Goals
            </button>
          </div>
        ) : (
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Calories</p>
              <p className="font-display font-black text-lg">{profile?.daily_calorie_goal || 2000} <span className="text-[10px] font-medium">kcal</span></p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Steps</p>
              <p className="font-display font-black text-lg">{profile?.daily_step_goal || 10000} <span className="text-[10px] font-medium">steps</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Goal weight input / Target Weight prompt */}
      <div className="glass-card rounded-2xl p-5 border-primary/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm">Target Weight</h4>
              <p className="text-[10px] text-muted-foreground">Define your ultimate goal</p>
            </div>
          </div>
          <button 
            onClick={() => setShowGoalInput(s => !s)}
            className="px-4 py-1.5 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-bold shadow-brand"
          >
            {target ? "Change Goal" : "Set Goal"}
          </button>
        </div>

      {/* Goal weight input */}
      {showGoalInput && (
        <div className="glass-card rounded-2xl p-5 animate-pop">
          <h4 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} /> Set Your Weight Goal
          </h4>
          <div className="flex gap-2">
            <input
              value={goalWeight}
              onChange={e => setGoalWeight(e.target.value)}
              type="number"
              step="0.1"
              placeholder={`Current: ${latest || "?"} kg — Enter target`}
              className="flex-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={saveGoal} className="px-5 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold text-sm">
              Save Goal
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {latest && goalWeight ? (
              parseFloat(goalWeight) < latest
                ? `You need to lose ${(latest - parseFloat(goalWeight)).toFixed(1)} kg`
                : `You need to gain ${(parseFloat(goalWeight) - latest).toFixed(1)} kg`
            ) : "Enter your target weight"}
          </p>
        </div>
      )}
    </div>

      {/* Body Silhouette Visualization */}
      {weights.length >= 2 && target && (
        <BodySilhouette
          gender={profile?.gender || null}
          progress={progressPercent}
          startWeight={start}
          currentWeight={latest}
          targetWeight={target}
        />
      )}

      {/* Weight chart */}
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
            const isLatest = i === weights.length - 1;
            return (
              <div key={d.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className={`w-full rounded-t-md transition-all ${isLatest ? "bg-gradient-to-t from-emerald-500 to-teal-400" : "bg-gradient-brand"}`} style={{height:`${h}%`}} title={`${d.weight_kg} kg`} />
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-foreground text-background text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {d.weight_kg} kg
                </div>
                {i % Math.ceil(weights.length/8) === 0 && <span className="text-[9px] text-muted-foreground">{new Date(d.date).getDate()}/{new Date(d.date).getMonth()+1}</span>}
              </div>
            );
          })}
        </div>
        {/* Target line indicator */}
        {target && weights.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-px flex-1 border-t-2 border-dashed border-primary/30" />
            <span className="text-[10px] font-semibold text-primary">Goal: {target} kg</span>
            <div className="h-px flex-1 border-t-2 border-dashed border-primary/30" />
          </div>
        )}
      </div>

      {/* Measurements section */}
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

function StatCard({title,value,icon:Icon,hi}:any){
  return <div className={`rounded-2xl p-5 ${hi?"bg-gradient-brand text-primary-foreground shadow-brand":"glass-card"}`}>
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80"><Icon className="w-4 h-4"/>{title}</div>
    <p className="font-display text-2xl font-extrabold mt-2">{value}</p>
  </div>;
}
