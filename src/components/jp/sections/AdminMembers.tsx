import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Users, UserPlus, Edit2, Trash2, Search, ArrowLeft, Shield, Mail, Phone, Zap, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  loyalty_points: number;
  package_name?: string;
  package_status?: string;
  package_end?: string;
}

const SYNC_INTERVAL = 20000; // 20s for member list

export default function AdminMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", role: "member" });

  const load = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setIsSyncing(true);
    try {
      const [profilesRes, rolesRes, packagesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("packages").select("*").order("end_date", { ascending: false })
      ]);

      const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]) || []);
      const pkgMap = new Map();
      (packagesRes.data || []).forEach(pkg => {
        if (!pkgMap.has(pkg.user_id)) {
          pkgMap.set(pkg.user_id, pkg);
        }
      });

      const list = (profilesRes.data || []).map(p => {
        const pkg = pkgMap.get(p.id);
        return {
          id: p.id,
          full_name: p.full_name || "Unknown",
          email: (p as any).email || "",
          phone: p.phone || "",
          role: roleMap.get(p.id) || "member",
          loyalty_points: p.loyalty_points || 0,
          package_name: pkg?.name,
          package_status: pkg?.status,
          package_end: pkg?.end_date,
        };
      });
      setMembers(list);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => { 
    load(true);
    const id = setInterval(() => load(false), SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [load]);

  const addMember = async (e: any) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true,
        user_metadata: { full_name: form.full_name, phone: form.phone },
      });
      if (error) throw error;

      await supabase.from("user_roles").insert({ user_id: data.user.id, role: form.role as any });
      toast.success("Member added!");
      setShowAdd(false);
      setForm({ email: "", password: "", full_name: "", phone: "", role: "member" });
      load(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Delete this member? This will remove all their data.")) return;
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      toast.success("Member deleted");
      load(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/admin" className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-all mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Badge variant="outline" className="rounded-full bg-blue-500/5 text-blue-600 border-blue-500/20 px-3 py-1 font-black text-[10px] uppercase tracking-widest">
              Member Directory
            </Badge>
            {isSyncing && <RefreshCcw className="w-3.5 h-3.5 text-primary animate-spin" />}
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-black tracking-tight">Member <span className="text-muted-foreground/30 font-normal">Vault</span></h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Manage user roles, identity, and access levels.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)} 
          className="px-6 h-14 rounded-2xl bg-gradient-brand text-primary-foreground font-black text-sm shadow-brand flex items-center gap-2 hover:scale-[1.02] transition-all"
        >
          <UserPlus className="w-5 h-5" /> Add New Member
        </button>
      </header>

      {showAdd && (
        <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-white dark:bg-slate-900 animate-in slide-in-from-top duration-500">
          <h3 className="font-display font-black text-2xl mb-6">Create Security Profile</h3>
          <form onSubmit={addMember} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identity Name</label>
               <input required placeholder="Full legal name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Protocol</label>
               <input required type="email" placeholder="user@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Password</label>
               <input required type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Link</label>
               <input placeholder="+1 234 567 890" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Authority Level</label>
               <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}
                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer">
                <option value="member">Member (L1)</option>
                <option value="coach">Coach (L2)</option>
                <option value="admin">Admin (L3)</option>
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-1 flex items-end gap-2 pb-1">
              <button type="submit" className="flex-1 h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-sm hover:scale-[1.02] transition-all">Initialize Profile</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 h-14 rounded-2xl bg-secondary font-bold text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card rounded-[32px] p-8 border-none shadow-premium bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center gap-4 mb-8 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <Search className="w-5 h-5 text-muted-foreground ml-2" />
          <input 
            placeholder="Search by identity or contact..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-bold" 
          />
          <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">{filtered.length} RECORDS</Badge>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
             <p className="font-display font-black text-slate-400 uppercase tracking-widest text-sm">Synchronizing Database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="pl-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Member Identity</th>
                  <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Authority</th>
                  <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Current Plan</th>
                  <th className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Points</th>
                  <th className="pr-8 text-right text-[10px] font-black uppercase text-muted-foreground tracking-widest">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-soft flex items-center justify-center font-black text-primary text-sm shadow-sm group-hover:scale-110 transition-transform">
                          {m.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-base leading-none mb-1.5">{m.full_name}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                             <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {m.email}</span>
                             {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {m.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge className={cn(
                        "rounded-lg px-3 py-1.5 text-[10px] font-black border-none uppercase tracking-widest shadow-sm",
                        m.role === "admin" ? "bg-purple-500/10 text-purple-600" :
                        m.role === "coach" ? "bg-blue-500/10 text-blue-600" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        <Shield className="w-3 h-3 mr-1.5 inline" /> {m.role}
                      </Badge>
                    </td>
                    <td>
                      {m.package_name ? (
                        <div className="flex flex-col">
                           <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{m.package_name}</span>
                           <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Active until {m.package_end}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Active Plan</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {m.loyalty_points}
                      </div>
                    </td>
                    <td className="pr-8 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/members/${m.id}`} className="p-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-all">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => deleteMember(m.id)} className="p-2.5 rounded-xl bg-secondary hover:bg-destructive hover:text-white transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                       <div className="flex flex-col items-center justify-center gap-3">
                          <Users className="w-16 h-16 text-slate-200" />
                          <p className="font-display font-black text-slate-400 uppercase tracking-widest text-sm">No matching records found</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
