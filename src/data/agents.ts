import type { AgentDefinition } from "../types/email";

export const FOURTEEN_AGENTS: AgentDefinition[] = [
  {
    id: "triage",
    name: "Triage Agent",
    role: "0–100 Focus Scoring",
    description: "Scores every email 0–100 into Focus (90+), Normal (50–89), and Low (<50).",
    category: "Inbox",
  },
  {
    id: "summarizer",
    name: "Summarizer Agent",
    role: "2-Line Executive Brief",
    description: "Distills long threads into a 2-line Gemini summary for instant scanning.",
    category: "Inbox",
  },
  {
    id: "replyDraft",
    name: "Reply Draft Agent",
    role: "Human-in-the-Loop",
    description: "Prepares ready-to-approve reply drafts. Never auto-sends without approval.",
    category: "Action",
  },
  {
    id: "hinglishSearch",
    name: "Hinglish Search Agent",
    role: "Bilingual Semantic Search",
    description: "Understands queries like 'interview wala mail' and 'paisa ya invoice'.",
    category: "Inbox",
  },
  {
    id: "unsubscribe",
    name: "Unsubscribe Agent",
    role: "Clutter Cleanup",
    description: "Detects recurring mailing lists for one-click unsubscribe and Delete All.",
    category: "Action",
  },
  {
    id: "scheduler",
    name: "Scheduler Agent",
    role: "Firestore Queue",
    description: "Schedules future email delivery with validation, rate limiting, and Firestore sync.",
    category: "Action",
  },
  {
    id: "vip",
    name: "VIP Agent",
    role: "Priority Pinning",
    description: "Pins VIP senders to the top of your inbox and persists them in Firestore.",
    category: "Inbox",
  },
  {
    id: "snooze",
    name: "Snooze Agent",
    role: "Deferred Inbox",
    description: "Temporarily snoozes emails until a chosen time with Firestore persistence.",
    category: "Action",
  },
  {
    id: "securityGuard",
    name: "Injection Guard Agent",
    role: "Threat & Phishing Shield",
    description: "Blocks prompt injections, XSS payloads, and suspicious senders like hacker@evil.com.",
    category: "Security",
  },
  {
    id: "followUp",
    name: "Follow-Up Agent",
    role: "Reply Nudge",
    description: "Tracks open recruiter & client threads that need a timely follow-up.",
    category: "Action",
  },
  {
    id: "actionItems",
    name: "Action Items Agent",
    role: "Deadline Extractor",
    description: "Extracts interview slots, release deadlines, and payment due dates.",
    category: "Inbox",
  },
  {
    id: "toneCalibration",
    name: "Tone Calibration Agent",
    role: "Style Adapter",
    description: "Re-drafts replies between Professional, Concise, and Warm tones on demand.",
    category: "Action",
  },
  {
    id: "composeAssist",
    name: "Compose Assist Agent",
    role: "Zero-to-Draft",
    description: "Turns short Hinglish or English bullet notes into polished new messages.",
    category: "Action",
  },
  {
    id: "analyticsDigest",
    name: "Analytics & Quota Agent",
    role: "Telemetry & Latency",
    description: "Monitors Gemini token usage, 0.8s average latency, and weekly email volume.",
    category: "Ops",
  },
];

export const DEFAULT_AGENTS_STATE: Record<string, boolean> = FOURTEEN_AGENTS.reduce(
  (acc, agent) => {
    acc[agent.id] = true;
    return acc;
  },
  {} as Record<string, boolean>
);
