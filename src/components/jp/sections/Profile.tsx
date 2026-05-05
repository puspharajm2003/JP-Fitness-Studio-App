import { useEffect, useState } from "react";
import { useProfile } from "@/lib/useProfile";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useTheme, themes } from "@/providers/ThemeProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Calendar, LogOut, MessageCircle, Save, Sparkles, User as UserIcon, Shield, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Profile() {
  const [editMode, setEditMode] = useState(false);
  const { profile, update } = useProfile();
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { themeId, setTheme } = useTheme();
  const [pkg, setPkg] = useState<any>(null);
  const [f, setF] = useState<any>({});

  useEffect(() => { if (profile) setF(profile); }, [profile]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("packages")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      setPkg(data);
    })();
  }, [user]);

  const save = async () => {
    await update({
      full_name: f.full_name,
      phone: f.phone,
      gender: f.gender,
      dob: f.dob,
      height_cm: f.height_cm ? parseFloat(f.height_cm) : null,
      target_weight_kg: f.target_weight_kg ? parseFloat(f.target_weight_kg) : null,
      goal: f.goal,
      daily_calorie_goal: parseInt(f.daily_calorie_goal) || 2000,
      daily_water_goal_ml: parseInt(f.daily_water_goal_ml) || 2500,
      daily_step_goal: parseInt(f.daily_step_goal) || 10000,
      sleep_goal_hr: parseFloat(f.sleep_goal_hr) || 8,
      coach_phone: f.coach_phone,
    });
    toast.success("Profile saved");
    setEditMode(false);
  };

  const coach = () => {
    const phone = (f.coach_phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const field = (label: string, value: any) => (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-all duration-300 hover:shadow-md">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
    </div>
  );

  const inputField = (label: string, value: any, onChange: (v: any) => void, type = "text") => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
      />
    </div>
  );

  const selectField = (label: string, value: any, onChange: (v: string) => void, options: string[]) => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <select
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none capitalize focus:ring-2 focus:ring-violet-500"
      >
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-1 shadow-2xl transition-transform duration-500 hover:scale-[1.01]">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-4xl font-extrabold text-white shadow-xl flex-shrink-0 transition-transform duration-300 hover:rotate-6">
            {(f.full_name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-center md:text-left">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {f.full_name || "Member"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{user?.email}</p>
            <p className="mt-1 text-xs flex items-center justify-center md:justify-start gap-1.5 text-amber-600">
              <Sparkles className="w-3 h-3" /> {profile?.loyalty_points || 0} loyalty points
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={coach} variant="outline" size="sm" className="border-violet-200 text-violet-700 hover:bg-violet-50 transition-colors">
              <MessageCircle className="w-4 h-4 mr-2" /> Coach
            </Button>
            {isAdmin && (
              <a href="/admin/crm" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-100 text-violet-700 font-semibold hover:bg-violet-200 transition-colors">
                <Shield className="w-4 h-4" /> Admin Panel
              </a>
            )}
            <Button onClick={() => setEditMode(!editMode)} variant={editMode ? "default" : "outline"} size="sm" className="transition-colors">
              {editMode ? <><Check className="w-4 h-4 mr-2" /> Done</> : <><Pencil className="w-4 h-4 mr-2" /> Edit Profile</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Membership Card */}
      {pkg && (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden transition-shadow duration-300 hover:shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30">
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Calendar className="w-5 h-5" /> Active Membership
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{pkg.name}</p>
              <p className="text-sm text-slate-500">Active until {new Date(pkg.end_date).toLocaleDateString()}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">{pkg.status}</span>
          </CardContent>
        </Card>
      )}

      {/* Personal Info Card */}
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 transition-shadow duration-300 hover:shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-violet-500" /> Personal Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="grid md:grid-cols-2 gap-4">
              {inputField("Full Name", f.full_name, v => setF({ ...f, full_name: v }))}
              {inputField("Phone", f.phone, v => setF({ ...f, phone: v }))}
              {selectField("Gender", f.gender, v => setF({ ...f, gender: v }), ["", "Male", "Female", "Other"])}
              {inputField("Date of Birth", f.dob, v => setF({ ...f, dob: v }), "date")}
              {inputField("Height (cm)", f.height_cm, v => setF({ ...f, height_cm: v }), "number")}
              {inputField("Target Weight (kg)", f.target_weight_kg, v => setF({ ...f, target_weight_kg: v }), "number")}
              {selectField("Goal", f.goal, v => setF({ ...f, goal: v }), ["weight_loss", "muscle_gain", "maintenance", "endurance"])}
              {inputField("Coach WhatsApp", f.coach_phone, v => setF({ ...f, coach_phone: v }))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {field("Full Name", f.full_name)}
              {field("Phone", f.phone)}
              {field("Gender", f.gender ? f.gender.charAt(0).toUpperCase() + f.gender.slice(1) : "-")}
              {field("Date of Birth", f.dob)}
              {field("Height (cm)", f.height_cm)}
              {field("Target Weight (kg)", f.target_weight_kg)}
              {field("Goal", f.goal?.replace(/_/g, " "))}
              {field("Coach Phone", f.coach_phone)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Targets Card */}
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 transition-shadow duration-300 hover:shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Daily Targets</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inputField("Calories", f.daily_calorie_goal, v => setF({ ...f, daily_calorie_goal: v }), "number")}
              {inputField("Water (ml)", f.daily_water_goal_ml, v => setF({ ...f, daily_water_goal_ml: v }), "number")}
              {inputField("Steps", f.daily_step_goal, v => setF({ ...f, daily_step_goal: v }), "number")}
              {inputField("Sleep (hr)", f.sleep_goal_hr, v => setF({ ...f, sleep_goal_hr: v }), "number")}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {field("Calories", f.daily_calorie_goal)}
              {field("Water (ml)", f.daily_water_goal_ml)}
              {field("Steps", f.daily_step_goal)}
              {field("Sleep (hr)", f.sleep_goal_hr)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme Card */}
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 transition-shadow duration-300 hover:shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${themeId === t.id ? "border-primary ring-2 ring-brand" : "border-border"}`}
              >
                <div className="flex gap-1 mb-2">
                  {t.swatch.map((c: string, i: number) => (
                    <span key={i} className="w-5 h-5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-sm font-semibold">{t.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button (edit mode only) */}
      {editMode && (
        <Button onClick={save} className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-lg shadow-xl hover:shadow-2xl transition-shadow">
          <Save className="w-5 h-5 mr-2" /> Save Profile
        </Button>
      )}

      {/* Sign Out */}
      <Button onClick={signOut} variant="outline" className="w-full py-3 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors">
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
