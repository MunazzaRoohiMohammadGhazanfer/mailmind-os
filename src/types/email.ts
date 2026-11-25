export type ScoreTier = "focus" | "normal" | "low";

export type DraftStatus = "pending" | "approved" | "rejected" | "sent";

export type NavSection =
  | "inbox"
  | "focus"
  | "subscriptions"
  | "approved"
  | "agents"
  | "devops"
  | "team"
  | "settings"
  | "trash";

export type ScoreFilter = "all" | "focus" | "normal" | "low";

export type ReplyTone = "professional" | "concise" | "warm";

export type LanguageCode = "en" | "hi";

export type TeamRole = "Admin" | "Viewer";

export interface Email {
  id: string;
  senderName: string;
  senderEmail: string;
  senderInitials: string;
  subject: string;
  snippet: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  aiScore: number;
  scoreReason: string;
  category:
    | "career"
    | "client"
    | "finance"
    | "engineering"
    | "travel"
    | "subscription";
  aiSummary: string;
  actionItems?: string[];
  aiReplyDraft: string;
  draftStatus: DraftStatus;
  approvedAt?: string;
  sentAt?: string;
  isSubscription: boolean;
  subscriptionId?: string;
  isUnsubscribed?: boolean;
  isArchived?: boolean;
  inTrash?: boolean;
}

export interface SubscriptionGroup {
  id: string;
  senderName: string;
  senderEmail: string;
  domain: string;
  frequency: string;
  averageScore: number;
  emailCount: number;
  emailIds: string[];
  latestSubject: string;
  isUnsubscribed: boolean;
}

export interface ConnectedAccount {
  uid: string;
  email: string;
  name: string;
  photoURL?: string | null;
  connectedAt: string;
  provider: "google" | "demo";
}

export interface HinglishSearchMatch {
  id: string;
  reason: string;
}

export interface HinglishSearchResult {
  query: string;
  interpretedIntent: string;
  matches: HinglishSearchMatch[];
}

export interface ScheduledEmailRecord {
  id: string;
  uid: string;
  to: string;
  subject: string;
  body: string;
  scheduleTime: string;
  status: "scheduled" | "sent" | "cancelled";
  createdAt: string;
}

export interface VipSenderRecord {
  id: string;
  uid: string;
  senderEmail: string;
  senderName: string;
  addedAt: string;
}

export interface SnoozedEmailRecord {
  id: string;
  uid: string;
  emailId: string;
  subject: string;
  senderName: string;
  snoozeUntil: string;
  status: "snoozed" | "woken";
}

export interface TeamMemberRecord {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: TeamRole;
  addedAt: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  category: "Inbox" | "Action" | "Security" | "Ops";
}

export interface LiveLogEntry {
  id: string;
  time: string;
  message: string;
  level: "info" | "success" | "warn";
}

export type SortBucket = "focus" | "normal" | "low" | "later";

export function getScoreTier(score: number): ScoreTier {
  if (score >= 90) return "focus";
  if (score >= 50) return "normal";
  return "low";
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return "Focus";
  if (score >= 50) return "Normal";
  return "Low";
}

export function getSortBucket(email: Email): SortBucket {
  if (email.aiScore >= 90) return "focus";
  if (email.aiScore >= 50) return "normal";
  if (email.aiScore >= 30) return "later";
  return "low";
}

export function getSortBucketLabel(bucket: SortBucket): string {
  if (bucket === "focus") return "Focus";
  if (bucket === "normal") return "Normal";
  if (bucket === "later") return "Later";
  return "Low";
}
