import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

function ConfigCheck({ children }: { children: React.ReactNode }) {
  const hasConfig = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!hasConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-6 text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">Configuration Missing</h1>
          <p className="text-muted-foreground mb-2">
            Supabase environment variables are not set.
          </p>
          <p className="text-sm text-muted-foreground">
            Please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in your deployment settings.
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
