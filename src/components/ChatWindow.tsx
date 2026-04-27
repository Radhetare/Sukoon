/**
 * ChatWindow.tsx — Sukoon
 *
 * A fully self-contained, reusable chat window component.
 * Renders messages, typing indicator, suggestion chips,
 * emotion tags, and the input bar.
 *
 * Props:
 *  - messages        : Message[]        — list of messages to render
 *  - isTyping        : boolean          — show AI typing indicator
 *  - onSend          : (text: string)   — called when user sends a message
 *  - onChipClick     : (text: string)   — called when a suggestion chip is clicked
 *  - placeholder?    : string           — input placeholder text
 *  - disabled?       : boolean          — disable input while loading
 */

import { useState, useEffect, useRef, useCallback } from "react";
import "./ChatWindow.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  time: string;
  emotion?: string;
  suggestions?: string[];
  isError?: boolean;
}

export interface ChatWindowProps {
  messages: Message[];
  isTyping?: boolean;
  onSend: (text: string) => void;
  onChipClick?: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showDateDivider?: boolean;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
// Note: CSS variables (--sage, --teal, etc.) come from theme.css via index.css.
// Only ChatWindow-specific styles are defined here.

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_CHARS = 500;

const formatDate = () =>
  new Date().toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

const MessageRow = ({
  msg,
  onChipClick,
}: {
  msg: Message;
  onChipClick?: (text: string) => void;
}) => (
  <div className={`cw-row ${msg.role === "user" ? "cw-user" : ""}`}>
    {msg.role === "ai" ? (
      <div className="cw-avatar cw-ai-av">🌿</div>
    ) : (
      <div className="cw-avatar cw-user-av">You</div>
    )}
    <div className="cw-bubble-wrap">
      <div
        className={`cw-bubble ${
          msg.isError
            ? "cw-error-bubble"
            : msg.role === "ai"
              ? "cw-ai"
              : "cw-user"
        }`}
      >
        {msg.text}
      </div>
      {msg.role === "ai" && msg.emotion && (
        <span className="cw-emotion">{msg.emotion}</span>
      )}
      {msg.role === "ai" && msg.suggestions && msg.suggestions.length > 0 && (
        <div className="cw-chips">
          {msg.suggestions.map((s) => (
            <button
              key={s}
              className="cw-chip"
              onClick={() => onChipClick?.(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <span className="cw-time">{msg.time}</span>
    </div>
  </div>
);

const TypingIndicator = () => (
  <div className="cw-typing-row">
    <div className="cw-avatar cw-ai-av">🌿</div>
    <div className="cw-typing-dots">
      <div className="cw-dot" />
      <div className="cw-dot" />
      <div className="cw-dot" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="cw-empty">
    <div className="cw-empty-icon">🌿</div>
    <div className="cw-empty-title">A quiet space, just for you</div>
    <div className="cw-empty-sub">
      Start the conversation whenever you're ready. There's no rush here.
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatWindow({
  messages,
  isTyping = false,
  onSend,
  onChipClick,
  placeholder = "Share what's on your mind...",
  disabled = false,
  showDateDivider = true,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);



  // ── Auto-scroll to bottom ────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Scroll-to-bottom button visibility ──────────────
  const handleScroll = useCallback(() => {
    const el = messagesAreaRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  }, []);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Textarea auto-resize ─────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > MAX_CHARS) return;
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // ── Send ─────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [input, isTyping, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChipClick = useCallback(
    (text: string) => {
      onChipClick ? onChipClick(text) : onSend(text);
    },
    [onChipClick, onSend],
  );

  const charCount = input.length;
  const showCount = charCount > MAX_CHARS * 0.7;
  const isWarn = charCount > MAX_CHARS * 0.9;
  const canSend = input.trim().length > 0 && !isTyping && !disabled;

  return (
    <div className="cw-root">
      {messages.length === 0 && !isTyping ? (
        <EmptyState />
      ) : (
        <div
          className="cw-messages"
          ref={messagesAreaRef}
          onScroll={handleScroll}
        >
          {showDateDivider && (
            <div className="cw-date-divider">
              <span>{formatDate()}</span>
            </div>
          )}
          {messages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} onChipClick={handleChipClick} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}

      <button
        className={`cw-scroll-btn ${showScrollBtn ? "" : "hidden"}`}
        onClick={scrollToBottom}
        aria-label="Scroll to latest message"
      >
        ↓
      </button>

      <div className="cw-input-area">
        <div className="cw-input-row">
          <textarea
            ref={textareaRef}
            className="cw-textarea"
            placeholder={placeholder}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled}
            aria-label="Message input"
            maxLength={MAX_CHARS}
          />
          <button
            className="cw-send-btn"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send"
          >
            ➤
          </button>
        </div>
        <span
          className={`cw-char-count ${showCount ? "" : "hidden"} ${isWarn ? "warn" : ""}`}
        >
          {charCount}/{MAX_CHARS}
        </span>
        <div className="cw-input-footer">
          <span className="cw-hint">
            Enter to send · Shift+Enter for new line
          </span>
          <a href="#crisis" className="cw-crisis">
            🆘 Need help now?
          </a>
        </div>
      </div>
    </div>
  );
}
