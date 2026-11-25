import "dotenv/config";
import express from "express";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Sliding window rate limiter for /api/sendScheduled (max 4 requests per 10 seconds)
const scheduleRateWindow = new Map<string, number[]>();

function isValidEmailAddress(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function detectPromptInjection(text: string, senderEmail?: string): string | null {
  const lower = `${text} ${senderEmail || ""}`.toLowerCase();
  if (lower.includes("hacker@evil.com")) {
    return "Blocked known malicious sender hacker@evil.com";
  }
  if (
    lower.includes("ignore previous instructions") ||
    lower.includes("system prompt") ||
    lower.includes("<script") ||
    lower.includes("exfiltrate")
  ) {
    return "Prompt injection or XSS payload blocked by Security Guard Agent";
  }
  return null;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please check Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface SearchCandidate {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  category: string;
  aiScore: number;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, model: "gemini-4-hydrogen" });
  });

  // Part A API Route 1: POST /api/scoreEmail
  app.post("/api/scoreEmail", async (req, res) => {
    try {
      const { senderName, senderEmail, subject, body } = req.body as {
        senderName?: string;
        senderEmail?: string;
        subject?: string;
        body?: string;
      };

      if (!subject || !body) {
        res.status(400).json({ error: "Subject and body are required." });
        return;
      }

      const injectionReason = detectPromptInjection(`${subject} ${body}`, senderEmail);
      if (injectionReason) {
        res.status(403).json({
          aiScore: 0,
          scoreReason: injectionReason,
          securitySafe: false,
          blockedReason: injectionReason,
        });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Score this email from 0 to 100 for inbox focus priority.
90-100 = urgent/high-value human communication (interviews, deadlines, client approvals).
50-89 = normal operational updates, bills, receipts, travel.
0-49 = newsletters, promotions, automated digests.

Sender: ${senderName || "Unknown"} <${senderEmail || ""}>
Subject: ${subject}
Body:
${body}`,
        config: {
          systemInstruction:
            "Return JSON with aiScore (0-100 integer) and a concise scoreReason.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              aiScore: { type: Type.INTEGER },
              scoreReason: { type: Type.STRING },
            },
            required: ["aiScore", "scoreReason"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json({
        aiScore: parsed.aiScore,
        scoreReason: parsed.scoreReason,
        securitySafe: true,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to score email.";
      res.status(500).json({ error: message });
    }
  });

  // Part A API Route 2: POST /api/summarize
  app.post("/api/summarize", async (req, res) => {
    try {
      const { senderName, subject, body } = req.body as {
        senderName?: string;
        subject?: string;
        body?: string;
      };

      if (!subject || !body) {
        res.status(400).json({ error: "Subject and body are required." });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Summarize this email in strictly 2 crisp sentences (max 35 words) and extract up to 2 short action items.
Sender: ${senderName || "Unknown"}
Subject: ${subject}
Body:
${body}`,
        config: {
          systemInstruction:
            "You are a concise executive email summarizer. Never invent details.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              actionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["summary", "actionItems"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to summarize email.";
      res.status(500).json({ error: message });
    }
  });

  // Part A API Route 3: POST /api/sendScheduled
  app.post("/api/sendScheduled", (req, res) => {
    const clientIp = req.ip || "default";
    const now = Date.now();
    const recent = (scheduleRateWindow.get(clientIp) || []).filter(
      (t) => now - t < 10_000
    );
    if (recent.length >= 4) {
      res.status(429).json({ error: "Too many requests, wait 10s" });
      return;
    }
    recent.push(now);
    scheduleRateWindow.set(clientIp, recent);

    const { to, subject, body, scheduleTime } = req.body as {
      to?: string;
      subject?: string;
      body?: string;
      scheduleTime?: string;
    };

    if (!to || !isValidEmailAddress(to)) {
      res
        .status(400)
        .json({ error: "Please enter a valid recipient email address." });
      return;
    }
    if (!subject || !subject.trim()) {
      res.status(400).json({ error: "Subject cannot be empty." });
      return;
    }
    if (!body || !body.trim()) {
      res.status(400).json({ error: "Message body cannot be empty." });
      return;
    }
    if (!scheduleTime || !scheduleTime.trim()) {
      res.status(400).json({ error: "Schedule time is required." });
      return;
    }

    res.json({
      ok: true,
      status: "scheduled",
      to: to.trim(),
      subject: subject.trim(),
      scheduleTime: scheduleTime.trim(),
      processedAt: new Date().toISOString(),
    });
  });

  // Analyze email: 2-line summary, AI score (0-100), and reply draft (never auto-sent)
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { senderName, senderEmail, subject, body, tone = "professional" } =
        req.body as {
          senderName?: string;
          senderEmail?: string;
          subject?: string;
          body?: string;
          tone?: string;
        };

      if (!subject || !body) {
        res.status(400).json({ error: "Email subject and body are required." });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Analyze this incoming email and produce:
1. A strict 2-line executive summary (exactly two crisp sentences separated by a space, maximum ~35 words total).
2. An AI priority score from 0 to 100 (90-100 = urgent/high-value human communication like interviews, deadlines, executive requests; 50-89 = normal operational updates, bills, receipts, team updates; 0-49 = newsletters, promos, automated digests).
3. A short 1-sentence reason for the score.
4. A thoughtful, ready-to-review reply draft in a ${tone} tone addressed to the sender. Do NOT include a Subject line in the reply draft.

Sender: ${senderName || "Unknown"} <${senderEmail || ""}>
Subject: ${subject}
Body:
${body}`,
        config: {
          systemInstruction:
            "You are MailMind OS's executive email intelligence engine. Return concise, accurate, human-sounding output. Never invent facts not present in the email.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description:
                  "Crisp 2-sentence summary of the email, ~25-40 words.",
              },
              aiScore: {
                type: Type.INTEGER,
                description: "Priority score between 0 and 100.",
              },
              scoreReason: {
                type: Type.STRING,
                description: "Brief 6-12 word explanation of the priority score.",
              },
              replyDraft: {
                type: Type.STRING,
                description:
                  "Ready-to-review email reply draft in the requested tone.",
              },
            },
            required: ["summary", "aiScore", "scoreReason", "replyDraft"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to analyze email with Gemini AI.";
      res.status(500).json({ error: message });
    }
  });

  // Re-draft reply in a selected tone or with user guidance
  app.post("/api/ai/redraft", async (req, res) => {
    try {
      const {
        senderName,
        subject,
        body,
        tone = "professional",
        instruction = "",
      } = req.body as {
        senderName?: string;
        subject?: string;
        body?: string;
        tone?: string;
        instruction?: string;
      };

      if (!subject || !body) {
        res.status(400).json({ error: "Email subject and body are required." });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Write an email reply draft to ${senderName || "the sender"} for the following email.
Requested tone: ${tone}.
${instruction ? `Extra guidance from user: ${instruction}` : ""}

Subject: ${subject}
Original Email:
${body}`,
        config: {
          systemInstruction:
            "You are an executive email assistant. Write only the email reply body (no subject line, no markdown code blocks). Keep it natural, polite, and concise.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyDraft: {
                type: Type.STRING,
                description: "The revised reply body text.",
              },
            },
            required: ["replyDraft"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to regenerate reply draft.";
      res.status(500).json({ error: message });
    }
  });

  // Hinglish & Natural Language Semantic Search
  app.post("/api/ai/search", async (req, res) => {
    try {
      const { query, emails } = req.body as {
        query?: string;
        emails?: SearchCandidate[];
      };

      if (!query || !Array.isArray(emails)) {
        res.status(400).json({ error: "Search query and email list required." });
        return;
      }

      const ai = getGeminiClient();
      const compactIndex = emails.map((e) => ({
        id: e.id,
        from: `${e.senderName} <${e.senderEmail}>`,
        subject: e.subject,
        snippet: e.snippet,
        category: e.category,
        score: e.aiScore,
      }));

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `User Search Query (may be Hinglish, Hindi-English mix, or English): "${query}"

Understand intent accurately across Hinglish & English! Examples:
- "interview wala mail" / "job wala" / "naukri" -> job interviews, recruiter emails, coding rounds, offer letters
- "paisa wala" / "bill" / "kharcha" / "invoice" -> invoices, bank alerts, AWS billing, payments, receipts
- "urgent kaam" / "zaroori" -> high-priority Focus emails, deadlines, client approvals
- "travel" / "flight" / "ghoomna" -> flight tickets, hotel bookings, itineraries
- "faltu" / "spam" / "newsletter" -> promotional digests and subscriptions

Return the matching email IDs ordered from best match to weakest match, plus a short 4-8 word reason for each match.

Emails:
${JSON.stringify(compactIndex)}`,
        config: {
          systemInstruction:
            "You are a bilingual Hinglish + English email search engine. Only return IDs that genuinely match the user's intent.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interpretedIntent: {
                type: Type.STRING,
                description:
                  "Short plain-language summary of what the Hinglish/English query is looking for (e.g. 'Job interviews & recruiter emails').",
              },
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    reason: {
                      type: Type.STRING,
                      description: "Brief 4-8 word reason this email matched.",
                    },
                  },
                  required: ["id", "reason"],
                },
              },
            },
            required: ["interpretedIntent", "matches"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Hinglish search failed.";
      res.status(500).json({ error: message });
    }
  });

  // Compose assist endpoint
  app.post("/api/ai/compose", async (req, res) => {
    try {
      const { recipient, subject, prompt } = req.body as {
        recipient?: string;
        subject?: string;
        prompt?: string;
      };

      if (!prompt) {
        res.status(400).json({ error: "Brief prompt is required to draft." });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Draft a crisp, professional email.
Recipient: ${recipient || "Recipient"}
Subject context: ${subject || "None provided"}
User notes: ${prompt}`,
        config: {
          systemInstruction:
            "Return JSON with a concise subject line and a polished email body ready for human review.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ["subject", "body"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to draft email.";
      res.status(500).json({ error: message });
    }
  });

  // Daily Digest AI Action Items extraction
  app.post("/api/dailyDigest", async (req, res) => {
    try {
      const { emails } = req.body as {
        emails?: Array<{
          id: string;
          senderName: string;
          subject: string;
          aiScore: number;
          aiSummary: string;
        }>;
      };

      if (!Array.isArray(emails) || emails.length === 0) {
        res.status(400).json({ error: "Emails list required for Daily Digest." });
        return;
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Extract up to 4 crisp, high-impact AI Action Items from today's top emails. Each action item should be specific, concise (8-14 words), and include who/what needs attention.

Emails:
${JSON.stringify(emails.slice(0, 8))}`,
        config: {
          systemInstruction:
            "You are MailMind OS's Daily Digest agent. Return actionable, factual tasks only from the provided emails.",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              actionItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    emailId: { type: Type.STRING },
                    task: { type: Type.STRING },
                    priority: { type: Type.STRING },
                  },
                  required: ["emailId", "task", "priority"],
                },
              },
            },
            required: ["actionItems"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to extract Daily Digest action items.";
      res.status(500).json({ error: message });
    }
  });

  const httpServer = http.createServer(app);
  const hmrDisabled = process.env.DISABLE_HMR === "true";

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    if (hmrDisabled) {
      app.get("/@vite/client", (_req, res) => {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.send(`
const sheetsMap = new Map();
function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    document.head.appendChild(style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
function injectQuery(url, queryToInject) {
  if (url[0] !== "." && url[0] !== "/") return url;
  const pathname = url.replace(/[?#].*$/, "");
  const { search, hash } = new URL(url, "http://vite.dev");
  return pathname + "?" + queryToInject + (search ? "&" + search.slice(1) : "") + (hash || "");
}
class ErrorOverlay extends HTMLElement {}
export { ErrorOverlay, createHotContext, injectQuery, removeStyle, updateStyle };
`);
      });
    }

    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`MailMind OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
