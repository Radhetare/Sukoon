import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import MoodSelector from "./components/MoodSelector";
import Landing from "./pages/Landing";
import Chat from "./pages/Chat";
import Journal from "./pages/Journal";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import "./App.css";

import type { Mood } from "./components/MoodSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurrentMood {
  key: string;
  emoji: string;
  name: string;
  intensity?: number;
}

interface AppState {
  currentPath: string;
  currentMood: CurrentMood | null;
  sessionId: string | null;
  notifCount: number;
  moodOpen: boolean;
  isTransitioning: boolean;
}

// ─── App Context ──────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  navigate: (path: string) => void;
  setMood: (mood: CurrentMood | null) => void;
  openMood: () => void;
  closeMood: () => void;
  clearNotifs: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <App>");
  return ctx;
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
// Styles extracted to App.css

// ─── Toast System ─────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  exiting: boolean;
}
let toastIdCounter = 0;

const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, duration = 2800) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        300,
      );
    }, duration);
  }, []);
  return { toasts, addToast };
};

// ─── Privacy Page ─────────────────────────────────────────────────────────────

const PrivacyPage = () => (
  <div
    style={{
      maxWidth: "720px",
      margin: "0 auto",
      padding: "4rem 2rem",
      fontFamily: "DM Sans,sans-serif",
    }}
  >
    <h1
      style={{
        fontFamily: "Cormorant Garamond,serif",
        fontSize: "2.4rem",
        fontWeight: 300,
        color: "#1e3530",
        marginBottom: "0.5rem",
      }}
    >
      Privacy Policy
    </h1>
    <p style={{ fontSize: "0.8rem", color: "#8aada5", marginBottom: "2.5rem" }}>
      Effective: 2025 · Sukoon · EN23CS · 6N-CSE
    </p>
    {[
      {
        title: "🛡️ Anonymous by Design",
        body: "Sukoon does not require any personal information. No name, email, or phone — ever.",
      },
      {
        title: "💬 Your Conversations",
        body: "Conversations are stored only in your browser session. Closing the tab ends the session permanently. Nothing is saved to any server.",
      },
      {
        title: "🔒 No Tracking",
        body: "Sukoon uses no analytics, cookies, or tracking pixels of any kind.",
      },
      {
        title: "🚨 Crisis Detection",
        body: "Crisis keyword detection runs entirely in your browser. No data is sent externally. Helpline numbers are shown locally.",
      },
      {
        title: "📬 Contact",
        body: "Questions? Reach the project team at EN23CS, 6N-CSE.",
      },
    ].map((s) => (
      <div
        key={s.title}
        style={{
          marginBottom: "1.5rem",
          padding: "1.4rem 1.6rem",
          background: "#fff",
          borderRadius: "16px",
          border: "1px solid rgba(122,171,149,0.15)",
        }}
      >
        <h2
          style={{
            fontFamily: "Cormorant Garamond,serif",
            fontSize: "1.15rem",
            fontWeight: 400,
            color: "#1e3530",
            marginBottom: "0.4rem",
          }}
        >
          {s.title}
        </h2>
        <p
          style={{
            fontSize: "0.87rem",
            color: "#8aada5",
            fontWeight: 300,
            lineHeight: 1.7,
          }}
        >
          {s.body}
        </p>
      </div>
    ))}
  </div>
);

// ─── Protected Route ────────────────────────────────────────────────────────

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("sukoon_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── 404 ─────────────────────────────────────────────────────────────────────

const NotFoundPage = ({ onNavigate }: { onNavigate: (p: string) => void }) => (
  <div className="app-404">
    <div className="app-404-emoji">🌿</div>
    <h1 className="app-404-title">Page not found</h1>
    <p className="app-404-sub">
      This path doesn't exist — but your feelings are always welcome here.
    </p>
    <button className="app-404-btn" onClick={() => onNavigate("/")}>
      ← Back to Sukoon
    </button>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [appLoaded, setAppLoaded] = useState(false);
  const location = useLocation();
  const navigateBase = useNavigate();
  const [state, setState] = useState<AppState>({
    currentPath: location.pathname,
    currentMood: null,
    sessionId: null,
    notifCount: 0,
    moodOpen: false,
    isTransitioning: false,
  });
  const [pageKey, setPageKey] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { toasts, addToast } = useToasts();

  useEffect(() => {
    document.title = "Sukoon — Your Safe Space";
    const t = setTimeout(() => setAppLoaded(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setState((s) => ({ ...s, isTransitioning: true }));
    const t = setTimeout(() => {
      setState((s) => ({
        ...s,
        currentPath: location.pathname,
        isTransitioning: false,
      }));
      setPageKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }, 220);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    const fn = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      navigateBase(path);
      if (path === "/chat") addToast("🌿 Opening Chat...");
    },
    [navigateBase, addToast],
  );
  const setMood = useCallback(
    (mood: CurrentMood | null) => {
      setState((s) => ({ ...s, currentMood: mood }));
      if (mood) addToast(`${mood.emoji} Mood: ${mood.name}`);
    },
    [addToast],
  );
  const openMood = useCallback(
    () => setState((s) => ({ ...s, moodOpen: true })),
    [],
  );
  const closeMood = useCallback(
    () => setState((s) => ({ ...s, moodOpen: false })),
    [],
  );
  const clearNotifs = useCallback(
    () => setState((s) => ({ ...s, notifCount: 0 })),
    [],
  );

  const contextValue: AppContextValue = {
    state,
    navigate,
    setMood,
    openMood,
    closeMood,
    clearNotifs,
  };

  const renderPage = () => {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<NotFoundPage onNavigate={navigate} />} />
      </Routes>
    );
  };

  const isLanding = state.currentPath === "/";
  const isChat = state.currentPath === "/chat";
  const isJournal = state.currentPath === "/journal";
  const isSettings = state.currentPath === "/settings";
  const isFullScreen = isChat || isJournal || isSettings;

  return (
    <AppContext.Provider value={contextValue}>
      {/* Loading splash */}
      <div className={`app-loading ${appLoaded ? "app-loaded" : ""}`}>
        <div className="app-loading-logo">🌿 Sukoon</div>
        <div className="app-loading-dots">
          <div className="app-loading-dot" />
          <div className="app-loading-dot" />
          <div className="app-loading-dot" />
        </div>
      </div>

      {/* Navbar — Landing, Chat, Journal, Settings all have their own layouts */}
      {!isLanding && !isFullScreen && (
        <Navbar
          currentPath={state.currentPath}
          onNavigate={navigate}
          onMoodClick={openMood}
          currentMood={state.currentMood ?? undefined}
          notifCount={state.notifCount}
        />
      )}

      {/* Page */}
      <main
        id="main-content"
        key={pageKey}
        className={[
          "app-page",
          isFullScreen ? "app-chat" : "",
          !isLanding && !isFullScreen ? "app-default" : "",
          state.isTransitioning ? "app-page-exit" : "app-page-enter",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {renderPage()}
      </main>

      {/* MoodSelector */}
      {state.moodOpen && (
        <MoodSelector
          mode="wheel"
          selected={state.currentMood?.key}
          onSelect={(mood: Mood) =>
            setMood({
              key: mood.key,
              emoji: mood.emoji,
              name: mood.name,
              intensity: mood.intensity,
            })
          }
          onClose={closeMood}
          showIntensity={true}
        />
      )}

      {/* Toasts */}
      <div className="app-toast-stack">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`app-toast ${t.exiting ? "app-toast-exit" : ""}`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Scroll to top */}
      <button
        className={`app-scroll-top ${showScrollTop ? "app-visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </AppContext.Provider>
  );
}
