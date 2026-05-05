import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Bell, Settings, Droplet, Pill, Save, CheckCircle, AlertTriangle } from "lucide-react";
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

  const storageKey = `noti_settings_${user?.id || ""}`;

  // Load settings from localForage (or localStorage as fallback)
  const loadSettings = async () => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {}
    // Check notification permission
    if ("Notification" in window) {
      setSettings(prev => ({
        ...prev,
        permission_granted: Notification.permission === "granted",
      }));
    }
    setLoading(false);
  };

  useEffect(() => { loadSettings(); }, [user]);

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
    setSettings(prev => ({ ...prev, permission_granted: permission === "granted" }));
    if (permission === "granted") {
      toast.success("Notifications enabled!");
      new Notification("JP Fitness Studio", {
        body: "Notifications are working!",
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
      // Save notification preferences to profile or a separate table
      // For simplicity, we'll just save to localStorage and show success
      localStorage.setItem(storageKey, JSON.stringify(settings));
      toast.success("Notification settings saved!");
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
          body: `Time to drink water! Goal: ${settings.hydration_interval}h interval`,
          icon: "/jp-logo.png",
        });
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [settings.hydration_enabled, settings.hydration_interval, settings.permission_granted]);

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h2 className="font-display text-2xl font-extrabold">Notifications & Reminders</h2>
      </div>

      {/* Permission Status */}
      <div className={`glass-card rounded-2xl p-5 flex items-center gap-3 ${
        settings.permission_granted ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
      }`}>
        {settings.permission_granted ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
        )}
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {settings.permission_granted ? "Browser notifications enabled" : "Browser notifications disabled"}
          </p>
          <p className="text-xs text-muted-foreground">
            {settings.permission_granted
              ? "You'll receive hydration & medication reminders"
              : "Enable notifications to get reminders"}
          </p>
        </div>
        {!settings.permission_granted && (
          <button
            onClick={requestPermission}
            className="px-3 py-1.5 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-semibold"
          >
            Enable
          </button>
        )}
      </div>

      {/* Hydration Reminders */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Droplet className="w-5 h-5 text-blue-500" />
          <h3 className="font-display font-bold">Hydration Reminders</h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-sm">Enable hydration reminders</p>
            <p className="text-xs text-muted-foreground">Get notified to drink water regularly</p>
          </div>
          <Switch
            checked={settings.hydration_enabled}
            onCheckedChange={(checked) => saveSettings({ hydration_enabled: checked })}
          />
        </div>

        {settings.hydration_enabled && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Remind every</label>
            <select
              value={settings.hydration_interval}
              onChange={(e) => saveSettings({ hydration_interval: parseInt(e.target.value) })}
              className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm"
            >
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={3}>3 hours</option>
              <option value={4}>4 hours</option>
              <option value={6}>6 hours</option>
              <option value={8}>8 hours</option>
            </select>
          </div>
        )}
      </div>

      {/* Medication Reminders */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-purple-500" />
          <h3 className="font-display font-bold">Medication Reminders</h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-sm">Enable medication reminders</p>
            <p className="text-xs text-muted-foreground">Get notified when it's time to take medicine</p>
          </div>
          <Switch
            checked={settings.med_enabled}
            onCheckedChange={(checked) => saveSettings({ med_enabled: checked })}
          />
        </div>

        {settings.med_enabled && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Medication reminders are automatically sent based on your medication schedule in the Meds page.
            </p>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Check interval</label>
              <select
                value={settings.med_interval}
                onChange={(e) => saveSettings({ med_interval: parseInt(e.target.value) })}
                className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm"
              >
                <option value={4}>Every 4 hours</option>
                <option value={6}>Every 6 hours</option>
                <option value={8}>Every 8 hours</option>
                <option value={12}>Every 12 hours</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={saveToProfile}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold flex items-center gap-2 disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Settings"}
      </button>

      {/* Info Box */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h4 className="font-semibold text-sm mb-2">How it works</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Hydration reminders use your browser's Notification API</li>
          <li>• Medication reminders check your scheduled times from the Meds page</li>
          <li>• Keep this tab open to receive reminders</li>
          <li>• You can adjust or disable reminders anytime</li>
        </ul>
      </div>
    </div>
  );
}
