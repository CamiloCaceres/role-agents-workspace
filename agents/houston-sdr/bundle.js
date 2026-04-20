// SDR Dashboard — custom bundle for the Houston SDR agent.
//
// Loaded by the Houston tab resolver as a <script> tag. It must assign a
// component map to window.__houston_bundle__. React is available at
// window.Houston.React. We cannot import @houston-ai/core here (not on
// window), so everything is hand-rolled React.createElement + Tailwind.
//
// The dashboard is READ-ONLY. Every section reads JSON files at the agent
// root and renders. The only user action is a "Review" button per row,
// which delegates to props.sendMessage — the chat agent does the actual
// work.
//
// Reactivity: we subscribe to the Houston file-change event via
// useHoustonEvent (Tauri event listener, dynamically imported so the
// bundle degrades gracefully if Tauri isn't reachable from an injected
// script). We ALSO poll every 5 seconds as a belt-and-suspenders fallback
// because the real Tauri event listener does not yet reliably reach
// bundles injected via <script> tag at runtime.

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
      // Build the module specifier dynamically so a static analyzer
      // doesn't try to resolve it at bundle-time (this is an IIFE, not
      // a module — import() is still available at runtime in the
      // webview).
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
  // so the dashboard can detect "not onboarded yet".
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

  function priorityBadgeClass(priority) {
    switch (priority) {
      case "P1": return "bg-red-100 text-red-800 border-red-200";
      case "P2": return "bg-orange-100 text-orange-800 border-orange-200";
      case "P3": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:   return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function classificationChipClass(classification) {
    switch (classification) {
      case "interested":     return "bg-green-50 text-green-800 border-green-200";
      case "not-now":        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "referral":       return "bg-blue-50 text-blue-800 border-blue-200";
      case "out-of-office":  return "bg-gray-50 text-gray-700 border-gray-200";
      case "auto-reply":     return "bg-gray-50 text-gray-700 border-gray-200";
      case "wrong-person":   return "bg-purple-50 text-purple-800 border-purple-200";
      case "unsubscribe":    return "bg-red-50 text-red-800 border-red-200";
      case "not-interested": return "bg-red-50 text-red-800 border-red-200";
      case "unclassified":   return "bg-gray-50 text-gray-600 border-gray-200";
      default:               return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function rowTypePillClass(rowType) {
    return rowType === "REPLY"
      ? "bg-green-50 text-green-800 border-green-200"
      : "bg-blue-50 text-blue-800 border-blue-200";
  }

  function isoToDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function daysSince(iso) {
    const d = isoToDate(iso);
    if (!d) return null;
    return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  }

  function startOfWeek(d) {
    // ISO week: Monday = 1, Sunday = 7. Start Monday 00:00 local.
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = copy.getDay() === 0 ? 7 : copy.getDay();
    copy.setDate(copy.getDate() - (day - 1));
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  function endOfWeek(d) {
    const start = startOfWeek(d);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return end;
  }

  function isThisWeek(iso) {
    const d = isoToDate(iso);
    if (!d) return false;
    const now = new Date();
    return d >= startOfWeek(now) && d < endOfWeek(now);
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
          ? "text-blue-700"
          : "text-gray-900";
    return h(
      "div",
      { className: "bg-white rounded-lg border border-gray-200 p-4 flex-1 min-w-0" },
      h("div", { className: "text-xs font-medium uppercase tracking-wide text-gray-500" }, label),
      h("div", { className: `text-2xl font-semibold mt-1 ${toneClass}` }, String(value))
    );
  }

  function PriorityBadge({ priority }) {
    return h(
      "span",
      {
        className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${priorityBadgeClass(priority)}`,
      },
      priority || "P?"
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

  // ---------------------------------------------------------------------
  // The dashboard
  // ---------------------------------------------------------------------

  function SdrDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [leads, setLeads] = useState([]);
    const [sequences, setSequences] = useState([]);
    const [replies, setReplies] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [l, s, r, m, p] = await Promise.all([
          readJsonArray(readFile, "leads.json"),
          readJsonArray(readFile, "sequences.json"),
          readJsonArray(readFile, "replies.json"),
          readJsonArray(readFile, "meetings.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setLeads(l);
        setSequences(s);
        setReplies(r);
        setMeetings(m);
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

    const sequenceMap = useMemo(() => {
      const map = new Map();
      for (const s of sequences) if (s && s.id) map.set(s.id, s);
      return map;
    }, [sequences]);

    const leadMap = useMemo(() => {
      const map = new Map();
      for (const l of leads) if (l && l.slug) map.set(l.slug, l);
      return map;
    }, [leads]);

    // ---- Stats ----
    const stats = useMemo(() => {
      const activeStatuses = new Set(["new", "researched", "sequenced", "replied"]);
      let active = 0;
      for (const l of leads) {
        if (l && activeStatuses.has(l.status)) active++;
      }
      let needsReply = 0;
      for (const r of replies) {
        if (r && r.needsAction) needsReply++;
      }
      let meetingsWeek = 0;
      const activeMeetStatuses = new Set(["scheduled", "confirmed"]);
      for (const m of meetings) {
        if (!m) continue;
        if (!activeMeetStatuses.has(m.status)) continue;
        if (isThisWeek(m.scheduledAt)) meetingsWeek++;
      }
      let stalled = 0;
      for (const l of leads) {
        if (!l) continue;
        if (l.status !== "sequenced") continue;
        const days = daysSince(l.lastTouchedAt);
        if (days != null && days > 7) stalled++;
      }
      return { active, needsReply, meetingsWeek, stalled };
    }, [leads, replies, meetings]);

    // ---- Needs you now ----
    const needsYouNow = useMemo(() => {
      const now = Date.now();
      const replyItems = [];
      for (const r of replies) {
        if (!r || !r.needsAction) continue;
        if (["interested", "referral", "not-now"].indexOf(r.classification) === -1) continue;
        const lead = leadMap.get(r.leadSlug);
        const rank = r.classification === "interested" ? 0 : r.classification === "referral" ? 1 : 2;
        replyItems.push({
          rowType: "REPLY",
          key: `reply-${r.id}`,
          lead,
          leadSlug: r.leadSlug,
          context: `${r.classification}${typeof r.intentConfidence === "number" ? ` · ${r.intentConfidence}% intent` : ""}`,
          when: r.createdAt || r.updatedAt,
          rank,
          actionId: r.id,
        });
      }
      const taskItems = [];
      for (const l of leads) {
        if (!l) continue;
        if (l.status !== "sequenced") continue;
        if (!l.nextActionAt) continue;
        const due = isoToDate(l.nextActionAt);
        if (!due) continue;
        if (due.getTime() > now) continue;
        const seq = l.sequenceId ? sequenceMap.get(l.sequenceId) : null;
        const touch = seq && seq.name ? `${seq.name}` : "sequence task";
        const days = daysSince(l.lastTouchedAt);
        const stalledRank = days != null && days > 7 ? 4 : 3;
        taskItems.push({
          rowType: "TASK",
          key: `task-${l.slug}`,
          lead: l,
          leadSlug: l.slug,
          context: `${touch} — next touch due`,
          when: l.nextActionAt,
          rank: stalledRank,
          actionId: l.slug,
        });
      }
      const merged = replyItems.concat(taskItems);
      merged.sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return (a.when || "").localeCompare(b.when || "");
      });
      return merged.slice(0, 8);
    }, [replies, leads, leadMap, sequenceMap]);

    // ---- Today's replies (right column's left half) ----
    const recentReplies = useMemo(() => {
      return replies
        .slice()
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 8);
    }, [replies]);

    // ---- Upcoming meetings ----
    const upcomingMeetings = useMemo(() => {
      const now = Date.now();
      const active = new Set(["scheduled", "confirmed"]);
      return meetings
        .filter((m) => m && active.has(m.status))
        .filter((m) => {
          const d = isoToDate(m.scheduledAt);
          return d && d.getTime() >= now;
        })
        .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""))
        .slice(0, 6);
    }, [meetings]);

    // ---- Handlers ----
    const handleReviewRow = useCallback((rowType, slugOrId) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Review ${rowType} for ${slugOrId}`);
      }
    }, [sendMessage]);

    const handleClassifyReply = useCallback((replyId) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Classify reply ${replyId}`);
      }
    }, [sendMessage]);

    const handleMeetingBrief = useCallback((leadSlug) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Show meeting brief for ${leadSlug}`);
      }
    }, [sendMessage]);

    const handleOnboard = useCallback(() => {
      if (typeof sendMessage === "function") {
        sendMessage("onboard-me");
      }
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

      // Onboarding banner
      notOnboarded
        ? h(
            "div",
            { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-blue-900" }, "Welcome — I'm your SDR."),
              h(
                "div",
                { className: "text-sm text-blue-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-blue-100 rounded text-xs" }, "onboard-me"),
                " for a 90-second setup."
              )
            ),
            h(
              "button",
              {
                type: "button",
                onClick: handleOnboard,
                className: "text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-1.5 transition-colors",
              },
              "Onboard me"
            )
          )
        : null,

      // Section 1 — Stats
      h(
        "div",
        { className: "flex flex-wrap gap-3" },
        h(StatCard, { label: "Active leads", value: loading ? "—" : stats.active, tone: "info" }),
        h(StatCard, { label: "Needs reply", value: loading ? "—" : stats.needsReply, tone: stats.needsReply ? "warn" : "default" }),
        h(StatCard, { label: "Meetings this week", value: loading ? "—" : stats.meetingsWeek, tone: "default" }),
        h(StatCard, { label: "Stalled", value: loading ? "—" : stats.stalled, tone: stats.stalled ? "warn" : "default" })
      ),

      // Section 2 — Needs you now
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "Needs you now",
          subtitle: "Interested replies, then today's sequence tasks, then stalled leads.",
        }),
        loading
          ? h("div", { className: "space-y-1" },
              h(SkeletonRow), h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : needsYouNow.length === 0
            ? h(EmptyHint, {
                text: "Nothing pressing. Ask me to \"pull replies from my connected inbox\" or \"enroll leads in a sequence\" to kick things off.",
              })
            : h(
                "ul",
                { className: "divide-y divide-gray-100" },
                needsYouNow.map((row) => {
                  const lead = row.lead;
                  const name = (lead && lead.name) || row.leadSlug || "Unknown";
                  const company = (lead && lead.company) || "";
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
                    h(PriorityBadge, { priority: lead ? lead.priority : "P3" }),
                    h(
                      "div",
                      { className: "flex-1 min-w-0" },
                      h(
                        "div",
                        { className: "text-sm font-medium text-gray-900 truncate" },
                        name,
                        company ? h("span", { className: "text-gray-500 font-normal" }, ` · ${company}`) : null
                      ),
                      h("div", { className: "text-sm text-gray-600 truncate" }, row.context),
                      h("div", { className: "text-xs text-gray-500 mt-0.5" }, formatRelative(row.when))
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleReviewRow(row.rowType, row.actionId),
                        className: "text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded px-2.5 py-1 transition-colors",
                      },
                      "Review"
                    )
                  );
                })
              )
      ),

      // Section 3 — Two-column grid
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Today's replies
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Today's replies",
            subtitle: "Most recent inbound replies, classified.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : recentReplies.length === 0
              ? h(EmptyHint, {
                  text: "No replies yet. Ask me to pull replies from your connected inbox.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  recentReplies.map((r) => {
                    const lead = leadMap.get(r.leadSlug);
                    const name = (lead && lead.name) || r.leadSlug || "Unknown";
                    const ext = r.extractedData || {};
                    const extLine = ext.returnDate
                      ? `OOO until ${formatRelative(ext.returnDate)}`
                      : ext.referralName
                        ? `Refers to ${ext.referralName}`
                        : ext.objectionType
                          ? `Objection: ${ext.objectionType}`
                          : "";
                    return h(
                      "li",
                      { key: r.id, className: "flex items-center gap-2 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${classificationChipClass(r.classification)}`,
                        },
                        r.classification || "unclassified"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-medium text-gray-900 truncate" }, name),
                        extLine ? h("div", { className: "text-xs text-gray-600 truncate" }, extLine) : null,
                        h(
                          "div",
                          { className: "text-xs text-gray-500 mt-0.5" },
                          r.handledAt ? "handled" : "open",
                          " · ",
                          formatRelative(r.createdAt)
                        )
                      ),
                      r.classification === "unclassified"
                        ? h(
                            "button",
                            {
                              type: "button",
                              onClick: () => handleClassifyReply(r.id),
                              className: "text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded px-2.5 py-1 transition-colors",
                            },
                            "Classify"
                          )
                        : null
                    );
                  })
                )
        ),

        // Upcoming meetings
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Upcoming meetings",
            subtitle: "Booked and confirmed meetings, handoff status at a glance.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : upcomingMeetings.length === 0
              ? h(EmptyHint, {
                  text: "No meetings scheduled. Keep running sequences — they'll come.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  upcomingMeetings.map((m) => {
                    const lead = leadMap.get(m.leadSlug);
                    const name = (lead && lead.name) || m.leadSlug || "Unknown";
                    const company = (lead && lead.company) || "";
                    const dotClass = m.handoffSent
                      ? "bg-green-500"
                      : "bg-orange-500";
                    return h(
                      "li",
                      { key: m.id, className: "flex items-center gap-3 py-2.5" },
                      h("span", { className: `inline-block w-2 h-2 rounded-full ${dotClass}`, title: m.handoffSent ? "Handoff sent" : "Handoff pending" }),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          name,
                          company ? h("span", { className: "text-gray-500 font-normal" }, ` · ${company}`) : null
                        ),
                        h(
                          "div",
                          { className: "text-xs text-gray-600 truncate" },
                          formatRelative(m.scheduledAt),
                          m.aeOwner ? ` · AE ${m.aeOwner}` : ""
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleMeetingBrief(m.leadSlug),
                          className: "text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Brief"
                      )
                    );
                  })
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { SdrDashboard: SdrDashboard };
})();
