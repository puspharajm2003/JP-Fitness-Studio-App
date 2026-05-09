import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, Search, Filter, Mail, Phone, Calendar, 
  ArrowRight, Shield, ShieldCheck, Zap, MoreHorizontal,
  Download, UserPlus, Trash2, Edit3, ChevronRight,
  Database, Fingerprint, Lock
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const GlassCard = ({ children, className }: any) => (
  <div className={cn(
    "relative overflow-hidden rounded-[2.5rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
    className
  )}>
    {children}
  </div>
);

export default function AdminMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles (role),
          packages (status, end_date)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = 
        m.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        m.email?.toLowerCase().includes(search.toLowerCase());
      
      if (filter === "all") return matchesSearch;
      if (filter === "active") return matchesSearch && m.packages?.some((p: any) => p.status === "active");
      if (filter === "coach") return matchesSearch && m.user_roles?.some((r: any) => r.role === "coach");
      return matchesSearch;
    });
  }, [members, search, filter]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Vault Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <Database className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Secure Database</p>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Member <span className="text-slate-300 dark:text-slate-700">Vault</span></h1>
          </div>
          
          <div className="flex gap-4">
             <button className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all">
               <Download className="w-5 h-5 text-slate-400" />
             </button>
             <button className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
               <UserPlus className="w-4 h-4" /> New Identity
             </button>
          </div>
        </div>

        {/* Intelligence Filter Bar */}
        <GlassCard className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, or identity token..." 
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/50 dark:bg-black/20 border-none text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {["all", "active", "coach"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex-1 md:flex-none px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                    filter === f 
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" 
                      : "bg-white/50 dark:bg-black/20 text-slate-400 hover:bg-white transition-all"
                  )}
                >
                  {f}
                </button>
              ))}
              <button className="p-4 rounded-2xl bg-white/50 dark:bg-black/20 text-slate-400">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Member Grid */}
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
             <div className="relative">
               <div className="w-20 h-20 border-4 border-primary/10 rounded-full" />
               <div className="absolute inset-0 w-20 h-20 border-4 border-t-primary rounded-full animate-spin" />
               <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary/40" />
             </div>
             <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Synchronizing Vault Access...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredMembers.map(m => (
              <MemberIdentityCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberIdentityCard({ member }: { member: any }) {
  const role = member.user_roles?.[0]?.role || "member";
  const isActive = member.packages?.some((p: any) => p.status === "active");

  return (
    <GlassCard className="group">
       <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
             <div className="relative">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner group-hover:scale-110 transition-all duration-500 overflow-hidden">
                   {member.full_name?.slice(0, 2).toUpperCase()}
                   <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center",
                  isActive ? "bg-emerald-500" : "bg-slate-400"
                )}>
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
             </div>
             <div className="flex gap-2">
                <button className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-all">
                   <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-all">
                   <Trash2 className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div>
             <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{member.full_name}</h3>
                {role !== "member" && (
                  <Badge className="bg-indigo-500/10 text-indigo-600 text-[8px] font-black uppercase tracking-widest border-none">
                    {role}
                  </Badge>
                )}
             </div>
             <p className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {member.email}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Loyalty</p>
                <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                   <Zap className="w-3.5 h-3.5 text-amber-500" />
                   {member.loyalty_points}
                </p>
             </div>
             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Level</p>
                <p className="font-black text-slate-900 dark:text-white">Tier {Math.floor(member.loyalty_points / 500) + 1}</p>
             </div>
          </div>

          <Link 
            to={`/admin/members/${member.id}`} 
            className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all group/btn"
          >
            Access Full Record
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
       </div>
       
       <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
          <div className={cn("h-full transition-all duration-1000", isActive ? "bg-emerald-500" : "bg-slate-400")} style={{ width: isActive ? "100%" : "30%" }} />
       </div>
    </GlassCard>
  );
}

function Badge({ children, className }: any) {
  return (
    <span className={cn("px-2 py-0.5 rounded-full", className)}>
      {children}
    </span>
  );
}
