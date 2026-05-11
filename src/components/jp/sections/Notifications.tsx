import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  Bell, BellRing, Settings, Droplet, Pill, Save, CheckCircle, AlertTriangle,
  Clock, Info, Zap, Shield, Volume2, VolumeX, Timer, Waves, Sparkles,
  ArrowRight, ChevronDown, Award, Moon
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NotiSettings {
  hydration_enabled: boolean;
  hydration_interval: number; // hours
  med_enabled: boolean;
  med_interval: number;
  loyalty_enabled: boolean;
  sleep_enabled: boolean;
  permission_granted: boolean;
  onboarding_dismissed: boolean;
}

const HYDRATION_OPTIONS = [
  { value: 1, label: "1h", desc: "High" },
  { value: 2, label: "2h", desc: "Best" },
  { value: 3, label: "3h", desc: "Mid" },
  { value: 4, label: "4h", desc: "Low" },
];

const MED_OPTIONS = [
  { value: 4, label: "4h" },
  { value: 6, label: "6h" },
  { value: 8, label: "8h" },
  { value: 12, label: "12h" },
];

const HOW_IT_WORKS = [
  {
    icon: Waves,
    title: "Browser API",
    desc: "Uses native alerts for reliability",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Pill,
    title: "Schedule Sync",
    desc: "Checks scheduled medication times",
    color: "from-purple-500 to-pink-400",
  },
  {
    icon: Zap,
    title: "Stay Active",
    desc: "Keep the app open in background",
    color: "from-amber-500 to-orange-400",
  },
  {
    icon: Award,
    title: "Loyalty Boost",
    desc: "Reminders for gym check-ins",
    color: "from-emerald-500 to-teal-400",
  },
];

export default function Notifications() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotiSettings>({
    hydration_enabled: true,
    hydration_interval: 2,
    med_enabled: true,
    med_interval: 8,
    loyalty_enabled: true,
    sleep_enabled: true,
    permission_granted: false,
    onboarding_dismissed: false,
  });
  const [showTestStatus, setShowTestStatus] = useState<"none" | "success" | "failure">("none");
  const [waterGoalMet, setWaterGoalMet] = useState(false);
  const [medsTakenToday, setMedsTakenToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const storageKey = `noti_settings_${user?.id || ""}`;

  // Load settings from localStorage
  const loadSettings = useCallback(async () => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {}
    // Check notification permission
    if ("Notification" in window) {
      setSettings((prev) => ({
        ...prev,
        permission_granted: Notification.permission === "granted",
      }));
    }
    setLoading(false);
  }, [user, storageKey]);

  useEffect(() => {
    loadSettings();
    checkGoals();
  }, [loadSettings]);

  const checkGoals = async () => {
    if (!user) return;
    const { data: waterLogs } = await supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("date", new Date().toISOString().split('T')[0]);
    const { data: profile } = await supabase.from("profiles").select("daily_water_goal_ml").eq("id", user.id).single();
    
    const totalWater = waterLogs?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
    setWaterGoalMet(totalWater >= (profile?.daily_water_goal_ml || 2000));

    const { data: medLogs } = await supabase.from("medication_logs").select("*").eq("user_id", user.id).eq("status", "taken").gte("taken_at", new Date().toISOString().split('T')[0]);
    setMedsTakenToday((medLogs?.length || 0) > 0);
  };

  const saveSettings = async (newSettings: Partial<NotiSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Your browser does not support notifications");
      return;
    }
    const permission = await Notification.requestPermission();
    setSettings((prev) => ({
      ...prev,
      permission_granted: permission === "granted",
    }));
    if (permission === "granted") {
      toast.success("Notifications enabled!");
      new Notification("JP Fitness Studio", {
        body: "🔔 Notifications are working! You'll receive timely reminders.",
        icon: "/jp-logo.png",
      });
    } else {
      toast.error("Notification permission denied");
    }
  };

  const triggerTestNotification = () => {
    if (!settings.permission_granted) {
      setShowTestStatus("failure");
      toast.error("Permission not granted. Cannot send test notification.");
      return;
    }
    try {
      new Notification("🚀 Test Notification", {
        body: "Success! Your reminders are working correctly. Stay consistent!",
        icon: "/jp-logo.png",
      });
      setShowTestStatus("success");
      setTimeout(() => setShowTestStatus("none"), 3000);
    } catch (err) {
      setShowTestStatus("failure");
    }
  };

  const saveToProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
      setSaved(true);
      toast.success("Notification settings saved!");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Hydration reminder logic
  useEffect(() => {
    if (!settings.hydration_enabled || !settings.permission_granted) return;

    const intervalMs = settings.hydration_interval * 60 * 60 * 1000;
    const id = setInterval(async () => {
      await checkGoals();
      if (settings.permission_granted && !waterGoalMet) {
        new Notification("💧 JP Fitness Hydration", {
          body: `Time to drink 250ml water! Stay hydrated — every ${settings.hydration_interval}h reminder until goal met.`,
          icon: "/jp-logo.png",
        });
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [
    settings.hydration_enabled,
    settings.hydration_interval,
    settings.permission_granted,
    waterGoalMet,
  ]);

  // Medication reminder logic
  useEffect(() => {
    if (!settings.med_enabled || !settings.permission_granted) return;

    const intervalMs = settings.med_interval * 60 * 60 * 1000;
    const id = setInterval(async () => {
      await checkGoals();
      if (settings.permission_granted && !medsTakenToday) {
        new Notification("💊 JP Fitness Medication", {
          body: `Don't forget your scheduled medication. Check your schedule now.`,
          icon: "/jp-logo.png",
        });
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [
    settings.med_enabled,
    settings.med_interval,
    settings.permission_granted,
    medsTakenToday,
  ]);

  // Sleep reminder logic
  useEffect(() => {
    if (!settings.sleep_enabled || !settings.permission_granted) return;

    const id = setInterval(() => {
      const bedTime = localStorage.getItem("bedTime");
      if (!bedTime) return;

      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      const [bH, bM] = bedTime.split(":").map(Number);
      
      if (currentH === bH && currentM === bM) {
         const lastNotified = localStorage.getItem("lastSleepNoti");
         const todayDate = now.toLocaleDateString();
         if (lastNotified !== todayDate) {
            new Notification("🌙 Time to Sleep!", {
              body: `Your scheduled bed time (${bedTime}) has arrived. Put down your device and get some rest!`,
              icon: "/jp-logo.png",
            });
            localStorage.setItem("lastSleepNoti", todayDate);
         }
      }
    }, 60000);

    return () => clearInterval(id);
  }, [settings.sleep_enabled, settings.permission_granted]);

  // Calculate next reminder time
  const getNextReminderTime = (intervalHours: number) => {
    const now = new Date();
    const next = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
    return next.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand animate-pulse">
            <Bell className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 px-4 md:px-0">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand-3 p-7 md:p-10 text-primary-foreground shadow-brand animate-pop">
        <div className="absolute -top-20 -right-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur text-xs font-semibold mb-3">
            <BellRing className="w-3 h-3" /> Smart Alerts
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight">
            Reminders
          </h1>
          <p className="opacity-90 mt-2 max-w-lg text-sm">
            Stay consistent with hydration, medication, and gym check-ins.
          </p>
        </div>
      </div>

      {/* Notification Onboarding */}
      {!settings.permission_granted && !settings.onboarding_dismissed && (
        <div className="rounded-3xl bg-slate-900 text-white p-8 relative overflow-hidden animate-in slide-in-from-top duration-500">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display text-2xl font-black mb-3">Enable Smart Reminders</h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                JP Fitness uses real-time notifications to help you hit your hydration and medication goals. 
                Consistency is the key to transformation — let us help you stay on track.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <button 
                  onClick={requestPermission}
                  className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-xl hover:scale-105 transition-transform"
                >
                  Enable Now
                </button>
                <button 
                  onClick={() => saveSettings({ onboarding_dismissed: true })}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] bg-gradient-brand flex items-center justify-center shadow-2xl transform rotate-3">
              <BellRing className="w-16 h-16 md:w-24 md:h-24 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Permission Status & Test Mode */}
      <div className={`rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between border transition-all gap-4 ${settings.permission_granted ? "glass-card border-emerald-500/20" : "glass-card border-amber-500/20"}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${settings.permission_granted ? "bg-emerald-100 dark:bg-emerald-900/20 shadow-lg" : "bg-amber-100 dark:bg-amber-900/20 shadow-lg"}`}>
            {settings.permission_granted ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <AlertTriangle className="w-6 h-6 text-amber-600" />}
          </div>
          <div>
            <p className="text-base font-black">{settings.permission_granted ? "Notifications Live" : "Alerts Blocked"}</p>
            <p className="text-xs text-muted-foreground font-medium">{settings.permission_granted ? "Status: Receiving system alerts" : "Action: Grant browser permission"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {!settings.permission_granted && (
            <button onClick={requestPermission} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-black shadow-brand active:scale-95 transition-all">Enable Permissions</button>
          )}
          {settings.permission_granted && (
            <button 
              onClick={triggerTestNotification} 
              className={cn(
                "flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2",
                showTestStatus === "success" ? "bg-emerald-500 text-white" : 
                showTestStatus === "failure" ? "bg-rose-500 text-white" : 
                "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {showTestStatus === "success" ? <CheckCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              {showTestStatus === "success" ? "Success!" : showTestStatus === "failure" ? "Failed" : "Test Notification"}
            </button>
          )}
        </div>
      </div>

      {/* Unified Reminder Sections */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Hydration */}
        <ReminderSection 
          icon={Droplet} 
          title="Hydration" 
          desc="Drink water every"
          enabled={settings.hydration_enabled}
          setEnabled={(v) => saveSettings({ hydration_enabled: v })}
          interval={settings.hydration_interval}
          setInterval={(v) => saveSettings({ hydration_interval: v })}
          options={HYDRATION_OPTIONS}
          color="blue"
        />

        {/* Medication */}
        <ReminderSection 
          icon={Pill} 
          title="Medication" 
          desc="Check schedule every"
          enabled={settings.med_enabled}
          setEnabled={(v) => saveSettings({ med_enabled: v })}
          interval={settings.med_interval}
          setInterval={(v) => saveSettings({ med_interval: v })}
          options={MED_OPTIONS}
          color="purple"
        />

        {/* Loyalty/Check-ins */}
        <div className="glass-card rounded-2xl p-5 space-y-4 border border-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold">Gym Check-in</p>
                <p className="text-[10px] text-muted-foreground">Daily reward reminders</p>
              </div>
            </div>
            <Switch checked={settings.loyalty_enabled} onCheckedChange={(v) => saveSettings({ loyalty_enabled: v })} />
          </div>
          {settings.loyalty_enabled && (
             <p className="text-[10px] bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
               Reminds you to check in daily and claim your 10 loyalty points when near the gym.
             </p>
          )}
        </div>

        {/* Sleep Reminder */}
        <div className="glass-card rounded-2xl p-5 space-y-4 border border-indigo-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold">Sleep Time Alert</p>
                <p className="text-[10px] text-muted-foreground">Alerts you at your set Bed Time</p>
              </div>
            </div>
            <Switch checked={settings.sleep_enabled} onCheckedChange={(v) => saveSettings({ sleep_enabled: v })} />
          </div>
          {settings.sleep_enabled && (
             <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-200/50">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Current Bed Time:</span>
                <span className="text-sm font-black text-indigo-900 dark:text-indigo-200">
                  {localStorage.getItem("bedTime") || "Not set (Go to Activity)"}
                </span>
             </div>
          )}
        </div>
      </div>


      {/* Save Button */}
      <div
        className="animate-pop"
        style={{ animationDelay: "0.2s" }}
      >
        <button
          onClick={saveToProfile}
          disabled={saving}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 ${
            saved
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "bg-gradient-brand text-primary-foreground shadow-brand hover:scale-[1.01]"
          } disabled:opacity-60`}
        >
          {saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Settings Saved!
            </>
          ) : saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* How it Works — Collapsible */}
      <div
        className="glass-card rounded-2xl overflow-hidden animate-pop"
        style={{ animationDelay: "0.25s" }}
      >
        <button
          onClick={() => setShowHowItWorks((s) => !s)}
          className="w-full p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-soft flex items-center justify-center">
              <Sparkles
                className="w-5 h-5"
                style={{ color: "hsl(var(--primary))" }}
              />
            </div>
            <div className="text-left">
              <h4 className="font-display font-bold text-sm">How it works</h4>
              <p className="text-xs text-muted-foreground">
                Learn about the notification system
              </p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
              showHowItWorks ? "rotate-180" : ""
            }`}
          />
        </button>

        {showHowItWorks && (
          <div className="px-5 pb-5 grid sm:grid-cols-2 gap-3">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-primary/20 transition-all duration-200 hover:scale-[1.01] animate-pop"
                  style={{ animationDelay: `${0.3 + i * 0.05}s` }}
                >
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 shadow-lg`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReminderSection({ icon: Icon, title, desc, enabled, setEnabled, interval, setInterval, options, color }: any) {
  const colorMap: any = {
    blue: "from-blue-500 to-cyan-400 bg-blue-100 dark:bg-blue-900/20 text-blue-600 border-blue-500/10",
    purple: "from-purple-500 to-pink-400 bg-purple-100 dark:bg-purple-900/20 text-purple-600 border-purple-500/10",
  };

  const currentStyles = colorMap[color] || colorMap.blue;
  const stylesArr = currentStyles.split(" ");

  return (
    <div className={`glass-card rounded-2xl p-5 space-y-4 border ${stylesArr[4]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stylesArr[2]}`}>
            <Icon className={`w-5 h-5 ${stylesArr[3]}`} />
          </div>
          <div>
            <p className="text-sm font-bold">{title}</p>
            <p className="text-[10px] text-muted-foreground">{desc} {interval}h</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <div className="grid grid-cols-4 gap-2 animate-pop">
          {options.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => setInterval(opt.value)}
              className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${
                interval === opt.value
                  ? "bg-gradient-brand text-primary-foreground shadow-sm"
                  : "border-border bg-secondary/50 hover:bg-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
