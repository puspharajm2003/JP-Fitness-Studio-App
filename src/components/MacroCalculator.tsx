import { useState, useMemo } from "react";
import { Target, Sliders } from "lucide-react";

type UnitSystem = "metric" | "imperial";
type Goal = "maintain" | "lose" | "gain";
type MacroPreset = "balanced" | "lowFat" | "lowCarb" | "highProtein" | "custom";

// --- Helper functions (same as TDEE calculator) ---
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

function getCalorieAdjustment(goal: Goal, tdee: number): number {
  switch (goal) {
    case "lose": return tdee - 500;
    case "gain": return tdee + 500;
    default: return tdee;
  }
}

export function MacroCalculator() {
  // --- Inputs ---
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active" | "veryActive">("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");
  const [preset, setPreset] = useState<MacroPreset>("balanced");

  // --- Custom macro percentages (for "Create Your Own" tab) ---
  const [customProteinPct, setCustomProteinPct] = useState(30);
  const [customCarbsPct, setCustomCarbsPct] = useState(50);
  const [customFatPct, setCustomFatPct] = useState(20);

  // --- Metric conversions ---
  const metricWeight = useMemo(() => unitSystem === "metric" ? weight : weight * 0.453592, [weight, unitSystem]);
  const metricHeight = useMemo(() => unitSystem === "metric" ? height : height * 2.54, [height, unitSystem]);

  // --- Calculate TDEE and daily calories ---
  const bmr = useMemo(() => calculateBMR(metricWeight, metricHeight, age, gender), [metricWeight, metricHeight, age, gender]);
  const tdee = useMemo(() => Math.round(bmr * getActivityMultiplier(activity)), [bmr, activity]);
  const dailyCalories = useMemo(() => getCalorieAdjustment(goal, tdee), [goal, tdee]);

  // --- Macro splits based on preset ---
  const macroSplit = useMemo(() => {
    switch (preset) {
      case "balanced":
        return { proteinPct: 30, carbsPct: 50, fatPct: 20 };
      case "lowFat":
        return { proteinPct: 30, carbsPct: 55, fatPct: 15 };
      case "lowCarb":
        return { proteinPct: 35, carbsPct: 30, fatPct: 35 };
      case "highProtein":
        return { proteinPct: 45, carbsPct: 35, fatPct: 20 };
      case "custom":
        // Ensure custom percentages sum to 100 (auto‑adjust fat if needed)
        let total = customProteinPct + customCarbsPct + customFatPct;
        if (total !== 100) {
          // Adjust fat to make 100%
          const adjustedFat = Math.max(0, 100 - customProteinPct - customCarbsPct);
          return { proteinPct: customProteinPct, carbsPct: customCarbsPct, fatPct: adjustedFat };
        }
        return { proteinPct: customProteinPct, carbsPct: customCarbsPct, fatPct: customFatPct };
      default:
        return { proteinPct: 30, carbsPct: 50, fatPct: 20 };
    }
  }, [preset, customProteinPct, customCarbsPct, customFatPct]);

  const proteinCalories = (macroSplit.proteinPct / 100) * dailyCalories;
  const carbsCalories = (macroSplit.carbsPct / 100) * dailyCalories;
  const fatCalories = (macroSplit.fatPct / 100) * dailyCalories;

  const proteinGrams = Math.round(proteinCalories / 4);
  const carbsGrams = Math.round(carbsCalories / 4);
  const fatGrams = Math.round(fatCalories / 9);

  // Protein range (0.8 - 2.2 g/kg of body weight)
  const proteinRangeMin = Math.round(metricWeight * 0.8);
  const proteinRangeMax = Math.round(metricWeight * 2.2);

  // Carbs range (based on 45–65% of daily calories)
  const carbsRangeMin = Math.round((dailyCalories * 0.45) / 4);
  const carbsRangeMax = Math.round((dailyCalories * 0.65) / 4);

  // Fat range (based on 20–35% of daily calories)
  const fatRangeMin = Math.round((dailyCalories * 0.20) / 9);
  const fatRangeMax = Math.round((dailyCalories * 0.35) / 9);

  // Sugar limit: <10% of total calories (4 kcal/g)
  const sugarLimitGrams = Math.round((dailyCalories * 0.10) / 4);
  // Saturated fat limit: <10% of total calories (9 kcal/g)
  const satFatLimitGrams = Math.round((dailyCalories * 0.10) / 9);

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Macro Calculator
        </h3>
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          <button
            onClick={() => setUnitSystem("metric")}
            className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition ${unitSystem === "metric" ? "bg-primary text-white" : "text-muted-foreground"}`}
          >
            Metric
          </button>
          <button
            onClick={() => setUnitSystem("imperial")}
            className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition ${unitSystem === "imperial" ? "bg-primary text-white" : "text-muted-foreground"}`}
          >
            Imperial
          </button>
        </div>
      </div>

      {/* Input grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Math.min(120, Math.max(18, Number(e.target.value))))}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "male" | "female")}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Height ({unitSystem === "metric" ? "cm" : "in"})</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Weight ({unitSystem === "metric" ? "kg" : "lb"})</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Activity</label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as any)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"
          >
            <option value="sedentary">Sedentary</option>
            <option value="light">Light (1-3x/week)</option>
            <option value="moderate">Moderate (4-5x/week)</option>
            <option value="active">Active (6-7x/week)</option>
            <option value="veryActive">Very Active (Intense)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Goal</label>
          <div className="flex gap-1 mt-1 bg-secondary rounded-xl p-1">
            {(["maintain", "lose", "gain"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  goal === g ? "bg-primary text-white shadow-brand" : "text-muted-foreground hover:bg-white/50"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Macro Preset Tabs */}
      <div className="flex flex-wrap gap-1 mt-4 mb-6">
        {(["balanced", "lowFat", "lowCarb", "highProtein", "custom"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-full transition-all ${
              preset === p ? "bg-primary text-white shadow-sm" : "bg-secondary text-muted-foreground hover:bg-border"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="mb-6 p-4 rounded-2xl bg-secondary/30 space-y-4 border border-border/50">
          {[
            { label: "Protein", val: customProteinPct, set: setCustomProteinPct, max: 60 },
            { label: "Carbs", val: customCarbsPct, set: setCustomCarbsPct, max: 70 },
            { label: "Fat", val: customFatPct, set: setCustomFatPct, max: 50 },
          ].map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                <span>{s.label} %</span>
                <span className="text-primary">{s.val}%</span>
              </div>
              <input type="range" min={10} max={s.max} value={s.val} onChange={e => s.set(Number(e.target.value))} className="w-full accent-primary h-1.5 rounded-full bg-border appearance-none cursor-pointer" />
            </div>
          ))}
          <p className="text-[9px] text-muted-foreground text-center font-bold italic">Fat auto‑adjusted to match 100% total</p>
        </div>
      )}

      {/* Result Card */}
      <div className="rounded-3xl bg-gradient-brand p-6 text-primary-foreground shadow-brand relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10"><Sliders className="w-24 h-24 rotate-12" /></div>
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase opacity-80 mb-1">Protein</p>
              <p className="text-2xl font-black">{proteinGrams}g</p>
              <p className="text-[8px] font-bold opacity-60">{proteinRangeMin}-{proteinRangeMax}g</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase opacity-80 mb-1">Carbs</p>
              <p className="text-2xl font-black">{carbsGrams}g</p>
              <p className="text-[8px] font-bold opacity-60">{carbsRangeMin}-{carbsRangeMax}g</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase opacity-80 mb-1">Fat</p>
              <p className="text-2xl font-black">{fatGrams}g</p>
              <p className="text-[8px] font-bold opacity-60">{fatRangeMin}-{fatRangeMax}g</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-white/20">
             <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="opacity-80">Daily Energy</span>
                <span>{dailyCalories} Kcal</span>
             </div>
             <div className="flex justify-between items-center text-[9px] font-bold opacity-70">
                <span>Sugar Limit</span>
                <span>&lt;{sugarLimitGrams}g</span>
             </div>
             <div className="flex justify-between items-center text-[9px] font-bold opacity-70">
                <span>Sat. Fat Limit</span>
                <span>&lt;{satFatLimitGrams}g</span>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-[9px] text-muted-foreground font-medium leading-relaxed bg-secondary/20 p-3 rounded-xl">
        <p className="font-black uppercase mb-1">Calculation logic</p>
        ADA/CDC protein guidelines (0.8–2.2 g/kg). Carbs (45–65%) and fat (20–35%) based on IOM/WHO. Sugar/Sat. Fat limits are ≤10% total kcal.
      </div>
    </div>
  );
}
