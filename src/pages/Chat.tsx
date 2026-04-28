/**
 * Chat.tsx — Sukoon
 *
 * The /chat page. Composes the sidebar + ChatWindow.
 * All message rendering is delegated to ChatWindow.tsx.
 * All AI calls go through services/api.ts.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatWindow, { type Message } from "../components/ChatWindow";
import { sendMessage, fetchHistory, type ChatMessage, fetchSessions, logout } from "../services/api";
import { useApp } from "../App";
import "./Chat.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mood {
  key: string;
  emoji: string;
  name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOODS: Mood[] = [
  { key: "calm", emoji: "🌿", name: "Calm" },
  { key: "anxious", emoji: "😰", name: "Anxious" },
  { key: "sad", emoji: "💙", name: "Sad" },
  { key: "stressed", emoji: "⚡", name: "Stressed" },
  { key: "angry", emoji: "🔥", name: "Frustrated" },
  { key: "happy", emoji: "😊", name: "Happy" },
];

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ─── Breathing phases ─────────────────────────────────────────────────────────

const BREATH_PHASES = [
  { label: "Breathe in", emoji: "🌬️ ", duration: 4, instruction: "Inhale slowly through your nose" },
  { label: "Hold", emoji: "🫁", duration: 4, instruction: "Hold gently" },
  { label: "Breathe out", emoji: "💨", duration: 6, instruction: "Exhale slowly through your mouth" },
  { label: "Rest", emoji: "🌿", duration: 2, instruction: "Rest before the next breath" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
  const navigate = useNavigate();
  const { openMood, state: appState } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showMoodBanner, setShowMoodBanner] = useState(false);
  const [activeMood, setActiveMood] = useState<Mood | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathPhaseIdx, setBreathPhaseIdx] = useState(0);
  const [breathCycle, setBreathCycle] = useState(0);
  const [breathProgress, setBreathProgress] = useState(0);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessions, setSessions] = useState<Array<{ sessionId: string; lastMessage: string; timestamp: any }>>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize session and load history from backend
  useEffect(() => {
    const initChat = async () => {
      let id = localStorage.getItem("sukoon_session_id");
      if (!id) {
        id = `sukoon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem("sukoon_session_id", id);
      }
      setSessionId(id);

      try {
        const sessionList = await fetchSessions();
        setSessions(sessionList);

        const history = await fetchHistory(id!);
        setChatHistory(history);

        const uiMessages: Message[] = history.map((msg, idx) => ({
          id: idx,
          role: msg.role === "assistant" ? "ai" : "user",
          text: msg.content,
          time: getTime(),
        }));
        setMessages(uiMessages);
      } catch (e) {
        console.error("Failed to load history or sessions from database:", e);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    return () => {
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      if (breathTickRef.current) clearInterval(breathTickRef.current);
    };
  }, []);

  const switchSession = useCallback(async (id: string) => {
    setSessionId(id);
    localStorage.setItem("sukoon_session_id", id);
    setIsTyping(true);
    try {
      const history = await fetchHistory(id);
      setChatHistory(history);
      const uiMessages: Message[] = history.map((msg, idx) => ({
        id: idx,
        role: msg.role === "assistant" ? "ai" : "user",
        text: msg.content,
        time: getTime(),
      }));
      setMessages(uiMessages);
    } catch (e) {
      console.error("Failed to switch session:", e);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const startNewChat = useCallback(async () => {
    const newId = `sukoon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setSessionId(newId);
    localStorage.setItem("sukoon_session_id", newId);
    setMessages([]);
    setChatHistory([]);

    try {
      // This refreshes the sidebar list immediately
      const sessionList = await fetchSessions();
      setSessions(sessionList);
    } catch (e) {
      console.error("Failed to refresh sessions after new chat:", e);
    }
  }, []);

  const startBreathing = useCallback(() => {
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    if (breathTickRef.current) clearInterval(breathTickRef.current);

    setShowBreathing(true);
    setBreathPhaseIdx(0);
    setBreathCycle(0);
    setBreathProgress(0);

    let currentPhase = 0;
    const totalMs = BREATH_PHASES[0].duration * 1000;
    let elapsed = 0;
    breathTickRef.current = setInterval(() => {
      elapsed += 100;
      setBreathProgress(Math.min((elapsed / totalMs) * 100, 100));
    }, 100);

    const advance = () => {
      currentPhase = (currentPhase + 1) % BREATH_PHASES.length;
      setBreathPhaseIdx(currentPhase);
      if (currentPhase === 0) setBreathCycle((c) => c + 1);
      elapsed = 0;
      setBreathProgress(0);
      if (breathTickRef.current) clearInterval(breathTickRef.current);
      const nextMs = BREATH_PHASES[currentPhase].duration * 1000;
      breathTickRef.current = setInterval(() => {
        elapsed += 100;
        setBreathProgress(Math.min((elapsed / nextMs) * 100, 100));
      }, 100);
    };

    const scheduleNext = (phaseIdx: number) => {
      breathIntervalRef.current = setTimeout(() => {
        advance();
        scheduleNext((phaseIdx + 1) % BREATH_PHASES.length);
      }, BREATH_PHASES[phaseIdx].duration * 1000) as unknown as ReturnType<typeof setInterval>;
    };
    scheduleNext(0);
  }, []);

  const stopBreathing = () => {
    if (breathIntervalRef.current) clearTimeout(breathIntervalRef.current as unknown as ReturnType<typeof setTimeout>);
    if (breathTickRef.current) clearInterval(breathTickRef.current);
    breathIntervalRef.current = null;
    breathTickRef.current = null;
    setShowBreathing(false);
    setBreathPhaseIdx(0);
    setBreathCycle(0);
    setBreathProgress(0);
  };

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood.key);
    setActiveMood(mood);
    setShowMoodBanner(true);
  };

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        text,
        time: getTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      const newHistory: ChatMessage[] = [
        ...chatHistory,
        { role: "user", content: text },
      ];
      setChatHistory(newHistory);

      try {
        const response = await sendMessage(newHistory, {
          mood: selectedMood ?? undefined,
          sessionId: sessionId ?? undefined,
        });

        if (!sessionId) setSessionId(response.sessionId);

        const aiMsg: Message = {
          id: Date.now() + 1,
          role: "ai",
          text: response.text,
          time: getTime(),
          emotion: response.emotion?.tag,
          suggestions: response.isCrisis
            ? undefined
            : ["Tell me more", "I need a moment", "What should I do?"],
        };

        setMessages((prev) => [...prev, aiMsg]);
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: response.text },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "ai",
            text: "I'm having trouble connecting right now. Please try again in a moment.",
            time: getTime(),
            isError: true,
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [chatHistory, selectedMood, sessionId],
  );

  return (
    <>
      {showBreathing && (
        <div className="chat-overlay" onClick={stopBreathing}>
          <div
            className="chat-breathing-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="chat-breathing-title">Guided Breathing</h2>
            <p className="chat-breathing-sub">
              {BREATH_PHASES[breathPhaseIdx].instruction}
            </p>

            <div className="chat-breathing-ring-wrap">
              <svg className="chat-breathing-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" className="chat-ring-bg" />
                <circle
                  cx="60" cy="60" r="54"
                  className="chat-ring-fill"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - breathProgress / 100)}`}
                />
              </svg>
              <div className="chat-breathing-circle">
                {BREATH_PHASES[breathPhaseIdx].emoji}
              </div>
            </div>

            <p className="chat-breathing-phase">
              {BREATH_PHASES[breathPhaseIdx].label}
            </p>

            {breathCycle > 0 && (
              <p className="chat-breathing-cycles">
                {breathCycle} {breathCycle === 1 ? "cycle" : "cycles"} complete ✓
              </p>
            )}

            <button
              className="chat-breathing-close"
              onClick={stopBreathing}
            >
              I feel better now
            </button>
          </div>
        </div>
      )}

      <div className="chat-page">
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-logo">
              <span>🌿</span> Sukoon
            </div>
            <div className="chat-sidebar-tagline">Your safe space, always</div>
          </div>

          <p className="chat-sidebar-label">How are you feeling?</p>
          <div className="chat-mood-list">
            {MOODS.map((m) => (
              <button
                key={m.key}
                className={`chat-mood-item${selectedMood === m.key ? " active" : ""}`}
                onClick={() => handleMoodSelect(m)}
              >
                <span className="chat-mood-emoji">{m.emoji}</span>
                <span className="chat-mood-name">{m.name}</span>
              </button>
            ))}
          </div>

          <div className="chat-sidebar-divider" />

          <p className="chat-sidebar-label">Past Sessions</p>
          <div className="chat-session-list">
            <button className="chat-new-chat-btn" onClick={startNewChat}>
              <span>+</span> New Chat
            </button>
            {sessions.length === 0 ? (
              <div className="chat-session-empty">No recent sessions</div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.sessionId}
                  className={`chat-session-item ${sessionId === s.sessionId ? "active" : ""}`}
                  onClick={() => switchSession(s.sessionId)}
                >
                  <div className="chat-session-preview">
                    {s.lastMessage
                      ? s.lastMessage.replace(/[#*_`>~\[\]]/g, "").trim().slice(0, 45) +
                        (s.lastMessage.length > 45 ? "…" : "")
                      : "New conversation"}
                  </div>
                  <div className="chat-session-time">
                    {s.timestamp ? new Date(s.timestamp).toLocaleDateString() : ""}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="chat-sidebar-footer">
            <div className="chat-sidebar-avatar">Y</div>
            <div>
              <div className="chat-sidebar-name">You</div>
              <span className="chat-sidebar-badge">Anonymous</span>
            </div>
            <button
              className="chat-logout-btn"
              title="Sign out"
              onClick={() => { logout(); navigate("/login"); }}
            >
              ⎋
            </button>
          </div>
        </aside>

        <main className="chat-main">
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-ai-avatar">🌿</div>
              <div>
                <div className="chat-header-name">Sukoon AI</div>
                <div className="chat-header-status">Online · Here for you</div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                className={`chat-icon-btn chat-mood-trigger${appState.currentMood ? " mood-active" : ""}`}
                title={appState.currentMood ? `Mood: ${appState.currentMood.name}` : "Set your mood"}
                onClick={openMood}
              >
                {appState.currentMood ? appState.currentMood.emoji : "🌿"}
              </button>
              <button
                className="chat-icon-btn"
                title="Breathing exercise"
                onClick={startBreathing}
              >
                🫁
              </button>
              <button
                className="chat-icon-btn"
                title="Open Journal"
                onClick={() => navigate("/journal")}
              >
                📓
              </button>
              <button
                className="chat-icon-btn"
                title="Settings"
                onClick={() => navigate("/settings")}
              >
                ⚙️
              </button>
            </div>
          </div>

          {showMoodBanner && activeMood && (
            <div className="chat-mood-banner">
              <span style={{ fontSize: "1.2rem" }}>{activeMood.emoji}</span>
              <div>
                <div className="chat-mood-banner-text">
                  Mood: {activeMood.name}
                </div>
                <div className="chat-mood-banner-sub">
                  Sukoon will tailor its responses to support you
                </div>
              </div>
              <button
                className="chat-mood-banner-close"
                onClick={() => setShowMoodBanner(false)}
              >
                ✕
              </button>
            </div>
          )}

          <ChatWindow
            messages={messages}
            isTyping={isTyping}
            onSend={handleSend}
            onChipClick={handleSend}
          />
        </main>
      </div>
    </>
  );
}
