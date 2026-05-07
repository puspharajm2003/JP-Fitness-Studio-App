import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useProfile } from "@/lib/useProfile";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useTheme, themes } from "@/providers/ThemeProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useCoaches } from "@/lib/useCoaches";
import {
  Camera, Calendar, LogOut, MessageCircle, Save, Sparkles, User as UserIcon,
  Shield, Calculator, Target, CheckCircle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  bmi, bmiCategory, bodyFatPct, visceralFat, bodyAge, rmr,
  idealWeight, goalSuggestion, ageFromDob,
} from "@/lib/healthCalc";

export default function Profile() {
  const { profile, update, refresh } = useProfile();
  const { signOut, user } = useAuth();
  const { themeId, setTheme } = useTheme();
  const { isAdmin, isSuperAdmin, isCoach } = useIsAdmin();
  const coaches = useCoaches();
  const [pkg, setPkg] = useState<any>(null);
  const [f, setF] = useState<any>({});
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const currentWeight = (f.current_weight_kg as number | null) ?? latestWeight ?? null;

  const calc = useMemo(() => {
    const input = {
      gender: f.gender,
      dob: f.dob,
      height_cm: f.height_cm ? parseFloat(f.height_cm) : null,
      weight_kg: currentWeight ?? null,
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
      coach_id: f.coach_id || null,
      coach_name: f.coach_name || null,
    });
    if (f.current_weight_kg) {
      await supabase.from("weight_logs").insert({
        user_id: user!.id,
        weight_kg: parseFloat(f.current_weight_kg),
      });
      setLatestWeight(parseFloat(f.current_weight_kg));
    }
    toast.success("Profile saved");
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

  const coach = () => {
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
      coach_phone: matched?.phone || (matched ? matched.phone : ""),
    });
  };

  const coachExists = f.coach_name && matchCoachByName(f.coach_name) !== undefined;

  return (
    <div className="space-y-6">
      {/* Header with avatar */}
      <div className="rounded-3xl bg-gradient-brand-3 p-6 text-primary-foreground shadow-brand">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center font-display font-extrabold text-4xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="me" className="w-full h-full object-cover" />
                ) : (
                  (f.full_name || user?.email || "U").slice(0, 1).toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-white text-primary flex items-center justify-center shadow-brand hover:scale-110 transition"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-extrabold truncate">{f.full_name || "Member"}</h2>
              <p className="opacity-90 text-sm truncate">{user?.email}</p>
              <p className="opacity-90 text-xs mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {profile?.loyalty_points || 0} loyalty points
                </span>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-bold uppercase">Super Admin</span>
                )}
                {!isSuperAdmin && isAdmin && !isCoach && (
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-bold uppercase">Admin</span>
                )}
                {isCoach && (
                  <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-bold uppercase">Coach</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
            <button
              onClick={coach}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-black/20 backdrop-blur text-white font-semibold flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle className="w-4 h-4" />Coach
            </button>
          </div>
        </div>
      </div>

      {/* Admin / Coach panels */}
      {isAdmin && (
        <Link
          to="/admin/crm"
          className="glass-card rounded-2xl p-5 flex items-center gap-3 hover:scale-[1.01] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold">{isSuperAdmin ? "Super-Admin" : "Admin"} Panel · CRM Pro</p>
            <p className="text-xs text-muted-foreground">Members, attendance, revenue, packages, role management</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-gradient-soft text-xs font-bold">Open</span>
        </Link>
      )}
      {isCoach && (
        <Link
          to="/coach"
          className="glass-card rounded-2xl p-5 flex items-center gap-3 hover:scale-[1.01] transition-transform"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-cyan text-primary-foreground flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold">Coach Panel · CRM Coach</p>
            <p className="text-xs text-muted-foreground">Your client roster, attendance summary, and premium coaching dashboard</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-gradient-soft text-xs font-bold">Open</span>
        </Link>
      )}

      {/* Active package */}
      {pkg && (
        <div className="glass-card rounded-2xl p-5 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">{pkg.name}</p>
            <p className="text-xs text-muted-foreground">
              Active until {new Date(pkg.end_date).toLocaleDateString()}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-gradient-soft text-xs font-semibold">{pkg.status}</span>
        </div>
      )}

      {/* Personal info form – always editable */}
      <div className="glass-card rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
        <h3 className="font-display font-bold mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4" />Personal info
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          <Input label="Full name" value={f.full_name || ""} onChange={(v: any) => setF({ ...f, full_name: v })} />
          <Input label="Phone" value={f.phone || ""} onChange={(v: any) => setF({ ...f, phone: v })} />
          <Select
            label="Gender"
            value={f.gender || ""}
            options={["", "Male", "Female", "Other"]}
            onChange={(v: any) => setF({ ...f, gender: v })}
          />
          <Input
            label="Date of birth"
            type="date"
            value={f.dob || ""}
            onChange={(v: any) => setF({ ...f, dob: v })}
          />
          <Input
            label="Height (cm)"
            type="number"
            value={f.height_cm || ""}
            onChange={(v: any) => setF({ ...f, height_cm: v })}
          />
          <Input
            label="Weight (kg)"
            type="number"
            placeholder={latestWeight ? String(latestWeight) : "—"}
            value={f.current_weight_kg ?? ""}
            onChange={(v: any) => setF({ ...f, current_weight_kg: v })}
          />
          <Input
            label="Target weight (kg)"
            type="number"
            value={f.target_weight_kg || ""}
            onChange={(v: any) => setF({ ...f, target_weight_kg: v })}
          />
          <Select
            label="Goal"
            value={f.goal || "weight_loss"}
            options={["weight_loss", "muscle_gain", "maintenance", "endurance", "muscle_loss"]}
            onChange={(v: any) => setF({ ...f, goal: v })}
          />

          {/* Coach name field with real-time validation */}
          <div className="space-y-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Coach name
              </span>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={f.coach_name || ""}
                  onChange={(e) => onCoachNameChange(e.target.value)}
                  autoComplete="off"
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 pr-8"
                  placeholder="Type your coach's full name"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {f.coach_name &&
                    (coachExists ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    ))}
                </div>
              </div>
            </label>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {f.coach_name && coachExists ? (
                <span className="text-green-600">
                  ✓ Coach found – WhatsApp number auto‑filled below.
                </span>
              ) : f.coach_name && !coachExists ? (
                <span className="text-amber-600">
                  ⚠️ Coach name not found. Please contact admin to update.
                </span>
              ) : (
                <span>💡 Enter your coach’s name to auto‑fill their WhatsApp number.</span>
              )}
            </p>
          </div>

          <Input
            label="Coach WhatsApp"
            value={f.coach_phone || ""}
            onChange={(v: any) => setF({ ...f, coach_phone: v })}
            readOnly={!!f.coach_id && coachExists}
            className={!!f.coach_id && coachExists ? "bg-muted/50 cursor-not-allowed" : ""}
          />
        </div>

        {/* Ideal weight & suggested goal (real-time) */}
        {(calc.ideal || calc.goalSug) && (
          <div className="mt-5 rounded-2xl bg-gradient-soft border border-border p-4 flex flex-wrap gap-4 items-center">
            <Target className="w-5 h-5 text-primary" />
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Ideal weight
              </p>
              <p className="font-display font-bold text-lg">
                {calc.ideal ?? "—"}{" "}
                <span className="text-xs font-normal text-muted-foreground">kg (Devine)</span>
              </p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Suggested goal
              </p>
              <p className="font-display font-bold text-lg">{calc.goalSug}</p>
            </div>
          </div>
        )}

        <h4 className="font-semibold mt-6 mb-3">Daily targets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Input
            label="Calories"
            type="number"
            value={f.daily_calorie_goal || ""}
            onChange={(v: any) => setF({ ...f, daily_calorie_goal: v })}
          />
          <Input
            label="Water (ml)"
            type="number"
            value={f.daily_water_goal_ml || ""}
            onChange={(v: any) => setF({ ...f, daily_water_goal_ml: v })}
          />
          <Input
            label="Steps"
            type="number"
            value={f.daily_step_goal || ""}
            onChange={(v: any) => setF({ ...f, daily_step_goal: v })}
          />
          <Input
            label="Sleep (hr)"
            type="number"
            value={f.sleep_goal_hr || ""}
            onChange={(v: any) => setF({ ...f, sleep_goal_hr: v })}
          />
        </div>

        <button
          onClick={save}
          className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold flex items-center gap-2"
        >
          <Save className="w-4 h-4" />Save changes
        </button>
      </div>

      {/* Health calculator */}
      <div className="glass-card rounded-2xl p-6 shadow-xl">
        <h3 className="font-display font-bold mb-1 flex items-center gap-2">
          <Calculator className="w-4 h-4" />Health calculator
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Auto-computed from your gender, age, height & weight.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Metric label="BMI" value={calc.bmi} sub={bmiCategory(calc.bmi)} />
          <Metric label="Body fat" value={calc.bf != null ? `${calc.bf}%` : null} />
          <Metric
            label="Visceral fat"
            value={calc.vf}
            sub={calc.vf != null ? (calc.vf > 12 ? "High" : "Healthy") : undefined}
          />
          <Metric
            label="Body age"
            value={calc.bodyAge}
            sub={calc.age != null ? `Real ${calc.age}y` : undefined}
          />
          <Metric label="RMR" value={calc.rmr != null ? `${calc.rmr} kcal` : null} sub="resting metabolic rate" />
          <Metric label="Ideal weight" value={calc.ideal != null ? `${calc.ideal} kg` : null} />
        </div>
      </div>

      {/* Theme picker */}
      <div className="glass-card rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
        <h3 className="font-display font-bold mb-3">Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-3 rounded-xl border text-left transition hover:scale-[1.02] ${
                themeId === t.id ? "border-primary ring-brand" : "border-border"
              }`}
            >
              <div className="flex gap-1 mb-2">
                {t.swatch.map((c, i) => (
                  <span key={i} className="w-5 h-5 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="text-sm font-semibold">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full py-3 rounded-2xl border border-border bg-card font-semibold flex items-center justify-center gap-2 text-muted-foreground hover:text-destructive hover:border-destructive transition"
      >
        <LogOut className="w-4 h-4" />Sign out
      </button>
    </div>
  );
}

// Helper components
function Metric({ label, value, sub }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="font-display text-2xl font-extrabold mt-1 text-gradient-brand">{value ?? "—"}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Input({ label, readOnly, className, ...p }: any) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <input
        {...p}
        readOnly={readOnly}
        className={`mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 ${
          className || ""
        }`}
        onChange={(e: any) => p.onChange(e.target.value)}
      />
    </label>
  );
}

function Select({ label, options, ...p }: any) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <select
        {...p}
        onChange={(e: any) => p.onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none capitalize"
      >
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o.replace(/_/g, " ") || "—"}
          </option>
        ))}
      </select>
    </label>
  );
}
