import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, DollarSign, TrendingUp, Activity, Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  membership_status: string;
  join_date: string;
  total_spent: number;
  last_checkin: string;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
}

export default function AdminCRMAdvanced() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "revenue" | "attendance">("overview");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch profiles with membership info
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at")
        .order("created_at", { ascending: false });

      // Fetch packages to determine membership status
      const { data: packages } = await supabase
        .from("packages")
        .select("user_id, status, price, start_date, end_date");

      // Fetch last attendance
      const { data: attendance } = await supabase
        .from("attendance")
        .select("user_id, check_in")
        .order("check_in", { ascending: false });

      const memberMap = new Map<string, Member>();

      profiles?.forEach(p => {
        const userPackages = packages?.filter(pkg => pkg.user_id === p.id) || [];
        const activePkg = userPackages.find(pkg => pkg.status === "active");
        const lastAtt = attendance?.find(a => a.user_id === p.id);

        memberMap.set(p.id, {
          id: p.id,
          full_name: p.full_name || "Unnamed",
          email: p.email || "",
          phone: p.phone || "-",
          membership_status: activePkg ? "Active" : "Inactive",
          join_date: p.created_at?.split("T")[0] || "-",
          total_spent: userPackages.reduce((sum, pkg) => sum + (pkg.price || 0), 0),
          last_checkin: lastAtt ? lastAtt.check_in?.split("T")[0] : "Never",
        });
      });

      setMembers(Array.from(memberMap.values()));
    } catch (error) {
      console.error("Error loading CRM data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.membership_status === "Active").length;
  const totalRevenue = members.reduce((sum, m) => sum + m.total_spent, 0);
  const todayAttendance = members.filter(m => m.last_checkin === new Date().toISOString().split("T")[0]).length;

  const stats: StatCard[] = [
    { title: "Total Members", value: totalMembers.toString(), change: "+12%", icon: <Users className="w-5 h-5" />, trend: "up" },
    { title: "Active Members", value: activeMembers.toString(), change: "+8%", icon: <Activity className="w-5 h-5" />, trend: "up" },
    { title: "Monthly Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+15%", icon: <DollarSign className="w-5 h-5" />, trend: "up" },
    { title: "Today's Check-ins", value: todayAttendance.toString(), change: "+5%", icon: <Calendar className="w-5 h-5" />, trend: "up" },
  ];

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "members", label: "Members", icon: Users },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "attendance", label: "Attendance", icon: Calendar },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => nav("/admin")}
            className="mb-4 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">CRM Pro</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Advanced Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? "text-blue-600 dark:text-blue-400" : "")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Need Help?</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Check our documentation for advanced CRM features.</p>
            <Button size="sm" variant="outline" className="w-full border-blue-200 dark:border-blue-700">
              View Docs
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">CRM Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your gym members, track revenue, and monitor attendance.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                  <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {stat.title}
                      </CardTitle>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {stat.icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</div>
                      <p className={cn(
                        "text-xs font-medium",
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      )}>
                        {stat.change} from last month
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Members Table */}
              <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Recent Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 dark:border-slate-800">
                        <TableHead className="text-slate-600 dark:text-slate-400">Name</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Membership</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Join Date</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Last Check-in</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-400">Spent</TableHead>
                        <TableHead className="text-right text-slate-600 dark:text-slate-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.slice(0, 10).map(member => (
                        <TableRow key={member.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-900 dark:text-white">{member.full_name}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{member.email}</TableCell>
                          <TableCell>
                            <Badge variant={member.membership_status === "Active" ? "default" : "secondary"}>
                              {member.membership_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{member.join_date}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{member.last_checkin}</TableCell>
                          <TableCell className="text-slate-900 dark:text-white font-medium">${member.total_spent}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={member.membership_status === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
                              {member.membership_status === "Active" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {members.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                            No members found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
