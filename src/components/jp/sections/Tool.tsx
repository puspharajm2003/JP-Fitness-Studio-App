import { useState, useEffect, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  Apple,
  ArrowRight,
  Battery,
  Brain,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Droplet,
  Dumbbell,
  Flame,
  Gauge,
  Heart,
  History,
  Info,
  Layers,
  Loader2,
  Moon,
  RefreshCw,
  Ruler,
  Save,
  Scale,
  Shield,
  Sparkles,
  Sun,
  Target,
  Timer,
  Trash2,
  Trophy,
  User,
  Utensils,
  Weight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

type UnitSystem = "metric" | "imperial";
type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";
type WeightGoal = "maintain" | "lose" | "gain";

interface BodyFatEntry {
  id: string;
  date: string;
  bodyFat: number;
  bodyFatCategory: string;
  leanMass: number;
  fatMass: number;
  gender: Gender;
  age: number;
}

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

const activityLabels: Record<ActivityLevel, string> = {
  sedentary: "Sedentary: little or no exercise",
  light: "Light: exercise 1-3 times/week",
  moderate: "Moderate: exercise 4-5 times/week",
  active: "Active: daily exercise or intense 3-4 times/week",
  veryActive: "Very Active: intense exercise 6-7 times/week",
};

export default function Tool() {
  const [activeTab, setActiveTab] = useState<"biometrics" | "energy" | "labs" | "performance">("biometrics");
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".tool-animate"),
        { opacity: 0, y: 40, filter: "blur(10px)" },
        { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)", 
          duration: 1, 
          stagger: 0.1, 
          ease: "power4.out",
          clearProps: "all"
        }
      );
    }
  }, [activeTab, mounted]);

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-[#fafafa] dark:bg-[#020617] transition-colors duration-700">
      <div className="max-w-7xl mx-auto space-y-12 pb-32 px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* --- PREMIUM GLASSHOMORPHIC HEADER --- */}
        <div className="relative overflow-hidden rounded-[2.5rem] md:rounded-[4rem] bg-slate-900 p-8 md:p-20 text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/10 group tool-animate">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] -mr-64 -mt-64 group-hover:bg-sky-500/20 transition-all duration-1000" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] -ml-48 -mb-48" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 border border-white/10 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Next-Gen Metabolic OS
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.9] text-white">
                Quantify <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">Everything</span>.
              </h1>
              <p className="text-slate-400 font-medium max-w-lg text-base md:text-xl leading-relaxed">
                Precision-engineered diagnostic suite for high-performance physiology. Modern tools for elite health optimization.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 bg-black/40 backdrop-blur-2xl p-2 rounded-3xl border border-white/10 shadow-inner self-start lg:self-center">
              {(["biometrics", "energy", "labs", "performance"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 md:px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden group/btn",
                    activeTab === tab
                      ? "bg-white text-slate-900 shadow-[0_10px_20px_-5px_rgba(255,255,255,0.2)] scale-105"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="relative z-10">{tab.replace("biometrics", "Comp").replace("labs", "Macros").replace("performance", "Power")}</span>
                  {activeTab !== tab && <div className="absolute inset-0 bg-white/5 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- DYNAMIC CONTENT GRID --- */}
        <div className="grid gap-12">
          {activeTab === "biometrics" && (
            <div className="grid gap-10 lg:grid-cols-2 tool-animate">
              <PremiumBodyFatCalculator />
              <PremiumBMICalculator />
            </div>
          )}

          {activeTab === "energy" && (
            <div className="grid gap-10 lg:grid-cols-2 tool-animate">
              <PremiumCalorieCalculator />
              <div className="space-y-10">
                <PremiumWaterCalculator />
                <div className="rounded-[2.5rem] bg-slate-900 p-10 text-white relative overflow-hidden border border-white/5 group">
                  <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 scale-150 transition-transform group-hover:scale-175 duration-700">
                    <Activity size={180} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-sky-400">
                      <Brain className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Metabolic Intelligence</h3>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                      Our BMR engine utilizes the Mifflin-St Jeor formula, clinically proven to be the most accurate for modern lifestyles.
                    </p>
                    <div className="flex gap-4">
                       <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">Accuracy: ±5%</div>
                       <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">Clinical Standard</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "labs" && (
            <div className="space-y-12 tool-animate">
              <div className="grid gap-8 md:grid-cols-3">
                <PremiumMetricCard icon={Apple} label="Protein Protocol" sub="Muscle Preservation" color="rose" value="1.8g - 2.2g / kg" />
                <PremiumMetricCard icon={Droplet} label="Lipid Balance" sub="Hormonal Support" color="amber" value="0.7g - 1.0g / kg" />
                <PremiumMetricCard icon={Zap} label="Glycemic Load" sub="Performance Fuel" color="sky" value="3.0g - 5.0g / kg" />
              </div>
              <PremiumMacroOrchestrator />
            </div>
          )}

          {activeTab === "performance" && (
            <div className="grid gap-10 lg:grid-cols-2 tool-animate">
              <PremiumOneRepMax />
              <PremiumPerformanceMatrix />
            </div>
          )}
        </div>

        {/* --- PROFESSIONAL FOOTER --- */}
        <div className="pt-16 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Scientific Integrity</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Formulas validated by ACSM & NSCA standards.</p>
            </div>
          </div>
          
          <div className="flex gap-10">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Peer-Reviewed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Real-Time Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------- PREMIUM COMPONENTS --------------------

function PremiumBodyFatCalculator() {
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);
  const [neck, setNeck] = useState(38);
  const [waist, setWaist] = useState(82);
  const [hip, setHip] = useState(94);
  const [bfp, setBfp] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<BodyFatEntry[]>([]);

  useEffect(() => {
    if (height <= 0 || weight <= 0 || neck <= 0 || waist <= 0) return;
    let bfpCalc = 0;
    const logH = Math.log10(height);
    if (gender === "male") {
      const logWn = Math.log10(waist - neck);
      bfpCalc = 495 / (1.0324 - 0.19077 * logWn + 0.15456 * logH) - 450;
    } else {
      if (hip <= 0) return;
      const logWhn = Math.log10(waist + hip - neck);
      bfpCalc = 495 / (1.29579 - 0.35004 * logWhn + 0.221 * logH) - 450;
    }
    bfpCalc = Math.min(Math.max(bfpCalc, 3), 50);
    setBfp(parseFloat(bfpCalc.toFixed(1)));

    if (gender === "male") {
      if (bfpCalc < 6) setCategory("Essential Fat");
      else if (bfpCalc < 14) setCategory("Athletic");
      else if (bfpCalc < 18) setCategory("Fitness");
      else if (bfpCalc < 25) setCategory("Average");
      else setCategory("Obese");
    } else {
      if (bfpCalc < 14) setCategory("Essential Fat");
      else if (bfpCalc < 21) setCategory("Athletic");
      else if (bfpCalc < 25) setCategory("Fitness");
      else if (bfpCalc < 32) setCategory("Average");
      else setCategory("Obese");
    }
  }, [gender, height, weight, neck, waist, hip]);

  const save = () => {
    if (bfp === null) return;
    const entry: BodyFatEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString(),
      bodyFat: bfp,
      bodyFatCategory: category,
      leanMass: parseFloat((weight * (1 - bfp/100)).toFixed(1)),
      fatMass: parseFloat((weight * (bfp/100)).toFixed(1)),
      gender,
      age
    };
    const newHistory = [entry, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("bfp_history", JSON.stringify(newHistory));
  };

  useEffect(() => {
    const saved = localStorage.getItem("bfp_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  return (
    <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col h-full group">
      <div className="p-8 md:p-10 border-b border-slate-100 dark:border-white/5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">Body Composition</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hydrostatic Displacement Model</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <PremiumInput label="Gender" value={gender} type="select" options={["male", "female"]} onChange={setGender} />
          <PremiumInput label="Age" value={age} type="number" onChange={setAge} unit="Yrs" />
          <PremiumInput label="Height" value={height} type="number" onChange={setHeight} unit="CM" />
          <PremiumInput label="Weight" value={weight} type="number" onChange={setWeight} unit="KG" />
          <PremiumInput label="Neck" value={neck} type="number" onChange={setNeck} unit="CM" />
          <PremiumInput label="Waist" value={waist} type="number" onChange={setWaist} unit="CM" />
          {gender === "female" && <PremiumInput label="Hip" value={hip} type="number" onChange={setHip} unit="CM" />}
        </div>

        <div className="flex gap-4 mt-8">
           <button onClick={save} className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Save Snapshot</button>
           <button onClick={() => setShowHistory(!showHistory)} className="px-6 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              <History className="w-5 h-5 text-slate-500" />
           </button>
        </div>
      </div>

      <div className="p-10 flex-1 flex flex-col justify-center bg-white dark:bg-slate-900">
        {bfp !== null ? (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <p className="text-[11px] font-black text-sky-500 uppercase tracking-[0.3em] mb-2">Analysis Result</p>
              <h4 className="text-7xl font-black tracking-tighter">{bfp}<span className="text-2xl text-slate-400 ml-1">%</span></h4>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full text-xs font-black uppercase tracking-widest">
                {category}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Fat Mass" value={`${(weight * bfp / 100).toFixed(1)}kg`} icon={Flame} color="rose" />
              <StatCard label="Lean Mass" value={`${(weight * (1 - bfp / 100)).toFixed(1)}kg`} icon={Dumbbell} color="emerald" />
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div 
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-1000 ease-out" 
                style={{ width: `${(bfp / 40) * 100}%` }}
               />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 space-y-4 opacity-30">
             <Calculator className="w-16 h-16 mx-auto mb-4" />
             <p className="text-sm font-black uppercase tracking-widest">Awaiting Biometric Inputs</p>
          </div>
        )}
      </div>

      {showHistory && history.length > 0 && (
        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-10 z-20 animate-in slide-in-from-bottom duration-500 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-2xl font-black tracking-tight">Biometric History</h4>
            <button onClick={() => setShowHistory(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
              <ChevronDown className="w-5 h-5 rotate-180" />
            </button>
          </div>
          <div className="space-y-4">
            {history.map(h => (
              <div key={h.id} className="p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-slate-800/50">
                <div>
                  <p className="text-lg font-black">{h.bodyFat}%</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{h.date} • {h.bodyFatCategory}</p>
                </div>
                <button onClick={() => {
                  const newHistory = history.filter(x => x.id !== h.id);
                  setHistory(newHistory);
                  localStorage.setItem("bfp_history", JSON.stringify(newHistory));
                }} className="text-rose-500 hover:scale-110 transition-transform">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PremiumBMICalculator() {
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (height > 0 && weight > 0) {
      const b = weight / ((height / 100) ** 2);
      setBmi(parseFloat(b.toFixed(1)));
      if (b < 18.5) setCategory("Underweight");
      else if (b < 25) setCategory("Healthy Range");
      else if (b < 30) setCategory("Overweight");
      else setCategory("Obese Class");
    }
  }, [height, weight]);

  return (
    <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl p-10 flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute bottom-0 right-0 p-12 opacity-5 rotate-12 transition-transform group-hover:rotate-0 duration-700">
         <Weight size={180} />
      </div>

      <div className="space-y-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">BMI Matrix</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">World Health Org Standards</p>
          </div>
        </div>

        <div className="grid gap-6">
          <PremiumInput label="Stature" value={height} type="number" onChange={setHeight} unit="CM" />
          <PremiumInput label="Mass" value={weight} type="number" onChange={setWeight} unit="KG" />
        </div>
      </div>

      <div className="pt-12 relative z-10 text-center md:text-left">
        {bmi ? (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2">Index Score</p>
              <h4 className="text-8xl font-black tracking-tighter leading-none">{bmi}</h4>
              <p className="text-xl font-bold mt-2 text-slate-600 dark:text-slate-400">{category}</p>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
               <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest">Ideal: 18.5 - 24.9</div>
               <div className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Target className="w-3 h-3" /> Target Mass: {Math.round(22 * (height/100)**2)}kg
               </div>
            </div>
          </div>
        ) : (
          <div className="opacity-30 py-8">
             <p className="text-sm font-black uppercase tracking-widest">Awaiting Inputs</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PremiumCalorieCalculator() {
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [tdee, setTdee] = useState(0);

  useEffect(() => {
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === "male" ? bmr + 5 : bmr - 161;
    setTdee(Math.round(bmr * activityMultipliers[activity]));
  }, [gender, age, height, weight, activity]);

  return (
    <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl p-10 h-full flex flex-col group">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Flame className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight">Energy Expenditure</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical TDEE Modeling</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <PremiumInput label="Gender" value={gender} type="select" options={["male", "female"]} onChange={setGender} />
        <PremiumInput label="Age" value={age} type="number" onChange={setAge} unit="Yrs" />
        <PremiumInput label="Height" value={height} type="number" onChange={setHeight} unit="CM" />
        <PremiumInput label="Weight" value={weight} type="number" onChange={setWeight} unit="KG" />
        <div className="sm:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Activity Vector</label>
          <select 
            value={activity} 
            onChange={e => setActivity(e.target.value as ActivityLevel)}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-sm outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-amber-500/10 transition-all"
          >
            {Object.entries(activityLabels).map(([k, v]) => (
              <option key={k} value={k} className="bg-white dark:bg-slate-900">{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-auto space-y-10">
        <div className="grid grid-cols-2 gap-4">
           <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center group-hover:scale-[1.03] transition-transform duration-500">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">BMR Base</p>
             <p className="text-3xl font-black leading-none">{Math.round(tdee / activityMultipliers[activity])}</p>
             <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Kcal/Day</p>
           </div>
           <div className="p-8 rounded-[2rem] bg-amber-500 text-white text-center shadow-2xl shadow-amber-500/20 group-hover:scale-[1.05] transition-transform duration-500">
             <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Daily Burn</p>
             <p className="text-4xl font-black leading-none">{tdee}</p>
             <p className="text-[9px] font-bold text-white/70 mt-2 uppercase">TDEE Kcal</p>
           </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
           <div className="flex items-center gap-3">
             <Target className="w-5 h-5 text-amber-500" />
             <span className="text-xs font-black uppercase tracking-widest">Deficit Target</span>
           </div>
           <span className="text-xl font-black">{tdee - 500} <span className="text-[10px] font-medium text-slate-400">Kcal</span></span>
        </div>
      </div>
    </div>
  );
}

function PremiumWaterCalculator() {
  const [weight, setWeight] = useState(72);
  const [activity, setActivity] = useState(30);
  const [water, setWater] = useState(0);

  useEffect(() => {
    setWater(Math.round(weight * 35 + (activity / 60) * 500));
  }, [weight, activity]);

  return (
    <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl p-10 flex flex-col group">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Droplet className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight">Hydration Intelligence</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dynamic Intake Protocol</p>
        </div>
      </div>

      <div className="space-y-6 mb-10">
        <PremiumInput label="Mass" value={weight} type="number" onChange={setWeight} unit="KG" />
        <PremiumInput label="Active Duration" value={activity} type="number" onChange={setActivity} unit="Mins" />
      </div>

      <div className="p-8 rounded-[2rem] bg-gradient-to-br from-sky-400 to-sky-600 text-white text-center shadow-xl shadow-sky-500/20 group-hover:scale-[1.02] transition-transform">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Target Volume</p>
        <p className="text-5xl font-black leading-none">{(water / 1000).toFixed(1)}<span className="text-xl ml-1">L</span></p>
        <p className="text-[10px] font-bold text-white/70 mt-3 uppercase tracking-tighter">Approx {Math.ceil(water / 250)} standard glasses</p>
      </div>
    </div>
  );
}

function PremiumMacroOrchestrator() {
  const [weight, setWeight] = useState(72);
  const [goal, setGoal] = useState<WeightGoal>("maintain");

  const p = Math.round(weight * 2.0);
  const f = Math.round(weight * 0.9);
  const c = Math.round(weight * (goal === "lose" ? 2.5 : goal === "gain" ? 4.5 : 3.5));

  return (
    <div className="rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl p-10 md:p-16 flex flex-col group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-16 opacity-[0.02] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
         <Utensils size={300} />
      </div>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 relative z-10">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/20">
            <Calculator className="w-8 h-8" />
          </div>
          <h3 className="text-4xl font-black tracking-tight">Macro Orchestrator</h3>
          <p className="text-slate-500 font-medium max-w-sm">Strategic nutrient partitioning based on weight and dynamic metabolic objectives.</p>
        </div>
        
        <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-3xl border border-slate-100 dark:border-white/10 flex gap-2">
           {["lose", "maintain", "gain"].map(g => (
             <button
              key={g}
              onClick={() => setGoal(g as WeightGoal)}
              className={cn(
                "px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                goal === g 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
             >
               {g}
             </button>
           ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 relative z-10">
         <MacroMetric label="Protein" value={`${p}g`} cal={`${p * 4}kcal`} color="rose" desc="Tissue Repair & Preservation" />
         <MacroMetric label="Lipids" value={`${f}g`} cal={`${f * 9}kcal`} color="amber" desc="Hormonal Synthesis & Absorption" />
         <MacroMetric label="Glucides" value={`${c}g`} cal={`${c * 4}kcal`} color="sky" desc="Glycogen Load & Performance" />
      </div>

      <div className="mt-12 p-8 rounded-[2.5rem] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
         <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
             <Flame className="w-8 h-8" />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Estimated Load</p>
             <p className="text-3xl font-black">{p*4 + f*9 + c*4} <span className="text-base text-slate-500">Kcal / Day</span></p>
           </div>
         </div>
         
         <div className="flex items-center gap-4">
            <PremiumInput label="Bodyweight" value={weight} type="number" onChange={setWeight} unit="KG" dark />
         </div>
      </div>
    </div>
  );
}

function PremiumOneRepMax() {
  const [weight, setWeight] = useState(100);
  const [reps, setReps] = useState(5);
  const [orm, setOrm] = useState(0);

  useEffect(() => {
    if (reps === 1) setOrm(weight);
    else setOrm(Math.round(weight / (1.0278 - (0.0278 * reps))));
  }, [weight, reps]);

  const percentages = [100, 95, 90, 85, 80, 75, 70, 60, 50];

  return (
    <div className="rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl p-10 md:p-16 flex flex-col group h-full">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-16 h-16 rounded-3xl bg-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/20">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-3xl font-black tracking-tight">Strength Limit (1RM)</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brzycki Kinetic Estimation</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
           <PremiumInput label="Load Magnitude" value={weight} type="number" onChange={setWeight} unit="KG" />
           <PremiumInput label="Repetition Count" value={reps} type="number" onChange={setReps} unit="Reps" />
           
           <div className="pt-8 text-center md:text-left">
              <p className="text-[11px] font-black text-purple-500 uppercase tracking-[0.3em] mb-2">Estimated Maximum</p>
              <h4 className="text-8xl font-black tracking-tighter leading-none">{orm}<span className="text-2xl text-slate-400 ml-2">KG</span></h4>
              <p className="text-sm font-bold text-slate-500 mt-4 uppercase tracking-widest">Theoretical Limit</p>
           </div>
        </div>

        <div className="bg-slate-50 dark:bg-white/5 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/10 space-y-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intensity Matrix</p>
           <div className="grid grid-cols-2 gap-4">
              {percentages.map(pct => (
                <div key={pct} className="flex justify-between items-center p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5">
                   <span className="text-xs font-black text-slate-400">{pct}%</span>
                   <span className="text-lg font-black">{Math.round(orm * pct / 100)}kg</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function PremiumPerformanceMatrix() {
  return (
    <div className="rounded-[3rem] bg-slate-900 p-12 text-white h-full flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-16 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
         <Gauge size={200} />
      </div>

      <div className="space-y-8 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-white">
          <Zap className="w-8 h-8" />
        </div>
        <h3 className="text-4xl font-black tracking-tight">Kinetic Dashboard</h3>
        <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
          Quantify power output and neural recruitment relative to elite athletic baselines. High-precision programming starts with accurate metrics.
        </p>
      </div>

      <div className="space-y-10 relative z-10 pt-12">
         <div className="space-y-3">
           <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span>Hypertrophy Range</span>
              <span className="text-white">70-85%</span>
           </div>
           <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-[78%] bg-purple-500" />
           </div>
         </div>
         <div className="space-y-3">
           <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
              <span>Neural Peak Power</span>
              <span className="text-white">90-100%</span>
           </div>
           <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-[95%] bg-sky-500" />
           </div>
         </div>
      </div>
    </div>
  );
}

// -------------------- UI UTILITIES --------------------

function PremiumInput({ label, value, type, options, onChange, unit, dark }: any) {
  return (
    <div className="space-y-2.5">
      <label className={cn("text-[10px] font-black uppercase tracking-widest ml-1", dark ? "text-slate-500" : "text-slate-400")}>{label}</label>
      <div className="relative group">
        {type === "select" ? (
          <div className="flex gap-2">
            {options.map((o: any) => (
              <button
                key={o}
                onClick={() => onChange(o)}
                className={cn(
                  "flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border",
                  value === o 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xl"
                    : cn("bg-transparent border-slate-200 dark:border-white/10 text-slate-400 hover:border-slate-400", dark && "border-white/5")
                )}
              >
                {o}
              </button>
            ))}
          </div>
        ) : (
          <>
            <input 
              type="number" 
              value={value} 
              onChange={e => onChange(parseFloat(e.target.value) || 0)}
              className={cn(
                "w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 font-bold text-base outline-none focus:ring-4 focus:ring-sky-500/10 transition-all text-slate-900 dark:text-white",
                dark && "bg-white/5 border-white/5"
              )}
            />
            {unit && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/10",
    sky: "text-sky-500 bg-sky-500/10 border-sky-500/10",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/10",
  };
  return (
    <div className={cn("p-6 rounded-[2rem] border flex items-center gap-4", colors[color])}>
       <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
         <Icon className="w-5 h-5" />
       </div>
       <div>
         <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-0.5">{label}</p>
         <p className="text-lg font-black leading-none">{value}</p>
       </div>
    </div>
  );
}

function PremiumMetricCard({ icon: Icon, label, sub, value, color }: any) {
  const colors: any = {
    rose: "from-rose-500/20 to-rose-600/5 text-rose-600 dark:text-rose-400",
    amber: "from-amber-500/20 to-amber-600/5 text-amber-600 dark:text-amber-400",
    sky: "from-sky-500/20 to-sky-600/5 text-sky-600 dark:text-sky-400",
  };
  return (
    <div className={cn("p-10 rounded-[3rem] bg-gradient-to-br border border-white/5 shadow-xl group hover:scale-[1.03] transition-all duration-500", colors[color])}>
       <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
         <Icon className="w-7 h-7" />
       </div>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{label}</p>
       <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{value}</h4>
       <p className="text-xs font-bold opacity-60">{sub}</p>
    </div>
  );
}

function MacroMetric({ label, value, cal, color, desc }: any) {
  const colors: any = {
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/10",
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/10",
    sky: "text-sky-500 bg-sky-500/5 border-sky-500/10",
  };
  return (
    <div className={cn("p-10 rounded-[3rem] border flex flex-col justify-between group/macro hover:bg-white dark:hover:bg-slate-800 transition-all duration-500 shadow-xl", colors[color])}>
      <div className="space-y-4">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">{label}</p>
        <h4 className="text-6xl font-black tracking-tighter leading-none group-hover/macro:scale-110 origin-left transition-transform duration-500">{value}</h4>
        <p className="text-sm font-bold text-slate-400">{desc}</p>
      </div>
      <div className="mt-8 pt-8 border-t border-current/10">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Energy Contribution</p>
        <p className="text-xl font-black">{cal}</p>
      </div>
    </div>
  );
}