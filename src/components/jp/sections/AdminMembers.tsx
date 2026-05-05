import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Users, UserPlus, Edit2, Trash2, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

export default function AdminMembers() {
  const { user } = useAuth();
  const { id } = useParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", phone: "", role: "member" });

  const load = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: packages } = await supabase.from("packages").select("*").eq("status", "active");

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      const pkgMap = new Map(packages?.map(p => [p.user_id, p]) || []);

      const list = (profiles || []).map(p => {
        const pkg = pkgMap.get(p.id);
        return {
          id: p.id,
          full_name: p.full_name || "Unknown",
          email: p.email || "",
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
    }
  };

  useEffect(() => { load(); }, [user]);

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

      await supabase.from("user_roles").insert({ user_id: data.user.id, role: form.role });
      toast.success("Member added!");
      setShowAdd(false);
      setForm({ email: "", password: "", full_name: "", phone: "", role: "member" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    try {
      await supabase.from("profiles").delete().eq("id", id);
      await supabase.from("user_roles").delete().eq("user_id", id);
      toast.success("Member deleted");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-xl hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-display text-2xl font-extrabold">Members</h2>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 rounded-xl bg-gradient-brand text-primary-foreground text-sm font-semibold flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {showAdd && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-bold mb-4">Add New Member</h3>
          <form onSubmit={addMember} className="grid md:grid-cols-2 gap-3">
            <input required placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
            <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
            <input required type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as any })}
              className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none">
              <option value="member">Member</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold">Add Member</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-secondary text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm" />
        </div>

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
                  <th>Package</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="py-2 font-medium">{m.full_name}</td>
                    <td className="text-muted-foreground">{m.email}</td>
                    <td className="text-muted-foreground">{m.phone || "—"}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        m.role === "admin" ? "bg-purple-100 text-purple-700" :
                        m.role === "coach" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {m.role}
                      </span>
                    </td>
                    <td>
                      {m.package_name ? (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          m.package_status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {m.package_name}
                        </span>
                      ) : "—"}
                    </td>
                    <td>{m.loyalty_points}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link to={`/admin/members/${m.id}`} className="text-primary hover:underline text-xs">Edit</Link>
                        <button onClick={() => deleteMember(m.id)} className="text-red-500 hover:underline text-xs">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">No members found.</td>
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
