import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  Star,
  Loader2,
  Sparkles,
  Inbox as InboxIcon,
  PenSquare,
  Crown,
  ArrowUpDown,
  Mic,
  MicOff,
  Archive,
  AlarmClock,
  Trash2,
} from "lucide-react";
import type {
  Email,
  HinglishSearchResult,
  ScoreFilter,
  TeamRole,
} from "../types/email";
import {
  getScoreLabel,
  getScoreTier,
  getSortBucket,
  getSortBucketLabel,
} from "../types/email";

interface EmailListProps {
  emails: Email[];
  vipEmailSet: Set<string>;
  selectedEmailId: string | null;
  activeRole: TeamRole;
  onSelectEmail: (id: string) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onArchiveEmail: (id: string) => void;
  onSnoozeEmail: (email: Email, snoozeUntil: string) => void;
  onDeleteEmail: (id: string) => void;
  onOpenCompose: () => void;
  scoreFilter: ScoreFilter;
  onScoreFilterChange: (filter: ScoreFilter) => void;
  isAutoSorted: boolean;
  onToggleAutoSort: () => void;
  searchInput: string;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSearchInputChange: (val: string) => void;
  onRunSearch: (query: string) => void;
  onClearSearch: () => void;
  onVoiceNotice?: (message: string) => void;
  isSearching: boolean;
  searchResult: HinglishSearchResult | null;
  searchError: string | null;
  counts: {
    all: number;
    focus: number;
    normal: number;
    low: number;
  };
  sectionTitle: string;
}

const HINGLISH_PROMPTS = [
  "interview wala mail",
  "paisa ya invoice",
  "urgent kaam",
  "travel flight",
];

function getScoreTextColor(score: number): string {
  const tier = getScoreTier(score);
  if (tier === "focus") return "text-emerald-400";
  if (tier === "normal") return "text-amber-400";
  return "text-zinc-500";
}

function getScoreBarColor(score: number): string {
  const tier = getScoreTier(score);
  if (tier === "focus") return "bg-emerald-500";
  if (tier === "normal") return "bg-amber-500";
  return "bg-zinc-600";
}

function getBucketTextColor(bucket: ReturnType<typeof getSortBucket>): string {
  if (bucket === "focus") return "text-emerald-400";
  if (bucket === "normal") return "text-amber-400";
  if (bucket === "later") return "text-sky-400";
  return "text-zinc-500";
}

export const EmailList: React.FC<EmailListProps> = ({
  emails,
  vipEmailSet,
  selectedEmailId,
  activeRole,
  onSelectEmail,
  onToggleStar,
  onArchiveEmail,
  onSnoozeEmail,
  onDeleteEmail,
  onOpenCompose,
  scoreFilter,
  onScoreFilterChange,
  isAutoSorted,
  onToggleAutoSort,
  searchInput,
  searchInputRef,
  onSearchInputChange,
  onRunSearch,
  onClearSearch,
  onVoiceNotice,
  isSearching,
  searchResult,
  searchError,
  counts,
  sectionTitle,
}) => {
  const [isListening, setIsListening] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRunSearch(searchInput);
  };

  const handleVoiceSearch = () => {
    type SpeechWindow = Window & {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
    };
    const w = window as SpeechWindow;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRec) {
      onVoiceNotice?.(
        "Voice search unavailable in this browser — type Hinglish query or use Chrome/Android."
      );
      searchInputRef?.current?.focus();
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setIsListening(true);
      onVoiceNotice?.("Listening... speak your email search.");

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
        if (transcript) {
          onSearchInputChange(transcript);
          onRunSearch(transcript);
          onVoiceNotice?.(`Voice search: "${transcript}"`);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        onVoiceNotice?.("Could not capture voice audio. Please try again.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      onVoiceNotice?.("Voice microphone access denied or unsupported.");
    }
  };

  const matchReasonMap = new Map<string, string>();
  if (searchResult) {
    for (const m of searchResult.matches) {
      matchReasonMap.set(m.id, m.reason);
    }
  }

  return (
    <section
      className="flex flex-col lg:h-full w-full bg-[#0A0A0A] lg:border-r border-white/[0.08]"
      aria-label="Email list"
    >
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-white/[0.08] space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-white tracking-tight">
              {sectionTitle}
            </h2>
            <span className="text-xs font-mono tabular-nums text-zinc-400">
              {emails.length} {emails.length === 1 ? "email" : "emails"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleAutoSort}
              className={`min-h-[34px] px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                isAutoSorted
                  ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                  : "border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
              title="Sort emails into Focus, Normal, Low & Later"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{isAutoSorted ? "Sorted" : "Auto-Sort"}</span>
            </button>
            <button
              type="button"
              onClick={onOpenCompose}
              className="lg:hidden min-h-[34px] px-3 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>Compose</span>
            </button>
          </div>
        </div>

        {/* Hinglish Search Box */}
        <form onSubmit={handleFormSubmit} className="relative">
          <Search
            className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder={
              isListening ? "Listening..." : "Search MailMind OS..."
            }
            aria-label="Search MailMind OS"
            className="w-full min-h-[44px] pl-10 pr-32 rounded-xl bg-[#131313] border border-white/[0.09] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {(searchInput || searchResult) && (
              <button
                type="button"
                onClick={onClearSearch}
                className="min-h-[34px] min-w-[30px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleVoiceSearch}
              aria-label="Voice search"
              title="Voice Search (Speak to search)"
              className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors ${
                isListening
                  ? "bg-red-500/20 text-red-400 animate-pulse"
                  : "text-zinc-400 hover:text-emerald-400 hover:bg-white/5"
              }`}
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="submit"
              disabled={isSearching || !searchInput.trim()}
              className="min-h-[34px] px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-zinc-100 transition-colors disabled:opacity-40 flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Quick Hinglish Example Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <span className="text-[11px] text-zinc-500 whitespace-nowrap shrink-0">
            Hinglish:
          </span>
          {HINGLISH_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                onSearchInputChange(example);
                onRunSearch(example);
              }}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap shrink-0 border ${
                searchResult?.query === example
                  ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                  : "bg-[#141414] border-white/[0.07] text-zinc-400 hover:text-zinc-200 hover:border-white/15"
              }`}
            >
              {example}
            </button>
          ))}
        </div>

        {/* Active Search Banner or Error */}
        {searchResult && (
          <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#141414] border border-white/[0.08] text-xs">
            <div className="min-w-0">
              <span className="text-zinc-400">Intent: </span>
              <span className="text-zinc-100 font-medium">
                {searchResult.interpretedIntent}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearSearch}
              className="text-zinc-400 hover:text-white underline whitespace-nowrap shrink-0"
            >
              Reset
            </button>
          </div>
        )}

        {searchError && (
          <div
            role="alert"
            className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300"
          >
            {searchError}
          </div>
        )}

        {/* Segmented AI Score Filter Tabs */}
        <div
          className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#121212] border border-white/[0.06]"
          role="tablist"
          aria-label="Filter emails by AI priority score"
        >
          {(
            [
              { id: "all", label: "All", count: counts.all },
              { id: "focus", label: "Focus 90+", count: counts.focus },
              { id: "normal", label: "50–89", count: counts.normal },
              { id: "low", label: "Low <50", count: counts.low },
            ] as const
          ).map((tab) => {
            const active = scoreFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onScoreFilterChange(tab.id)}
                className={`min-h-[38px] px-1 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-colors flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 leading-tight whitespace-nowrap ${
                  active
                    ? "bg-[#202020] text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono tabular-nums text-[10px] sm:text-[11px] text-zinc-500">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Email Rows */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${sectionTitle}-${scoreFilter}-${isAutoSorted ? "sorted" : "default"}-${searchResult?.query ?? "all"}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 lg:overflow-y-auto divide-y divide-white/[0.06] pb-4"
        >
          {emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-6 py-16">
              <div className="w-11 h-11 rounded-xl bg-[#141414] border border-white/[0.08] flex items-center justify-center mb-3">
                <InboxIcon className="w-5 h-5 text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-200">
                No matching emails
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[26ch]">
                {searchResult
                  ? "Try another Hinglish phrase or clear your search filter."
                  : "Nothing in this view right now."}
              </p>
              {(searchResult || scoreFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    onClearSearch();
                    onScoreFilterChange("all");
                  }}
                  className="mt-4 min-h-[40px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors"
                >
                  Show All Emails
                </button>
              )}
            </div>
          ) : (
            emails.map((email, index) => {
              const isSelected = email.id === selectedEmailId;
              const scoreColor = getScoreTextColor(email.aiScore);
              const barColor = getScoreBarColor(email.aiScore);
              const scoreLabel = getScoreLabel(email.aiScore);
              const bucket = getSortBucket(email);
              const bucketLabel = getSortBucketLabel(bucket);
              const matchReason = matchReasonMap.get(email.id);
              const isVip = vipEmailSet.has(email.senderEmail.toLowerCase());
              const initials =
                email.senderInitials ||
                email.senderName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

              return (
                <motion.div
                  layout
                  key={email.id}
                  initial={isAutoSorted ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: isAutoSorted ? Math.min(index * 0.02, 0.2) : 0,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() => onSelectEmail(email.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectEmail(email.id);
                    }
                  }}
                  className={`w-full text-left px-4 py-3.5 cursor-pointer transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/60 ${
                    isSelected ? "bg-[#161616]" : "hover:bg-[#111111]"
                  }`}
                >
                  {/* Row 1: Avatar with Initials + Full Sender Name + Star + Score + Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                          email.aiScore >= 90
                            ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                            : email.aiScore >= 50
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                            : "bg-[#191919] border-white/10 text-zinc-300"
                        }`}
                        aria-hidden="true"
                      >
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-sm leading-tight break-words ${
                              !email.isRead
                                ? "font-semibold text-white"
                                : "font-medium text-zinc-200"
                            }`}
                          >
                            {email.senderName}
                          </span>
                          {isVip && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold text-amber-400 shrink-0">
                              <Crown className="w-3 h-3" />
                              <span>VIP</span>
                            </span>
                          )}
                          {!email.isRead && (
                            <span className="text-[11px] font-medium text-emerald-400 shrink-0">
                              · New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Star + AI Score + Timestamp */}
                    <div className="flex items-center justify-between sm:justify-end gap-1.5 pl-10.5 sm:pl-0 shrink-0 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => onToggleStar(email.id, e)}
                          aria-label={
                            email.isStarred ? "Unstar email" : "Star email"
                          }
                          className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-zinc-500 hover:text-amber-400 transition-colors shrink-0"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              email.isStarred
                                ? "fill-amber-400 text-amber-400"
                                : ""
                            }`}
                          />
                        </button>
                        <div className="flex items-center gap-1 font-mono tabular-nums text-xs">
                          <span
                            className={`w-1.5 h-3 rounded-xs ${barColor}`}
                            aria-hidden="true"
                          />
                          <span className={`font-semibold ${scoreColor}`}>
                            {email.aiScore}
                          </span>
                          <span className="text-zinc-600" aria-hidden="true">
                            ·
                          </span>
                          <span
                            className={`text-[11px] font-sans ${
                              isAutoSorted
                                ? getBucketTextColor(bucket)
                                : scoreColor
                            }`}
                          >
                            {isAutoSorted ? bucketLabel : scoreLabel}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                        {email.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Subject */}
                  <p
                    className={`mt-1.5 sm:pl-10.5 text-sm leading-snug line-clamp-2 sm:line-clamp-1 ${
                      !email.isRead
                        ? "text-zinc-100 font-medium"
                        : "text-zinc-300"
                    }`}
                  >
                    {email.subject}
                  </p>

                  {/* Row 3: Snippet or Hinglish Match Reason */}
                  <p className="mt-0.5 sm:pl-10.5 text-xs text-zinc-500 line-clamp-1">
                    {matchReason ? (
                      <span className="text-emerald-400/90">
                        Match: {matchReason}
                      </span>
                    ) : (
                      email.snippet
                    )}
                  </p>

                  {/* Row 4: Quick Actions (Star, Archive, Snooze, Delete) */}
                  <div className="mt-2 sm:pl-10.5 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => onToggleStar(email.id, e)}
                        title="Star"
                        className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors inline-flex items-center gap-1 ${
                          email.isStarred
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                            : "bg-[#141414] border-white/[0.06] text-zinc-400 hover:text-amber-300"
                        }`}
                      >
                        <Star
                          className={`w-3 h-3 ${
                            email.isStarred ? "fill-amber-400 text-amber-400" : ""
                          }`}
                        />
                        <span>Star</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveEmail(email.id);
                        }}
                        title="Archive"
                        className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#141414] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Archive</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSnoozeEmail(email, "Tomorrow 9:00 AM");
                        }}
                        title="Snooze until tomorrow"
                        className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#141414] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <AlarmClock className="w-3 h-3" />
                        <span>Snooze</span>
                      </button>

                      <button
                        type="button"
                        disabled={activeRole === "Viewer"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEmail(email.id);
                        }}
                        title={
                          activeRole === "Viewer"
                            ? "Viewer role cannot delete"
                            : "Delete"
                        }
                        className="px-2 py-1 rounded-md text-[11px] font-medium bg-[#141414] border border-white/[0.06] text-zinc-400 hover:text-red-300 transition-colors inline-flex items-center gap-1 disabled:opacity-35"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>

                    {email.draftStatus !== "pending" && (
                      <span className="text-[11px] font-medium text-zinc-400">
                        {email.draftStatus === "approved" && (
                          <span className="text-emerald-400">
                            Reply approved · Ready to send
                          </span>
                        )}
                        {email.draftStatus === "sent" && (
                          <span className="text-emerald-400">
                            Sent {email.sentAt ? `at ${email.sentAt}` : ""}
                          </span>
                        )}
                        {email.draftStatus === "rejected" && (
                          <span className="text-zinc-500">AI draft rejected</span>
                        )}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
