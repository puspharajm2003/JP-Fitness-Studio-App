import { Bell, LogOut, Palette, Search, Shield, Settings, BarChart3, Download, X, Share } from "lucide-react";
import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme, themes } from "@/providers/ThemeProvider";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useProfile } from "@/lib/useProfile";
import logo from "/jp-logo.png";
import { Home, ClipboardCheck, Scale, Apple, Dumbbell, Award, Pill, User, GlassWater, Activity as ActivityIcon, Calculator } from "lucide-react";

export const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/progress", label: "Progress", icon: Scale },
  { to: "/tool", label: "Tools", icon: Calculator },
  { to: "/diet", label: "Diet", icon: Apple },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/water", label: "Hydration", icon: GlassWater },
  { to: "/activity", label: "Activity", icon: ActivityIcon },
  { to: "/medications", label: "Meds", icon: Pill },
  { to: "/rewards", label: "Rewards", icon: Award },
  { to: "/notifications", label: "Alerts", icon: Settings },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const loc = useLocation();
  const { themeId, setTheme } = useTheme();
  const [showThemes, setShowThemes] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const initials = (user?.user_metadata?.full_name || user?.email || "U").slice(0,1).toUpperCase();
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const { profile: layoutProfile } = useProfile();

  // Admin nav items
  const adminNav = isAdmin ? [
    { to: "/admin/setup", label: "Admin Setup", icon: Settings },
  ] : [];

  // Bottom nav includes main items plus admin items for mobile
  const bottomNavItems = [
    ...navItems.filter(i => ["/", "/progress", "/workout", "/diet", "/profile"].includes(i.to)),
  ];

  // All nav items for sidebar
  const allNavItems = isAdmin ? [...navItems, ...adminNav] : navItems;

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      await install();
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-64 flex-col border-r border-border bg-card/70 backdrop-blur px-4 py-6 z-30">
        <Link to="/" className="flex items-center gap-2.5 mb-8 px-2">
          <img src={logo} alt="JP" width={42} height={42} className="w-10 h-10 drop-shadow" />
          <div>
            <div className="font-display font-extrabold text-lg leading-none text-gradient-brand">JP Fitness</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Studio</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1">
          {allNavItems.map(it => {
            const Icon = it.icon;
            const active = loc.pathname === it.to;
            return (
              <Link key={it.to} to={it.to}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-foreground/70 hover:bg-secondary")}>
                <Icon className="w-4 h-4" />{it.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={signOut} className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-secondary">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
          <div className="flex items-center justify-between px-4 md:px-8 py-3">
            <div className="flex items-center gap-2 lg:hidden">
              <img src={logo} width={36} height={36} className="w-9 h-9" alt="JP" />
              <span className="font-display font-extrabold text-gradient-brand">JP Fitness</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border w-72">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input placeholder="Search workouts, foods…" className="bg-transparent outline-none text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile install button in header */}
              {canInstall && !isInstalled && (
                <button
                  onClick={handleInstall}
                  className="lg:hidden w-10 h-10 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 flex items-center justify-center relative transition-all hover:scale-105"
                  title="Install App"
                >
                  <Download className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                </button>
              )}
              <div className="relative">
                <button onClick={() => setShowThemes(s => !s)} className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center transition">
                  <Palette className="w-4 h-4" style={{ color: `hsl(var(--primary))` }} />
                </button>
                {showThemes && (
                  <div className="absolute right-0 mt-2 p-3 rounded-2xl glass-card w-64 z-50 animate-pop">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Customize Theme</p>
                    <div className="grid grid-cols-2 gap-2">
                      {themes.map(t => (
                        <button key={t.id} onClick={() => { setTheme(t.id); setShowThemes(false); }}
                          className={cn("p-2 rounded-xl border text-left transition-all hover:scale-[1.02]",
                            themeId === t.id ? "border-primary ring-brand" : "border-border")}>
                          <div className="flex gap-1 mb-1.5">
                            {t.swatch.map((c,i)=><span key={i} className="w-4 h-4 rounded-full" style={{background:c}} />)}
                          </div>
                          <span className="text-xs font-semibold">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/notifications" className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center relative transition-all hover:scale-105">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent animate-pulse" />
              </Link>
              <Link to="/profile" className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-brand text-primary-foreground flex items-center justify-center font-bold shadow-brand">
                {layoutProfile?.avatar_url ? (
                  <img src={layoutProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </Link>
            </div>
          </div>
        </header>

        <div className="px-4 md:px-8 py-6 pb-28 lg:pb-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* PWA Install Banner (mobile only) */}
      {canInstall && !isInstalled && showInstallBanner && (
        <div className="lg:hidden fixed bottom-[4.5rem] left-3 right-3 z-50 animate-pop">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 shadow-2xl shadow-blue-500/25">
            <div className="absolute -top-10 -right-5 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <button
              onClick={() => setShowInstallBanner(false)}
              className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <img src={logo} alt="JP" className="w-8 h-8 rounded-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Install JP Fitness</p>
                <p className="text-white/70 text-xs mt-0.5">Get faster access & offline support</p>
              </div>
              <button
                onClick={handleInstall}
                className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold text-xs flex items-center gap-1.5 hover:scale-105 transition-transform shadow-lg shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-pop" onClick={() => setShowIOSGuide(false)}>
          <div className="w-full max-w-md mx-3 mb-3 rounded-2xl bg-card border border-border p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg">Install on iPhone</h3>
              <button onClick={() => setShowIOSGuide(false)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Tap the Share button</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    Look for the <Share className="w-3 h-3 inline" /> icon at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Scroll down & tap "Add to Home Screen"</p>
                  <p className="text-xs text-muted-foreground mt-0.5">It may be in the second row of options</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-emerald-600">3</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Tap "Add" to install</p>
                  <p className="text-xs text-muted-foreground mt-0.5">JP Fitness will appear on your home screen!</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-5 py-3 rounded-xl bg-gradient-brand text-primary-foreground font-bold text-sm shadow-brand"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 glass-card rounded-2xl px-2 py-2">
        <div className="flex justify-around items-center">
          {bottomNavItems.map(it => {
            const Icon = it.icon;
            const active = loc.pathname === it.to;
            return (
              <Link key={it.to} to={it.to} className={cn("flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all",
                active ? "bg-gradient-brand text-primary-foreground shadow-brand scale-105" : "text-muted-foreground")}>
                <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
                <span className="text-[10px] mt-0.5 font-semibold">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

