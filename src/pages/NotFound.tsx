import { useLocation, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { MoveLeft, Home, Compass, Shield, Sparkles } from "lucide-react";
import gsap from "gsap";

const NotFound = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background animation
      gsap.to(".bg-circle", {
        x: "random(-100, 100)",
        y: "random(-100, 100)",
        duration: "random(10, 20)",
        repeat: -1,
        yoyo: true,
        ease: "none",
        stagger: 0.5
      });

      // Entrance animations
      const tl = gsap.timeline();
      tl.from(".error-code", { y: 100, opacity: 0, duration: 1.5, ease: "power4.out" })
        .from(".error-title", { y: 50, opacity: 0, duration: 1, ease: "power3.out" }, "-=1")
        .from(".error-desc", { y: 30, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.8")
        .from(".error-btn", { scale: 0.8, opacity: 0, duration: 0.8, ease: "back.out(1.7)", stagger: 0.2 }, "-=0.5");

      // Floating loop
      gsap.to(".float-element", {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!bgRef.current) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const moveX = (clientX / innerWidth - 0.5) * 30;
    const moveY = (clientY / innerHeight - 0.5) * 30;
    
    gsap.to(bgRef.current, {
      x: moveX,
      y: moveY,
      duration: 1,
      ease: "power2.out"
    });
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#020617] text-white selection:bg-primary/30"
    >
      {/* Dynamic Background */}
      <div ref={bgRef} className="absolute inset-0 pointer-events-none">
        <div className="bg-circle absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="bg-circle absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="bg-circle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-900/40 rounded-full blur-[100px]" />
      </div>

      <div className="absolute inset-0 opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full px-6 text-center space-y-12">
        
        {/* Superior 404 Badge */}
        <div className="flex justify-center">
          <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 group hover:bg-white/10 transition-all duration-500 cursor-default">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-white transition-colors">Navigation Protocol Failure</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative inline-block float-element">
            <h1 className="error-code text-[12rem] md:text-[18rem] font-black tracking-tighter leading-none bg-gradient-to-b from-white via-white/80 to-transparent bg-clip-text text-transparent opacity-10">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
               <h2 className="error-title text-5xl md:text-8xl font-black tracking-tight text-white drop-shadow-2xl">
                  LOST IN <span className="text-indigo-500 italic">SPACE</span>.
               </h2>
            </div>
          </div>

          <p className="error-desc text-slate-400 font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            The path you followed lead to a metabolic void. The record for <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded italic">"{location.pathname}"</span> does not exist in our secure archives.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
           <Link to="/" className="error-btn group relative px-10 py-5 rounded-2xl bg-white text-slate-950 font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden">
             <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
             <Home className="w-4 h-4" />
             Return to Base
           </Link>
           
           <button onClick={() => window.history.back()} className="error-btn group px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] backdrop-blur-md hover:bg-white/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
             <MoveLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             Reverse Course
           </button>
        </div>

        {/* Minimal Footer Info */}
        <div className="pt-24 flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
           <div className="flex items-center gap-2">
             <Compass className="w-3 h-3 text-indigo-500" />
             Geo-Sync Active
           </div>
           <div className="w-1 h-1 rounded-full bg-slate-800" />
           <div className="flex items-center gap-2">
             <Shield className="w-3 h-3 text-emerald-500" />
             Encrypted Trace
           </div>
           <div className="w-1 h-1 rounded-full bg-slate-800" />
           <div className="flex items-center gap-2">
             <Sparkles className="w-3 h-3 text-amber-500" />
             Luxury OS v4.0
           </div>
        </div>
      </div>

      {/* Luxury Corner Decals */}
      <div className="absolute top-10 left-10 w-24 h-24 border-t-2 border-l-2 border-white/5 rounded-tl-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-24 h-24 border-b-2 border-r-2 border-white/5 rounded-br-3xl pointer-events-none" />
    </div>
  );
};

export default NotFound;
