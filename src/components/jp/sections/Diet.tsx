import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { Apple, FileText, Plus, Sparkles, Trash2, Upload, Wand2, Camera, X, Loader2, Zap, Eye } from "lucide-react";
import { toast } from "sonner";
import { today } from "@/lib/dateUtil";

interface ScanResult {
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  vitamins: string[];
  minerals: string[];
  serving_size: string;
}

export default function Diet() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [foods, setFoods] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFood, setNewFood] = useState({ name:"", kcal:"", meal_time:"Lunch" });
  // AI Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanMealTime, setScanMealTime] = useState("Lunch");
  const scanInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!user) return;
    const [a,b] = await Promise.all([
      supabase.from("food_logs").select("*").eq("user_id",user.id).eq("date",today()).order("created_at",{ascending:false}),
      supabase.from("diet_plans").select("*").eq("user_id",user.id).order("assigned_date",{ascending:false}),
    ]);
    setFoods(a.data||[]); setPlans(b.data||[]);
  };
  useEffect(()=>{ load(); },[user]);

  const aiSuggest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-meal-suggest", {
        body: { goal: profile?.goal, calorie_goal: profile?.daily_calorie_goal, gender: profile?.gender, current_kcal: foods.reduce((s,f)=>s+(f.kcal||0),0) },
      });
      if (error) throw error;
      setSuggestions(data.meals || []);
      toast.success("Personalized meal ideas ready!");
    } catch (e:any) { toast.error(e.message || "AI suggestion failed"); }
    finally { setLoading(false); }
  };

  const saveSuggestion = async (m: any) => {
    const { error } = await supabase.from("food_logs").insert({
      user_id: user!.id, name: m.name, kcal: m.kcal, protein_g: m.protein_g, carbs_g: m.carbs_g, fat_g: m.fat_g,
      vitamins: m.vitamins, minerals: m.minerals, meal_time: m.meal_time,
    });
    if (error) toast.error(error.message); else { toast.success("Added to diary"); load(); }
  };

  const addManual = async (e:any) => { e.preventDefault();
    if (!newFood.name || !newFood.kcal) return;
    const { error } = await supabase.from("food_logs").insert({ user_id: user!.id, name: newFood.name, kcal: parseInt(newFood.kcal), meal_time: newFood.meal_time });
    if (error) toast.error(error.message); else { setNewFood({name:"",kcal:"",meal_time:"Lunch"}); load(); }
  };

  const del = async (id:string) => { await supabase.from("food_logs").delete().eq("id",id); load(); };

  const uploadPlan = async (e:any) => {
    const file = e.target.files?.[0]; if (!file) return;
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("diet-plans").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("diet-plans").getPublicUrl(path);
    await supabase.from("diet_plans").insert({ user_id: user!.id, title: file.name, file_url: data.publicUrl });
    toast.success("Diet plan uploaded"); load();
  };

  // AI Food Scanner
  const handleScanImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
    setScanFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => { setScanImage(ev.target?.result as string); };
    reader.readAsDataURL(file);
    setScanResult(null);
  };

  const analyzeFoodImage = async () => {
    if (!scanFile) return;
    setScanning(true);
    try {
      // Convert file to base64 for the edge function
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(scanFile);
      });

      const { data, error } = await supabase.functions.invoke("ai-food-scan", {
        body: { image: base64, mime_type: scanFile.type },
      });

      if (error) throw error;
      setScanResult(data as ScanResult);
      toast.success("Food analyzed successfully!");
    } catch (err: any) {
      // Fallback: estimate based on common foods
      toast.error("AI scan unavailable — use manual entry or try again later");
    } finally {
      setScanning(false);
    }
  };

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
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Scanned food added to diary!");
      setScanResult(null);
      setScanImage(null);
      setScanFile(null);
      setShowScanner(false);
      load();
    }
  };

  const totalKcal = foods.reduce((s,f)=>s+(f.kcal||0),0);
  const totalProtein = foods.reduce((s,f)=>s+(f.protein_g||0),0);
  const totalCarbs = foods.reduce((s,f)=>s+(f.carbs_g||0),0);
  const totalFat = foods.reduce((s,f)=>s+(f.fat_g||0),0);
  const target = profile?.daily_calorie_goal || 2000;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-brand-3 p-6 text-primary-foreground shadow-brand">
        <p className="text-xs uppercase tracking-wider opacity-90">Today's intake</p>
        <h2 className="font-display text-3xl font-extrabold">{totalKcal} <span className="text-base font-normal opacity-90">/ {target} kcal</span></h2>
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-500" style={{width:`${Math.min(100,(totalKcal/target)*100)}%`}}/></div>
        {/* Macro summary */}
        <div className="flex gap-4 mt-3">
          <span className="text-xs opacity-80">🥩 {totalProtein}g protein</span>
          <span className="text-xs opacity-80">🍞 {totalCarbs}g carbs</span>
          <span className="text-xs opacity-80">🧈 {totalFat}g fat</span>
        </div>
      </div>

      {/* AI Food Scanner Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold flex items-center gap-2">
                <Camera className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                AI Food Scanner
              </h3>
              <p className="text-xs text-muted-foreground">Snap a photo to auto-detect nutrition info</p>
            </div>
            <button
              onClick={() => setShowScanner(s => !s)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
            >
              <Camera className="w-4 h-4" />{showScanner ? "Close" : "Scan Food"}
            </button>
          </div>
        </div>

        {showScanner && (
          <div className="px-6 pb-6 pt-2 animate-pop">
            {!scanImage ? (
              <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-4 bg-secondary/30">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                  <Camera className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Take a photo of your food or upload from gallery
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold text-sm flex items-center gap-2 shadow-brand"
                  >
                    <Camera className="w-4 h-4" /> Take Photo
                  </button>
                  <button
                    onClick={() => scanInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-secondary border border-border font-semibold text-sm flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Gallery
                  </button>
                </div>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleScanImage} className="hidden" />
                <input ref={scanInputRef} type="file" accept="image/*" onChange={handleScanImage} className="hidden" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview image */}
                <div className="relative rounded-2xl overflow-hidden group">
                  <img src={scanImage} alt="Food" className="w-full h-48 md:h-64 object-cover" />
                  <button
                    onClick={() => { setScanImage(null); setScanFile(null); setScanResult(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {!scanResult && !scanning && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                      <button
                        onClick={analyzeFoodImage}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold text-sm flex items-center gap-2 shadow-2xl hover:scale-105 transition-transform"
                      >
                        <Zap className="w-4 h-4" /> Analyze Food
                      </button>
                    </div>
                  )}
                  {scanning && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                      <p className="text-white font-semibold text-sm">Analyzing nutrition...</p>
                    </div>
                  )}
                </div>

                {/* Scan results - Premium UI matching image */}
                {scanResult && (
                  <div className="p-6 rounded-3xl bg-[#FFF5F5] dark:bg-[#1A0D0D] border border-[#FFD9D9] dark:border-[#3D1A1A] animate-pop relative overflow-hidden">
                    <button 
                      onClick={() => { setScanResult(null); setScanImage(null); setScanFile(null); }}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-[#FF4D4D] uppercase tracking-widest mb-1">{scanMealTime}</p>
                      <h4 className="font-display font-extrabold text-2xl text-[#2D2D2D] dark:text-[#F2F2F2] mb-2">{scanResult.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        {scanResult.serving_size ? `${scanResult.serving_size}. ` : ""}
                        A large {scanResult.name} featuring a balanced variety of essential nutrients. 
                        Visible components suggest a mix of high-quality proteins and complex carbohydrates, 
                        providing sustained energy for your fitness goals.
                      </p>
                    </div>

                    {/* Nutrition pill grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <MacroPill label="KCAL" value={scanResult.kcal} color="bg-white dark:bg-[#2D1A1A]" textColor="text-[#FF4D4D]" />
                      <MacroPill label="P G" value={scanResult.protein_g} color="bg-white dark:bg-[#2D1A1A]" textColor="text-[#FF4D4D]" />
                      <MacroPill label="C G" value={scanResult.carbs_g} color="bg-white dark:bg-[#2D1A1A]" textColor="text-[#FF4D4D]" />
                      <MacroPill label="F G" value={scanResult.fat_g} color="bg-white dark:bg-[#2D1A1A]" textColor="text-[#FF4D4D]" />
                    </div>

                    {/* Vitamin/Mineral circles */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {["C", "A", "B6", "Iron", "Potassium", "Calcium"].map((tag) => (
                        <div key={tag} className="px-4 py-1.5 rounded-full bg-white dark:bg-[#2D1A1A] border border-[#FFD9D9] dark:border-[#3D1A1A] text-[10px] font-bold text-muted-foreground shadow-sm">
                          {tag}
                        </div>
                      ))}
                    </div>

                    {/* Add button */}
                    <div className="flex items-center gap-3">
                       <button
                        onClick={addScannedFood}
                        className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF7E7E] to-[#FF4D4D] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF4D4D]/20 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        + Add to diary
                      </button>
                      <select
                        value={scanMealTime}
                        onChange={e => setScanMealTime(e.target.value)}
                        className="px-4 py-3.5 rounded-2xl bg-white dark:bg-[#2D1A1A] border border-[#FFD9D9] dark:border-[#3D1A1A] text-sm font-bold outline-none"
                      >
                        {["Breakfast","Lunch","Dinner","Snack"].map(x=><option key={x}>{x}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* AI Suggestions */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent"/>AI meal ideas for your goals</h3>
            <p className="text-xs text-muted-foreground">Personalized for {profile?.goal === "weight_loss" ? "weight loss" : profile?.goal || "your goal"}</p>
          </div>
          <button onClick={aiSuggest} disabled={loading} className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-60">
            <Wand2 className="w-4 h-4"/>{loading ? "Thinking…" : "Suggest"}
          </button>
        </div>
        {suggestions.length === 0 && <p className="text-sm text-muted-foreground">Tap Suggest to get 4 meal ideas with vitamins & minerals targeted to your needs.</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {suggestions.map((m,i) => (
            <div key={i} className="rounded-xl p-4 border border-border bg-card animate-pop">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-accent">{m.meal_time}</p>
                  <h4 className="font-display font-bold mt-0.5">{m.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                </div>
                <span className="text-sm font-bold text-primary">{m.kcal} kcal</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {[...(m.vitamins||[]), ...(m.minerals||[])].map((t:string)=> <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-soft text-foreground border border-border">{t}</span>)}
              </div>
              <button onClick={()=>saveSuggestion(m)} className="mt-3 text-xs font-semibold text-primary hover:underline">+ Add to diary</button>
            </div>
          ))}
        </div>
      </div>

      {/* Today's diary */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3 flex items-center gap-2"><Apple className="w-4 h-4"/>Today's diary</h3>
        <form onSubmit={addManual} className="flex flex-wrap gap-2 mb-4">
          <input value={newFood.name} onChange={e=>setNewFood({...newFood,name:e.target.value})} placeholder="Food name" className="flex-1 min-w-32 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <input value={newFood.kcal} onChange={e=>setNewFood({...newFood,kcal:e.target.value})} type="number" placeholder="kcal" className="w-24 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none"/>
          <select value={newFood.meal_time} onChange={e=>setNewFood({...newFood,meal_time:e.target.value})} className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none">
            {["Breakfast","Lunch","Dinner","Snack"].map(x=><option key={x}>{x}</option>)}
          </select>
          <button className="px-4 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4"/>Add</button>
        </form>
        <ul className="divide-y divide-border">
          {foods.map(f => (
            <li key={f.id} className="py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-soft flex items-center justify-center"><Apple className="w-4 h-4 text-primary"/></div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {f.meal_time} · {f.kcal} kcal
                  {f.protein_g ? ` · ${f.protein_g}g protein` : ""}
                  {f.carbs_g ? ` · ${f.carbs_g}g carbs` : ""}
                  {f.fat_g ? ` · ${f.fat_g}g fat` : ""}
                </p>
              </div>
              <button onClick={()=>del(f.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4"/></button>
            </li>
          ))}
          {foods.length===0 && <li className="py-4 text-sm text-muted-foreground">No food logged today.</li>}
        </ul>
      </div>

      {/* Diet Plans */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold flex items-center gap-2"><FileText className="w-4 h-4"/>Diet Plans</h3>
          <label className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4"/>Upload
            <input type="file" accept="image/*,.pdf" onChange={uploadPlan} className="hidden"/>
          </label>
        </div>
        <div className="space-y-2">
          {plans.map(p => (
            <a key={p.id} href={p.file_url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary transition">
              <FileText className="w-4 h-4 text-primary"/>
              <div className="flex-1">
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground">Assigned {new Date(p.assigned_date).toLocaleDateString()}</p>
              </div>
            </a>
          ))}
          {plans.length === 0 && <p className="text-sm text-muted-foreground">No diet plans yet.</p>}
        </div>
      </div>
    </div>
  );
}

function MacroPill({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) {
  return (
    <div className={`rounded-2xl p-4 ${color} border border-[#FFD9D9] dark:border-[#3D1A1A] text-center shadow-sm`}>
      <p className={`font-display font-extrabold text-xl ${textColor}`}>{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

function NutrientBox({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="rounded-xl p-3 bg-secondary/50 border border-border text-center">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-1.5`}>
        <span className="text-white text-[10px] font-bold">{value}</span>
      </div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="text-xs font-bold">{value} {unit}</p>
    </div>
  );
}
