import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { Dumbbell, Mail, Lock, User, Phone } from "lucide-react";
import logo from "/logo.png";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (user) return <Navigate to="/" replace />;

  const isStrongPassword = (pwd: string): boolean => {
    // Minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\[\]{};':"\\|,.<>/?`~-]).{8,}$/;
    return regex.test(pwd);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!isStrongPassword(password)) {
          toast.error("Password is weak. Use at least 8 characters, including uppercase, lowercase, number, and special character.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name, phone } },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        nav("/", { replace: true });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <img src={logo} alt="JP Fitness Studios" width={180} className="w-48 drop-shadow-xl animate-float-y" />
          <h1 className="mt-6 font-display font-black text-4xl text-gradient-brand tracking-tight">JP Fitness Studios</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mt-2">Train Smart • Transform Daily</p>
        </div>
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 shadow-premium">
          <div className="flex bg-secondary rounded-2xl p-1 mb-8">
            {(["login","signup"] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode===m ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground"}`}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <>
                <Field icon={User} placeholder="Full name" value={name} onChange={setName} required />
                <Field icon={Phone} placeholder="Phone (optional)" value={phone} onChange={setPhone} />
              </>
            )}
            <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} required />
            <Field icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} required />

            <button disabled={busy} className="w-full py-4 rounded-2xl bg-gradient-brand text-primary-foreground font-black text-xs uppercase tracking-widest shadow-brand hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              <Dumbbell className="w-4 h-4" />
              {busy ? "Entering Studio..." : mode === "login" ? "Enter Studio" : "Begin Transformation"}
            </button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-8 font-bold uppercase tracking-widest leading-relaxed">
            By continuing you agree to JP Fitness Studios<br/>terms & wellness disclaimer.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, ...p }: any) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card focus-within:ring-brand">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <input {...p} onChange={(e) => p.onChange(e.target.value)} className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" />
    </div>
  );
}
