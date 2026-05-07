import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { 
  Apple, FileText, Plus, Sparkles, Trash2, Upload, Wand2, Camera, 
  X, Loader2, Zap, ScanLine, ChevronRight, Target, Flame, 
  Dumbbell, Coffee, UtensilsCrossed, Salad, Sun, Moon, Eye
} from "lucide-react";
import { toast } from "sonner";
import { today } from "@/lib/dateUtil";

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

export default function Diet() {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Core data states
  const [foods, setFoods] = useState<FoodLog[]>([]);
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Manual entry
  const [newFood, setNewFood] = useState({ name: "", kcal: "", meal_time: "Lunch" });
  
  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanMealTime, setScanMealTime] = useState("Lunch");
  
  // Refs for file inputs
  const scanInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const planInputRef = useRef<HTMLInputElement>(null);
  
  // Load food logs and diet plans for today
  const loadData = async () => {
    if (!user) return;
    
    const [foodRes, planRes] = await Promise.all([
      supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today())
        .order("created_at", { ascending: false }),
      supabase
        .from("diet_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("assigned_date", { ascending: false }),
    ]);
    
    if (foodRes.data) setFoods(foodRes.data as FoodLog[]);
    if (planRes.data) setPlans(planRes.data as DietPlan[]);
  };
  
  useEffect(() => {
    loadData();
  }, [user]);
  
  // Calculate totals
  const totalKcal = foods.reduce((sum, f) => sum + (f.kcal || 0), 0);
  const totalProtein = foods.reduce((sum, f) => sum + (f.protein_g || 0), 0);
  const totalCarbs = foods.reduce((sum, f) => sum + (f.carbs_g || 0), 0);
  const totalFat = foods.reduce((sum, f) => sum + (f.fat_g || 0), 0);
  const targetCalories = profile?.daily_calorie_goal || 2000;
  const calorieProgress = Math.min(100, (totalKcal / targetCalories) * 100);
  
  // AI meal suggestions
  const getAiSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meal-suggest", {
        body: {
          goal: profile?.goal,
          calorie_goal: profile?.daily_calorie_goal,
          gender: profile?.gender,
          current_kcal: totalKcal,
        },
      });
      if (error) throw error;
      setSuggestions(data.meals || []);
      toast.success("Fresh meal ideas ready! 🍽️");
    } catch (err: any) {
      toast.error(err.message || "Couldn't get AI suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };
  
  // Add AI suggested meal to diary
  const addSuggestionToDiary = async (meal: Suggestion) => {
    if (!user) return;
    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      name: meal.name,
      kcal: meal.kcal,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      vitamins: meal.vitamins,
      minerals: meal.minerals,
      meal_time: meal.meal_time,
      date: today(),
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Added ${meal.name} to diary`);
      loadData();
    }
  };
  
  // Manual food entry
  const addManualFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFood.name || !newFood.kcal) return;
    
    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      name: newFood.name,
      kcal: parseInt(newFood.kcal),
      meal_time: newFood.meal_time,
      date: today(),
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      setNewFood({ name: "", kcal: "", meal_time: "Lunch" });
      loadData();
      toast.success("Food added to diary");
    }
  };
  
  // Delete food log
  const deleteFood = async (id: string) => {
    await supabase.from("food_logs").delete().eq("id", id);
    loadData();
    toast.success("Entry removed");
  };
  
  // Upload diet plan
  const uploadDietPlan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("diet-plans")
      .upload(filePath, file);
      
    if (uploadError) {
      toast.error(uploadError.message);
      return;
    }
    
    const { data: urlData } = supabase.storage.from("diet-plans").getPublicUrl(filePath);
    
    const { error: insertError } = await supabase.from("diet_plans").insert({
      user_id: user.id,
      title: file.name,
      file_url: urlData.publicUrl,
    });
    
    if (insertError) {
      toast.error(insertError.message);
    } else {
      toast.success("Diet plan uploaded successfully");
      loadData();
    }
  };
  
  // Handle image selection for scanner
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }
    
    setScanFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScanImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    setScanResult(null);
  };
  
  // Analyze food image with AI
  const analyzeFoodImage = async () => {
    if (!scanFile) return;
    setScanning(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session.session?.access_token;
      if (!accessToken) throw new Error("No auth token");
      
      // Convert to base64 without prefix
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(scanFile);
      });
      
      const { data, error } = await supabase.functions.invoke("ai-food-scan", {
        body: { image: base64, mime_type: scanFile.type },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (error) throw error;
      if (data?.error === "not_food") {
        toast.error("Could not detect food in this image");
        return;
      }
      
      setScanResult(data as ScanResult);
      toast.success(`Detected: ${data.name} ✨`);
    } catch (err: any) {
      console.error(err);
      toast.error("AI scan unavailable. Please try manual entry.");
    } finally {
      setScanning(false);
    }
  };
  
  // Add scanned food to diary
  const addScannedFood = async () => {
    if (!scanResult || !user) return;
    
    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      name: scanResult.name,
      kcal: scanResult.kcal,
      protein_g: scanResult.protein_g,
      carbs_g: scanResult.carbs_g,
      fat_g: scanResult.fat_g,
      vitamins: scanResult.vitamins,
      minerals: scanResult.minerals,
      meal_time: scanMealTime,
      date: today(),
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Scanned food added to diary!");
      setScanResult(null);
      setScanImage(null);
      setScanFile(null);
      setShowScanner(false);
      loadData();
    }
  };
  
  const resetScanner = () => {
    setScanImage(null);
    setScanFile(null);
    setScanResult(null);
    setScanning(false);
  };
  
  // Get color for meal time
  const getMealColor = (meal: string) => {
    switch (meal.toLowerCase()) {
      case "breakfast": return "from-amber-400 to-orange-500";
      case "lunch": return "from-emerald-400 to-teal-500";
      case "dinner": return "from-indigo-400 to-purple-500";
      case "snack": return "from-rose-400 to-pink-500";
      default: return "from-slate-400 to-gray-500";
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-8">
      {/* Hero Section - Calorie & Macro Dashboard */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-full blur-2xl -ml-24 -mb-24" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-emerald-300 flex items-center gap-2">
                <Sun className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Nutrition Dashboard</h1>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalProtein}g</p>
                <p className="text-xs text-white/70">Protein</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalCarbs}g</p>
                <p className="text-xs text-white/70">Carbs</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{totalFat}g</p>
                <p className="text-xs text-white/70">Fat</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-5xl md:text-6xl font-black text-white">{totalKcal}</span>
            <span className="text-xl text-white/60">/ {targetCalories} kcal</span>
          </div>
          
          <div className="relative h-4 bg-white/20 rounded-full overflow-hidden mt-2 mb-4">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${calorieProgress}%` }}
            />
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{Math.round((totalKcal / targetCalories) * 100)}% of daily goal</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>{profile?.goal === "weight_loss" ? "Weight Loss Focus" : profile?.goal === "muscle_gain" ? "Muscle Gain" : "Balanced Nutrition"}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Food Scanner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                <Camera className="w-5 h-5 text-violet-500" />
                AI Food Scanner
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Snap a photo to get instant nutrition insights</p>
            </div>
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-lg hover:scale-105 transition-all"
            >
              {showScanner ? <X className="w-4 h-4" /> : <ScanLine className="w-4 h-4" />}
              {showScanner ? "Close Scanner" : "Scan Food"}
            </button>
          </div>
        </div>
        
        {showScanner && (
          <div className="p-6 pt-4 animate-in slide-in-from-top-2 duration-300">
            {!scanImage ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center gap-5 bg-slate-50 dark:bg-slate-800/30">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950 dark:to-fuchsia-950 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
                  Take a photo of your meal or upload from gallery
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm flex items-center gap-2 shadow-md"
                  >
                    <Camera className="w-4 h-4" /> Take Photo
                  </button>
                  <button
                    onClick={() => scanInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-sm flex items-center gap-2 shadow-sm"
                  >
                    <Upload className="w-4 h-4" /> Gallery
                  </button>
                </div>
                <input 
                  ref={cameraInputRef} 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleImageSelect} 
                  className="hidden" 
                />
                <input 
                  ref={scanInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageSelect} 
                  className="hidden" 
                />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img src={scanImage} alt="Food to scan" className="w-full h-56 md:h-72 object-cover" />
                  <button
                    onClick={resetScanner}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  
                  {!scanResult && !scanning && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                      <button
                        onClick={analyzeFoodImage}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                      >
                        <Zap className="w-4 h-4" /> Analyze Food
                      </button>
                    </div>
                  )}
                  
                  {scanning && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                      <p className="text-white font-semibold text-sm">Analyzing nutrition...</p>
                    </div>
                  )}
                </div>
                
                {scanResult && (
                  <div className="rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 p-6 border border-rose-200 dark:border-rose-800/50 animate-in fade-in duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">{scanMealTime}</span>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{scanResult.name}</h3>
                        {scanResult.serving_size && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{scanResult.serving_size}</p>
                        )}
                      </div>
                      <button onClick={() => setScanResult(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 mb-5">
                      <MacroPill label="KCAL" value={scanResult.kcal} color="bg-white dark:bg-slate-800" textColor="text-rose-600 dark:text-rose-400" />
                      <MacroPill label="PROTEIN" value={scanResult.protein_g} unit="g" color="bg-white dark:bg-slate-800" textColor="text-emerald-600 dark:text-emerald-400" />
                      <MacroPill label="CARBS" value={scanResult.carbs_g} unit="g" color="bg-white dark:bg-slate-800" textColor="text-amber-600 dark:text-amber-400" />
                      <MacroPill label="FAT" value={scanResult.fat_g} unit="g" color="bg-white dark:bg-slate-800" textColor="text-sky-600 dark:text-sky-400" />
                    </div>
                    
                    {scanResult.vitamins?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {[...scanResult.vitamins, ...(scanResult.minerals || [])].slice(0, 8).map((nutrient) => (
                          <span key={nutrient} className="px-3 py-1 text-xs font-medium bg-white/70 dark:bg-slate-800/70 rounded-full text-slate-600 dark:text-slate-300 shadow-sm">
                            {nutrient}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <button
                        onClick={addScannedFood}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                      >
                        <Plus className="w-4 h-4" /> Add to Diary
                      </button>
                      <select
                        value={scanMealTime}
                        onChange={(e) => setScanMealTime(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium outline-none focus:ring-2 focus:ring-rose-400"
                      >
                        {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
                          <option key={meal}>{meal}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* AI Meal Suggestions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Meal Ideas
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Personalized for your {profile?.goal === "weight_loss" ? "weight loss" : profile?.goal || "nutrition"} goals
            </p>
          </div>
          <button
            onClick={getAiSuggestions}
            disabled={loadingSuggestions}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-lg disabled:opacity-60 transition-all"
          >
            <Wand2 className="w-4 h-4" />
            {loadingSuggestions ? "Generating..." : "Get Suggestions"}
          </button>
        </div>
        
        {suggestions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Tap "Get Suggestions" for AI-powered meal ideas</p>
            <p className="text-sm mt-1">Based on your goals and today's intake</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {suggestions.map((meal, idx) => (
              <div key={idx} className="group rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${getMealColor(meal.meal_time)} text-white mb-2`}>
                      {meal.meal_time}
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{meal.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{meal.desc}</p>
                    <div className="flex gap-3 mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      <span>{meal.kcal} kcal</span>
                      <span>•</span>
                      <span>{meal.protein_g}g P</span>
                      <span>•</span>
                      <span>{meal.carbs_g}g C</span>
                      <span>•</span>
                      <span>{meal.fat_g}g F</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {[...(meal.vitamins || []), ...(meal.minerals || [])].slice(0, 4).map((nutrient) => (
                    <span key={nutrient} className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {nutrient}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => addSuggestionToDiary(meal)}
                  className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2 group-hover:from-emerald-500 group-hover:to-teal-500 group-hover:text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Diary
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Today's Diary & Manual Entry */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-5">
          <Apple className="w-5 h-5 text-rose-500" />
          Today's Food Diary
        </h2>
        
        <form onSubmit={addManualFood} className="flex flex-wrap gap-3 mb-6">
          <input
            value={newFood.name}
            onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
            placeholder="Food name"
            className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
          />
          <input
            value={newFood.kcal}
            onChange={(e) => setNewFood({ ...newFood, kcal: e.target.value })}
            type="number"
            placeholder="Calories"
            className="w-28 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <select
            value={newFood.meal_time}
            onChange={(e) => setNewFood({ ...newFood, meal_time: e.target.value })}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {["Breakfast", "Lunch", "Dinner", "Snack"].map((meal) => (
              <option key={meal}>{meal}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
        
        {foods.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Coffee className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No meals logged yet today</p>
            <p className="text-sm mt-1">Add your first meal above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {["Breakfast", "Lunch", "Dinner", "Snack"].map((mealType) => {
              const mealFoods = foods.filter(f => f.meal_time === mealType);
              if (mealFoods.length === 0) return null;
              
              return (
                <div key={mealType} className="mb-4">
                  <div className={`inline-flex text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${getMealColor(mealType)} text-white mb-2`}>
                    {mealType}
                  </div>
                  {mealFoods.map((food) => (
                    <div key={food.id} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 group">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <Apple className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-white">{food.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {food.kcal} kcal
                          {food.protein_g ? ` · ${food.protein_g}g protein` : ""}
                          {food.carbs_g ? ` · ${food.carbs_g}g carbs` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteFood(food.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-2 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Diet Plans Library */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-500" />
            Diet Plans Library
          </h2>
          <button
            onClick={() => planInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 hover:shadow-md transition-all"
          >
            <Upload className="w-4 h-4" /> Upload Plan
          </button>
          <input ref={planInputRef} type="file" accept="image/*,.pdf" onChange={uploadDietPlan} className="hidden" />
        </div>
        
        {plans.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No diet plans uploaded yet</p>
            <p className="text-sm mt-1">Upload PDFs or images of your meal plans</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {plans.map((plan) => (
              <a
                key={plan.id}
                href={plan.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950 dark:to-indigo-950 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-slate-800 dark:text-white">{plan.title}</p>
                  <p className="text-xs text-slate-500">{new Date(plan.assigned_date).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function MacroPill({ label, value, unit = "", color, textColor }: { 
  label: string; 
  value: number; 
  unit?: string;
  color: string; 
  textColor: string;
}) {
  return (
    <div className={`rounded-xl p-3 ${color} border border-slate-200 dark:border-slate-700 text-center shadow-sm`}>
      <p className={`font-black text-xl ${textColor}`}>{value}{unit}</p>
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}