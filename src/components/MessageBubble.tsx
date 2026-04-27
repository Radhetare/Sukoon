/**
 * MessageBubble.tsx — Sukoon
 *
 * A standalone, highly reusable message bubble component.
 * Handles all visual states: AI, user, error, loading skeleton,
 * emotion tags, suggestion chips, reactions, and copy-to-clipboard.
 *
 * Props:
 *  - message         : Message           — the message object to render
 *  - onChipClick?    : (text: string)    — called when a suggestion chip is clicked
 *  - onReact?        : (id, emoji)       — called when user reacts to a message
 *  - showAvatar?     : boolean           — show/hide avatar (default true)
 *  - animate?        : boolean           — enable entry animation (default true)
 *  - skeleton?       : boolean           — render loading skeleton instead
 *
 * Usage:
 *   <MessageBubble message={msg} onChipClick={handleChip} />
 *   <MessageBubble skeleton />   ← loading placeholder
 */

import { useState, useEffect, useRef } from "react";
import "./MessageBubble.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  role: "ai" | "user";
  text: string;
  time: string;
  emotion?: string; // e.g. "💙 Sadness detected"
  suggestions?: string[]; // quick-reply chips
  reaction?: string; // emoji reaction
  isError?: boolean; // error state
  isRead?: boolean; // read receipt (user messages)
}

export interface MessageBubbleProps {
  message?: Message;
  onChipClick?: (text: string) => void;
  onReact?: (id: number, emoji: string) => void;
  showAvatar?: boolean;
  animate?: boolean;
  skeleton?: boolean;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
// Styles extracted to MessageBubble.css

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTIONS = ["❤️", "🙏", "💚", "😊", "💙", "🌿"];

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

const SkeletonBubble = () => (
  <div className="mb-skeleton-row">
    <div className="mb-skeleton-avatar" />
    <div className="mb-skeleton-wrap">
      <div className="mb-skeleton-bubble" style={{ width: "220px" }} />
      <div className="mb-skeleton-line" style={{ width: "140px" }} />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MessageBubble({
  message,
  onChipClick,
  onReact,
  showAvatar = true,
  animate = true,
  skeleton = false,
}: MessageBubbleProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [reaction, setReaction] = useState(message?.reaction ?? "");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);



  // ── Close picker on outside click ───────────────────
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  // ── Cleanup toast timer ──────────────────────────────
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  if (skeleton) return <SkeletonBubble />;
  if (!message) return null;

  const isAI = message.role === "ai";
  const isUser = message.role === "user";

  // ── Copy to clipboard ────────────────────────────────
  const handleCopy = async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setShowCopyToast(true);
      toastTimer.current = setTimeout(() => {
        setShowCopyToast(false);
        setCopied(false);
      }, 2000);
    } catch {
      // Clipboard not available
    }
    setShowPicker(false);
  };

  // ── React to message ─────────────────────────────────
  const handleReact = (emoji: string) => {
    const next = reaction === emoji ? "" : emoji;
    setReaction(next);
    onReact?.(message.id, next);
    setShowPicker(false);
  };

  // ── Bubble class ─────────────────────────────────────
  const bubbleClass = message.isError
    ? "mb-bubble mb-bubble-error"
    : isAI
      ? "mb-bubble mb-bubble-ai"
      : "mb-bubble mb-bubble-user";

  return (
    <>
      {/* Copy toast */}
      {showCopyToast && (
        <div className="mb-copy-toast">✓ Copied to clipboard</div>
      )}

      <div
        className={[
          "mb-row",
          isUser ? "mb-user-row" : "",
          animate ? "mb-animate" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Avatar */}
        {showAvatar && (
          <div
            className={`mb-avatar ${isAI ? "mb-avatar-ai" : "mb-avatar-user"}`}
            title={isAI ? "Sukoon AI" : "You"}
          >
            {isAI ? "🌿" : "You"}
          </div>
        )}

        {/* Bubble + meta */}
        <div className="mb-wrap">
          <div className="mb-bubble-wrap-inner">
            {/* Main bubble */}
            <div className={bubbleClass}>{message.text}</div>

            {/* Hover action bar */}
            <div className="mb-actions">
              {/* React */}
              <button
                className="mb-action-btn"
                title="React"
                onClick={() => setShowPicker((v) => !v)}
              >
                🙂
              </button>
              {/* Copy (AI messages only) */}
              {isAI && (
                <button
                  className="mb-action-btn"
                  title="Copy"
                  onClick={handleCopy}
                >
                  {copied ? "✓" : "📋"}
                </button>
              )}
            </div>

            {/* Reaction picker */}
            {showPicker && (
              <div className="mb-reaction-picker" ref={pickerRef}>
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    className="mb-react-btn"
                    onClick={() => handleReact(emoji)}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Emotion tag */}
          {isAI && message.emotion && (
            <span className="mb-emotion">{message.emotion}</span>
          )}

          {/* Suggestion chips */}
          {isAI && message.suggestions && message.suggestions.length > 0 && (
            <div className="mb-chips">
              {message.suggestions.map((s) => (
                <button
                  key={s}
                  className="mb-chip"
                  onClick={() => onChipClick?.(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Meta row: time + read receipt + reaction */}
          <div className="mb-meta">
            <span className="mb-time">{message.time}</span>

            {/* Read receipt (user only) */}
            {isUser && message.isRead && (
              <span className="mb-read" title="Read">
                ✓✓
              </span>
            )}

            {/* Placed reaction */}
            {reaction && (
              <span
                className="mb-reaction"
                title="Click to remove"
                onClick={() => handleReact(reaction)}
              >
                {reaction}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
