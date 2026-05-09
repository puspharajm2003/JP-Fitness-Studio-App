import { useState, useMemo } from "react";
import { Flame, TrendingUp, TrendingDown, Activity } from "lucide-react";

type UnitSystem = "metric" | "imperial";

function calculateBMR(weightKg: number, heightCm: number, age: number, gender: "male" | "female"): number {
  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
}

function getActivityMultiplier(activity: string): number {
  switch (activity) {
    case "sedentary": return 1.2;
    case "light": return 1.375;
    case "moderate": return 1.55;
    case "active": return 1.725;
    case "veryActive": return 1.9;
    default: return 1.2;
  }
}

export function TdeeCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [age, setAge] = useState(23);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(65);
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active" | "veryActive">("moderate");

  const metricWeight = useMemo(() => {
    if (unitSystem === "metric") return weight;
    return weight * 0.453592;
  }, [weight, unitSystem]);

  const metricHeight = useMemo(() => {
    if (unitSystem === "metric") return height;
    return height * 2.54;
  }, [height, unitSystem]);

  const bmr = useMemo(() => calculateBMR(metricWeight, metricHeight, age, gender), [metricWeight, metricHeight, age, gender]);
  const tdee = useMemo(() => Math.round(bmr * getActivityMultiplier(activity)), [bmr, activity]);
  const weightLossCalories = useMemo(() => Math.round(tdee - 500), [tdee]);
  const weightGainCalories = useMemo(() => Math.round(tdee + 500), [tdee]);

  return (
    <div className="glass-card rounded-[2rem] p-8 shadow-xl border-none">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-black text-xl flex items-center gap-3">
          <Flame className="w-5 h-5 text-primary" /> Energy Lab
        </h3>
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 border border-border/50">
          <button
            onClick={() => setUnitSystem("metric")}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${unitSystem === "metric" ? "bg-slate-900 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            Metric
          </button>
          <button
            onClick={() => setUnitSystem("imperial")}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${unitSystem === "imperial" ? "bg-slate-900 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"}`}
          >
            Imperial
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="group">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Math.min(120, Math.max(18, Number(e.target.value))))}
            className="w-full mt-1.5 px-5 py-3.5 rounded-2xl bg-secondary border border-transparent text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 border-border/50 transition-all"
          />
        </div>

        <div className="group">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "male" | "female")}
            className="w-full mt-1.5 px-5 py-3.5 rounded-2xl bg-secondary border border-transparent text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 border-border/50 transition-all appearance-none cursor-pointer"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="group">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">Height ({unitSystem === "metric" ? "cm" : "in"})</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full mt-1.5 px-5 py-3.5 rounded-2xl bg-secondary border border-transparent text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 border-border/50 transition-all"
          />
        </div>

        <div className="group">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">Weight ({unitSystem === "metric" ? "kg" : "lbs"})</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full mt-1.5 px-5 py-3.5 rounded-2xl bg-secondary border border-transparent text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 border-border/50 transition-all"
          />
        </div>

        <div className="col-span-2 group">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">Activity Level</label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as any)}
            className="w-full mt-1.5 px-5 py-3.5 rounded-2xl bg-secondary border border-transparent text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 border-border/50 transition-all appearance-none cursor-pointer"
          >
            <option value="sedentary">Sedentary (No exercise)</option>
            <option value="light">Light (1-3 times/week)</option>
            <option value="moderate">Moderate (4-5 times/week)</option>
            <option value="active">Active (Daily / Intense 3-4x)</option>
            <option value="veryActive">Very Active (Intense 6-7x)</option>
          </select>
        </div>
      </div>

      {/* Result Card */}
      <div className="rounded-[2rem] bg-slate-900 p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Activity className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-primary">TDEE Output</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black">{tdee}</span>
            <span className="text-lg font-bold text-white/60">Kcal / Day</span>
          </div>
          <p className="text-xs text-white/40 mb-6">Basal Metabolic Rate: {Math.round(bmr)} Kcal</p>
          
          <div className="grid grid-cols-2 gap-3">
             <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                   <TrendingDown className="w-3 h-3 text-rose-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Loss</span>
                </div>
                <span className="text-sm font-bold">{weightLossCalories} Kcal</span>
             </div>
             <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1">
                   <TrendingUp className="w-3 h-3 text-emerald-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Gain</span>
                </div>
                <span className="text-sm font-bold">{weightGainCalories} Kcal</span>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
           Metabolic Strategy
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          TDEE represents the total energy your body burns in 24 hours. Adjusting by ±500 Kcal creates a sustainable 0.5kg/week change in weight.
        </p>
      </div>
    </div>
  );
}
