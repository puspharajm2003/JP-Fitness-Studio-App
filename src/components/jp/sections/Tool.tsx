import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Apple,
  BarChart3,
  Battery,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
  Coffee,
  Droplet,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  History,
  Info,
  Moon,
  RefreshCw,
  Ruler,
  Save,
  Scale,
  Shield,
  Sun,
  Target,
  Timer,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Utensils,
  Weight,
  Wine,
  Zap,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProteinCalculator } from "@/components/ProteinCalculator";
import { FatIntakeCalculator } from "@/components/FatIntakeCalculator";
import { CarbohydrateCalculator } from "@/components/CarbohydrateCalculator";
import { TdeeCalculator } from "@/components/TdeeCalculator";
import { MacroCalculator } from "@/components/MacroCalculator";
import gsap from "gsap";
import { useRef } from "react";

type UnitSystem = "metric" | "imperial";
type Gender = "male" | "female";
type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";
type BMRFormula = "mifflin" | "harris" | "katch";
type WeightGoal = "maintain" | "lose" | "gain";
type Tab = "calculator" | "converter" | "mealPlans" | "exercise";

interface BMRResult {
  bmr: number;
  tdee: number;
  maintenance: number;
  weightLoss: {
    mild: number;
    moderate: number;
    aggressive: number;
  };
  weightGain: {
    mild: number;
    moderate: number;
    aggressive: number;
  };
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Activity multipliers
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
  active: "Active: daily exercise or intense exercise 3-4 times/week",
  veryActive: "Very Active: intense exercise 6-7 times/week",
};

export default function Tool() {
  const [activeTab, setActiveTab] = useState<"biometrics" | "energy" | "labs">("biometrics");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".tool-animate"),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power4.out" }
      );
    }
  }, [activeTab]);

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-12 pb-32 px-4 sm:px-6 lg:px-8 bg-slate-50/30 dark:bg-transparent min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-10 md:p-16 text-white shadow-2xl border border-white/10 group tool-animate">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-sky-500/20 transition-all duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-sky-400 border border-sky-500/20">
              <Sparkles className="w-3 h-3" />
              Advanced Diagnostic Suite
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
              Fitness <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">Tools</span>.
            </h1>
            <p className="text-slate-700 dark:text-slate-300 font-medium max-w-xl text-sm md:text-base leading-relaxed">
              Precision-engineered calculators to quantify your physiological metrics and optimize your transformation strategy.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner self-start md:self-center">
            {(["biometrics", "energy", "labs"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-xl scale-105"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-12">
        {activeTab === "biometrics" && (
          <div className="grid gap-12 lg:grid-cols-2 tool-animate">
            <div className="group">
              <BodyFatCalculator />
            </div>
            <div className="group">
              <BMICalculator />
            </div>
          </div>
        )}

        {activeTab === "energy" && (
          <div className="grid lg:grid-cols-2 gap-12 tool-animate">
            <CalorieCalculator />
            <TdeeCalculator />
          </div>
        )}

        {activeTab === "labs" && (
          <div className="space-y-12 tool-animate">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <ProteinCalculator />
              <FatIntakeCalculator />
              <CarbohydrateCalculator />
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
              <MacroCalculator />
              <div className="glass-card rounded-[2.5rem] p-6 md:p-10 border border-white/10 bg-gradient-to-br from-sky-500/5 to-transparent flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                    <Info className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black">About Lab Calculations</h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed">
                      Our algorithms are based on the latest peer-reviewed nutrition science, adjusting for thermal effect of food (TEF) and individual activity coefficients.
                    </p>
                  </div>
                </div>
                <div className="pt-8">
                  <button className="text-sky-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    Read Science Docs <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trust & Methodology Footer */}
      <div className="pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data Integrity</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Calculations validated by CSCS professionals.</p>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scientific Basis</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Real-time Updates</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BodyFatEntry {
  id: string;
  date: string;
  bodyFat: number;
  bodyFatCategory: string;
  bfpNavy: number;
  bfpBMI: number;
  leanMass: number;
  fatMass: number;
  gender: Gender;
  age: number;
}

function BodyFatCalculator() {
  // Unit system
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  // Basic info
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState<number>(25);

  // Metric inputs
  const [heightCm, setHeightCm] = useState<number>(178);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [neckCm, setNeckCm] = useState<number>(50);
  const [waistCm, setWaistCm] = useState<number>(96);
  const [hipCm, setHipCm] = useState<number>(100);

  // Imperial inputs (converted to/from metric)
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(10);
  const [weightLbs, setWeightLbs] = useState<number>(154);
  const [neckInches, setNeckInches] = useState<number>(19.7);
  const [waistInches, setWaistInches] = useState<number>(37.8);
  const [hipInches, setHipInches] = useState<number>(39.4);

  // Results
  const [bfpNavy, setBfpNavy] = useState<number | null>(null);
  const [bfpBMI, setBfpBMI] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [fatMass, setFatMass] = useState<number>(0);
  const [leanMass, setLeanMass] = useState<number>(0);
  const [idealBodyFat, setIdealBodyFat] = useState<number>(0);
  const [fatToLose, setFatToLose] = useState<number>(0);

  // History
  const [savedEntries, setSavedEntries] = useState<BodyFatEntry[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    methodology: false,
    categories: false,
    risks: false,
  });

  // Helper: convert imperial to metric values
  const getMetricValues = () => {
    if (unitSystem === "metric") {
      return {
        heightCm: heightCm,
        weightKg: weightKg,
        neckCm: neckCm,
        waistCm: waistCm,
        hipCm: hipCm,
      };
    } else {
      const totalInches = heightFeet * 12 + heightInches;
      return {
        heightCm: totalInches * 2.54,
        weightKg: weightLbs * 0.453592,
        neckCm: neckInches * 2.54,
        waistCm: waistInches * 2.54,
        hipCm: hipInches * 2.54,
      };
    }
  };

  // Save to localStorage on mount / changes
  useEffect(() => {
    const stored = localStorage.getItem("bodyfat_history");
    if (stored) {
      try {
        setSavedEntries(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bodyfat_history", JSON.stringify(savedEntries));
  }, [savedEntries]);

  // Main calculation effect
  useEffect(() => {
    const { heightCm, weightKg, neckCm, waistCm, hipCm } = getMetricValues();
    if (heightCm <= 0 || weightKg <= 0 || neckCm <= 0 || waistCm <= 0) return;

    // 1. U.S. Navy method
    let bfp = 0;
    const logH = Math.log10(heightCm);
    if (gender === "male") {
      const logWn = Math.log10(waistCm - neckCm);
      bfp = 495 / (1.0324 - 0.19077 * logWn + 0.15456 * logH) - 450;
    } else {
      if (hipCm <= 0) return;
      const logWhn = Math.log10(waistCm + hipCm - neckCm);
      bfp = 495 / (1.29579 - 0.35004 * logWhn + 0.221 * logH) - 450;
    }
    bfp = Math.min(Math.max(bfp, 3), 60); // clamp
    const bfpNavyVal = parseFloat(bfp.toFixed(1));
    setBfpNavy(bfpNavyVal);

    // 2. BMI method
    const bmi = weightKg / ((heightCm / 100) ** 2);
    let bmiBfp = 0;
    if (gender === "male") {
      bmiBfp = 1.20 * bmi + 0.23 * age - 16.2;
    } else {
      bmiBfp = 1.20 * bmi + 0.23 * age - 5.4;
    }
    bmiBfp = Math.min(Math.max(bmiBfp, 3), 55);
    setBfpBMI(parseFloat(bmiBfp.toFixed(1)));

    // 3. Fat mass & Lean mass
    const fatMassKg = (bfpNavyVal / 100) * weightKg;
    const leanMassKg = weightKg - fatMassKg;
    setFatMass(parseFloat(fatMassKg.toFixed(1)));
    setLeanMass(parseFloat(leanMassKg.toFixed(1)));

    // 4. Ideal body fat for age (Jackson & Pollock)
    let ideal = 0;
    if (gender === "male") {
      if (age <= 20) ideal = 8.5;
      else if (age <= 25) ideal = 10.5;
      else if (age <= 30) ideal = 12.7;
      else if (age <= 35) ideal = 13.7;
      else if (age <= 40) ideal = 15.3;
      else if (age <= 45) ideal = 16.4;
      else if (age <= 50) ideal = 18.9;
      else if (age <= 55) ideal = 20.9;
      else ideal = 22.5;
    } else {
      if (age <= 20) ideal = 17.7;
      else if (age <= 25) ideal = 18.4;
      else if (age <= 30) ideal = 19.3;
      else if (age <= 35) ideal = 21.5;
      else if (age <= 40) ideal = 22.2;
      else if (age <= 45) ideal = 22.9;
      else if (age <= 50) ideal = 25.2;
      else if (age <= 55) ideal = 26.3;
      else ideal = 28.0;
    }
    setIdealBodyFat(ideal);
    const loseKg = Math.max(0, fatMassKg - (ideal / 100) * weightKg);
    setFatToLose(parseFloat(loseKg.toFixed(1)));

    // 5. Category based on ACE
    let cat = "";
    if (gender === "male") {
      if (bfpNavyVal <= 5) cat = "Essential Fat";
      else if (bfpNavyVal <= 13) cat = "Athletes";
      else if (bfpNavyVal <= 17) cat = "Fitness";
      else if (bfpNavyVal <= 24) cat = "Average";
      else cat = "Obese";
    } else {
      if (bfpNavyVal <= 13) cat = "Essential Fat";
      else if (bfpNavyVal <= 20) cat = "Athletes";
      else if (bfpNavyVal <= 24) cat = "Fitness";
      else if (bfpNavyVal <= 31) cat = "Average";
      else cat = "Obese";
    }
    setCategory(cat);
  }, [gender, age, unitSystem, heightCm, weightKg, neckCm, waistCm, hipCm, heightFeet, heightInches, weightLbs, neckInches, waistInches, hipInches]);

  const saveCurrentResult = () => {
    if (bfpNavy === null) return;
    const { heightCm, weightKg } = getMetricValues();
    const newEntry: BodyFatEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      bodyFat: bfpNavy,
      bodyFatCategory: category,
      bfpNavy: bfpNavy,
      bfpBMI: bfpBMI || 0,
      leanMass: leanMass,
      fatMass: fatMass,
      gender: gender,
      age: age,
    };
    setSavedEntries((prev) => [newEntry, ...prev].slice(0, 10));
  };

  const deleteEntry = (id: string) => {
    setSavedEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const clearHistory = () => {
    setSavedEntries([]);
  };

  const resetForm = () => {
    setAge(25);
    setGender("male");
    if (unitSystem === "metric") {
      setHeightCm(178);
      setWeightKg(70);
      setNeckCm(50);
      setWaistCm(96);
      setHipCm(100);
    } else {
      setHeightFeet(5);
      setHeightInches(10);
      setWeightLbs(154);
      setNeckInches(19.7);
      setWaistInches(37.8);
      setHipInches(39.4);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Gauge component
  const BodyFatGauge = ({ value }: { value: number }) => {
    const rotation = -90 + (value / 45) * 180;
    return (
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="url(#fatGradientPremium)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(value / 45) * 251} 251`}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="fatGradientPremium" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--brand-1))" />
              <stop offset="100%" stopColor="hsl(var(--brand-2))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black tracking-tighter">{value}%</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Bio-Fat</span>
        </div>
      </div>
    );
  };

  const ResultStatMini = ({ label, value, icon: Icon, color }: any) => {
    const colors: any = {
      sky: "text-[hsl(var(--brand-1))] bg-[hsl(var(--brand-1))]/10 border-[hsl(var(--brand-1))]/20",
      emerald: "text-[hsl(var(--brand-2))] bg-[hsl(var(--brand-2))]/10 border-[hsl(var(--brand-2))]/20",
      rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    };
    return (
      <div className="p-4 rounded-2xl bg-white/5 border backdrop-blur-sm space-y-3 hover:scale-105 transition-transform duration-300">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-current/10", colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mb-0.5">{label}</p>
          <p className="text-sm font-black text-white">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-xl relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-1))]/5 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="p-8 md:p-10 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--brand-1))]/10 text-[hsl(var(--brand-1))] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Scale className="w-6 h-6" />
          </div>
          <div className="px-4 py-2 rounded-xl bg-[hsl(var(--brand-1))]/10 text-[hsl(var(--brand-1))] text-[9px] font-black uppercase tracking-widest border border-[hsl(var(--brand-1))]/20">
            Metric Only
          </div>
        </div>
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">Body Composition</h2>
        <p className="text-slate-700 dark:text-slate-300 mt-2 text-sm font-medium leading-relaxed">
          Advanced anthropometric analysis using the U.S. Navy clinical standard.
        </p>
      </div>

      {/* Main Card */}
        <div className="p-8 md:p-10 space-y-10 relative z-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Gender and Age */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-[0.2em] ml-1">
                Identity Profile
              </label>
              <div className="flex gap-3">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 border",
                      gender === g
                        ? "bg-[hsl(var(--brand-1))] text-white border-[hsl(var(--brand-1))] shadow-xl shadow-[hsl(var(--brand-1))]/20"
                        : "bg-transparent border-white/20 text-white/70 hover:border-[hsl(var(--brand-1))]/50 hover:text-[hsl(var(--brand-1))]"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="relative group/input">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Math.min(100, Math.max(15, parseInt(e.target.value) || 15)))}
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 transition-all focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-600 dark:text-white/70">Years Old</span>
              </div>
            </div>

            {/* Anthropometric Metrics */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-[0.2em] ml-1">
                Biometric Inputs
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                    placeholder="Height"
                    className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 transition-all focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 dark:text-white/70">CM</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    placeholder="Weight"
                    className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 transition-all focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 dark:text-white/70">KG</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="number"
                    value={neckCm}
                    onChange={(e) => setNeckCm(parseFloat(e.target.value) || 0)}
                    placeholder="Neck"
                    className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 transition-all focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 dark:text-white/70">CM</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={waistCm}
                    onChange={(e) => setWaistCm(parseFloat(e.target.value) || 0)}
                    placeholder="Waist"
                    className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 transition-all focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 dark:text-white/70">CM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col gap-4 pt-6 border-t border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <button onClick={resetForm} className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all flex items-center gap-2">
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
              <button onClick={() => setShowHistory(!showHistory)} className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all flex items-center gap-2">
                <History className="w-3 h-3" /> History
              </button>
            </div>
            {bfpNavy !== null && (
              <button onClick={saveCurrentResult} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-[hsl(var(--brand-1))]/20 hover:scale-105 active:scale-95 transition-all relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  <Save className="w-3 h-3" /> Save Analysis
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            )}
          </div>

          {/* Results Display */}
          {bfpNavy !== null && (
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-700 relative overflow-hidden group/results">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--brand-1))]/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10 grid gap-8 md:grid-cols-2 items-center">
                <div className="flex flex-col items-center space-y-4">
                  <BodyFatGauge value={bfpNavy} />
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400 mb-1">Status</p>
                    <p className="text-xl font-black">{category}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <ResultStatMini label="Fat Mass" value={`${fatMass}kg`} icon={Flame} color="rose" />
                    <ResultStatMini label="Lean Mass" value={`${leanMass}kg`} icon={Dumbbell} color="emerald" />
                    <ResultStatMini label="Ideal %" value={`${idealBodyFat}%`} icon={Target} color="sky" />
                    <ResultStatMini label="Excess Fat" value={`${fatToLose}kg`} icon={AlertTriangle} color="amber" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">BMI Metric</span>
                    </div>
                    <span className="text-sm font-black text-sky-400">{bfpBMI}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History panel */}
          {showHistory && (
            <div className="mt-6 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 animate-in slide-in-from-top duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-white">
                  <History className="w-4 h-4 text-[hsl(var(--brand-1))]" /> Recent Analysis
                </h3>
                {savedEntries.length > 0 && (
                  <button onClick={clearHistory} className="text-[10px] font-black uppercase text-rose-400 flex items-center gap-1 hover:text-rose-300 transition-colors">
                    <Trash2 className="w-3 h-3" /> Clear History
                  </button>
                )}
              </div>
              {savedEntries.length === 0 ? (
                <p className="text-xs text-white/70 text-center py-6 font-medium">No saved results found.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {savedEntries.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 group">
                      <div>
                        <p className="text-sm font-black text-[hsl(var(--brand-1))]">{entry.bodyFat}% – {entry.bodyFatCategory}</p>
                        <p className="text-[10px] text-white/70 font-bold">{entry.date} • {entry.age}y {entry.gender}</p>
                      </div>
                      <button onClick={() => deleteEntry(entry.id)} className="text-white/50 hover:text-rose-400 transition-colors group-hover:scale-110">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expandable info */}
          <div className="mt-6 space-y-2">
            <button onClick={() => toggleSection("categories")} className="flex justify-between items-center w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all text-white">
              <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-[hsl(var(--brand-1))]" /> Body Fat Categories (ACE)</span>
              {expandedSections.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.categories && (
              <div className="overflow-x-auto p-4 border border-white/20 rounded-xl bg-white/5 backdrop-blur-sm animate-in fade-in duration-300">
                <table className="w-full text-[11px] font-bold text-white">
                  <thead><tr className="text-white/70 uppercase border-b border-white/20"><th className="pb-2 text-left">Description</th><th className="pb-2 text-right">Women</th><th className="pb-2 text-right">Men</th></tr></thead>
                  <tbody className="divide-y divide-white/20">
                    <tr className="text-white"><td className="py-2">Essential fat</td><td className="text-right">10–13%</td><td className="text-right">2–5%</td></tr>
                    <tr className="text-[hsl(var(--brand-1))]"><td className="py-2">Athletes</td><td className="text-right">14–20%</td><td className="text-right">6–13%</td></tr>
                    <tr className="text-[hsl(var(--brand-2))]"><td className="py-2">Fitness</td><td className="text-right">21–24%</td><td className="text-right">14–17%</td></tr>
                    <tr className="text-amber-400"><td className="py-2">Average</td><td className="text-right">25–31%</td><td className="text-right">18–24%</td></tr>
                    <tr className="text-rose-400"><td className="py-2">Obese</td><td className="text-right">32%+</td><td className="text-right">25%+</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={() => toggleSection("methodology")} className="flex justify-between items-center w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all text-white">
              <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Calculator className="w-4 h-4 text-[hsl(var(--brand-1))]" /> Scientific Methodology</span>
              {expandedSections.methodology ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.methodology && (
              <div className="text-[11px] text-white/80 p-4 border-l-4 border-[hsl(var(--brand-1))] bg-[hsl(var(--brand-1))]/5 rounded-r-xl animate-in fade-in duration-300 leading-relaxed font-medium">
                <p><strong>U.S. Navy Method:</strong> Estimates body density based on waist, neck, and (for women) hip circumference along with height. Calculated via log-based regression equations used by clinical and military institutions.</p>
                <p className="mt-2"><strong>BMI Method:</strong> A statistical estimate based on height-to-weight ratio and age. Less accurate for athletes with high muscle mass but provides a useful baseline comparison.</p>
              </div>
            )}

            <button onClick={() => toggleSection("risks")} className="flex justify-between items-center w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all text-white">
              <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Health Risk Indicators</span>
              {expandedSections.risks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.risks && (
              <div className="text-[11px] text-white/80 p-4 border-l-4 border-rose-400 bg-rose-500/5 rounded-r-xl animate-in fade-in duration-300 leading-relaxed font-medium">
                <p>Elevated body fat levels, particularly visceral fat, are significantly linked to chronic conditions including metabolic syndrome, cardiovascular disease, hypertension, and insulin resistance. Monitoring body composition is a critical step in long-term health optimization.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="text-center py-6 border-t border-white/10 flex flex-col items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 text-slate-400">
             <Shield className="w-4 h-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Disclaimer</p>
          </div>
          <p className="text-xs text-muted-foreground max-w-lg leading-relaxed font-medium px-8">
            Calculations are statistical estimations and should not be used as a substitute for medical grade body scans (DXA, BodPod) or professional healthcare consultation.
          </p>
        </div>
      </div>
    );
}

function BMICalculator() {
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<Gender>("male");
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<string>("");
  const [idealWeightRange, setIdealWeightRange] = useState<{min: number, max: number} | null>(null);
  const [healthRisks, setHealthRisks] = useState<string[]>([]);
  const [savedEntries, setSavedEntries] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // BMI Categories with health risks
  const bmiCategories = {
    underweight: { range: [0, 18.5], risks: ["Nutrient deficiencies", "Weakened immune system", "Osteoporosis risk"] },
    normal: { range: [18.5, 24.9], risks: ["Low health risks", "Optimal metabolic function"] },
    overweight: { range: [25, 29.9], risks: ["Increased cardiovascular risk", "Type 2 diabetes risk", "Joint stress"] },
    obese: { range: [30, 34.9], risks: ["High cardiovascular risk", "Type 2 diabetes", "Sleep apnea", "Joint problems"] },
    severelyObese: { range: [35, 39.9], risks: ["Very high health risks", "Severe cardiovascular disease", "Type 2 diabetes", "Cancer risk"] },
    morbidlyObese: { range: [40, Infinity], risks: ["Extremely high mortality risk", "Severe comorbidities", "Requires medical intervention"] }
  };

  // Calculate BMI and related metrics
  useEffect(() => {
    if (heightCm <= 0 || weightKg <= 0) {
      setBmi(null);
      setCategory("");
      setIdealWeightRange(null);
      setHealthRisks([]);
      return;
    }

    const calculatedBMI = weightKg / ((heightCm / 100) ** 2);
    const bmiValue = parseFloat(calculatedBMI.toFixed(1));
    setBmi(bmiValue);

    // Determine category
    let cat = "";
    let risks: string[] = [];
    
    if (bmiValue < 18.5) {
      cat = "Underweight";
      risks = bmiCategories.underweight.risks;
    } else if (bmiValue < 25) {
      cat = "Normal Weight";
      risks = bmiCategories.normal.risks;
    } else if (bmiValue < 30) {
      cat = "Overweight";
      risks = bmiCategories.overweight.risks;
    } else if (bmiValue < 35) {
      cat = "Obese Class I";
      risks = bmiCategories.obese.risks;
    } else if (bmiValue < 40) {
      cat = "Obese Class II";
      risks = bmiCategories.severelyObese.risks;
    } else {
      cat = "Obese Class III";
      risks = bmiCategories.morbidlyObese.risks;
    }
    
    setCategory(cat);
    setHealthRisks(risks);

    // Calculate ideal weight range (BMI 18.5-24.9)
    const heightM = heightCm / 100;
    const minWeight = 18.5 * (heightM ** 2);
    const maxWeight = 24.9 * (heightM ** 2);
    setIdealWeightRange({
      min: parseFloat(minWeight.toFixed(1)),
      max: parseFloat(maxWeight.toFixed(1))
    });
  }, [heightCm, weightKg]);

  // Save current result
  const saveCurrentResult = () => {
    if (bmi === null) return;
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      bmi: bmi,
      category: category,
      heightCm: heightCm,
      weightKg: weightKg,
      age: age,
      gender: gender,
      idealWeightRange: idealWeightRange
    };
    setSavedEntries((prev) => [newEntry, ...prev].slice(0, 10));
  };

  // Delete entry
  const deleteEntry = (id: string) => {
    setSavedEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Clear history
  const clearHistory = () => {
    setSavedEntries([]);
  };

  // Reset form
  const resetForm = () => {
    setHeightCm(175);
    setWeightKg(70);
    setAge(25);
    setGender("male");
  };

  // BMI Gauge component
  const BMIGauge = ({ value }: { value: number }) => {
    const getBMIPosition = (bmi: number) => {
      if (bmi < 18.5) return 0;
      if (bmi < 25) return ((bmi - 18.5) / (25 - 18.5)) * 25;
      if (bmi < 30) return 25 + ((bmi - 25) / (30 - 25)) * 25;
      if (bmi < 35) return 50 + ((bmi - 30) / (35 - 30)) * 16.67;
      if (bmi < 40) return 66.67 + ((bmi - 35) / (40 - 35)) * 16.67;
      return 83.34 + Math.min(((bmi - 40) / 10) * 16.66, 16.66);
    };

    const position = getBMIPosition(value);
    const getColor = (bmi: number) => {
      if (bmi < 18.5) return "#3b82f6"; // blue
      if (bmi < 25) return "#10b981"; // green
      if (bmi < 30) return "#f59e0b"; // amber
      if (bmi < 35) return "#ef4444"; // red
      return "#dc2626"; // dark red
    };

    return (
      <div className="relative w-full max-w-sm mx-auto">
        {/* BMI Scale */}
        <div className="relative h-8 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-orange-500 to-red-600 rounded-full overflow-hidden shadow-inner">
          {/* Category markers */}
          <div className="absolute top-0 left-0 h-full w-1/4 border-r border-white/30" />
          <div className="absolute top-0 left-1/4 h-full w-1/4 border-r border-white/30" />
          <div className="absolute top-0 left-1/2 h-full w-1/6 border-r border-white/30" />
          <div className="absolute top-0 left-2/3 h-full w-1/6 border-r border-white/30" />
          
          {/* BMI indicator */}
          <div 
            className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-1000 ease-out rounded-full"
            style={{ left: `${position}%` }}
          />
        </div>
        
        {/* Scale labels */}
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2 px-1">
          <span>Under</span>
          <span>Normal</span>
          <span>Over</span>
          <span>Obese I</span>
          <span>Obese II</span>
          <span>Obese III</span>
        </div>
        
        {/* BMI Value Display */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl">
            <div className="text-center">
              <div className="text-2xl font-black" style={{ color: getColor(value) }}>{value}</div>
              <div className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">BMI</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Result stat component
  const BMIResultStat = ({ label, value, icon: Icon, color }: any) => {
    const colors: any = {
      sky: "text-[hsl(var(--brand-1))] bg-[hsl(var(--brand-1))]/10 border-[hsl(var(--brand-1))]/20",
      emerald: "text-[hsl(var(--brand-2))] bg-[hsl(var(--brand-2))]/10 border-[hsl(var(--brand-2))]/20",
      amber: "text-[hsl(var(--brand-3))] bg-[hsl(var(--brand-3))]/10 border-[hsl(var(--brand-3))]/20",
      rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    };
    return (
      <div className={cn("p-4 rounded-2xl bg-white/5 border backdrop-blur-sm space-y-2 hover:scale-105 transition-transform duration-300", colors[color])}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-current/10">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
          <p className="text-sm font-black">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-xl relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-1))]/5 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="p-8 md:p-10 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--brand-1))]/10 text-[hsl(var(--brand-1))] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Scale className="w-6 h-6" />
          </div>
          <div className="px-4 py-2 rounded-xl bg-[hsl(var(--brand-1))]/10 text-[hsl(var(--brand-1))] text-[9px] font-black uppercase tracking-widest border border-[hsl(var(--brand-1))]/20">
            Metric Only
          </div>
        </div>
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">BMI Calculator</h2>
        <p className="text-slate-700 dark:text-slate-300 mt-2 text-sm font-medium leading-relaxed">
          Advanced body mass index analysis with health risk assessment and ideal weight ranges.
        </p>
      </div>

      {/* Main Content */}
      <div className="p-8 md:p-10 space-y-10 relative z-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Personal Info */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-[0.2em] ml-1">
              Personal Profile
            </label>
            <div className="flex gap-3">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 border",
                    gender === g
                      ? "bg-[hsl(var(--brand-1))] text-white border-[hsl(var(--brand-1))] shadow-xl shadow-[hsl(var(--brand-1))]/20"
                      : "bg-transparent border-white/20 text-slate-400 hover:border-[hsl(var(--brand-1))]/50 hover:text-[hsl(var(--brand-1))]"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="relative group/input">
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Math.min(100, Math.max(15, parseInt(e.target.value) || 15)))}
                className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 transition-all focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-600 dark:text-white/70">Years</span>
            </div>
          </div>

          {/* Measurements */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-[0.2em] ml-1">
              Body Measurements
            </label>
            <div className="space-y-4">
              <div className="relative group/input">
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.min(250, Math.max(100, parseInt(e.target.value) || 100)))}
                  placeholder="Height"
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 transition-all focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-600 dark:text-white/70">CM</span>
              </div>
              <div className="relative group/input">
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Math.min(300, Math.max(30, parseFloat(e.target.value) || 30)))}
                  placeholder="Weight"
                  className="w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold text-sm outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 transition-all focus:ring-4 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-600 dark:text-white/70">KG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col gap-4 pt-6 border-t border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <button onClick={resetForm} className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all">
              <RefreshCw className="w-3 h-3 inline mr-2" /> Reset
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all">
              <History className="w-3 h-3 inline mr-2" /> History
            </button>
          </div>
          {bmi !== null && (
            <button onClick={saveCurrentResult} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-[hsl(var(--brand-1))]/20 hover:scale-105 active:scale-95 transition-all relative overflow-hidden group">
              <span className="relative z-10 flex items-center gap-2">
                <Save className="w-3 h-3" /> Save Analysis
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          )}
        </div>

        {/* Results Display */}
        {bmi !== null && (
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-700 relative overflow-hidden group/results">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--brand-1))]/10 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="relative z-10 space-y-8">
              {/* BMI Gauge */}
              <div className="flex justify-center">
                <BMIGauge value={bmi} />
              </div>

              {/* Category and Stats */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--brand-1))]/10 border border-[hsl(var(--brand-1))]/20">
                    <Target className="w-4 h-4 text-[hsl(var(--brand-1))]" />
                    <span className="text-sm font-black text-[hsl(var(--brand-1))]">{category}</span>
                  </div>
                  {idealWeightRange && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ideal Weight Range</p>
                      <p className="text-lg font-black text-[hsl(var(--brand-2))]">{idealWeightRange.min} - {idealWeightRange.max} kg</p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <BMIResultStat label="Height" value={`${heightCm} cm`} icon={Ruler} color="sky" />
                  <BMIResultStat label="Weight" value={`${weightKg} kg`} icon={Weight} color="emerald" />
                  <BMIResultStat label="Age" value={`${age} yrs`} icon={User} color="amber" />
                  <BMIResultStat label="Gender" value={gender} icon={Heart} color="rose" />
                </div>
              </div>

              {/* Health Risks */}
              {healthRisks.length > 0 && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-amber-400">Health Risk Indicators</h4>
                  </div>
                  <div className="grid gap-2">
                    {healthRisks.map((risk, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <span className="font-medium">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className="mt-6 p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 animate-in slide-in-from-top duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-white">
                <History className="w-4 h-4 text-[hsl(var(--brand-1))]" /> Recent Analysis
              </h3>
              {savedEntries.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] font-black uppercase text-rose-400 flex items-center gap-1 hover:text-rose-300 transition-colors">
                  <Trash2 className="w-3 h-3" /> Clear History
                </button>
              )}
            </div>
            {savedEntries.length === 0 ? (
              <p className="text-xs text-white/70 text-center py-6 font-medium">No saved results found.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {savedEntries.map(entry => (
                  <div key={entry.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10 group">
                    <div>
                      <p className="text-sm font-black text-[hsl(var(--brand-1))]">{entry.bmi} BMI – {entry.category}</p>
                      <p className="text-[10px] text-white/70 font-bold">{entry.date} • {entry.age}y {entry.gender}</p>
                    </div>
                    <button onClick={() => deleteEntry(entry.id)} className="text-white/50 hover:text-rose-400 transition-colors group-hover:scale-110">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BMI Categories Info */}
        <div className="mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-[hsl(var(--brand-1))]" />
            <h4 className="text-sm font-black uppercase tracking-widest text-[hsl(var(--brand-1))]">BMI Categories (WHO Standards)</h4>
          </div>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="font-bold text-blue-400">Underweight</span>
              <span className="text-white/70">&lt; 18.5</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="font-bold text-green-400">Normal Weight</span>
              <span className="text-white/70">18.5 - 24.9</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="font-bold text-amber-400">Overweight</span>
              <span className="text-white/70">25 - 29.9</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="font-bold text-orange-400">Obese Class I</span>
              <span className="text-white/70">30 - 34.9</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="font-bold text-red-400">Obese Class II</span>
              <span className="text-white/70">35 - 39.9</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-bold text-red-600">Obese Class III</span>
              <span className="text-white/70">≥ 40</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center py-6 border-t border-white/10 flex flex-col items-center gap-3 relative z-10">
        <div className="flex items-center gap-2 text-white/70">
          <Shield className="w-4 h-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Medical Disclaimer</p>
        </div>
        <p className="text-xs text-white/50 max-w-lg leading-relaxed font-medium px-8">
          BMI is a screening tool and does not diagnose health conditions. Consult healthcare professionals for comprehensive health assessment.
        </p>
      </div>
    </div>
  );
}

function CalorieCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [activeTab, setActiveTab] = useState<"calculator" | "converter" | "mealPlans" | "exercise">("calculator");
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState<number>(180);
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(11);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [weightLbs, setWeightLbs] = useState<number>(165);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [result, setResult] = useState<BMRResult | null>(null);

  // Converter state
  const [caloriesInput, setCaloriesInput] = useState<number>(500);
  const [convertedKJ, setConvertedKJ] = useState<number>(2093.4);

  useEffect(() => {
    setConvertedKJ(parseFloat((caloriesInput * 4.1868).toFixed(1)));
  }, [caloriesInput]);

  const calculate = () => {
    const weight = unitSystem === "metric" ? weightKg : weightLbs * 0.453592;
    const height = unitSystem === "metric" ? heightCm : (heightFeet * 12 + heightInches) * 2.54;
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr = gender === "male" ? bmr + 5 : bmr - 161;
    const tdee = bmr * activityMultipliers[activityLevel];
    setResult({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      maintenance: Math.round(tdee),
      weightLoss: {
        mild: Math.round(tdee - 250),
        moderate: Math.round(tdee - 500),
        aggressive: Math.round(tdee - 1000),
      },
      weightGain: {
        mild: Math.round(tdee + 250),
        moderate: Math.round(tdee + 500),
        aggressive: Math.round(tdee + 1000),
      },
      macros: {
        protein: Math.round(weight * 2.2),
        carbs: Math.round((tdee * 0.45) / 4),
        fat: Math.round((tdee * 0.25) / 9),
      }
    });
  };

  useEffect(() => {
    calculate();
  }, [age, gender, heightCm, heightFeet, heightInches, weightKg, weightLbs, activityLevel, unitSystem]);

  const mealPlans = {
    1500: { breakfast: "Oats & Berries (350)", lunch: "Chicken Salad (450)", dinner: "Salmon & Greens (500)", snacks: "Greek Yogurt (200)" },
    2000: { breakfast: "Eggs & Toast (450)", lunch: "Quinoa Bowl (600)", dinner: "Steak & Potatoes (700)", snacks: "Nuts & Fruit (250)" },
    2500: { breakfast: "Protein Pancakes (600)", lunch: "Turkey Wrap (750)", dinner: "Pasta Bolognese (850)", snacks: "Protein Shake (300)" },
  };

  const exerciseBurn = [
    { activity: "Weight Training", kcal: 450, perHour: { 125: 300, 155: 450, 185: 550 } },
    { activity: "Running (Moderate)", kcal: 600, perHour: { 125: 500, 155: 600, 185: 750 } },
    { activity: "Cycling", kcal: 500, perHour: { 125: 400, 155: 500, 185: 600 } },
    { activity: "Swimming", kcal: 550, perHour: { 125: 450, 155: 550, 185: 700 } },
  ];

  return (
    <div className="glass-card rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-xl relative group h-full flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
      
      <div className="p-8 md:p-10 border-b border-white/10 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
            <Flame className="w-6 h-6" />
          </div>
          <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
            {["calculator", "converter", "mealPlans", "exercise"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                  activeTab === t ? "bg-indigo-500 text-white shadow-lg" : "text-slate-500 hover:text-white"
                )}
              >
                {t.replace("mealPlans", "Plans")}
              </button>
            ))}
          </div>
        </div>
        <h2 className="text-3xl font-black tracking-tight">Energy Hub</h2>
      </div>

      <div className="p-8 md:p-10 flex-1 relative z-10 overflow-y-auto">
        {activeTab === "calculator" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Profile</label>
                <div className="flex gap-2">
                  {["male", "female"].map(g => (
                    <button key={g} onClick={() => setGender(g as any)} className={cn("flex-1 py-3 rounded-xl font-black text-[10px] uppercase border tracking-widest", gender === g ? "bg-white text-black border-white" : "border-white/10 text-slate-400")}>{g}</button>
                  ))}
                </div>
                <div className="relative">
                  <input type="number" value={age} onChange={e => setAge(parseInt(e.target.value) || 18)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500 uppercase">Age</span>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Biometrics</label>
                <div className="grid grid-cols-2 gap-2">
                   <div className="relative">
                    <input type="number" value={unitSystem === "metric" ? heightCm : heightFeet} onChange={e => unitSystem === "metric" ? setHeightCm(parseInt(e.target.value)) : setHeightFeet(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500">{unitSystem === "metric" ? "CM" : "FT"}</span>
                   </div>
                   <div className="relative">
                    <input type="number" value={unitSystem === "metric" ? weightKg : weightLbs} onChange={e => unitSystem === "metric" ? setWeightKg(parseFloat(e.target.value)) : setWeightLbs(parseFloat(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-500">{unitSystem === "metric" ? "KG" : "LBS"}</span>
                   </div>
                </div>
                <select value={activityLevel} onChange={e => setActivityLevel(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none">
                  {Object.keys(activityLabels).map(k => <option key={k} value={k} className="bg-slate-900">{k.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            {result && (
              <div className="bg-slate-900 rounded-[2rem] p-8 border border-white/10 space-y-8">
                <div className="text-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">TDEE Forecast</p>
                  <p className="text-5xl font-black">{result.tdee}<span className="text-lg text-slate-500 ml-2">kcal</span></p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Protein</p>
                    <p className="text-lg font-black">{result.macros.protein}g</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Carbs</p>
                    <p className="text-lg font-black">{result.macros.carbs}g</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Fats</p>
                    <p className="text-lg font-black">{result.macros.fat}g</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-[hsl(var(--brand-1))] uppercase tracking-[0.2em]">Metabolic Targets</p>
                  <div className="grid gap-3">
                    <TargetRow label="Fat Loss (Mild)" value={result.weightLoss.mild} color="rose" />
                    <TargetRow label="Fat Loss (Mod)" value={result.weightLoss.moderate} color="rose" />
                    <TargetRow label="Lean Bulk" value={result.weightGain.mild} color="emerald" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "converter" && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Kcal to KJ</label>
                <div className="grid gap-4">
                  <div className="relative">
                    <input type="number" value={caloriesInput} onChange={e => setCaloriesInput(parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black outline-none" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">KCAL</span>
                  </div>
                  <div className="relative">
                    <input type="number" value={convertedKJ} readOnly className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black text-indigo-400 outline-none" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">KJ</span>
                  </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === "mealPlans" && (
          <div className="grid gap-4 animate-in fade-in duration-500">
            {Object.entries(mealPlans).map(([cal, plan]) => (
              <div key={cal} className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="text-xl font-black text-indigo-400">{cal} kcal</h3>
                <div className="grid grid-cols-2 gap-4 text-[10px]">
                  <div><p className="text-slate-500 uppercase mb-1">Breakfast</p><p className="font-bold">{plan.breakfast}</p></div>
                  <div><p className="text-slate-500 uppercase mb-1">Lunch</p><p className="font-bold">{plan.lunch}</p></div>
                  <div><p className="text-slate-500 uppercase mb-1">Dinner</p><p className="font-bold">{plan.dinner}</p></div>
                  <div><p className="text-slate-500 uppercase mb-1">Snacks</p><p className="font-bold">{plan.snacks}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "exercise" && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {exerciseBurn.map((ex) => (
              <div key={ex.activity} className="flex justify-between items-center p-5 rounded-2xl bg-white/5 border border-white/10">
                <span className="font-bold text-sm">{ex.activity}</span>
                <span className="text-indigo-400 font-black">{ex.kcal} kcal/hr</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-6 border-t border-white/10 text-center">
         <p className="text-[10px] font-medium text-slate-500 flex items-center justify-center gap-2">
           <Shield className="w-3 h-3" /> Metabolic estimates based on MSJ formula.
         </p>
      </div>
    </div>
  );
}

function TargetRow({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-all cursor-default">
      <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{label}</span>
      <span className={cn("text-lg font-black", color === "rose" ? "text-rose-400" : "text-emerald-400")}>{value} <span className="text-[10px]">kcal</span></span>
    </div>
  );
}

// Icons
function RulerIcon(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21.3 15.3l-1.4-1.4L18.5 12.5l-1.4-1.4-1.4-1.4-1.4-1.4-1.4-1.4-1.4-1.4L8.7 2.7l-1.4-1.4L2.7 5.9l1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4 1.4L21.3 15.3z" />
      <path d="M7.3 5.3l1.4 1.4" />
      <path d="M10.1 8.1l1.4 1.4" />
      <path d="M12.9 10.9l1.4 1.4" />
      <path d="M15.7 13.7l1.4 1.4" />
      <path d="M18.5 16.5l1.4 1.4" />
    </svg>
  );
}

function WeightIcon(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="5" r="3" />
      <path d="M6.5 8a2 2 0 0 0-1.905 1.402l-2.115 6.406A2 2 0 0 0 4.385 18.5h15.23a2 2 0 0 0 1.905-2.692l-2.115-6.406A2 2 0 0 0 17.5 8h-11z" />
    </svg>
  );
}
