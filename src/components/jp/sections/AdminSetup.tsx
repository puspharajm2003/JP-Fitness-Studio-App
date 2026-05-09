import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { 
  Shield, CheckCircle, AlertTriangle, UserPlus, Users, 
  Settings, Key, Activity, ChevronRight, Search, Trash2, 
  Mail, ShieldCheck, ShieldAlert, Lock, Zap, Globe
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SUPER_ADMIN_EMAIL = "puspharaj.m2003@gmail.com";

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2rem] bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.005]",
    className
  )}>
    {children}
  </div>
);

interface AdminUser {
  user_id: string;
  role: string;
  email?: string;
  created_at?: string;
}

export default function AdminSetup() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasRole, setHasRole] = useState(false);
  const [checking, setChecking] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoadingAdmins(true);
    try {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("role", "admin");

      if (rolesErr) throw rolesErr;
      
      // Fetch profile emails for these user IDs
      const userIds = roles.map(r => r.user_id);
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      // Note: We'll have to rely on the current user's ability to see emails via profiles or similar
      // Since 'email' is in auth.users, but we have 'profiles' linked.
      // Usually full_name is a better display field anyway.
      
      const formatted = roles.map(r => {
        const p = profiles?.find(prof => prof.id === r.user_id);
        return {
          user_id: r.user_id,
          role: r.role,
          email: p?.full_name || "Admin User",
          created_at: r.created_at
        };
      });
      
      setAdmins(formatted);
    } catch (err: any) {
      console.error("Error fetching admins:", err);
      toast.error("Failed to load admin list: " + err.message);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav("/auth", { replace: true });
      return;
    }

    const email = user.email || "";
    const isSA = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
    setIsSuperAdmin(isSA);

    if (!isSA) {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setHasRole(data?.role === "admin");
          setChecking(false);
          if (!data || data.role !== "admin") {
            toast.error("Access denied. Admin only.");
            nav("/", { replace: true });
          } else {
            fetchAdmins();
          }
        });
    } else {
      supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id, role" })
        .then(() => {
          setHasRole(true);
          setChecking(false);
          fetchAdmins();
        });
    }
  }, [user, loading, nav, fetchAdmins]);

  const removeAdmin = async (id: string, email: string) => {
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      toast.error("Cannot remove the primary Super Admin");
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", id)
      .eq("role", "admin");

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Admin role revoked");
      fetchAdmins();
    }
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Initializing Secure Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
              <ShieldCheck className="w-4 h-4" />
              Security Infrastructure
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">Admin Control Center</h1>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => nav("/admin")}
              className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all"
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              CRM Dashboard
            </button>
            <button 
              onClick={fetchAdmins}
              className="px-6 py-3 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4" />
              Sync Access
            </button>
          </div>
        </div>

        {/* Status & Health Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard className="p-6">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                 <CheckCircle className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase text-slate-400">System Status</p>
                 <p className="font-bold text-slate-900 dark:text-white">Operational</p>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs text-slate-500 font-medium">All security protocols active</span>
             </div>
          </GlassCard>

          <GlassCard className="p-6">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                 <Users className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase text-slate-400">Admin Count</p>
                 <p className="font-bold text-slate-900 dark:text-white">{admins.length} Active Users</p>
               </div>
             </div>
             <div className="flex -space-x-2">
               {admins.slice(0, 5).map((a, i) => (
                 <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black uppercase">
                   {a.email?.slice(0, 1)}
                 </div>
               ))}
               {admins.length > 5 && <div className="text-xs text-slate-500 ml-4 font-bold">+{admins.length - 5} more</div>}
             </div>
          </GlassCard>

          <GlassCard className="p-6">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                 <Lock className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase text-slate-400">Access Level</p>
                 <p className="font-bold text-slate-900 dark:text-white">{isSuperAdmin ? "Super Admin" : "Full Admin"}</p>
               </div>
             </div>
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
               {isSuperAdmin 
                 ? "You have global read/write permissions for all core infrastructure tables." 
                 : "You have administrative access to CRM and Member management."}
             </p>
          </GlassCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Create New Admin */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 px-2">
               <UserPlus className="w-5 h-5 text-primary" />
               Escalate Privileges
            </h2>
            <GlassCard className="p-8">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShieldPlus size={120} />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white mb-2">Assign Administrative Role</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Search for a registered user by their email address to grant them administrative capabilities. 
                    This includes access to CRM data and user roles.
                  </p>
                </div>
                
                <CreateAdminForm isSuperAdmin={isSuperAdmin} onCreated={fetchAdmins} />
                
                {!isSuperAdmin && (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-tight leading-relaxed">
                      Restricted Access: Only the primary infrastructure owner can delegate administrative roles to other members.
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
               <button className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 group hover:border-primary/20 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                    <Key className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Audit Logs</p>
                    <p className="text-sm font-bold">Security History</p>
                  </div>
               </button>
               <button className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 group hover:border-emerald-500/20 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">API Health</p>
                    <p className="text-sm font-bold">Edge Functions</p>
                  </div>
               </button>
            </div>
          </div>

          {/* Admin List */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 px-2">
               <ShieldCheck className="w-5 h-5 text-emerald-500" />
               Current Access List
            </h2>
            <GlassCard className="p-4 overflow-hidden">
              <div className="divide-y divide-white/10 max-h-[500px] overflow-y-auto pr-2">
                {loadingAdmins ? (
                  <div className="py-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                    Querying access protocols...
                  </div>
                ) : admins.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">No admins found</p>
                  </div>
                ) : (
                  admins.map((admin) => (
                    <div key={admin.user_id} className="py-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{admin.email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                              {admin.user_id === user.id ? "Your Account" : "Active Admin"}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">Added {new Date(admin.created_at!).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {isSuperAdmin && admin.email?.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase() && (
                        <button 
                          onClick={() => removeAdmin(admin.user_id, admin.email!)}
                          className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateAdminForm({ isSuperAdmin, onCreated }: { isSuperAdmin: boolean, onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !isSuperAdmin) return;
    setBusy(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("full_name", email)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile) {
        toast.error("User not found with that email. Ensure they have signed up first.");
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: profile.id, role: "admin" as any },
          { onConflict: "user_id, role" }
        );

      if (error) throw error;
      toast.success(`Successfully promoted ${email} to Admin!`);
      setEmail("");
      onCreated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={createAdmin} className="space-y-4">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="email"
          required
          disabled={!isSuperAdmin || busy}
          placeholder="Enter member email address..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={!isSuperAdmin || busy || !email}
        className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
        Grant Infrastructure Access
      </button>
    </form>
  );
}

function ShieldPlus({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
