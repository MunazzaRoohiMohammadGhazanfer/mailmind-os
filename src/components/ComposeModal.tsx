import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, Send, Loader2, Clock, FileText } from "lucide-react";
import type { TeamRole } from "../types/email";

export interface ComposePrefill {
  to: string;
  subject: string;
  body: string;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: TeamRole;
  prefill?: ComposePrefill | null;
  onSendNewEmail: (payload: {
    to: string;
    subject: string;
    body: string;
  }) => void;
  onScheduleEmail: (payload: {
    to: string;
    subject: string;
    body: string;
    scheduleTime: string;
  }) => Promise<boolean>;
  onAiDraftSuccess?: () => void;
}

const SCHEDULE_PRESETS = [
  "Tomorrow 9:00 AM",
  "Today 6:00 PM",
  "Monday 10:00 AM",
];

interface ReplyTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const REPLY_TEMPLATES: ReplyTemplate[] = [
  {
    id: "interview",
    name: "Interview Reply",
    subject: "Re: Interview Availability & Confirmation",
    body: `Hi Team,\n\nThank you for reaching out and sharing the interview details. I confirm my availability for the proposed time slot and look forward to speaking with the panel.\n\nPlease let me know if any prep materials are needed ahead of our conversation.\n\nBest regards,\nMunazza`,
  },
  {
    id: "thank-you",
    name: "Thank You",
    subject: "Thank you for your time today",
    body: `Hi,\n\nThank you so much for taking the time to connect today. I truly appreciated our discussion and the insights shared.\n\nLooking forward to staying in touch.\n\nWarm regards,\nMunazza`,
  },
  {
    id: "follow-up",
    name: "Follow-up",
    subject: "Quick follow-up on our previous thread",
    body: `Hi,\n\nI wanted to gently follow up on my earlier note and check if you need any additional information from my side to move things forward.\n\nHappy to jump on a brief call whenever convenient.\n\nBest regards,\nMunazza`,
  },
  {
    id: "invoice",
    name: "Invoice Reply",
    subject: "Invoice Attached & Payment Confirmation",
    body: `Hi Finance Team,\n\nPlease find the updated invoice attached along with our NEFT/bank details for this cycle's payout.\n\nKindly confirm once it is queued in the payment batch.\n\nBest regards,\nMunazza`,
  },
  {
    id: "leave",
    name: "Leave Request",
    subject: "Leave Request — Upcoming Dates",
    body: `Hi,\n\nI would like to request planned time off for [Dates]. All active tasks and handoffs are documented and covered before I sign off.\n\nPlease let me know if this works with the team schedule.\n\nThanks,\nMunazza`,
  },
];

export const ComposeModal: React.FC<ComposeModalProps> = ({
  isOpen,
  onClose,
  activeRole,
  prefill = null,
  onSendNewEmail,
  onScheduleEmail,
  onAiDraftSuccess,
}) => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduleTime, setScheduleTime] = useState(SCHEDULE_PRESETS[0]);
  const [aiNotes, setAiNotes] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const scheduleClickTimestamps = useRef<number[]>([]);

  useEffect(() => {
    if (isOpen && prefill) {
      setTo(prefill.to);
      setSubject(prefill.subject);
      setBody(prefill.body);
      setValidationError(null);
      setAiError(null);
    }
  }, [isOpen, prefill]);

  if (!isOpen) return null;

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const validateFields = (): boolean => {
    if (!isValidEmail(to)) {
      setValidationError("Please enter a valid recipient email address.");
      return false;
    }
    if (!subject.trim()) {
      setValidationError("Subject cannot be empty.");
      return false;
    }
    if (!body.trim()) {
      setValidationError("Message body cannot be empty.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleApplyTemplate = (tpl: ReplyTemplate) => {
    if (!subject.trim()) {
      setSubject(tpl.subject);
    }
    setBody(tpl.body);
    setShowTemplates(false);
    setValidationError(null);
  };

  const handleGeminiDraft = async () => {
    const promptText =
      aiNotes.trim() ||
      (subject.trim() ? `Draft a reply for subject: ${subject}` : "");
    if (!promptText) {
      setAiError("Enter brief notes or a subject to run AI Draft Reply.");
      return;
    }
    setIsDrafting(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: to,
          subject,
          prompt: promptText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI draft.");
      }
      if (data.subject && !subject.trim()) {
        setSubject(data.subject);
      }
      if (data.body) {
        setBody(data.body);
      }
      onAiDraftSuccess?.();
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : "Unable to reach Gemini AI."
      );
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFields()) return;
    onSendNewEmail({
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
    });
    setTo("");
    setSubject("");
    setBody("");
    setAiNotes("");
    setValidationError(null);
    onClose();
  };

  const handleScheduleSend = async () => {
    const now = Date.now();
    const recent = scheduleClickTimestamps.current.filter(
      (ts) => now - ts < 10_000
    );
    recent.push(now);
    scheduleClickTimestamps.current = recent;

    if (recent.length >= 5) {
      setValidationError("Too many requests, wait 10s");
      return;
    }

    if (activeRole === "Viewer") {
      setValidationError("Viewer role cannot schedule emails.");
      return;
    }

    if (!validateFields()) return;

    setIsScheduling(true);
    const ok = await onScheduleEmail({
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
      scheduleTime,
    });
    setIsScheduling(false);

    if (ok) {
      setTo("");
      setSubject("");
      setBody("");
      setAiNotes("");
      setValidationError(null);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-title"
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#121212] border border-white/10 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] shrink-0">
          <h2 id="compose-title" className="text-sm font-semibold text-white">
            New Message & Scheduler Agent
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className={`min-h-[36px] px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                showTemplates
                  ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                  : "border-white/10 text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close compose modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSendNow}
          noValidate
          className="p-5 space-y-4 overflow-y-auto"
        >
          {/* Reply Templates Picker */}
          {showTemplates && (
            <div className="p-3 rounded-xl bg-[#171717] border border-white/[0.08] space-y-2">
              <p className="text-xs font-medium text-zinc-300">
                One-Click Reply Templates
              </p>
              <div className="flex flex-wrap gap-1.5">
                {REPLY_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-3 py-1.5 rounded-lg bg-[#0E0E0E] border border-white/10 hover:border-emerald-500/40 hover:text-emerald-300 text-xs font-medium text-zinc-200 transition-colors"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Assist Bar */}
          <div className="p-3 rounded-xl bg-[#171717] border border-white/[0.07] space-y-2">
            <label
              htmlFor="compose-ai-notes"
              className="text-xs font-medium text-zinc-300 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compose Assist Agent (Gemini AI)</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="compose-ai-notes"
                type="text"
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                placeholder='e.g. "Ask Ananya if we can move Thursday interview to 4pm"'
                className="w-full sm:flex-1 min-h-[40px] px-3 rounded-lg bg-[#0A0A0A] border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
              />
              <button
                type="button"
                onClick={handleGeminiDraft}
                disabled={isDrafting}
                className="min-h-[40px] px-3.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-40"
              >
                {isDrafting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>AI Draft Reply</span>
              </button>
            </div>
            {aiError && <p className="text-xs text-red-400">{aiError}</p>}
          </div>

          <div className="space-y-3">
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="To (e.g. ananya.deshmukh@razorpay.com)"
              aria-label="Recipient email"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
            />
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              aria-label="Email subject"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
            />
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              aria-label="Email message body"
              className="w-full p-3.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25 resize-y"
            />
          </div>

          {/* Schedule Time Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#161616] border border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Schedule slot:</span>
            </div>
            <select
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              aria-label="Schedule send time"
              className="min-h-[36px] px-3 rounded-lg bg-[#0A0A0A] border border-white/10 text-xs text-white focus:outline-none"
            >
              {SCHEDULE_PRESETS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {validationError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-xs font-medium text-red-300"
            >
              {validationError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleScheduleSend}
              disabled={isScheduling || activeRole === "Viewer"}
              title={
                activeRole === "Viewer"
                  ? "Viewer role cannot Schedule"
                  : "Save to Firestore scheduledEmails"
              }
              className="min-h-[44px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-40"
            >
              {isScheduling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>Schedule Send</span>
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
