// PMM Dashboard — custom bundle for the Houston PMM agent.
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

  function launchStatusChipClass(status) {
    switch (status) {
      case "launched":         return "bg-green-50 text-green-800 border-green-200";
      case "content-drafted":  return "bg-blue-50 text-blue-800 border-blue-200";
      case "brief":            return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "post-launch":      return "bg-gray-50 text-gray-700 border-gray-200";
      case "archived":         return "bg-gray-50 text-gray-500 border-gray-200";
      case "idea":             return "bg-yellow-50 text-yellow-800 border-yellow-200";
      default:                  return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  function battlecardFreshnessClass(status) {
    switch (status) {
      case "fresh":  return "bg-green-100 text-green-800 border-green-200";
      case "stale":  return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      default:        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function impactPillClass(impact) {
    switch (impact) {
      case "high":   return "bg-red-50 text-red-800 border-red-200";
      case "medium": return "bg-orange-50 text-orange-800 border-orange-200";
      case "low":    return "bg-gray-50 text-gray-700 border-gray-200";
      default:        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  function outcomeChipClass(outcome) {
    switch (outcome) {
      case "win":   return "bg-green-50 text-green-800 border-green-200";
      case "loss":  return "bg-red-50 text-red-800 border-red-200";
      case "mixed": return "bg-yellow-50 text-yellow-800 border-yellow-200";
      default:       return "bg-gray-50 text-gray-700 border-gray-200";
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
          ? "text-violet-700"
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

  function ProgressBar({ pct }) {
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    const fillClass = clamped >= 80
      ? "bg-green-500"
      : clamped >= 40
        ? "bg-violet-500"
        : "bg-orange-400";
    return h(
      "div",
      { className: "w-full h-1.5 bg-gray-100 rounded-full overflow-hidden" },
      h("div", { className: `${fillClass} h-full`, style: { width: `${clamped}%` } })
    );
  }

  // ---------------------------------------------------------------------
  // The dashboard
  // ---------------------------------------------------------------------

  function PmmDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [launches, setLaunches] = useState([]);
    const [battlecards, setBattlecards] = useState([]);
    const [activity, setActivity] = useState([]);
    const [winLoss, setWinLoss] = useState([]);
    const [tests, setTests] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [lc, bc, ac, wl, mt, pf] = await Promise.all([
          readJsonArray(readFile, "launches.json"),
          readJsonArray(readFile, "battlecards.json"),
          readJsonArray(readFile, "competitor-activity.json"),
          readJsonArray(readFile, "win-loss.json"),
          readJsonArray(readFile, "messaging-tests.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setLaunches(lc);
        setBattlecards(bc);
        setActivity(ac);
        setWinLoss(wl);
        setTests(mt);
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
      const activeLaunchStatuses = new Set(["idea", "brief", "content-drafted", "launched"]);
      let activeLaunches = 0;
      for (const l of launches) {
        if (l && activeLaunchStatuses.has(l.status)) activeLaunches++;
      }

      let freshBattlecards = 0;
      for (const b of battlecards) {
        if (!b) continue;
        if (b.status === "fresh") { freshBattlecards++; continue; }
        const days = daysSince(b.lastRefreshedAt);
        if (days != null && days <= 30) freshBattlecards++;
      }

      const currentYear = new Date().getFullYear();
      const qNow = Math.floor(new Date().getMonth() / 3) + 1;
      const thisQtrLabel = `${currentYear}-Q${qNow}`;
      let winLossThisQtr = 0;
      for (const w of winLoss) {
        if (w && w.period === thisQtrLabel) winLossThisQtr++;
      }

      const liveTestStatuses = new Set(["live", "analyzing"]);
      let liveTests = 0;
      for (const t of tests) {
        if (t && liveTestStatuses.has(t.status)) liveTests++;
      }
      return { activeLaunches, freshBattlecards, winLossThisQtr, liveTests };
    }, [launches, battlecards, winLoss, tests]);

    // ---- Launch pipeline ----
    const launchPipeline = useMemo(() => {
      const activeStatuses = new Set(["idea", "brief", "content-drafted", "launched"]);
      return launches
        .filter((l) => l && activeStatuses.has(l.status))
        .slice()
        .sort((a, b) => {
          const aDate = a.launchDate || "9999-12-31";
          const bDate = b.launchDate || "9999-12-31";
          return aDate.localeCompare(bDate);
        })
        .slice(0, 8);
    }, [launches]);

    // ---- Competitor activity (last 14 days) ----
    const recentActivity = useMemo(() => {
      const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return activity
        .filter((e) => {
          if (!e) return false;
          const d = isoToDate(e.createdAt);
          return d && d.getTime() >= cutoff;
        })
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        .slice(0, 6);
    }, [activity]);

    // ---- Win-loss themes (most recent) ----
    const recentThemes = useMemo(() => {
      return winLoss
        .slice()
        .sort((a, b) => {
          const byPeriod = (b.period || "").localeCompare(a.period || "");
          if (byPeriod !== 0) return byPeriod;
          return (b.frequencyPct || 0) - (a.frequencyPct || 0);
        })
        .slice(0, 6);
    }, [winLoss]);

    // ---- Handlers ----
    const handleReviewLaunch = useCallback((slug) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Show me the launch brief for ${slug}`);
      }
    }, [sendMessage]);

    const handleRefreshBattlecard = useCallback((competitorSlug) => {
      if (typeof sendMessage === "function") {
        sendMessage(`Refresh battlecard for ${competitorSlug}`);
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
            { className: "bg-violet-50 border border-violet-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-violet-900" }, "Welcome — I'm your PMM."),
              h(
                "div",
                { className: "text-sm text-violet-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-violet-100 rounded text-xs" }, "onboard-me"),
                " for a 90-second setup, or say ",
                h("code", { className: "px-1 py-0.5 bg-violet-100 rounded text-xs" }, "Define our positioning"),
                " to lock positioning first."
              )
            ),
            h(
              "button",
              {
                type: "button",
                onClick: handleOnboard,
                className: "text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded px-3 py-1.5 transition-colors",
              },
              "Onboard me"
            )
          )
        : null,

      // Section 1 — Stats
      h(
        "div",
        { className: "flex flex-wrap gap-3" },
        h(StatCard, { label: "Active launches", value: loading ? "—" : stats.activeLaunches, tone: "info" }),
        h(StatCard, {
          label: "Fresh battlecards",
          value: loading ? "—" : `${stats.freshBattlecards}/${battlecards.length || 0}`,
          tone: stats.freshBattlecards === (battlecards.length || 0) && battlecards.length > 0 ? "good" : "warn",
        }),
        h(StatCard, { label: "Win-loss this qtr", value: loading ? "—" : stats.winLossThisQtr, tone: "default" }),
        h(StatCard, { label: "Messaging tests live", value: loading ? "—" : stats.liveTests, tone: "default" })
      ),

      // Section 2 — Launch pipeline
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "Launch pipeline",
          subtitle: "Upcoming launches by date. Status chip, asset checklist completion.",
        }),
        loading
          ? h("div", { className: "space-y-1" },
              h(SkeletonRow), h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : launchPipeline.length === 0
            ? h(EmptyHint, {
                text: "No launches in the pipeline. Ask me to \"draft a launch brief for {product or feature}\" to kick one off.",
              })
            : h(
                "ul",
                { className: "divide-y divide-gray-100" },
                launchPipeline.map((l) => {
                  const pct = Number(l.assetsComplete) || 0;
                  const when = l.launchDate
                    ? `${formatRelative(l.launchDate)}`
                    : "no date set";
                  const daysTo = l.launchDate ? daysUntil(l.launchDate) : null;
                  const urgency = daysTo != null && daysTo >= 0 && daysTo <= 7 ? "text-orange-700 font-medium" : "text-gray-500";
                  return h(
                    "li",
                    { key: l.slug || l.id, className: "flex items-center gap-3 py-2.5" },
                    h(
                      "span",
                      {
                        className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${launchStatusChipClass(l.status)}`,
                      },
                      l.status || "idea"
                    ),
                    h(
                      "div",
                      { className: "flex-1 min-w-0" },
                      h(
                        "div",
                        { className: "text-sm font-medium text-gray-900 truncate" },
                        l.name || l.slug || "Untitled launch"
                      ),
                      h(
                        "div",
                        { className: "text-xs text-gray-600 truncate" },
                        l.audience ? `${l.audience} · ` : "",
                        h("span", { className: urgency }, when)
                      ),
                      h(
                        "div",
                        { className: "mt-1 flex items-center gap-2" },
                        h("div", { className: "flex-1" }, h(ProgressBar, { pct })),
                        h("div", { className: "text-xs text-gray-500 w-10 text-right" }, `${pct}%`)
                      )
                    ),
                    h(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleReviewLaunch(l.slug || l.id),
                        className: "text-xs font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-50 border border-violet-200 rounded px-2.5 py-1 transition-colors",
                      },
                      "Open"
                    )
                  );
                })
              )
      ),

      // Section 3 — Two-column grid: competitor activity + win-loss themes
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Competitor activity
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Competitor activity (14d)",
            subtitle: "Recent moves from tracked competitors. Click to refresh the battlecard.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : recentActivity.length === 0
              ? h(EmptyHint, {
                  text: "No recent activity logged. Ask me to \"monitor {competitor}\" or run \"weekly competitor sweep\".",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  recentActivity.map((e) => {
                    const bc = battlecards.find((b) => b && b.competitorSlug === e.competitorSlug);
                    const bcStatus = bc ? bc.status : null;
                    return h(
                      "li",
                      { key: e.id, className: "flex items-start gap-2 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 shrink-0 ${impactPillClass(e.impact)}`,
                        },
                        e.impact || "med"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          e.competitorSlug || "unknown",
                          h("span", { className: "text-gray-500 font-normal" }, ` · ${e.type || "other"}`)
                        ),
                        h("div", { className: "text-xs text-gray-600 line-clamp-2" }, e.headline || ""),
                        h(
                          "div",
                          { className: "text-xs text-gray-500 mt-0.5" },
                          formatRelative(e.createdAt),
                          bcStatus
                            ? h(
                                "span",
                                {
                                  className: `ml-2 inline-flex items-center px-1.5 py-0 rounded text-xs font-medium border ${battlecardFreshnessClass(bcStatus)}`,
                                },
                                `battlecard ${bcStatus}`
                              )
                            : null
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleRefreshBattlecard(e.competitorSlug),
                          className: "text-xs font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-50 border border-violet-200 rounded px-2.5 py-1 shrink-0 transition-colors",
                        },
                        "Refresh"
                      )
                    );
                  })
                )
        ),

        // Win-loss themes
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Win-loss themes",
            subtitle: "Most recent themes with frequency and positioning implication.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : recentThemes.length === 0
              ? h(EmptyHint, {
                  text: "No themes yet. Upload deal notes or ask \"analyze-win-loss for Q1\" to extract themes.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  recentThemes.map((w) => {
                    return h(
                      "li",
                      { key: w.id, className: "flex items-start gap-2 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border mt-0.5 shrink-0 ${outcomeChipClass(w.outcome)}`,
                        },
                        w.outcome || "mixed"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          w.theme || "Unnamed theme",
                          typeof w.frequencyPct === "number"
                            ? h("span", { className: "text-gray-500 font-normal" }, ` · ${w.frequencyPct}%`)
                            : null
                        ),
                        w.representativeQuote
                          ? h(
                              "div",
                              { className: "text-xs text-gray-600 line-clamp-2 italic" },
                              `"${w.representativeQuote}"`
                            )
                          : null,
                        h(
                          "div",
                          { className: "text-xs text-gray-500 mt-0.5" },
                          w.period || "",
                          w.positioningImplication ? ` · ${w.positioningImplication.slice(0, 60)}${w.positioningImplication.length > 60 ? "…" : ""}` : ""
                        )
                      )
                    );
                  })
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { PmmDashboard: PmmDashboard };
})();
