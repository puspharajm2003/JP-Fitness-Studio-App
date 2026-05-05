import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Users, UserPlus, ClipboardCheck, DollarSign, TrendingUp, AlertTriangle, Calendar, Activity } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Member {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  loyalty_points: number;
  package_status?: string;
  package_end?: string;
}

export default function AdminCRM() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    revenue: 0,
  });

  const load = async () => {
    setLoading(true);
    try {
      // Fetch all users with their profiles and roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, loyalty_points, email")
        .order("created_at", { ascending: false });

      // Fetch roles for each user
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // Fetch active packages
      const { data: packages } = await supabase
        .from("packages")
        .select("user_id, status, price, end_date");

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const pkgMap = new Map(
        packages?.map(p => [p.user_id, p]) || []
      );

      const now = new Date();
      const sevenDays = new Date(now.getTime() + 7 * 864e5);

      const memberList = (profiles || []).map(p => {
        const pkg = pkgMap.get(p.id);
        return {
          id: p.id,
          email: p.email || "",
          full_name: p.full_name || "Unknown",
          phone: p.phone || "",
          role: roleMap.get(p.id) || "member",
          loyalty_points: p.loyalty_points || 0,
          package_status: pkg?.status || "none",
          package_end: pkg?.end_date,
        };
      });

      const active = memberList.filter(m => m.package_status === "active").length;
      const expiring = memberList.filter(m => {
        if (m.package_status !== "active" || !m.package_end) return false;
        const end = new Date(m.package_end);
        return end <= sevenDays && end >= now;
      }).length;
      const revenue = (packages || [])
        .filter(p => p.status === "active")
        .reduce((sum, p) => sum + (p.price || 0), 0);

      setMembers(memberList);
      setStats({
        total: memberList.length,
        active,
        expiring,
        revenue,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const assignRole = async (userId: string, role: string) => {
    try {
      await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role });
      toast.success(`Role updated to ${role}`);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-extrabold">Admin CRM Panel</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Members" value={stats.total} color="blue" />
        <StatCard icon={Activity} label="Active Members" value={stats.active} color="green" />
        <StatCard icon={AlertTriangle} label="Expiring Soon" value={stats.expiring} color="orange" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${stats.revenue}`} color="purple" />
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/members" className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold">
            <UserPlus className="w-4 h-4 inline mr-1" /> Add Member
          </Link>
          <Link to="/admin/attendance" className="px-4 py-2 rounded-xl bg-secondary text-sm font-semibold">
            <ClipboardCheck className="w-4 h-4 inline mr-1" /> View Attendance
          </Link>
          <Link to="/admin/payments" className="px-4 py-2 rounded-xl bg-secondary text-sm font-semibold">
            <DollarSign className="w-4 h-4 inline mr-1" /> Track Payments
          </Link>
          <Link to="/admin/analytics" className="px-4 py-2 rounded-xl bg-secondary text-sm font-semibold">
            <TrendingUp className="w-4 h-4 inline mr-1" /> Analytics
          </Link>
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-display font-bold mb-3">Members</h3>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <th className="py-2">Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Points</th>
                  <th>Package</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="py-2 font-medium">{m.full_name}</td>
                    <td className="text-muted-foreground">{m.email}</td>
                    <td className="text-muted-foreground">{m.phone || "—"}</td>
                    <td>
                      <select
                        value={m.role}
                        onChange={(e) => assignRole(m.id, e.target.value)}
                        className="px-2 py-1 rounded-lg bg-secondary border border-border text-xs"
                      >
                        <option value="member">Member</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{m.loyalty_points}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        m.package_status === "active" ? "bg-green-100 text-green-700" :
                        m.package_status === "expired" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {m.package_status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/members/${m.id}`} className="text-primary text-xs font-semibold">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No members found.
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

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
  };
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}
