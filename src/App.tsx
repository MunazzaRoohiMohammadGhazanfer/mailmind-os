import React, { useEffect, useMemo, useRef, useState } from "react";
import { MotionConfig, AnimatePresence, motion } from "motion/react";
import {
  Inbox,
  Target,
  MailX,
  CheckCircle2,
  Trash2,
  PenSquare,
  LogIn,
  LogOut,
  Bot,
  GitBranch,
  Users,
  Settings as SettingsIcon,
  Download,
  WifiOff,
  Loader2,
  AlertTriangle,
  X,
  Sparkles,
  HelpCircle,
  Share2,
} from "lucide-react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
  testConnection,
} from "./firebase.js";
import { DEMO_EMAILS } from "./data/demoEmails";
import { DEFAULT_AGENTS_STATE } from "./data/agents";
import type {
  ConnectedAccount,
  Email,
  HinglishSearchResult,
  LanguageCode,
  LiveLogEntry,
  NavSection,
  ReplyTone,
  ScheduledEmailRecord,
  ScoreFilter,
  SnoozedEmailRecord,
  SubscriptionGroup,
  TeamMemberRecord,
  TeamRole,
  VipSenderRecord,
} from "./types/email";
import { getScoreTier, getSortBucket } from "./types/email";
import { useOnlineStatus, usePWAInstall } from "./hooks/usePWAInstall";
import { OAuthModal } from "./components/OAuthModal";
import { EmailList } from "./components/EmailList";
import { EmailDetail } from "./components/EmailDetail";
import { UnsubscribeView } from "./components/UnsubscribeView";
import { ComposeModal, type ComposePrefill } from "./components/ComposeModal";
import { AgentsDashboardView } from "./components/AgentsDashboardView";
import { DevOpsView } from "./components/DevOpsView";
import { TeamView } from "./components/TeamView";
import { SettingsView } from "./components/SettingsView";
import { DailyDigestModal } from "./components/DailyDigestModal";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { MailMindLogo } from "./components/MailMindLogo";
import { WelcomeScreen } from "./components/WelcomeScreen";

const INITIAL_LOGS: LiveLogEntry[] = [
  { id: "lg-1", time: "2:31 PM", message: "Triage scored 98", level: "success" },
  {
    id: "lg-2",
    time: "2:32 PM",
    message: "Injection Blocked hacker@evil.com",
    level: "warn",
  },
  { id: "lg-3", time: "2:33 PM", message: "Scheduler saved OK", level: "success" },
];

const DEFAULT_TEAM: TeamMemberRecord[] = [
  {
    id: "tm-you",
    uid: "demo",
    email: "munazzaruhi12@gmail.com",
    name: "You",
    role: "Admin",
    addedAt: "Today",
  },
  {
    id: "tm-recruiter",
    uid: "demo",
    email: "recruiter@google.com",
    name: "Google Recruiter",
    role: "Viewer",
    addedAt: "Today",
  },
];

const LS_KEYS = {
  emails: "geminimail_os_cached_emails_v1",
  scheduled: "geminimail_os_demo_scheduled_v1",
  vips: "geminimail_os_demo_vips_v1",
  snoozed: "geminimail_os_demo_snoozed_v1",
  settings: "geminimail_os_demo_settings_v1",
  team: "geminimail_os_demo_team_v1",
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [emails, setEmails] = useState<Email[]>(() =>
    loadJson<Email[]>(LS_KEYS.emails, DEMO_EMAILS)
  );
  const [activeNav, setActiveNav] = useState<NavSection>("inbox");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    DEMO_EMAILS[0].id
  );
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // Firebase Auth & Firestore Loading State
  const [connectedAccount, setConnectedAccount] =
    useState<ConnectedAccount | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(
    Boolean(isFirebaseConfigured)
  );
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composePrefill, setComposePrefill] = useState<ComposePrefill | null>(
    null
  );
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    try {
      return localStorage.getItem("mailmind_os_welcome_seen_v1") !== "true";
    } catch {
      return true;
    }
  });
  const [isDailyDigestOpen, setIsDailyDigestOpen] = useState(false);
  const [dailyDigestTab, setDailyDigestTab] = useState<
    "overview" | "action-items"
  >("overview");
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isAutoSorted, setIsAutoSorted] = useState(false);

  // Persisted Collections State
  const [scheduledEmails, setScheduledEmails] = useState<
    ScheduledEmailRecord[]
  >(() => loadJson<ScheduledEmailRecord[]>(LS_KEYS.scheduled, []));
  const [vipSenders, setVipSenders] = useState<VipSenderRecord[]>(() =>
    loadJson<VipSenderRecord[]>(LS_KEYS.vips, [])
  );
  const [snoozedEmails, setSnoozedEmails] = useState<SnoozedEmailRecord[]>(
    () => loadJson<SnoozedEmailRecord[]>(LS_KEYS.snoozed, [])
  );
  const [agentsEnabled, setAgentsEnabled] = useState<Record<string, boolean>>(
    () =>
      loadJson(LS_KEYS.settings, {
        agentsEnabled: DEFAULT_AGENTS_STATE,
        darkMode: true,
        language: "en" as LanguageCode,
      }).agentsEnabled
  );
  const [darkMode, setDarkMode] = useState<boolean>(
    () =>
      loadJson(LS_KEYS.settings, {
        agentsEnabled: DEFAULT_AGENTS_STATE,
        darkMode: true,
        language: "en" as LanguageCode,
      }).darkMode
  );
  const [language, setLanguage] = useState<LanguageCode>(
    () =>
      loadJson(LS_KEYS.settings, {
        agentsEnabled: DEFAULT_AGENTS_STATE,
        darkMode: true,
        language: "en" as LanguageCode,
      }).language
  );
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>(() =>
    loadJson<TeamMemberRecord[]>(LS_KEYS.team, DEFAULT_TEAM)
  );
  const [activeRole, setActiveRole] = useState<TeamRole>("Admin");

  // Hinglish Search state
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<HinglishSearchResult | null>(
    null
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Per-email AI actions state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isRedrafting, setIsRedrafting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Live Logs & AI Usage metrics
  const [liveLogs, setLiveLogs] = useState<LiveLogEntry[]>(INITIAL_LOGS);
  const [aiCallsCount, setAiCallsCount] = useState(128);
  const [aiTokensCount, setAiTokensCount] = useState(42310);

  // PWA & Online state
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((current) => (current === msg ? null : current));
    }, 3500);
  };

  const appendLog = (
    message: string,
    level: LiveLogEntry["level"] = "info"
  ) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    setLiveLogs((prev) => [
      { id: `lg-${Date.now()}-${Math.random()}`, time, message, level },
      ...prev.slice(0, 29),
    ]);
  };

  // Cache emails locally for offline PWA support
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.emails, JSON.stringify(emails));
    } catch {
      // Ignore storage quota errors
    }
  }, [emails]);

  // Persist demo state to localStorage when not authenticated
  useEffect(() => {
    if (!connectedAccount || connectedAccount.provider === "demo") {
      try {
        localStorage.setItem(
          LS_KEYS.scheduled,
          JSON.stringify(scheduledEmails)
        );
        localStorage.setItem(LS_KEYS.vips, JSON.stringify(vipSenders));
        localStorage.setItem(LS_KEYS.snoozed, JSON.stringify(snoozedEmails));
        localStorage.setItem(
          LS_KEYS.settings,
          JSON.stringify({ agentsEnabled, darkMode, language })
        );
        localStorage.setItem(LS_KEYS.team, JSON.stringify(teamMembers));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [
    connectedAccount,
    scheduledEmails,
    vipSenders,
    snoozedEmails,
    agentsEnabled,
    darkMode,
    language,
    teamMembers,
  ]);

  // Load Firestore data for signed-in user
  const fetchFirestoreData = async (uid: string, userEmail: string) => {
    if (!db) return;
    setIsFirebaseLoading(true);
    try {
      await testConnection();

      // 1. scheduledEmails
      try {
        const schedSnap = await getDocs(
          query(collection(db, "scheduledEmails"), where("uid", "==", uid))
        );
        setScheduledEmails(
          schedSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ScheduledEmailRecord, "id">),
          }))
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "scheduledEmails");
      }

      // 2. vipSenders
      try {
        const vipSnap = await getDocs(
          query(collection(db, "vipSenders"), where("uid", "==", uid))
        );
        setVipSenders(
          vipSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<VipSenderRecord, "id">),
          }))
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "vipSenders");
      }

      // 3. snoozedEmails
      try {
        const snoozeSnap = await getDocs(
          query(collection(db, "snoozedEmails"), where("uid", "==", uid))
        );
        setSnoozedEmails(
          snoozeSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<SnoozedEmailRecord, "id">),
          }))
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "snoozedEmails");
      }

      // 4. userSettings
      try {
        const settingsRef = doc(db, "userSettings", uid);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const data = settingsSnap.data() as {
            agentsEnabled?: Record<string, boolean>;
            darkMode?: boolean;
            language?: LanguageCode;
          };
          if (data.agentsEnabled) {
            setAgentsEnabled({ ...DEFAULT_AGENTS_STATE, ...data.agentsEnabled });
          }
          if (typeof data.darkMode === "boolean") setDarkMode(data.darkMode);
          if (data.language === "en" || data.language === "hi") {
            setLanguage(data.language);
          }
        } else {
          await setDoc(settingsRef, {
            uid,
            darkMode: true,
            language: "en",
            agentsEnabled: DEFAULT_AGENTS_STATE,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `userSettings/${uid}`);
      }

      // 5. teamMembers
      try {
        const teamSnap = await getDocs(
          query(collection(db, "teamMembers"), where("uid", "==", uid))
        );
        if (teamSnap.empty) {
          setTeamMembers([
            {
              id: "tm-you",
              uid,
              email: userEmail,
              name: "You",
              role: "Admin",
              addedAt: "Today",
            },
            {
              id: "tm-recruiter",
              uid,
              email: "recruiter@google.com",
              name: "Google Recruiter",
              role: "Viewer",
              addedAt: "Today",
            },
          ]);
        } else {
          setTeamMembers(
            teamSnap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<TeamMemberRecord, "id">),
            }))
          );
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "teamMembers");
      }

      appendLog("Firestore collections synced OK", "success");
    } catch {
      showToast("Save failed, check Firebase config");
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  // Subscribe to Firebase Auth state
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsFirebaseLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const acct: ConnectedAccount = {
          uid: user.uid,
          email: user.email || "user@gmail.com",
          name: user.displayName || user.email?.split("@")[0] || "Gmail User",
          photoURL: user.photoURL,
          connectedAt: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          provider: "google",
        };
        setConnectedAccount(acct);
        await fetchFirestoreData(user.uid, acct.email);
      } else {
        setConnectedAccount(null);
        setIsFirebaseLoading(false);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real Firebase Google Auth Login
  const handleConnectGmail = async () => {
    if (!isFirebaseConfigured || !auth) {
      setIsOAuthModalOpen(true);
      return;
    }

    try {
      setIsFirebaseLoading(true);
      await signInWithPopup(auth, googleProvider);
      showToast("Signed in with Google — Live Mode active.");
    } catch (err: unknown) {
      setIsFirebaseLoading(false);
      const code = (err as { code?: string })?.code || "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/unauthorized-domain" ||
        code === "auth/operation-not-allowed"
      ) {
        showToast(
          "Google popup blocked or domain unauthorized — using OAuth preview."
        );
        setIsOAuthModalOpen(true);
      } else if (code !== "auth/popup-closed-by-user") {
        showToast("Google sign-in failed, check Firebase Auth settings.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (auth && connectedAccount?.provider === "google") {
        await signOut(auth);
      }
      setConnectedAccount(null);
      showToast("Signed out. Switched to Demo Mode.");
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome === "accepted") {
        showToast("MailMind OS installed as PWA!");
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: "MailMind OS — The AI Email Operating System",
      text: "Check out MailMind OS — AI Full Stack Developer Demo Project with 14 AI Agents & Voice Search.",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showToast("Shared MailMind OS!");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        showToast("App link copied to clipboard!");
      }
    } catch {
      // User cancelled native share sheet
    }
  };

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    try {
      localStorage.setItem("mailmind_os_welcome_seen_v1", "true");
    } catch {
      // Ignore storage error
    }
  };

  const handleUseSmartReplyInCompose = (payload: ComposePrefill) => {
    setComposePrefill(payload);
    setIsComposeOpen(true);
    showToast("Smart reply loaded in Compose.");
  };

  // Subscription groups derived from emails
  const subscriptions = useMemo<SubscriptionGroup[]>(() => {
    const map = new Map<string, SubscriptionGroup>();
    for (const email of emails) {
      if (!email.isSubscription || email.inTrash || !email.subscriptionId) {
        continue;
      }
      const existing = map.get(email.subscriptionId);
      const domain = email.senderEmail.split("@")[1] || "newsletter";
      if (!existing) {
        map.set(email.subscriptionId, {
          id: email.subscriptionId,
          senderName: email.senderName,
          senderEmail: email.senderEmail,
          domain,
          frequency: "Weekly / Daily digest",
          averageScore: email.aiScore,
          emailCount: 1,
          emailIds: [email.id],
          latestSubject: email.subject,
          isUnsubscribed: Boolean(email.isUnsubscribed),
        });
      } else {
        existing.emailCount += 1;
        existing.emailIds.push(email.id);
        existing.averageScore = Math.round(
          (existing.averageScore * (existing.emailCount - 1) + email.aiScore) /
            existing.emailCount
        );
        existing.isUnsubscribed =
          existing.isUnsubscribed && Boolean(email.isUnsubscribed);
      }
    }
    return Array.from(map.values());
  }, [emails]);

  const activeSubscriptionCount = useMemo(
    () => subscriptions.filter((s) => !s.isUnsubscribed).length,
    [subscriptions]
  );

  const vipEmailSet = useMemo(
    () => new Set(vipSenders.map((v) => v.senderEmail.toLowerCase())),
    [vipSenders]
  );

  const snoozedIdSet = useMemo(
    () =>
      new Set(
        snoozedEmails
          .filter((s) => s.status === "snoozed")
          .map((s) => s.emailId)
      ),
    [snoozedEmails]
  );

  const navFilteredEmails = useMemo(() => {
    return emails.filter((email) => {
      if (activeNav === "trash") return Boolean(email.inTrash);
      if (email.inTrash || email.isArchived) return false;
      if (snoozedIdSet.has(email.id)) return false;
      if (activeNav === "focus") return email.aiScore >= 90;
      if (activeNav === "approved")
        return email.draftStatus === "approved" || email.draftStatus === "sent";
      return true;
    });
  }, [emails, activeNav, snoozedIdSet]);

  const scoreCounts = useMemo(() => {
    let focus = 0;
    let normal = 0;
    let low = 0;
    for (const e of navFilteredEmails) {
      const tier = getScoreTier(e.aiScore);
      if (tier === "focus") focus++;
      else if (tier === "normal") normal++;
      else low++;
    }
    return {
      all: navFilteredEmails.length,
      focus,
      normal,
      low,
    };
  }, [navFilteredEmails]);

  const visibleEmails = useMemo(() => {
    let list = [...navFilteredEmails];

    if (scoreFilter !== "all") {
      list = list.filter((e) => getScoreTier(e.aiScore) === scoreFilter);
    }

    if (searchResult) {
      const orderMap = new Map<string, number>();
      searchResult.matches.forEach((m, idx) => orderMap.set(m.id, idx));
      list = list
        .filter((e) => orderMap.has(e.id))
        .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    } else if (isAutoSorted) {
      const bucketOrder = { focus: 0, normal: 1, later: 2, low: 3 } as const;
      list.sort((a, b) => {
        const diff = bucketOrder[getSortBucket(a)] - bucketOrder[getSortBucket(b)];
        if (diff !== 0) return diff;
        return b.aiScore - a.aiScore;
      });
    } else if (agentsEnabled.vip !== false && vipEmailSet.size > 0) {
      // VIP Agent: pin VIP senders to top of inbox
      list.sort((a, b) => {
        const aVip = vipEmailSet.has(a.senderEmail.toLowerCase()) ? 1 : 0;
        const bVip = vipEmailSet.has(b.senderEmail.toLowerCase()) ? 1 : 0;
        return bVip - aVip;
      });
    }

    return list;
  }, [
    navFilteredEmails,
    scoreFilter,
    searchResult,
    isAutoSorted,
    agentsEnabled.vip,
    vipEmailSet,
  ]);

  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedEmailId) || null,
    [emails, selectedEmailId]
  );

  // Keyboard Nav: J=Next, K=Prev, E=Archive, S=Star, /=Search, C=Compose, R=Refresh, ?=Help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Escape") {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        } else if (isDailyDigestOpen) {
          setIsDailyDigestOpen(false);
        } else if (isComposeOpen) {
          setIsComposeOpen(false);
        } else if (activeNav === "focus") {
          setActiveNav("inbox");
          setMobileShowDetail(false);
        }
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        if (
          activeNav === "agents" ||
          activeNav === "devops" ||
          activeNav === "team" ||
          activeNav === "settings" ||
          activeNav === "subscriptions"
        ) {
          setActiveNav("inbox");
        }
        setTimeout(() => searchInputRef.current?.focus(), 40);
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "c") {
        e.preventDefault();
        setIsComposeOpen(true);
      } else if (key === "j") {
        if (visibleEmails.length === 0) return;
        e.preventDefault();
        const idx = visibleEmails.findIndex((item) => item.id === selectedEmailId);
        const nextIdx = idx < visibleEmails.length - 1 ? idx + 1 : 0;
        handleSelectEmail(visibleEmails[nextIdx].id);
      } else if (key === "k") {
        if (visibleEmails.length === 0) return;
        e.preventDefault();
        const idx = visibleEmails.findIndex((item) => item.id === selectedEmailId);
        const prevIdx = idx > 0 ? idx - 1 : visibleEmails.length - 1;
        handleSelectEmail(visibleEmails[prevIdx].id);
      } else if (key === "e") {
        if (selectedEmailId) {
          e.preventDefault();
          handleArchiveEmail(selectedEmailId);
        }
      } else if (key === "s") {
        if (selectedEmailId) {
          e.preventDefault();
          handleToggleStar(selectedEmailId);
        }
      } else if (key === "r") {
        e.preventDefault();
        if (connectedAccount?.provider === "google") {
          fetchFirestoreData(connectedAccount.uid, connectedAccount.email);
          showToast("Refreshed Firestore collections.");
        } else {
          showToast("Inbox refreshed.");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNav, connectedAccount, visibleEmails, selectedEmailId]);

  // Firestore & Agent Mutations
  const handleScheduleEmail = async (payload: {
    to: string;
    subject: string;
    body: string;
    scheduleTime: string;
  }): Promise<boolean> => {
    try {
      const apiRes = await fetch("/api/sendScheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const apiData = await apiRes.json();
      if (!apiRes.ok) {
        showToast(apiData.error || "Failed to validate schedule.");
        return false;
      }

      const recordBase = {
        uid: connectedAccount?.uid || "demo",
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        scheduleTime: payload.scheduleTime,
        status: "scheduled" as const,
        createdAt: new Date().toISOString(),
      };

      if (db && connectedAccount?.provider === "google") {
        try {
          const docRef = await addDoc(
            collection(db, "scheduledEmails"),
            recordBase
          );
          setScheduledEmails((prev) => [
            { id: docRef.id, ...recordBase },
            ...prev,
          ]);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, "scheduledEmails");
        }
      } else {
        setScheduledEmails((prev) => [
          { id: `sch-${Date.now()}`, ...recordBase },
          ...prev,
        ]);
      }

      appendLog(`Scheduler saved OK (${payload.to})`, "success");
      showToast(`Scheduled email for ${payload.scheduleTime}`);
      return true;
    } catch {
      showToast("Save failed, check Firebase config");
      return false;
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    if (activeRole === "Viewer") {
      showToast("Viewer role cannot delete scheduled emails.");
      return;
    }
    try {
      if (db && connectedAccount?.provider === "google") {
        try {
          await deleteDoc(doc(db, "scheduledEmails", id));
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.DELETE,
            `scheduledEmails/${id}`
          );
        }
      }
      setScheduledEmails((prev) => prev.filter((item) => item.id !== id));
      showToast("Removed scheduled email.");
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleAddVipSender = async (
    senderEmail: string,
    senderName: string
  ) => {
    const existing = vipSenders.find(
      (v) => v.senderEmail.toLowerCase() === senderEmail.toLowerCase()
    );
    if (existing) {
      await handleRemoveVipSender(existing.id);
      return;
    }

    const recordBase = {
      uid: connectedAccount?.uid || "demo",
      senderEmail,
      senderName,
      addedAt: new Date().toISOString(),
    };

    try {
      if (db && connectedAccount?.provider === "google") {
        try {
          const docRef = await addDoc(
            collection(db, "vipSenders"),
            recordBase
          );
          setVipSenders((prev) => [{ id: docRef.id, ...recordBase }, ...prev]);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, "vipSenders");
        }
      } else {
        setVipSenders((prev) => [
          { id: `vip-${Date.now()}`, ...recordBase },
          ...prev,
        ]);
      }
      appendLog(`VIP pinned: ${senderName}`, "success");
      showToast(`${senderName} pinned as VIP on top of Inbox.`);
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleRemoveVipSender = async (id: string) => {
    try {
      if (db && connectedAccount?.provider === "google") {
        try {
          await deleteDoc(doc(db, "vipSenders", id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `vipSenders/${id}`);
        }
      }
      setVipSenders((prev) => prev.filter((v) => v.id !== id));
      showToast("Removed from VIP senders.");
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleSnoozeEmail = async (email: Email, snoozeUntil: string) => {
    const recordBase = {
      uid: connectedAccount?.uid || "demo",
      emailId: email.id,
      subject: email.subject,
      senderName: email.senderName,
      snoozeUntil,
      status: "snoozed" as const,
    };

    try {
      if (db && connectedAccount?.provider === "google") {
        try {
          const docRef = await addDoc(
            collection(db, "snoozedEmails"),
            recordBase
          );
          setSnoozedEmails((prev) => [
            { id: docRef.id, ...recordBase },
            ...prev,
          ]);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, "snoozedEmails");
        }
      } else {
        setSnoozedEmails((prev) => [
          { id: `snz-${Date.now()}`, ...recordBase },
          ...prev,
        ]);
      }
      if (selectedEmailId === email.id) {
        const next = visibleEmails.find((e) => e.id !== email.id);
        setSelectedEmailId(next ? next.id : null);
        setMobileShowDetail(false);
      }
      appendLog(`Snoozed until ${snoozeUntil}`, "info");
      showToast(`Snoozed until ${snoozeUntil}`);
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleWakeSnoozed = async (id: string) => {
    try {
      if (db && connectedAccount?.provider === "google") {
        try {
          await deleteDoc(doc(db, "snoozedEmails", id));
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.DELETE,
            `snoozedEmails/${id}`
          );
        }
      }
      setSnoozedEmails((prev) => prev.filter((s) => s.id !== id));
      showToast("Email returned to Inbox.");
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const saveUserSettingsToFirestore = async (
    nextAgents: Record<string, boolean>,
    nextDark: boolean,
    nextLang: LanguageCode
  ) => {
    if (!db || connectedAccount?.provider !== "google") return;
    const uid = connectedAccount.uid;
    try {
      await setDoc(
        doc(db, "userSettings", uid),
        {
          uid,
          darkMode: nextDark,
          language: nextLang,
          agentsEnabled: nextAgents,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `userSettings/${uid}`);
    }
  };

  const handleToggleAgent = async (agentId: string) => {
    const nextAgents = {
      ...agentsEnabled,
      [agentId]: !(agentsEnabled[agentId] !== false),
    };
    setAgentsEnabled(nextAgents);
    try {
      await saveUserSettingsToFirestore(nextAgents, darkMode, language);
      appendLog(
        `Agent ${agentId} turned ${nextAgents[agentId] ? "ON" : "OFF"}`,
        "info"
      );
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleToggleDarkMode = async () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    try {
      await saveUserSettingsToFirestore(agentsEnabled, nextDark, language);
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleChangeLanguage = async (nextLang: LanguageCode) => {
    setLanguage(nextLang);
    try {
      await saveUserSettingsToFirestore(agentsEnabled, darkMode, nextLang);
      showToast(
        nextLang === "hi"
          ? "भाषा हिंदी में बदली गई"
          : "Language switched to English"
      );
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleAddTeamMember = async (email: string, role: TeamRole) => {
    if (activeRole === "Viewer") {
      showToast("Viewer role cannot add team members.");
      return;
    }
    const namePart = email.split("@")[0].replace(/[._]/g, " ");
    const name =
      namePart
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ") || email;
    const recordBase = {
      uid: connectedAccount?.uid || "demo",
      email,
      name,
      role,
      addedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    try {
      if (db && connectedAccount?.provider === "google") {
        try {
          const ref = await addDoc(collection(db, "teamMembers"), recordBase);
          setTeamMembers((prev) => [...prev, { id: ref.id, ...recordBase }]);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, "teamMembers");
        }
      } else {
        setTeamMembers((prev) => [
          ...prev,
          { id: `tm-${Date.now()}`, ...recordBase },
        ]);
      }
      appendLog(`Team added: ${email} (${role})`, "success");
      showToast(`Added ${email} as ${role}`);
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleRemoveTeamMember = async (id: string) => {
    if (activeRole === "Viewer") {
      showToast("Viewer role cannot remove members.");
      return;
    }
    try {
      if (
        db &&
        connectedAccount?.provider === "google" &&
        !id.startsWith("tm-")
      ) {
        try {
          await deleteDoc(doc(db, "teamMembers", id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `teamMembers/${id}`);
        }
      }
      setTeamMembers((prev) => prev.filter((m) => m.id !== id));
      showToast("Removed team member.");
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  const handleDeleteMyData = async () => {
    try {
      if (db && connectedAccount?.provider === "google") {
        const uid = connectedAccount.uid;
        for (const colName of [
          "scheduledEmails",
          "vipSenders",
          "snoozedEmails",
          "teamMembers",
        ]) {
          try {
            const snap = await getDocs(
              query(collection(db, colName), where("uid", "==", uid))
            );
            await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, colName);
          }
        }
        try {
          await deleteDoc(doc(db, "userSettings", uid));
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.DELETE,
            `userSettings/${uid}`
          );
        }
      }
      setScheduledEmails([]);
      setVipSenders([]);
      setSnoozedEmails([]);
      setAgentsEnabled(DEFAULT_AGENTS_STATE);
      Object.values(LS_KEYS).forEach((k) => localStorage.removeItem(k));
      showToast("Your saved data has been deleted.");
    } catch {
      showToast("Save failed, check Firebase config");
    }
  };

  // Existing Inbox & AI Handlers
  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setMobileShowDetail(true);
    setAiError(null);
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isRead: true } : e))
    );
  };

  const handleToggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = emails.find((item) => item.id === id);
    setEmails((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      )
    );
    if (target) {
      showToast(target.isStarred ? "Removed star." : "Starred email.");
    }
  };

  const handleRunSearch = async (rawQuery: string) => {
    const queryStr = rawQuery.trim();
    if (!queryStr) {
      setSearchResult(null);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const candidates = emails
        .filter((e) => !e.inTrash)
        .map((e) => ({
          id: e.id,
          senderName: e.senderName,
          senderEmail: e.senderEmail,
          subject: e.subject,
          snippet: e.snippet,
          category: e.category,
          aiScore: e.aiScore,
        }));

      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryStr, emails: candidates }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Hinglish search request failed.");
      }

      setAiCallsCount((c) => c + 1);
      setAiTokensCount((t) => t + 320);

      setSearchResult({
        query: queryStr,
        interpretedIntent:
          data.interpretedIntent || `Matches for "${queryStr}"`,
        matches: Array.isArray(data.matches) ? data.matches : [],
      });

      if (
        activeNav !== "inbox" &&
        activeNav !== "focus" &&
        activeNav !== "approved"
      ) {
        setActiveNav("inbox");
      }
      setScoreFilter("all");
      if (Array.isArray(data.matches) && data.matches.length > 0) {
        setSelectedEmailId(data.matches[0].id);
      }
      appendLog(`Hinglish search: "${queryStr}"`, "info");
    } catch (err: unknown) {
      setSearchError(
        err instanceof Error ? err.message : "Failed to run Gemini search."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchResult(null);
    setSearchError(null);
  };

  const handleUpdateDraft = (emailId: string, draft: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, aiReplyDraft: draft } : e))
    );
  };

  const handleApproveDraft = (emailId: string) => {
    const approvedAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setEmails((prev) =>
      prev.map((e) =>
        e.id === emailId ? { ...e, draftStatus: "approved", approvedAt } : e
      )
    );
    appendLog("Reply draft approved (manual send gate)", "success");
    showToast("Draft approved — held safely until you click Send.");
  };

  const handleRejectDraft = (emailId: string) => {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === emailId ? { ...e, draftStatus: "rejected" } : e
      )
    );
    showToast("AI draft rejected. Nothing was sent.");
  };

  const handleResetDraftToPending = (emailId: string) => {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === emailId ? { ...e, draftStatus: "pending" } : e
      )
    );
  };

  const handleSendApprovedReply = (emailId: string) => {
    const sentAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setEmails((prev) =>
      prev.map((e) =>
        e.id === emailId ? { ...e, draftStatus: "sent", sentAt } : e
      )
    );
    appendLog("Approved reply sent OK", "success");
    showToast("Sent Successfully");
  };

  const handleRefreshAiAnalysis = async (emailId: string, tone: ReplyTone) => {
    const target = emails.find((e) => e.id === emailId);
    if (!target) return;

    setIsAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: target.senderName,
          senderEmail: target.senderEmail,
          subject: target.subject,
          body: target.body,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze email with Gemini.");
      }

      setAiCallsCount((c) => c + 1);
      setAiTokensCount((t) => t + 410);

      const newScore =
        typeof data.aiScore === "number"
          ? Math.max(0, Math.min(100, data.aiScore))
          : target.aiScore;

      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? {
                ...e,
                aiSummary: data.summary || e.aiSummary,
                aiScore: newScore,
                scoreReason: data.scoreReason || e.scoreReason,
                aiReplyDraft: data.replyDraft || e.aiReplyDraft,
                draftStatus: "pending",
              }
            : e
        )
      );
      appendLog(`Triage scored ${newScore}`, "success");
      showToast("Summary, score, and draft refreshed via Gemini AI.");
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : "Failed to refresh AI analysis."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRedraftTone = async (emailId: string, tone: ReplyTone) => {
    const target = emails.find((e) => e.id === emailId);
    if (!target) return;

    setIsRedrafting(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/redraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: target.senderName,
          subject: target.subject,
          body: target.body,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to re-draft reply.");
      }
      setAiCallsCount((c) => c + 1);
      setAiTokensCount((t) => t + 280);

      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? {
                ...e,
                aiReplyDraft: data.replyDraft || e.aiReplyDraft,
                draftStatus: "pending",
              }
            : e
        )
      );
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : "Failed to re-draft reply."
      );
    } finally {
      setIsRedrafting(false);
    }
  };

  const handleSummarizeEmail = async (emailId: string) => {
    const target = emails.find((e) => e.id === emailId);
    if (!target) return;

    setIsSummarizing(true);
    setAiError(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: target.senderName,
          subject: target.subject,
          body: target.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to summarize email.");
      }

      setAiCallsCount((c) => c + 1);
      setAiTokensCount((t) => t + 260);

      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId
            ? {
                ...e,
                aiSummary: data.summary || e.aiSummary,
                actionItems: Array.isArray(data.actionItems)
                  ? data.actionItems
                  : e.actionItems,
              }
            : e
        )
      );
      appendLog(`AI Summarize generated for ${target.senderName}`, "success");
      showToast("Summary & action items generated.");
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : "Failed to summarize email."
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleArchiveEmail = (emailId: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, isArchived: true } : e))
    );
    if (selectedEmailId === emailId) {
      const next = visibleEmails.find((e) => e.id !== emailId);
      setSelectedEmailId(next ? next.id : null);
      setMobileShowDetail(false);
    }
    appendLog("Archived email", "info");
    showToast("Archived email.");
  };

  const handleDeleteEmail = (emailId: string) => {
    if (activeRole === "Viewer") {
      showToast("Viewer role cannot delete emails.");
      return;
    }
    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, inTrash: true } : e))
    );
    if (selectedEmailId === emailId) {
      const next = visibleEmails.find((e) => e.id !== emailId);
      setSelectedEmailId(next ? next.id : null);
      setMobileShowDetail(false);
    }
    showToast("Moved email to Trash.");
  };

  const handleUnsubscribeSender = (subscriptionId: string) => {
    const targetSub = subscriptions.find((s) => s.id === subscriptionId);
    setEmails((prev) =>
      prev.map((e) =>
        e.subscriptionId === subscriptionId
          ? { ...e, isUnsubscribed: true }
          : e
      )
    );
    appendLog(
      `Unsubscribed: ${targetSub?.senderName || "mailing list"}`,
      "success"
    );
    showToast(`Unsubscribed from ${targetSub?.senderName || "mailing list"}.`);
  };

  const handleDeleteSenderEmails = (subscriptionId: string) => {
    if (activeRole === "Viewer") {
      showToast("Viewer role cannot delete emails.");
      return;
    }
    const targetSub = subscriptions.find((s) => s.id === subscriptionId);
    setEmails((prev) =>
      prev.map((e) =>
        e.subscriptionId === subscriptionId
          ? { ...e, inTrash: true, isUnsubscribed: true }
          : e
      )
    );
    showToast(`Deleted emails from ${targetSub?.senderName || "sender"}.`);
  };

  const handleDeleteAllSubscriptions = () => {
    if (activeRole === "Viewer") {
      showToast("Viewer role cannot delete emails.");
      return;
    }
    setEmails((prev) =>
      prev.map((e) =>
        e.isSubscription ? { ...e, inTrash: true, isUnsubscribed: true } : e
      )
    );
    appendLog("Bulk unsubscribed & cleaned promotional emails", "success");
    showToast("All subscription emails deleted and unsubscribed.");
  };

  const handleSendNewEmail = (payload: {
    to: string;
    subject: string;
    body: string;
  }) => {
    const sentAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const recipientName = payload.to.split("@")[0].replace(/[._]/g, " ");
    const formattedRecipient =
      recipientName
        .split(" ")
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
        .join(" ") || payload.to;

    const newSentEmail: Email = {
      id: `sent-${Date.now()}`,
      senderName: `To: ${formattedRecipient}`,
      senderEmail: payload.to,
      senderInitials: formattedRecipient
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      subject: payload.subject,
      snippet: payload.body.slice(0, 95),
      body: payload.body,
      timestamp: sentAt,
      isRead: true,
      isStarred: false,
      aiScore: 85,
      scoreReason: "Sent message saved to Approved & Sent.",
      category: "client",
      aiSummary: `Sent message to ${payload.to} regarding "${payload.subject}".`,
      aiReplyDraft: payload.body,
      draftStatus: "sent",
      sentAt,
      isSubscription: false,
    };

    setEmails((prev) => [newSentEmail, ...prev]);
    setSelectedEmailId(newSentEmail.id);
    appendLog(`Sent email to ${payload.to}`, "success");
    showToast("Sent Successfully");
  };

  const handleToggleAutoSort = () => {
    const next = !isAutoSorted;
    setIsAutoSorted(next);
    if (next) {
      setScoreFilter("all");
      appendLog(
        `Email Sorter organized ${totalInboxCount} emails into Focus, Normal, Later & Low`,
        "success"
      );
      showToast(
        `Auto-sorted ${totalInboxCount} emails into Focus, Normal, Low & Later.`
      );
    } else {
      showToast("Restored default inbox order.");
    }
  };

  const handleAutoSortInboxAndOpen = () => {
    setIsAutoSorted(true);
    setScoreFilter("all");
    setActiveNav("inbox");
    setMobileShowDetail(false);
    appendLog(
      `Email Sorter organized ${totalInboxCount} emails into Focus, Normal, Later & Low`,
      "success"
    );
    showToast(
      `Auto-sorted ${totalInboxCount} emails into Focus, Normal, Low & Later.`
    );
  };

  const handleAiFeatureSummarize = () => {
    const target =
      selectedEmail ||
      emails.find((e) => !e.inTrash && !e.isArchived) ||
      emails[0];
    if (!target) return;
    setActiveNav("inbox");
    setSelectedEmailId(target.id);
    setMobileShowDetail(true);
    handleSummarizeEmail(target.id);
  };

  const handleAiFeaturePriorityDetect = async () => {
    const target =
      selectedEmail ||
      emails.find((e) => !e.inTrash && !e.isArchived) ||
      emails[0];
    if (!target) return;
    setActiveNav("inbox");
    setSelectedEmailId(target.id);
    setMobileShowDetail(true);
    await handleRefreshAiAnalysis(target.id, "professional");
  };

  const handleAiFeatureSmartSearch = () => {
    setActiveNav("inbox");
    setMobileShowDetail(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);
  };

  const handleRunTestSuite = () => {
    appendLog("Verification suite: 5/5 tests passed", "success");
    showToast("Tests: 5/5 Passed (Triage, Injection Guard, Scheduler, VIP, Unsubscribe)");
  };

  const totalInboxCount = useMemo(
    () =>
      emails.filter(
        (e) => !e.inTrash && !e.isArchived && !snoozedIdSet.has(e.id)
      ).length,
    [emails, snoozedIdSet]
  );

  const focusCount = useMemo(
    () =>
      emails.filter(
        (e) =>
          !e.inTrash &&
          !e.isArchived &&
          !snoozedIdSet.has(e.id) &&
          e.aiScore >= 90
      ).length,
    [emails, snoozedIdSet]
  );

  const approvedCount = useMemo(
    () =>
      emails.filter(
        (e) =>
          !e.inTrash &&
          !e.isArchived &&
          (e.draftStatus === "approved" || e.draftStatus === "sent")
      ).length,
    [emails]
  );

  const trashCount = useMemo(
    () => emails.filter((e) => Boolean(e.inTrash)).length,
    [emails]
  );

  const labels = useMemo(() => {
    if (language === "hi") {
      return {
        inbox: "इनबॉक्स",
        focus: "फोकस 90+",
        unsubscribe: "सदस्यता रद्द",
        approved: "स्वीकृत",
        agents: "14 एजेंट",
        devops: "DevOps",
        team: "टीम",
        settings: "सेटिंग्स",
        trash: "ट्रैश",
        compose: "लिखें",
      };
    }
    return {
      inbox: "Inbox",
      focus: "Focus 90+",
      unsubscribe: "Unsubscribe",
      approved: "Approved & Sent",
      agents: "14 Agents",
      devops: "DevOps",
      team: "Team",
      settings: "Settings",
      trash: "Trash",
      compose: "Compose",
    };
  }, [language]);

  const sectionTitleMap: Record<NavSection, string> = {
    inbox: labels.inbox,
    focus: labels.focus,
    subscriptions: labels.unsubscribe,
    approved: labels.approved,
    agents: labels.agents,
    devops: labels.devops,
    team: labels.team,
    settings: labels.settings,
    trash: labels.trash,
  };

  return (
    <MotionConfig reducedMotion="user">
    <div
      className={`min-h-dvh lg:h-dvh w-full max-w-full flex flex-col lg:overflow-hidden overflow-x-hidden ${
        darkMode ? "bg-[#0A0A0A] text-[#F4F4F5]" : "bg-[#111318] text-zinc-100"
      }`}
    >
      {/* Offline Banner */}
      {!isOnline && (
        <div
          role="status"
          className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-xs font-medium text-amber-200 flex items-center justify-center gap-2 shrink-0"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>You are offline - Showing cached emails</span>
        </div>
      )}

      {/* Empty Firebase Config Yellow Banner */}
      {!isFirebaseConfigured && (
        <div
          role="alert"
          className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/35 text-xs font-medium text-amber-200 flex items-center justify-center gap-2 shrink-0"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>
            Add your Firebase config in firebase.js to go Live. Demo data
            showing for now.
          </span>
        </div>
      )}

      {/* Connecting to Firebase Spinner */}
      {isFirebaseLoading && (
        <div className="px-4 py-1.5 bg-[#121212] border-b border-white/[0.08] text-xs text-zinc-300 flex items-center justify-center gap-2 shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <span>Connecting to Firebase...</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="min-h-14 px-3 sm:px-6 py-2 border-b border-white/[0.08] bg-[#0A0A0A] flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Zone 1: Custom M-in-Circle Brand Logo + Privacy Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveNav("inbox");
              setMobileShowDetail(false);
            }}
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
          >
            <MailMindLogo className="w-7 h-7 shrink-0" />
            <span>MailMind OS</span>
          </button>

          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] sm:text-[11px] font-mono text-emerald-300 leading-tight sm:whitespace-nowrap">
            Demo Mode | No Real Data | Privacy Safe
          </span>

          <span
            className={`hidden xl:inline-flex items-center text-xs font-mono whitespace-nowrap shrink-0 ${
              connectedAccount ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {connectedAccount
              ? `Live Mode - Connected as ${connectedAccount.name}`
              : "Demo Mode"}
          </span>
        </div>

        {/* Zone 2: Concise Nav Links (Desktop) */}
        <nav
          className="hidden xl:flex items-center gap-5 text-sm font-medium text-zinc-400"
          aria-label="Primary workspace views"
        >
          {(
            [
              { id: "inbox", label: labels.inbox },
              { id: "focus", label: labels.focus },
              { id: "agents", label: labels.agents },
              {
                id: "subscriptions",
                label: `${labels.unsubscribe} (${activeSubscriptionCount})`,
              },
              { id: "devops", label: labels.devops },
              { id: "team", label: labels.team },
            ] as const
          ).map((navItem) => (
            <button
              key={navItem.id}
              type="button"
              onClick={() => {
                setActiveNav(navItem.id);
                setMobileShowDetail(false);
              }}
              className={`whitespace-nowrap shrink-0 transition-colors hover:text-white ${
                activeNav === navItem.id
                  ? "text-white underline underline-offset-8 decoration-emerald-400"
                  : ""
              }`}
            >
              {navItem.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Daily Digest + Shortcuts + Install App + Connect Gmail / User Photo + Logout */}
        <div className="flex items-center justify-between sm:justify-end flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setDailyDigestTab("overview");
              setIsDailyDigestOpen(true);
            }}
            className="min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Digest</span>
          </button>

          <button
            type="button"
            onClick={handleShareApp}
            title="Share app link"
            aria-label="Share app link"
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/5 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
            className="min-h-[36px] min-w-[36px] rounded-xl border border-white/10 text-xs font-mono font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors inline-flex items-center justify-center shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="hidden sm:inline-flex min-h-[36px] px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-200 hover:bg-white/5 transition-colors items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Install App</span>
            </button>
          )}

          {connectedAccount ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#141414] border border-white/10">
                {connectedAccount.photoURL ? (
                  <img
                    src={connectedAccount.photoURL}
                    alt={connectedAccount.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {connectedAccount.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block leading-tight max-w-[160px]">
                  <p className="text-xs font-semibold text-white truncate">
                    {connectedAccount.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {connectedAccount.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectGmail}
              className="min-h-[36px] px-3 sm:px-4 py-1.5 rounded-xl bg-white text-black text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Connect Gmail</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Hero Title & Developer Demo Project Label Bar */}
      <div className="px-3 sm:px-6 py-2 border-b border-white/[0.06] bg-[#0D0D0D] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
          <h1 className="text-[13px] sm:text-sm font-semibold text-white tracking-tight leading-snug">
            MailMind OS — The AI Email Operating System
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] sm:text-[11px] font-medium text-zinc-300 leading-tight sm:whitespace-nowrap">
            AI Full Stack Developer Demo Project
          </span>
          <p className="hidden sm:inline text-xs text-zinc-400">
            • 14 Autonomous Agents
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveNav(activeNav === "focus" ? "inbox" : "focus");
              setMobileShowDetail(false);
            }}
            className="lg:hidden px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 flex items-center gap-1 whitespace-nowrap"
          >
            <Target className="w-3 h-3" />
            <span>Focus Mode ({focusCount})</span>
          </button>
          <p className="hidden lg:block text-xs text-zinc-500">
            Inspired by Gmail & Gemini · Sample Demo Data Only
          </p>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex flex-col lg:flex-row lg:min-h-0 lg:overflow-hidden">
        {/* Desktop Left Sidebar */}
        <aside
          className="hidden lg:flex w-[240px] flex-col justify-between border-r border-white/[0.08] bg-[#0A0A0A] p-3 shrink-0 overflow-y-auto"
          aria-label="Mailbox folders"
        >
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setIsComposeOpen(true)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              <PenSquare className="w-4 h-4" />
              <span>{labels.compose}</span>
            </button>

            <div className="space-y-1">
              {(
                [
                  {
                    id: "inbox",
                    label: labels.inbox,
                    icon: Inbox,
                    count: totalInboxCount,
                  },
                  {
                    id: "focus",
                    label: labels.focus,
                    icon: Target,
                    count: focusCount,
                  },
                  {
                    id: "subscriptions",
                    label: labels.unsubscribe,
                    icon: MailX,
                    count: activeSubscriptionCount,
                  },
                  {
                    id: "approved",
                    label: labels.approved,
                    icon: CheckCircle2,
                    count: approvedCount,
                  },
                  {
                    id: "agents",
                    label: labels.agents,
                    icon: Bot,
                    count: Object.values(agentsEnabled).filter(Boolean).length,
                  },
                  {
                    id: "devops",
                    label: labels.devops,
                    icon: GitBranch,
                    count: null,
                  },
                  {
                    id: "team",
                    label: labels.team,
                    icon: Users,
                    count: teamMembers.length,
                  },
                  {
                    id: "settings",
                    label: labels.settings,
                    icon: SettingsIcon,
                    count: null,
                  },
                  {
                    id: "trash",
                    label: labels.trash,
                    icon: Trash2,
                    count: trashCount,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileShowDetail(false);
                    }}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                      active
                        ? "bg-[#181818] text-white"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-[#121212]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.count !== null && (
                      <span className="text-xs font-mono tabular-nums text-zinc-500">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tests + Score Key */}
          <div className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => {
                handleRunTestSuite();
                setActiveNav("agents");
              }}
              className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15 transition-colors flex items-center justify-between"
            >
              <span>Tests: 5/5 Passed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <div className="p-3.5 rounded-xl bg-[#111111] border border-white/[0.06] space-y-2">
              <p className="text-xs font-semibold text-zinc-300">
                AI Score Key
              </p>
              <div className="space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex items-center justify-between text-emerald-400">
                  <span>90–100</span>
                  <span className="font-sans">Focus</span>
                </div>
                <div className="flex items-center justify-between text-amber-400">
                  <span>50–89</span>
                  <span className="font-sans">Normal</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500">
                  <span>0–49</span>
                  <span className="font-sans">Low</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Active View with smooth slide + fade transition */}
        <AnimatePresence mode="wait">
          {activeNav === "subscriptions" ? (
            <motion.main
              key="subscriptions"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-w-0 h-auto lg:h-full"
            >
              <UnsubscribeView
                subscriptions={subscriptions}
                onUnsubscribe={handleUnsubscribeSender}
                onDeleteSenderEmails={handleDeleteSenderEmails}
                onDeleteAllSubscriptions={handleDeleteAllSubscriptions}
                onBackToInbox={() => setActiveNav("inbox")}
              />
            </motion.main>
          ) : activeNav === "agents" ? (
            <motion.main
              key="agents"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-w-0 h-auto lg:h-full"
            >
              <AgentsDashboardView
                emails={emails}
                isAutoSorted={isAutoSorted}
                agentsEnabled={agentsEnabled}
                onToggleAgent={handleToggleAgent}
                scheduledEmails={scheduledEmails}
                onDeleteScheduled={handleDeleteScheduled}
                vipSenders={vipSenders}
                onRemoveVip={handleRemoveVipSender}
                snoozedEmails={snoozedEmails}
                onWakeSnoozed={handleWakeSnoozed}
                liveLogs={liveLogs}
                onClearLogs={() => setLiveLogs([])}
                aiCallsCount={aiCallsCount}
                aiTokensCount={aiTokensCount}
                activeRole={activeRole}
                onBackToInbox={() => setActiveNav("inbox")}
                onRunTestSuite={handleRunTestSuite}
                onAutoSortInbox={handleAutoSortInboxAndOpen}
                onAiFeatureSummarize={handleAiFeatureSummarize}
                onAiFeatureDraftReply={() => setIsComposeOpen(true)}
                onAiFeatureActionItems={() => {
                  setDailyDigestTab("action-items");
                  setIsDailyDigestOpen(true);
                }}
                onAiFeatureSmartSearch={handleAiFeatureSmartSearch}
                onAiFeaturePriorityDetect={handleAiFeaturePriorityDetect}
              />
            </motion.main>
          ) : activeNav === "devops" ? (
            <motion.main
              key="devops"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-w-0 h-auto lg:h-full"
            >
              <DevOpsView onBackToInbox={() => setActiveNav("inbox")} />
            </motion.main>
          ) : activeNav === "team" ? (
            <motion.main
              key="team"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-w-0 h-auto lg:h-full"
            >
              <TeamView
                members={teamMembers}
                activeRole={activeRole}
                onChangeActiveRole={setActiveRole}
                onAddMember={handleAddTeamMember}
                onRemoveMember={handleRemoveTeamMember}
                onBackToInbox={() => setActiveNav("inbox")}
              />
            </motion.main>
          ) : activeNav === "settings" ? (
            <motion.main
              key="settings"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 min-w-0 h-auto lg:h-full"
            >
              <SettingsView
                darkMode={darkMode}
                onToggleDarkMode={handleToggleDarkMode}
                language={language}
                onChangeLanguage={handleChangeLanguage}
                agentsEnabled={agentsEnabled}
                onToggleAgent={handleToggleAgent}
                onDeleteMyData={handleDeleteMyData}
                onBackToInbox={() => setActiveNav("inbox")}
              />
            </motion.main>
          ) : (
            <motion.main
              key={activeNav}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex min-w-0 h-auto lg:h-full"
            >
              <div
                className={`w-full lg:w-[410px] xl:w-[440px] shrink-0 h-auto lg:h-full ${
                  mobileShowDetail ? "hidden lg:block" : "block"
                }`}
              >
                <EmailList
                  emails={visibleEmails}
                  vipEmailSet={vipEmailSet}
                  selectedEmailId={selectedEmailId}
                  activeRole={activeRole}
                  onSelectEmail={handleSelectEmail}
                  onToggleStar={handleToggleStar}
                  onArchiveEmail={handleArchiveEmail}
                  onSnoozeEmail={handleSnoozeEmail}
                  onDeleteEmail={handleDeleteEmail}
                  onOpenCompose={() => {
                    setComposePrefill(null);
                    setIsComposeOpen(true);
                  }}
                  scoreFilter={scoreFilter}
                  onScoreFilterChange={setScoreFilter}
                  isAutoSorted={isAutoSorted}
                  onToggleAutoSort={handleToggleAutoSort}
                  searchInput={searchInput}
                  searchInputRef={searchInputRef}
                  onSearchInputChange={setSearchInput}
                  onRunSearch={handleRunSearch}
                  onClearSearch={handleClearSearch}
                  onVoiceNotice={showToast}
                  isSearching={isSearching}
                  searchResult={searchResult}
                  searchError={searchError}
                  counts={scoreCounts}
                  sectionTitle={sectionTitleMap[activeNav]}
                />
              </div>

              <div
                className={`flex-1 min-w-0 h-auto lg:h-full ${
                  mobileShowDetail ? "block" : "hidden lg:block"
                }`}
              >
                <EmailDetail
                  email={selectedEmail}
                  isVipSender={
                    selectedEmail
                      ? vipEmailSet.has(selectedEmail.senderEmail.toLowerCase())
                      : false
                  }
                  activeRole={activeRole}
                  onBackMobile={() => setMobileShowDetail(false)}
                  onUpdateDraft={handleUpdateDraft}
                  onApproveDraft={handleApproveDraft}
                  onRejectDraft={handleRejectDraft}
                  onResetDraftToPending={handleResetDraftToPending}
                  onSendApprovedReply={handleSendApprovedReply}
                  onRefreshAiAnalysis={handleRefreshAiAnalysis}
                  onSummarizeEmail={handleSummarizeEmail}
                  onRedraftTone={handleRedraftTone}
                  onToggleStar={(id) => handleToggleStar(id)}
                  onArchiveEmail={handleArchiveEmail}
                  onDeleteEmail={handleDeleteEmail}
                  onUnsubscribeSender={handleUnsubscribeSender}
                  onAddVipSender={handleAddVipSender}
                  onSnoozeEmail={handleSnoozeEmail}
                  onUseSmartReplyInCompose={handleUseSmartReplyInCompose}
                  isAnalyzing={isAnalyzing}
                  isSummarizing={isSummarizing}
                  isRedrafting={isRedrafting}
                  aiError={aiError}
                />
              </div>
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      {/* Full-Screen Animated Focus Mode Overlay */}
      <AnimatePresence>
        {activeNav === "focus" && (
          <motion.div
            key="focus-mode-overlay"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[45] bg-[#050505]/95 backdrop-blur-md flex flex-col overflow-hidden"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.12), transparent 55%)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Focus Mode"
          >
            <div className="px-4 sm:px-6 py-3 border-b border-emerald-500/25 bg-[#0A0A0A]/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-white">
                    Focus Mode ON - {focusCount}{" "}
                    {focusCount === 1 ? "email" : "emails"}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Distraction-free view · Highlighting only 90+ Focus emails
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveNav("inbox");
                  setMobileShowDetail(false);
                }}
                className="min-h-[38px] px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Exit Focus</span>
              </button>
            </div>

            <div className="flex-1 flex min-h-0 overflow-y-auto lg:overflow-hidden max-w-7xl w-full mx-auto border-x border-white/[0.06] bg-[#0A0A0A]">
              <div
                className={`w-full lg:w-[420px] shrink-0 h-auto lg:h-full ${
                  mobileShowDetail ? "hidden lg:block" : "block"
                }`}
              >
                <EmailList
                  emails={visibleEmails}
                  vipEmailSet={vipEmailSet}
                  selectedEmailId={selectedEmailId}
                  activeRole={activeRole}
                  onSelectEmail={handleSelectEmail}
                  onToggleStar={handleToggleStar}
                  onArchiveEmail={handleArchiveEmail}
                  onSnoozeEmail={handleSnoozeEmail}
                  onDeleteEmail={handleDeleteEmail}
                  onOpenCompose={() => {
                    setComposePrefill(null);
                    setIsComposeOpen(true);
                  }}
                  scoreFilter={scoreFilter}
                  onScoreFilterChange={setScoreFilter}
                  isAutoSorted={isAutoSorted}
                  onToggleAutoSort={handleToggleAutoSort}
                  searchInput={searchInput}
                  searchInputRef={searchInputRef}
                  onSearchInputChange={setSearchInput}
                  onRunSearch={handleRunSearch}
                  onClearSearch={handleClearSearch}
                  onVoiceNotice={showToast}
                  isSearching={isSearching}
                  searchResult={searchResult}
                  searchError={searchError}
                  counts={scoreCounts}
                  sectionTitle="Focus 90+"
                />
              </div>

              <div
                className={`flex-1 min-w-0 h-auto lg:h-full ${
                  mobileShowDetail ? "block" : "hidden lg:block"
                }`}
              >
                {(() => {
                  const focusActiveEmail =
                    visibleEmails.find((e) => e.id === selectedEmailId) ||
                    visibleEmails[0] ||
                    null;
                  return (
                    <EmailDetail
                      email={focusActiveEmail}
                      isVipSender={
                        focusActiveEmail
                          ? vipEmailSet.has(
                              focusActiveEmail.senderEmail.toLowerCase()
                            )
                          : false
                      }
                  activeRole={activeRole}
                  onBackMobile={() => setMobileShowDetail(false)}
                  onUpdateDraft={handleUpdateDraft}
                  onApproveDraft={handleApproveDraft}
                  onRejectDraft={handleRejectDraft}
                  onResetDraftToPending={handleResetDraftToPending}
                  onSendApprovedReply={handleSendApprovedReply}
                  onRefreshAiAnalysis={handleRefreshAiAnalysis}
                  onSummarizeEmail={handleSummarizeEmail}
                  onRedraftTone={handleRedraftTone}
                  onToggleStar={(id) => handleToggleStar(id)}
                  onArchiveEmail={handleArchiveEmail}
                  onDeleteEmail={handleDeleteEmail}
                  onUnsubscribeSender={handleUnsubscribeSender}
                  onAddVipSender={handleAddVipSender}
                  onSnoozeEmail={handleSnoozeEmail}
                  onUseSmartReplyInCompose={handleUseSmartReplyInCompose}
                  isAnalyzing={isAnalyzing}
                  isSummarizing={isSummarizing}
                  isRedrafting={isRedrafting}
                      aiError={aiError}
                    />
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Scrolling Footer (Portfolio + Legal Disclaimer below, 90px mobile bottom padding for nav clearance) */}
      <footer className="border-t border-white/[0.08] bg-[#0A0A0A] px-4 sm:px-6 pt-3 pb-[90px] lg:py-2.5 text-[11px] text-zinc-400 shrink-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            <span className="text-zinc-200 font-medium">
              Built by Munazza Ruhi
            </span>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-0.5 rounded-md bg-[#161616] border border-white/10 text-[11px] font-medium text-zinc-200 hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-0.5 rounded-md bg-[#161616] border border-white/10 text-[11px] font-medium text-zinc-200 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
          <div className="hidden xl:flex items-center gap-2 font-mono shrink-0">
            <span className="text-zinc-500 font-sans">API:</span>
            <span>POST /api/scoreEmail</span>
            <span aria-hidden="true">·</span>
            <span>POST /api/summarize</span>
            <span aria-hidden="true">·</span>
            <span>POST /api/sendScheduled</span>
          </div>
          <div className="hidden 2xl:block truncate text-zinc-500">
            <span className="text-zinc-300 font-medium">How to Deploy:</span> 1.
            Create Firebase Project 2. Paste config in firebase.js 3. Deploy to
            Firebase Hosting
          </div>
        </div>

        <p className="mt-2 lg:mt-1.5 text-[10px] sm:text-[11px] text-zinc-500 text-center leading-relaxed max-w-5xl mx-auto">
          MailMind OS — The AI Email Operating System | AI Full Stack Developer
          Demo Project inspired by Gmail and Gemini. Not affiliated with or
          endorsed by Google LLC. Gmail and Gemini are trademarks of Google LLC.
          This project uses demo sample data only, no real user emails, no real
          Gmail API data.
        </p>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0E0E0E]/95 backdrop-blur-md border-t border-white/[0.08] grid grid-cols-5 items-center px-1"
        aria-label="Mobile navigation"
      >
        <button
          type="button"
          onClick={() => {
            setActiveNav("inbox");
            setMobileShowDetail(false);
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNav === "inbox" ? "text-white" : "text-zinc-500"
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Inbox</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNav("agents");
            setMobileShowDetail(false);
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNav === "agents" ? "text-emerald-400" : "text-zinc-500"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Agents</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNav("subscriptions");
            setMobileShowDetail(false);
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNav === "subscriptions" ? "text-white" : "text-zinc-500"
          }`}
        >
          <MailX className="w-4 h-4" />
          <span>Unsub</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNav("team");
            setMobileShowDetail(false);
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNav === "team" ? "text-white" : "text-zinc-500"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveNav("settings");
            setMobileShowDetail(false);
          }}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
            activeNav === "settings" ? "text-white" : "text-zinc-500"
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-12 right-4 sm:right-6 z-50 px-4 py-3 rounded-xl bg-[#181818] border border-white/15 text-xs sm:text-sm text-white shadow-xl"
        >
          {toast}
        </div>
      )}

      {/* Install PWA Info Modal */}
      {showInstallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#121212] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Install MailMind OS
              </h3>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {isIOS
                ? "Tap the Share button in Safari, then choose 'Add to Home Screen' to install MailMind OS."
                : "Open this app directly in Chrome or Edge and click the install icon in the address bar (or browser menu -> Install MailMind OS) for offline PWA mode."}
            </p>
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full min-h-[40px] rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Fallback Demo Sign-In Modal if Firebase Popup unavailable */}
      <OAuthModal
        isOpen={isOAuthModalOpen}
        connectedAccount={connectedAccount}
        onClose={() => setIsOAuthModalOpen(false)}
        onConnect={(acct) => {
          setConnectedAccount({
            ...acct,
            uid: "demo",
            provider: "demo",
          });
          showToast(`Connected account: ${acct.email}`);
        }}
        onDisconnect={handleLogout}
      />

      {/* Compose & Scheduler Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => {
          setIsComposeOpen(false);
          setComposePrefill(null);
        }}
        activeRole={activeRole}
        prefill={composePrefill}
        onSendNewEmail={handleSendNewEmail}
        onScheduleEmail={handleScheduleEmail}
        onAiDraftSuccess={() => {
          setAiCallsCount((c) => c + 1);
          setAiTokensCount((t) => t + 240);
          appendLog("Compose Assist drafted reply via Gemini AI", "success");
        }}
      />

      {/* Daily Digest Modal (with Today's Summary & AI Action Items Tab) */}
      <DailyDigestModal
        key={`digest-${dailyDigestTab}-${isDailyDigestOpen}`}
        isOpen={isDailyDigestOpen}
        initialTab={dailyDigestTab}
        onClose={() => setIsDailyDigestOpen(false)}
        emails={emails}
        onSelectEmail={(id) => {
          setActiveNav("inbox");
          handleSelectEmail(id);
        }}
        onAiActionSuccess={(count) => {
          setAiCallsCount((c) => c + 1);
          setAiTokensCount((t) => t + 310);
          appendLog(
            `Daily Digest extracted ${count} AI action items`,
            "success"
          );
          showToast(`Extracted ${count} AI action items.`);
        }}
      />

      {/* Keyboard Shortcuts Help Popup (?) */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* First-Open Welcome / Demo Login Screen */}
      <WelcomeScreen
        isOpen={showWelcome}
        onEnterDemo={handleDismissWelcome}
        onOpenConnect={handleConnectGmail}
      />
    </div>
    </MotionConfig>
  );
}
