/**                                                                                                                                                                                         
   * api.ts — Sukoon AI Service Layer                                                                                                                                                         
   */

// ─── Config ───────────────────────────────────────────────────────────────────                                                                                                           

export type Provider = "mock" | "claude" | "openai" | "custom";

export interface SukoonConfig {
  provider: Provider;
  apiKey?: string;
  customBaseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  retries?: number;
  retryDelay?: number;
}

const CONFIG: SukoonConfig = {
  provider: "custom",
  apiKey: import.meta.env?.VITE_API_KEY || "",
  customBaseUrl: import.meta.env?.VITE_CUSTOM_API_URL || "http://localhost:8000",
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
  mood?: string;
  intensity?: number;
  sessionId?: string;
  stream?: boolean;
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
  primary: string;
  confidence: number;
  tag: string;
  color: string;
  secondary?: string[];
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
      keys: ["anxious", "anxiety", "panic", "nervous", "worry", "worried", "scared", "fear", "dread", "uneasy"], emotion: "anxiety", tag: "😰 Anxiety detected", color: "#e07b39", secondary:
        ["stress", "fear"]
    },
    {
      keys: ["sad", "sadness", "cry", "crying", "tears", "depressed", "depression", "hopeless", "grief", "loss", "miss", "lonely"], emotion: "sadness", tag: "💙 Sadness detected", color:
        "#5b8fcf", secondary: ["loneliness", "grief"]
    },
    {
      keys: ["stress", "stressed", "overwhelmed", "pressure", "burnout", "exhausted", "tired", "drained", "too much"], emotion: "stress", tag: "⚡ Stress detected", color: "#c0392b",
      secondary: ["anxiety", "fatigue"]
    },
    {
      keys: ["angry", "anger", "furious", "frustrated", "irritated", "mad", "rage", "upset", "annoyed"], emotion: "anger", tag: "🔥 Frustration detected", color: "#e74c3c", secondary:
        ["stress"]
    },
    {
      keys: ["numb", "empty", "blank", "nothing", "disconnected", "detached", "flat", "hollow"], emotion: "numbness", tag: "🩶 Disconnection noticed", color: "#7f8c8d", secondary:
        ["dissociation"]
    },
    {
      keys: ["lonely", "alone", "isolated", "no one", "nobody", "ignored", "invisible", "excluded"], emotion: "loneliness", tag: "🥺 Loneliness detected", color: "#8e44ad", secondary:
        ["sadness"]
    },
    {
      keys: ["happy", "good", "great", "wonderful", "excited", "joy", "joyful", "grateful", "thankful", "content", "peaceful", "calm"], emotion: "positive", tag: "🌿 Positive energy", color:
        "#3d8b7a", secondary: ["calm"]
    },
    {
      keys: ["confused", "lost", "don't know", "unsure", "uncertain", "unclear", "don't understand"], emotion: "confusion", tag: "🌀 Uncertainty noticed", color: "#a569bd", secondary:
        ["anxiety"]
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
  high: ["kill myself", "end my life", "suicide", "suicidal", "want to die", "rather be dead", "take my life", "not worth living", "better off dead"],
  moderate: ["self harm", "self-harm", "cutting", "hurt myself", "can't go on", "no reason to live", "give up on life", "disappear forever"],
  mild: ["don't want to be here", "wish i wasn't here", "tired of everything", "can't take it anymore", "life is pointless"],
};

const HELPLINES: Helpline[] = [
  { name: "iCall (India)", number: "9152987821", url: "https://icallhelpline.org", hours: "Mon–Sat, 8am–10pm" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", url: "https://www.vandrevalafoundation.com", hours: "24/7" },
  { name: "AASRA", number: "9820466627", url: "http://www.aasra.info", hours: "24/7" },
  { name: "Snehi", number: "044-24640050", hours: "Mon–Sat, 8am–10pm" },
];

export const detectCrisis = (text: string): CrisisResult => {
  const lower = text.toLowerCase();
  for (const keyword of CRISIS_KEYWORDS.high) {
    if (lower.includes(keyword)) return { isCrisis: true, severity: "high", keywords: [keyword], helplines: HELPLINES };
  }
  for (const keyword of CRISIS_KEYWORDS.moderate) {
    if (lower.includes(keyword)) return { isCrisis: true, severity: "moderate", keywords: [keyword], helplines: HELPLINES };
  }
  for (const keyword of CRISIS_KEYWORDS.mild) {
    if (lower.includes(keyword)) return { isCrisis: true, severity: "mild", keywords: [keyword], helplines: HELPLINES };
  }
  return { isCrisis: false, severity: "none", keywords: [], helplines: [] };
};

const buildCrisisResponse = (crisis: CrisisResult): string => {
  const lines = [
    "I hear you, and I want you to know that what you're feeling matters deeply. You are not alone in this.",
    "",
    "Please reach out to a crisis helpline right now — trained counsellors are ready to listen:",
    ...crisis.helplines.slice(0, 2).map((h) => `• ${h.name}: ${h.number} (${h.hours})`),
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
const generateSessionId = (): string => `sukoon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const getOrCreateSession = (sessionId?: string): Session => {
  if (sessionId && sessions.has(sessionId)) return sessions.get(sessionId)!;
  const id = sessionId || generateSessionId();
  const session: Session = { id, createdAt: Date.now(), messages: [] };
  sessions.set(id, session);
  return session;
};

export const clearSession = (sessionId: string): void => sessions.delete(sessionId);

// ─── Retry Utility ────────────────────────────────────────────────────────────                                                                                                           

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries: number, delay: number): Promise<T> => {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (err) {
      lastError = err as Error;
      if (i < retries) await sleep(delay * (i + 1));
    }
  }
  throw lastError;
};

// ─── Providers ──────────────────────────────────────────────────────────────────                                                                                                         

// ─── Auth Header Helper ───────────────────────────────────────────────────────

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("sukoon_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const customSendMessage = async (messages: ChatMessage[], opts?: SendMessageOptions): Promise<string> => {
  const response = await fetch(`${CONFIG.customBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ messages, mood: opts?.mood, intensity: opts?.intensity, sessionId: opts?.sessionId }),
  });
  if (!response.ok) throw new Error(`Custom API error ${response.status}: ${response.statusText}`);
  const data = await response.json();
  return data.reply || data.response || data.text || data.message || "I'm here for you.";
};

const mockSendMessage = async (messages: ChatMessage[], opts?: SendMessageOptions): Promise<string> => {
  await sleep(1200);
  return "This is a mock response. Please connect your backend!";
};

// ─── Main sendMessage ─────────────────────────────────────────────────────────                                                                                                           

export const sendMessage = async (messages: ChatMessage[], opts?: SendMessageOptions): Promise<AIResponse> => {
  const startTime = Date.now();
  const session = getOrCreateSession(opts?.sessionId);
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");

  if (lastUserMsg) {
    const crisis = detectCrisis(lastUserMsg.content);
    if (crisis.isCrisis) return { text: buildCrisisResponse(crisis), isCrisis: true, sessionId: session.id, latencyMs: Date.now() - startTime };
  }

  const emotion = lastUserMsg ? (detectEmotion(lastUserMsg.content) ?? undefined) : undefined;

  const fetchFn = async (): Promise<string> => {
    if (CONFIG.provider === "custom") return customSendMessage(messages, opts);
    return mockSendMessage(messages, opts);
  };

  const text = await withRetry(fetchFn, CONFIG.retries ?? 2, CONFIG.retryDelay ?? 800);
  session.messages = messages;
  if (opts?.mood) session.mood = opts.mood;

  return { text, emotion, isCrisis: false, sessionId: session.id, latencyMs: Date.now() - startTime };
};

// ─── Convenience exports ──────────────────────────────────────────────────────                                                                                                           

export const fetchHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const response = await fetch(`${CONFIG.customBaseUrl}/api/history/${sessionId}`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`History API error ${response.status}: ${response.statusText}`);
  const data = await response.json();
  return data.messages || [];
};

export const quickMessage = async (userText: string, opts?: SendMessageOptions): Promise<AIResponse> =>
  sendMessage([{ role: "user", content: userText }], opts);

export const getConfig = (): Readonly<SukoonConfig> => ({ ...CONFIG });
export const setConfig = (overrides: Partial<SukoonConfig>): void => Object.assign(CONFIG, overrides);

export const fetchSessions = async (): Promise<Array<{ sessionId: string; lastMessage: string; timestamp: any }>> => {
  const response = await fetch(`${CONFIG.customBaseUrl}/api/sessions`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`Sessions API error ${response.status}: ${response.statusText}`);
  return await response.json();
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string): Promise<string> => {
  const res = await fetch(`${CONFIG.customBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Invalid credentials, please try again.");
  }
  const data = await res.json();
  const token: string = data.access_token;
  localStorage.setItem("sukoon_token", token);
  return token;
};

export const signup = async (email: string, password: string): Promise<void> => {
  const username = email.split("@")[0]; // derive username from email prefix
  const res = await fetch(`${CONFIG.customBaseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Registration failed. Please try again.");
  }
};

export const logout = (): void => {
  localStorage.removeItem("sukoon_token");
  localStorage.removeItem("sukoon_session_id");
};

export const SukoonAPI = { sendMessage, quickMessage, detectEmotion, detectCrisis, getOrCreateSession, clearSession, getConfig, setConfig, fetchSessions, login, signup, logout };
export default SukoonAPI;