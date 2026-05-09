import { useState, useMemo } from "react";
import { Flame, Heart, Droplet, Activity } from "lucide-react";

type UnitSystem = "metric" | "imperial";

function calculateBMR(weightKg: number, heightCm: number, age: number, gender: "male" | "female"): number {
  // Mifflin-St Jeor Equation
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

export function FatIntakeCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState(180); // cm or inches
  const [weight, setWeight] = useState(70); // kg or lbs
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active" | "veryActive">("light");

  // Convert to metric for calculations
  const metricWeight = useMemo(() => {
    if (unitSystem === "metric") return weight;
    return weight * 0.453592; // lbs to kg
  }, [weight, unitSystem]);

  const metricHeight = useMemo(() => {
    if (unitSystem === "metric") return height;
    return height * 2.54; // inches to cm
  }, [height, unitSystem]);

  const bmr = useMemo(() => {
    return calculateBMR(metricWeight, metricHeight, age, gender);
  }, [metricWeight, metricHeight, age, gender]);

  const tdee = useMemo(() => {
    return Math.round(bmr * getActivityMultiplier(activity));
  }, [bmr, activity]);

  // Fat recommendations (20-35% of total calories for adults 19+)
  const fatPercentMin = 20;
  const fatPercentMax = 35;
  const caloriesPerGramFat = 9;

  const fatGramsMin = useMemo(() => Math.round((tdee * fatPercentMin / 100) / caloriesPerGramFat), [tdee]);
  const fatGramsMax = useMemo(() => Math.round((tdee * fatPercentMax / 100) / caloriesPerGramFat), [tdee]);

  // Saturated fat limit: <10% of total calories
  const satFatLimitGrams = useMemo(() => Math.round((tdee * 0.10) / caloriesPerGramFat), [tdee]);

  return (
    <div className="glass-card rounded-[2rem] p-8 shadow-xl border-none">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-black text-xl flex items-center gap-3">
          <Flame className="w-5 h-5 text-primary" /> Fat Lab
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
          <Heart className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
             <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-primary">Lipid Profile</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-black">{fatGramsMin} – {fatGramsMax}</span>
            <span className="text-lg font-bold text-white/60">Grams / Day</span>
          </div>
          <div className="flex items-center gap-3 mt-4 py-3 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Droplet className="w-4 h-4 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Saturated Limit</span>
              <span className="text-xs font-bold">&lt; {satFatLimitGrams}g Per Day</span>
            </div>
          </div>
          <p className="text-[10px] text-white/40 mt-4 leading-relaxed">
            Based on {tdee} total calories per day (TDEE).
          </p>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
           Fat Strategy
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Focus on <span className="text-foreground font-bold">Unsaturated fats</span> (avocados, nuts) for hormone health. Limit <span className="text-foreground font-bold">Saturated fats</span> to &lt;10% of total energy.
        </p>
      </div>
    </div>
  );
}
