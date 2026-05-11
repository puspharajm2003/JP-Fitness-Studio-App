import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { 
  ArrowLeft, Users, CalendarCheck, MessageCircle, BarChart3, 
  Trophy, Search, Filter, ChevronRight, UserCheck, 
  TrendingUp, Activity, LayoutGrid, Settings, Star, Trash2,
  Shield, Clock
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CoachTab = "overview" | "roster" | "activity" | "library";

export default function CoachCrmPanel() {
  const { user } = useAuth();
  const { isCoach, loading } = useIsAdmin();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<CoachTab>("overview");
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<any>(null);

  const refresh = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data: coachProfile } = await (supabase as any).from("profiles").select("*").eq("id", user.id).single();
      setProfile(coachProfile);

      const { data: clientRows } = await (supabase as any)
        .from("profiles")
        .select("id,full_name,phone,goal,coach_id,coach_name,loyalty_points,created_at")
        .eq("coach_id", user.id)
        .order("full_name", { ascending: true });

      if (clientRows && clientRows.length > 0) {
        const clientIds = clientRows.map((row: any) => row.id);
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
    } catch (error: any) {
      toast.error(error.message || "Unable to load coach CRM data");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isCoach) refresh();
  }, [isCoach, user]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      (c.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!isCoach) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full p-8 text-center glass-card rounded-[2.5rem] shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Star className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="font-display font-black text-2xl mb-3">Coach Hub Locked</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          This portal is reserved for certified JP Studio coaches. Contact the head office to upgrade your account status.
        </p>
        <button onClick={() => navigate("/profile")} className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl active:scale-95 transition-all">
          <ArrowLeft className="w-4 h-4" /> Return to Profile
        </button>
      </div>
    </div>
  );

  const activeClientCount = clients.filter((client) => packages.some((pkg) => pkg.user_id === client.id)).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayCheckins = attendance.filter((row) => row.date === today).length;
  const totalRevenue = packages.reduce((sum, pkg) => sum + (parseFloat(pkg.price) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Side Navigation */}
      <aside className="w-full lg:w-72 bg-white dark:bg-slate-900 border-b lg:border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-black text-lg text-slate-900 dark:text-white leading-none">Coach Hub</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">Premium Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <CoachNavItem active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutGrid} label="Portfolio Stats" />
          <CoachNavItem active={activeTab === "roster"} onClick={() => setActiveTab("roster")} icon={Users} label="Client Roster" />
          <CoachNavItem active={activeTab === "activity"} onClick={() => setActiveTab("activity")} icon={Activity} label="Activity Logs" />
          <CoachNavItem active={activeTab === "library"} onClick={() => setActiveTab("library")} icon={LayoutGrid} label="Workout Link" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
          <Link to="/profile" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Back to Profile</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-1">Elite Coach Dashboard</p>
            <h2 className="font-display text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase">
              {activeTab === "overview" && "Executive Summary"}
              {activeTab === "roster" && "Client Directory"}
              {activeTab === "activity" && "Performance Logs"}
              {activeTab === "library" && "Workout Link"}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search clients..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-11 pr-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 w-64 transition-all"
              />
            </div>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <CoachStatCard label="Total Clients" value={clients.length} icon={Users} color="bg-blue-500" />
              <CoachStatCard label="Premium Clients" value={activeClientCount} icon={Trophy} color="bg-amber-500" />
              <CoachStatCard label="Today Check-ins" value={todayCheckins} icon={CalendarCheck} color="bg-emerald-500" />
              <CoachStatCard label="Projected Revenue" value={`₹${totalRevenue.toLocaleString()}`} icon={BarChart3} color="bg-purple-500" />
            </div>

            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
              <div className="glass-card rounded-[2.5rem] p-8 shadow-xl border-none">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display font-black text-xl">Priority Roster</h3>
                  <button onClick={() => setActiveTab("roster")} className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">Manage All <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="space-y-4">
                  {clients.slice(0, 4).map(client => (
                    <div key={client.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-emerald-500/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center font-black text-sm text-emerald-600 shadow-sm">
                          {client.full_name?.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white leading-none mb-1.5">{client.full_name || "Unnamed Client"}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{client.goal || "No Goal Set"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-emerald-600">{client.loyalty_points || 0} PTS</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Joined {new Date(client.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {clients.length === 0 && <p className="text-center py-10 text-muted-foreground text-sm font-medium">No clients assigned to your portfolio yet.</p>}
                </div>
              </div>

              <div className="rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <MessageCircle className="w-48 h-48" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-display text-3xl font-black mb-4 leading-tight">Coach Support</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-10">
                    Use this panel to monitor client consistency, track renewals, and ensure your members are reaching their biometric milestones.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Track 30-day consistency scores
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold">
                      <Star className="w-4 h-4 text-amber-400" />
                      Manage loyalty rewards & PT sessions
                    </div>
                  </div>
                </div>
                <button className="mt-8 px-8 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-xl active:scale-95 transition-all w-fit">
                  Message All Clients
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "roster" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client Identity</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Goal</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Plan</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Points</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                              {client.full_name?.slice(0, 1)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{client.full_name || "Unnamed"}</p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{client.phone || "No Phone"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                          {client.goal?.replace("_", " ") || "—"}
                        </td>
                        <td className="p-6">
                           {packages.find(p => p.user_id === client.id) ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{packages.find(p => p.user_id === client.id)?.name}</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Active Plan</span>
                              </div>
                           ) : (
                             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">No Active Plan</span>
                           )}
                        </td>
                        <td className="p-6 text-right font-black text-emerald-600">{client.loyalty_points || 0}</td>
                        <td className="p-6">
                           <div className="flex items-center justify-center gap-2">
                              <button onClick={() => window.open(`https://wa.me/${client.phone?.replace(/\D/g, "")}`, "_blank")} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-all"><MessageCircle className="w-4 h-4" /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border-none shadow-xl">
                <h3 className="font-display font-black text-xl mb-6">Deploy Protocol</h3>
                <VideoUploadForm onUpload={() => refresh()} coachName={profile?.full_name} />
              </div>
              <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border-none shadow-xl">
                <h3 className="font-display font-black text-xl mb-6">Active Library</h3>
                <VideoList onUpdate={() => refresh()} />
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

function CoachNavItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
        active 
          ? "bg-emerald-600 text-white shadow-xl translate-x-1" 
          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-white" : "text-slate-400 group-hover:text-emerald-600")} />
      <span className="text-sm font-bold">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />}
    </button>
  );
}

function CoachStatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="glass-card rounded-[2.5rem] p-8 border-none shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className={cn("absolute -top-12 -right-12 w-32 h-32 opacity-5 rounded-full", color)} />
      <div className="flex items-center justify-between mb-6">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="font-display text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
    </div>
  );
}
function VideoUploadForm({ coachName, onUpload }: { coachName: string; onUpload: () => void }) {
  const [form, setForm] = useState({ title: "", url: "" });
  const [busy, setBusy] = useState(false);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(form.url);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.title || !form.url) return;
    setBusy(true);
    // Coaches submit as 'pending'
    const { error } = await (supabase as any).from("workout_videos").insert([{ 
      ...form, 
      status: "pending", 
      coach_name: coachName 
    }]);
    if (error) toast.error(error.message);
    else {
      toast.success("Protocol submitted for approval");
      setForm({ title: "", url: "" });
      onUpload();
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Video Title</label>
          <input 
            value={form.title} 
            onChange={e => setForm({...form, title: e.target.value})}
            placeholder="e.g. Master Your Squat"
            className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">YouTube URL</label>
          <input 
            value={form.url} 
            onChange={e => setForm({...form, url: e.target.value})}
            placeholder="https://youtube.com/..."
            className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {videoId && (
          <div className="rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-lg">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Preview"
              allowFullScreen
            />
          </div>
        )}

        <button disabled={busy} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
          {busy ? "Syncing..." : "Submit for Approval"}
        </button>
      </form>
    </div>
  );
}
;function VideoList({ onUpdate }: { onUpdate: () => void }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any).from("workout_videos").select("*").order("created_at", { ascending: false })
      .then(({ data }: any) => {
        setVideos(data || []);
        setLoading(false);
      });
  }, [onUpdate]);

  const del = async (id: string) => {
    const { error } = await (supabase as any).from("workout_videos").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Video removed");
      onUpdate();
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse font-black text-slate-400 uppercase text-[10px] tracking-widest">Querying protocols...</div>;

  return (
    <div className="grid gap-4">
      {videos.map(v => (
        <div key={v.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              v.status === "published" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            )}>
              {v.status === "published" ? <Shield className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-bold text-sm leading-none mb-1.5">{v.title}</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                  v.status === "published" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {v.status || "pending"}
                </span>
                <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{v.url}</p>
              </div>
            </div>
          </div>
          <button onClick={() => del(v.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {videos.length === 0 && <div className="py-10 text-center text-slate-400 text-sm font-medium">No videos in library.</div>}
    </div>
  );
}
;
