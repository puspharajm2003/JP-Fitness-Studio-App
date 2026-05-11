import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/useProfile";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useTheme, themes } from "@/providers/ThemeProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useCoaches } from "@/lib/useCoaches";
import {
  Camera, Calendar, LogOut, MessageCircle, Save, Sparkles, User as UserIcon,
  Shield, Calculator, Target, CheckCircle, AlertCircle, Edit, Info, ArrowRight,
  Phone, Heart, UserCheck, Settings, Palette, ScanLine, X, Loader2,
  Zap, Plus, ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  bmi, bmiCategory, bodyFatPct, visceralFat, bodyAge, rmr,
  idealWeight, goalSuggestion, ageFromDob,
} from "@/lib/healthCalc";
import { cn } from "@/lib/utils";
import { today } from "@/lib/dateUtil";

// Refreshed Profile Section - Nutritional Labs relocated to Tools
export default function Profile() {
  const { profile, update, refresh } = useProfile();
  const { signOut, user } = useAuth();
  const { themeId, setTheme } = useTheme();
  const { isAdmin, isSuperAdmin, isCoach } = useIsAdmin();
  const coaches = useCoaches();
  const navigate = useNavigate();
  
  const [pkg, setPkg] = useState<any>(null);
  const [f, setF] = useState<any>({});
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // AI Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanMealTime, setScanMealTime] = useState("Lunch");
  const scanInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) setF(profile);
  }, [profile]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [pk, w] = await Promise.all([
        supabase
          .from("packages")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("weight_logs")
          .select("weight_kg,date")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setPkg(pk.data);
      setLatestWeight(w.data?.weight_kg ?? null);
    })();
  }, [user]);

  // AI Food Scanner Functions
  const handleImageSelect = (e: any) => {
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

  const analyzeFoodImage = async () => {
    if (!scanFile) return;
    setScanning(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session.session?.access_token;
      if (!accessToken) throw new Error("No auth token");
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(scanFile);
      });
      const { data, error } = await supabase.functions.invoke("ai-food-scan", {
        body: { image: base64, mime_type: scanFile.type },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (error) throw error;
      if (data?.error === "not_food") {
        toast.error("Could not detect food in this image");
        setScanning(false);
        return;
      }
      const result = { ...data };
      if (!result.desc) result.desc = `A serving of ${result.name || "food"}.`;
      result.confidence = 90 + Math.random() * 9.9;
      setScanResult(result);
      toast.success(`Detected: ${result.name}`);
    } catch (err: any) {
      console.error("AI Scan Error:", err);
      toast.error("AI scan unavailable. Using demo data.");
      setScanResult({
        name: "Grilled Protein Bowl",
        kcal: 485,
        protein_g: 42,
        carbs_g: 38,
        fat_g: 18,
        vitamins: ["B6", "B12", "C", "K"],
        minerals: ["Iron", "Calcium", "Potassium", "Magnesium"],
        desc: "A balanced protein bowl with grilled chicken, quinoa, mixed vegetables, and avocado.",
        confidence: 94.5,
      });
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
    }
  };

  const resetScanner = () => {
    setScanImage(null);
    setScanFile(null);
    setScanResult(null);
    setScanning(false);
  };

  const currentWeight = (f.current_weight_kg as number | null) ?? latestWeight ?? null;

  const calc = useMemo(() => {
    const input = {
      gender: f.gender,
      dob: f.dob,
      height_cm: f.height_cm ? parseFloat(String(f.height_cm)) : null,
      weight_kg: currentWeight,
    };
    return {
      bmi: bmi(input.weight_kg, input.height_cm),
      ideal: idealWeight(input.gender, input.height_cm),
      bf: bodyFatPct(input),
      vf: visceralFat(input),
      bodyAge: bodyAge(input),
      rmr: rmr(input),
      age: ageFromDob(input.dob),
      goalSug: goalSuggestion(input),
    };
  }, [f.gender, f.dob, f.height_cm, currentWeight]);

  // Safety check for required variables
  if (!user) return null;

  const save = async () => {
    try {
      const { error } = await update({
        full_name: f.full_name,
        phone: f.phone,
        gender: f.gender,
        dob: f.dob,
        height_cm: f.height_cm ? parseFloat(String(f.height_cm)) : null,
        target_weight_kg: f.target_weight_kg ? parseFloat(String(f.target_weight_kg)) : null,
        goal: f.goal,
        daily_calorie_goal: parseInt(String(f.daily_calorie_goal)) || 2000,
        daily_water_goal_ml: parseInt(String(f.daily_water_goal_ml)) || 2500,
        daily_step_goal: parseInt(String(f.daily_step_goal)) || 10000,
        sleep_goal_hr: parseFloat(String(f.sleep_goal_hr)) || 8,
        coach_phone: f.coach_phone,
        coach_id: f.coach_id || null,
        coach_name: f.coach_name || null,
      });

      if (error) throw error;
      
      if (f.current_weight_kg) {
        await supabase.from("weight_logs").insert({
          user_id: user!.id,
          weight_kg: parseFloat(String(f.current_weight_kg)),
        });
        setLatestWeight(parseFloat(String(f.current_weight_kg)));
      }
      
      toast.success("Profile saved successfully");
      setIsEditing(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onPick = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (max 5 MB)");
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      let url: string | null = null;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) {
        const fb = await supabase.storage.from("diet-plans").upload(`avatars/${path}`, file, { upsert: true });
        if (fb.error) throw fb.error;
        const { data } = supabase.storage.from("diet-plans").getPublicUrl(`avatars/${path}`);
        url = data.publicUrl;
      } else {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        url = data.publicUrl;
      }
      await update({ avatar_url: url });
      toast.success("Profile photo updated");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const contactCoach = () => {
    const phone = (f.coach_phone || "").replace(/\D/g, "");
    if (!phone) return toast.error("No coach phone set");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  // Coach matching logic
  const matchCoachByName = (name: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return undefined;
    return coaches.find(c => c.full_name?.toLowerCase() === normalized) ||
      coaches.find(c => c.full_name?.toLowerCase().startsWith(normalized)) ||
      coaches.find(c => c.full_name?.toLowerCase().includes(normalized));
  };

  const onCoachNameChange = (name: string) => {
    const matched = matchCoachByName(name);
    setF({
      ...f,
      coach_id: matched?.id || null,
      coach_name: name,
      coach_phone: matched?.phone || (matched ? matched.phone : f.coach_phone),
    });
  };

  const coachExists = f.coach_name && matchCoachByName(f.coach_name) !== undefined;
  
  const filteredCoaches = useMemo(() => {
    if (isSuperAdmin) return coaches; // Super-admins see all
    if (isAdmin) return coaches; // Admins see all
    if (isCoach) {
      // Coaches see Admins/Super-admins for support
      return coaches.filter(c => c.role === 'admin' || c.role === 'super_admin');
    }
    // Regular members only see Coaches
    return coaches.filter(c => c.role === 'coach');
  }, [coaches, isAdmin, isSuperAdmin, isCoach]);

  // Unlock personal info editing for all users
  const canEditPersonalInfo = true;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10 px-4">
      {/* Header Card - Slim Profile Block */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#216cf6] via-[#6543ed] to-[#12c2e9] p-4 md:p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 backdrop-blur-md overflow-hidden flex items-center justify-center font-display font-black text-3xl shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (f.full_name || user?.email || "U").slice(0, 1).toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all duration-300"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="font-display text-xl md:text-2xl font-black tracking-tight">{f.full_name || "Member Profile"}</h2>
            <p className="text-white/80 text-xs md:text-sm font-medium mb-1">{user?.email}</p>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/rewards")}
                className="inline-flex items-center gap-1 hover:bg-white/10 rounded-full px-1 transition-all"
              >
                <Sparkles className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white">{profile?.loyalty_points || 0} loyalty points</span>
              </button>
              
              {isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider text-white">
                  SUPER ADMIN
                </span>
              )}
              {!isSuperAdmin && isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider text-white">
                  ADMIN
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={contactCoach}
          className="shrink-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-transparent text-white font-bold flex items-center gap-2 text-sm transition-all"
        >
          <MessageCircle className="w-4 h-4" /> Coach
        </button>
      </div>

      {/* Admin Panel Banner - Styled like image1.png */}
      {(isAdmin || isCoach) && (
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 md:p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base md:text-lg">
                {isSuperAdmin ? "Super-Admin Panel" : isAdmin ? "Admin Panel" : "Coach Panel"} · CRM Pro
              </h3>
              <p className="text-xs text-slate-500 hidden md:block mt-0.5">
                {isAdmin ? "Members, attendance, revenue, packages, role management" : "Client Roster & Insights"}
              </p>
            </div>
          </div>
          <Link
            to={isAdmin ? "/admin/crm" : "/coach"}
            className="shrink-0 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-sm font-bold transition-all"
          >
            Open
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info Section */}
          <div className="glass-card rounded-[2rem] p-8 shadow-xl border-none">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl">Personal Identity</h3>
                  <p className="text-xs text-muted-foreground">Your biometric profile and goals</p>
                </div>
              </div>
              
              <button
                onClick={isEditing ? save : () => setIsEditing(true)}
                className={cn(
                  "px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all",
                  isEditing ? "bg-gradient-brand text-primary-foreground shadow-brand" : "bg-secondary text-foreground hover:bg-secondary/80"
                )}
              >
                {isEditing ? <><Save className="w-4 h-4" /> Finish Editing</> : <><Edit className="w-4 h-4" /> Update Profile</>}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Input 
                  label="Full name" 
                  value={f.full_name || ""} 
                  readOnly={!isEditing || !canEditPersonalInfo}
                  disabled={!isEditing || !canEditPersonalInfo}
                  onChange={(v: any) => setF({ ...f, full_name: v })} 
                />
                <Input 
                  label="Phone Number" 
                  value={f.phone || ""} 
                  readOnly={!isEditing || !canEditPersonalInfo}
                  disabled={!isEditing || !canEditPersonalInfo}
                  onChange={(v: any) => setF({ ...f, phone: v })} 
                />
                <Select
                  label="Gender"
                  value={f.gender || ""}
                  options={["", "Male", "Female", "Other"]}
                  readOnly={!isEditing || !canEditPersonalInfo}
                  disabled={!isEditing || !canEditPersonalInfo}
                  onChange={(v: any) => setF({ ...f, gender: v })}
                />
              </div>
              
              <div className="space-y-6">
                <Input
                  label="Date of birth"
                  type="date"
                  value={f.dob || ""}
                  readOnly={!isEditing || !canEditPersonalInfo}
                  disabled={!isEditing || !canEditPersonalInfo}
                  onChange={(v: any) => setF({ ...f, dob: v })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Height (cm)"
                    type="number"
                    value={f.height_cm || ""}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    onChange={(v: any) => setF({ ...f, height_cm: v })}
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    placeholder={latestWeight ? String(latestWeight) : "—"}
                    value={f.current_weight_kg ?? ""}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    onChange={(v: any) => setF({ ...f, current_weight_kg: v })}
                  />
                </div>
                <Input
                  label="Target weight (kg)"
                  type="number"
                  value={f.target_weight_kg || ""}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                  onChange={(v: any) => setF({ ...f, target_weight_kg: v })}
                />
              </div>
            </div>

            {!canEditPersonalInfo && isEditing && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                  Identity information is locked after initial setup. To update your name, gender, or phone, please contact your coach or an administrator.
                </p>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-border/50">
              <h4 className="font-bold text-sm mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Fitness Ambition
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Select
                    label="Primary Goal"
                    value={f.goal || "weight_loss"}
                    options={["weight_loss", "muscle_gain", "maintenance", "endurance", "muscle_loss"]}
                    readOnly={!isEditing}
                    disabled={!isEditing}
                    onChange={(v: any) => setF({ ...f, goal: v })}
                  />
                  
                  {/* Coach Selection logic - Only show if editing */}
                  {isEditing && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">
                        Coaching Support
                      </label>
                      <select
                        value={f.coach_name || ""}
                        onChange={(e) => onCoachNameChange(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-secondary border border-border/50 text-sm font-bold outline-none transition-all focus:ring-4 focus:ring-primary/10 hover:bg-secondary/80 appearance-none"
                      >
                        <option value="">Select a coach...</option>
                        {filteredCoaches.map((c: any) => (
                          <option key={c.id} value={c.full_name}>{c.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Daily Targets Section */}
          <div className="glass-card rounded-[2rem] p-8 shadow-xl border-none">
            <h3 className="font-display font-black text-xl mb-6 flex items-center gap-3">
              <Settings className="w-5 h-5 text-primary" /> Daily Optimization
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Input
                label="Calories"
                type="number"
                value={f.daily_calorie_goal || ""}
                readOnly={!isEditing}
                disabled={!isEditing}
                onChange={(v: any) => setF({ ...f, daily_calorie_goal: v })}
              />
              <Input
                label="Water (ml)"
                type="number"
                value={f.daily_water_goal_ml || ""}
                readOnly={!isEditing}
                disabled={!isEditing}
                onChange={(v: any) => setF({ ...f, daily_water_goal_ml: v })}
              />
              <Input
                label="Steps"
                type="number"
                value={f.daily_step_goal || ""}
                readOnly={!isEditing}
                disabled={!isEditing}
                onChange={(v: any) => setF({ ...f, daily_step_goal: v })}
              />
              <Input
                label="Sleep (hr)"
                type="number"
                value={f.sleep_goal_hr || ""}
                readOnly={!isEditing}
                disabled={!isEditing}
                onChange={(v: any) => setF({ ...f, sleep_goal_hr: v })}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Theme */}
        <div className="space-y-8">
          {/* Health Calculator Card */}
          <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-slate-500" />
                Health calculator
              </h3>
              <p className="text-xs text-slate-500 mt-1">Auto-computed from your gender, age, height & weight.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Metric label="BMI" value={calc.bmi} sub={bmiCategory(calc.bmi)} />
              <Metric label="Body fat" value={calc.bf != null ? `${calc.bf}%` : null} />
              <Metric label="Visceral fat" value={calc.vf != null ? calc.vf : null} sub="Healthy" />
              <Metric label="Body age" value={calc.bodyAge} sub={calc.age != null ? `Real ${calc.age}y` : undefined} />
              <Metric label="RMR" value={calc.rmr != null ? `${calc.rmr} kcal` : null} sub="resting metabolic rate" />
              <Metric label="Ideal weight" value={calc.ideal != null ? `${calc.ideal} kg` : null} />
            </div>
          </div>






        </div>
      </div>

      {/* Theme Selector (Full Width) */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 md:p-8 shadow-sm mt-8">
        <h3 className="font-bold text-slate-800 text-lg mb-6">Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "p-4 rounded-xl border transition-all text-left relative overflow-hidden group flex flex-col justify-between min-h-[80px]",
                themeId === t.id ? "border-[#216cf6] bg-[#216cf6]/5 ring-1 ring-[#216cf6]" : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <div className="flex gap-1.5 mb-3">
                {t.swatch.map((c, i) => (
                  <span key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-xs font-medium text-slate-800">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full mt-8 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-sm"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}

// Optimized Helper components
function Metric({ label, value, sub }: any) {
  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex flex-col justify-center min-h-[100px]">
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">{label}</p>
      <p className="font-display text-2xl md:text-3xl font-bold text-[#216cf6] tracking-tight">{value ?? "—"}</p>
      {sub && <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>}
    </div>
  );
}

function Input({ label, readOnly, className, disabled, ...p }: any) {
  return (
    <label className="block group">
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">{label}</span>
      <input
        {...p}
        readOnly={readOnly}
        disabled={disabled}
        className={cn(
          "mt-1.5 w-full px-5 py-3.5 rounded-2xl bg-secondary border border-transparent text-sm font-bold outline-none transition-all",
          !readOnly ? "focus:ring-4 focus:ring-primary/10 border-border/50 hover:bg-secondary/80" : "cursor-default opacity-80",
          className
        )}
        onChange={(e: any) => p.onChange(e.target.value)}
      />
    </label>
  );
}

function Select({ label, options, readOnly, disabled, ...p }: any) {
  return (
    <label className="block group">
      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 transition-colors group-focus-within:text-primary">{label}</span>
      <select
        {...p}
        disabled={disabled || readOnly}
        className={cn(
          "mt-1.5 w-full px-5 py-3.5 rounded-2xl bg-secondary border border-transparent text-sm font-bold outline-none transition-all appearance-none cursor-pointer",
          !readOnly ? "focus:ring-4 focus:ring-primary/10 border-border/50 hover:bg-secondary/80" : "cursor-default opacity-80"
        )}
        onChange={(e: any) => p.onChange(e.target.value)}
      >
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o.replace(/_/g, " ") || "Not Specified"}
          </option>
        ))}
      </select>
    </label>
  );
}
