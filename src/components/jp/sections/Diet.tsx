import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Apple, FileText, Plus, Sparkles, Trash2, Upload, Wand2, Camera, 
  X, Loader2, Zap, ScanLine, ChevronRight, Target, Flame, 
  Dumbbell, Coffee, UtensilsCrossed, Salad, Sun, Moon, Eye, CheckCircle,
  TrendingUp, TrendingDown, Mic, Edit2, Save, BarChart3, PieChart,
  Calendar, Clock, Award, Brain, Activity, Heart, RefreshCcw, AlertTriangle,
  Info, Scale, ChevronDown, PlusCircle, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { today, fmt as formatDate } from "@/lib/dateUtil";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// Types
interface ScanItem {
  id?: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: number;
  reasoning?: string;
}

interface ScanResult {
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  vitamins: string[];
  minerals: string[];
  serving_size?: string;
  desc?: string;
  confidence?: number;
  items?: ScanItem[];
}

interface FoodLog {
  id: string;
  name: string;
  kcal: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  meal_time: string;
  vitamins?: string[];
  minerals?: string[];
  created_at?: string;
  date?: string;
}

interface DietPlan {
  id: string;
  title: string;
  file_url: string;
  assigned_date: string;
}

interface Suggestion {
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_time: string;
  vitamins: string[];
  minerals: string[];
  desc: string;
}

interface DailySummary {
  date: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Helper Components
const GlassCard = ({ children, className, onClick }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
      className
    )}
  >
    {children}
  </div>
);

const MacroRing = ({ value, total, color, label }: any) => {
  const percentage = Math.min(100, (value / (total || 1)) * 100);
  const strokeDash = percentage * 1.76;
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center justify-center group">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-800" />
          <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="6" strokeDasharray={`${strokeDash} 201`} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute text-center">
          <div className="text-sm font-black tracking-tight">{Math.round(value)}g</div>
        </div>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  );
};

export default function Diet() {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // States
  const [foods, setFoods] = useState<FoodLog[]>([]);
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [weeklyData, setWeeklyData] = useState<DailySummary[]>([]);
  const [editingFood, setEditingFood] = useState<string | null>(null);
  const [newFood, setNewFood] = useState({ name: "", kcal: "", meal_time: "Lunch" });
  const [showScanner, setShowScanner] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanMealTime, setScanMealTime] = useState("Lunch");
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualFood, setManualFood] = useState<ScanResult>({
    name: "", kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, vitamins: [], minerals: [], desc: "Manual entry"
  });
  const [aiTip, setAiTip] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"diary" | "analytics" | "plans">("diary");

  // Refs
  const scanInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Totals
  const totalKcal = foods.reduce((sum, f) => sum + (f.kcal || 0), 0);
  const totalProtein = foods.reduce((sum, f) => sum + (f.protein_g || 0), 0);
  const totalCarbs = foods.reduce((sum, f) => sum + (f.carbs_g || 0), 0);
  const totalFat = foods.reduce((sum, f) => sum + (f.fat_g || 0), 0);
  const targetCalories = profile?.daily_calorie_goal || 2000;
  const calorieProgress = Math.min(100, (totalKcal / targetCalories) * 100);

  const macroData = useMemo(() => [
    { name: "Protein", value: totalProtein, color: "#10b981" },
    { name: "Carbs", value: totalCarbs, color: "#3b82f6" },
    { name: "Fat", value: totalFat, color: "#f59e0b" },
  ], [totalProtein, totalCarbs, totalFat]);

  const loadWeeklyData = useCallback(async () => {
    if (!user) return;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const { data } = await supabase.from("food_logs").select("*").eq("user_id", user.id).gte("date", weekAgo.toISOString().split('T')[0]).order("date", { ascending: true });
    if (data) {
      const dailyMap = new Map<string, DailySummary>();
      data.forEach((log: any) => {
        const existing = dailyMap.get(log.date) || { date: log.date, kcal: 0, protein: 0, carbs: 0, fat: 0 };
        existing.kcal += log.kcal || 0; existing.protein += log.protein_g || 0; existing.carbs += log.carbs_g || 0; existing.fat += log.fat_g || 0;
        dailyMap.set(log.date, existing);
      });
      setWeeklyData(Array.from(dailyMap.values()));
    }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [foodRes, planRes] = await Promise.all([
      supabase.from("food_logs").select("*").eq("user_id", user.id).eq("date", today()).order("created_at", { ascending: false }),
      supabase.from("diet_plans").select("*").eq("user_id", user.id).order("assigned_date", { ascending: false }),
    ]);
    if (foodRes.data) setFoods(foodRes.data as FoodLog[]);
    if (planRes.data) setPlans(planRes.data as DietPlan[]);
    await loadWeeklyData();
  }, [user, loadWeeklyData]);

  useEffect(() => { loadData(); }, [user, loadData]);
  
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(".diet-animate", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" });
    }
  }, [activeTab]);

  const analyzeFoodImage = async () => {
    if (!scanFile) return;
    setScanning(true);
    setShowManualFallback(false);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader(); reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(scanFile);
      });
      
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      const prompt = `Analyze this food image. Provide name, kcal, protein_g, carbs_g, fat_g, vitamins, minerals, and serving_size. Return ONLY valid JSON in this format: {"name": "", "kcal": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "vitamins": [], "minerals": [], "desc": ""}`;
      
      let result;

      // 1. Try Direct Gemini First (Best Results)
      if (geminiKey && geminiKey.length > 5) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: scanFile.type, data: base64 } }
                ]
              }]
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            result = JSON.parse(text.replace(/```json|```/g, "").trim());
          } else {
            const errBody = await response.json();
            console.error("Direct Gemini Error Response:", errBody);
          }
        } catch (e) {
          console.error("Direct Gemini Network/CORS Error:", e);
        }
      }

      // 2. Fallback to OpenRouter if Gemini failed or key missing
      if (!result && openRouterKey) {
        try {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${openRouterKey}`,
              "HTTP-Referer": window.location.origin,
              "X-Title": "JP Fitness Studio App"
            },
            body: JSON.stringify({
              model: "google/gemini-flash-1.5-8b",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: `data:${scanFile.type};base64,${base64}` } }
                  ]
                }
              ],
              response_format: { type: "json_object" }
            })
          });

          if (response.ok) {
            const data = await response.json();
            result = JSON.parse(data.choices[0].message.content);
          } else {
            const errBody = await response.json();
            console.error("OpenRouter Error Response:", errBody);
          }
        } catch (e) {
          console.error("OpenRouter Network Error:", e);
        }
      }

      if (!result) throw new Error("AI analysis could not be completed. Check console for details.");

      setScanResult(result);
      toast.success(`Scan Complete: ${result.name} detected! ✨`);
    } catch (err: any) {
      console.error("Critical Analysis Error:", err);
      toast.error(`AI Analysis failed: ${err.message}`);
      setShowManualFallback(true);
    } finally {
      setScanning(false);
    }
  };

  const addFoodEntry = async (entry: Partial<FoodLog>) => {
    if (!user || !entry.name) {
      toast.error("Food name is required");
      return;
    }
    const { error } = await supabase.from("food_logs").insert({ 
      ...entry, 
      name: entry.name, // Explicitly provide name to satisfy TS
      user_id: user.id, 
      date: today() 
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Food added to diary"); loadData(); resetScanner(); }
  };

  const resetScanner = () => { setShowScanner(false); setScanImage(null); setScanFile(null); setScanResult(null); setShowManualFallback(false); };

  const deleteFood = async (id: string) => {
    await supabase.from("food_logs").delete().eq("id", id);
    loadData();
    toast.success("Entry removed");
  };

  return (
    <div ref={containerRef} className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 diet-animate">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 border border-emerald-500/10">
              <Zap className="w-3 h-3" />
              Nutritional Intelligence
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
              Your <span className="text-emerald-500">Diet</span>.
            </h1>
          </div>

          <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            {(["diary", "analytics", "plans"] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "diary" && (
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left: Summary and Progress */}
            <div className="lg:col-span-5 space-y-8 diet-animate">
              <GlassCard className="p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Daily Intake</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Metabolic Balance</p>
                    </div>
                    <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-lg">
                      <Flame className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="text-6xl font-black tracking-tighter">{totalKcal}</span>
                    <span className="text-lg text-slate-400 font-black mb-2">/ {targetCalories} kcal</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Calorie Compliance</span>
                      <span className="text-emerald-500">{Math.round(calorieProgress)}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden p-1">
                      <div className="h-full bg-emerald-500 rounded-full shadow-lg transition-all duration-1000" style={{ width: `${calorieProgress}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <MacroRing value={totalProtein} total={totalProtein + totalCarbs + totalFat} color="#10b981" label="Prot" />
                    <MacroRing value={totalCarbs} total={totalProtein + totalCarbs + totalFat} color="#3b82f6" label="Carb" />
                    <MacroRing value={totalFat} total={totalProtein + totalCarbs + totalFat} color="#f59e0b" label="Fat" />
                  </div>
                </div>
              </GlassCard>

              {/* AI Scanner Trigger */}
              <GlassCard 
                className="p-8 bg-slate-900 text-white border-none cursor-pointer group relative overflow-hidden"
                onClick={() => setShowScanner(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-xl font-black">AI Food Scanner</h4>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Auto-detect macros from photos</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-all shadow-xl shadow-emerald-500/20">
                    <ScanLine className="w-6 h-6" />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Right: Food Diary */}
            <div className="lg:col-span-7 space-y-8 diet-animate">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <UtensilsCrossed className="w-6 h-6 text-emerald-500" />
                  Food Journal
                </h3>
                <button 
                  onClick={() => setActiveTab("plans")}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Manage Plans
                </button>
              </div>

              <div className="space-y-4">
                {foods.length === 0 ? (
                  <GlassCard className="p-12 text-center border-dashed border-2">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries for today. Start scanning! 🍱</p>
                  </GlassCard>
                ) : (
                  foods.map((food) => (
                    <GlassCard key={food.id} className="p-6 flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                          food.meal_time === "Breakfast" ? "bg-amber-100 text-amber-600" :
                          food.meal_time === "Lunch" ? "bg-emerald-100 text-emerald-600" :
                          "bg-indigo-100 text-indigo-600"
                        )}>
                          {food.meal_time === "Breakfast" ? <Sun className="w-6 h-6" /> :
                           food.meal_time === "Lunch" ? <Activity className="w-6 h-6" /> :
                           <Moon className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white">{food.name}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{food.meal_time} • {food.kcal} kcal</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex gap-4 mr-4">
                          <MacroPill label="P" value={food.protein_g} color="bg-emerald-500" />
                          <MacroPill label="C" value={food.carbs_g} color="bg-blue-500" />
                          <MacroPill label="F" value={food.fat_g} color="bg-amber-500" />
                        </div>
                        <button 
                          onClick={() => deleteFood(food.id)}
                          className="p-3 rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>

              {/* Manual Entry Form */}
              <GlassCard className="p-8">
                <form onSubmit={(e) => { e.preventDefault(); addFoodEntry({ name: newFood.name, kcal: parseInt(newFood.kcal), meal_time: newFood.meal_time }); }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})}
                      placeholder="Meal name" 
                      className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <input 
                      value={newFood.kcal} onChange={e => setNewFood({...newFood, kcal: e.target.value})}
                      type="number" placeholder="kcal" 
                      className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <button className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                    Add Manual Entry
                  </button>
                </form>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid md:grid-cols-2 gap-8 diet-animate">
            <GlassCard className="p-10">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-emerald-500" />
                Calorie Trend
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorDiet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="kcal" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorDiet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-10">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                <PieChart className="w-6 h-6 text-blue-500" />
                Average Distribution
              </h3>
              <div className="flex items-center justify-center h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="space-y-8 diet-animate">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">Professional Plans</h3>
              <label className="cursor-pointer px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20">
                Upload Plan
                <input type="file" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.success("Diet plan analysis initiated... ✨");
                  }
                }} />
              </label>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <GlassCard key={plan.id} className="p-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 shadow-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black mb-2">{plan.title}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{formatDate(plan.assigned_date)}</p>
                  <a 
                    href={plan.file_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all"
                  >
                    Download Plan <ChevronRight className="w-3 h-3" />
                  </a>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto px-4">
            <GlassCard className="bg-white dark:bg-slate-900 p-8 md:p-12 relative">
              <button onClick={resetScanner} className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row gap-12">
                {/* Left: Image Upload/Preview */}
                <div className="md:w-1/2 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-black tracking-tighter">AI Analysis.</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Select a photo of your meal for high-precision macro detection.</p>
                  </div>

                  <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center group">
                    {scanImage ? (
                      <>
                        <img src={scanImage} alt="Preview" className="w-full h-full object-cover" />
                        {scanning && (
                          <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-white font-black text-xs uppercase tracking-[0.2em] animate-pulse">Scanning Biometrics...</p>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)] animate-[scan_2s_infinite_linear]" />
                      </>
                    ) : (
                      <div className="text-center p-8 space-y-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-xl">
                          <Camera className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                           <button onClick={() => scanInputRef.current?.click()} className="px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest shadow-2xl">
                             Choose Image
                           </button>
                        </div>
                        <input type="file" ref={scanInputRef} className="hidden" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setScanFile(file);
                            const reader = new FileReader(); reader.onload = (ev) => setScanImage(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </div>
                    )}
                  </div>

                  {scanImage && !scanning && !scanResult && (
                    <button 
                      onClick={analyzeFoodImage}
                      className="w-full py-5 rounded-3xl bg-emerald-500 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      Analyze Plate
                    </button>
                  )}
                </div>

                {/* Right: Results */}
                <div className="md:w-1/2">
                   {scanning ? (
                     <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
                        <Sparkles className="w-16 h-16 text-emerald-500 animate-pulse" />
                        <div className="space-y-2">
                          <h4 className="text-2xl font-black italic">Extracting Data...</h4>
                          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Identifying Ingredients & Poriton Sizes</p>
                        </div>
                     </div>
                   ) : scanResult ? (
                     <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmed Analysis
                          </div>
                          <h3 className="text-5xl font-black tracking-tighter">{scanResult.name}</h3>
                          <p className="text-slate-400 font-bold text-sm">Serving: {scanResult.serving_size || "1 portion"}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <ResultStat label="Calories" value={scanResult.kcal} suffix="kcal" icon={Flame} color="emerald" />
                           <ResultStat label="Protein" value={scanResult.protein_g} suffix="g" icon={Dumbbell} color="blue" />
                           <ResultStat label="Carbs" value={scanResult.carbs_g} suffix="g" icon={Activity} color="amber" />
                           <ResultStat label="Fat" value={scanResult.fat_g} suffix="g" icon={Target} color="rose" />
                        </div>

                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 italic text-sm text-slate-600 dark:text-slate-300">
                          "{scanResult.desc || "Analysis complete. Ready for diary entry."}"
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button 
                            onClick={resetScanner}
                            className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                          >
                            Discard
                          </button>
                          <button 
                            onClick={() => addFoodEntry({ 
                              name: scanResult.name, kcal: scanResult.kcal, 
                              protein_g: scanResult.protein_g, carbs_g: scanResult.carbs_g, 
                              fat_g: scanResult.fat_g, meal_time: scanMealTime 
                            })}
                            className="flex-[2] py-4 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                          >
                            Add to Diary
                          </button>
                        </div>
                     </div>
                   ) : showManualFallback ? (
                      <div className="space-y-8">
                         <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10 flex items-center gap-4">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Auto-detection failed. Please verify the photo quality or enter manually below.</p>
                         </div>
                         <div className="space-y-6">
                            <h4 className="text-xl font-black uppercase tracking-widest">Manual Entry</h4>
                            <div className="grid gap-4">
                               <input 
                                 value={manualFood.name} onChange={e => setManualFood({...manualFood, name: e.target.value})}
                                 placeholder="Food Name" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none"
                               />
                               <div className="grid grid-cols-2 gap-4">
                                 <input 
                                   type="number" value={manualFood.kcal} onChange={e => setManualFood({...manualFood, kcal: parseInt(e.target.value)})}
                                   placeholder="kcal" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none"
                                 />
                                 <input 
                                   type="number" value={manualFood.protein_g} onChange={e => setManualFood({...manualFood, protein_g: parseInt(e.target.value)})}
                                   placeholder="protein" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold outline-none"
                                 />
                               </div>
                            </div>
                            <button onClick={() => addFoodEntry(manualFood)} className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest">
                              Save Manual Entry
                            </button>
                         </div>
                      </div>
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                        <ScanLine className="w-16 h-16 text-slate-200 dark:text-slate-800 mb-6" />
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Awaiting Visual Protocol</p>
                     </div>
                   )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(350px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ResultStat({ label, value, suffix, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500/10 text-emerald-600",
    blue: "bg-blue-500/10 text-blue-600",
    amber: "bg-amber-500/10 text-amber-600",
    rose: "bg-rose-500/10 text-rose-600",
  };
  return (
    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
       <Icon className={cn("w-6 h-6 mb-3", colors[color].split(' ')[1])} />
       <div className="text-2xl font-black">{value}<span className="text-xs ml-0.5 text-slate-400">{suffix}</span></div>
       <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{label}</div>
    </div>
  );
}

function MacroPill({ label, value, color }: any) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
       <div className={cn("w-2 h-2 rounded-full", color)} />
       <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{label}: {value}g</span>
    </div>
  );
}