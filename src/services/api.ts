/**
 * api.ts — Sukoon AI Service Layer
 *
 * A complete, production-ready service layer that handles:
 *  - AI chat completions (pluggable backend)
 *  - Emotion & sentiment detection
 *  - Crisis keyword detection + escalation
 *  - Session management
 *  - Retry logic + error handling
 *  - Mock mode for development (no backend needed)
 *
 * HOW TO SWITCH BACKENDS:
 *  Set the PROVIDER in SukoonConfig below:
 *    "mock"      → Works offline, no API key needed (great for dev)
 *    "claude"    → Anthropic Claude API
 *    "openai"    → OpenAI GPT
 *    "custom"    → Your own Python/Node backend
 *
 * Usage:
 *   import { sendMessage, detectEmotion, SukoonAPI } from "../services/api";
 *
 *   const response = await sendMessage(messages, { mood: "anxious" });
 *   const emotion  = await detectEmotion("I feel so overwhelmed today");
 */

// ─── Config ───────────────────────────────────────────────────────────────────

export type Provider = "mock" | "claude" | "openai" | "custom";

export interface SukoonConfig {
  provider: Provider;
  apiKey?: string; // Set via env: import.meta.env.VITE_API_KEY
  customBaseUrl?: string; // For "custom" provider
  model?: string; // Override default model
  maxTokens?: number;
  temperature?: number;
  retries?: number; // Number of retry attempts on failure
  retryDelay?: number; // ms between retries
}

const CONFIG: SukoonConfig = {
  provider: (import.meta.env?.VITE_AI_PROVIDER as Provider) || "mock",
  apiKey: import.meta.env?.VITE_API_KEY || "",
  customBaseUrl:
    import.meta.env?.VITE_CUSTOM_API_URL || "http://localhost:8000",
  model: import.meta.env?.VITE_AI_MODEL || "",
  maxTokens: 500,
  temperature: 0.85,
  retries: 2,
  retryDelay: 800,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface SendMessageOptions {
  mood?: string; // current user mood key
  intensity?: number; // mood intensity 1-5
  sessionId?: string; // for session tracking
  stream?: boolean; // streaming responses (future)
}

export interface AIResponse {
  text: string;
  emotion?: EmotionResult;
  isCrisis: boolean;
  sessionId: string;
  tokensUsed?: number;
  latencyMs: number;
}

export interface EmotionResult {
  primary: string; // e.g. "anxiety"
  confidence: number; // 0–1
  tag: string; // e.g. "😰 Anxiety detected"
  color: string; // accent color
  secondary?: string[]; // other detected emotions
}

export interface CrisisResult {
  isCrisis: boolean;
  severity: "none" | "mild" | "moderate" | "high";
  keywords: string[];
  helplines: Helpline[];
}

export interface Helpline {
  name: string;
  number: string;
  url?: string;
  hours: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const buildSystemPrompt = (mood?: string, intensity?: number): string =>
  `
You are Sukoon, a compassionate AI emotional support companion designed for youth.

Your role:
- Provide empathetic, non-judgmental emotional support
- Use principles from Cognitive Behavioral Therapy (CBT) as a gentle guide
- Never diagnose or replace professional mental health care
- Detect emotional distress and respond with care
- Suggest practical coping techniques when appropriate
- If someone is in crisis, always recommend professional help

Personality:
- Warm, gentle, and unhurried — like a trusted friend
- Never clinical, cold, or dismissive
- Use simple, relatable language for youth
- Acknowledge before advising — always validate feelings first
- Ask one thoughtful question at a time, never overwhelm
- Keep responses concise (2-4 sentences) unless the user needs more

${mood ? `Current user mood: ${mood}${intensity ? ` (intensity: ${intensity}/5)` : ""}. Tailor your response to support this emotional state.` : ""}

Important boundaries:
- You are NOT a therapist or medical professional
- For crisis situations (suicidal ideation, self-harm), always provide helpline numbers
- Do not provide medical advice or diagnoses
- Maintain strict privacy — never share or reference personal information
- If unsure, err on the side of compassion and recommend professional support

Response format:
- Respond in plain text only (no markdown, no bullet points)
- Be conversational and human
- End with either a gentle question or a supportive statement
`.trim();

// ─── Emotion Detection ────────────────────────────────────────────────────────

const EMOTION_PATTERNS: Array<{
  keys: string[];
  emotion: string;
  tag: string;
  color: string;
  secondary?: string[];
}> = [
  {
    keys: [
      "anxious",
      "anxiety",
      "panic",
      "nervous",
      "worry",
      "worried",
      "scared",
      "fear",
      "dread",
      "uneasy",
    ],
    emotion: "anxiety",
    tag: "😰 Anxiety detected",
    color: "#e07b39",
    secondary: ["stress", "fear"],
  },
  {
    keys: [
      "sad",
      "sadness",
      "cry",
      "crying",
      "tears",
      "depressed",
      "depression",
      "hopeless",
      "grief",
      "loss",
      "miss",
      "lonely",
    ],
    emotion: "sadness",
    tag: "💙 Sadness detected",
    color: "#5b8fcf",
    secondary: ["loneliness", "grief"],
  },
  {
    keys: [
      "stress",
      "stressed",
      "overwhelmed",
      "pressure",
      "burnout",
      "exhausted",
      "tired",
      "drained",
      "too much",
    ],
    emotion: "stress",
    tag: "⚡ Stress detected",
    color: "#c0392b",
    secondary: ["anxiety", "fatigue"],
  },
  {
    keys: [
      "angry",
      "anger",
      "furious",
      "frustrated",
      "irritated",
      "mad",
      "rage",
      "upset",
      "annoyed",
    ],
    emotion: "anger",
    tag: "🔥 Frustration detected",
    color: "#e74c3c",
    secondary: ["stress"],
  },
  {
    keys: [
      "numb",
      "empty",
      "blank",
      "nothing",
      "disconnected",
      "detached",
      "flat",
      "hollow",
    ],
    emotion: "numbness",
    tag: "🩶 Disconnection noticed",
    color: "#7f8c8d",
    secondary: ["dissociation"],
  },
  {
    keys: [
      "lonely",
      "alone",
      "isolated",
      "no one",
      "nobody",
      "ignored",
      "invisible",
      "excluded",
    ],
    emotion: "loneliness",
    tag: "🥺 Loneliness detected",
    color: "#8e44ad",
    secondary: ["sadness"],
  },
  {
    keys: [
      "happy",
      "good",
      "great",
      "wonderful",
      "excited",
      "joy",
      "joyful",
      "grateful",
      "thankful",
      "content",
      "peaceful",
      "calm",
    ],
    emotion: "positive",
    tag: "🌿 Positive energy",
    color: "#3d8b7a",
    secondary: ["calm"],
  },
  {
    keys: [
      "confused",
      "lost",
      "don't know",
      "unsure",
      "uncertain",
      "unclear",
      "don't understand",
    ],
    emotion: "confusion",
    tag: "🌀 Uncertainty noticed",
    color: "#a569bd",
    secondary: ["anxiety"],
  },
];

export const detectEmotion = (text: string): EmotionResult | null => {
  const lower = text.toLowerCase();
  let best: (typeof EMOTION_PATTERNS)[0] | null = null;
  let bestCount = 0;

  for (const pattern of EMOTION_PATTERNS) {
    const count = pattern.keys.filter((k) => lower.includes(k)).length;
    if (count > bestCount) {
      bestCount = count;
      best = pattern;
    }
  }

  if (!best || bestCount === 0) return null;

  return {
    primary: best.emotion,
    confidence: Math.min(bestCount * 0.25 + 0.5, 1),
    tag: best.tag,
    color: best.color,
    secondary: best.secondary,
  };
};

// ─── Crisis Detection ─────────────────────────────────────────────────────────

const CRISIS_KEYWORDS = {
  high: [
    "kill myself",
    "end my life",
    "suicide",
    "suicidal",
    "want to die",
    "rather be dead",
    "take my life",
    "not worth living",
    "better off dead",
  ],
  moderate: [
    "self harm",
    "self-harm",
    "cutting",
    "hurt myself",
    "can't go on",
    "no reason to live",
    "give up on life",
    "disappear forever",
  ],
  mild: [
    "don't want to be here",
    "wish i wasn't here",
    "tired of everything",
    "can't take it anymore",
    "life is pointless",
  ],
};

const HELPLINES: Helpline[] = [
  {
    name: "iCall (India)",
    number: "9152987821",
    url: "https://icallhelpline.org",
    hours: "Mon–Sat, 8am–10pm",
  },
  {
    name: "Vandrevala Foundation",
    number: "1860-2662-345",
    url: "https://www.vandrevalafoundation.com",
    hours: "24/7",
  },
  {
    name: "AASRA",
    number: "9820466627",
    url: "http://www.aasra.info",
    hours: "24/7",
  },
  {
    name: "Snehi",
    number: "044-24640050",
    hours: "Mon–Sat, 8am–10pm",
  },
];

export const detectCrisis = (text: string): CrisisResult => {
  const lower = text.toLowerCase();

  for (const keyword of CRISIS_KEYWORDS.high) {
    if (lower.includes(keyword)) {
      return {
        isCrisis: true,
        severity: "high",
        keywords: [keyword],
        helplines: HELPLINES,
      };
    }
  }
  for (const keyword of CRISIS_KEYWORDS.moderate) {
    if (lower.includes(keyword)) {
      return {
        isCrisis: true,
        severity: "moderate",
        keywords: [keyword],
        helplines: HELPLINES,
      };
    }
  }
  for (const keyword of CRISIS_KEYWORDS.mild) {
    if (lower.includes(keyword)) {
      return {
        isCrisis: true,
        severity: "mild",
        keywords: [keyword],
        helplines: HELPLINES,
      };
    }
  }

  return { isCrisis: false, severity: "none", keywords: [], helplines: [] };
};

const buildCrisisResponse = (crisis: CrisisResult): string => {
  const lines = [
    "I hear you, and I want you to know that what you're feeling matters deeply. You are not alone in this.",
    "",
    "Please reach out to a crisis helpline right now — trained counsellors are ready to listen:",
    ...crisis.helplines
      .slice(0, 2)
      .map((h) => `• ${h.name}: ${h.number} (${h.hours})`),
    "",
    "You deserve support. Will you reach out to one of them today?",
  ];
  return lines.join("\n");
};

// ─── Session Management ───────────────────────────────────────────────────────

export interface Session {
  id: string;
  createdAt: number;
  messages: ChatMessage[];
  mood?: string;
}

const sessions = new Map<string, Session>();

const generateSessionId = (): string =>
  `sukoon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const getOrCreateSession = (sessionId?: string): Session => {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId)!;
  }
  const id = sessionId || generateSessionId();
  const session: Session = { id, createdAt: Date.now(), messages: [] };
  sessions.set(id, session);
  return session;
};

export const clearSession = (sessionId: string): void => {
  sessions.delete(sessionId);
};

// ─── Retry Utility ────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
): Promise<T> => {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (i < retries) await sleep(delay * (i + 1)); // exponential backoff
    }
  }
  throw lastError;
};

// ─── Mock Provider ────────────────────────────────────────────────────────────

const MOCK_RESPONSES = [
  "Thank you for sharing that with me. It takes real courage to put your feelings into words. Can you tell me a little more about what's been weighing on you?",
  "I hear you, and what you're feeling is completely valid. You don't have to carry this alone. What do you think is at the root of this feeling?",
  "That sounds really difficult. Sometimes our emotions are trying to tell us something important. What has your day been like today?",
  "I'm here with you in this. Let's take it one gentle step at a time. Is there one thing right now that would help you feel a little lighter?",
  "You're doing something brave by reaching out and talking about this. How long have you been carrying these feelings?",
  "Sometimes the weight of everything can feel impossible. But you're here, and that matters. What's been the hardest part lately?",
  "I want to make sure I understand what you're going through. When did you first start feeling this way?",
  "It sounds like you've been dealing with a lot. Your feelings make complete sense given what you're describing. What kind of support feels most helpful right now?",
];

const mockSendMessage = async (
  messages: ChatMessage[],
  opts?: SendMessageOptions,
): Promise<string> => {
  // Simulate network latency
  await sleep(1200 + Math.random() * 800);

  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg) return MOCK_RESPONSES[0];

  const lower = lastUserMsg.content.toLowerCase();

  // Mood-specific responses
  if (
    opts?.mood === "anxious" ||
    lower.includes("anxious") ||
    lower.includes("anxiety")
  ) {
    return "Anxiety can feel like your mind is running a race it never signed up for. I want you to know that feeling is real, and it makes sense. Can you tell me — what's the thought that keeps coming back?";
  }
  if (opts?.mood === "sad" || lower.includes("sad") || lower.includes("cry")) {
    return "Sadness is your heart's way of honouring something that matters. There's no need to rush through it. Would you like to talk about what's brought this on?";
  }
  if (
    opts?.mood === "stressed" ||
    lower.includes("stress") ||
    lower.includes("overwhelm")
  ) {
    return "When everything piles up, it can feel like there's no way out. Let's slow down together for a moment. What feels most urgent to you right now?";
  }
  if (
    lower.includes("breath") ||
    lower.includes("calm") ||
    lower.includes("relax")
  ) {
    return "Let's try something simple. Close your eyes and breathe in slowly for 4 counts… hold for 4… breathe out for 6. You're doing great. How does that feel?";
  }
  if (
    lower.includes("exam") ||
    lower.includes("study") ||
    lower.includes("college")
  ) {
    return "Academic pressure can feel enormous — like your entire future is sitting on a single moment. But you are so much more than your grades. What's specifically worrying you most about this?";
  }

  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
};

// ─── Claude Provider ──────────────────────────────────────────────────────────

const claudeSendMessage = async (
  messages: ChatMessage[],
  opts?: SendMessageOptions,
): Promise<string> => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.apiKey || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CONFIG.model || "claude-haiku-4-5-20251001",
      max_tokens: CONFIG.maxTokens,
      system: buildSystemPrompt(opts?.mood, opts?.intensity),
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Claude API error ${response.status}: ${(err as any)?.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.content?.[0]?.text || "I'm here for you. Can you tell me more?";
};

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

const openaiSendMessage = async (
  messages: ChatMessage[],
  opts?: SendMessageOptions,
): Promise<string> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: CONFIG.model || "gpt-4o-mini",
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(opts?.mood, opts?.intensity),
        },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `OpenAI API error ${response.status}: ${(err as any)?.error?.message || response.statusText}`,
    );
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    "I'm here for you. Can you tell me more?"
  );
};

// ─── Custom Backend Provider ──────────────────────────────────────────────────

const customSendMessage = async (
  messages: ChatMessage[],
  opts?: SendMessageOptions,
): Promise<string> => {
  const response = await fetch(`${CONFIG.customBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      mood: opts?.mood,
      intensity: opts?.intensity,
      sessionId: opts?.sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Custom API error ${response.status}: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.response || data.text || data.message || "I'm here for you.";
};

// ─── Main sendMessage ─────────────────────────────────────────────────────────

export const sendMessage = async (
  messages: ChatMessage[],
  opts?: SendMessageOptions,
): Promise<AIResponse> => {
  const startTime = Date.now();
  const session = getOrCreateSession(opts?.sessionId);

  // ── Crisis check ─────────────────────────────────────
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  if (lastUserMsg) {
    const crisis = detectCrisis(lastUserMsg.content);
    if (crisis.isCrisis) {
      return {
        text: buildCrisisResponse(crisis),
        isCrisis: true,
        sessionId: session.id,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ── Emotion detection ────────────────────────────────
  const emotion = lastUserMsg
    ? (detectEmotion(lastUserMsg.content) ?? undefined)
    : undefined;

  // ── Route to provider ────────────────────────────────
  const fetchFn = async (): Promise<string> => {
    switch (CONFIG.provider) {
      case "claude":
        return claudeSendMessage(messages, opts);
      case "openai":
        return openaiSendMessage(messages, opts);
      case "custom":
        return customSendMessage(messages, opts);
      case "mock":
      default:
        return mockSendMessage(messages, opts);
    }
  };

  const text = await withRetry(
    fetchFn,
    CONFIG.retries ?? 2,
    CONFIG.retryDelay ?? 800,
  );

  // ── Update session ───────────────────────────────────
  session.messages = messages;
  if (opts?.mood) session.mood = opts.mood;

  return {
    text,
    emotion,
    isCrisis: false,
    sessionId: session.id,
    latencyMs: Date.now() - startTime,
  };
};

// ─── Convenience exports ──────────────────────────────────────────────────────

/** Quick one-shot message with no history */
export const quickMessage = async (
  userText: string,
  opts?: SendMessageOptions,
): Promise<AIResponse> =>
  sendMessage([{ role: "user", content: userText }], opts);

/** Get the active config (read-only) */
export const getConfig = (): Readonly<SukoonConfig> => ({ ...CONFIG });

/** Override config at runtime (e.g. to inject API key after user login) */
export const setConfig = (overrides: Partial<SukoonConfig>): void => {
  Object.assign(CONFIG, overrides);
};

/** Bundled API object for convenient imports */
export const SukoonAPI = {
  sendMessage,
  quickMessage,
  detectEmotion,
  detectCrisis,
  getOrCreateSession,
  clearSession,
  getConfig,
  setConfig,
};

export default SukoonAPI;
