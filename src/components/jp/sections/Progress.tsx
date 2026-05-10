import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Plus, TrendingDown, TrendingUp, Ruler, Scale, Target, 
  ArrowDown, ArrowUp, Minus, Zap, Sparkles,
  Activity, ArrowRight, ChevronDown, ChevronUp, Apple, 
  Heart, AlertTriangle, Info, Moon, Sun, User, 
  Calendar, Weight, Calculator, Shield,
  Trash2, History, RefreshCw, Share2, Download, Save, 
  ScanLine, Camera, Target as TargetIcon, Trophy,
  Flame, Dumbbell, Eye, TrendingUp as TrendingUpIcon,
  ChevronRight, CheckCircle2, Award
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import gsap from "gsap";

// AI Body Personal - Animated Progress Visualization
function AIPersonalBody({ gender, startWeight, currentWeight, targetWeight, goalType }: {
  gender: string | null;
  startWeight: number;
  currentWeight: number;
  targetWeight: number;
  goalType: string;
}) {
  const isFemale = gender?.toLowerCase() === "female";
  const diff = Number(currentWeight) - Number(startWeight);
  const isLoss = diff < 0;
  const isGain = diff > 0;
  const toGoal = Number(targetWeight) - Number(startWeight);
  const progress = toGoal !== 0 ? Math.abs(diff / toGoal) * 100 : 0;
  
  // Progress colors
  const gainColor = { primary: "#22c55e", glow: "rgba(34,197,94,0.4)" };
  const lossColor = { primary: "#3b82f6", glow: "rgba(59,130,246,0.4)" };
  const colorScheme = goalType === "weight_loss" ? (isLoss ? lossColor : gainColor) : (isGain ? gainColor : lossColor);
  const accentColor = isLoss ? "text-blue-400" : isGain ? "text-emerald-400" : "text-primary";
  
  // Body scale based on weight change (subtle scaling effect)
  const scaleX = isLoss ? Math.max(0.88, 1 - Math.abs(diff) / 100) : Math.min(1.12, 1 + diff / 100);
  const scaleY = isLoss ? Math.min(1.08, 1 + Math.abs(diff) / 100) : Math.max(0.92, 1 - diff / 100);
  
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col items-center shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-500/10 to-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 blur-2xl" />
      </div>
      
      <div className="relative z-10 text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">AI Personal</span>
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
        <h3 className="font-display text-xl font-black text-white">Body Transformation</h3>
      </div>
      
      {/* Animated Body Visualization */}
      <div className="relative w-40 h-52 mb-4" style={{ transform: `scaleX(${scaleX}) scaleY(${scaleY})`, transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}>
        <svg viewBox="0 0 200 320" className="w-full h-full" style={{ filter: `drop-shadow(0 0 30px ${colorScheme.glow})` }}>
          <defs>
            <linearGradient id={`bodyGrad-${isFemale ? 'f' : 'm'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorScheme.primary} stopOpacity="0.9" />
              <stop offset="50%" stopColor={colorScheme.primary} stopOpacity="0.7" />
              <stop offset="100%" stopColor={colorScheme.primary} stopOpacity="0.5" />
            </linearGradient>
          </defs>
          
          {isFemale ? (
            <g fill={`url(#bodyGrad-f)`}>
              <circle cx="100" cy="38" r="28" />
              <rect x="90" y="64" width="20" height="16" rx="4" opacity="0.85" />
              <path d="M60,80 Q55,85 52,100 Q48,120 55,140 Q60,155 65,165 Q75,180 80,190 L120,190 Q125,180 135,165 Q140,155 145,140 Q152,120 148,100 Q145,85 140,80 Z" />
              <path d="M52,90 Q35,100 28,130 Q24,150 30,160" stroke={colorScheme.primary} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.75" />
              <path d="M148,90 Q165,100 172,130 Q176,150 170,160" stroke={colorScheme.primary} strokeWidth="14" strokeLinecap="round" fill="none" opacity="0.75" />
              <path d="M80,190 Q75,220 72,250 Q70,280 68,310" stroke={colorScheme.primary} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M120,190 Q125,220 128,250 Q130,280 132,310" stroke={colorScheme.primary} strokeWidth="18" strokeLinecap="round" fill="none" opacity="0.7" />
            </g>
          ) : (
            <g fill={`url(#bodyGrad-m)`}>
              <circle cx="100" cy="35" r="30" />
              <rect x="87" y="63" width="26" height="16" rx="4" opacity="0.85" />
              <path d="M55,79 Q48,85 45,100 Q42,130 50,155 Q55,170 65,185 L75,190 L125,190 L135,185 Q145,170 150,155 Q158,130 155,100 Q152,85 145,79 Z" />
              <path d="M48,88 Q30,100 22,135 Q18,155 24,165" stroke={colorScheme.primary} strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.75" />
              <path d="M152,88 Q170,100 178,135 Q182,155 176,165" stroke={colorScheme.primary} strokeWidth="16" strokeLinecap="round" fill="none" opacity="0.75" />
              <path d="M78,190 Q74,220 70,255 Q68,285 66,312" stroke={colorScheme.primary} strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.7" />
              <path d="M122,190 Q126,220 130,255 Q132,285 134,312" stroke={colorScheme.primary} strokeWidth="20" strokeLinecap="round" fill="none" opacity="0.7" />
            </g>
          )}
          
          {/* Progress Ring */}
          <circle cx="100" cy="38" r="38" fill="none" stroke={colorScheme.primary} strokeWidth="3" opacity="0.4" 
            strokeDasharray={`${Math.PI * 76 * (Math.min(progress, 100) / 100)} ${Math.PI * 76}`} 
            transform="rotate(-90, 100, 38)" strokeLinecap="round" />
        </svg>
        
        {/* Floating Badge */}
        <div className="absolute -top-2 right-0 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black shadow-lg animate-bounce">
          {Math.min(Math.round(progress), 100)}%
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="relative grid grid-cols-3 gap-3 w-full mb-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
          <p className="text-[9px] uppercase tracking-wider text-white/50 mb-1">Start</p>
          <p className="font-black text-white text-lg">{startWeight}</p>
          <p className="text-[9px] text-white/40">kg</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/20 relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            {isLoss ? <ArrowDown className="w-4 h-4 text-blue-400" /> : isGain ? <ArrowUp className="w-4 h-4 text-emerald-400" /> : <Minus className="w-4 h-4 text-white/50" />}
          </div>
          <p className="text-[9px] uppercase tracking-wider text-white/50 mb-1 mt-2">Current</p>
          <p className="font-black text-white text-xl" style={{ color: colorScheme.primary }}>{currentWeight}</p>
          <p className="text-[9px] text-white/40">kg</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
          <p className="text-[9px] uppercase tracking-wider text-white/50 mb-1">Target</p>
          <p className="font-black text-white text-lg">{targetWeight}</p>
          <p className="text-[9px] text-white/40">kg</p>
        </div>
      </div>
      
      {/* Change Indicator */}
      <div className="relative w-full">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-bold ${accentColor}`}>
            {Math.abs(diff).toFixed(1)} kg {isLoss ? "lost" : isGain ? "gained" : "maintained"}
          </span>
          <span className="text-xs text-white/50">{targetWeight ? `${Math.abs(targetWeight - currentWeight).toFixed(1)} kg to goal` : "Set a goal"}</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden backdrop-blur">
          <div className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(progress, 100)}%`, background: `linear-gradient(90deg, ${colorScheme.primary}cc, ${colorScheme.primary})` }} />
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
  const deleteWeight = async (id: string) => {
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Entry removed"); load(); }
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
  
  const max = weights.length > 0 ? Math.max(...weights.map(x=>Number(x.weight_kg))) : 0; 
  const min = weights.length > 0 ? Math.min(...weights.map(x=>Number(x.weight_kg))) : 0;
  const goalType = profile?.goal || (target && latest && target < latest ? "weight_loss" : "weight_gain");

  const diff = start && latest ? (Number(latest) - Number(start)) : 0;
  const remaining = latest && target ? (Number(target) - Number(latest)) : null;

  // Calculate progress toward goal
  const progressPercent = (() => {
    if (!start || !latest || !target) return 0;
    const totalNeeded = Math.abs(Number(start) - Number(target));
    if (totalNeeded === 0) return 100;
    
    let achieved = 0;
    if (goalType === "weight_loss") {
      achieved = Number(start) - Number(latest);
    } else {
      achieved = Number(latest) - Number(start);
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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".progress-animate"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power4.out" }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Premium Transformation Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-8 md:p-12 text-white shadow-2xl border border-white/10 group progress-animate">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--brand-1))]/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-[hsl(var(--brand-1))]/20 transition-all duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(var(--brand-2))]/10 rounded-full blur-[80px] -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[hsl(var(--brand-1))]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[hsl(var(--brand-1))] border border-[hsl(var(--brand-1))]/20">
                <TrendingUpIcon className="w-3 h-3" />
                Metabolic Transformation Hub
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                Metric <span className="bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">Evolution</span>.
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-sm md:text-base leading-relaxed">
                Quantifying your journey through precise biometric tracking and predictive metabolic forecasting.
              </p>
            </div>

            <div className="flex gap-4">
               <button 
                onClick={() => setShowGoalInput(s => !s)}
                className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Configure Goals
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 progress-animate">
          <GlassCard className="p-8 group hover:scale-105 transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                <Scale className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Mass</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{latest || "—"}</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">kg</span>
            </div>
          </GlassCard>

          <GlassCard className="p-8 group hover:scale-105 transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                {goalType === "weight_loss" ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Net Delta</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-emerald-500">{Math.abs(diff).toFixed(1)}</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">kg {diff <= 0 ? "Lost" : "Gained"}</span>
            </div>
          </GlassCard>

          <GlassCard className="p-8 group hover:scale-105 transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Goal Proximity</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                {remaining !== null ? Math.abs(remaining).toFixed(1) : "—"}
              </span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">kg to target</span>
            </div>
          </GlassCard>
        </div>

      {/* Daily Goals Prompt */}
        <div className="grid lg:grid-cols-2 gap-8 progress-animate">
          {/* Goal Management */}
          <GlassCard className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tight">Biometric Configuration</h3>
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--brand-1))]/10 text-[hsl(var(--brand-1))] flex items-center justify-center">
                <TargetIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Daily Burn Goal</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={dailyGoals.kcal} 
                      onChange={e => setDailyGoals({...dailyGoals, kcal: parseInt(e.target.value)})}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold text-sm outline-none focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 transition-all"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">KCAL</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Step Objective</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={dailyGoals.steps} 
                      onChange={e => setDailyGoals({...dailyGoals, steps: parseInt(e.target.value)})}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold text-sm outline-none focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 transition-all"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">STEPS</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Body Mass</label>
                <div className="flex gap-3">
                  <input
                    value={goalWeight}
                    onChange={e => setGoalWeight(e.target.value)}
                    type="number"
                    step="0.1"
                    placeholder={`Current: ${latest || "?"} kg`}
                    className="flex-1 px-5 py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold text-sm outline-none focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 transition-all"
                  />
                  <button onClick={saveGoal} className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                    Set Goal
                  </button>
                </div>
              </div>

              <button 
                onClick={saveDailyGoals}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Update Global Objectives
              </button>
            </div>
          </GlassCard>

          {/* Goal Visualization Card */}
          <GlassCard className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tight">Target Summary</h3>
              <Award className="w-8 h-8 text-amber-500" />
            </div>

            <div className="py-8 space-y-6">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                <span>Current Status</span>
                <span className="text-[hsl(var(--brand-1))]">{Math.round(progressPercent)}% Accomplished</span>
              </div>
              <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-[hsl(var(--brand-1))] via-[hsl(var(--brand-2))] to-[hsl(var(--brand-1))] bg-[length:200%_auto] rounded-full shadow-[0_0_15px_hsl(var(--brand-1))] transition-all duration-1000 animate-gradient-x"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">
                You are currently <span className="text-white font-bold">{Math.abs(remaining || 0).toFixed(1)}kg</span> away from your ideal metabolic baseline. Stay consistent with your daily protocols.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Daily Calorie</p>
                <p className="text-xl font-black">{profile?.daily_calorie_goal || 2000} kcal</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Step Goal</p>
                <p className="text-xl font-black">{profile?.daily_step_goal || 10000}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 progress-animate">
          {/* AI Body Visualization Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Morphology Analysis</h3>
              <Eye className="w-5 h-5 text-[hsl(var(--brand-1))]" />
            </div>
            {weights.length >= 2 && target && start && latest ? (
              <AIPersonalBody
                gender={profile?.gender || null}
                startWeight={Number(start)}
                currentWeight={Number(latest)}
                targetWeight={Number(target)}
                goalType={goalType}
              />
            ) : (
              <GlassCard className="p-12 text-center bg-slate-900 text-white/50 italic text-sm">
                Awaiting sufficient biometric data for neural body synthesis.
              </GlassCard>
            )}

            <GlassCard className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-500" />
                <h3 className="text-2xl font-black tracking-tight">Biological Insights</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">BMI Analysis</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black">{bmi || "--"}</p>
                    {bmiStatus && (
                      <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full bg-white dark:bg-white/10 shadow-sm", bmiStatus.color)}>
                        {bmiStatus.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1 p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Optimal Baseline</p>
                  <p className="text-2xl font-black">
                    {healthyMin && healthyMax ? `${healthyMin}-${healthyMax}` : "--"}
                    <span className="text-[10px] font-black text-slate-400 ml-1">KG</span>
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Weight Evolution Chart */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Weight Evolution</h3>
              <div className="flex gap-2">
                <form onSubmit={addWeight} className="flex gap-2">
                  <input 
                    value={w} 
                    onChange={e=>setW(e.target.value)} 
                    type="number" 
                    step="0.1" 
                    placeholder="New weight" 
                    className="w-28 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold outline-none focus:ring-2 focus:ring-[hsl(var(--brand-1))]"
                  />
                  <button className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-xl">
                    Sync
                  </button>
                </form>
              </div>
            </div>

            <GlassCard className="p-8">
              <div className="h-64 flex items-end gap-1.5 mb-8">
                {weights.length === 0 ? (
                  <div className="m-auto text-center space-y-3">
                    <History className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">No telemetry logged</p>
                  </div>
                ) : (
                  weights.map((d,i) => {
                    const h = max === min ? 50 : ((d.weight_kg - min)/(max-min)) * 85 + 15;
                    const isLatest = i === weights.length - 1;
                    return (
                      <div key={d.id} className="flex-1 flex flex-col items-center gap-2 group relative">
                        <div 
                          className={cn(
                            "w-full rounded-t-xl transition-all duration-500 group-hover:brightness-110",
                            isLatest ? "bg-gradient-to-t from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))]" : "bg-slate-200 dark:bg-white/10"
                          )} 
                          style={{height:`${h}%`}} 
                        />
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition-all shadow-2xl scale-50 group-hover:scale-100 whitespace-nowrap z-50">
                          {d.weight_kg} kg
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Session History</span>
                  <span>{weights.length} Entries</span>
                </div>
                <div className="max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {[...weights].reverse().map(log => (
                    <div key={log.id} className="flex items-center justify-between py-3 group">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/10 group-hover:bg-[hsl(var(--brand-1))] transition-colors" />
                        <div>
                          <p className="text-xs font-black">{log.weight_kg} kg</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteWeight(log.id)}
                        className="p-2 rounded-lg text-slate-300 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

      {/* Comprehensive BMI Tracker (History & Analytics) */}
      <BmiCalculator />

      {/* Measurements section */}
        <div className="space-y-6 progress-animate">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Circumference Telemetry</h3>
            <Ruler className="w-5 h-5 text-[hsl(var(--brand-1))]" />
          </div>

          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={()=>setShowM(s=>!s)}
                className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Dimension
              </button>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Unit: Inches</div>
            </div>

            {showM && (
              <form onSubmit={addMeas} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 p-6 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-in slide-in-from-top-4 duration-500">
                {(["chest_in","waist_in","hips_in","arms_in","thighs_in"] as const).map(k => (
                  <div key={k} className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">{k.split('_')[0]}</label>
                    <input 
                      placeholder="0.0" 
                      value={(m as any)[k]} 
                      onChange={e=>setM({...m,[k]:e.target.value})} 
                      type="number" 
                      step="0.1" 
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand-1))]" 
                    />
                  </div>
                ))}
                <button className="col-span-2 md:col-span-5 py-4 rounded-xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-xs uppercase tracking-widest shadow-lg">
                  Archive Measurements
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                    <th className="py-4 px-4">Timestamp</th>
                    <th className="py-4 px-4 text-emerald-500">Chest</th>
                    <th className="py-4 px-4 text-emerald-500">Waist</th>
                    <th className="py-4 px-4 text-emerald-500">Hips</th>
                    <th className="py-4 px-4 text-emerald-500">Arms</th>
                    <th className="py-4 px-4 text-emerald-500">Thighs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {meas.map(r => (
                    <tr key={r.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-xs font-black text-slate-400">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-sm font-black text-slate-900 dark:text-white">{r.chest_in??"—"}</td>
                      <td className="py-4 px-4 text-sm font-black text-slate-900 dark:text-white">{r.waist_in??"—"}</td>
                      <td className="py-4 px-4 text-sm font-black text-slate-900 dark:text-white">{r.hips_in??"—"}</td>
                      <td className="py-4 px-4 text-sm font-black text-slate-900 dark:text-white">{r.arms_in??"—"}</td>
                      <td className="py-4 px-4 text-sm font-black text-slate-900 dark:text-white">{r.thighs_in??"—"}</td>
                    </tr>
                  ))}
                  {meas.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs font-black uppercase tracking-widest text-slate-400 italic">
                        No temporal data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
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
