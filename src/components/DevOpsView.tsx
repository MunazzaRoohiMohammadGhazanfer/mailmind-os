import React, { useState } from "react";
import {
  GitBranch,
  CheckCircle2,
  Rocket,
  Code2,
  ArrowLeft,
  X,
} from "lucide-react";

interface DevOpsViewProps {
  onBackToInbox: () => void;
}

export const DevOpsView: React.FC<DevOpsViewProps> = ({ onBackToInbox }) => {
  const [showCodeModal, setShowCodeModal] = useState(false);

  return (
    <section
      className="flex flex-col lg:h-full bg-[#0A0A0A] lg:overflow-hidden"
      aria-label="DevOps CI/CD Pipeline"
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
              DevOps & Hosting Pipeline
            </h1>
            <p className="mt-0.5 text-xs text-zinc-400 font-mono">
              Last Deploy: Today · Commit: "Added 14 Agents"
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCodeModal(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Code2 className="w-4 h-4" />
          <span>View Code on GitHub</span>
        </button>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 sm:px-6 py-6 pb-6 space-y-6">
        {/* Pipeline Stages */}
        <div className="p-5 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-white">
              Production Release Pipeline
            </h2>
            <span className="text-xs font-mono text-emerald-400">
              All Checks Green
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#161616] border border-white/[0.07] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                <GitBranch className="w-4 h-4 text-zinc-200" />
                <span>Stage 01 · Source</span>
              </div>
              <p className="text-base font-semibold text-white">GitHub main</p>
              <p className="text-xs text-zinc-400">
                Commit: "Added 14 Agents"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161616] border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Stage 02 · CI Build</span>
              </div>
              <p className="text-base font-semibold text-emerald-400">
                Build Passed
              </p>
              <p className="text-xs text-zinc-400">
                TypeScript + Vite PWA + Firestore Rules
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161616] border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Rocket className="w-4 h-4" />
                <span>Stage 03 · Hosting</span>
              </div>
              <p className="text-base font-semibold text-white">
                Deploy Firebase Hosting Live
              </p>
              <p className="text-xs text-zinc-400">
                Last Deploy: Today · SSL Edge CDN
              </p>
            </div>
          </div>
        </div>

        {/* Hosting & API Surface Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-2.5">
            <h3 className="text-sm font-semibold text-white">
              Firebase Hosting Config
            </h3>
            <pre className="p-3 rounded-xl bg-[#0A0A0A] border border-white/[0.06] text-xs font-mono text-zinc-300 overflow-x-auto">
{`{
  "firestore": { "rules": "firestore.rules" },
  "hosting": {
    "public": "dist",
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}`}
            </pre>
          </div>

          <div className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-2.5">
            <h3 className="text-sm font-semibold text-white">
              Backend Endpoints Deployed
            </h3>
            <ul className="space-y-2 text-xs font-mono text-zinc-300">
              <li className="p-2.5 rounded-xl bg-[#0A0A0A] border border-white/[0.06] flex items-center justify-between">
                <span>POST /api/scoreEmail</span>
                <span className="text-emerald-400">200 OK</span>
              </li>
              <li className="p-2.5 rounded-xl bg-[#0A0A0A] border border-white/[0.06] flex items-center justify-between">
                <span>POST /api/summarize</span>
                <span className="text-emerald-400">200 OK</span>
              </li>
              <li className="p-2.5 rounded-xl bg-[#0A0A0A] border border-white/[0.06] flex items-center justify-between">
                <span>POST /api/sendScheduled</span>
                <span className="text-emerald-400">Rate Limited</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showCodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#121212] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Repository Snapshot — main
              </h3>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white"
                aria-label="Close repository modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0A0A0A] border border-white/[0.07] font-mono text-xs text-zinc-300 space-y-1.5">
              <p className="text-emerald-400">
                commit 8f3a91c (HEAD -&gt; main)
              </p>
              <p>Message: "Added 14 Agents"</p>
              <p className="text-zinc-500 pt-1">
                Modified: server.ts, src/firebase.js, firestore.rules,
                firebase.json, src/App.tsx, src/components/AgentsDashboardView.tsx
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCodeModal(false)}
              className="w-full min-h-[42px] rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
