import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  Bell, BellRing, Settings, Droplet, Pill, Save, CheckCircle, AlertTriangle,
  Clock, Info, Zap, Shield, Volume2, VolumeX, Timer, Waves, Sparkles,
  ArrowRight, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

interface NotiSettings {
  hydration_enabled: boolean;
  hydration_interval: number; // hours
  med_enabled: boolean;
  med_interval: number;
  permission_granted: boolean;
}

const HYDRATION_OPTIONS = [
  { value: 1, label: "1 hour", desc: "High frequency" },
  { value: 2, label: "2 hours", desc: "Recommended" },
  { value: 3, label: "3 hours", desc: "Moderate" },
  { value: 4, label: "4 hours", desc: "Relaxed" },
  { value: 6, label: "6 hours", desc: "Low" },
  { value: 8, label: "8 hours", desc: "Minimal" },
];

const MED_OPTIONS = [
  { value: 4, label: "Every 4 hours" },
  { value: 6, label: "Every 6 hours" },
  { value: 8, label: "Every 8 hours" },
  { value: 12, label: "Every 12 hours" },
];

const HOW_IT_WORKS = [
  {
    icon: Waves,
    title: "Browser Notification API",
    desc: "Hydration reminders use your browser's native Notification API for reliable alerts",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Pill,
    title: "Medication Schedule Sync",
    desc: "Medication reminders check your scheduled times from the Meds page automatically",
    color: "from-purple-500 to-pink-400",
  },
  {
    icon: Zap,
    title: "Keep Tab Active",
    desc: "Keep this tab open in the background to receive timely reminders",
    color: "from-amber-500 to-orange-400",
  },
  {
    icon: Settings,
    title: "Full Control",
    desc: "Adjust frequency or disable any reminder type anytime — your preferences are saved locally",
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
    permission_granted: false,
  });
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
  }, [loadSettings]);

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
    const id = setInterval(() => {
      if (settings.permission_granted) {
        new Notification("💧 JP Fitness Hydration", {
          body: `Time to drink water! Stay hydrated — every ${settings.hydration_interval}h reminder.`,
          icon: "/jp-logo.png",
        });
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [
    settings.hydration_enabled,
    settings.hydration_interval,
    settings.permission_granted,
  ]);

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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand-3 p-7 md:p-10 text-primary-foreground shadow-brand animate-pop">
        <div className="absolute -top-20 -right-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur text-xs font-semibold mb-3">
            <BellRing className="w-3 h-3" /> Smart Reminders
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold leading-tight">
            Notifications & Reminders
          </h1>
          <p className="opacity-90 mt-2 max-w-lg text-sm">
            Stay on track with intelligent hydration and medication alerts.
            Never miss a dose or forget to hydrate.
          </p>
        </div>
      </div>

      {/* Permission Status Card */}
      <div
        className={`rounded-2xl p-5 flex items-center gap-4 transition-all duration-500 animate-pop ${
          settings.permission_granted
            ? "glass-card border-emerald-300/40"
            : "glass-card border-amber-300/40"
        }`}
        style={{ animationDelay: "0.05s" }}
      >
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            settings.permission_granted
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : "bg-amber-100 dark:bg-amber-900/30"
          }`}
        >
          {settings.permission_granted ? (
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm">
            {settings.permission_granted
              ? "Browser notifications enabled"
              : "Browser notifications disabled"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {settings.permission_granted
              ? "You'll receive hydration & medication reminders"
              : "Enable notifications to get reminders"}
          </p>
        </div>
        {!settings.permission_granted && (
          <button
            onClick={requestPermission}
            className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-brand hover:scale-105 transition-transform shrink-0"
          >
            <Bell className="w-3.5 h-3.5" />
            Enable
          </button>
        )}
        {settings.permission_granted && (
          <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
        )}
      </div>

      {/* Hydration Reminders Card */}
      <div
        className="glass-card rounded-2xl overflow-hidden animate-pop"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Card Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">
                Hydration Reminders
              </h3>
              <p className="text-xs text-muted-foreground">
                Stay hydrated throughout the day
              </p>
            </div>
          </div>

          {/* Toggle Row */}
          <div className="flex items-center justify-between py-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Enable hydration reminders
                </p>
                <p className="text-xs text-muted-foreground">
                  Get notified to drink water regularly
                </p>
              </div>
            </div>
            <Switch
              checked={settings.hydration_enabled}
              onCheckedChange={(checked) =>
                saveSettings({ hydration_enabled: checked })
              }
            />
          </div>
        </div>

        {/* Interval Selection */}
        {settings.hydration_enabled && (
          <div className="px-6 pb-6 pt-2">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-semibold">Remind every</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {HYDRATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    saveSettings({ hydration_interval: opt.value })
                  }
                  className={`relative p-3 rounded-xl border text-center transition-all duration-200 hover:scale-[1.02] ${
                    settings.hydration_interval === opt.value
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400/20 shadow-md"
                      : "border-border bg-secondary/50 hover:border-blue-200"
                  }`}
                >
                  <p
                    className={`font-bold text-sm ${
                      settings.hydration_interval === opt.value
                        ? "text-blue-600 dark:text-blue-400"
                        : ""
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {opt.desc}
                  </p>
                  {settings.hydration_interval === opt.value && (
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Next reminder preview */}
            {settings.permission_granted && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200/50">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Next reminder at{" "}
                  <span className="font-bold">
                    {getNextReminderTime(settings.hydration_interval)}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Medication Reminders Card */}
      <div
        className="glass-card rounded-2xl overflow-hidden animate-pop"
        style={{ animationDelay: "0.15s" }}
      >
        {/* Card Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">
                Medication Reminders
              </h3>
              <p className="text-xs text-muted-foreground">
                Never miss your medications
              </p>
            </div>
          </div>

          {/* Toggle Row */}
          <div className="flex items-center justify-between py-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BellRing className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Enable medication reminders
                </p>
                <p className="text-xs text-muted-foreground">
                  Get notified when it's time to take medicine
                </p>
              </div>
            </div>
            <Switch
              checked={settings.med_enabled}
              onCheckedChange={(checked) =>
                saveSettings({ med_enabled: checked })
              }
            />
          </div>
        </div>

        {/* Medication Settings */}
        {settings.med_enabled && (
          <div className="px-6 pb-6 pt-2 space-y-4">
            {/* Info badge */}
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200/50">
              <Info className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
              <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
                Medication reminders are automatically sent based on your
                medication schedule in the{" "}
                <span className="font-bold">Meds page</span>.
              </p>
            </div>

            {/* Interval Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-semibold">Check interval</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      saveSettings({ med_interval: opt.value })
                    }
                    className={`relative p-3 rounded-xl border text-center transition-all duration-200 hover:scale-[1.02] ${
                      settings.med_interval === opt.value
                        ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-400/20 shadow-md"
                        : "border-border bg-secondary/50 hover:border-purple-200"
                    }`}
                  >
                    <p
                      className={`font-bold text-sm ${
                        settings.med_interval === opt.value
                          ? "text-purple-600 dark:text-purple-400"
                          : ""
                      }`}
                    >
                      {opt.label}
                    </p>
                    {settings.med_interval === opt.value && (
                      <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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
