import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Users, DollarSign, TrendingUp, Activity, Calendar, 
  BarChart3, Search, Filter, Download, RefreshCcw, CheckCircle2,
  AlertTriangle, ArrowUpRight, ArrowDownRight, MoreHorizontal, UserPlus,
  Target, Zap, ShieldCheck, Trash2, Shield, Clock, Eye, Lock,
  FileText, PieChart, Database, Cpu, Globe, Server
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart as RePieChart, Pie } from "recharts";
import { toast } from "sonner";
import gsap from "gsap";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  membership_status: string;
  join_date: string;
  total_spent: number;
  last_checkin: string;
  loyalty_points: number;
  role: string;
  package_end?: string;
}

const SYNC_INTERVAL = 30000; // 30 seconds

export default function AdminCRMAdvanced() {
  const { user } = useAuth();
  const nav = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"analytics" | "members" | "revenue" | "security" | "management" | "library" | "reports">("analytics");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (user?.email?.toLowerCase() === "puspharaj.m2003@gmail.com") {
      setIsSuperAdmin(true);
    }
  }, [user]);

  const loadData = useCallback(async (isInitial = false) => {
    if (!user) return;
    if (isInitial) setLoading(true);
    setIsSyncing(true);

    try {
      const [profilesRes, rolesRes, packagesRes, attendanceRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("packages").select("*"),
        supabase.from("attendance").select("*").order("check_in", { ascending: false })
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const roleMap = new Map(rolesRes.data?.map(r => [r.user_id, r.role]) || []);
      const memberList: Member[] = (profilesRes.data || []).map(p => {
        const userPackages = packagesRes.data?.filter(pkg => pkg.user_id === p.id) || [];
        const activePkg = userPackages.find(pkg => pkg.status === "active");
        const lastAtt = attendanceRes.data?.find(a => a.user_id === p.id);

        return {
          id: p.id,
          full_name: p.full_name || "Unnamed",
          email: (p as any).email || "-",
          phone: p.phone || "-",
          membership_status: activePkg ? "Active" : "Inactive",
          join_date: p.created_at?.split("T")[0] || "-",
          total_spent: userPackages.reduce((sum, pkg) => sum + (pkg.price || 0), 0),
          last_checkin: lastAtt ? lastAtt.check_in?.split("T")[0] : "Never",
          loyalty_points: p.loyalty_points || 0,
          role: roleMap.get(p.id) || "member",
          package_end: activePkg?.end_date,
        };
      });

      setMembers(memberList);

      // Process Charts
      const now = new Date();
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { 
          name: d.toLocaleString('en', { month: 'short' }), 
          revenue: 0, 
          attendance: 0,
          fullDate: d
        };
      });

      packagesRes.data?.forEach(pkg => {
        if (!pkg.start_date) return;
        const d = new Date(pkg.start_date);
        const entry = last6Months.find(m => m.fullDate.getMonth() === d.getMonth() && m.fullDate.getFullYear() === d.getFullYear());
        if (entry) entry.revenue += (pkg.price || 0);
      });

      attendanceRes.data?.forEach(att => {
        if (!att.check_in) return;
        const d = new Date(att.check_in);
        const entry = last6Months.find(m => m.fullDate.getMonth() === d.getMonth() && m.fullDate.getFullYear() === d.getFullYear());
        if (entry) entry.attendance += 1;
      });

      setRevenueData(last6Months);
      setAttendanceData(last6Months);
      setLastSync(new Date());
    } catch (error: any) {
      toast.error("Sync failed: " + error.message);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(false), SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".crm-animate"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [loading, activeTab]);

  const runFullReport = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(20);
    doc.text("JP Fitness Studio - Executive Business Report", 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    
    const stats = [
      ["Total Members", members.length],
      ["Active Subscriptions", members.filter(m => m.membership_status === "Active").length],
      ["Total Revenue", `$${members.reduce((s, m) => s + m.total_spent, 0)}`],
      ["Average Points", Math.round(members.reduce((s, m) => s + m.loyalty_points, 0) / members.length)]
    ];

    doc.autoTable({
      head: [["Metric", "Value"]],
      body: stats,
      startY: 40,
      theme: "grid"
    });

    doc.text("Member Distribution by Role", 20, doc.lastAutoTable.finalY + 20);
    const roles = ["admin", "coach", "member"].map(r => [r.toUpperCase(), members.filter(m => m.role === r).length]);
    doc.autoTable({
      head: [["Role", "Count"]],
      body: roles,
      startY: doc.lastAutoTable.finalY + 30,
    });

    doc.save(`JP_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Executive Report Generated");
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
        <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
      </div>
      <p className="font-black text-white uppercase tracking-[0.4em] text-[10px]">Initializing Analytics Engine...</p>
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen flex bg-[#fafafa] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-700">
      
      {/* --- ADVANCED SIDEBAR --- */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 flex flex-col shadow-2xl z-50">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-3xl bg-primary shadow-xl shadow-primary/20 flex items-center justify-center transform hover:rotate-12 transition-transform cursor-pointer">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-black text-2xl tracking-tighter leading-none">CORE <span className="text-primary">OS</span></h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Admin Protocol</p>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarItem active={activeTab === "analytics"} onClick={()=>setActiveTab("analytics")} icon={PieChart} label="Analytics Core" />
            <SidebarItem active={activeTab === "members"} onClick={()=>setActiveTab("members")} icon={Users} label="Member Vault" />
            <SidebarItem active={activeTab === "revenue"} onClick={()=>setActiveTab("revenue")} icon={DollarSign} label="Revenue Tracking" />
            <SidebarItem active={activeTab === "library"} onClick={()=>setActiveTab("library")} icon={Zap} label="Workout Link" />
            <SidebarItem active={activeTab === "security"} onClick={()=>setActiveTab("security")} icon={Lock} label="Security Hub" />
            {isSuperAdmin && <SidebarItem active={activeTab === "management"} onClick={()=>setActiveTab("management")} icon={Cpu} label="Control Center" />}
            <SidebarItem active={activeTab === "reports"} onClick={()=>setActiveTab("reports")} icon={FileText} label="Report Center" />
          </nav>
        </div>

        <div className="mt-auto p-8 space-y-4">
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 scale-150"><Activity /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active Sync</p>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mb-3">{lastSync.toLocaleTimeString()}</p>
              <button onClick={()=>loadData(false)} className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:gap-3 transition-all">
                Force Refetch <RefreshCcw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
              </button>
            </div>
          </div>
          
          <Button variant="outline" className="w-full rounded-2xl h-12 font-black text-[11px] uppercase tracking-widest border-slate-200 dark:border-white/10 hover:bg-slate-100" onClick={() => nav("/profile")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit Terminal
          </Button>
        </div>
      </aside>

      {/* --- MAIN DASHBOARD --- */}
      <main className="flex-1 overflow-auto p-10 lg:p-16">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Dashboard Header */}
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 crm-animate">
            <div className="space-y-2">
              <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20 px-4 py-1.5 font-black text-[10px] uppercase tracking-[0.3em]">
                {activeTab === "analytics" ? "Global Intelligence" : `Section / ${activeTab}`}
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-none uppercase">
                {activeTab.replace("management", "Control").replace("library", "Video").replace("analytics", "Analytics")}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative flex-1 lg:w-80 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Query identity database..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
              </div>
              <Button onClick={runFullReport} className="h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                <Download className="w-4 h-4 mr-2" /> Run Report
              </Button>
            </div>
          </header>

          {/* Section Content */}
          <div className="space-y-12 crm-animate">
            
            {activeTab === "analytics" && (
              <div className="space-y-10">
                {/* Real-time Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <MetricCard label="Total Capital" value={`$${members.reduce((s,m)=>s+m.total_spent,0).toLocaleString()}`} icon={DollarSign} trend="+12.4%" color="sky" />
                   <MetricCard label="Active Roster" value={members.filter(m=>m.membership_status==="Active").length} icon={Users} trend="+5.2%" color="indigo" />
                   <MetricCard label="System Points" value={members.reduce((s,m)=>s+m.loyalty_points,0).toLocaleString()} icon={Zap} trend="+8.1%" color="amber" />
                   <MetricCard label="Avg Retention" value="94.2%" icon={Activity} trend="+0.5%" color="emerald" />
                </div>

                <div className="grid lg:grid-cols-2 gap-10">
                   <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-8 lg:p-12 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 scale-150"><DollarSign size={160} /></div>
                      <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><TrendingUp className="text-primary" /> Revenue Velocity</h3>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: "currentColor", opacity: 0.4}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: "currentColor", opacity: 0.4}} />
                            <Tooltip content={<CustomTooltip />} cursor={{stroke: 'hsl(var(--primary))', strokeWidth: 2}} />
                            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </Card>

                   <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 p-8 lg:p-12">
                      <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Users className="text-emerald-500" /> Engagement Flux</h3>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: "currentColor", opacity: 0.4}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: "currentColor", opacity: 0.4}} />
                            <Tooltip cursor={{fill: 'currentColor', opacity: 0.05}} />
                            <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                               {attendanceData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fillOpacity={0.4 + (index / 6)} />
                               ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                   </Card>
                </div>
              </div>
            )}

            {activeTab === "members" && (
               <Card className="rounded-[3rem] border-none shadow-3xl bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="p-10 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                     <div>
                       <h3 className="text-3xl font-black">Identity Repository</h3>
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Live database of all authorized studio members</p>
                     </div>
                     <div className="flex gap-4">
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest">Filter: Status</Button>
                        <Button className="rounded-2xl h-12 px-6 bg-primary text-white font-black text-[10px] uppercase tracking-widest">Add New Member</Button>
                     </div>
                  </div>
                  <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                      <TableRow className="border-none">
                        <TableHead className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest">Identity</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Access Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Loyalty Rank</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-10">Asset Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.filter(m => m.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                        <TableRow key={m.id} className="border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer group" onClick={()=>setSelectedMember(m)}>
                           <TableCell className="pl-10 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                                   {m.full_name.slice(0,1)}
                                 </div>
                                 <div>
                                    <p className="font-black text-sm">{m.full_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.email}</p>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className={cn("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-none", m.membership_status==="Active"?"bg-emerald-500 text-white":"bg-slate-100 text-slate-400")}>
                                {m.membership_status}
                              </Badge>
                           </TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2">
                                 <Zap className="w-3.5 h-3.5 text-amber-500" />
                                 <span className="font-black text-sm">{m.loyalty_points}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right pr-10">
                              <span className="font-black text-sm">${m.total_spent}</span>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </Card>
            )}

            {activeTab === "revenue" && (
               <div className="space-y-12 animate-pop">
                  <div className="grid md:grid-cols-3 gap-8">
                     <MetricCard label="Net Revenue" value={`$${members.reduce((s,m)=>s+m.total_spent,0)}`} icon={DollarSign} trend="+15%" color="sky" />
                     <MetricCard label="Recurring Yield" value="$12.4K" icon={RefreshCcw} trend="+4%" color="indigo" />
                     <MetricCard label="Avg Ticket" value={`$${Math.round(members.reduce((s,m)=>s+m.total_spent,0)/members.length)}`} icon={Target} trend="+2%" color="emerald" />
                  </div>
                  
                  <Card className="rounded-[3rem] border-none shadow-3xl bg-white dark:bg-slate-900 overflow-hidden p-10">
                     <h3 className="text-3xl font-black mb-10">Transaction Ledger</h3>
                     <div className="space-y-4">
                        {members.filter(m => m.total_spent > 0).sort((a,b)=>b.total_spent - a.total_spent).map(m => (
                           <div key={m.id} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 flex items-center justify-between group hover:scale-[1.01] transition-transform">
                              <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm"><DollarSign /></div>
                                 <div>
                                    <p className="font-black text-lg">Transaction #{m.id.slice(0,8)}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{m.full_name} • {m.join_date}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+${m.total_spent}</p>
                                 <p className="text-[10px] font-black uppercase text-slate-400">Payment Processed</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </Card>
               </div>
            )}

            {activeTab === "security" && (
               <div className="grid lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-10">
                     <Card className="rounded-[3rem] border-none shadow-3xl bg-slate-900 p-12 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Shield size={200} /></div>
                        <div className="relative z-10 space-y-6">
                           <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-primary"><Lock size={32} /></div>
                           <h2 className="text-4xl font-black tracking-tight">System Integrity</h2>
                           <p className="text-slate-400 text-lg max-w-md">No security breaches detected in the last 72 hours. All access tokens are active and encrypted.</p>
                           <div className="flex gap-6">
                              <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Firewall Active</span>
                              </div>
                              <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">SSL Handshake Valid</span>
                              </div>
                           </div>
                        </div>
                     </Card>

                     <Card className="rounded-[3rem] border-none shadow-3xl bg-white dark:bg-slate-900 p-10">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white"><Database className="text-primary" /> Neon Satellite Support</h3>
                        <div className="space-y-6">
                           <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                              <p className="text-sm font-bold mb-2">External Database Sync</p>
                              <p className="text-xs text-slate-500 mb-6">Synchronize your studio identity and transaction data with your external Neon Postgres instance.</p>
                              <div className="flex flex-wrap gap-3">
                                 <Button 
                                    onClick={async () => {
                                      const { NeonSync } = await import("@/lib/neon_sync");
                                      const sql = await NeonSync.generateSqlDump();
                                      if (sql) {
                                        const blob = new Blob([sql], { type: "text/sql" });
                                        const url = URL.createObjectURL(blob);
                                        const link = document.createElement("a");
                                        link.href = url;
                                        link.download = "jp_studio_neon_migration.sql";
                                        link.click();
                                        toast.success("SQL Migration Script Generated");
                                      }
                                    }}
                                    className="px-6 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest"
                                 >
                                    Generate Neon SQL
                                 </Button>
                                 <Button 
                                    variant="outline"
                                    onClick={async () => {
                                      const { NeonSync } = await import("@/lib/neon_sync");
                                      await NeonSync.downloadJsonBackup();
                                    }}
                                    className="px-6 h-10 rounded-xl border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest"
                                 >
                                    Export JSON
                                 </Button>
                              </div>
                           </div>
                        </div>
                     </Card>

                     <Card className="rounded-[3rem] border-none shadow-3xl bg-white dark:bg-slate-900 p-10">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white"><Eye className="text-slate-400" /> Access Logs</h3>
                        <div className="space-y-6">
                           {members.slice(0, 6).map(m => (
                             <div key={m.id} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Users size={16} /></div>
                                   <div>
                                      <p className="text-sm font-black">{m.full_name} accessed the vault</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">Identity Verified via Auth Service</p>
                                   </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{new Date().toLocaleTimeString()}</span>
                             </div>
                           ))}
                        </div>
                     </Card>
                  </div>
                  
                  <div className="space-y-10">
                     <SecurityStatCard label="Global Access" value="99.9%" icon={Globe} color="sky" />
                     <SecurityStatCard label="Token Rotation" value="24h" icon={RefreshCcw} color="indigo" />
                     <SecurityStatCard label="Database Nodes" value="3" icon={Server} color="amber" />
                  </div>
               </div>
            )}

            {activeTab === "library" && (
               <div className="space-y-10 animate-pop">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div>
                        <h3 className="text-4xl font-black">Workout Link</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Central protocol management system</p>
                     </div>
                     <div className="px-6 py-3 rounded-2xl bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Pending Approval: {members.length % 3} Protocols
                     </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-10">
                     <Card className="lg:col-span-1 p-10 rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-inner"><Zap size={32} /></div>
                        <h4 className="text-2xl font-black mb-8">Deploy Protocol</h4>
                        <VideoUploadForm onUpload={() => loadData(false)} />
                     </Card>

                     <Card className="lg:col-span-2 p-10 rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900">
                        <h4 className="text-2xl font-black mb-10">Active Protocols</h4>
                        <VideoList onUpdate={() => loadData(false)} />
                     </Card>
                  </div>
               </div>
            )}

            {activeTab === "reports" && (
               <div className="max-w-4xl mx-auto space-y-12 text-center py-20">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 mx-auto shadow-3xl transform hover:rotate-12 transition-transform">
                    <FileText size={48} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-5xl font-black tracking-tight">Executive Report Generator</h3>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Generate deep-dive PDF analytics including revenue forecasting, member churn metrics, and studio performance benchmarks.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                     <Button onClick={runFullReport} className="h-16 px-12 rounded-3xl bg-primary text-white font-black text-sm uppercase tracking-[0.2em] shadow-premium hover:scale-105 active:scale-95 transition-all">
                        Run Full Audit
                     </Button>
                     <Button variant="outline" className="h-16 px-12 rounded-3xl font-black text-sm uppercase tracking-[0.2em] border-slate-200 dark:border-white/10 hover:bg-slate-100 transition-all">
                        Schedule Report
                     </Button>
                  </div>
               </div>
            )}

            {activeTab === "management" && isSuperAdmin && (
              <RoleManagement 
                members={members} 
                onRoleChange={async (userId, newRole: "member" | "coach" | "admin") => {
                  const { error } = await (supabase.rpc as any)("set_user_role", { _target: userId, _role: newRole });
                  if (error) toast.error(error.message);
                  else {
                    toast.success("Role updated successfully!");
                    loadData(false);
                  }
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Member Detail Overlay */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={()=>setSelectedMember(null)}>
           <Card className="max-w-2xl w-full rounded-[3rem] bg-white dark:bg-slate-900 border-none shadow-4xl p-12 space-y-10 animate-in slide-in-from-bottom-10 duration-500" onClick={e=>e.stopPropagation()}>
              <div className="flex items-start justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-3xl text-slate-400 shadow-inner uppercase">{selectedMember.full_name.slice(0,2)}</div>
                    <div>
                       <h2 className="text-4xl font-black">{selectedMember.full_name}</h2>
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">{selectedMember.email} • {selectedMember.role}</p>
                    </div>
                 </div>
                 <button onClick={()=>setSelectedMember(null)} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><RefreshCcw className="rotate-45" /></button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Membership Status</p>
                    <p className="text-2xl font-black text-emerald-600">{selectedMember.membership_status}</p>
                 </div>
                 <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Total Contributions</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">${selectedMember.total_spent}</p>
                 </div>
              </div>

              <div className="pt-6 flex gap-4">
                 <Button className="flex-1 h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest">Update Permissions</Button>
                 <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 dark:border-white/10 font-black text-xs uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all">Deactivate</Button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTS ---

function SidebarItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
        active
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-primary" : "")} />
      <span className="relative z-10">{label}</span>
      {active && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
    </button>
  );
}

function MetricCard({ label, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    sky: "text-sky-500 bg-sky-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
  };
  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white dark:bg-slate-900 p-8 space-y-4 group hover:scale-[1.03] transition-transform duration-500">
       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12", colors[color])}>
         <Icon className="w-6 h-6" />
       </div>
       <div>
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
         <h4 className="text-3xl font-black tracking-tight">{value}</h4>
       </div>
       <div className="flex items-center gap-2">
         <span className="text-[10px] font-black text-emerald-500">{trend}</span>
         <span className="text-[10px] font-bold text-slate-400 uppercase">Vs Prev Month</span>
       </div>
    </Card>
  );
}

function SecurityStatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    sky: "text-sky-500 bg-sky-500/5",
    indigo: "text-indigo-500 bg-indigo-500/5",
    amber: "text-amber-500 bg-amber-500/5",
  };
  return (
    <div className={cn("p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 space-y-4 shadow-xl bg-white dark:bg-slate-900", colors[color])}>
       <Icon className="w-8 h-8 opacity-40" />
       <div>
         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{label}</p>
         <p className="text-3xl font-black">{value}</p>
       </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 p-4 rounded-2xl shadow-2xl border border-white/10 text-white animate-in zoom-in duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        <p className="text-xl font-black">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

// --- VIDEO COMPONENTS ---

function VideoUploadForm({ onUpload }: { onUpload: () => void }) {
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
    const { error } = await (supabase as any).from("workout_videos").insert([{ 
      ...form, 
      status: "pending",
      coach_name: "Admin" 
    }]);
    if (error) toast.error(error.message);
    else {
      toast.success("Protocol submitted for review");
      setForm({ title: "", url: "" });
      onUpload();
    }
    setBusy(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Protocol Title</label>
        <input 
          value={form.title} 
          onChange={e => setForm({...form, title: e.target.value})}
          placeholder="e.g. Master Your Squat"
          className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">YouTube URL</label>
        <input 
          value={form.url} 
          onChange={e => setForm({...form, url: e.target.value})}
          placeholder="https://youtube.com/..."
          className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      
      {videoId && (
        <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-2xl">
          <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}`} title="Preview" />
        </div>
      )}

      <Button disabled={busy} className="w-full rounded-2xl bg-primary text-white h-14 font-black uppercase text-[11px] tracking-widest shadow-xl">
        {busy ? "Syncing..." : "Publish Protocol"}
      </Button>
    </form>
  );
}

function VideoList({ onUpdate }: { onUpdate: () => void }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

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

  const publish = async (id: string) => {
    setBusy(id);
    const { error } = await (supabase as any).from("workout_videos").update({ status: "published" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Protocol published live");
      onUpdate();
    }
    setBusy(null);
  };

  if (loading) return <div className="py-20 text-center animate-pulse font-black text-slate-400 uppercase text-[10px] tracking-widest">Querying protocols...</div>;

  return (
    <div className="grid gap-6">
      {videos.map(v => (
        <div key={v.id} className="flex flex-col p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/20 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                v.status === "published" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              )}>
                {v.status === "published" ? <ShieldCheck className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
              </div>
              <div>
                <p className="font-black text-lg leading-none mb-2">{v.title}</p>
                <div className="flex items-center gap-3">
                  <Badge className={cn("px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border-none", v.status === "published" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                    {v.status || "pending"}
                  </Badge>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">By {v.coach_name}</span>
                </div>
              </div>
            </div>
            <button onClick={() => del(v.id)} className="p-3 text-slate-400 hover:text-rose-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-6 pt-6 border-t border-slate-200 dark:border-white/5">
             <p className="text-xs text-slate-500 font-bold truncate max-w-[300px]">{v.url}</p>
             {v.status !== "published" && (
               <Button 
                disabled={busy === v.id}
                onClick={() => publish(v.id)}
                className="px-8 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
               >
                 {busy === v.id ? "Working..." : "Confirm & Publish"}
               </Button>
             )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- MANAGEMENT ---

function RoleManagement({ members, onRoleChange }: any) {
  const [busy, setBusy] = useState<string | null>(null);
  const roles = ["member", "coach", "admin"] as const;

  return (
    <Card className="rounded-[3rem] border-none shadow-3xl bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-10 border-b border-slate-100 dark:border-white/5">
         <h3 className="text-3xl font-black">Admin Control Center</h3>
         <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Advanced system-wide permission management</p>
      </div>
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-white/5">
          <TableRow className="border-none">
            <TableHead className="pl-10 py-6 text-[10px] font-black uppercase tracking-widest">Admin / Coach</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-10">Access Authority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.filter((m: any) => m.role !== "member").map((m: any) => (
            <TableRow key={m.id} className="border-slate-100 dark:border-white/5">
              <TableCell className="pl-10 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black">
                    {m.full_name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-black text-sm">{m.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right pr-10">
                <div className="flex justify-end gap-2">
                  {roles.map(r => (
                    <button
                      key={r}
                      disabled={busy === m.id || m.role === r}
                      onClick={async () => {
                        setBusy(m.id);
                        await onRoleChange(m.id, r);
                        setBusy(null);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        m.role === r 
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
