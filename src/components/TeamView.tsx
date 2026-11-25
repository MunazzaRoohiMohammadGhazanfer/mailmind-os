import React, { useState } from "react";
import { UserPlus, Shield, Trash2, ArrowLeft } from "lucide-react";
import type { TeamMemberRecord, TeamRole } from "../types/email";

interface TeamViewProps {
  members: TeamMemberRecord[];
  activeRole: TeamRole;
  onChangeActiveRole: (role: TeamRole) => void;
  onAddMember: (email: string, role: TeamRole) => void;
  onRemoveMember: (id: string) => void;
  onBackToInbox: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  members,
  activeRole,
  onChangeActiveRole,
  onAddMember,
  onRemoveMember,
  onBackToInbox,
}) => {
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<TeamRole>("Viewer");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid team member email.");
      return;
    }
    setError(null);
    onAddMember(trimmed, roleInput);
    setEmailInput("");
  };

  return (
    <section
      className="flex flex-col lg:h-full bg-[#0A0A0A] lg:overflow-hidden"
      aria-label="Team Access Control"
    >
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
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
              Team & Role Access
            </h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              Admin can Schedule & Delete. Viewer has read-only access.
            </p>
          </div>
        </div>

        {/* Active Role Preview Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-400">Preview as:</span>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#141414] border border-white/[0.08]">
            {(["Admin", "Viewer"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeActiveRole(r)}
                className={`min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors ${
                  activeRole === r
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 sm:px-6 py-5 pb-6 space-y-6">
        {activeRole === "Viewer" && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            Viewer Mode active — Schedule Send and Delete actions are locked.
          </div>
        )}

        {/* Add Member Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-2xl bg-[#111111] border border-white/[0.08] space-y-3"
        >
          <h2 className="text-sm font-semibold text-white">Add Team Member</h2>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="teammate@company.com"
              aria-label="Member email"
              className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
            />
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as TeamRole)}
              aria-label="Member role"
              className="min-h-[44px] px-3.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-white focus:outline-none"
            >
              <option value="Admin">Admin</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={activeRole === "Viewer"}
              className="min-h-[44px] px-5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-40"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>

        {/* Member List */}
        <div className="border border-white/[0.08] rounded-2xl bg-[#111111] divide-y divide-white/[0.06] overflow-hidden">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {member.name}
                  </p>
                  <span className="text-zinc-600" aria-hidden="true">
                    ·
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      member.role === "Admin"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {member.email} · Added {member.addedAt}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-500">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {member.role === "Admin" ? "Full Access" : "Read Only"}
                  </span>
                </span>
                {member.id !== "tm-you" && (
                  <button
                    type="button"
                    disabled={activeRole === "Viewer"}
                    onClick={() => onRemoveMember(member.id)}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                    aria-label={`Remove ${member.email}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
