// Recruiter Dashboard — custom bundle for the Houston Recruiter agent.
//
// Loaded by the Houston tab resolver as a <script> tag. It must assign a
// component map to window.__houston_bundle__. React is available at
// window.Houston.React. We cannot import @houston-ai/core here (not on
// window), so everything is hand-rolled React.createElement + Tailwind.
//
// The dashboard is READ-ONLY. Every section reads JSON files at the agent
// root and renders. User actions delegate to props.sendMessage — the chat
// agent does the actual work.
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

  function isWithinNextDays(iso, days) {
    const d = isoToDate(iso);
    if (!d) return false;
    const now = Date.now();
    const horizon = now + days * 24 * 60 * 60 * 1000;
    return d.getTime() >= now && d.getTime() <= horizon;
  }

  function isWithinNextWeek(iso) {
    return isWithinNextDays(iso, 7);
  }

  function stageChipClass(stage) {
    switch (stage) {
      case "sourced":    return "bg-gray-100 text-gray-700 border-gray-200";
      case "screened":   return "bg-blue-50 text-blue-800 border-blue-200";
      case "interview":  return "bg-purple-50 text-purple-800 border-purple-200";
      case "offer":      return "bg-green-50 text-green-800 border-green-200";
      default:           return "bg-gray-50 text-gray-600 border-gray-200";
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
          ? "text-emerald-700"
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

  function StageCount({ stage, count }) {
    return h(
      "span",
      {
        className: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${stageChipClass(stage)}`,
      },
      h("span", null, stage),
      h("span", { className: "text-gray-500 font-normal" }, count)
    );
  }

  // ---------------------------------------------------------------------
  // The dashboard
  // ---------------------------------------------------------------------

  function RecruiterDashboard(props) {
    const { readFile, sendMessage } = props || {};
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [roles, setRoles] = useState([]);
    const [pipelines, setPipelines] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [atRisk, setAtRisk] = useState([]);
    const [profile, setProfile] = useState(null);

    const reload = useCallback(async () => {
      if (typeof readFile !== "function") {
        setErr("readFile is not available in this context.");
        setLoading(false);
        return;
      }
      try {
        const [c, r, p, i, o, a, prof] = await Promise.all([
          readJsonArray(readFile, "candidates.json"),
          readJsonArray(readFile, "roles.json"),
          readJsonArray(readFile, "pipelines.json"),
          readJsonArray(readFile, "interviews.json"),
          readJsonArray(readFile, "offers.json"),
          readJsonArray(readFile, "at-risk.json"),
          readJsonObject(readFile, "config/profile.json"),
        ]);
        setCandidates(c);
        setRoles(r);
        setPipelines(p);
        setInterviews(i);
        setOffers(o);
        setAtRisk(a);
        setProfile(prof);
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

    const candidateMap = useMemo(() => {
      const map = new Map();
      for (const c of candidates) if (c && c.slug) map.set(c.slug, c);
      return map;
    }, [candidates]);

    const roleMap = useMemo(() => {
      const map = new Map();
      for (const r of roles) if (r && r.id) map.set(r.id, r);
      return map;
    }, [roles]);

    // ---- Stats ----
    const stats = useMemo(() => {
      const openRoles = roles.filter((r) => r && r.status === "open").length;
      const activeStatuses = new Set(["sourced", "screened", "interview", "offer"]);
      const activeCandidates = candidates.filter(
        (c) => c && activeStatuses.has(c.stage)
      ).length;
      const interviewsWeek = interviews.filter(
        (i) => i && isWithinNextWeek(i.scheduledAt)
      ).length;
      const offersOut = offers.filter(
        (o) => o && (o.status === "out" || o.status === "sent" || o.status === "pending")
      ).length;
      return { openRoles, activeCandidates, interviewsWeek, offersOut };
    }, [roles, candidates, interviews, offers]);

    // ---- Pipeline by role ----
    // Prefer precomputed pipelines.json when present; otherwise derive from candidates.
    const pipelineByRole = useMemo(() => {
      const STAGES = ["sourced", "screened", "interview", "offer"];
      const openRoles = roles.filter((r) => r && r.status === "open");
      // Build a lookup of precomputed entries by roleId.
      const precomputed = new Map();
      for (const p of pipelines) if (p && p.roleId) precomputed.set(p.roleId, p);

      return openRoles.map((role) => {
        const fromIndex = precomputed.get(role.id);
        const counts = {};
        let latestTouch = null;
        if (fromIndex && fromIndex.counts) {
          for (const s of STAGES) counts[s] = Number(fromIndex.counts[s] || 0);
          latestTouch = fromIndex.lastTouchedAt || null;
        } else {
          for (const s of STAGES) counts[s] = 0;
          for (const c of candidates) {
            if (!c || c.roleId !== role.id) continue;
            if (STAGES.indexOf(c.stage) !== -1) counts[c.stage]++;
            if (c.lastTouchedAt && (!latestTouch || c.lastTouchedAt > latestTouch)) {
              latestTouch = c.lastTouchedAt;
            }
          }
        }
        // Stalled flag: any candidate on this role not touched in >5 days.
        let stalled = false;
        for (const c of candidates) {
          if (!c || c.roleId !== role.id) continue;
          const days = daysSince(c.lastTouchedAt);
          if (days != null && days > 5) { stalled = true; break; }
        }
        return { role, counts, stalled, latestTouch };
      });
    }, [roles, candidates, pipelines]);

    // ---- Upcoming interviews (next 7 days) ----
    const upcomingInterviews = useMemo(() => {
      return interviews
        .filter((i) => i && isWithinNextWeek(i.scheduledAt))
        .sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""))
        .slice(0, 8);
    }, [interviews]);

    // ---- At-risk (stalled > 5 days) ----
    const atRiskList = useMemo(() => {
      // Prefer the explicit at-risk.json if it has rows; else derive from candidates.
      if (Array.isArray(atRisk) && atRisk.length > 0) {
        return atRisk
          .slice()
          .sort((a, b) => (a.lastTouchedAt || "").localeCompare(b.lastTouchedAt || ""))
          .slice(0, 8);
      }
      const derived = [];
      for (const c of candidates) {
        if (!c) continue;
        const days = daysSince(c.lastTouchedAt);
        if (days != null && days > 5 && c.stage !== "offer") {
          derived.push(c);
        }
      }
      derived.sort((a, b) => (a.lastTouchedAt || "").localeCompare(b.lastTouchedAt || ""));
      return derived.slice(0, 8);
    }, [atRisk, candidates]);

    // ---- Handlers ----
    const handleOnboard = useCallback(() => {
      if (typeof sendMessage === "function") sendMessage("onboard-me");
    }, [sendMessage]);

    const handleReviewCandidate = useCallback((slug) => {
      if (typeof sendMessage === "function") sendMessage(`Review candidate ${slug}`);
    }, [sendMessage]);

    const handleInterviewBrief = useCallback((slug) => {
      if (typeof sendMessage === "function") sendMessage(`Prep me for interview with ${slug}`);
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
            { className: "bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-4" },
            h(
              "div",
              { className: "flex-1 min-w-0" },
              h("div", { className: "text-sm font-semibold text-emerald-900" }, "Welcome — I'm your Recruiter."),
              h(
                "div",
                { className: "text-sm text-emerald-800 mt-0.5" },
                "Ask me to ",
                h("code", { className: "px-1 py-0.5 bg-emerald-100 rounded text-xs" }, "onboard-me"),
                " to get started."
              )
            ),
            h(
              "button",
              {
                type: "button",
                onClick: handleOnboard,
                className: "text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded px-3 py-1.5 transition-colors",
              },
              "Onboard me"
            )
          )
        : null,

      // Section 1 — Stats
      h(
        "div",
        { className: "flex flex-wrap gap-3" },
        h(StatCard, { label: "Open reqs", value: loading ? "—" : stats.openRoles, tone: "info" }),
        h(StatCard, { label: "Active candidates", value: loading ? "—" : stats.activeCandidates, tone: "default" }),
        h(StatCard, { label: "Interviews this week", value: loading ? "—" : stats.interviewsWeek, tone: "default" }),
        h(StatCard, { label: "Offers out", value: loading ? "—" : stats.offersOut, tone: stats.offersOut ? "warn" : "default" })
      ),

      // Section 2 — Pipeline by role
      h(
        "div",
        { className: "bg-white rounded-lg border border-gray-200 p-5" },
        h(SectionHeader, {
          title: "Pipeline by role",
          subtitle: "Open reqs with counts at each stage. Stalled flag shows if any candidate has gone untouched >5 days.",
        }),
        loading
          ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
          : pipelineByRole.length === 0
            ? h(EmptyHint, {
                text: "No open roles yet. Ask me to `open a req for {role}` to define your first one.",
              })
            : h(
                "ul",
                { className: "divide-y divide-gray-100" },
                pipelineByRole.map((row) => {
                  const role = row.role;
                  return h(
                    "li",
                    { key: role.id, className: "flex items-center gap-3 py-2.5" },
                    h(
                      "div",
                      { className: "flex-1 min-w-0" },
                      h(
                        "div",
                        { className: "text-sm font-medium text-gray-900 truncate" },
                        role.title || role.slug,
                        role.level ? h("span", { className: "text-gray-500 font-normal" }, ` · ${role.level}`) : null,
                        row.stalled
                          ? h("span", { className: "ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-orange-50 text-orange-800 border-orange-200" }, "stalled")
                          : null
                      ),
                      h(
                        "div",
                        { className: "flex items-center gap-1.5 mt-1 flex-wrap" },
                        h(StageCount, { stage: "sourced", count: row.counts.sourced }),
                        h(StageCount, { stage: "screened", count: row.counts.screened }),
                        h(StageCount, { stage: "interview", count: row.counts.interview }),
                        h(StageCount, { stage: "offer", count: row.counts.offer })
                      ),
                      row.latestTouch
                        ? h("div", { className: "text-xs text-gray-500 mt-1" }, `last activity ${formatRelative(row.latestTouch)}`)
                        : null
                    )
                  );
                })
              )
      ),

      // Section 3 — Two-column grid
      h(
        "div",
        { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },

        // Upcoming interviews
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Upcoming interviews",
            subtitle: "Next 7 days.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : upcomingInterviews.length === 0
              ? h(EmptyHint, {
                  text: "Nothing on the calendar. Ask me to `schedule interview with {candidate}` when a candidate confirms.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  upcomingInterviews.map((i) => {
                    const cand = candidateMap.get(i.candidateSlug);
                    const role = i.roleId ? roleMap.get(i.roleId) : null;
                    const name = (cand && cand.name) || i.candidateSlug || "Unknown";
                    const roleLabel = (role && role.title) || (cand && cand.role) || "";
                    return h(
                      "li",
                      { key: i.id, className: "flex items-center gap-3 py-2.5" },
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          name,
                          roleLabel ? h("span", { className: "text-gray-500 font-normal" }, ` · ${roleLabel}`) : null
                        ),
                        h(
                          "div",
                          { className: "text-xs text-gray-600 truncate" },
                          formatRelative(i.scheduledAt),
                          i.interviewer ? ` · with ${i.interviewer}` : "",
                          i.round ? ` · round ${i.round}` : ""
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleInterviewBrief(i.candidateSlug),
                          className: "text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Brief"
                      )
                    );
                  })
                )
        ),

        // At-risk candidates
        h(
          "div",
          { className: "bg-white rounded-lg border border-gray-200 p-5" },
          h(SectionHeader, {
            title: "Stalled candidates",
            subtitle: "Gone quiet more than 5 days.",
          }),
          loading
            ? h("div", { className: "space-y-1" }, h(SkeletonRow), h(SkeletonRow), h(SkeletonRow))
            : atRiskList.length === 0
              ? h(EmptyHint, {
                  text: "Nothing stalled. Ask me to `daily standup` for a ranked brief.",
                })
              : h(
                  "ul",
                  { className: "divide-y divide-gray-100" },
                  atRiskList.map((c) => {
                    const role = c.roleId ? roleMap.get(c.roleId) : null;
                    const name = c.name || c.slug || "Unknown";
                    const roleLabel = (role && role.title) || c.role || "";
                    const days = daysSince(c.lastTouchedAt);
                    return h(
                      "li",
                      { key: c.slug || c.id, className: "flex items-center gap-3 py-2.5" },
                      h(
                        "span",
                        {
                          className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${stageChipClass(c.stage)}`,
                        },
                        c.stage || "unknown"
                      ),
                      h(
                        "div",
                        { className: "flex-1 min-w-0" },
                        h(
                          "div",
                          { className: "text-sm font-medium text-gray-900 truncate" },
                          name,
                          roleLabel ? h("span", { className: "text-gray-500 font-normal" }, ` · ${roleLabel}`) : null
                        ),
                        h(
                          "div",
                          { className: "text-xs text-gray-600 truncate" },
                          days != null ? `last touched ${days}d ago` : "no recent activity"
                        )
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleReviewCandidate(c.slug),
                          className: "text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1 transition-colors",
                        },
                        "Review"
                      )
                    );
                  })
                )
        )
      )
    );
  }

  window.__houston_bundle__ = { RecruiterDashboard: RecruiterDashboard };
})();
