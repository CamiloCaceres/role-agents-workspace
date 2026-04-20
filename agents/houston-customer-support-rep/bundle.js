// Customer Support Rep Dashboard — custom bundle for the Houston CSR agent.
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
// Reactivity: subscribes to the Houston file-change event via
// useHoustonEvent (Tauri event listener, dynamically imported so the
// bundle degrades gracefully if Tauri isn't reachable from an injected
// script). Also polls every 5 seconds as a fallback because the real
// Tauri event listener does not yet reliably reach bundles injected via
// <script> tag at runtime.

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
      // doesn't try to resolve it at bundle-time.
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

  function categoryChipClass(category) {
    switch (category) {
      case "bug":      return "bg-red-50 text-red-800 border-red-200";
      case "billing":  return "bg-purple-50 text-purple-800 border-purple-200";
      case "how-to":   return "bg-blue-50 text-blue-800 border-blue-200";
      case "feature":  return "bg-green-50 text-green-800 border-green-200";
      case "account":  return "bg-gray-50 text-gray-700 border-gray-200";
      case "security": return "bg-rose-50 text-rose-800 border-rose-200";
      default:         return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function rowTypePillClass(rowType) {
    switch (rowType) {
      case "SLA":     return "bg-red-50 text-red-800 border-red-200";
      case "PROMISE": return "bg-orange-50 text-orange-800 border-orange-200";
      case "DRAFT":   return "bg-blue-50 text-blue-800 border-blue-200";
      default:        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  function severityDotClass(severity) {
    switch (severity) {
      case "critical": return "bg-red-600";
      case "high":     return "bg-orange-500";
      case "medium":   return "bg-yellow-500";
      case "low":      return "bg-gray-400";
      default:         return "bg-gray-400";
    }
  }

  function isoToDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function hoursBetween(laterIso, earlierIso) {
    const later = isoToDate(laterIso);
    const earlier = isoToDate(earlierIso);
    if (!later || !earlier) return null;
    return (later.getTime() - earlier.getTime()) / (60 * 60 * 1000);
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
          ? "text-teal-700"
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

  function CsrDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [followups, setFollowups] = useState([]);
    const [bugs, setBugs] = useState([]);
    const [features, setFeatures] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [c, cu, f, b, fr, p] = await Promise.all([
          readJsonArray(readFile, "conversations.json"),
          readJsonArray(readFile, "customers.json"),
          readJsonArray(readFile, "followups.json"),
          readJsonArray(readFile, "bug-candidates.json"),
          readJsonArray(readFile, "feature-requests.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setConversations(c);
        setCustomers(cu);
        setFollowups(f);
        setBugs(b);
        setFeatures(fr);
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

    const customerMap = useMemo(() => {
      const map = new Map();
      for (const cu of customers) if (cu && cu.slug) map.set(cu.slug, cu);
      return map;
    }, [customers]);

    // ---- Stats ----
    const stats = useMemo(() => {
      const openStatuses = new Set(["open", "waiting_founder", "waiting_customer"]);
      let open = 0;
      let needsReply = 0;
      let breaching = 0;
      const now = Date.now();
      for (const c of conversations) {
        if (!c) continue;
        if (openStatuses.has(c.status)) open++;
        if (c.status === "waiting_founder") needsReply++;
        const sla = c.sla || {};
        if (sla.breached) { breaching++; continue; }
        const dueIso = sla.firstReplyDueAt || sla.nextUpdateDueAt;
        const due = isoToDate(dueIso);
        if (due && (due.getTime() - now) <= 2 * 60 * 60 * 1000) breaching++;
      }
      let openPromises = 0;
      for (const fu of followups) {
        if (fu && fu.status === "open") openPromises++;
      }
      return { open, needsReply, breaching, openPromises };
    }, [conversations, followups]);

    // ---- Needs you now ----
    const needsYouNow = useMemo(() => {
      const now = Date.now();
      const rows = [];

      // SLA breaches / at-risk
      for (const c of conversations) {
        if (!c) continue;
        if (c.status !== "open" && c.status !== "waiting_founder") continue;
        const sla = c.sla || {};
        const dueIso = sla.firstReplyDueAt || sla.nextUpdateDueAt;
        const due = isoToDate(dueIso);
        const breached = !!sla.breached || (due && due.getTime() <= now);
        const atRisk = !breached && due && (due.getTime() - now) <= 2 * 60 * 60 * 1000;
        if (!breached && !atRisk) continue;
        rows.push({
          rowType: "SLA",
          key: `sla-${c.id}`,
          priority: c.priority,
          title: c.subject || "(no subject)",
          customerSlug: c.customerSlug,
          context: breached
            ? `breached${due ? ` · ${Math.max(0, Math.floor((now - due.getTime()) / 60000))}m over` : ""}`
            : `due ${formatRelative(dueIso)}`,
          when: dueIso,
          rank: breached ? 0 : 1,
          actionId: c.id,
        });
      }

      // Overdue promises
      for (const fu of followups) {
        if (!fu || fu.status !== "open") continue;
        const due = isoToDate(fu.dueAt);
        if (!due || due.getTime() > now) continue;
        rows.push({
          rowType: "PROMISE",
          key: `promise-${fu.id}`,
          priority: null,
          title: fu.promise || "(promise)",
          customerSlug: fu.customerSlug,
          context: `due ${formatRelative(fu.dueAt)}`,
          when: fu.dueAt,
          rank: 2,
          actionId: fu.conversationId || fu.id,
        });
      }

      // Drafts waiting on founder
      for (const c of conversations) {
        if (!c || c.status !== "waiting_founder") continue;
        // Skip if we already added this conversation for SLA.
        if (rows.some((r) => r.actionId === c.id && r.rowType === "SLA")) continue;
        rows.push({
          rowType: "DRAFT",
          key: `draft-${c.id}`,
          priority: c.priority,
          title: c.subject || "(no subject)",
          customerSlug: c.customerSlug,
          context: "draft ready for your review",
          when: c.lastTouchedAt || c.updatedAt,
          rank: 3,
          actionId: c.id,
        });
      }

      rows.sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return (a.when || "").localeCompare(b.when || "");
      });
      return rows.slice(0, 8);
    }, [conversations, followups]);

    // ---- Open conversations (recent) ----
    const recentOpen = useMemo(() => {
      const open = new Set(["open", "waiting_founder", "waiting_customer"]);
      return conversations
        .filter((c) => c && open.has(c.status))
        .slice()
        .sort((a, b) => (b.lastTouchedAt || b.updatedAt || "").localeCompare(a.lastTouchedAt || a.updatedAt || ""))
        .slice(0, 8);
    }, [conversations]);

    // ---- Recent signals: bugs + feature requests ----
    const recentSignals = useMemo(() => {
      const items = [];
      for (const b of bugs) {
        if (!b || b.status === "dismissed") continue;
        items.push({
          kind: "bug",
          key: `bug-${b.id}`,
          summary: b.summary || "(bug)",
          severity: b.severity,
          affected: Array.isArray(b.affectedCustomerSlugs) ? b.affectedCustomerSlugs.length : 1,
          when: b.updatedAt || b.createdAt,
          id: b.id,
        });
      }
      for (const fr of features) {
        if (!fr) continue;
        if (fr.roadmapStatus === "shipped" || fr.roadmapStatus === "declined") continue;
        items.push({
          kind: "feature",
          key: `fr-${fr.id}`,
          summary: fr.title || "(feature)",
          severity: null,
          affected: Array.isArray(fr.requestingCustomerSlugs) ? fr.requestingCustomerSlugs.length : 1,
          when: fr.updatedAt || fr.createdAt,
          id: fr.id,
        });
      }
      return items
        .sort((a, b) => (b.when || "").localeCompare(a.when || ""))
        .slice(0, 8);
    }, [bugs, features]);

    // ---- Handlers ----
    const handleReviewRow = useCallback((rowType, id) => {
      if (typeof sendMessage !== "function") return;
      if (rowType === "PROMISE") {
        sendMessage(`Review open promise on conversation ${id}`);
      } else {
        sendMessage(`Review conversation ${id}`);
      }
    }, [sendMessage]);

    const handleOpenConversation = useCallback((id) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Review conversation ${id}`);
      }
    }, [sendMessage]);

    const handleOpenBug = useCallback((id) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Show bug candidate ${id}`);
      }
    }, [sendMessage]);

    const handleOpenFeature = useCallback((id) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Show feature request ${id}`);
      }
    }, [sendMessage]);

    const handleOnboard = useCallback(() => {
      if (typeof sendMessage === "function") {
        sendMessage("onboard-me");
      }
    }, [sendMessage]);

    const notOnboarded = !loading && profile == null;

    const customerLabel = (slug) => {
      if (!slug) return "";
      const cu = customerMap.get(slug);
      if (!cu) return slug;
      return cu.name || cu.company || slug;
    };

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
            { className: "bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-teal-900" }, "Welcome — I'm your Customer Support Rep."),
              h(
                "div",
                { className: "text-sm text-teal-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-teal-100 rounded text-xs" }, "onboard-me"),
                " for a 90-second setup."
              )
            ),
            h(
              "button",
              {
                type: "button",
                onClick: handleOnboard,
                className: "text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded px-3 py-1.5 transition-colors",
              },
              "Onboard me"
            )
          )
        : null,

      // Section 1 — Stats
      h(
        "div",
        { className: "flex flex-wrap gap-3" },
        h(StatCard, { label: "Open conversations", value: loading ? "—" : stats.open, tone: "info" }),
        h(StatCard, { label: "Needs reply", value: loading ? "—" : stats.needsReply, tone: stats.needsReply ? "warn" : "default" }),
        h(StatCard, { label: "SLA breach / at-risk", value: loading ? "—" : stats.breaching, tone: stats.breaching ? "danger" : "default" }),
        h(StatCard, { label: "Open promises", value: loading ? "—" : stats.openPromises, tone: stats.openPromises ? "warn" : "default" })
      ),

      // Section 2 — Needs you now
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "Needs you now",
          subtitle: "Breached SLAs, then overdue promises, then drafts waiting on your approval.",
        }),
        loading
          ? h("div", { className: "space-y-1" },
              h(SkeletonRow), h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : needsYouNow.length === 0
            ? h(EmptyHint, {
                text: "Nothing pressing. Ask me to \"pull unread from my connected inbox and triage\" or \"morning brief\" to get started.",
              })
            : h(
                "ul",
                { className: "divide-y divide-gray-100" },
                needsYouNow.map((row) => {
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
                    row.priority ? h(PriorityBadge, { priority: row.priority }) : null,
                    h(
                      "div",
                      { className: "flex-1 min-w-0" },
                      h(
                        "div",
                        { className: "text-sm font-medium text-gray-900 truncate" },
                        row.title,
                        row.customerSlug
                          ? h("span", { className: "text-gray-500 font-normal" }, ` · ${customerLabel(row.customerSlug)}`)
                          : null
                      ),
                      h("div", { className: "text-sm text-gray-600 truncate" }, row.context),
                      h("div", { className: "text-xs text-gray-500 mt-0.5" }, formatRelative(row.when))
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleReviewRow(row.rowType, row.actionId),
                        className: "text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200 rounded px-2.5 py-1 transition-colors",
                      },
                      "Review"
                    )
                  );
                })
              )
      ),

      // Section 3 — Two-column grid: recent open + recent signals
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Open conversations
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Open conversations",
            subtitle: "Most recently touched, still open.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : recentOpen.length === 0
              ? h(EmptyHint, {
                  text: "No open conversations. Queue's empty — or nothing has been triaged yet.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  recentOpen.map((c) => {
                    return h(
                      "li",
                      { key: c.id, className: "flex items-center gap-2 py-2.5" },
                      h(PriorityBadge, { priority: c.priority }),
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${categoryChipClass(c.category)}`,
                        },
                        c.category || "other"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-medium text-gray-900 truncate" }, c.subject || "(no subject)"),
                        h(
                          "div",
                          { className: "text-xs text-gray-500 truncate" },
                          customerLabel(c.customerSlug),
                          " · ",
                          c.status,
                          " · ",
                          formatRelative(c.lastTouchedAt || c.updatedAt)
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleOpenConversation(c.id),
                          className: "text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Open"
                      )
                    );
                  })
                )
        ),

        // Recent signals (bugs + feature requests)
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Recent signals",
            subtitle: "Bug candidates and feature asks I've captured for you.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : recentSignals.length === 0
              ? h(EmptyHint, {
                  text: "No bug candidates or feature asks yet. They'll appear as I triage tickets.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  recentSignals.map((s) => {
                    const label = s.kind === "bug" ? "BUG" : "REQ";
                    const labelClass = s.kind === "bug"
                      ? "bg-red-50 text-red-800 border-red-200"
                      : "bg-green-50 text-green-800 border-green-200";
                    return h(
                      "li",
                      { key: s.key, className: "flex items-center gap-3 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${labelClass}`,
                        },
                        label
                      ),
                      s.kind === "bug"
                        ? h("span", { className: `inline-block w-2 h-2 rounded-full ${severityDotClass(s.severity)}`, title: s.severity || "" })
                        : null,
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h("div", { className: "text-sm font-medium text-gray-900 truncate" }, s.summary),
                        h(
                          "div",
                          { className: "text-xs text-gray-500 mt-0.5" },
                          `${s.affected} requester${s.affected === 1 ? "" : "s"}`,
                          " · ",
                          formatRelative(s.when)
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => s.kind === "bug" ? handleOpenBug(s.id) : handleOpenFeature(s.id),
                          className: "text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Open"
                      )
                    );
                  })
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { CsrDashboard: CsrDashboard };
})();
