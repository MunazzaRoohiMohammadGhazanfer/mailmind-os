import type { Email } from "../types/email";

export const DEMO_EMAILS: Email[] = [
  {
    id: "em-101",
    senderName: "Ananya Deshmukh",
    senderEmail: "ananya.deshmukh@razorpay.com",
    senderInitials: "AD",
    subject: "Final Round Interview Invite — Senior Frontend Engineer (Payments Core)",
    snippet:
      "We loved your system design walkthrough! Can we lock in Thursday 3:00 PM IST for your final panel?",
    body: `Hi Munazza,

Great news from the hiring committee — your architecture walkthrough scored really well with our staff engineers.

We would love to invite you to the Final Engineering & Product Panel for the Senior Frontend Engineer (Payments Core) role in Bangalore / Hybrid.

Proposed slot: Thursday, Nov 26 at 3:00 PM – 4:15 PM IST
Panelists: Vikramjit Rao (VP Engineering) & Meera Nair (Staff Designer)

Please confirm if this time works for you, or share two alternate windows for Friday so I can lock the calendar invite and send the prep brief.

Best regards,
Ananya Deshmukh
Lead Technical Recruiter · Razorpay`,
    timestamp: "10:42 AM",
    isRead: false,
    isStarred: true,
    aiScore: 98,
    scoreReason: "Time-sensitive final interview invitation requiring slot confirmation.",
    category: "career",
    aiSummary:
      "Razorpay invited you to the Final Panel for Senior Frontend Engineer on Thursday at 3:00 PM IST. Confirm availability or propose Friday slots to receive the calendar invite.",
    aiReplyDraft: `Hi Ananya,

Thank you for the wonderful update! Thursday, Nov 26 from 3:00 PM to 4:15 PM IST works perfectly for me.

Please go ahead and lock the calendar invite—I look forward to speaking with Vikramjit and Meera and reviewing the prep brief.

Best regards,
Munazza`,
    draftStatus: "pending",
    isSubscription: false,
  },
  {
    id: "em-102",
    senderName: "Rohan Kapoor",
    senderEmail: "rohan@kinetixlabs.io",
    senderInitials: "RK",
    subject: "Urgent: Production Checkout Sign-Off Needed Before 5 PM Release",
    snippet:
      "Staging passed all E2E tests. Need your final approval on the Stripe webhook retry patch before release.",
    body: `Hey Munazza,

Quick heads up — QA just signed off on build v3.14.2 in staging. All 48 checkout & UPI fallback tests are green.

Before we trigger the 5:00 PM production deploy, we need your approval on PR #842 (Stripe & Razorpay webhook idempotency retry). Specifically, let us know if you want the max backoff capped at 30s or 60s in prod.

Let me know by 4:15 PM so DevOps can prep the release window.

Thanks,
Rohan`,
    timestamp: "9:58 AM",
    isRead: false,
    isStarred: true,
    aiScore: 95,
    scoreReason: "Production release blocker awaiting your sign-off before 4:15 PM.",
    category: "engineering",
    aiSummary:
      "Staging build v3.14.2 passed QA, and Rohan needs your sign-off on PR #842 before the 5 PM deploy. Confirm whether webhook backoff should cap at 30s or 60s by 4:15 PM.",
    aiReplyDraft: `Hi Rohan,

Great to hear staging is green. Let's cap the webhook idempotency backoff at 60s in production for safer retry headroom during gateway spikes.

You have my sign-off on PR #842—go ahead with the 5:00 PM release window.

Best,
Munazza`,
    draftStatus: "pending",
    isSubscription: false,
  },
  {
    id: "em-103",
    senderName: "Sarah Jenkins",
    senderEmail: "s.jenkins@linear.app",
    senderInitials: "SJ",
    subject: "Re: Technical Interview Take-Home Review & Next Steps",
    snippet:
      "Thanks for submitting the workspace sync prototype! Our engineering lead reviewed your repo today.",
    body: `Hi Munazza,

Thank you for sending over your workspace sync engine prototype over the weekend. Our engineering lead reviewed the CRDT conflict-resolution notes and was impressed by how clean the offline queue state machine is.

We are moving you forward to the live pair-programming interview. Could you share your availability next Monday or Tuesday (between 6:00 PM and 9:30 PM IST to overlap with San Francisco morning hours)?

Warmly,
Sarah Jenkins
Talent Partner · Linear`,
    timestamp: "Yesterday",
    isRead: false,
    isStarred: false,
    aiScore: 94,
    scoreReason: "Recruiter advancing your job application to live pair programming.",
    category: "career",
    aiSummary:
      "Linear approved your take-home prototype and invited you to a live pair-programming interview. Share your availability for Monday or Tuesday between 6:00 PM and 9:30 PM IST.",
    aiReplyDraft: `Hi Sarah,

Thank you for the thoughtful feedback on the prototype! I'd be thrilled to move forward to the pair-programming interview.

I am available both Monday and Tuesday between 6:30 PM and 9:00 PM IST. Please let me know which slot fits the team best.

Best regards,
Munazza`,
    draftStatus: "pending",
    isSubscription: false,
  },
  {
    id: "em-104",
    senderName: "Arjun Malhotra",
    senderEmail: "arjun@verveventures.in",
    senderInitials: "AM",
    subject: "Q4 Advisory Retainer Invoice #INV-2026-11 & Agreement",
    snippet:
      "Attached is the signed SOW for the Q4 AI product sprint. Please share your GST invoice to process payout.",
    body: `Hi Munazza,

Hope your week is going well! We've countersigned the Q4 Product & AI UX Advisory SOW ($4,500 / ₹3,80,000 retainer).

Whenever you have a moment today, please reply with your updated invoice (#INV-2026-11) and bank details so our finance team can clear the first milestone payout in Friday's NEFT batch.

Cheers,
Arjun Malhotra
Partner · Verve Ventures`,
    timestamp: "Yesterday",
    isRead: true,
    isStarred: false,
    aiScore: 91,
    scoreReason: "Client payout ready to process once you send the invoice.",
    category: "finance",
    aiSummary:
      "Verve Ventures countersigned your Q4 Advisory SOW and is ready to pay the retainer. Send invoice #INV-2026-11 today to catch Friday's NEFT payout batch.",
    aiReplyDraft: `Hi Arjun,

Thanks for sending over the countersigned SOW! I'm finalizing invoice #INV-2026-11 with our updated GST and NEFT details and will attach it shortly for Friday's batch.

Best regards,
Munazza`,
    draftStatus: "pending",
    isSubscription: false,
  },
  {
    id: "em-105",
    senderName: "Amazon Web Services",
    senderEmail: "no-reply-aws@amazon.com",
    senderInitials: "AW",
    subject: "AWS Billing Alert: Monthly Spend Reached $142.80 (85% of Budget)",
    snippet:
      "Your AWS account (ID: 8821-4490) has crossed 85% of your $165 monthly threshold in ap-south-1.",
    body: `Hello,

This is an automated AWS Budgets notification for account 8821-4490 (Production Mumbai).

Actual spend to date: $142.80 USD
Configured monthly budget: $165.00 USD
Primary cost driver: Amazon RDS db.t4g.medium ($84.20) & CloudFront egress ($36.40)

You can review your Cost Explorer breakdown in the AWS Billing Console to inspect any idle staging instances.`,
    timestamp: "Nov 23",
    isRead: true,
    isStarred: false,
    aiScore: 76,
    scoreReason: "Important infrastructure budget threshold notification.",
    category: "finance",
    aiSummary:
      "Your Mumbai AWS account reached $142.80, hitting 85% of your $165 monthly budget. RDS and CloudFront egress account for most of the spend.",
    aiReplyDraft: `Hi Team,

Flagging this AWS budget alert—our Mumbai production spend hit 85% ($142.80). Let's check for any idle staging RDS snapshots or uncached CloudFront routes before month-end.

Best,
Munazza`,
    draftStatus: "pending",
    isSubscription: false,
  },
  {
    id: "em-106",
    senderName: "IndiGo Airlines",
    senderEmail: "reservations@goindigo.in",
    senderInitials: "6E",
    subject: "Flight Itinerary & Web Check-In Open: DEL → BLR (PNR: K8M4QP)",
    snippet:
      "Your flight 6E-2145 departs tomorrow at 07:15 AM from Terminal 2. Web check-in is now open.",
    body: `Dear Munazza Ruhi,

Web check-in is now open for your upcoming IndiGo flight 6E-2145.

Route: New Delhi (DEL, T2) → Bengaluru (BLR, T1)
Departure: Nov 26, 07:15 AM · Arrival: 10:05 AM
Seat: 12A (Window) · PNR: K8M4QP

Baggage allowance: 15 kg check-in + 7 kg cabin bag. Please arrive at Terminal 2 at least 90 minutes prior to departure.`,
    timestamp: "Nov 23",
    isRead: false,
    isStarred: false,
    aiScore: 82,
    scoreReason: "Active travel itinerary with time-bound web check-in.",
    category: "travel",
    aiSummary:
      "Web check-in is open for IndiGo flight 6E-2145 (DEL to BLR) departing Nov 26 at 7:15 AM from Terminal 2. Your assigned seat is 12A under PNR K8M4QP.",
    aiReplyDraft: `Noted—completed web check-in for IndiGo 6E-2145 (PNR K8M4QP). Will reach Terminal 2 by 5:45 AM for the 7:15 AM departure.`,
    draftStatus: "pending",
    isSubscription: false,
  },
  {
    id: "em-107",
    senderName: "Priya Nair (HR TechCorp)",
    senderEmail: "priya.nair@cloudscale.dev",
    senderInitials: "PN",
    subject: "Coding Assessment Link — Staff UI Architect Role (48h Window)",
    snippet:
      "Hi Munazza, here is your HackerRank link for the Staff UI Architect screening round.",
    body: `Hi Munazza,

Thanks for applying to the Staff UI Architect opening at CloudScale!

As the next step in our interview process, please complete the 75-minute frontend architecture & performance debugging assessment using the link below within the next 48 hours.

Let me know if you need a deadline extension due to travel or work commitments.

Warm regards,
Priya Nair
Tech Talent Acquisition · CloudScale`,
    timestamp: "Nov 22",
    isRead: true,
    isStarred: false,
    aiScore: 88,
    scoreReason: "Job interview coding round with a 48-hour completion window.",
    category: "career",
    aiSummary:
      "CloudScale sent a 75-minute coding assessment for the Staff UI Architect role with a 48-hour deadline. Reply if you need an extension due to your upcoming travel.",
    aiReplyDraft: `Hi Priya,

Thank you for sending over the assessment link! Because I have a flight tomorrow morning, could I request a brief 24-hour extension so I can complete it with full focus on Friday evening?

Best regards,
Munazza`,
    draftStatus: "pending",
    isSubscription: false,
  },
  {
    id: "em-108",
    senderName: "HDFC Bank Alerts",
    senderEmail: "alerts@hdfcbank.net",
    senderInitials: "HD",
    subject: "Monthly Credit Card Statement Ready — Ending 4912 (₹24,680 Due)",
    snippet:
      "Your HDFC Regalia Gold statement for Nov 2026 is ready. Total amount due: ₹24,680 by Dec 08.",
    body: `Dear Customer,

Your HDFC Bank Credit Card statement for card ending 4912 is now generated.

Statement Period: 24 Oct 2026 – 23 Nov 2026
Total Amount Due: ₹24,680.00
Minimum Amount Due: ₹1,240.00
Payment Due Date: 08 Dec 2026

AutoPay is currently disabled on this card. Please pay via NetBanking or UPI before the due date to avoid late fees.`,
    timestamp: "Nov 22",
    isRead: true,
    isStarred: false,
    aiScore: 71,
    scoreReason: "Monthly bank credit card bill with upcoming payment due date.",
    category: "finance",
    aiSummary:
      "Your HDFC card (4912) statement is ready with ₹24,680.00 due by Dec 08, 2026. AutoPay is disabled, so manual UPI or NetBanking payment is required.",
    aiReplyDraft: `Hi,

Thanks for the statement reminder. I will clear the ₹24,680.00 balance via NetBanking before December 8 and enable AutoPay for future cycles.`,
    draftStatus: "pending",
    isSubscription: false,
  },
  {
    id: "em-109",
    senderName: "Product Hunt Daily",
    senderEmail: "digest@producthunt.com",
    senderInitials: "PH",
    subject: "Top 10 AI Developer Tools Launched Today — Plus Founder Notes",
    snippet:
      "See what makers shipped today: local-first SQL clients, terminal agents, and dark-mode UI kits.",
    body: `Good morning Maker!

Here are today's top-voted launches on Product Hunt:
1. PromptDiff Studio — Visual regression testing for LLM prompts
2. TermPilot — AI shell autocomplete in Rust
3. SlateUI — Minimalist monochrome React primitives

Click through to upvote your favorites or reply to feature your product.`,
    timestamp: "8:15 AM",
    isRead: false,
    isStarred: false,
    aiScore: 28,
    scoreReason: "Automated daily newsletter digest with low immediate urgency.",
    category: "subscription",
    aiSummary:
      "Daily Product Hunt roundup featuring top AI developer tools and UI kits launched today. No response or action is required.",
    aiReplyDraft: `Hi Product Hunt team,

Thanks for today's digest—no reply needed on my end.`,
    draftStatus: "pending",
    isSubscription: true,
    subscriptionId: "sub-ph",
    isUnsubscribed: false,
  },
  {
    id: "em-110",
    senderName: "Swiggy One Offers",
    senderEmail: "offers@mailer.swiggy.in",
    senderInitials: "SW",
    subject: "Flat 60% OFF Late Night Cravings + Zero Delivery Fee Tonight!",
    snippet:
      "Use code NIGHTFEAST on your favorite biryani and desserts before midnight. T&C apply.",
    body: `Hey Foodie!

Craving something delicious tonight? Unlock flat 60% off (up to ₹120) on orders above ₹199 across 450+ partner restaurants near you.

Use coupon: NIGHTFEAST at checkout before 11:59 PM.

You are receiving this promotional email as a Swiggy One subscriber.`,
    timestamp: "Yesterday",
    isRead: true,
    isStarred: false,
    aiScore: 12,
    scoreReason: "Promotional food delivery discount campaign.",
    category: "subscription",
    aiSummary:
      "Swiggy promotional offer advertising 60% off late-night food orders with code NIGHTFEAST before midnight. Pure marketing email.",
    aiReplyDraft: `No reply needed—promotional offer.`,
    draftStatus: "pending",
    isSubscription: true,
    subscriptionId: "sub-swiggy",
    isUnsubscribed: false,
  },
  {
    id: "em-111",
    senderName: "Figma Community",
    senderEmail: "newsletter@figma.com",
    senderInitials: "FG",
    subject: "What's New in Figma Variables & Auto-Layout Grid Tokens",
    snippet:
      "Explore 12 new design system templates and hear how Linear and Vercel structure dark mode tokens.",
    body: `Hi Designer,

This month in Figma Community:
- Multi-brand dark mode token architecture walkthrough
- Auto-layout responsive grid starter kits
- Config 2026 session recordings now live

Open Figma to duplicate the featured community files.`,
    timestamp: "Nov 22",
    isRead: true,
    isStarred: false,
    aiScore: 39,
    scoreReason: "Informational product newsletter with optional reading.",
    category: "subscription",
    aiSummary:
      "Monthly Figma newsletter covering dark-mode variable tokens, auto-layout templates, and Config recordings. Optional informational reading.",
    aiReplyDraft: `Thanks for sharing the new token architecture guides!`,
    draftStatus: "pending",
    isSubscription: true,
    subscriptionId: "sub-figma",
    isUnsubscribed: false,
  },
  {
    id: "em-112",
    senderName: "TLDR Tech Newsletter",
    senderEmail: "dan@tldrnewsletter.com",
    senderInitials: "TL",
    subject: "TLDR: Gemini 4 Benchmarks, TypeScript 7 Native Speedups & Postgres 18",
    snippet:
      "5-minute daily brief covering AI models, developer tooling, and big tech engineering blogs.",
    body: `TLDR Daily Tech Brief — Nov 25

• TypeScript 7 compiler benchmarks show 8x faster incremental builds
• Engineering deep dive: How Stripe handles 10M idempotent webhooks/hr
• Open-source local vector index benchmarks on Apple Silicon

Read the full 5-minute summary online.`,
    timestamp: "7:30 AM",
    isRead: false,
    isStarred: false,
    aiScore: 44,
    scoreReason: "Subscribed tech newsletter digest for passive reading.",
    category: "subscription",
    aiSummary:
      "Daily TLDR engineering brief covering TypeScript 7 build speedups, Stripe webhook scaling, and local vector benchmarks. Safe to read later or batch.",
    aiReplyDraft: `Thanks for the concise engineering roundup.`,
    draftStatus: "pending",
    isSubscription: true,
    subscriptionId: "sub-tldr",
    isUnsubscribed: false,
  },
  {
    id: "em-113",
    senderName: "Flipkart Big Deals",
    senderEmail: "deals@promo.flipkart.com",
    senderInitials: "FK",
    subject: "Price Drop Alert: Noise-Canceling Headphones & Mechanical Keyboards",
    snippet:
      "Items in your wishlist just dropped up to 40% for the Electronics Flash Sale.",
    body: `Hello Munazza,

Great news—two items from your Flipkart wishlist are on limited-time discount:
- Sony WH-1000XM5 Wireless Headphones — ₹21,990 (Save ₹8,000)
- Keychron K2 Pro QMK Mechanical Keyboard — ₹7,499

Sale ends tonight at 11:59 PM.`,
    timestamp: "Nov 21",
    isRead: true,
    isStarred: false,
    aiScore: 19,
    scoreReason: "Retail flash-sale promotion with low inbox priority.",
    category: "subscription",
    aiSummary:
      "Flipkart promotional alert highlighting wishlist price drops on Sony headphones and a Keychron keyboard until midnight. Automated marketing mail.",
    aiReplyDraft: `No reply needed—promotional price drop email.`,
    draftStatus: "pending",
    isSubscription: true,
    subscriptionId: "sub-flipkart",
    isUnsubscribed: false,
  },
  {
    id: "em-114",
    senderName: "Substack Weekly",
    senderEmail: "digest@substack.com",
    senderInitials: "SS",
    subject: "Pragmatic Engineer: Designing Zero-Latency Email Clients in 2026",
    snippet:
      "New essay from Gergely on local-first sync engines, keyboard-first UX, and AI triage pipelines.",
    body: `New post from The Pragmatic Engineer:

"How Modern Email Clients Achieve Sub-16ms Interactions"
We break down IndexedDB sync queues, optimistic UI state machines, and why human-in-the-loop AI drafting beats auto-send every time.

Read the full essay in your browser or the Substack app.`,
    timestamp: "Nov 20",
    isRead: true,
    isStarred: false,
    aiScore: 47,
    scoreReason: "Subscribed engineering essay digest.",
    category: "subscription",
    aiSummary:
      "New Pragmatic Engineer Substack issue on zero-latency email sync engines and human-in-the-loop AI drafting. Good weekend read with no action needed.",
    aiReplyDraft: `Great essay on local-first sync and human-in-the-loop AI drafting!`,
    draftStatus: "pending",
    isSubscription: true,
    subscriptionId: "sub-substack",
    isUnsubscribed: false,
  },
];
