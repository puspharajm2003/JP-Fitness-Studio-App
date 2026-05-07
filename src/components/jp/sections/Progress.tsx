import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Plus, TrendingDown, TrendingUp, Ruler, Scale, Target, 
  ArrowDown, ArrowUp, Minus, Zap, Sparkles,
  Activity, ArrowRight, ChevronDown, ChevronUp, Apple, 
  Heart, AlertTriangle, Info, Moon, Sun, User, 
  Calendar, Weight, Calculator, Shield,
  Trash2, History, RefreshCw, Share2, Download, Save
} from "lucide-react";
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

  // BMI & Healthy Weight Range calculations
  const heightM = (profile?.height_cm || 0) / 100;
  const bmi = latest && heightM > 0 ? (latest / (heightM * heightM)).toFixed(1) : null;
  const healthyMin = heightM > 0 ? (18.5 * heightM * heightM).toFixed(1) : null;
  const healthyMax = heightM > 0 ? (25 * heightM * heightM).toFixed(1) : null;

  const getBmiStatus = (bmiVal: number) => {
    if (bmiVal < 18.5) return { label: "Underweight", color: "text-blue-500" };
    if (bmiVal < 25) return { label: "Normal", color: "text-emerald-500" };
    if (bmiVal < 30) return { label: "Overweight", color: "text-amber-500" };
    return { label: "Obese", color: "text-rose-500" };
  };

  const bmiStatus = bmi ? getBmiStatus(parseFloat(bmi)) : null;

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
        <div className="grid md:grid-cols-2 gap-4 animate-pop">
          <BodySilhouette
            gender={profile?.gender || null}
            progress={progressPercent}
            startWeight={start}
            currentWeight={latest}
            targetWeight={target}
          />
          
          {/* Health Insights */}
          <div className="glass-card rounded-3xl p-6 border-none shadow-xl bg-white dark:bg-slate-900/50 flex flex-col">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Health Metrics
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">BMI Status</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black">{bmi || "--"}</p>
                  {bmiStatus && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary ${bmiStatus.color}`}>
                      {bmiStatus.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Healthy Range</p>
                <p className="text-xl font-extrabold">
                  {healthyMin && healthyMax ? `${healthyMin}-${healthyMax}` : "--"}
                  <span className="text-xs font-normal text-muted-foreground ml-1">kg</span>
                </p>
                <p className="text-[8px] text-muted-foreground italic">Standard for {profile?.height_cm || "—"} cm</p>
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold">Goal Progress</p>
                <p className="text-xs font-black text-primary">
                  {remaining !== null ? `${Math.abs(remaining).toFixed(1)} kg remaining` : "--"}
                </p>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full bg-gradient-brand transition-all duration-1000" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
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

      {/* Comprehensive BMI Tracker (History & Analytics) */}
      <BmiCalculator />

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

interface SavedEntry {
  id: string;
  date: string;
  bmi: number;
  category: string;
  height: number;
  weight: number;
  unitSystem: string;
}

interface BmiResult {
  value: number;
  category: string;
  color: string;
  bgColor: string;
  range: string;
  healthyWeightMin: number;
  healthyWeightMax: number;
  bmiPrime: number;
  ponderalIndex: number;
}

function BmiCalculator() {
  // Unit system state
  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
  
  // Input states
  const [age, setAge] = useState<number>(23);
  const [gender, setGender] = useState<"male" | "female">("male");
  
  // Metric units
  const [heightCm, setHeightCm] = useState<number>(173);
  const [weightKg, setWeightKg] = useState<number>(73);
  
  // Imperial units
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(8);
  const [weightLbs, setWeightLbs] = useState<number>(160);
  
  // Result state
  const [result, setResult] = useState<BmiResult | null>(null);
  
  // Saved calculations history
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
  // Expanded info sections
  const [expandedSections, setExpandedSections] = useState({
    risks: false,
    limitations: false,
    formula: false,
  });
  
  // Load saved entries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("bmi_calculator_history");
    if (stored) {
      try {
        setSavedEntries(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);
  
  // Save to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem("bmi_calculator_history", JSON.stringify(savedEntries));
  }, [savedEntries]);
  
  // Compute BMI whenever inputs change
  useEffect(() => {
    let heightMeters: number;
    let weightKgValue: number;
    
    if (unitSystem === "metric") {
      heightMeters = heightCm / 100;
      weightKgValue = weightKg;
    } else {
      const totalInches = heightFeet * 12 + heightInches;
      heightMeters = totalInches * 0.0254;
      weightKgValue = weightLbs * 0.453592;
    }
    
    if (heightMeters > 0 && weightKgValue > 0) {
      const bmi = weightKgValue / (heightMeters * heightMeters);
      const category = getBmiCategory(bmi);
      const color = getBmiColor(category);
      const bgColor = getBmiBgColor(category);
      
      const healthyWeightMin = 18.5 * (heightMeters * heightMeters);
      const healthyWeightMax = 25 * (heightMeters * heightMeters);
      const bmiPrime = bmi / 25;
      const ponderalIndex = weightKgValue / Math.pow(heightMeters, 3);
      
      setResult({
        value: parseFloat(bmi.toFixed(1)),
        category,
        color,
        bgColor,
        range: getBmiRange(bmi),
        healthyWeightMin: parseFloat(healthyWeightMin.toFixed(1)),
        healthyWeightMax: parseFloat(healthyWeightMax.toFixed(1)),
        bmiPrime: parseFloat(bmiPrime.toFixed(2)),
        ponderalIndex: parseFloat(ponderalIndex.toFixed(1)),
      });
    } else {
      setResult(null);
    }
  }, [unitSystem, heightCm, weightKg, heightFeet, heightInches, weightLbs]);
  
  const getBmiCategory = (bmi: number): string => {
    if (bmi < 16) return "Severe Thinness";
    if (bmi < 17) return "Moderate Thinness";
    if (bmi < 18.5) return "Mild Thinness";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    if (bmi < 35) return "Obese Class I";
    if (bmi < 40) return "Obese Class II";
    return "Obese Class III";
  };
  
  const getBmiColor = (category: string): string => {
    switch (category) {
      case "Severe Thinness": return "text-rose-600";
      case "Moderate Thinness": return "text-orange-500";
      case "Mild Thinness": return "text-amber-500";
      case "Normal": return "text-emerald-600";
      case "Overweight": return "text-amber-500";
      case "Obese Class I": return "text-orange-500";
      case "Obese Class II": return "text-rose-500";
      case "Obese Class III": return "text-red-600";
      default: return "text-slate-600";
    }
  };
  
  const getBmiBgColor = (category: string): string => {
    switch (category) {
      case "Severe Thinness": return "bg-rose-50 dark:bg-rose-950/30";
      case "Moderate Thinness": return "bg-orange-50 dark:bg-orange-950/30";
      case "Mild Thinness": return "bg-amber-50 dark:bg-amber-950/30";
      case "Normal": return "bg-emerald-50 dark:bg-emerald-950/30";
      case "Overweight": return "bg-amber-50 dark:bg-amber-950/30";
      case "Obese Class I": return "bg-orange-50 dark:bg-orange-950/30";
      case "Obese Class II": return "bg-rose-50 dark:bg-rose-950/30";
      case "Obese Class III": return "bg-red-50 dark:bg-red-950/30";
      default: return "bg-slate-50 dark:bg-slate-800";
    }
  };
  
  const getBmiRange = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight range";
    if (bmi < 25) return "Healthy weight range";
    if (bmi < 30) return "Overweight range";
    return "Obese range";
  };
  
  const getIndicatorPosition = (bmi: number): number => {
    const minBmi = 10;
    const maxBmi = 45;
    const clamped = Math.min(Math.max(bmi, minBmi), maxBmi);
    return ((clamped - minBmi) / (maxBmi - minBmi)) * 100;
  };
  
  const getGaugeRotation = (bmi: number): number => {
    const minBmi = 10;
    const maxBmi = 45;
    const clamped = Math.min(Math.max(bmi, minBmi), maxBmi);
    const percent = (clamped - minBmi) / (maxBmi - minBmi);
    return -90 + (percent * 180);
  };
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const saveCurrentResult = () => {
    if (!result) return;
    
    let heightValue: number;
    let weightValue: number;
    if (unitSystem === "metric") {
      heightValue = heightCm;
      weightValue = weightKg;
    } else {
      heightValue = heightFeet * 12 + heightInches;
      weightValue = weightLbs;
    }
    
    const newEntry: SavedEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      bmi: result.value,
      category: result.category,
      height: heightValue,
      weight: weightValue,
      unitSystem,
    };
    
    setSavedEntries(prev => [newEntry, ...prev].slice(0, 10)); // Keep last 10
  };
  
  const deleteEntry = (id: string) => {
    setSavedEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const clearHistory = () => {
    setSavedEntries([]);
  };
  
  const resetForm = () => {
    setAge(23);
    setGender("male");
    if (unitSystem === "metric") {
      setHeightCm(173);
      setWeightKg(73);
    } else {
      setHeightFeet(5);
      setHeightInches(8);
      setWeightLbs(160);
    }
  };
  
  const formatEntryValue = (entry: SavedEntry) => {
    if (entry.unitSystem === "metric") {
      return `${entry.height} cm, ${entry.weight} kg`;
    } else {
      const feet = Math.floor(entry.height / 12);
      const inches = entry.height % 12;
      return `${feet}'${inches}", ${entry.weight} lbs`;
    }
  };
  
  const BmiGauge = ({ bmi }: { bmi: number }) => {
    const rotation = getGaugeRotation(bmi);
    return (
      <div className="relative w-36 h-36 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
            strokeLinecap="round"
            className="dark:stroke-slate-700"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="url(#bmiGradientAdvanced)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(rotation + 90) / 180 * Math.PI * 40} 500`}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="bmiGradientAdvanced" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black">{bmi}</span>
          <span className="text-[10px] text-slate-500">BMI</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 space-y-8 mt-8 animate-pop">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
          <Heart className="w-4 h-4" />
          Advanced Tracker
        </div>
        <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          BMI History & Analytics
        </h2>
      </div>
      
      <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {[
            { value: "metric", label: "Metric", icon: Ruler },
            { value: "imperial", label: "Imperial", icon: Weight },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setUnitSystem(tab.value as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-semibold text-sm transition-all ${
                unitSystem === tab.value
                  ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Age
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(Math.min(120, Math.max(2, parseInt(e.target.value) || 2)))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-400/20 outline-none transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">y</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                  <User className="w-4 h-4 text-emerald-500" />
                  Gender
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setGender("male")} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${gender === "male" ? "bg-emerald-500 text-white shadow-lg" : "bg-secondary text-muted-foreground"}`}>M</button>
                  <button onClick={() => setGender("female")} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${gender === "female" ? "bg-emerald-500 text-white shadow-lg" : "bg-secondary text-muted-foreground"}`}>F</button>
                </div>
              </div>
            </div>
            
            {unitSystem === "metric" ? (
              <>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                    <Ruler className="w-4 h-4 text-emerald-500" />
                    Height: {heightCm} cm
                  </label>
                  <input type="range" min="100" max="250" value={heightCm} onChange={(e) => setHeightCm(parseInt(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                    <Scale className="w-4 h-4 text-emerald-500" />
                    Weight: {weightKg} kg
                  </label>
                  <input type="range" min="30" max="200" step="0.5" value={weightKg} onChange={(e) => setWeightKg(parseFloat(e.target.value))} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                    <Ruler className="w-4 h-4 text-emerald-500" />
                    Height: {heightFeet}' {heightInches}"
                  </label>
                  <div className="space-y-2">
                    <input type="range" min="3" max="7" value={heightFeet} onChange={(e) => setHeightFeet(parseInt(e.target.value))} className="w-full h-2 bg-secondary rounded-lg accent-emerald-500" />
                    <input type="range" min="0" max="11" value={heightInches} onChange={(e) => setHeightInches(parseInt(e.target.value))} className="w-full h-2 bg-secondary rounded-lg accent-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                    <Scale className="w-4 h-4 text-emerald-500" />
                    Weight: {weightLbs} lbs
                  </label>
                  <input type="range" min="60" max="450" value={weightLbs} onChange={(e) => setWeightLbs(parseInt(e.target.value))} className="w-full h-2 bg-secondary rounded-lg accent-emerald-500" />
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mb-6">
            <button onClick={resetForm} className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-xs font-bold flex items-center gap-2 transition hover:bg-slate-200 dark:hover:bg-slate-700"><RefreshCw className="w-3 h-3" /> Reset</button>
            {result && <button onClick={saveCurrentResult} className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition"><Save className="w-3 h-3" /> Save Log</button>}
            <button onClick={() => setShowHistory(!showHistory)} className="px-4 py-2 rounded-xl bg-secondary text-emerald-600 text-xs font-bold flex items-center gap-2 transition"><History className="w-3 h-3" /> {showHistory ? "Hide History" : "View History"}</button>
          </div>
          
          {result && (
            <div className={`rounded-2xl ${result.bgColor} p-6 md:p-8 border border-emerald-500/10 transition-all duration-300`}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="flex-shrink-0">
                  <BmiGauge bmi={result.value} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Metric</p>
                  <h2 className={`text-5xl font-black ${result.color} mt-1`}>{result.value}</h2>
                  <p className={`text-lg font-bold ${result.color}`}>{result.category}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="relative h-2 bg-gradient-to-r from-rose-500 via-emerald-500 to-orange-500 rounded-full overflow-hidden">
                      <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-slate-800 rounded-full shadow-lg transition-all" style={{ left: `${getIndicatorPosition(result.value)}%` }} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-border/50">
                    <div><p className="text-[9px] font-black text-muted-foreground uppercase">Healthy Weight</p><p className="font-bold text-xs">{result.healthyWeightMin} – {result.healthyWeightMax} kg</p></div>
                    <div><p className="text-[9px] font-black text-muted-foreground uppercase">Ponderal Index</p><p className="font-bold text-xs">{result.ponderalIndex} kg/m³</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showHistory && (
        <div className="glass-card rounded-2xl p-6 animate-pop">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold flex items-center gap-2"><History className="w-4 h-4 text-emerald-500" /> Recent Logs</h3>
            {savedEntries.length > 0 && <button onClick={clearHistory} className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 hover:underline"><Trash2 className="w-3 h-3" /> Clear All</button>}
          </div>
          {savedEntries.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">No saved logs yet.</p> : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {savedEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center font-black text-emerald-600 text-xs">{entry.bmi}</div>
                    <div><p className="text-xs font-bold">{entry.category}</p><p className="text-[9px] text-muted-foreground font-medium">{entry.date} • {formatEntryValue(entry)}</p></div>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} className="text-muted-foreground hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({title,value,icon:Icon,hi}:any){
  return <div className={`rounded-2xl p-5 ${hi?"bg-gradient-brand text-primary-foreground shadow-brand":"glass-card"}`}>
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80"><Icon className="w-4 h-4"/>{title}</div>
    <p className="font-display text-2xl font-extrabold mt-2">{value}</p>
  </div>;
}
