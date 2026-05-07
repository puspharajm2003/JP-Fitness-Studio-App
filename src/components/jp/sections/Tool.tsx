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
  Zap
} from "lucide-react";

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
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Fitness Tools</h1>
          <p className="text-muted-foreground mt-1">Smart calculators and converters to power your progress.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="glass-card rounded-3xl overflow-hidden border-none shadow-2xl">
          <CalorieCalculator />
        </div>
        <div className="glass-card rounded-3xl overflow-hidden border-none shadow-2xl">
          <BodyFatCalculator />
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
    let color = "text-emerald-500";
    let bgGradient = "from-green-500 to-emerald-500";
    if (value > 25) {
      color = "text-red-500";
      bgGradient = "from-red-500 to-orange-500";
    } else if (value > 18) {
      color = "text-amber-500";
      bgGradient = "from-amber-500 to-orange-500";
    }
    const rotation = -90 + (value / 45) * 180; // 0–45% maps to -90 to 90 deg
    return (
      <div className="relative w-36 h-36 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" className="dark:stroke-slate-700" />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={`url(#fatGradient)`} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(rotation + 90) / 180 * Math.PI * 40} 500`}
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id="fatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black">{value}%</span>
          <span className="text-[10px] text-slate-500">Body Fat</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500/10 to-blue-500/10 text-sky-700 dark:text-sky-400 text-sm font-medium mb-4">
          <Droplet className="w-4 h-4" />
          Body Composition Analysis
        </div>
        <h2 className="text-2xl md:text-3xl font-black bg-gradient-brand bg-clip-text text-transparent">
          Body Fat Calculator
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-2xl mx-auto font-medium text-xs">
          Estimate your body fat percentage using the U.S. Navy method or BMI method.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        {/* Unit tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          {[
            { value: "metric", label: "Metric Units", icon: Ruler },
            { value: "imperial", label: "US Units", icon: Weight },
          ].map((unit) => (
            <button
              key={unit.value}
              onClick={() => setUnitSystem(unit.value as UnitSystem)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold text-sm transition-all ${
                unitSystem === unit.value
                  ? "border-b-2 border-sky-500 text-sky-600 dark:text-sky-400 bg-white dark:bg-slate-900"
                  : "text-slate-500"
              }`}
            >
              <unit.icon className="w-4 h-4" />
              {unit.label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Gender and Age */}
            <div>
              <label className="block text-xs font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                <User className="w-4 h-4 text-sky-500" /> Gender
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setGender("male")}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition ${
                    gender === "male"
                      ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  Male
                </button>
                <button
                  onClick={() => setGender("female")}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition ${
                    gender === "female"
                      ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  Female
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                <Calendar className="w-4 h-4 text-sky-500" /> Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Math.min(100, Math.max(15, parseInt(e.target.value) || 15)))}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                <RulerIcon className="w-4 h-4 text-sky-500" /> Height
              </label>
              {unitSystem === "metric" ? (
                <div className="relative">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">cm</span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ft</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={heightInches}
                      onChange={(e) => setHeightInches(Math.min(11, parseInt(e.target.value) || 0))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">in</span>
                  </div>
                </div>
              )}
            </div>

            {/* Weight */}
            <div>
              <label className="block text-xs font-black uppercase text-muted-foreground mb-2 flex items-center gap-2 tracking-widest">
                <Scale className="w-4 h-4 text-sky-500" /> Weight
              </label>
              {unitSystem === "metric" ? (
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">kg</span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">lbs</span>
                </div>
              )}
            </div>

            {/* Neck */}
            <div>
              <label className="block text-xs font-black uppercase text-muted-foreground mb-2 tracking-widest">Neck circumference</label>
              {unitSystem === "metric" ? (
                <div className="relative">
                  <input type="number" step="0.1" value={neckCm} onChange={(e) => setNeckCm(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">cm</span>
                </div>
              ) : (
                <div className="relative">
                  <input type="number" step="0.1" value={neckInches} onChange={(e) => setNeckInches(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">in</span>
                </div>
              )}
            </div>

            {/* Waist */}
            <div>
              <label className="block text-xs font-black uppercase text-muted-foreground mb-2 tracking-widest">Waist circumference</label>
              {unitSystem === "metric" ? (
                <div className="relative">
                  <input type="number" step="0.1" value={waistCm} onChange={(e) => setWaistCm(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">cm</span>
                </div>
              ) : (
                <div className="relative">
                  <input type="number" step="0.1" value={waistInches} onChange={(e) => setWaistInches(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">in</span>
                </div>
              )}
            </div>

            {/* Hip (only for women) */}
            {gender === "female" && (
              <div>
                <label className="block text-xs font-black uppercase text-muted-foreground mb-2 tracking-widest">Hip circumference</label>
                {unitSystem === "metric" ? (
                  <div className="relative">
                    <input type="number" step="0.1" value={hipCm} onChange={(e) => setHipCm(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">cm</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="number" step="0.1" value={hipInches} onChange={(e) => setHipInches(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-sky-400/20" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">in</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap justify-between items-center gap-3 mt-8">
            <div className="flex gap-2">
              <button onClick={resetForm} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition">
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
              <button onClick={() => setShowHistory(!showHistory)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition">
                <History className="w-3 h-3" /> History
              </button>
            </div>
            {bfpNavy !== null && (
              <button onClick={saveCurrentResult} className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition active:scale-95">
                <Save className="w-3 h-3" /> Save Result
              </button>
            )}
          </div>

          {/* Results Section */}
          {bfpNavy !== null && (
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 p-6 border border-sky-200 dark:border-sky-800 animate-in fade-in zoom-in duration-500">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center">
                  <BodyFatGauge value={bfpNavy} />
                  <div className="mt-3 text-center">
                    <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest">Navy Method</p>
                    <p className="text-4xl font-black">{bfpNavy}%</p>
                    <p className="text-sm font-bold mt-1 text-slate-600 dark:text-slate-400">{category}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
                      <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Fat Mass</p>
                      <p className="text-lg font-black">{fatMass} <span className="text-[10px]">kg</span></p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
                      <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Lean Mass</p>
                      <p className="text-lg font-black">{leanMass} <span className="text-[10px]">kg</span></p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20">
                      <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Ideal %</p>
                      <p className="text-lg font-black">{idealBodyFat}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-rose-200 dark:border-rose-900/50">
                      <p className="text-[9px] font-black uppercase text-rose-500 mb-1">Excess Fat</p>
                      <p className="text-lg font-black text-rose-600">{fatToLose} <span className="text-[10px]">kg</span></p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                     <p className="text-[9px] font-black uppercase text-sky-600 mb-1">BMI Estimation</p>
                     <p className="text-sm font-bold">{bfpBMI}% (Alternative Method)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History panel */}
          {showHistory && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 animate-in slide-in-from-top duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest"><History className="w-4 h-4 text-sky-500" /> Recent Analysis</h3>
                {savedEntries.length > 0 && (
                  <button onClick={clearHistory} className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 hover:underline">
                    <Trash2 className="w-3 h-3" /> Clear History
                  </button>
                )}
              </div>
              {savedEntries.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 font-medium">No saved results found.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {savedEntries.map(entry => (
                    <div key={entry.id} className="flex justify-between items-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-border group">
                      <div>
                        <p className="text-sm font-black text-sky-600">{entry.bodyFat}% – {entry.bodyFatCategory}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{entry.date} • {entry.age}y {entry.gender}</p>
                      </div>
                      <button onClick={() => deleteEntry(entry.id)} className="text-slate-300 hover:text-rose-500 transition group-hover:scale-110">
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
            <button onClick={() => toggleSection("categories")} className="flex justify-between items-center w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 transition">
              <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4 text-sky-500" /> Body Fat Categories (ACE)</span>
              {expandedSections.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.categories && (
              <div className="overflow-x-auto p-4 border border-border rounded-xl bg-white dark:bg-slate-900 animate-in fade-in duration-300">
                <table className="w-full text-[11px] font-bold">
                  <thead><tr className="text-muted-foreground uppercase border-b border-border"><th className="pb-2 text-left">Description</th><th className="pb-2 text-right">Women</th><th className="pb-2 text-right">Men</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    <tr className="text-slate-600"><td className="py-2">Essential fat</td><td className="text-right">10–13%</td><td className="text-right">2–5%</td></tr>
                    <tr className="text-sky-600"><td className="py-2">Athletes</td><td className="text-right">14–20%</td><td className="text-right">6–13%</td></tr>
                    <tr className="text-emerald-600"><td className="py-2">Fitness</td><td className="text-right">21–24%</td><td className="text-right">14–17%</td></tr>
                    <tr className="text-amber-600"><td className="py-2">Average</td><td className="text-right">25–31%</td><td className="text-right">18–24%</td></tr>
                    <tr className="text-rose-600"><td className="py-2">Obese</td><td className="text-right">32%+</td><td className="text-right">25%+</td></tr>
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={() => toggleSection("methodology")} className="flex justify-between items-center w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 transition">
              <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Calculator className="w-4 h-4 text-sky-500" /> Scientific Methodology</span>
              {expandedSections.methodology ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.methodology && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 p-4 border-l-4 border-sky-400 bg-sky-50/30 dark:bg-sky-950/20 rounded-r-xl animate-in fade-in duration-300 leading-relaxed font-medium">
                <p><strong>U.S. Navy Method:</strong> Estimates body density based on waist, neck, and (for women) hip circumference along with height. Calculated via log-based regression equations used by clinical and military institutions.</p>
                <p className="mt-2"><strong>BMI Method:</strong> A statistical estimate based on height-to-weight ratio and age. Less accurate for athletes with high muscle mass but provides a useful baseline comparison.</p>
              </div>
            )}

            <button onClick={() => toggleSection("risks")} className="flex justify-between items-center w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 transition">
              <span className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" /> Health Risk Indicators</span>
              {expandedSections.risks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expandedSections.risks && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 p-4 border-l-4 border-rose-400 bg-rose-50/30 dark:bg-rose-950/20 rounded-r-xl animate-in fade-in duration-300 leading-relaxed font-medium">
                <p>Elevated body fat levels, particularly visceral fat, are significantly linked to chronic conditions including metabolic syndrome, cardiovascular disease, hypertension, and insulin resistance. Monitoring body composition is a critical step in long-term health optimization.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center py-6 border-t border-border flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400">
           <Shield className="w-4 h-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Disclaimer</p>
        </div>
        <p className="text-xs text-muted-foreground max-w-lg leading-relaxed font-medium">
          Calculations are statistical estimations and should not be used as a substitute for medical grade body scans (DXA, BodPod) or professional healthcare consultation.
        </p>
      </div>
    </div>
  );
}

function CalorieCalculator() {
  // Unit system
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");

  // Personal data
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState<number>(180);
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(11);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [weightLbs, setWeightLbs] = useState<number>(165);
  const [bodyFat, setBodyFat] = useState<number>(20);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [bmrFormula, setBmrFormula] = useState<BMRFormula>("mifflin");
  const [weightGoal, setWeightGoal] = useState<WeightGoal>("maintain");
  const [weeklyGoal, setWeeklyGoal] = useState<number>(0.5); // lbs per week or kg per week

  // Zigzag schedule
  const [showZigzag, setShowZigzag] = useState<boolean>(false);
  const [zigzagType, setZigzagType] = useState<"standard" | "gradual">(
    "standard"
  );

  // Results
  const [result, setResult] = useState<BMRResult | null>(null);

  // Current active tab
  const [activeTab, setActiveTab] = useState<Tab>("calculator");

  // Converter state
  const [caloriesInput, setCaloriesInput] = useState<number>(1);
  const [convertedKJ, setConvertedKJ] = useState<number>(4.1868);

  // Expanded info
  const [expandedSections, setExpandedSections] = useState({
    formulas: false,
    zigzagInfo: false,
  });

  // Derived height/weight in metric
  const getHeightMeters = (): number => {
    if (unitSystem === "metric") return heightCm / 100;
    const totalInches = heightFeet * 12 + heightInches;
    return totalInches * 0.0254;
  };

  const getWeightKg = (): number => {
    if (unitSystem === "metric") return weightKg;
    return weightLbs * 0.453592;
  };

  // BMR calculations
  const calculateBMR = (): number => {
    const weight = getWeightKg();
    const height = getHeightMeters() * 100; // cm
    const ageVal = age;
    const fat = bodyFat / 100;

    if (bmrFormula === "mifflin") {
      if (gender === "male")
        return 10 * weight + 6.25 * height - 5 * ageVal + 5;
      else return 10 * weight + 6.25 * height - 5 * ageVal - 161;
    } else if (bmrFormula === "harris") {
      if (gender === "male")
        return 13.397 * weight + 4.799 * height - 5.677 * ageVal + 88.362;
      else return 9.247 * weight + 3.098 * height - 4.33 * ageVal + 447.593;
    } else {
      // Katch-McArdle
      if (bodyFat <= 0 || bodyFat >= 60) return 370 + 21.6 * weight;
      const leanMass = weight * (1 - fat);
      return 370 + 21.6 * leanMass;
    }
  };

  const calculateTDEE = (bmr: number): number => {
    return bmr * activityMultipliers[activityLevel];
  };

  const calculateMacros = (calories: number) => {
    // Default macro split: 30% protein, 40% carbs, 30% fat
    const proteinCal = calories * 0.3;
    const carbsCal = calories * 0.4;
    const fatCal = calories * 0.3;
    return {
      protein: Math.round(proteinCal / 4),
      carbs: Math.round(carbsCal / 4),
      fat: Math.round(fatCal / 9),
    };
  };

  useEffect(() => {
    const bmr = calculateBMR();
    const tdee = calculateTDEE(bmr);
    const maintenance = tdee;

    // Weekly calorie deficit/surplus: 1 lb = 3500 kcal, 0.45 kg = 3500 kcal
    const caloriesPerUnit = 3500; // per lb
    const weeklyChange = weeklyGoal * caloriesPerUnit;
    const dailyChange = weeklyChange / 7;

    let lossMild = maintenance - 250;
    let lossModerate = maintenance - 500;
    let lossAggressive = maintenance - 1000;
    let gainMild = maintenance + 250;
    let gainModerate = maintenance + 500;
    let gainAggressive = maintenance + 1000;

    // Clamp to safe minimum (1200 for women, 1500 for men)
    const minSafe = gender === "female" ? 1200 : 1500;
    lossMild = Math.max(lossMild, minSafe);
    lossModerate = Math.max(lossModerate, minSafe);
    lossAggressive = Math.max(lossAggressive, minSafe);

    const macros = calculateMacros(maintenance);

    setResult({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      maintenance: Math.round(maintenance),
      weightLoss: {
        mild: Math.round(lossMild),
        moderate: Math.round(lossModerate),
        aggressive: Math.round(lossAggressive),
      },
      weightGain: {
        mild: Math.round(gainMild),
        moderate: Math.round(gainModerate),
        aggressive: Math.round(gainAggressive),
      },
      macros,
    });
  }, [
    age,
    gender,
    heightCm,
    heightFeet,
    heightInches,
    weightKg,
    weightLbs,
    bodyFat,
    activityLevel,
    bmrFormula,
    unitSystem,
    weeklyGoal,
  ]);

  // Converter effect
  useEffect(() => {
    setConvertedKJ(parseFloat((caloriesInput * 4.1868).toFixed(2)));
  }, [caloriesInput]);

  // Helper to get current recommended calorie intake based on goal
  const getRecommendedCalories = (): number => {
    if (!result) return result?.maintenance || 2000;
    if (weightGoal === "maintain") return result.maintenance;
    if (weightGoal === "lose") {
      if (weeklyGoal <= 0.5) return result.weightLoss.mild;
      if (weeklyGoal <= 1) return result.weightLoss.moderate;
      return result.weightLoss.aggressive;
    }
    // gain
    if (weeklyGoal <= 0.5) return result.weightGain.mild;
    if (weeklyGoal <= 1) return result.weightGain.moderate;
    return result.weightGain.aggressive;
  };

  // Zigzag schedule generation
  const generateZigzagSchedule = () => {
    if (!result) return [];
    const maintenance = result.maintenance;
    const target = getRecommendedCalories();
    const diff = maintenance - target; // positive for loss, negative for gain
    const weeklyTotal = target * 7;
    if (zigzagType === "standard") {
      // 2 high days, 5 low days
      const high = maintenance - diff * 0.5; // smaller deficit
      const low = maintenance - diff * 1.5;
      return [
        { day: "Mon", calories: Math.round(low) },
        { day: "Tue", calories: Math.round(low) },
        { day: "Wed", calories: Math.round(high) },
        { day: "Thu", calories: Math.round(low) },
        { day: "Fri", calories: Math.round(high) },
        { day: "Sat", calories: Math.round(low) },
        { day: "Sun", calories: Math.round(low) },
      ];
    } else {
      // Gradual: increase/decrease over week
      const base = target;
      const range = 250;
      const step = (range * 2) / 6; // from -range to +range
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
        (day, idx) => ({
          day,
          calories: Math.round(base - range + idx * step),
        })
      );
    }
  };

  const zigzagSchedule = generateZigzagSchedule();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sample meal plans (calories)
  const mealPlans = {
    1200: {
      breakfast: "All-bran cereal (125) + Milk (50) + Banana (90)",
      lunch: "Grilled cheese with tomato (300) + Salad (50)",
      dinner: "Grilled Chicken (200) + Brussel sprouts (100) + Quinoa (105)",
      snacks: "Cucumber (30) + Avocado dip (50)",
    },
    1500: {
      breakfast: "Granola (120) + Greek yogurt (120) + Blueberries (40)",
      lunch: "Chicken and vegetable soup (300) + Bread (100)",
      dinner: "Steak (375) + Mashed potatoes (150) + Asparagus (75)",
      snacks: "Apple (75) + Peanut butter (75)",
    },
    2000: {
      breakfast: "Buttered toast (150) + Egg (80) + Banana (90) + Almonds (170)",
      lunch: "Grilled chicken (225) + Grilled vegetables (125) + Pasta (185)",
      dinner: "Grilled salmon (225) + Brown rice (175) + Green beans (100) + Walnuts (165)",
      snacks: "Hummus (50) + Baby carrots (35) + Crackers (65)",
    },
  };

  const exerciseBurn = [
    { activity: "Walking (3.5 mph)", perHour: { 125: 215, 155: 267, 185: 319 } },
    { activity: "Running (9 min/mile)", perHour: { 125: 624, 155: 773, 185: 923 } },
    { activity: "Bicycling (12-14 mph)", perHour: { 125: 454, 155: 562, 185: 671 } },
    { activity: "Swimming (moderate)", perHour: { 125: 397, 155: 492, 185: 587 } },
    { activity: "Basketball (general)", perHour: { 125: 340, 155: 422, 185: 503 } },
    { activity: "Soccer (general)", perHour: { 125: 397, 155: 492, 185: 587 } },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4">
          <Flame className="w-4 h-4" />
          Personalised Energy Needs
        </div>
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-brand bg-clip-text text-transparent">
          Calorie Calculator
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-2xl mx-auto font-medium">
          Estimate daily calorie needs based on your goals, activity, and body composition.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "calculator", label: "Calculator", icon: Calculator },
          { id: "converter", label: "Energy Converter", icon: Battery },
          { id: "mealPlans", label: "Meal Plans", icon: Utensils },
          { id: "exercise", label: "Exercise Burn", icon: Footprints },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calculator Tab */}
      {activeTab === "calculator" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Unit toggle */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            {[
              { value: "metric", label: "Metric Units", icon: RulerIcon },
              { value: "imperial", label: "Imperial Units", icon: WeightIcon },
            ].map((unit) => (
              <button
                key={unit.value}
                onClick={() => setUnitSystem(unit.value as UnitSystem)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold text-sm transition-all ${
                  unitSystem === unit.value
                    ? "border-b-2 border-primary text-primary bg-white dark:bg-slate-900"
                    : "text-slate-500"
                }`}
              >
                <unit.icon className="w-4 h-4" />
                {unit.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Age & Gender */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Math.min(120, Math.max(15, parseInt(e.target.value) || 15)))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Gender
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGender("male")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition ${
                      gender === "male"
                        ? "bg-gradient-brand text-white shadow-brand"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setGender("female")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition ${
                      gender === "female"
                        ? "bg-gradient-brand text-white shadow-brand"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Height */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <RulerIcon className="w-4 h-4 text-primary" />
                  Height
                </label>
                {unitSystem === "metric" ? (
                  <div className="relative">
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={heightFeet}
                        onChange={(e) => setHeightFeet(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">ft</span>
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={heightInches}
                        onChange={(e) => setHeightInches(Math.min(11, parseInt(e.target.value) || 0))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">in</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <WeightIcon className="w-4 h-4 text-primary" />
                  Weight
                </label>
                {unitSystem === "metric" ? (
                  <div className="relative">
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                      step="0.5"
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">kg</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      value={weightLbs}
                      onChange={(e) => setWeightLbs(parseFloat(e.target.value) || 0)}
                      step="1"
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">lbs</span>
                  </div>
                )}
              </div>

              {/* Body Fat */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Body Fat % (optional)
                </label>
                <input
                  type="number"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(Math.min(60, Math.max(5, parseInt(e.target.value) || 0)))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                  step="1"
                />
              </div>

              {/* Activity */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                >
                  {Object.entries(activityLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* BMR Formula */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  BMR Formula
                </label>
                <select
                  value={bmrFormula}
                  onChange={(e) => setBmrFormula(e.target.value as BMRFormula)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                >
                  <option value="mifflin">Mifflin-St Jeor (most accurate)</option>
                  <option value="harris">Revised Harris-Benedict</option>
                  <option value="katch">Katch-McArdle (needs body fat)</option>
                </select>
              </div>

              {/* Goal */}
              <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Weight Goal</label>
                  <div className="flex gap-2">
                    {(["lose", "maintain", "gain"] as WeightGoal[]).map((goal) => (
                      <button
                        key={goal}
                        onClick={() => setWeightGoal(goal)}
                        className={`flex-1 py-3 rounded-xl font-semibold capitalize transition ${
                          weightGoal === goal
                            ? "bg-gradient-brand text-white shadow-brand"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                        }`}
                      >
                        {goal === "lose" && <TrendingDown className="inline w-4 h-4 mr-1" />}
                        {goal === "gain" && <TrendingUp className="inline w-4 h-4 mr-1" />}
                        {goal === "maintain" && <Heart className="inline w-4 h-4 mr-1" />}
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Weekly Rate ({unitSystem === "metric" ? "kg/week" : "lbs/week"})
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="2"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition"
                  />
                  <p className="text-xs text-slate-500 mt-1">Max safe rate ~1 kg / 2 lbs per week</p>
                </div>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-6 border border-orange-200 dark:border-orange-800 animate-in fade-in zoom-in duration-500">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-orange-600 font-bold">Basal Metabolic Rate</p>
                    <p className="text-3xl font-black">{result.bmr} kcal/day</p>
                    <p className="text-sm text-slate-500 font-medium">Resting energy expenditure</p>
                    <div className="mt-3 h-px bg-orange-200 dark:bg-orange-800 my-3" />
                    <p className="text-sm uppercase tracking-wider text-orange-600 font-bold">Total Daily Energy Expenditure</p>
                    <p className="text-3xl font-black">{result.tdee} kcal/day</p>
                    <p className="text-sm text-slate-500 font-medium">With {activityLabels[activityLevel].toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wider text-orange-600 font-bold">Recommended Daily Intake</p>
                    <p className="text-4xl font-black text-orange-600">{getRecommendedCalories()} kcal</p>
                    <p className="text-sm text-slate-500 font-medium">
                      To {weightGoal} {weeklyGoal} {unitSystem === "metric" ? "kg" : "lbs"} per week
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 rounded-xl bg-white/50 dark:bg-black/20">
                        <span className="font-bold block text-[10px] uppercase text-slate-500">Protein</span>
                        <p className="font-black">{result.macros.protein}g</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/50 dark:bg-black/20">
                        <span className="font-bold block text-[10px] uppercase text-slate-500">Carbs</span>
                        <p className="font-black">{result.macros.carbs}g</p>
                      </div>
                      <div className="p-2 rounded-xl bg-white/50 dark:bg-black/20">
                        <span className="font-bold block text-[10px] uppercase text-slate-500">Fat</span>
                        <p className="font-black">{result.macros.fat}g</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zigzag Toggle */}
                <div className="mt-6 pt-4 border-t border-orange-200 dark:border-orange-800">
                  <button
                    onClick={() => setShowZigzag(!showZigzag)}
                    className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:scale-105 transition-transform"
                  >
                    <Zap className="w-4 h-4 fill-orange-500" />
                    {showZigzag ? "Hide" : "Show"} Zigzag Calorie Cycling
                  </button>
                  {showZigzag && (
                    <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex gap-3">
                        <button
                          onClick={() => setZigzagType("standard")}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            zigzagType === "standard"
                              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600"
                          }`}
                        >
                          2 high / 5 low
                        </button>
                        <button
                          onClick={() => setZigzagType("gradual")}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            zigzagType === "gradual"
                              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-600"
                          }`}
                        >
                          Gradual variation
                        </button>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-center text-[10px] font-bold">
                        {zigzagSchedule.map((day) => (
                          <div key={day.day} className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-orange-100 dark:border-orange-900/50">
                            <p className="text-slate-400 uppercase">{day.day}</p>
                            <p className="text-orange-600">{day.calories}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Weekly total:{" "}
                        <span className="font-bold">{zigzagSchedule.reduce((sum, d) => sum + d.calories, 0)}</span> kcal
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expandable Info */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => toggleSection("formulas")}
                className="flex items-center justify-between w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <span className="font-bold text-sm flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> About BMR Formulas</span>
                {expandedSections.formulas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSections.formulas && (
                <div className="text-xs text-slate-600 dark:text-slate-400 p-4 border-l-4 border-primary bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl animate-in fade-in duration-300">
                  <p className="mb-1"><strong>Mifflin-St Jeor</strong> (1990): Most accurate for general population.</p>
                  <p className="mb-1"><strong>Harris-Benedict</strong> (revised 1984): Older but still used.</p>
                  <p><strong>Katch-McArdle</strong>: Uses lean body mass – best if you know body fat %.</p>
                </div>
              )}
              <button
                onClick={() => toggleSection("zigzagInfo")}
                className="flex items-center justify-between w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <span className="font-bold text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-orange-500" /> What is Zigzag Calorie Cycling?</span>
                {expandedSections.zigzagInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSections.zigzagInfo && (
                <div className="text-xs text-slate-600 dark:text-slate-400 p-4 border-l-4 border-orange-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-r-xl animate-in fade-in duration-300">
                  Alternating daily calorie intake prevents metabolic adaptation, reduces hunger, and makes dieting more flexible. Total weekly calories stay the same.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Converter Tab */}
      {activeTab === "converter" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-border p-6 md:p-8 animate-in slide-in-from-right-4 duration-500">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <Battery className="w-6 h-6 text-orange-500" />
            Food Energy Converter
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest">Calories (kcal)</label>
              <input
                type="number"
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-border outline-none focus:ring-2 focus:ring-primary/20 text-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest">Kilojoules (kJ)</label>
              <input
                type="number"
                value={convertedKJ}
                readOnly
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-border text-slate-500 text-xl font-bold"
              />
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Conversion rate: 1 kcal = 4.1868 kJ</p>
            </div>
          </div>
          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Quick Reference</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 100, 500, 1000].map(val => (
                <div key={val} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-border shadow-sm">
                  <p className="text-lg font-black text-primary">{val} <span className="text-[10px] text-muted-foreground">kcal</span></p>
                  <p className="text-sm font-bold text-slate-500">{(val * 4.1868).toFixed(1)} <span className="text-[10px]">kJ</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meal Plans Tab */}
      {activeTab === "mealPlans" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-border p-6 md:p-8 animate-in slide-in-from-right-4 duration-500">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-orange-500" />
            Strategic Meal Blueprints
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(mealPlans).map(([cal, plan]) => (
              <div key={cal} className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6 border border-border hover:border-orange-500/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-orange-600 group-hover:scale-110 transition-transform">{cal} <span className="text-xs font-bold text-muted-foreground uppercase">kcal</span></h3>
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-orange-600"><Coffee className="w-4 h-4" /></div>
                </div>
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-border/50">
                    <p className="font-black text-[9px] uppercase text-muted-foreground mb-1">Breakfast</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{plan.breakfast}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-border/50">
                    <p className="font-black text-[9px] uppercase text-muted-foreground mb-1">Lunch</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{plan.lunch}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-border/50">
                    <p className="font-black text-[9px] uppercase text-muted-foreground mb-1">Dinner</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{plan.dinner}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-border/50">
                    <p className="font-black text-[9px] uppercase text-muted-foreground mb-1">Snacks</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{plan.snacks}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
             <Info className="w-5 h-5 text-blue-600" />
             <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Calculations are estimates. Portions should be weighed for maximum precision.</p>
          </div>
        </div>
      )}

      {/* Exercise Burn Tab */}
      {activeTab === "exercise" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-border p-6 md:p-8 animate-in slide-in-from-right-4 duration-500">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <Footprints className="w-6 h-6 text-orange-500" />
            Hourly Metabolic Burn
          </h2>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Activity Type</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">125 lb <span className="lowercase font-medium">(57kg)</span></th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">155 lb <span className="lowercase font-medium">(70kg)</span></th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">185 lb <span className="lowercase font-medium">(84kg)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exerciseBurn.map((ex) => (
                  <tr key={ex.activity} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{ex.activity}</td>
                    <td className="px-6 py-4 text-right font-black text-orange-600">{ex.perHour[125]}</td>
                    <td className="px-6 py-4 text-right font-black text-orange-600">{ex.perHour[155]}</td>
                    <td className="px-6 py-4 text-right font-black text-orange-600">{ex.perHour[185]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Values = Total Kcal / Hour</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Moderate Intensity Basis</span>
             </div>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="text-center py-6 border-t border-border flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400">
           <Shield className="w-4 h-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Medical Disclaimer</p>
        </div>
        <p className="text-xs text-muted-foreground max-w-lg leading-relaxed font-medium">
          The information provided by this tool is for educational purposes only and is not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
        </p>
      </div>
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
