import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile } from "@/lib/useProfile";
import { ClipboardCheck, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function Attendance() {
  const { user } = useAuth();
  const { profile, refresh } = useProfile();
  const [logs, setLogs] = useState<any[]>([]);
  const [todayDone, setTodayDone] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("attendance").select("*").eq("user_id", user.id).order("check_in", {ascending:false}).limit(60);
    setLogs(data || []);
    const t = new Date().toISOString().slice(0,10);
    setTodayDone((data||[]).some((d:any) => d.date === t));
  };
  useEffect(() => { load(); }, [user]);

   const checkIn = async () => {
     if (!user) return;
     const t = new Date().toISOString().slice(0, 10);
     const { error } = await supabase.from("attendance").insert({ user_id: user.id, date: t });
     if (error) {
       // Handle unique constraint violation (duplicate check-in for today)
       if (error.code === '23505') {
         toast("Already checked in today! Come back tomorrow 💪", { icon: "✅" });
       } else {
         toast.error(error.message);
       }
       return;
     }
     // Award loyalty points
     const newPoints = (profile?.loyalty_points || 0) + 10;
     await supabase.from("profiles").update({ loyalty_points: newPoints }).eq("id", user.id);
     // Log point change
     await supabase.from("loyalty_point_logs").insert({
       user_id: user.id,
       points_change: 10,
       reason: "check-in",
       related_id: null,
     });
     // Refresh profile to update loyalty_points in UI
     await refresh();
     toast.success(`Checked in! +10 loyalty points (Total: ${newPoints} pts)`);
     load();
   };

  // Build last 30-day calendar grid
  const days = Array.from({length: 30}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0,10);
    return { key, day: d.getDate(), present: logs.some(l => l.date === key) };
  });
  const streak = (() => { let s = 0; for (let i = days.length-1; i>=0; i--) { if (days[i].present) s++; else break; } return s; })();
  const points = profile?.loyalty_points || 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-brand p-6 text-primary-foreground shadow-brand">
        <p className="text-xs uppercase tracking-widest opacity-90">Today</p>
        <h2 className="font-display text-3xl font-extrabold mt-1">{todayDone ? "✓ Checked In" : "Not yet checked in"}</h2>
        <p className="opacity-90 mt-1 mb-4 flex items-center gap-1.5"><Flame className="w-4 h-4"/> {streak}-day streak</p>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={todayDone} onClick={checkIn} className="px-6 py-3 rounded-xl bg-white text-foreground font-semibold flex items-center gap-2 disabled:opacity-50">
            <ClipboardCheck className="w-4 h-4"/> {todayDone ? "Already checked in" : "Check in now"}
          </button>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur">
            <Trophy className="w-4 h-4" />
            <span className="font-bold text-sm">{points} pts</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-4">Last 30 days</h3>
        <div className="grid grid-cols-10 gap-2">
          {days.map(d => (
            <div key={d.key} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold ${d.present ? "bg-gradient-brand text-primary-foreground shadow-brand" : "bg-secondary text-muted-foreground"}`}>
              {d.day}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">{logs.length} total visits in last 60 days</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3">Recent check-ins</h3>
        <ul className="space-y-2">
          {logs.slice(0,8).map(l => (
            <li key={l.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
              <span>{new Date(l.check_in).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}</span>
              <span className="text-muted-foreground">{new Date(l.check_in).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
            </li>
          ))}
          {logs.length === 0 && <li className="text-sm text-muted-foreground">No check-ins yet.</li>}
        </ul>
      </div>
    </div>
  );
}

