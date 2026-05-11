import { Component, ReactNode, useEffect, useRef } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert, LifeBuoy } from "lucide-react";
import gsap from "gsap";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Critical System Failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function ErrorDisplay({ error, onReset }: { error?: Error; onReset: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".error-content", { y: 30, opacity: 0, duration: 1, ease: "power4.out" });
      gsap.from(".error-icon", { scale: 0, rotation: -45, duration: 1.2, ease: "back.out(2)" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen w-full flex items-center justify-center bg-[#020617] text-white p-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="error-content relative z-10 max-w-xl w-full text-center space-y-8">
        <div className="error-icon inline-flex w-24 h-24 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 items-center justify-center text-rose-500 shadow-2xl shadow-rose-500/10">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
             <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black uppercase tracking-[0.2em] text-rose-500">
               System Integrity Compromised
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Unexpected <span className="text-rose-500 italic">Anomaly</span>.</h1>
          <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-md mx-auto">
            The executive core encountered a critical execution error. Our engineers have been alerted.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 font-mono text-[10px] text-rose-400/80 text-left overflow-auto max-h-32 backdrop-blur-sm">
            <code>{error.stack || error.message}</code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => window.location.reload()}
            className="group w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-700" />
            Hard Reboot
          </button>
          
          <button 
            onClick={onReset}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <LifeBuoy className="w-3 h-3" />
            Bypass Error
          </button>
        </div>
      </div>
    </div>
  );
}
