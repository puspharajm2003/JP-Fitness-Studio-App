import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { useTheme } from "@/providers/ThemeProvider";
import { 
  Apple, FileText, Plus, Sparkles, Trash2, Upload, Wand2, Camera, 
  X, Loader2, Zap, ScanLine, ChevronRight, Target, Flame, 
  Dumbbell, Coffee, UtensilsCrossed, Salad, Sun, Moon, Eye, CheckCircle,
  TrendingUp, TrendingDown, Mic, Edit2, Save, BarChart3, PieChart,
  Calendar, Clock, Award, Brain, Activity, Heart, RefreshCcw, AlertTriangle,
  Info, Scale, ChevronDown, PlusCircle, CheckCircle2, Star, Zap as ZapIcon,
  Layers, Sparkles as SparklesIcon, Trophy, Target as TargetIcon
} from "lucide-react";
import { toast } from "sonner";
import { today, fmt as formatDate } from "@/lib/dateUtil";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

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
const GlassCard = ({ children, className, onClick, variant = "default" }: any) => {
  const variants = {
    default: "bg-white/60 dark:bg-black/60 backdrop-blur-2xl border border-white/30 dark:border-white/10",
    premium: "bg-gradient-to-br from-white/80 via-white/60 to-white/40 dark:from-black/80 dark:via-black/60 dark:to-black/40 backdrop-blur-3xl border border-white/40 dark:border-white/20 shadow-2xl shadow-black/5",
    interactive: "bg-white/50 dark:bg-black/50 backdrop-blur-xl border border-white/25 dark:border-white/15 hover:bg-white/70 dark:hover:bg-black/70 transition-all duration-500 hover:shadow-2xl hover:shadow-black/10 hover:scale-[1.02] hover:-translate-y-1",
    scanner: "bg-slate-900/90 text-white border-none backdrop-blur-2xl shadow-2xl shadow-black/20"
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-700 group",
        variants[variant],
        className
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
      
      {/* Subtle animated border */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-[shimmer_3s_ease-in-out_infinite]" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const MacroRing = ({ value, total, color, label }: any) => {
  const percentage = Math.min(100, (value / (total || 1)) * 100);
  const strokeDash = percentage * 1.76;
  const ringRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (ringRef.current) {
      gsap.fromTo(ringRef.current.querySelector('.progress-ring'), 
        { strokeDasharray: '0 201' }, 
        { strokeDasharray: `${strokeDash} 201`, duration: 1.5, ease: "power2.out", delay: 0.3 }
      );
    }
  }, [strokeDash]);

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative inline-flex items-center justify-center group">
        <svg ref={ringRef} className="w-20 h-20 transform -rotate-90 group-hover:scale-110 transition-transform duration-500">
          <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-800" />
          <circle 
            cx="40" cy="40" r="32" fill="none" stroke={`hsl(var(--${color}))`} strokeWidth="6" 
            strokeDasharray={`${strokeDash} 201`} 
            className="progress-ring transition-all duration-1000 ease-out drop-shadow-lg"
            style={{ filter: `drop-shadow(0 0 8px hsl(var(--${color})))` }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-sm font-black tracking-tight group-hover:scale-110 transition-transform duration-300">{Math.round(value)}g</div>
        </div>
        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1 h-1 bg-current rounded-full opacity-0 animate-ping"
              style={{ 
                top: `${20 + Math.random() * 40}%`, 
                left: `${20 + Math.random() * 40}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300">{label}</div>
    </div>
  );
};

export default function Diet() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { themeId } = useTheme();
  
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
  const [scanItems, setScanItems] = useState<ScanItem[]>([]);
  const [scanMealTime, setScanMealTime] = useState("Lunch");
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualFood, setManualFood] = useState<ScanResult>({
    name: "", kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, vitamins: [], minerals: [], desc: "Manual entry"
  });
  const [aiTip, setAiTip] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"diary" | "analytics" | "plans">("diary");
  const [analysisStage, setAnalysisStage] = useState<string>("idle");

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

  const resetScanner = () => { setShowScanner(false); setScanImage(null); setScanFile(null); setScanResult(null); setScanItems([]); setShowManualFallback(false); setAnalysisStage("idle"); };

  const parseFoodResponse = (text: string): { main: Partial<ScanResult>; items: ScanItem[] } | null => {
    try {
      let cleaned = text.replace(/```json|```/g, "").replace(/```/g, "").trim();
      
      let startIdx = cleaned.indexOf('{');
      let endIdx = cleaned.lastIndexOf('}');
      
      if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        } else {
          console.error("No JSON object found in response:", text.substring(0, 500));
          return null;
        }
      } else {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
      }
      
      const parsed = JSON.parse(cleaned);
      console.log("Parsed JSON:", JSON.stringify(parsed).substring(0, 1000));
      
      const getNum = (obj: any, ...keys: string[]): number => {
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null) {
            const val = Number(obj[key]);
            if (!isNaN(val)) return val;
          }
        }
        return 0;
      };
      
      const main: Partial<ScanResult> = {
        name: parsed.name || parsed.dish_name || parsed.dishName || parsed.meal_name || "Mixed Meal",
        kcal: getNum(parsed, 'kcal', 'calories', 'total_calories', 'totalKcal', 'energy'),
        protein_g: getNum(parsed, 'protein_g', 'protein', 'protein_g_calculated', 'total_protein'),
        carbs_g: getNum(parsed, 'carbs_g', 'carbs', 'carbohydrates', 'total_carbs', 'carb'),
        fat_g: getNum(parsed, 'fat_g', 'fat', 'total_fat'),
        fiber_g: getNum(parsed, 'fiber_g', 'fiber'),
        serving_size: parsed.serving_size || parsed.servingSize || parsed.serving || parsed.portion || "1 plate",
        desc: parsed.desc || parsed.description || parsed.analysis || parsed.summary || "",
        vitamins: Array.isArray(parsed.vitamins) ? parsed.vitamins : [],
        minerals: Array.isArray(parsed.minerals) ? parsed.minerals : [],
        confidence: Number(parsed.confidence) || 0.85,
      };

      console.log("Main result:", main);

      const rawItems = parsed.items || parsed.foods || parsed.components || parsed.detected_foods || 
                       parsed.food_items || parsed.dishes || parsed.food_items_list || parsed.identified_items || [];
      console.log("Raw items count:", rawItems.length, "Raw:", JSON.stringify(rawItems).substring(0, 500));
      
      if (!Array.isArray(rawItems)) {
        console.warn("Items is not an array, treating as empty");
        return { main, items: [] };
      }
      
      const items: ScanItem[] = rawItems.map((item: any, idx: number) => {
        const itemKcal = getNum(item, 'kcal', 'calories', 'cal');
        const itemProtein = getNum(item, 'protein_g', 'protein');
        const itemCarbs = getNum(item, 'carbs_g', 'carbs', 'carbohydrates');
        const itemFat = getNum(item, 'fat_g', 'fat');
        
        return {
          name: item.name || item.food_name || item.foodName || item.food || item.title || `Food ${idx + 1}`,
          kcal: itemKcal,
          protein: itemProtein,
          carbs: itemCarbs,
          fat: itemFat,
          confidence: Number(item.confidence) || 0.8,
          reasoning: item.reasoning || item.notes || item.description || item.portion || "",
        };
      });

      console.log("Parsed items:", items);
      
      if (items.length > 0 && main.kcal === 0) {
        main.kcal = items.reduce((sum, i) => sum + (i.kcal || 0), 0);
        main.protein_g = items.reduce((sum, i) => sum + (i.protein || 0), 0);
        main.carbs_g = items.reduce((sum, i) => sum + (i.carbs || 0), 0);
        main.fat_g = items.reduce((sum, i) => sum + (i.fat || 0), 0);
        console.log("Calculated totals from items:", main.kcal, main.protein_g, main.carbs_g, main.fat_g);
      }
      
      return { main, items };
    } catch (e) {
      console.error("JSON Parse Error:", e, "Response:", text.substring(0, 500));
      return null;
    }
  };

  const generateFallbackResult = (): ScanResult => {
    return {
      name: "Analyzed Meal",
      kcal: 350,
      protein_g: 25,
      carbs_g: 40,
      fat_g: 12,
      fiber_g: 5,
      serving_size: "1 plate",
      desc: "Nutritional analysis completed based on visual portion estimation",
      vitamins: [],
      minerals: [],
      items: []
    };
  };

  const analyzeFoodImage = async () => {
    if (!scanFile) return;
    setScanning(true);
    setShowManualFallback(false);
    setScanResult(null);
    setScanItems([]);
    
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader(); reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(scanFile);
      });
      
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      
      const detailedPrompt = `Analyze this food image and identify every food item visible. Return ONLY valid JSON:

{"name":"Meal Name","kcal":500,"protein_g":30,"carbs_g":50,"fat_g":20,"fiber_g":8,"serving_size":"1 plate","desc":"Description","vitamins":["A","C"],"minerals":["Iron"],"items":[{"name":"Rice","kcal":200,"protein_g":4,"carbs_g":45,"fat_g":1,"reasoning":"1 cup"},{"name":"Chicken","kcal":180,"protein_g":25,"carbs_g":0,"fat_g":8,"reasoning":"100g"},{"name":"Vegetables","kcal":50,"protein_g":2,"carbs_g":10,"fat_g":0,"reasoning":"1 cup mixed"}]}

Rules:
- List EVERY food item you can identify
- Assign realistic macros (rice ~130kcal/cup, chicken ~165kcal/100g, vegetables ~25-50kcal/cup)
- Include at least 3-5 items in the items array
- Use "items" key (required) with each food's name, kcal, protein_g, carbs_g, fat_g, reasoning
- No markdown, no explanations, ONLY JSON`;

      let result: any = null;
      let parsedResult: { main: Partial<ScanResult>; items: ScanItem[] } | null = null;
      setAnalysisStage("initializing");

      if (geminiKey && geminiKey.length > 5) {
        try {
          setAnalysisStage("analyzing");
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              generationConfig: {
                temperature: 0.1,
                topP: 0.9,
                maxOutputTokens: 8192,
              },
              contents: [{
                parts: [
                  { text: detailedPrompt },
                  { inline_data: { mime_type: scanFile.type, data: base64 } }
                ]
              }]
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            console.log("Gemini response:", text.substring(0, 500));
            if (text) {
              parsedResult = parseFoodResponse(text);
              if (parsedResult && parsedResult.main.kcal > 0) {
                result = parsedResult.main;
              }
            }
          } else {
            console.error("Gemini API error:", response.status, await response.text());
          }
        } catch (e) {
          console.error("Gemini Error:", e);
        }
      }

      if (!result) {
        setAnalysisStage("identifying");
        
        if (openRouterKey) {
          const models = [
            "google/gemini-flash-1.5",
            "google/gemini-flash-1.5-8b",
            "meta-llama/llama-3.2-11b-vision-instruct",
            "anthropic/claude-3-haiku",
            "qwen/qwen-vl-plus:free"
          ];

          for (const model of models) {
            try {
              setAnalysisStage("calculating");
              const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${openRouterKey}`,
                  "HTTP-Referer": window.location.origin,
                  "X-Title": "JP Fitness Studio App"
                },
                body: JSON.stringify({
                  model: model,
                  messages: [
                    {
                      role: "user",
                      content: [
                        { type: "text", text: detailedPrompt },
                        { type: "image_url", image_url: { url: `data:${scanFile.type};base64,${base64}` } }
                      ]
                    }
                  ],
                  max_tokens: 4096,
                  temperature: 0.1,
                })
              });

              if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || "";
                console.log(`OpenRouter ${model} response:`, content.substring(0, 500));
                if (content) {
                  parsedResult = parseFoodResponse(content);
                  if (parsedResult && parsedResult.main.kcal > 0) {
                    result = parsedResult.main;
                    break;
                  }
                }
              }
            } catch (e) {
              console.error(`Model ${model} failed:`, e);
            }
          }
        }
      }

      setAnalysisStage("finalizing");

      console.log("Final processing - result:", result ? JSON.stringify(result).substring(0, 500) : "null", "parsedResult:", parsedResult ? JSON.stringify(parsedResult).substring(0, 500) : "null");

      let finalResult: ScanResult;

      if (result && parsedResult) {
        finalResult = {
          name: result.name || "Mixed Meal",
          kcal: Math.max(0, result.kcal || 0),
          protein_g: Math.max(0, result.protein_g || 0),
          carbs_g: Math.max(0, result.carbs_g || 0),
          fat_g: Math.max(0, result.fat_g || 0),
          fiber_g: result.fiber_g || 0,
          serving_size: result.serving_size || "1 plate",
          desc: result.desc || "",
          vitamins: result.vitamins || [],
          minerals: result.minerals || [],
          items: []
        };

        if (parsedResult.items && parsedResult.items.length > 0) {
          finalResult.items = parsedResult.items.map((item, idx) => ({
            name: item.name || `Food ${idx + 1}`,
            kcal: Math.max(0, item.kcal || 0),
            protein: Math.max(0, item.protein || 0),
            carbs: Math.max(0, item.carbs || 0),
            fat: Math.max(0, item.fat || 0),
            reasoning: item.reasoning || ""
          }));
          
          if (finalResult.kcal === 0) {
            finalResult.kcal = (finalResult.items || []).reduce((sum, i) => sum + i.kcal, 0);
            finalResult.protein_g = (finalResult.items || []).reduce((sum, i) => sum + i.protein, 0);
            finalResult.carbs_g = (finalResult.items || []).reduce((sum, i) => sum + i.carbs, 0);
            finalResult.fat_g = (finalResult.items || []).reduce((sum, i) => sum + i.fat, 0);
          }
        }
      } else {
        throw new Error("Image analysis failed or returned invalid data. Please use manual entry.");
      }
      
      console.log("Final result to display:", JSON.stringify(finalResult).substring(0, 800));
      setScanResult(finalResult);
      setScanItems(finalResult.items || []);

      const itemCount = (finalResult.items || []).length;
      if (itemCount > 0) {
        toast.success(`Detected ${itemCount} item${itemCount !== 1 ? 's' : ''}: ${finalResult.name}`);
      } else {
        toast.warning(`No items detected. Try a clearer photo.`);
      }
    } catch (err: any) {
      console.error("Analysis Error:", err);
      toast.error(err.message || "Analysis failed. Try again.");
      setShowManualFallback(true);
    } finally {
      setScanning(false);
      setAnalysisStage("idle");
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

  const deleteFood = async (id: string) => {
    await supabase.from("food_logs").delete().eq("id", id);
    loadData();
    toast.success("Entry removed");
  };

  return (
    <div ref={containerRef} className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        
        {/* Premium Hub Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] p-8 md:p-12 text-white shadow-2xl border border-white/10 group diet-animate">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(var(--brand-1))]/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-[hsl(var(--brand-1))]/20 transition-all duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(var(--brand-2))]/10 rounded-full blur-[80px] -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[hsl(var(--brand-1))]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[hsl(var(--brand-1))] border border-[hsl(var(--brand-1))]/20">
                <Sparkles className="w-3 h-3" />
                Precision Nutrition Hub
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                Metabolic <span className="bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">Fueling</span>.
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-sm md:text-base leading-relaxed">
                Analyze, quantify, and optimize your nutrient partition through real-time AI image detection and metabolic forecasting.
              </p>
            </div>

            <div className="flex gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner self-start md:self-center">
              {(["diary", "analytics", "plans"] as const).map((tab) => (
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

        {activeTab === "diary" && (
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left: Summary and Progress */}
            <div className="lg:col-span-5 space-y-8 diet-animate">
              <GlassCard variant="premium" className="p-10 relative overflow-hidden group">
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[hsl(var(--brand-1))]/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[hsl(var(--brand-2))]/10 to-transparent rounded-full blur-2xl -ml-24 -mb-24 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Scale className="w-6 h-6 text-[hsl(var(--brand-1))]" />
                        Fuel Gauge
                      </h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Daily Accumulation</p>
                    </div>
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[hsl(var(--brand-1))]/20 to-[hsl(var(--brand-2))]/20 text-[hsl(var(--brand-1))] flex items-center justify-center shadow-inner backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-500">
                      <Flame className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                      {totalKcal}
                    </span>
                    <span className="text-sm text-slate-400 font-black uppercase tracking-widest">/ {targetCalories} kcal</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <span>Target Utilization</span>
                      <span className="text-[hsl(var(--brand-1))]">{Math.round(calorieProgress)}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-[hsl(var(--brand-1))] via-[hsl(var(--brand-2))] to-[hsl(var(--brand-1))] bg-[length:200%_auto] rounded-full shadow-lg transition-all duration-1000 relative overflow-hidden animate-gradient-x"
                        style={{ width: `${calorieProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-6 md:grid md:grid-cols-3 md:gap-4 pt-4">
                    <MacroRing value={totalProtein} total={totalProtein + totalCarbs + totalFat} color="brand-1" label="Prot" />
                    <MacroRing value={totalCarbs} total={totalProtein + totalCarbs + totalFat} color="brand-2" label="Carb" />
                    <MacroRing value={totalFat} total={totalProtein + totalCarbs + totalFat} color="brand-3" label="Fat" />
                  </div>
                </div>
              </GlassCard>

              {/* AI Scanner Trigger */}
              <GlassCard 
                variant="interactive"
                className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-white/10 cursor-pointer group relative overflow-hidden"
                onClick={() => setShowScanner(true)}
              >
                {/* Dynamic Aura */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--brand-1))/0.15,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="text-2xl font-black tracking-tight">AI Vision Scanner</h4>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                      Neural Analysis & Macro Partitioning
                    </p>
                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] text-[hsl(var(--brand-1))] font-black uppercase tracking-[0.2em]">
                      <SparklesIcon className="w-3 h-3 animate-pulse" />
                      <span>Advanced ML v4.2</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[hsl(var(--brand-1))] group-hover:text-white transition-all duration-500 shadow-2xl">
                    <ScanLine className="w-8 h-8" />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Right: Food Diary */}
            <div className="lg:col-span-7 space-y-8 diet-animate">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <UtensilsCrossed className="w-6 h-6 text-[hsl(var(--brand-1))]" />
                  Food Journal
                  <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[9px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 uppercase tracking-widest">
                    {foods.length} logged
                  </span>
                </h3>
                <button 
                  onClick={() => setActiveTab("plans")}
                  className="px-5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
                >
                  Protocols
                </button>
              </div>

              <div className="space-y-4">
                {foods.length === 0 ? (
                  <GlassCard variant="interactive" className="p-12 text-center border-dashed border-2 border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/50 to-white/30 dark:from-slate-900/50 dark:to-black/30">
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[hsl(var(--brand-1))]/10 to-[hsl(var(--brand-2))]/10 text-[hsl(var(--brand-1))] flex items-center justify-center mx-auto shadow-lg">
                        <UtensilsCrossed className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries for today. Start scanning! 🍱</p>
                      <p className="text-slate-500 text-sm">Use the AI scanner above to analyze your meals</p>
                    </div>
                  </GlassCard>
                ) : (
                  foods.map((food, index) => (
                    <GlassCard key={food.id} variant="interactive" className="p-5 flex items-center justify-between group bg-white/40 dark:bg-white/[0.02]">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 group-hover:scale-110",
                          food.meal_time === "Breakfast" ? "bg-amber-500/10 text-amber-600" :
                          food.meal_time === "Lunch" ? "bg-sky-500/10 text-sky-600" :
                          "bg-indigo-500/10 text-indigo-600"
                        )}>
                          {food.meal_time === "Breakfast" ? <Sun className="w-7 h-7" /> :
                           food.meal_time === "Lunch" ? <Activity className="w-7 h-7" /> :
                           <Moon className="w-7 h-7" />}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-[hsl(var(--brand-1))] transition-colors duration-300">{food.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {food.meal_time}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="text-[10px] font-black text-[hsl(var(--brand-1))]">{food.kcal} KCAL</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex gap-3 mr-4">
                          <MacroPill label="Prot" value={food.protein_g} color="bg-emerald-500" />
                          <MacroPill label="Carb" value={food.carbs_g} color="bg-sky-500" />
                          <MacroPill label="Fat" value={food.fat_g} color="bg-amber-500" />
                        </div>
                        <button 
                          onClick={() => deleteFood(food.id)}
                          className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300 group-hover:scale-110 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>

              {/* Manual Entry Form */}
              <GlassCard variant="interactive" className="p-8 bg-gradient-to-br from-slate-50/80 to-white/60 dark:from-slate-900/80 dark:to-black/60">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white flex items-center justify-center shadow-lg">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">Manual Entry</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Add food manually</p>
                  </div>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); addFoodEntry({ name: newFood.name, kcal: parseInt(newFood.kcal), meal_time: newFood.meal_time }); }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})}
                      placeholder="Meal name" 
                      className="px-4 py-3 rounded-2xl bg-white/60 dark:bg-black/60 backdrop-blur-sm border border-white/30 dark:border-white/10 font-bold text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]/30 transition-all duration-300 placeholder:text-slate-400"
                    />
                    <input 
                      value={newFood.kcal} onChange={e => setNewFood({...newFood, kcal: e.target.value})}
                      type="number" placeholder="kcal" 
                      className="px-4 py-3 rounded-2xl bg-white/60 dark:bg-black/60 backdrop-blur-sm border border-white/30 dark:border-white/10 font-bold text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]/30 transition-all duration-300 placeholder:text-slate-400"
                    />
                  </div>
                  
                  <select 
                    value={newFood.meal_time} onChange={e => setNewFood({...newFood, meal_time: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl bg-white/60 dark:bg-black/60 backdrop-blur-sm border border-white/30 dark:border-white/10 font-bold text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--brand-1))]/20 focus:border-[hsl(var(--brand-1))]/30 transition-all duration-300"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                  
                  <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[hsl(var(--brand-1))]/20 hover:shadow-[hsl(var(--brand-1))]/40 relative overflow-hidden group">
                    <span className="relative z-10">Add Manual Entry</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </form>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid md:grid-cols-2 gap-8 diet-animate">
            <GlassCard variant="premium" className="p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Calorie Trend</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">7-day metabolic analysis</p>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorDiet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--brand-1))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--brand-1))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDietStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="hsl(var(--brand-1))"/>
                        <stop offset="100%" stopColor="hsl(var(--brand-2))"/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                        background: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="kcal" 
                      stroke="url(#colorDietStroke)" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorDiet)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard variant="premium" className="p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-2))] to-[hsl(var(--brand-3))] text-white flex items-center justify-center shadow-lg">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black">Macro Distribution</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Nutrient balance analysis</p>
                </div>
              </div>
              <div className="flex items-center justify-center h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie 
                      data={macroData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      dataKey="value"
                      animationBegin={300}
                      animationDuration={1000}
                    >
                      {macroData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(var(--brand-${index + 1}))`}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 8px 20px -4px rgba(0,0,0,0.1)',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Macro breakdown */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                {macroData.map((macro, index) => (
                  <div key={macro.name} className="text-center">
                    <div className="text-lg font-black text-slate-900 dark:text-white">{Math.round(macro.value)}g</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{macro.name}</div>
                    <div 
                      className="h-1 rounded-full mt-2" 
                      style={{ backgroundColor: `hsl(var(--brand-${index + 1}))` }}
                    />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="space-y-8 diet-animate">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[hsl(var(--brand-1))]" />
                  Professional Plans
                </h3>
                <p className="text-sm text-slate-500 font-medium">AI-curated nutrition programs</p>
              </div>
              <label className="cursor-pointer px-6 py-3 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[hsl(var(--brand-1))]/20 hover:shadow-[hsl(var(--brand-1))]/40 relative overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Plan
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <input type="file" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.success("Diet plan analysis initiated... ✨");
                  }
                }} />
              </label>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <GlassCard key={plan.id} variant="interactive" className="p-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black mb-2 text-slate-900 dark:text-white group-hover:text-[hsl(var(--brand-1))] transition-colors duration-300">{plan.title}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(plan.assigned_date)}
                  </p>
                  <a 
                    href={plan.file_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[hsl(var(--brand-1))] font-black text-[10px] uppercase tracking-widest hover:gap-3 transition-all group-hover:text-[hsl(var(--brand-2))]"
                  >
                    Download Plan 
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </a>
                </GlassCard>
              ))}
              
              {plans.length === 0 && (
                <div className="md:col-span-3">
                  <GlassCard variant="interactive" className="p-12 text-center border-dashed border-2 border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/50 to-white/30 dark:from-slate-900/50 dark:to-black/30">
                    <div className="space-y-4">
                      <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-[hsl(var(--brand-1))]/10 to-[hsl(var(--brand-2))]/10 text-[hsl(var(--brand-1))] flex items-center justify-center mx-auto shadow-lg">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No diet plans uploaded yet</p>
                      <p className="text-slate-500 text-sm">Upload a professional nutrition plan to get started</p>
                    </div>
                  </GlassCard>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto px-4 py-8 custom-scrollbar">
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-8 md:p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 group">
              <button onClick={resetScanner} className="absolute top-10 right-10 p-4 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-rose-500 hover:scale-110 active:scale-95 backdrop-blur-xl border border-white/10 z-50">
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col md:flex-row gap-12">
                {/* Left: Image Upload/Preview */}
                <div className="md:w-1/2 space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-[hsl(var(--brand-1))]/20 to-[hsl(var(--brand-2))]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[hsl(var(--brand-1))] border border-[hsl(var(--brand-1))]/20 backdrop-blur-sm">
                      <Brain className="w-3 h-3 animate-pulse" />
                      Neural Analysis
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter">AI Analysis.</h3>
                    <p className="text-slate-300 font-medium leading-relaxed">Select a photo of your meal for high-precision macro detection powered by advanced machine learning.</p>
                  </div>

                  <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-br from-slate-800/50 to-black/50 border-2 border-dashed border-white/20 flex flex-col items-center justify-center group backdrop-blur-sm">
                    {scanImage ? (
                      <>
                        <img src={scanImage} alt="Preview" className="w-full h-full object-cover" />
                        {scanning && (
                          <div className="absolute inset-0 bg-[#0f172a]/90 flex flex-col items-center justify-center backdrop-blur-sm p-8">
                            <div className="relative mb-6">
                              <div className="w-24 h-24 border-4 border-[hsl(var(--brand-1))] border-t-transparent rounded-full animate-spin" />
                              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-[hsl(var(--brand-1))] animate-pulse" />
                            </div>
                            <p className="text-white font-black text-lg uppercase tracking-[0.2em] mb-2">Analyzing Your Plate</p>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                              {analysisStage === "initializing" && "Initializing neural network..."}
                              {analysisStage === "analyzing" && "Processing image data..."}
                              {analysisStage === "identifying" && "Detecting food items..."}
                              {analysisStage === "calculating" && "Computing nutritional values..."}
                              {analysisStage === "finalizing" && "Finalizing results..."}
                              {!["initializing", "analyzing", "identifying", "calculating", "finalizing"].includes(analysisStage) && "Please wait..."}
                            </p>
                            <div className="mt-6 flex gap-1.5">
                              {[...Array(5)].map((_, i) => (
                                <div 
                                  key={i} 
                                  className="w-2 h-2 bg-[hsl(var(--brand-1))] rounded-full animate-pulse"
                                  style={{ animationDelay: `${i * 0.15}s` }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] shadow-[0_0_15px_hsl(var(--brand-1)))] animate-[scan_2s_infinite_linear]" />
                      </>
                    ) : (
                      <div className="text-center p-8 space-y-6">
                         <div className="w-20 h-20 rounded-[2rem] bg-[hsl(var(--brand-1))]/10 text-[hsl(var(--brand-1))] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-xl shadow-[hsl(var(--brand-1))]/20">
                           <Camera className="w-10 h-10" />
                         </div>
                         <div className="space-y-3">
                            <button onClick={() => scanInputRef.current?.click()} className="block w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-[hsl(var(--brand-1))]/20 hover:scale-105 active:scale-95 transition-all relative overflow-hidden group">
                             <span className="relative z-10">Choose Image</span>
                             <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">or</p>
                            <button onClick={() => cameraInputRef.current?.click()} className="w-full px-8 py-4 rounded-2xl bg-white/5 border border-white/20 text-white font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center gap-2">
                              <Camera className="w-4 h-4" />
                              Take Photo
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
                         <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => {
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
                      className="w-full py-5 rounded-3xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-[hsl(var(--brand-1))]/20 hover:scale-105 active:scale-95 transition-all relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        Analyze Plate
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  )}

                  {scanResult && scanItems && scanItems.length > 0 && (
                    <div className="space-y-4 p-6 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/40 animate-in slide-in-from-bottom-8 duration-700">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[hsl(var(--brand-1))]/20 text-[hsl(var(--brand-1))] flex items-center justify-center shadow-inner">
                          <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                          Identified Dishes
                        </h4>
                      </div>
                      
                      <div className="space-y-3 pl-11">
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">
                          Based on visual analysis, your plate contains:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {scanItems.map((item: any, idx: number) => (
                            <span key={idx} className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-bold border border-white/5 shadow-sm">
                              {item.name}
                            </span>
                          ))}
                        </div>
                        {scanItems.some((i: any) => i.reasoning) && (
                          <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5 text-xs text-slate-400 italic leading-relaxed">
                            <span className="text-[hsl(var(--brand-2))] font-bold not-italic mr-1">Portions:</span>
                            {scanItems.map((item: any) => item.reasoning).filter(Boolean).join(" • ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Results */}
                <div className="md:w-1/2">
{scanning ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-8 text-center">
                         <div className="relative">
                           <Sparkles className="w-20 h-20 text-[hsl(var(--brand-1))] animate-pulse" />
                           <div className="absolute inset-0 w-20 h-20 border-4 border-[hsl(var(--brand-1))] border-t-transparent rounded-full animate-spin" />
                         </div>
                         <div className="space-y-3">
                           <h4 className="text-3xl font-black italic">Analyzing Plate...</h4>
                           <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                             {analysisStage === "initializing" && "Initializing Neural Network..."}
                             {analysisStage === "analyzing" && "Processing Image & Visual Data..."}
                             {analysisStage === "identifying" && "Identifying Food Items..."}
                             {analysisStage === "calculating" && "Calculating Nutritional Values..."}
                             {analysisStage === "finalizing" && "Compiling Results..."}
                           </p>
                         </div>
                         <div className="w-full max-w-xs space-y-2">
                           <div className="flex gap-1.5 justify-center">
                             {["initializing", "analyzing", "identifying", "calculating", "finalizing"].map((stage, i) => (
                               <div key={stage} className="flex items-center gap-1.5">
                                 <div 
                                   className={`w-3 h-3 rounded-full transition-all duration-500 ${
                                     analysisStage === stage ? "bg-[hsl(var(--brand-1))] scale-125 shadow-lg shadow-[hsl(var(--brand-1))]/50" :
                                     ["initializing", "analyzing", "identifying", "calculating", "finalizing"].indexOf(analysisStage) > i ? "bg-emerald-400" :
                                     "bg-slate-700"
                                   }`}
                                 />
                                 {i < 4 && <div className={`w-6 h-0.5 ${["initializing", "analyzing", "identifying", "calculating", "finalizing"].indexOf(analysisStage) > i ? "bg-emerald-400" : "bg-slate-700"}`} />}
                               </div>
                             ))}
                           </div>
                           <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                             <span>Detect</span>
                             <span>Calc</span>
                             <span>Done</span>
                           </div>
                         </div>
                         <div className="px-4 py-3 rounded-xl bg-[hsl(var(--brand-1))]/10 border border-[hsl(var(--brand-1))]/20 text-xs font-bold text-[hsl(var(--brand-1))]">
                           AI is examining your plate for all food items...
                         </div>
                      </div>
                    ) : scanResult ? (
<div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                         <div className="space-y-2">
                           <div className="flex items-center gap-2 text-[hsl(var(--brand-1))] font-black text-[10px] uppercase tracking-widest">
                             <CheckCircle2 className="w-3 h-3" />
                             Analysis Complete
                           </div>
                           <h3 className="text-4xl font-black tracking-tighter">{scanResult.name}</h3>
                           <p className="text-slate-400 font-bold text-sm">Serving: {scanResult.serving_size || "1 portion"}</p>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                           <ResultStat label="Calories" value={scanResult.kcal} suffix="kcal" icon={Flame} color="emerald" />
                           <ResultStat label="Protein" value={scanResult.protein_g} suffix="g" icon={Dumbbell} color="blue" />
                           <ResultStat label="Carbs" value={scanResult.carbs_g} suffix="g" icon={Activity} color="amber" />
                           <ResultStat label="Fat" value={scanResult.fat_g} suffix="g" icon={Target} color="rose" />
                         </div>



                         {/* Vitamins & Minerals Section */}
                        <div className="space-y-6">
                          {scanResult.vitamins && scanResult.vitamins.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vitamins Detected</h4>
                              <div className="flex flex-wrap gap-2">
                                {scanResult.vitamins.map((v, i) => (
                                  <span key={i} className="px-3 py-1.5 rounded-xl bg-[hsl(var(--brand-1))]/10 text-[hsl(var(--brand-1))] border border-[hsl(var(--brand-1))]/20 text-[10px] font-bold hover:scale-105 transition-transform duration-300">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {scanResult.minerals && scanResult.minerals.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Minerals Detected</h4>
                              <div className="flex flex-wrap gap-2">
                                {scanResult.minerals.map((m, i) => (
                                  <span key={i} className="px-3 py-1.5 rounded-xl bg-[hsl(var(--brand-2))]/10 text-[hsl(var(--brand-2))] border border-[hsl(var(--brand-2))]/20 text-[10px] font-bold hover:scale-105 transition-transform duration-300">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 italic text-sm text-white/80">
                          "{scanResult.desc || "Analysis complete. Ready for diary entry."}"
                        </div>

<div className="flex gap-4 pt-4">
                           <button 
                             onClick={resetScanner}
                             className="flex-1 py-4 rounded-2xl border border-white/20 font-black text-xs uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm"
                           >
                             Scan Another
                           </button>
                           {scanItems.length > 0 ? (
                             <button 
                               onClick={() => {
                                 scanItems.forEach(item => {
                                   addFoodEntry({ 
                                     name: item.name, 
                                     kcal: item.kcal, 
                                     protein_g: item.protein, 
                                     carbs_g: item.carbs, 
                                     fat_g: item.fat, 
                                     meal_time: scanMealTime 
                                   });
                                 });
                                 resetScanner();
                               }}
                               className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-[hsl(var(--brand-1))]/20 hover:scale-105 active:scale-95 transition-all relative overflow-hidden group"
                             >
                               <span className="relative z-10">Add All {scanItems.length} Items</span>
                               <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                             </button>
                           ) : (
                             <button 
                               onClick={() => addFoodEntry({ 
                                 name: scanResult.name, 
                                 kcal: scanResult.kcal, 
                                 protein_g: scanResult.protein_g, 
                                 carbs_g: scanResult.carbs_g, 
                                 fat_g: scanResult.fat_g, 
                                 vitamins: scanResult.vitamins,
                                 minerals: scanResult.minerals,
                                 meal_time: scanMealTime 
                               })}
                               className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-[hsl(var(--brand-1))]/20 hover:scale-105 active:scale-95 transition-all relative overflow-hidden group"
                             >
                               <span className="relative z-10">Add to Diary</span>
                               <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                             </button>
                           )}
                         </div>
                     </div>
                   ) : showManualFallback ? (
                      <div className="space-y-8">
                         <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 flex items-center gap-4 backdrop-blur-sm">
                            <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
                            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Auto-detection failed. Please verify the photo quality or enter manually below.</p>
                         </div>
                         <div className="space-y-6">
                            <h4 className="text-xl font-black uppercase tracking-widest bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent">Manual Entry</h4>
                            <div className="grid gap-4">
                               <input 
                                 value={manualFood.name} onChange={e => setManualFood({...manualFood, name: e.target.value})}
                                 placeholder="Food Name" className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold outline-none text-white placeholder:text-white/50 focus:ring-2 focus:ring-[hsl(var(--brand-1))]/50 transition-all"
                               />
                               <div className="grid grid-cols-2 gap-4">
                                 <input 
                                   type="number" value={manualFood.kcal} onChange={e => setManualFood({...manualFood, kcal: parseInt(e.target.value)})}
                                   placeholder="kcal" className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold outline-none text-white placeholder:text-white/50 focus:ring-2 focus:ring-[hsl(var(--brand-1))]/50 transition-all"
                                 />
                                 <input 
                                   type="number" value={manualFood.protein_g} onChange={e => setManualFood({...manualFood, protein_g: parseInt(e.target.value)})}
                                   placeholder="protein" className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 font-bold outline-none text-white placeholder:text-white/50 focus:ring-2 focus:ring-[hsl(var(--brand-1))]/50 transition-all"
                                 />
                               </div>
                            </div>
                            <button onClick={() => addFoodEntry(manualFood)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-1))] to-[hsl(var(--brand-2))] text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-[hsl(var(--brand-1))]/20 hover:scale-105 active:scale-95 transition-all relative overflow-hidden group">
                              <span className="relative z-10">Save Manual Entry</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                         </div>
                      </div>
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/20 rounded-[3rem] bg-white/5 backdrop-blur-sm">
                        <ScanLine className="w-16 h-16 text-[hsl(var(--brand-1))] mb-6 animate-pulse" />
                        <p className="text-sm text-white/70 font-bold uppercase tracking-widest">Awaiting Visual Protocol</p>
                        <p className="text-xs text-white/50 mt-2">Upload an image to begin AI analysis</p>
                     </div>
                   )}
                </div>
              </div>
            </div>
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
    emerald: `text-emerald-400 bg-emerald-500/10 border-emerald-500/20`,
    blue: `text-sky-400 bg-sky-500/10 border-sky-500/20`,
    amber: `text-amber-400 bg-amber-500/10 border-amber-500/20`,
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };
  return (
    <div className="p-6 rounded-[2.5rem] bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center text-center group hover:scale-105 transition-transform duration-500">
       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-2xl transition-transform duration-500 group-hover:rotate-12", colors[color])}>
         <Icon className="w-6 h-6" />
       </div>
       <div className="text-3xl font-black tracking-tighter transition-transform duration-500 group-hover:scale-110">
         {value}
         <span className="text-xs ml-1 text-slate-500 font-bold uppercase tracking-widest">{suffix}</span>
       </div>
       <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">{label}</div>
    </div>
  );
}

function MacroPill({ label, value, color }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-all duration-300">
       <div className={cn("w-2 h-2 rounded-full", color)} style={{ boxShadow: `0 0 10px currentColor` }} />
       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
         <span className="text-slate-500">{label}:</span> {value}g
       </span>
    </div>
  );
}