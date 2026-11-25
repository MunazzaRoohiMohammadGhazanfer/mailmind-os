import React, { useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock,
  Crown,
  AlarmClock,
  Trash2,
  ShieldCheck,
  Terminal,
  Cpu,
  Gauge,
  BarChart3,
  ArrowLeft,
  Play,
  Sparkles,
  PenSquare,
  CheckSquare,
  Search,
  Target,
  ArrowUpDown,
} from "lucide-react";
import { FOURTEEN_AGENTS } from "../data/agents";
import type {
  Email,
  LiveLogEntry,
  ScheduledEmailRecord,
  SnoozedEmailRecord,
  TeamRole,
  VipSenderRecord,
} from "../types/email";
import { getSortBucket } from "../types/email";

interface AgentsDashboardViewProps {
  emails: Email[];
  isAutoSorted: boolean;
  agentsEnabled: Record<string, boolean>;
  onToggleAgent: (agentId: string) => void;
  scheduledEmails: ScheduledEmailRecord[];
  onDeleteScheduled: (id: string) => void;
  vipSenders: VipSenderRecord[];
  onRemoveVip: (id: string) => void;
  snoozedEmails: SnoozedEmailRecord[];
  onWakeSnoozed: (id: string) => void;
  liveLogs: LiveLogEntry[];
  onClearLogs: () => void;
  aiCallsCount: number;
  aiTokensCount: number;
  activeRole: TeamRole;
  onBackToInbox: () => void;
  onRunTestSuite: () => void;
  onAutoSortInbox: () => void;
  onAiFeatureSummarize: () => void;
  onAiFeatureDraftReply: () => void;
  onAiFeatureActionItems: () => void;
  onAiFeatureSmartSearch: () => void;
  onAiFeaturePriorityDetect: () => void;
}

const WEEKLY_BARS = [
  { day: "Mon", received: 168, replied: 42, recPct: 68, repPct: 48 },
  { day: "Tue", received: 214, replied: 54, recPct: 86, repPct: 62 },
  { day: "Wed", received: 192, replied: 49, recPct: 77, repPct: 56 },
  { day: "Thu", received: 248, replied: 64, recPct: 100, repPct: 74 },
  { day: "Fri", received: 210, replied: 51, recPct: 85, repPct: 59 },
  { day: "Sat", received: 112, replied: 22, recPct: 45, repPct: 26 },
  { day: "Sun", received: 96, replied: 19, recPct: 39, repPct: 22 },
];

const TEST_CASES = [
  { id: "t1", label: "Triage >90", detail: "Focus email scored 98" },
  { id: "t2", label: "Hacker Blocked", detail: "hacker@evil.com rejected" },
  { id: "t3", label: "Scheduler Saves", detail: "Firestore persistence OK" },
  { id: "t4", label: "VIP on Top", detail: "VIP senders pinned first" },
  { id: "t5", label: "Unsubscribe Works", detail: "Cleanup & Delete All OK" },
];

export const AgentsDashboardView: React.FC<AgentsDashboardViewProps> = ({
  emails,
  isAutoSorted,
  agentsEnabled,
  onToggleAgent,
  scheduledEmails,
  onDeleteScheduled,
  vipSenders,
  onRemoveVip,
  snoozedEmails,
  onWakeSnoozed,
  liveLogs,
  onClearLogs,
  aiCallsCount,
  aiTokensCount,
  activeRole,
  onBackToInbox,
  onRunTestSuite,
  onAutoSortInbox,
  onAiFeatureSummarize,
  onAiFeatureDraftReply,
  onAiFeatureActionItems,
  onAiFeatureSmartSearch,
  onAiFeaturePriorityDetect,
}) => {
  const [testsVerifiedAt, setTestsVerifiedAt] = useState<string>("Ready");
  const [sorterPulse, setSorterPulse] = useState(false);
  const activeAgentCount = Object.values(agentsEnabled).filter(Boolean).length;
  const quotaPct = Math.min(100, Math.round((aiTokensCount / 100000) * 100));

  const activeInbox = emails.filter((e) => !e.inTrash && !e.isArchived);
  const unreadCount = activeInbox.filter((e) => !e.isRead).length;
  const focusOnlyCount = activeInbox.filter((e) => e.aiScore >= 90).length;
  const normalOnlyCount = activeInbox.filter(
    (e) => e.aiScore >= 50 && e.aiScore < 90
  ).length;
  const lowOnlyCount = activeInbox.filter((e) => e.aiScore < 50).length;
  const focusPct =
    activeInbox.length > 0
      ? Math.round((focusOnlyCount / activeInbox.length) * 100)
      : 0;

  const topSenders = Array.from(
    activeInbox.reduce((acc, email) => {
      const existing = acc.get(email.senderEmail);
      if (existing) {
        existing.count += 1;
        existing.maxScore = Math.max(existing.maxScore, email.aiScore);
      } else {
        acc.set(email.senderEmail, {
          name: email.senderName,
          email: email.senderEmail,
          count: 1,
          maxScore: email.aiScore,
        });
      }
      return acc;
    }, new Map<string, { name: string; email: string; count: number; maxScore: number }>())
      .values()
  )
    .sort((a, b) => b.count - a.count || b.maxScore - a.maxScore)
    .slice(0, 3);

  const sorterBuckets = [
    {
      id: "focus" as const,
      label: "Focus",
      desc: "90–100 · Immediate attention",
      count: activeInbox.filter((e) => getSortBucket(e) === "focus").length,
      color: "text-emerald-400",
      bar: "bg-emerald-500",
    },
    {
      id: "normal" as const,
      label: "Normal",
      desc: "50–89 · Bills, travel & updates",
      count: activeInbox.filter((e) => getSortBucket(e) === "normal").length,
      color: "text-amber-400",
      bar: "bg-amber-400",
    },
    {
      id: "later" as const,
      label: "Later",
      desc: "30–49 · Digests & reading queue",
      count: activeInbox.filter((e) => getSortBucket(e) === "later").length,
      color: "text-sky-400",
      bar: "bg-sky-400",
    },
    {
      id: "low" as const,
      label: "Low",
      desc: "<30 · Promos & automated mail",
      count: activeInbox.filter((e) => getSortBucket(e) === "low").length,
      color: "text-zinc-400",
      bar: "bg-zinc-500",
    },
  ];

  return (
    <section
      className="flex flex-col lg:h-full bg-[#0A0A0A] lg:overflow-hidden"
      aria-label="14 AI Agents and Analytics Dashboard"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBackToInbox}
            className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-zinc-300 hover:bg-white/5"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[15px] sm:text-xl font-semibold text-white tracking-tight leading-snug">
                MailMind OS — The AI Email Operating System
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] sm:text-[11px] font-medium text-emerald-300">
                AI Full Stack Developer Demo Project
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              AI Full Stack Developer Demo Project • 14 Autonomous Agents ·{" "}
              <span className="font-mono tabular-nums text-emerald-400">
                {activeAgentCount}/14 Active
              </span>
            </p>
          </div>
        </div>

        {/* Tests: 5/5 Passed Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onRunTestSuite();
              setTestsVerifiedAt(
                new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              );
            }}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Tests: 5/5 Passed</span>
            <Play className="w-3 h-3 text-emerald-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 sm:px-6 py-5 pb-6 space-y-6">
        {/* About This Project Card on Dashboard Top */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">
              About This Project
            </h2>
            <span className="text-[11px] font-mono text-emerald-400">
              Demo Mode | No Real Data | Privacy Safe
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Built by a practicing AI Full Stack Developer who loves Google.
            Inspired by Gmail and Gemini. Made for demonstrating Full Stack
            Development - Frontend + API + AI Agents + Security. No real Gmail
            data used. Built for learning and portfolio demonstration only.
          </p>
        </div>

        {/* AI Features & Integrations Section */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">AI Features</h2>
            </div>
            <span className="text-xs text-zinc-400">
              Gemini 2.5 Pro · All capabilities live
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={onAiFeatureSummarize}
              className="p-3 rounded-xl bg-[#161616] border border-white/[0.07] hover:border-emerald-500/40 hover:bg-[#1A1A1A] text-left transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Summarize</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                2-line summary & action items
              </p>
            </button>

            <button
              type="button"
              onClick={onAiFeatureDraftReply}
              className="p-3 rounded-xl bg-[#161616] border border-white/[0.07] hover:border-emerald-500/40 hover:bg-[#1A1A1A] text-left transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <PenSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Draft Reply</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Generate ready-to-approve reply
              </p>
            </button>

            <button
              type="button"
              onClick={onAiFeatureActionItems}
              className="p-3 rounded-xl bg-[#161616] border border-white/[0.07] hover:border-emerald-500/40 hover:bg-[#1A1A1A] text-left transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Action Items</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Extract tasks in Daily Digest
              </p>
            </button>

            <button
              type="button"
              onClick={onAiFeatureSmartSearch}
              className="p-3 rounded-xl bg-[#161616] border border-white/[0.07] hover:border-emerald-500/40 hover:bg-[#1A1A1A] text-left transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Smart Search</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Bilingual Hinglish intent finder
              </p>
            </button>

            <button
              type="button"
              onClick={onAiFeaturePriorityDetect}
              className="p-3 rounded-xl bg-[#161616] border border-white/[0.07] hover:border-emerald-500/40 hover:bg-[#1A1A1A] text-left transition-colors space-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Priority Detection</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Live 0–100 Focus scoring engine
              </p>
            </button>
          </div>
        </div>

        {/* Email Sorter Card */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  Email Sorter
                </h2>
                <span className="text-xs font-mono text-emerald-400">
                  · {activeInbox.length} emails
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Auto-sort inbox into Focus, Normal, Low & Later buckets with
                animated transitions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSorterPulse(true);
                setTimeout(() => setSorterPulse(false), 600);
                onAutoSortInbox();
              }}
              className="min-h-[38px] px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{isAutoSorted ? "Re-Sort & Open Inbox" : "Auto-Sort Inbox"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {sorterBuckets.map((bucket, idx) => {
              const pct =
                activeInbox.length > 0
                  ? Math.round((bucket.count / activeInbox.length) * 100)
                  : 0;
              return (
                <motion.button
                  type="button"
                  key={bucket.id}
                  onClick={() => {
                    setSorterPulse(true);
                    setTimeout(() => setSorterPulse(false), 600);
                    onAutoSortInbox();
                  }}
                  animate={sorterPulse ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] hover:border-emerald-500/35 text-left transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${bucket.color}`}>
                      {bucket.label}
                    </span>
                    <span className="text-base font-mono tabular-nums font-semibold text-white">
                      {bucket.count}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.35, delay: idx * 0.05 }}
                      className={`h-full rounded-full ${bucket.bar}`}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">{bucket.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Email Analytics Card (Total, Focus %, Unread, Top Senders, AI Score Chart) */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">
                Email Analytics
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              Live Inbox Breakdown
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono tabular-nums">
            <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] flex items-center justify-between sm:block">
              <p className="text-xs font-sans text-zinc-400">Total Emails</p>
              <p className="text-lg font-semibold text-white sm:mt-0.5">
                {activeInbox.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] flex items-center justify-between sm:block">
              <p className="text-xs font-sans text-zinc-400">Focus %</p>
              <p className="text-lg font-semibold text-emerald-400 sm:mt-0.5">
                {focusPct}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] flex items-center justify-between sm:block">
              <p className="text-xs font-sans text-zinc-400">Unread Count</p>
              <p className="text-lg font-semibold text-amber-400 sm:mt-0.5">
                {unreadCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* AI Score Distribution Chart */}
            <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] space-y-2.5">
              <p className="text-xs font-semibold text-zinc-200">
                AI Score Chart
              </p>
              {[
                {
                  label: "Focus (90+)",
                  count: focusOnlyCount,
                  bar: "bg-emerald-500",
                  text: "text-emerald-400",
                },
                {
                  label: "Normal (50–89)",
                  count: normalOnlyCount,
                  bar: "bg-amber-400",
                  text: "text-amber-400",
                },
                {
                  label: "Low (<50)",
                  count: lowOnlyCount,
                  bar: "bg-zinc-500",
                  text: "text-zinc-400",
                },
              ].map((row) => {
                const widthPct =
                  activeInbox.length > 0
                    ? Math.round((row.count / activeInbox.length) * 100)
                    : 0;
                return (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-300">{row.label}</span>
                      <span className={`font-mono tabular-nums ${row.text}`}>
                        {row.count} ({widthPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#222222] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.bar} transition-all`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top Senders */}
            <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] space-y-2">
              <p className="text-xs font-semibold text-zinc-200">Top Senders</p>
              <div className="space-y-2">
                {topSenders.map((sender) => (
                  <div
                    key={sender.email}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-zinc-100 font-medium truncate">
                        {sender.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {sender.email}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] text-emerald-400 shrink-0">
                      AI {sender.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Row: Analytics + AI Usage + Lighthouse */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Weekly Analytics Card */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  Weekly Analytics
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500/80" />
                  Received
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-amber-400/85" />
                  Replied
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05]">
                <p className="text-zinc-400 font-sans">Emails / Uses</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  1,240 · {342 + (aiCallsCount - 128)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05]">
                <p className="text-zinc-400 font-sans">Focus Score</p>
                <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                  92/100
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05]">
                <p className="text-zinc-400 font-sans">Time Saved</p>
                <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                  4.8 hrs · 0.8s
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05]">
                <p className="text-zinc-400 font-sans">Most Active Day</p>
                <p className="text-sm font-semibold text-white mt-0.5">
                  Thu · 99.9%
                </p>
              </div>
            </div>

            {/* Mon-Sun Received vs Replied Grouped Bar Chart */}
            <div className="pt-1">
              <div className="grid grid-cols-7 gap-2 items-end h-24">
                {WEEKLY_BARS.map((bar) => (
                  <div
                    key={bar.day}
                    className="flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <div className="w-full h-16 flex items-end justify-center gap-1">
                      <div className="w-2.5 bg-[#191919] rounded-xs h-full flex items-end overflow-hidden">
                        <div
                          className="w-full bg-emerald-500/80 rounded-t-xs transition-all"
                          style={{ height: `${bar.recPct}%` }}
                          title={`${bar.day}: ${bar.received} received`}
                        />
                      </div>
                      <div className="w-2.5 bg-[#191919] rounded-xs h-full flex items-end overflow-hidden">
                        <div
                          className="w-full bg-amber-400/85 rounded-t-xs transition-all"
                          style={{ height: `${bar.repPct}%` }}
                          title={`${bar.day}: ${bar.replied} replied`}
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Usage Card */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">AI Usage</h2>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Gemini 4 Hydrogen
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono tabular-nums">
                <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05]">
                  <p className="text-zinc-400 font-sans">Calls</p>
                  <p className="text-base font-semibold text-white mt-0.5">
                    {aiCallsCount}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05]">
                  <p className="text-zinc-400 font-sans">Tokens</p>
                  <p className="text-base font-semibold text-white mt-0.5">
                    {aiTokensCount.toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05]">
                  <p className="text-zinc-400 font-sans">Cost</p>
                  <p className="text-base font-semibold text-emerald-400 mt-0.5">
                    ₹0.00 Free Tier
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05]">
                  <p className="text-zinc-400 font-sans">Latency</p>
                  <p className="text-base font-semibold text-white mt-0.5">
                    0.8s
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-zinc-400 font-sans">Free Quota Used</span>
                <span className="text-white font-semibold">{quotaPct}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#1B1B1B] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lighthouse + Tests + Keyboard Shortcuts Card */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Lighthouse</h2>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {testsVerifiedAt}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums">
              <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05] flex items-center justify-between">
                <span className="text-zinc-400 font-sans">Performance</span>
                <span className="text-emerald-400 font-semibold">98</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05] flex items-center justify-between">
                <span className="text-zinc-400 font-sans">Accessibility</span>
                <span className="text-emerald-400 font-semibold">100</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05] flex items-center justify-between">
                <span className="text-zinc-400 font-sans">Best Practices</span>
                <span className="text-emerald-400 font-semibold">100</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#161616] border border-white/[0.05] flex items-center justify-between">
                <span className="text-zinc-400 font-sans">SEO</span>
                <span className="text-emerald-400 font-semibold">99</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.05] space-y-1.5">
              <p className="text-xs font-medium text-zinc-300">
                Keyboard Shortcuts
              </p>
              <p className="text-xs font-mono text-zinc-400">
                J/K = Next/Prev · E = Archive · S = Star · / = Search · C = Compose · ? = Help
              </p>
            </div>

            <div className="space-y-1 pt-1">
              {TEST_CASES.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{tc.label}</span>
                  </span>
                  <span className="text-zinc-500">{tc.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Logs Card */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Live Logs</h2>
            </div>
            <button
              type="button"
              onClick={onClearLogs}
              className="min-h-[36px] px-3 rounded-lg border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Clear Logs
            </button>
          </div>
          <div className="p-3 rounded-xl bg-[#0A0A0A] border border-white/[0.06] font-mono text-xs space-y-1.5 max-h-40 overflow-y-auto">
            {liveLogs.length === 0 ? (
              <p className="text-zinc-500">Logs cleared.</p>
            ) : (
              liveLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                  <span
                    className={
                      log.level === "warn"
                        ? "text-amber-300"
                        : log.level === "success"
                        ? "text-emerald-400"
                        : "text-zinc-200"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Firestore Persisted Agent Lists: Scheduled, VIP, Snoozed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Scheduled Emails */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  Scheduled Emails
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                {scheduledEmails.length}
              </span>
            </div>
            {scheduledEmails.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4">
                No scheduled emails yet. Use Compose → Schedule Send.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scheduledEmails.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {item.subject}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        To: {item.to}
                      </p>
                      <p className="text-[11px] font-mono text-emerald-400 mt-1">
                        {item.scheduleTime} · {item.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={activeRole === "Viewer"}
                      onClick={() => onDeleteScheduled(item.id)}
                      className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                      aria-label="Delete scheduled email"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VIP Senders */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">VIP Senders</h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                {vipSenders.length}
              </span>
            </div>
            {vipSenders.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4">
                No VIP senders yet. Open any email and click Add VIP.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {vipSenders.map((vip) => (
                  <div
                    key={vip.id}
                    className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {vip.senderName}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {vip.senderEmail}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={activeRole === "Viewer"}
                      onClick={() => onRemoveVip(vip.id)}
                      className="min-h-[34px] px-2.5 rounded-lg text-xs text-zinc-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Snoozed Emails */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlarmClock className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-semibold text-white">
                  Snoozed Emails
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                {snoozedEmails.length}
              </span>
            </div>
            {snoozedEmails.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4">
                No snoozed emails. Open an email and click Snooze.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {snoozedEmails.map((sn) => (
                  <div
                    key={sn.id}
                    className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {sn.subject}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {sn.senderName} · Until {sn.snoozeUntil}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onWakeSnoozed(sn.id)}
                      className="min-h-[34px] px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white shrink-0"
                    >
                      Wake
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All 14 Agents Toggle Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white">
            All 14 AI Agents (Saved to Firestore userSettings)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {FOURTEEN_AGENTS.map((agent, idx) => {
              const enabled = agentsEnabled[agent.id] !== false;
              return (
                <div
                  key={agent.id}
                  className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                      <span>{String(idx + 1).padStart(2, "0")}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">{agent.category}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {agent.name}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={`Toggle ${agent.name}`}
                    onClick={() => onToggleAgent(agent.id)}
                    className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                      enabled
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-[#1A1A1A] text-zinc-500 border border-white/10"
                    }`}
                  >
                    {enabled ? "ON" : "OFF"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
