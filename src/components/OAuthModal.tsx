import React, { useState, useEffect } from "react";
import { ShieldCheck, Check, X, ArrowRight, RefreshCw } from "lucide-react";
import { MailMindLogo } from "./MailMindLogo";
import type { ConnectedAccount } from "../types/email";

interface OAuthModalProps {
  isOpen: boolean;
  connectedAccount: ConnectedAccount | null;
  onClose: () => void;
  onConnect: (account: ConnectedAccount) => void;
  onDisconnect: () => void;
}

const PRESET_ACCOUNTS = [
  {
    name: "Munazza Ruhi",
    email: "munazzaruhi12@gmail.com",
    initials: "MR",
  },
  {
    name: "Munazza Work",
    email: "munazza.dev@gmail.com",
    initials: "MW",
  },
];

export const OAuthModal: React.FC<OAuthModalProps> = ({
  isOpen,
  connectedAccount,
  onClose,
  onConnect,
  onDisconnect,
}) => {
  const [step, setStep] = useState<"choose" | "consent">(
    connectedAccount ? "consent" : "choose"
  );
  const [selectedEmail, setSelectedEmail] = useState(
    connectedAccount?.email || PRESET_ACCOUNTS[0].email
  );
  const [selectedName, setSelectedName] = useState(
    connectedAccount?.name || PRESET_ACCOUNTS[0].name
  );
  const [customEmail, setCustomEmail] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(connectedAccount ? "consent" : "choose");
      if (connectedAccount) {
        setSelectedEmail(connectedAccount.email);
        setSelectedName(connectedAccount.name);
      }
    }
  }, [isOpen, connectedAccount]);

  if (!isOpen) return null;

  const handleSelectAccount = (name: string, email: string) => {
    setSelectedName(name);
    setSelectedEmail(email);
    setStep("consent");
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customEmail.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    const inferredName = trimmed.split("@")[0].replace(/[._]/g, " ");
    const formattedName = inferredName
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
    setSelectedName(formattedName || "Demo User");
    setSelectedEmail(trimmed);
    setStep("consent");
  };

  const handleAuthorize = () => {
    setIsConnecting(true);
    setTimeout(() => {
      onConnect({
        uid: "demo",
        email: selectedEmail,
        name: selectedName,
        connectedAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        provider: "demo",
      });
      setIsConnecting(false);
      onClose();
    }, 650);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oauth-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#121212] border border-white/10 shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <MailMindLogo className="w-6 h-6 shrink-0" />
            <span className="text-sm font-medium text-zinc-200">
              MailMind OS Account Sign-In
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close sign-in modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {connectedAccount ? (
            <div className="space-y-5">
              <div>
                <h2
                  id="oauth-title"
                  className="text-lg font-semibold text-white"
                >
                  Demo Account Connected
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Demo OAuth session active. Inbox scoring and AI drafting run
                  with human approval required.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#181818] border border-white/[0.08]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-sm font-semibold text-emerald-400 shrink-0">
                    {connectedAccount.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {connectedAccount.name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {connectedAccount.email} · Synced at{" "}
                      {connectedAccount.connectedAt}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-400 shrink-0 ml-2">
                  Active
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("choose");
                    onDisconnect();
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Disconnect Account
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : step === "choose" ? (
            <div className="space-y-5">
              <div>
                <h2
                  id="oauth-title"
                  className="text-lg font-semibold text-white"
                >
                  Choose an account
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  to continue to{" "}
                  <span className="text-zinc-200 font-medium">MailMind OS</span>
                </p>
              </div>

              <div className="divide-y divide-white/[0.07] border border-white/[0.08] rounded-xl overflow-hidden bg-[#161616]">
                {PRESET_ACCOUNTS.map((acct) => (
                  <button
                    key={acct.email}
                    type="button"
                    onClick={() => handleSelectAccount(acct.name, acct.email)}
                    className="w-full min-h-[56px] flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0">
                        {acct.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {acct.name}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {acct.email}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-colors shrink-0" />
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustomSubmit} className="space-y-2.5">
                <label
                  htmlFor="custom-gmail"
                  className="block text-xs font-medium text-zinc-400"
                >
                  Or enter a demo email account
                </label>
                <div className="flex gap-2">
                  <input
                    id="custom-gmail"
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#181818] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-4 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2
                  id="oauth-title"
                  className="text-lg font-semibold text-white"
                >
                  MailMind OS wants demo access
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Account:{" "}
                  <span className="text-zinc-200 font-medium">
                    {selectedEmail}
                  </span>
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-[#161616] border border-white/[0.08]">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      Read & score incoming messages
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Compute 0–100 Focus priority and 2-line summaries.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      Create reply drafts (human approval required)
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Drafts are never sent automatically without your click.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      Manage unsubscribe headers & cleanup
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Detect recurring newsletters for one-click removal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  OAuth demo mode · Sample inbox loaded locally with Gemini AI
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("choose")}
                  disabled={isConnecting}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleAuthorize}
                  disabled={isConnecting}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Syncing Inbox...</span>
                    </>
                  ) : (
                    <span>Allow & Sync Inbox</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
