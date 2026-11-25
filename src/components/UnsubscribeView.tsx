import React, { useState } from "react";
import { MailX, Trash2, Check, Sparkles, ArrowLeft } from "lucide-react";
import type { SubscriptionGroup } from "../types/email";

interface UnsubscribeViewProps {
  subscriptions: SubscriptionGroup[];
  onUnsubscribe: (subscriptionId: string) => void;
  onDeleteSenderEmails: (subscriptionId: string) => void;
  onDeleteAllSubscriptions: () => void;
  onBackToInbox: () => void;
}

export const UnsubscribeView: React.FC<UnsubscribeViewProps> = ({
  subscriptions,
  onUnsubscribe,
  onDeleteSenderEmails,
  onDeleteAllSubscriptions,
  onBackToInbox,
}) => {
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const activeSubs = subscriptions.filter((s) => !s.isUnsubscribed);
  const unsubscribedSubs = subscriptions.filter((s) => s.isUnsubscribed);
  const totalSubscriptionEmails = subscriptions.reduce(
    (sum, s) => sum + s.emailCount,
    0
  );

  return (
    <section
      className="flex flex-col lg:h-full bg-[#0A0A0A] lg:overflow-hidden"
      aria-label="Subscription manager"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBackToInbox}
            className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-zinc-300 hover:bg-white/5 hover:text-white transition-colors shrink-0"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
              Subscriptions & Newsletters
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400 font-mono tabular-nums">
              {activeSubs.length} active{" "}
              {activeSubs.length === 1 ? "subscription" : "subscriptions"} ·{" "}
              {totalSubscriptionEmails}{" "}
              {totalSubscriptionEmails === 1 ? "email" : "emails"} in inbox
            </p>
          </div>
        </div>

        {/* Delete All Action */}
        {subscriptions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {confirmDeleteAll ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAll(false)}
                  className="min-h-[44px] px-3.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAllSubscriptions();
                    setConfirmDeleteAll(false);
                  }}
                  className="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete All ({totalSubscriptionEmails})</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteAll(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-sm font-medium text-red-300 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All ({subscriptions.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 lg:overflow-y-auto px-4 sm:px-6 py-5 pb-6 space-y-6">
        {subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-white/[0.08] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-white">
              Zero subscription clutter
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500 max-w-[34ch]">
              All promotional newsletters and mailing lists have been
              unsubscribed and cleaned up.
            </p>
            <button
              type="button"
              onClick={onBackToInbox}
              className="mt-5 min-h-[44px] px-5 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              Return to Inbox
            </button>
          </div>
        ) : (
          <>
            {activeSubs.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-zinc-400">
                  Active Mailing Lists ({activeSubs.length})
                </h2>

                <div className="border border-white/[0.08] rounded-2xl bg-[#111111] divide-y divide-white/[0.06] overflow-hidden">
                  {activeSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white">
                            {sub.senderName}
                          </span>
                          <span className="text-zinc-600" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-xs font-mono text-zinc-400">
                            {sub.domain}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 truncate">
                          Latest: {sub.latestSubject}
                        </p>

                        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-zinc-500">
                          <span>
                            {sub.emailCount}{" "}
                            {sub.emailCount === 1 ? "email" : "emails"}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Avg AI Score: {sub.averageScore} (Low)</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-sans">{sub.frequency}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onDeleteSenderEmails(sub.id)}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUnsubscribe(sub.id)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <MailX className="w-3.5 h-3.5" />
                          <span>Unsubscribe</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unsubscribedSubs.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-zinc-500">
                  Unsubscribed ({unsubscribedSubs.length})
                </h2>

                <div className="border border-white/[0.06] rounded-2xl bg-[#0E0E0E] divide-y divide-white/[0.05] overflow-hidden">
                  {unsubscribedSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 flex items-center justify-between gap-4 opacity-75"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-300 truncate">
                          {sub.senderName}
                        </p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Unsubscribed · {sub.emailCount}{" "}
                            {sub.emailCount === 1 ? "email" : "emails"} left
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteSenderEmails(sub.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-400 hover:text-red-300 hover:border-red-500/30 transition-colors whitespace-nowrap shrink-0"
                      >
                        Delete Emails
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
