// Content Editor Dashboard — custom bundle for the Houston Content
// Editor agent.
//
// Loaded by the Houston tab resolver as a <script> tag. It must assign a
// component map to window.__houston_bundle__. React is available at
// window.Houston.React. We cannot import @houston-ai/core here (not on
// window), so everything is hand-rolled React.createElement + Tailwind.
//
// The dashboard is READ-ONLY. Every section reads JSON files at the agent
// root and renders. The only user action is a button per row, which
// delegates to props.sendMessage — the chat agent does the actual work.
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
  // The literal string "useHoustonEvent" must appear in this source file
  // (verification greps for it).
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
      } catch (_) { /* fallback: caller polls */ }
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

  function daysUntil(iso) {
    const d = isoToDate(iso);
    if (!d) return null;
    return Math.floor((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }

  // Start-of-week (Mon) for a given Date. Returns a new Date at 00:00.
  function startOfWeek(d) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = (x.getDay() + 6) % 7; // Mon=0..Sun=6
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function formatShortDate(d) {
    if (!d) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function calendarStatusChipClass(status) {
    switch (status) {
      case "published":  return "bg-green-50 text-green-800 border-green-200";
      case "scheduled":  return "bg-teal-50 text-teal-800 border-teal-200";
      case "editing":    return "bg-blue-50 text-blue-800 border-blue-200";
      case "drafting":   return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "briefed":    return "bg-violet-50 text-violet-800 border-violet-200";
      case "idea":       return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "archived":   return "bg-gray-50 text-gray-500 border-gray-200";
      default:            return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  function draftStatusChipClass(status) {
    switch (status) {
      case "ready-for-publish": return "bg-green-100 text-green-800 border-green-200";
      case "edited":            return "bg-teal-100 text-teal-800 border-teal-200";
      case "revising":          return "bg-orange-100 text-orange-800 border-orange-200";
      case "drafting":          return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "briefed":           return "bg-violet-100 text-violet-800 border-violet-200";
      default:                   return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function refreshPriorityClass(priority) {
    switch (priority) {
      case "high":   return "bg-red-50 text-red-800 border-red-200";
      case "medium": return "bg-orange-50 text-orange-800 border-orange-200";
      case "low":    return "bg-gray-50 text-gray-700 border-gray-200";
      default:        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function repurposeStatusClass(status) {
    switch (status) {
      case "published":  return "bg-green-50 text-green-800 border-green-200";
      case "scheduled":  return "bg-teal-50 text-teal-800 border-teal-200";
      case "drafted":    return "bg-blue-50 text-blue-800 border-blue-200";
      case "queued":     return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "skipped":    return "bg-gray-50 text-gray-500 border-gray-200";
      default:            return "bg-gray-50 text-gray-700 border-gray-200";
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
          ? "text-teal-700"
          : tone === "good"
            ? "text-green-700"
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
      h("div", { className: "h-4 w-16 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 w-40 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 flex-1 bg-gray-100 rounded animate-pulse" }),
      h("div", { className: "h-4 w-16 bg-gray-100 rounded animate-pulse" })
    );
  }

  // ---------------------------------------------------------------------
  // The dashboard
  // ---------------------------------------------------------------------

  function ContentEditorDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [calendar, setCalendar] = useState([]);
    const [drafts, setDrafts] = useState([]);
    const [published, setPublished] = useState([]);
    const [repurposeQ, setRepurposeQ] = useState([]);
    const [refreshQ, setRefreshQ] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [cal, dr, pb, rq, fq, pf] = await Promise.all([
          readJsonArray(readFile, "calendar.json"),
          readJsonArray(readFile, "drafts.json"),
          readJsonArray(readFile, "published.json"),
          readJsonArray(readFile, "repurposing-queue.json"),
          readJsonArray(readFile, "refresh-queue.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setCalendar(cal);
        setDrafts(dr);
        setPublished(pb);
        setRepurposeQ(rq);
        setRefreshQ(fq);
        setProfile(pf);
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

    // Polling fallback: the Tauri event listener does not yet reliably
    // reach <script>-injected bundles, so we poll every 5s.
    useEffect(() => {
      const t = setInterval(reload, 5000);
      return () => clearInterval(t);
    }, [reload]);

    // ---- Stats ----
    const stats = useMemo(() => {
      // Calendar weeks filled: count distinct ISO weeks that have >=1 item
      // with status in [idea, briefed, drafting, editing, scheduled].
      const plannedStatuses = new Set(["idea", "briefed", "drafting", "editing", "scheduled"]);
      const weekKey = (d) => {
        const s = startOfWeek(d);
        return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`;
      };
      const weeks = new Set();
      for (const item of calendar) {
        if (!item || !plannedStatuses.has(item.status)) continue;
        const d = isoToDate(item.plannedDate);
        if (!d) continue;
        if (d.getTime() < startOfWeek(new Date()).getTime()) continue;
        weeks.add(weekKey(d));
      }
      const calendarWeeksFilled = weeks.size;

      // Drafts in progress: status in [briefed, drafting, edited, revising].
      const inProgressStatuses = new Set(["briefed", "drafting", "edited", "revising"]);
      let draftsInProgress = 0;
      for (const d of drafts) {
        if (d && inProgressStatuses.has(d.status)) draftsInProgress++;
      }

      // Published this calendar month.
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      let publishedThisMonth = 0;
      for (const p of published) {
        if (!p) continue;
        const d = isoToDate(p.publishedAt);
        if (d && d.getTime() >= monthStart) publishedThisMonth++;
      }

      // Stale pieces: published > 180 days ago, status "live", no refresh
      // in the last 180 days.
      let stalePieces = 0;
      for (const p of published) {
        if (!p || p.status !== "live") continue;
        const publishedAge = daysSince(p.publishedAt);
        const refreshAge = daysSince(p.lastRefreshedAt);
        const effectiveAge = refreshAge != null ? refreshAge : publishedAge;
        if (effectiveAge != null && effectiveAge > 180) stalePieces++;
      }

      return { calendarWeeksFilled, draftsInProgress, publishedThisMonth, stalePieces };
    }, [calendar, drafts, published]);

    // ---- Calendar grid (next 4 weeks) ----
    const calendarGrid = useMemo(() => {
      const weeks = [];
      const now = new Date();
      const firstMon = startOfWeek(now);
      for (let i = 0; i < 4; i++) {
        const start = new Date(firstMon);
        start.setDate(start.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const items = calendar
          .filter((c) => {
            if (!c) return false;
            const d = isoToDate(c.plannedDate);
            return d && d.getTime() >= start.getTime() && d.getTime() < end.getTime();
          })
          .sort((a, b) => (a.plannedDate || "").localeCompare(b.plannedDate || ""));
        weeks.push({ start, end, items });
      }
      return weeks;
    }, [calendar]);

    // ---- Drafts in review: edited or ready-for-publish or revising ----
    const draftsInReview = useMemo(() => {
      const reviewStatuses = new Set(["edited", "ready-for-publish", "revising"]);
      return drafts
        .filter((d) => d && reviewStatuses.has(d.status))
        .slice()
        .sort((a, b) => {
          const order = { "ready-for-publish": 0, "revising": 1, "edited": 2 };
          const ao = order[a.status] ?? 9;
          const bo = order[b.status] ?? 9;
          if (ao !== bo) return ao - bo;
          return (b.lastEditedAt || "").localeCompare(a.lastEditedAt || "");
        })
        .slice(0, 6);
    }, [drafts]);

    // ---- Right-column items: repurpose queue + refresh candidates, interleaved by priority ----
    const rightColItems = useMemo(() => {
      const repurpose = repurposeQ
        .filter((r) => r && r.status !== "published" && r.status !== "skipped")
        .map((r) => ({
          kind: "repurpose",
          id: r.id,
          primary: r.publishedTitle || r.publishedSlug || "Published piece",
          secondary: `${(r.derivativesPlanned || []).length - (r.derivativesDone || []).length} derivative(s) pending`,
          chipLabel: r.status || "queued",
          chipClass: repurposeStatusClass(r.status),
          slug: r.publishedSlug,
          action: "repurpose",
        }));

      const refresh = refreshQ
        .filter((r) => r && r.status !== "done" && r.status !== "archived")
        .map((r) => ({
          kind: "refresh",
          id: r.id,
          primary: r.publishedTitle || r.publishedSlug || "Published piece",
          secondary: `refresh — ${r.trigger || "manual"}${r.decision ? ` · ${r.decision}` : ""}`,
          chipLabel: r.priority || "med",
          chipClass: refreshPriorityClass(r.priority),
          slug: r.publishedSlug,
          action: "refresh",
        }));

      // Sort: refresh-high first, then repurpose-queued, then the rest by order of arrival.
      const weight = (it) => {
        if (it.kind === "refresh" && it.chipLabel === "high") return 0;
        if (it.kind === "repurpose" && it.chipLabel === "queued") return 1;
        if (it.kind === "refresh") return 2;
        return 3;
      };
      return [...refresh, ...repurpose]
        .sort((a, b) => weight(a) - weight(b))
        .slice(0, 8);
    }, [repurposeQ, refreshQ]);

    // ---- Handlers ----
    const handleOpenDraft = useCallback((slug) => {
      if (typeof sendMessage === "function" && slug) {
        sendMessage(`Show me the draft at ${slug}`);
      }
    }, [sendMessage]);

    const handleAction = useCallback((action, slug) => {
      if (typeof sendMessage !== "function" || !slug) return;
      if (action === "refresh") {
        sendMessage(`Refresh ${slug} — scope the update`);
      } else if (action === "repurpose") {
        sendMessage(`Repurpose ${slug}`);
      }
    }, [sendMessage]);

    const handleOnboard = useCallback(() => {
      if (typeof sendMessage === "function") {
        sendMessage("onboard-me");
      }
    }, [sendMessage]);

    const handleOpenCalendarItem = useCallback((slug) => {
      if (typeof sendMessage === "function" && slug) {
        sendMessage(`Open ${slug}`);
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
            { className: "bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-teal-900" }, "Welcome — I'm your Content Editor."),
              h(
                "div",
                { className: "text-sm text-teal-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-teal-100 rounded text-xs" }, "onboard-me"),
                " for a 90-second setup, or jump in with ",
                h("code", { className: "px-1 py-0.5 bg-teal-100 rounded text-xs" }, "Plan the next 6 weeks of content"),
                "."
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
        h(StatCard, {
          label: "Calendar weeks filled",
          value: loading ? "—" : `${stats.calendarWeeksFilled}/4`,
          tone: stats.calendarWeeksFilled >= 4 ? "good" : stats.calendarWeeksFilled >= 2 ? "info" : "warn",
        }),
        h(StatCard, {
          label: "Drafts in progress",
          value: loading ? "—" : stats.draftsInProgress,
          tone: "info",
        }),
        h(StatCard, {
          label: "Published this month",
          value: loading ? "—" : stats.publishedThisMonth,
          tone: "default",
        }),
        h(StatCard, {
          label: "Stale pieces (>6mo)",
          value: loading ? "—" : stats.stalePieces,
          tone: stats.stalePieces > 0 ? "warn" : "good",
        })
      ),

      // Section 2 — Content calendar (next 4 weeks)
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "Content calendar — next 4 weeks",
          subtitle: "Planned pieces by week. Status chip shows where each piece is in the flow.",
        }),
        loading
          ? h("div", { className: "space-y-1" },
              h(SkeletonRow), h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : calendarGrid.every((w) => w.items.length === 0)
            ? h(EmptyHint, {
                text: "Calendar is empty. Ask me to \"plan the next 6 weeks of content\" to propose a slate.",
              })
            : h(
                "div",
                { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" },
                calendarGrid.map((week, idx) =>
                  h(
                    "div",
                    { key: idx, className: "border border-gray-100 rounded-md p-3 bg-gray-50/40" },
                    h(
                      "div",
                      { className: "text-xs font-semibold text-gray-600 mb-2" },
                      `${formatShortDate(week.start)} — ${formatShortDate(new Date(week.end.getTime() - 1))}`
                    ),
                    week.items.length === 0
                      ? h("div", { className: "text-xs text-gray-400 italic py-2" }, "empty")
                      : h(
                          "ul",
                          { className: "space-y-1.5" },
                          week.items.slice(0, 5).map((it) =>
                            h(
                              "li",
                              {
                                key: it.slug || it.id,
                                className: "text-xs bg-white border border-gray-200 rounded px-2 py-1.5 hover:border-teal-300 cursor-pointer transition-colors",
                                onClick: () => handleOpenCalendarItem(it.slug || it.id),
                              },
                              h(
                                "div",
                                { className: "flex items-center gap-1.5 mb-0.5" },
                                h(
                                  "span",
                                  {
                                    className: `inline-flex items-center px-1 py-0 rounded text-[10px] font-semibold border ${calendarStatusChipClass(it.status)}`,
                                  },
                                  it.status || "idea"
                                ),
                                h(
                                  "span",
                                  { className: "text-[10px] text-gray-500 truncate" },
                                  it.channel || ""
                                )
                              ),
                              h(
                                "div",
                                { className: "font-medium text-gray-900 line-clamp-2" },
                                it.title || it.slug || "Untitled"
                              )
                            )
                          )
                        ),
                    week.items.length > 5
                      ? h(
                          "div",
                          { className: "text-[11px] text-gray-500 mt-2" },
                          `+${week.items.length - 5} more`
                        )
                      : null
                  )
                )
              )
      ),

      // Section 3 — two-column grid: drafts in review + (repurpose + refresh)
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Drafts in review
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Drafts in review",
            subtitle: "Edited, revising, or ready-to-publish. Click to open in chat.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : draftsInReview.length === 0
              ? h(EmptyHint, {
                  text: "No drafts in review. Drop a draft at drafts/{slug}/draft.md and ask me to \"edit-draft\".",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  draftsInReview.map((d) => {
                    const wc = typeof d.wordCount === "number" ? `${d.wordCount} words` : "";
                    const panel = typeof d.panelScore === "number" ? ` · panel ${d.panelScore}/10` : "";
                    const sweeps = typeof d.sweepsCompleted === "number" ? ` · sweeps ${d.sweepsCompleted}/7` : "";
                    return h(
                      "li",
                      { key: d.slug || d.id, className: "flex items-center gap-3 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${draftStatusChipClass(d.status)}`,
                        },
                        d.status || "draft"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          d.title || d.slug || "Untitled"
                        ),
                        h(
                          "div",
                          { className: "text-xs text-gray-500 truncate" },
                          [d.channel, wc, sweeps, panel].filter(Boolean).join("")
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleOpenDraft(d.slug || d.id),
                          className: "text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Open"
                      )
                    );
                  })
                )
        ),

        // Repurpose + Refresh
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Repurpose & refresh",
            subtitle: "High-priority refresh candidates and queued derivatives.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : rightColItems.length === 0
              ? h(EmptyHint, {
                  text: "Nothing pending. Ask me to \"analyze-performance\" — I'll surface stale pieces and repurpose candidates.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  rightColItems.map((it) =>
                    h(
                      "li",
                      { key: `${it.kind}-${it.id}`, className: "flex items-start gap-2 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 shrink-0 ${it.chipClass}`,
                        },
                        it.chipLabel
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          it.primary
                        ),
                        h(
                          "div",
                          { className: "text-xs text-gray-600 truncate" },
                          it.secondary
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleAction(it.action, it.slug),
                          className: "text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 border border-teal-200 rounded px-2.5 py-1 shrink-0 transition-colors",
                        },
                        it.action === "refresh" ? "Scope" : "Draft"
                      )
                    )
                  )
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { ContentEditorDashboard: ContentEditorDashboard };
})();
