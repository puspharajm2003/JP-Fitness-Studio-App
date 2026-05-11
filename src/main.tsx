import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

function ConfigCheck({ children }: { children: React.ReactNode }) {
  const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!hasConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 text-center space-y-8 shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight">Access <span className="text-amber-500 italic">Restricted</span>.</h1>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              Supabase environment variables are missing. The executive core cannot establish a secure link.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-left space-y-3">
             <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Required Handshake:</div>
             <ul className="space-y-2">
                <li className="flex items-center gap-2 text-[10px] font-mono text-amber-500/80">
                   <div className="w-1 h-1 rounded-full bg-amber-500" /> VITE_SUPABASE_URL
                </li>
                <li className="flex items-center gap-2 text-[10px] font-mono text-amber-500/80">
                   <div className="w-1 h-1 rounded-full bg-amber-500" /> VITE_SUPABASE_PUBLISHABLE_KEY
                </li>
             </ul>
          </div>

          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            Configure variables in your<br/>Vercel or Netlify dashboard.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ConfigCheck>
      <App />
    </ConfigCheck>
  </ErrorBoundary>
);

// Register service worker for PWA install & offline caching
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // SW registration failed — non-critical
    });
  });
}
