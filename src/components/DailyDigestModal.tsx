import React, { useState } from "react";
import {
  X,
  Sparkles,
  Target,
  Clock,
  CheckSquare,
  AlertCircle,
  Loader2,
  ArrowRight,
  Check,
} from "lucide-react";
import type { Email } from "../types/email";

export interface DigestActionItem {
  emailId: string;
  task: string;
  priority: string;
}

interface DailyDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
  emails: Email[];
  onSelectEmail: (emailId: string) => void;
  onAiActionSuccess: (count: number) => void;
  initialTab?: "overview" | "action-items";
}

export const DailyDigestModal: React.FC<DailyDigestModalProps> = ({
  isOpen,
  onClose,
  emails,
  onSelectEmail,
  onAiActionSuccess,
  initialTab = "overview",
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "action-items">(
    initialTab
  );
  const [aiItems, setAiItems] = useState<DigestActionItem[] | null>(null);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(
    new Set()
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeEmails = emails.filter((e) => !e.inTrash && !e.isArchived);
  const focusEmails = activeEmails.filter((e) => e.aiScore >= 90);
  const urgentTasks = activeEmails.filter(
    (e) => e.aiScore >= 85 && e.draftStatus === "pending"
  );
  const top3Priorities = [...activeEmails]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3);
  const timeSavedMins = Math.max(18, activeEmails.length * 4);

  const defaultActionItems: DigestActionItem[] = top3Priorities.map((e) => ({
    emailId: e.id,
    task: `${e.senderName}: ${e.scoreReason}`,
    priority: e.aiScore >= 90 ? "Focus" : "Normal",
  }));

  const displayedItems = aiItems ?? defaultActionItems;

  const handleToggleItemDone = (idx: number) => {
    setCompletedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleExtractActionItems = async () => {
    setIsExtracting(true);
    setError(null);
    try {
      const payload = activeEmails.slice(0, 8).map((e) => ({
        id: e.id,
        senderName: e.senderName,
        subject: e.subject,
        aiScore: e.aiScore,
        aiSummary: e.aiSummary,
      }));
      const res = await fetch("/api/dailyDigest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract AI Action Items.");
      }
      if (Array.isArray(data.actionItems)) {
        setAiItems(data.actionItems);
        setCompletedIndices(new Set());
        setActiveTab("action-items");
        onAiActionSuccess(data.actionItems.length);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to extract action items."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-digest-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#121212] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <div>
              <h2
                id="daily-digest-title"
                className="text-base font-semibold text-white"
              >
                Today's Daily Digest
              </h2>
              <p className="text-xs text-zinc-400">
                Executive inbox briefing · MailMind OS AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close Daily Digest"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily Digest Tabs: Overview | AI Action Items */}
        <div className="px-5 pt-3 pb-2 border-b border-white/[0.06] flex items-center gap-2 shrink-0 bg-[#101010]">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === "overview"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Today's Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("action-items")}
            className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "action-items"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>AI Action Items</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono tabular-nums">
              {displayedItems.length}
            </span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {activeTab === "overview" ? (
            <>
              {/* 4 Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 sm:gap-3 font-mono tabular-nums">
                <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06]">
                  <p className="text-[11px] font-sans text-zinc-400">
                    Total Emails
                  </p>
                  <p className="text-xl font-semibold text-white mt-0.5">
                    {activeEmails.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06]">
                  <p className="text-[11px] font-sans text-zinc-400">
                    Focus Emails
                  </p>
                  <p className="text-xl font-semibold text-emerald-400 mt-0.5">
                    {focusEmails.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06]">
                  <p className="text-[11px] font-sans text-zinc-400">
                    Urgent Tasks
                  </p>
                  <p className="text-xl font-semibold text-amber-400 mt-0.5">
                    {urgentTasks.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06]">
                  <p className="text-[11px] font-sans text-zinc-400">
                    Time Saved
                  </p>
                  <p className="text-xl font-semibold text-emerald-400 mt-0.5">
                    {timeSavedMins}m
                  </p>
                </div>
              </div>

              {/* Top 3 Priorities */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-zinc-200">
                    Top 3 Priorities
                  </h3>
                </div>
                <div className="border border-white/[0.08] rounded-xl bg-[#0D0D0D] divide-y divide-white/[0.06] overflow-hidden">
                  {top3Priorities.map((email, idx) => (
                    <button
                      key={email.id}
                      type="button"
                      onClick={() => {
                        onSelectEmail(email.id);
                        onClose();
                      }}
                      className="w-full p-3.5 text-left hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-emerald-400 font-semibold">
                            #{idx + 1} · {email.aiScore}
                          </span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-300 font-medium truncate">
                            {email.senderName}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">
                          {email.subject}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Switch to AI Action Items Tab */}
              <div className="p-3.5 rounded-xl bg-[#161616] border border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {displayedItems.length} AI Action Items ready from demo
                    inbox
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("action-items")}
                  className="min-h-[34px] px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  Open AI Action Items Tab
                </button>
              </div>
            </>
          ) : (
            /* AI Action Items Tab */
            <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.07] space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h3 className="text-xs font-semibold text-white">
                      Extracted AI Action Items
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Click any task to open the email or mark done
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExtractActionItems}
                  disabled={isExtracting || activeEmails.length === 0}
                  className="min-h-[34px] px-3 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>
                    {isExtracting
                      ? "Extracting..."
                      : aiItems
                      ? "Refresh AI Action Items"
                      : "Extract AI Action Items"}
                  </span>
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}

              <ul className="space-y-2">
                {displayedItems.map((item, idx) => {
                  const isDone = completedIndices.has(idx);
                  return (
                    <li
                      key={`${item.emailId}-${idx}`}
                      className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-[#0E0E0E] border border-white/[0.05] text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleItemDone(idx)}
                        aria-label="Toggle action item completed"
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? "bg-emerald-500 border-emerald-500 text-black"
                            : "border-white/25 hover:border-emerald-400"
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectEmail(item.emailId);
                          onClose();
                        }}
                        className={`text-left transition-colors flex-1 ${
                          isDone
                            ? "line-through text-zinc-500"
                            : "text-zinc-200 hover:text-white"
                        }`}
                      >
                        {item.task}
                      </button>

                      <span
                        className={`font-mono shrink-0 ${
                          item.priority === "Focus"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-zinc-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Estimated {timeSavedMins} minutes saved today</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] w-full sm:w-auto px-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
