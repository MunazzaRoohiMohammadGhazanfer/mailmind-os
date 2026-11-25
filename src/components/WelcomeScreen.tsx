import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Bot, Mic, ShieldCheck, Sparkles, LogIn } from "lucide-react";
import { MailMindLogo } from "./MailMindLogo";

interface WelcomeScreenProps {
  isOpen: boolean;
  onEnterDemo: () => void;
  onOpenConnect: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isOpen,
  onEnterDemo,
  onOpenConnect,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="welcome-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-[#0A0A0A]/98 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 15%, rgba(16,185,129,0.14), transparent 55%)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#111111] border border-white/10 shadow-2xl p-5 sm:p-8 space-y-6 my-auto">
            {/* Logo + Privacy Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="inline-flex items-center gap-2.5">
                <MailMindLogo className="w-9 h-9 shrink-0" />
                <span className="text-base font-bold tracking-tight text-white">
                  MailMind OS
                </span>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                Demo Mode | No Real Data | Privacy Safe
              </span>
            </div>

            {/* Hero */}
            <div className="space-y-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/10 text-xs font-medium text-zinc-200">
                AI Full Stack Developer Demo Project
              </span>
              <h1
                id="welcome-title"
                className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug"
              >
                MailMind OS — The AI Email Operating System
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Explore 14 autonomous AI agents, 0–100 Focus triage, bilingual
                Hinglish & voice search, Daily Digest action items, and
                human-in-the-loop reply approval using safe sample data.
              </p>
            </div>

            {/* Key Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] space-y-1">
                <Bot className="w-4 h-4 text-emerald-400" />
                <p className="font-semibold text-white">14 AI Agents</p>
                <p className="text-[11px] text-zinc-400">
                  Triage, VIP, Snooze & Scheduler
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] space-y-1">
                <Mic className="w-4 h-4 text-emerald-400" />
                <p className="font-semibold text-white">Voice & Hinglish</p>
                <p className="text-[11px] text-zinc-400">
                  Speak or search naturally
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#161616] border border-white/[0.06] space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <p className="font-semibold text-white">Zero Auto-Send</p>
                <p className="text-[11px] text-zinc-400">
                  Approve every reply safely
                </p>
              </div>
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onEnterDemo}
                className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Try Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onEnterDemo();
                  onOpenConnect();
                }}
                className="min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 bg-[#161616] text-xs sm:text-sm font-medium text-zinc-200 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Demo Sign-In</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
              Inspired by Gmail and Gemini. Not affiliated with or endorsed by
              Google LLC. Uses demo sample data only.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
