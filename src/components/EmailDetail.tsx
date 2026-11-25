import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Check,
  X,
  Send,
  RefreshCw,
  Trash2,
  MailX,
  Star,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Crown,
  AlarmClock,
  Archive,
} from "lucide-react";
import type { Email, ReplyTone, TeamRole } from "../types/email";
import { getScoreLabel, getScoreTier } from "../types/email";

interface EmailDetailProps {
  email: Email | null;
  isVipSender: boolean;
  activeRole: TeamRole;
  onBackMobile: () => void;
  onUpdateDraft: (emailId: string, draft: string) => void;
  onApproveDraft: (emailId: string) => void;
  onRejectDraft: (emailId: string) => void;
  onResetDraftToPending: (emailId: string) => void;
  onSendApprovedReply: (emailId: string) => void;
  onRefreshAiAnalysis: (emailId: string, tone: ReplyTone) => Promise<void>;
  onSummarizeEmail: (emailId: string) => Promise<void>;
  onRedraftTone: (emailId: string, tone: ReplyTone) => Promise<void>;
  onToggleStar: (emailId: string) => void;
  onArchiveEmail: (emailId: string) => void;
  onDeleteEmail: (emailId: string) => void;
  onUnsubscribeSender: (subscriptionId: string) => void;
  onAddVipSender: (senderEmail: string, senderName: string) => void;
  onSnoozeEmail: (email: Email, snoozeUntil: string) => void;
  onUseSmartReplyInCompose: (payload: {
    to: string;
    subject: string;
    body: string;
  }) => void;
  isAnalyzing: boolean;
  isSummarizing: boolean;
  isRedrafting: boolean;
  aiError: string | null;
}

interface SmartReplySuggestion {
  label: string;
  body: string;
}

function getSmartReplySuggestions(email: Email): SmartReplySuggestion[] {
  const firstName = email.senderName.split(" ")[0] || "there";
  if (email.category === "career") {
    return [
      {
        label: "Confirm Proposed Slot",
        body: `Hi ${firstName},\n\nThank you for the update! The proposed time works great for me—please go ahead and lock the calendar invite.\n\nBest regards,\nMunazza`,
      },
      {
        label: "Share Alternate Times",
        body: `Hi ${firstName},\n\nThank you for reaching out. Could we schedule this for tomorrow afternoon between 3:00 PM and 5:30 PM IST instead?\n\nBest regards,\nMunazza`,
      },
      {
        label: "Ask About Format",
        body: `Hi ${firstName},\n\nLooking forward to connecting! Could you share the agenda or any prep topics for the session?\n\nBest regards,\nMunazza`,
      },
    ];
  }
  if (email.category === "finance") {
    return [
      {
        label: "Confirm & Process",
        body: `Hi ${firstName},\n\nReceived with thanks. I have reviewed the details and queued this for processing today.\n\nBest regards,\nMunazza`,
      },
      {
        label: "Request Breakdown",
        body: `Hi ${firstName},\n\nThanks for sending this over. Could you share an itemized breakdown or updated invoice reference?\n\nBest regards,\nMunazza`,
      },
      {
        label: "Follow Up This Week",
        body: `Hi ${firstName},\n\nGot it—I'll verify this with our billing records and circle back by Friday.\n\nBest regards,\nMunazza`,
      },
    ];
  }
  if (email.category === "engineering" || email.category === "client") {
    return [
      {
        label: "Approve & Proceed",
        body: `Hi ${firstName},\n\nLooks solid to me—you have my sign-off to move forward with the rollout as planned.\n\nBest,\nMunazza`,
      },
      {
        label: "Quick Sync Call",
        body: `Hi ${firstName},\n\nThanks for flagging this. Let's hop on a quick 15-minute call today to finalize the next steps.\n\nBest,\nMunazza`,
      },
      {
        label: "Need More Info",
        body: `Hi ${firstName},\n\nThanks for the update! Could you share the latest logs/metrics so I can review before signing off?\n\nBest,\nMunazza`,
      },
    ];
  }
  return [
    {
      label: "Thanks, Received",
      body: `Hi ${firstName},\n\nThank you for sharing this update. I've noted the details on my end.\n\nBest regards,\nMunazza`,
    },
    {
      label: "Follow Up Later",
      body: `Hi ${firstName},\n\nThanks for reaching out—I'll review this carefully and get back to you shortly.\n\nBest regards,\nMunazza`,
    },
    {
      label: "Schedule a Chat",
      body: `Hi ${firstName},\n\nAppreciate the note! Would you be open to connecting briefly later this week to discuss?\n\nBest regards,\nMunazza`,
    },
  ];
}

export const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  isVipSender,
  activeRole,
  onBackMobile,
  onUpdateDraft,
  onApproveDraft,
  onRejectDraft,
  onResetDraftToPending,
  onSendApprovedReply,
  onRefreshAiAnalysis,
  onSummarizeEmail,
  onRedraftTone,
  onToggleStar,
  onArchiveEmail,
  onDeleteEmail,
  onUnsubscribeSender,
  onAddVipSender,
  onSnoozeEmail,
  onUseSmartReplyInCompose,
  isAnalyzing,
  isSummarizing,
  isRedrafting,
  aiError,
}) => {
  const [selectedTone, setSelectedTone] = useState<ReplyTone>("professional");

  useEffect(() => {
    setSelectedTone("professional");
  }, [email?.id]);

  if (!email) {
    return (
      <div className="hidden lg:flex flex-col items-center justify-center h-full bg-[#0A0A0A] px-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#131313] border border-white/[0.08] flex items-center justify-center mb-4">
          <Sparkles className="w-5 h-5 text-zinc-500" />
        </div>
        <h3 className="text-base font-semibold text-zinc-200">
          Select an email to review
        </h3>
        <p className="mt-1.5 text-sm text-zinc-500 max-w-[36ch]">
          Click any message (or use J / K) to view its AI summary and review a
          drafted reply. Drafts never send automatically.
        </p>
      </div>
    );
  }

  const tier = getScoreTier(email.aiScore);
  const scoreLabel = getScoreLabel(email.aiScore);
  const scoreColorClass =
    tier === "focus"
      ? "text-emerald-400"
      : tier === "normal"
      ? "text-amber-400"
      : "text-zinc-400";

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={email.id}
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:h-full bg-[#0A0A0A] lg:overflow-hidden"
        aria-label="Selected email details"
      >
        {/* Detail Top Bar */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-white/[0.08] shrink-0 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackMobile}
              className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Back to inbox"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className={`font-semibold ${scoreColorClass}`}>
                {email.aiScore}/100 · {scoreLabel}
              </span>
              <span
                className="text-zinc-600 hidden sm:inline"
                aria-hidden="true"
              >
                ·
              </span>
              <span className="text-zinc-400 font-sans hidden xl:inline truncate max-w-[200px]">
                {email.scoreReason}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => onSummarizeEmail(email.id)}
              disabled={isSummarizing}
              className="min-h-[38px] px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${isSummarizing ? "animate-spin" : ""}`}
              />
              <span>{isSummarizing ? "Summarizing..." : "AI Summarize"}</span>
            </button>

            <button
              type="button"
              onClick={() => onAddVipSender(email.senderEmail, email.senderName)}
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isVipSender
                  ? "bg-amber-500/15 border-amber-500/35 text-amber-300"
                  : "border-white/10 text-zinc-300 hover:text-amber-300 hover:bg-white/5"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{isVipSender ? "VIP Pinned" : "Add VIP"}</span>
            </button>

            <button
              type="button"
              onClick={() => onSnoozeEmail(email, "Tomorrow 9:00 AM")}
              className="min-h-[38px] px-3 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <AlarmClock className="w-3.5 h-3.5" />
              <span>Snooze</span>
            </button>

            {email.isSubscription &&
              email.subscriptionId &&
              !email.isUnsubscribed && (
                <button
                  type="button"
                  onClick={() => onUnsubscribeSender(email.subscriptionId!)}
                  className="min-h-[38px] px-3 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <MailX className="w-3.5 h-3.5" />
                  <span>Unsubscribe</span>
                </button>
              )}

            <button
              type="button"
              onClick={() => onToggleStar(email.id)}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
              aria-label={email.isStarred ? "Unstar email" : "Star email"}
              title="Star (S)"
            >
              <Star
                className={`w-4 h-4 ${
                  email.isStarred ? "fill-amber-400 text-amber-400" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => onArchiveEmail(email.id)}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Archive email"
              title="Archive (E)"
            >
              <Archive className="w-4 h-4" />
            </button>

            <button
              type="button"
              disabled={activeRole === "Viewer"}
              title={
                activeRole === "Viewer"
                  ? "Viewer role cannot delete emails"
                  : "Move email to trash"
              }
              onClick={() => onDeleteEmail(email.id)}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-35"
              aria-label="Move email to trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body + AI Modules */}
        <div className="flex-1 lg:overflow-y-auto px-4 sm:px-6 py-5 pb-6 space-y-6">
          {/* Email Header */}
          <header className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-white leading-snug text-balance">
              {email.subject}
            </h1>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#191919] border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0">
                  {email.senderInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {email.senderName}
                    </p>
                    {isVipSender && (
                      <span className="text-[11px] font-mono font-semibold text-amber-400">
                        · VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    {email.senderEmail}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono tabular-nums text-zinc-500">
                {email.timestamp}
              </span>
            </div>
          </header>

          {/* 2-Line AI Summary Box */}
          <section
            aria-label="2-line AI summary"
            className="p-4 rounded-2xl bg-[#121212] border border-white/[0.08] space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-semibold text-zinc-200">
                  2-Line AI Summary
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onRefreshAiAnalysis(email.id, selectedTone)}
                disabled={isAnalyzing}
                className="min-h-[32px] px-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`}
                />
                <span>{isAnalyzing ? "Analyzing..." : "Refresh AI"}</span>
              </button>
            </div>

            <p className="text-sm text-zinc-200 leading-relaxed line-clamp-2">
              {email.aiSummary}
            </p>

            {email.actionItems && email.actionItems.length > 0 && (
              <div className="pt-2 border-t border-white/[0.06] space-y-1">
                <p className="text-[11px] font-semibold text-emerald-400">
                  AI Action Items
                </p>
                <ul className="space-y-1 text-xs text-zinc-300 list-disc list-inside">
                  {email.actionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {aiError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300"
            >
              {aiError}
            </div>
          )}

          {/* Full Email Body */}
          <section className="py-2 border-y border-white/[0.06]">
            <div className="whitespace-pre-line text-[15px] text-zinc-300 leading-[1.65] max-w-[68ch]">
              {email.body}
            </div>
          </section>

          {/* AI Reply Draft — Human-in-the-Loop (Never Auto-Send) */}
          <section
            aria-label="AI reply draft"
            className="p-4 sm:p-5 rounded-2xl bg-[#121212] border border-white/[0.08] space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  AI Reply Draft
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Never auto-sends. Review, edit, and explicitly approve
                    before sending.
                  </span>
                </p>
              </div>

              {email.draftStatus === "pending" && (
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1A1A1A] border border-white/[0.06] self-start sm:self-auto">
                  {(["professional", "concise", "warm"] as const).map(
                    (tone) => (
                      <button
                        key={tone}
                        type="button"
                        disabled={isRedrafting}
                        onClick={() => {
                          setSelectedTone(tone);
                          onRedraftTone(email.id, tone);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                          selectedTone === tone
                            ? "bg-[#262626] text-white"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {tone}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {email.draftStatus === "rejected" ? (
              <div className="p-4 rounded-xl bg-[#171717] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    AI draft rejected
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Nothing was sent to {email.senderName}. You can generate a
                    fresh draft or write manually.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onResetDraftToPending(email.id);
                    onRedraftTone(email.id, selectedTone);
                  }}
                  disabled={isRedrafting}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Generate New Draft</span>
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <textarea
                    value={email.aiReplyDraft}
                    onChange={(e) => onUpdateDraft(email.id, e.target.value)}
                    disabled={email.draftStatus === "sent" || isRedrafting}
                    rows={6}
                    aria-label="Editable AI reply draft"
                    className="w-full p-3.5 rounded-xl bg-[#0A0A0A] border border-white/[0.09] text-sm text-zinc-100 leading-relaxed focus:outline-none focus:border-white/25 resize-y disabled:opacity-60"
                  />
                  {isRedrafting && (
                    <div className="absolute inset-0 rounded-xl bg-black/60 backdrop-blur-[1px] flex items-center justify-center gap-2 text-xs text-zinc-200">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Drafting {selectedTone} reply with Gemini...</span>
                    </div>
                  )}
                </div>

                {email.draftStatus === "pending" && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onRejectDraft(email.id)}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onApproveDraft(email.id)}
                      disabled={!email.aiReplyDraft.trim()}
                      className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Draft</span>
                    </button>
                  </div>
                )}

                {email.draftStatus === "approved" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                    <div className="text-xs">
                      <p className="font-semibold text-emerald-300">
                        Draft Approved ({email.approvedAt})
                      </p>
                      <p className="text-zinc-400 mt-0.5">
                        Held safely until you click Send Reply.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onResetDraftToPending(email.id)}
                        className="min-h-[40px] px-3 py-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                      >
                        Edit Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => onSendApprovedReply(email.id)}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Approved Reply</span>
                      </button>
                    </div>
                  </div>
                )}

                {email.draftStatus === "sent" && (
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#181818] border border-white/[0.08] text-xs">
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>
                        Approved & sent to {email.senderEmail} at {email.sentAt}
                      </span>
                    </span>
                  </div>
                )}
              </>
            )}
          </section>

          {/* 3 Smart AI Reply Suggestions (One-Click to Use in Compose) */}
          <section
            aria-label="Smart AI reply suggestions"
            className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs sm:text-sm font-semibold text-white">
                  Smart Reply Suggestions
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400">
                One-click to open in Compose
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {getSmartReplySuggestions(email).map((suggestion) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() =>
                    onUseSmartReplyInCompose({
                      to: email.senderEmail,
                      subject: email.subject.startsWith("Re:")
                        ? email.subject
                        : `Re: ${email.subject}`,
                      body: suggestion.body,
                    })
                  }
                  className="p-3 rounded-xl bg-[#161616] border border-white/[0.07] hover:border-emerald-500/40 hover:bg-[#1B1B1B] text-left transition-colors space-y-1.5"
                >
                  <p className="text-xs font-semibold text-emerald-300">
                    {suggestion.label}
                  </p>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {suggestion.body.replace(/\n+/g, " ")}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </motion.article>
    </AnimatePresence>
  );
};
