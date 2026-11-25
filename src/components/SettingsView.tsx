import React, { useState } from "react";
import { ArrowLeft, Trash2, Moon, Globe } from "lucide-react";
import { FOURTEEN_AGENTS } from "../data/agents";
import type { LanguageCode } from "../types/email";

interface SettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  language: LanguageCode;
  onChangeLanguage: (lang: LanguageCode) => void;
  agentsEnabled: Record<string, boolean>;
  onToggleAgent: (agentId: string) => void;
  onDeleteMyData: () => void;
  onBackToInbox: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  onToggleDarkMode,
  language,
  onChangeLanguage,
  agentsEnabled,
  onToggleAgent,
  onDeleteMyData,
  onBackToInbox,
}) => {
  const [confirmWipe, setConfirmWipe] = useState(false);

  return (
    <section
      className="flex flex-col lg:h-full bg-[#0A0A0A] lg:overflow-hidden"
      aria-label="Workspace Settings"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBackToInbox}
            className="lg:hidden min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-zinc-300 hover:bg-white/5"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
              Settings
            </h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              Preferences and 14 Agent controls saved to Firestore userSettings.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 sm:px-6 py-5 pb-6 space-y-6 max-w-4xl">
        {/* Theme & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-zinc-300" />
              <div>
                <p className="text-sm font-semibold text-white">
                  True Dark Mode
                </p>
                <p className="text-xs text-zinc-400">#0A0A0A Obsidian Canvas</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={darkMode}
              onClick={onToggleDarkMode}
              className={`min-h-[34px] px-3.5 rounded-lg text-xs font-semibold ${
                darkMode
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-[#1A1A1A] text-zinc-400 border border-white/10"
              }`}
            >
              {darkMode ? "ON" : "OFF"}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-zinc-300" />
              <div>
                <p className="text-sm font-semibold text-white">Language</p>
                <p className="text-xs text-zinc-400">Hindi / English UI</p>
              </div>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#181818] border border-white/[0.07]">
              <button
                type="button"
                onClick={() => onChangeLanguage("en")}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  language === "en"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onChangeLanguage("hi")}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  language === "hi"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* 14 Agents ON/OFF */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3">
          <h2 className="text-sm font-semibold text-white">
            14 Agents ON / OFF
          </h2>
          <div className="divide-y divide-white/[0.06]">
            {FOURTEEN_AGENTS.map((agent) => {
              const enabled = agentsEnabled[agent.id] !== false;
              return (
                <div
                  key={agent.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {agent.name}
                    </p>
                    <p className="text-xs text-zinc-500">{agent.role}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => onToggleAgent(agent.id)}
                    className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold ${
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

        {/* Delete My Data */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-red-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-red-300">
              Delete My Data
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Removes scheduled emails, VIP senders, snoozed items, and saved
              preferences from Firestore and local storage.
            </p>
          </div>
          {confirmWipe ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="min-h-[40px] px-3.5 rounded-xl border border-white/10 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMyData();
                  setConfirmWipe(false);
                }}
                className="min-h-[40px] px-4 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white"
              >
                Confirm Delete
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmWipe(true)}
              className="min-h-[42px] px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete My Data</span>
            </button>
          )}
        </div>

        {/* About Section */}
        <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-1">
          <h2 className="text-sm font-semibold text-white">
            About This Project — MailMind OS
          </h2>
          <p className="text-xs text-zinc-400">
            AI Full Stack Developer Demo Project inspired by Gmail. Not
            affiliated with or endorsed by Google LLC. Uses demo sample data
            only, no real user emails.
          </p>
        </div>
      </div>
    </section>
  );
};
