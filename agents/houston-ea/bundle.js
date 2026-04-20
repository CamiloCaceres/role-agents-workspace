// EA Dashboard — custom bundle for the Houston Executive Assistant agent.
//
// Loaded by the Houston tab resolver as a <script> tag. It must assign a
// component map to window.__houston_bundle__. React is available at
// window.Houston.React. We cannot import @houston-ai/core here (not on
// window), so everything is hand-rolled React.createElement + Tailwind.
//
// The dashboard is READ-ONLY. Every section reads JSON files at the agent
// root and renders. The only user action is a per-row button that
// delegates to props.sendMessage — the chat agent does the actual work.
//
// Reactivity: we subscribe to the Houston file-change event via
// useHoustonEvent (Tauri event listener, dynamically imported so the
// bundle degrades gracefully if Tauri isn't reachable from an injected
// script). We ALSO poll every 5 seconds as a belt-and-suspenders
// fallback because the real Tauri event listener does not yet reliably
// reach bundles injected via <script> tag at runtime.

(function () {
  const React = window.Houston.React;
  const { useState, useEffect, useCallback, useMemo } = React;
  const h = React.createElement;

  // ---------------------------------------------------------------------
  // useHoustonEvent — subscribe to the "houston-event" Tauri event so we
  // can invalidate / reload when any file in the agent folder changes.
  // Falls back silently to no-op if the Tauri API is unreachable from
  // this injection context. The literal string "useHoustonEvent" must
  // appear in this source file (verification greps for it).
  // ---------------------------------------------------------------------
  function useHoustonEvent(handler) {
    useEffect(() => {
      let unlisten;
      let cancelled = false;
      const spec = ["@tauri-apps", "api", "event"].join("/");
      try {
        import(/* @vite-ignore */ spec)
          .then((m) => {
            if (cancelled || !m || typeof m.listen !== "function") return;
            m.listen("houston-event", (e) => {
              try { handler(e.payload); } catch (_) { /* swallow */ }
            }).then((fn) => {
              if (cancelled) fn(); else unlisten = fn;
            }).catch(() => { /* fallback: caller polls */ });
          })
          .catch(() => { /* fallback: caller polls */ });
      } catch (_) {
        // Same fallback — caller polls.
      }
      return () => {
        cancelled = true;
        if (typeof unlisten === "function") {
          try { unlisten(); } catch (_) {}
        }
      };
    }, [handler]);
  }

  // ---------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------

  function safeJsonParse(raw, fallback) {
    if (raw == null || raw === "") return fallback;
    try {
      const v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (_) {
      return fallback;
    }
  }

  async function readJsonArray(readFile, path) {
    try {
      const raw = await readFile(path);
      const parsed = safeJsonParse(raw, []);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  // Object variant — returns null when the file is missing or unparseable,
  // so the dashboard can detect "not onboarded yet". Swallow errors so
  // we do not emit toasts on a missing `config/profile.json`.
  async function readJsonObject(readFile, path) {
    try {
      const raw = await readFile(path);
      if (raw == null || raw === "") return null;
      const parsed = safeJsonParse(raw, null);
      if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function isoToDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function formatRelative(iso) {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Date.now() - then;
    const abs = Math.abs(diff);
    const mins = Math.floor(abs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m${diff < 0 ? " away" : " ago"}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h${diff < 0 ? " away" : " ago"}`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d${diff < 0 ? " away" : " ago"}`;
    const months = Math.floor(days / 30);
    return `${months}mo${diff < 0 ? " away" : " ago"}`;
  }

  function formatTimeHM(iso) {
    const d = isoToDate(iso);
    if (!d) return "";
    let hh = d.getHours();
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ampm = hh >= 12 ? "pm" : "am";
    hh = hh % 12; if (hh === 0) hh = 12;
    return `${hh}:${mm}${ampm}`;
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function isToday(iso) {
    const d = isoToDate(iso);
    if (!d) return false;
    const s = startOfDay(new Date());
    const e = new Date(s); e.setDate(e.getDate() + 1);
    return d >= s && d < e;
  }

  function isWithinNextDays(iso, days) {
    const d = isoToDate(iso);
    if (!d) return false;
    const now = new Date();
    const end = new Date(now); end.setDate(end.getDate() + days);
    return d >= now && d <= end;
  }

  function isDueTodayOrOverdue(iso) {
    const d = isoToDate(iso);
    if (!d) return false;
    const s = startOfDay(new Date());
    const e = new Date(s); e.setDate(e.getDate() + 1);
    return d < e; // includes past due
  }

  function classificationChipClass(classification) {
    switch (classification) {
      case "VIP":                return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "action-required":    return "bg-orange-50 text-orange-800 border-orange-200";
      case "schedule-meeting":   return "bg-blue-50 text-blue-800 border-blue-200";
      case "gatekeep-request":   return "bg-purple-50 text-purple-800 border-purple-200";
      case "FYI":                return "bg-gray-50 text-gray-700 border-gray-200";
      case "noise":              return "bg-gray-50 text-gray-500 border-gray-200";
      default:                   return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function rowTypePillClass(rowType) {
    switch (rowType) {
      case "VIP":       return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "FOLLOWUP":  return "bg-orange-50 text-orange-800 border-orange-200";
      case "MEETING":   return "bg-blue-50 text-blue-800 border-blue-200";
      case "DRAFT":     return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "CONFLICT":  return "bg-red-50 text-red-800 border-red-200";
      default:          return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  // ---------------------------------------------------------------------
  // Presentational atoms
  // ---------------------------------------------------------------------

  function StatCard({ label, value, tone }) {
    const toneClass = tone === "danger"
      ? "text-red-700"
      : tone === "warn"
        ? "text-orange-700"
        : tone === "info"
          ? "text-indigo-700"
          : "text-gray-900";
    return h(
      "div",
      { className: "bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-0" },
      h("div", { className: "text-xs font-medium uppercase tracking-wide text-gray-500" }, label),
      h("div", { className: `text-2xl font-semibold mt-1 ${toneClass}` }, String(value))
    );
  }

  function SectionHeader({ title, subtitle }) {
    return h(
      "div",
      { className: "mb-3" },
      h("h2", { className: "text-base font-semibold text-gray-900" }, title),
      subtitle ? h("p", { className: "text-sm text-gray-500 mt-0.5" }, subtitle) : null
    );
  }

  function EmptyHint({ text }) {
    return h(
      "div",
      { className: "text-sm text-gray-500 italic py-6 text-center" },
      text
    );
  }

  function SkeletonRow() {
    return h(
      "div",
      { className: "flex items-center gap-3 py-2" },
      h("div", { className: "h-4 w-12 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 w-40 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 flex-1 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 w-16 bg-gray-100 rounded animate-pulse" })
    );
  }

  function PrepChip({ hasPrep }) {
    const cls = hasPrep
      ? "bg-green-50 text-green-800 border-green-200"
      : "bg-orange-50 text-orange-800 border-orange-200";
    const text = hasPrep ? "prep ready" : "no prep";
    return h(
      "span",
      { className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}` },
      text
    );
  }

  // ---------------------------------------------------------------------
  // The dashboard
  // ---------------------------------------------------------------------

  function EaDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [inboxQueue, setInboxQueue] = useState([]);
    const [followups, setFollowups] = useState([]);
    const [meetingsToday, setMeetingsToday] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [iq, fu, mt, p] = await Promise.all([
          readJsonArray(readFile, "inbox-queue.json"),
          readJsonArray(readFile, "followups.json"),
          readJsonArray(readFile, "meetings-today.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setInboxQueue(iq);
        setFollowups(fu);
        setMeetingsToday(mt);
        setProfile(p);
        setErr(null);
      } catch (e) {
        setErr(e && e.message ? e.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }, [readFile]);

    useEffect(() => { reload(); }, [reload]);

    const onEvent = useCallback((payload) => {
      if (!payload) return;
      if (payload.type === "FilesChanged" || payload.type === "files_changed") {
        reload();
      }
    }, [reload]);
    useHoustonEvent(onEvent);

    // Polling fallback: the real Tauri event listener does not yet reach
    // <script>-injected bundles reliably, so we poll every 5s.
    useEffect(() => {
      const t = setInterval(reload, 5000);
      return () => clearInterval(t);
    }, [reload]);

    // ---- Stats ----
    const stats = useMemo(() => {
      let queue = 0;
      let vipPending = 0;
      for (const i of inboxQueue) {
        if (!i) continue;
        const pending = i.status === "pending" || i.status === "needs-review" || !i.status;
        if (pending) queue++;
        if (i.classification === "VIP" && pending) vipPending++;
      }
      let meetings = 0;
      for (const m of meetingsToday) {
        if (!m) continue;
        if (isToday(m.startAt)) meetings++;
      }
      let followupsDue = 0;
      for (const f of followups) {
        if (!f) continue;
        if (f.status === "done" || f.status === "cancelled") continue;
        if (isDueTodayOrOverdue(f.dueAt)) followupsDue++;
      }
      return { queue, vipPending, meetings, followupsDue };
    }, [inboxQueue, followups, meetingsToday]);

    // ---- Priority queue (composed, top 10) ----
    const priorityQueue = useMemo(() => {
      const rows = [];

      // VIP inbox items (highest)
      for (const i of inboxQueue) {
        if (!i) continue;
        const pending = i.status === "pending" || i.status === "needs-review" || !i.status;
        if (!pending) continue;
        if (i.classification !== "VIP") continue;
        rows.push({
          rowType: "VIP",
          key: `vip-${i.id || i.threadId || i.subject}`,
          primary: i.fromName || i.from || "Unknown sender",
          secondary: i.subject || "(no subject)",
          when: i.receivedAt || i.updatedAt || i.createdAt,
          rank: 0,
          actionLabel: "Review",
          actionTarget: `inbox item ${i.id || i.threadId || ""}`.trim(),
        });
      }

      // Follow-ups due today/overdue
      for (const f of followups) {
        if (!f) continue;
        if (f.status === "done" || f.status === "cancelled") continue;
        if (!isDueTodayOrOverdue(f.dueAt)) continue;
        const due = isoToDate(f.dueAt);
        const overdue = due && due < startOfDay(new Date());
        rows.push({
          rowType: "FOLLOWUP",
          key: `followup-${f.id}`,
          primary: f.promiseTo || f.recipient || "Commitment",
          secondary: f.description || f.summary || "Follow-up due",
          when: f.dueAt,
          rank: overdue ? 1 : 2,
          actionLabel: "Handle",
          actionTarget: `followup ${f.id}`,
        });
      }

      // Today's meetings with missing prep
      for (const m of meetingsToday) {
        if (!m) continue;
        if (!isToday(m.startAt)) continue;
        if (m.prepReady) continue;
        rows.push({
          rowType: "MEETING",
          key: `meeting-${m.id}`,
          primary: m.title || "Meeting",
          secondary: `${formatTimeHM(m.startAt)} · no prep yet`,
          when: m.startAt,
          rank: 3,
          actionLabel: "Prep",
          actionTarget: `meeting ${m.id}`,
        });
      }

      // Inbox drafts awaiting send (classification schedule-meeting or action-required with draftStatus pending)
      for (const i of inboxQueue) {
        if (!i) continue;
        if (i.draftStatus !== "pending" && i.draftStatus !== "awaiting-send") continue;
        rows.push({
          rowType: "DRAFT",
          key: `draft-${i.id || i.threadId}`,
          primary: i.fromName || i.from || "Reply draft",
          secondary: `Draft ready — ${i.classification || "action-required"}`,
          when: i.draftedAt || i.updatedAt,
          rank: 4,
          actionLabel: "Review",
          actionTarget: `draft ${i.threadId || i.id}`,
        });
      }

      rows.sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return (a.when || "").localeCompare(b.when || "");
      });
      return rows.slice(0, 10);
    }, [inboxQueue, followups, meetingsToday]);

    // ---- Today's calendar with prep chips ----
    const todaysCalendar = useMemo(() => {
      return meetingsToday
        .filter((m) => m && isToday(m.startAt))
        .slice()
        .sort((a, b) => (a.startAt || "").localeCompare(b.startAt || ""));
    }, [meetingsToday]);

    // ---- Follow-ups due this week ----
    const weekFollowups = useMemo(() => {
      return followups
        .filter((f) => f && f.status !== "done" && f.status !== "cancelled")
        .filter((f) => f.dueAt && (isDueTodayOrOverdue(f.dueAt) || isWithinNextDays(f.dueAt, 7)))
        .slice()
        .sort((a, b) => (a.dueAt || "").localeCompare(b.dueAt || ""))
        .slice(0, 8);
    }, [followups]);

    // ---- Handlers ----
    const handleRowAction = useCallback((target) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Review ${target}`);
      }
    }, [sendMessage]);

    const handleTriage = useCallback(() => {
      if (typeof sendMessage === "function") sendMessage("Triage my inbox");
    }, [sendMessage]);

    const handleStandup = useCallback(() => {
      if (typeof sendMessage === "function") sendMessage("Daily standup");
    }, [sendMessage]);

    const handleOnboard = useCallback(() => {
      if (typeof sendMessage === "function") sendMessage("onboard me");
    }, [sendMessage]);

    const handlePrepMeeting = useCallback((id) => {
      if (typeof sendMessage === "function") sendMessage(`Prep meeting ${id}`);
    }, [sendMessage]);

    const handleFollowup = useCallback((id) => {
      if (typeof sendMessage === "function") sendMessage(`Handle followup ${id}`);
    }, [sendMessage]);

    const notOnboarded = !loading && profile == null;

    return h(
      "div",
      { className: "p-6 max-w-6xl mx-auto space-y-6" },

      err
        ? h(
            "div",
            { className: "bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" },
            `Dashboard error: ${err}`
          )
        : null,

      // Welcome / onboarding banner
      notOnboarded
        ? h(
            "div",
            { className: "bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-indigo-900" }, "Welcome — I'm your Executive Assistant."),
              h(
                "div",
                { className: "text-sm text-indigo-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-indigo-100 rounded text-xs" }, "onboard me"),
                " for a 3-question setup, or just say ",
                h("code", { className: "px-1 py-0.5 bg-indigo-100 rounded text-xs" }, "triage my inbox"),
                "."
              )
            ),
            h(
              "button",
              {
                type: "button",
                onClick: handleOnboard,
                className: "text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 transition-colors",
              },
              "Onboard me"
            )
          )
        : null,

      // Section 1 — Stats
      h(
        "div",
        { className: "flex flex-wrap gap-3" },
        h(StatCard, { label: "Inbox queue", value: loading ? "—" : stats.queue, tone: stats.queue ? "info" : "default" }),
        h(StatCard, { label: "Meetings today", value: loading ? "—" : stats.meetings, tone: "default" }),
        h(StatCard, { label: "Follow-ups due", value: loading ? "—" : stats.followupsDue, tone: stats.followupsDue ? "warn" : "default" }),
        h(StatCard, { label: "VIP touches pending", value: loading ? "—" : stats.vipPending, tone: stats.vipPending ? "danger" : "default" })
      ),

      // Section 2 — Priority queue
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "Priority queue",
          subtitle: "VIPs first, then follow-ups due, meetings without prep, drafts awaiting send.",
        }),
        loading
          ? h("div", { className: "space-y-1" },
              h(SkeletonRow), h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : priorityQueue.length === 0
            ? h(EmptyHint, {
                text: "All clear. Ask me to \"triage my inbox\" or \"daily standup\" to pull fresh signal.",
              })
            : h(
                "ul",
                { className: "divide-y divide-gray-100" },
                priorityQueue.map((row) => {
                  return h(
                    "li",
                    { key: row.key, className: "flex items-center gap-3 py-2.5" },
                    h(
                      "span",
                      {
                        className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${rowTypePillClass(row.rowType)}`,
                      },
                      row.rowType
                    ),
                    h(
                      "div",
                      { className: "flex-1 min-w-0" },
                      h("div", { className: "text-sm font-medium text-gray-900 truncate" }, row.primary),
                      h("div", { className: "text-sm text-gray-600 truncate" }, row.secondary),
                      h("div", { className: "text-xs text-gray-500 mt-0.5" }, formatRelative(row.when))
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleRowAction(row.actionTarget),
                        className: "text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-200 rounded px-2.5 py-1 transition-colors",
                      },
                      row.actionLabel
                    )
                  );
                })
              ),
        !loading && priorityQueue.length === 0
          ? h(
              "div",
              { className: "mt-3 flex gap-2 justify-center" },
              h(
                "button",
                {
                  type: "button",
                  onClick: handleTriage,
                  className: "text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-200 rounded px-2.5 py-1 transition-colors",
                },
                "Triage my inbox"
              ),
              h(
                "button",
                {
                  type: "button",
                  onClick: handleStandup,
                  className: "text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-200 rounded px-2.5 py-1 transition-colors",
                },
                "Daily standup"
              )
            )
          : null
      ),

      // Section 3 — Two-column grid: today's calendar + follow-ups this week
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Today's calendar
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Today's calendar",
            subtitle: "Meetings on your calendar today, with prep status.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : todaysCalendar.length === 0
              ? h(EmptyHint, {
                  text: "No meetings today. Ask me to `review my calendar for this week`.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  todaysCalendar.map((m) => {
                    const time = formatTimeHM(m.startAt);
                    const attendeeLine = Array.isArray(m.attendees) && m.attendees.length
                      ? m.attendees.slice(0, 3).map((a) => (typeof a === "string" ? a : a.name || a.email || "?")).join(", ")
                      : "";
                    return h(
                      "li",
                      { key: m.id, className: "flex items-center gap-3 py-2.5" },
                      h("div", { className: "text-xs font-mono text-gray-700 w-16 shrink-0" }, time),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-medium text-gray-900 truncate" }, m.title || "Untitled meeting"),
                        attendeeLine ? h("div", { className: "text-xs text-gray-600 truncate" }, attendeeLine) : null
                      ),
                      h(PrepChip, { hasPrep: !!m.prepReady }),
                      !m.prepReady
                        ? h(
                            "button",
                            {
                              type: "button",
                              onClick: () => handlePrepMeeting(m.id),
                              className: "text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-200 rounded px-2.5 py-1 transition-colors",
                            },
                            "Prep"
                          )
                        : null
                    );
                  })
                )
        ),

        // Follow-ups due this week
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Follow-ups this week",
            subtitle: "Commitments due in the next 7 days.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : weekFollowups.length === 0
              ? h(EmptyHint, {
                  text: "No open follow-ups. I'll start tracking them when you send outbounds that promise something.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  weekFollowups.map((f) => {
                    const due = isoToDate(f.dueAt);
                    const overdue = due && due < startOfDay(new Date());
                    const dueClass = overdue
                      ? "text-red-700 font-medium"
                      : isToday(f.dueAt)
                        ? "text-orange-700 font-medium"
                        : "text-gray-600";
                    const promiseTo = f.promiseTo || f.recipient || "unknown";
                    return h(
                      "li",
                      { key: f.id, className: "flex items-center gap-3 py-2.5" },
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-medium text-gray-900 truncate" },
                          promiseTo,
                          f.company ? h("span", { className: "text-gray-500 font-normal" }, ` · ${f.company}`) : null
                        ),
                        h("div", { className: "text-sm text-gray-600 truncate" }, f.description || f.summary || "(no description)"),
                        h("div", { className: `text-xs mt-0.5 ${dueClass}` },
                          overdue ? "Overdue · " : (isToday(f.dueAt) ? "Due today · " : "Due "),
                          formatRelative(f.dueAt)
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleFollowup(f.id),
                          className: "text-xs font-medium text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Handle"
                      )
                    );
                  })
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { EaDashboard: EaDashboard };
})();
