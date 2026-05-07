import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ArrowLeft, Users, CalendarCheck, MessageCircle, BarChart3, Trophy } from "lucide-react";
import { toast } from "sonner";

export default function CoachCrmPanel() {
  const { user } = useAuth();
  const { isCoach, loading } = useIsAdmin();
  const [clients, setClients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data: clientRows } = await supabase
        .from("profiles")
        .select("id,full_name,phone,goal,coach_id,coach_name,loyalty_points,created_at")
        .eq("coach_id", user.id)
        .order("full_name", { ascending: true });

      if (clientRows && clientRows.length > 0) {
        const clientIds = clientRows.map((row:any) => row.id);
        const [pkgRes, attRes] = await Promise.all([
          supabase.from("packages").select("user_id,name,price,status,end_date").in("user_id", clientIds).eq("status", "active"),
          supabase.from("attendance").select("user_id,date").in("user_id", clientIds),
        ]);

        setClients(clientRows || []);
        setPackages(pkgRes.data || []);
        setAttendance(attRes.data || []);
      } else {
        setClients([]);
        setPackages([]);
        setAttendance([]);
      }
    } catch (error:any) {
      toast.error(error.message || "Unable to load coach CRM data");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isCoach) refresh();
  }, [isCoach, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!isCoach) return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="glass-card rounded-3xl p-8 max-w-md text-center">
        <h2 className="font-display text-2xl font-bold mb-3">Coach access required</h2>
        <p className="text-sm text-muted-foreground mb-6">This section is only available to users with a coach role.</p>
        <Link to="/profile" className="inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-white">Back to profile</Link>
      </div>
    </div>
  );

  const clientCount = clients.length;
  const activeClientCount = clients.filter((client) => packages.some((pkg) => pkg.user_id === client.id)).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCheckins = attendance.filter((row) => row.date === today).length;
  const totalRevenue = packages.reduce((sum, pkg) => sum + (parseFloat(pkg.price) || 0), 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,#02060d,#08101f)] text-slate-100">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="space-y-3">
            <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white">
              <ArrowLeft className="w-4 h-4"/>Back to profile
            </Link>
            <div className="space-y-1">
              <p className="uppercase tracking-[0.25em] text-[11px] text-cyan-300/90 font-semibold">Coach CRM</p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">Coach Panel</h1>
              <p className="max-w-2xl text-sm text-slate-400">Manage your client roster, monitor attendance, and keep premium coaching details in one mobile-friendly view.</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 backdrop-blur">
            <MessageCircle className="w-4 h-4 text-emerald-300"/>
            <span>Coach dashboard</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <PanelCard icon={Users} label="Clients" value={clientCount} />
          <PanelCard icon={Trophy} label="Active clients" value={activeClientCount} />
          <PanelCard icon={CalendarCheck} label="Today check-ins" value={todayCheckins} />
          <PanelCard icon={BarChart3} label="Weekly revenue" value={`₹${totalRevenue.toLocaleString()}`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.30)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Assigned clients</h2>
                <p className="text-sm text-slate-400">A summary of your coaching roster and package status.</p>
              </div>
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">{clientCount} total</span>
            </div>
            <div className="space-y-3">
              {clients.map((client) => (
                <div key={client.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 transition hover:border-cyan-400/20 hover:bg-slate-900">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-white">{client.full_name || "Unnamed client"}</p>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Goal: {client.goal || "—"}</p>
                    </div>
                    <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">{client.loyalty_points || 0} pts</span>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-300">{client.phone || "No phone"}</span>
                    <span className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-slate-300">Joined {client.created_at ? new Date(client.created_at).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/80 p-6 text-center text-slate-400">
                  No clients assigned yet. Your assigned members will appear here once they are linked to your coach profile.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.25)]">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Coach insights</p>
            <h3 className="mt-3 text-xl font-bold text-white">Premium mobility</h3>
            <p className="mt-2 text-sm text-slate-400">Everything is optimized for on-the-go coaching from mobile devices, with clean cards and fast actions.</p>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="rounded-3xl bg-slate-900/80 p-4">Track clients by activity, package and communication status in a single view.</div>
              <div className="rounded-3xl bg-slate-900/80 p-4">Coach CRM panel is aligned with the existing admin experience but tailored for coaching workflows.</div>
              <div className="rounded-3xl bg-slate-900/80 p-4">Use this panel to stay connected with assigned clients, monitor check-ins, and manage loyalty points efficiently.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelCard({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/85 p-5 shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-display font-extrabold text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-400/10 text-cyan-300">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
