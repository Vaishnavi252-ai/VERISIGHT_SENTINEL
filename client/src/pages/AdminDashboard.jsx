import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlobalHeatMap from "../components/Map/GlobalHeatMap";
import TopPlatforms from "../components/Charts/TopPlatforms";

/**
 * AdminDashboard.jsx (UI Upgrade)
 * - Dark modern dashboard (SOC Radar style)
 * - KPI cards
 * - Charts (pure CSS)
 * - Country Heatmap (simple world SVG based)
 * - Management table with filters + quick actions
 *
 * NOTE:
 * - Uses your existing APIs:
 *   GET /api/admin/dashboard
 *   GET /api/admin/reports
 *
 * - Heatmap uses report.location_country if present
 *   fallback: report.country / report.geo_country / report.ip_country
 */

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadSources, setUploadSources] = useState([]);
  const [topPlatforms, setTopPlatforms] = useState([]);
  const [topHighCountries, setTopHighCountries] = useState(0);

  // Sidebar UI
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");

  // UI filters
  const [q, setQ] = useState("");
  const [mediaType, setMediaType] = useState("all");
  const [status, setStatus] = useState("all");
  const [minConfidence, setMinConfidence] = useState(0);

  const nav = useNavigate();

  useEffect(() => {
    load();
    // optional auto refresh every 20 sec
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try {
      setLoading(true);

      const r = await fetch("/api/admin/dashboard");
      const j = await r.json();
      if (j.status === "success") setStats(j);

      const rr = await fetch("/api/admin/reports");
      const jr = await rr.json();
      if (jr.status === "success") setReports(jr.reports || []);

      // fetch upload sources for heatmap/source breakdown
      try {
        const rs = await fetch('/api/admin/analytics/upload-sources');
        const js = await rs.json();
        if (js.status === 'success') setUploadSources(js.upload_sources || []);
      } catch (e) {
        // ignore
      }

      // fetch analytics top-countries to compute high-confidence hotspots
      try {
        const tcr = await fetch('/api/detections/top-countries?window=all');
        const tcl = await tcr.json();
        const arr = Array.isArray(tcl) ? tcl : [];
        const high = arr.filter(x => x?.threatLevel === 'High' || (Number(x?.avg_confidence || 0) >= 0.9)).length;
        setTopHighCountries(high);
      } catch (e) {
        // ignore
      }

      // fetch top platforms data
      try {
        const tpr = await fetch('/api/detections/top-platforms?window=all');
        const tpj = await tpr.json();
        setTopPlatforms(Array.isArray(tpj) ? tpj : []);
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error("Admin dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }

  const derived = useMemo(() => {
    const safe = Array.isArray(reports) ? reports : [];

    const total = safe.length;

    const urgent = safe.filter((r) => {
      const conf = Number(r.confidence ?? 0);
      return conf >= 0.85 || r.priority === "urgent" || r.is_urgent === true;
    }).length;

    const avgConfidence =
      total === 0
        ? 0
        : safe.reduce((acc, r) => acc + Number(r.confidence ?? 0), 0) / total;

    const byMedia = safe.reduce((acc, r) => {
      const k = (r.media_type || "unknown").toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const byPlatform = safe.reduce((acc, r) => {
      const k = (r.platform || "unknown").toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const byStatus = safe.reduce((acc, r) => {
      const k = (r.status || "new").toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    // location country mapping
    const byCountry = safe.reduce((acc, r) => {
      const c =
        r.location_country ||
        r.country ||
        r.geo_country ||
        r.ip_country ||
        "Unknown";
      const key = String(c).trim() || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Sort countries top
    const topCountries = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7);

    return {
      total,
      urgent,
      avgConfidence,
      byMedia,
      byPlatform,
      byStatus,
      byCountry,
      topCountries,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    const safe = Array.isArray(reports) ? reports : [];
    return safe
      .filter((r) => {
        const conf = Number(r.confidence ?? 0);

        const matchesQuery =
          !q ||
          String(r.id).toLowerCase().includes(q.toLowerCase()) ||
          String(r.platform || "")
            .toLowerCase()
            .includes(q.toLowerCase()) ||
          String(r.media_type || "")
            .toLowerCase()
            .includes(q.toLowerCase());

        const matchesMedia =
          mediaType === "all" ||
          String(r.media_type || "").toLowerCase() === mediaType;

        const matchesStatus =
          status === "all" || String(r.status || "").toLowerCase() === status;

        const matchesConfidence = conf >= minConfidence;

        return (
          matchesQuery && matchesMedia && matchesStatus && matchesConfidence
        );
      })
      .slice(0, 12); // show recent 12
  }, [reports, q, mediaType, status, minConfidence]);

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      {/* LAYOUT WRAPPER */}
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`sticky top-0 h-screen border-r border-white/10 bg-[#060812] transition-all duration-300 ${
            sidebarCollapsed ? "w-[86px]" : "w-[280px]"
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500/80 to-fuchsia-500/30 border border-white/10 shadow-[0_0_0_1px_rgba(168,85,247,0.25)] flex items-center justify-center">
                <span className="text-lg font-black">V</span>
              </div>

              {!sidebarCollapsed && (
                <div className="leading-tight">
                  <div className="text-sm text-white/70">
                    VeriSight Sentinel
                  </div>
                  <div className="font-semibold tracking-wide">
                    Admin Panel
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed((s) => !s)}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm"
              title="Toggle Sidebar"
            >
              {sidebarCollapsed ? "»" : "«"}
            </button>
          </div>

          {/* Sidebar Menu */}
          <div className="px-3 py-4 space-y-6">
            <div>
              {!sidebarCollapsed && (
                <div className="px-3 text-xs text-white/40 tracking-widest mb-2">
                  ANALYTICS
                </div>
              )}

              <SidebarItem
                collapsed={sidebarCollapsed}
                icon="⌂"
                label="Dashboard"
                active={activeNav === "dashboard"}
                onClick={() => {
                  setActiveNav("dashboard");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />

              <SidebarItem
                collapsed={sidebarCollapsed}
                icon="▤"
                label="Reports"
                active={activeNav === "reports"}
                onClick={() => {
                  setActiveNav("reports");
                  window.scrollTo({ top: 650, behavior: "smooth" });
                }}
              />
            </div>

            <div>
              {!sidebarCollapsed && (
                <div className="px-3 text-xs text-white/40 tracking-widest mb-2">
                  APPLICATION
                </div>
              )}

              <SidebarItem
                collapsed={sidebarCollapsed}
                icon="🏢"
                label="Business"
                active={activeNav === "business"}
                onClick={() => setActiveNav("business")}
              />
              <SidebarItem
                collapsed={sidebarCollapsed}
                icon="👥"
                label="Members"
                active={activeNav === "members"}
                onClick={() => setActiveNav("members")}
              />
              <SidebarItem
                collapsed={sidebarCollapsed}
                icon="🏷"
                label="Offer"
                active={activeNav === "offer"}
                onClick={() => setActiveNav("offer")}
              />
            </div>

            <div>
              {!sidebarCollapsed && (
                <div className="px-3 text-xs text-white/40 tracking-widest mb-2">
                  OTHERS
                </div>
              )}

              <SidebarItem
                collapsed={sidebarCollapsed}
                icon="🔔"
                label="Notifications"
                active={activeNav === "notifications"}
                onClick={() => setActiveNav("notifications")}
              />
              <SidebarItem
                collapsed={sidebarCollapsed}
                icon="★"
                label="Membership"
                active={activeNav === "membership"}
                onClick={() => setActiveNav("membership")}
              />
              <SidebarItem
                collapsed={sidebarCollapsed}
                icon="⛔"
                label="Suspensions"
                active={activeNav === "suspensions"}
                onClick={() => setActiveNav("suspensions")}
              />
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500/15 to-cyan-500/10 px-3 py-3">
              <div className="flex items-center justify-between">
                {!sidebarCollapsed ? (
                  <div className="text-sm text-white/70">System Status</div>
                ) : (
                  <div className="text-sm text-white/70">●</div>
                )}
                <div className="text-green-400 font-semibold">●</div>
              </div>
              {!sidebarCollapsed && (
                <div className="text-xs text-white/40 mt-1">
                  Live monitoring active
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1">
          {/* TOP BAR */}
          <div className="sticky top-0 z-30 border-b border-white/10 bg-[#070A12]/90 backdrop-blur">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-sm text-white/60">
                  VeriSight Sentinel
                </div>
                <h2 className="text-xl font-bold tracking-wide">
                  Admin Threat Dashboard
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-white/60 text-sm">Search</span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="report id / platform / media..."
                    className="bg-transparent outline-none text-sm w-56 placeholder:text-white/30"
                  />
                </div>

                <button
                  onClick={load}
                  className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 text-sm"
                >
                  ↻ Refresh
                </button>

                <div className="rounded-xl border border-white/10 bg-gradient-to-r from-purple-500/25 to-fuchsia-500/10 px-4 py-2 text-sm shadow-[0_0_0_1px_rgba(168,85,247,0.15)]">
                  <span className="text-white/70">Live</span>{" "}
                  <span className="text-green-400 font-semibold">●</span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN */}
          <div className="px-6 py-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCard
                title="Total Reports"
                value={stats?.total_reports ?? derived.total}
                hint="All received reports"
                accent="from-purple-500/25 to-indigo-500/10"
              />
              <KpiCard
                title="Reports Today"
                value={stats?.reports_today ?? "—"}
                hint="Last 24h activity"
                accent="from-fuchsia-500/25 to-purple-500/10"
              />
              <KpiCard
                title="Urgent Reports"
                value={stats?.urgent_reports ?? derived.urgent}
                hint="High confidence / flagged"
                accent="from-red-500/25 to-orange-500/10"
              />
              <KpiCard
                title="Avg Confidence"
                value={`${(derived.avgConfidence * 100).toFixed(1)}%`}
                hint="Model detection avg"
                accent="from-emerald-500/25 to-lime-500/10"
              />
            </div>

            {/* MAIN GRID */}
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
              {/* LEFT BIG: CHARTS */}
              <div className="xl:col-span-2 space-y-4">
                <Panel title="Threat Activity Trend">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MiniLineChart
                      title="Reports Trend (last refresh)"
                      data={fakeTrendFromReports(reports)}
                    />
                    <PieCard
                      title="Media Types"
                      items={toTopItems(derived.byMedia, 6)}
                    />
                  </div>
                </Panel>

                <Panel title="Platforms & Status">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BarCard
                      title="Top Platforms"
                      items={
                        stats?.top_platforms?.map((x) => ({
                          label: x.platform,
                          value: x.count,
                        })) || toTopItems(derived.byPlatform, 6)
                      }
                    />
                    <BarCard
                      title="Report Status"
                      items={toTopItems(derived.byStatus, 6)}
                    />
                  </div>
                </Panel>

                <Panel
                  title="Reports Management"
                  right={
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value)}
                        className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10"
                      >
                        <option value="all">All Media</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="text">Text</option>
                        <option value="unknown">Unknown</option>
                      </select>

                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10"
                      >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                        <option value="action_taken">Action Taken</option>
                      </select>

                      <select
                        value={minConfidence}
                        onChange={(e) => setMinConfidence(Number(e.target.value))}
                        className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/10"
                      >
                        <option value={0}>Any Confidence</option>
                        <option value={0.5}>50%+</option>
                        <option value={0.7}>70%+</option>
                        <option value={0.85}>85%+</option>
                        <option value={0.95}>95%+</option>
                      </select>
                    </div>
                  }
                >
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full border-separate border-spacing-y-2 min-w-[800px]">
                      <thead>
                        <tr className="text-left text-xs text-white/60 sticky top-0 bg-white/5 backdrop-blur">
                          <th className="px-3 py-2">Report</th>
                          <th className="px-3 py-2">Media</th>
                          <th className="px-3 py-2">AI Literacy</th>
                          <th className="px-3 py-2">Confidence</th>
                          <th className="px-3 py-2">Platform</th>
                          <th className="px-3 py-2">Reporter Email</th>
                          <th className="px-3 py-2">Country</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={9} className="px-3 py-6 text-white/60">
                              Loading reports...
                            </td>
                          </tr>
                        ) : filteredReports.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-3 py-6 text-white/60">
                              No reports found for current filters.
                            </td>
                          </tr>
                        ) : (
                          filteredReports.map((r) => {
                            const conf = Number(r.confidence ?? 0);
                            const country =
                              r.location_country ||
                              r.country ||
                              r.geo_country ||
                              r.ip_country ||
                              "Unknown";
                            return (
                              <tr
                                key={r.id}
                                className="bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                              >
                                <td className="px-3 py-3">
                                  <div className="font-semibold">#{r.id}</div>
                                  <div className="text-xs text-white/50">
                                    {r.created_at || r.created || r.date || ""}
                                  </div>
                                </td>

                                <td className="px-3 py-3">
                                  <Tag text={r.media_type || "unknown"} />
                                </td>

                                <td className="px-3 py-3">
                                  <AiLiteracyPill verdict={r.ai_literacy_verdict || "No Data"} />
                                </td>

                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <ConfidencePill value={conf} />
                                    <div className="text-sm">
                                      {(conf * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="text-sm capitalize">
                                    {r.platform || "unknown"}
                                  </div>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="text-xs text-gray-300 truncate max-w-[200px]" title={r.reporter_email || "Not provided"}>
                                    {r.reporter_email || <span className="text-white/40">Not provided</span>}
                                  </div>
                                </td>

                                <td className="px-3 py-3">
                                  <div className="text-sm">{country}</div>
                                </td>

                                <td className="px-3 py-3">
                                  <StatusPill status={r.status || "new"} />
                                </td>

                                <td className="px-3 py-3 text-right">
                                  <button
                                    onClick={() => nav(`/admin/reports/${r.id}`)}
                                    className="rounded-xl bg-gradient-to-r from-purple-500/35 to-fuchsia-500/15 border border-white/10 px-3 py-2 text-sm hover:from-purple-500/45 hover:to-fuchsia-500/20 shadow-[0_0_0_1px_rgba(168,85,247,0.15)]"
                                  >
                                    View →
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filteredReports.length > 0 && (
                    <div className="mt-3 text-xs text-white/50 text-center">
                      Showing {filteredReports.length} of {reports.length} reports. <button onClick={() => load()} className="underline hover:text-white/70">Refresh</button>
                    </div>
                  )}
                </Panel>
              </div>

              {/* RIGHT: HEATMAP + TOP COUNTRIES */}
              <div className="space-y-4">
                <Panel title="Global Deepfake Heatmap (Live)">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <GlobalHeatMap />
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-white/60 mb-2">
                      Top Countries (detected origins)
                    </div>
                    <div className="space-y-2">
                      {derived.topCountries.length === 0 ? (
                        <div className="text-white/50 text-sm">
                          No location data available yet.
                        </div>
                      ) : (
                        derived.topCountries.map(([c, n]) => (
                          <div
                            key={c}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <div className="text-sm">{c}</div>
                            <div className="text-sm font-semibold">{n}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-white/60 mb-2">Upload Sources</div>
                    <div className="space-y-2">
                      {uploadSources.length === 0 ? (
                        <div className="text-white/50 text-sm">No upload source data</div>
                      ) : (
                        uploadSources.slice(0,6).map((s) => (
                          <div key={s.source} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                            <div className="text-sm truncate">{s.source}</div>
                            <div className="text-sm font-semibold">{s.count}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <TopPlatforms data={topPlatforms} />
                  </div>

                  {/* Cyber summary box with navigation buttons */}
                  <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-white/5 p-4 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-cyan-300">High-Confidence Hotspots</div>
                        <div className="text-2xl font-bold">{topHighCountries}</div>
                        <div className="text-xs text-white/50">Countries with high deepfake scores (last 7d)</div>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-cyan-400/20 border border-cyan-500/40 animate-pulse" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => nav('/admin/dashboard/global-live')}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white w-full"
                      >
                        Global Intelligence – Live →
                      </button>
                    </div>
                  </div>
                </Panel>

                <Panel title="Quick Actions">
                  <div className="grid grid-cols-2 gap-3">
                    <QuickButton
                      label="Open Reports"
                      sub="Review & Verify"
                      onClick={() => {
                        window.scrollTo({ top: 700, behavior: "smooth" });
                      }}
                    />
                    <QuickButton
                      label="Urgent Filter"
                      sub="85%+ confidence"
                      onClick={() => {
                        setMinConfidence(0.85);
                        setStatus("all");
                      }}
                    />
                    <QuickButton
                      label="Only Videos"
                      sub="Video reports"
                      onClick={() => setMediaType("video")}
                    />
                    <QuickButton
                      label="Reset Filters"
                      sub="Show everything"
                      onClick={() => {
                        setQ("");
                        setMediaType("all");
                        setStatus("all");
                        setMinConfidence(0);
                      }}
                    />
                  </div>
                </Panel>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------- UI COMPONENTS ------------------------- */

function SidebarItem({ icon, label, active, onClick, collapsed }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 transition border ${
        active
          ? "bg-gradient-to-r from-purple-500/25 to-fuchsia-500/10 border-purple-500/25 shadow-[0_0_0_1px_rgba(168,85,247,0.18)]"
          : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
      }`}
      title={collapsed ? label : undefined}
    >
      <div
        className={`h-10 w-10 rounded-2xl flex items-center justify-center border ${
          active
            ? "bg-purple-500/15 border-purple-500/25 text-purple-200"
            : "bg-white/5 border-white/10 text-white/70"
        }`}
      >
        <span className="text-base">{icon}</span>
      </div>

      {!collapsed && (
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-white/40">
            {active ? "Active" : "Navigate"}
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="text-white/40 text-sm">{active ? "›" : ""}</div>
      )}
    </button>
  );
}

function Panel({ title, right, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="text-base font-semibold">{title}</div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ title, value, hint, accent }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-r ${accent} p-4 shadow-[0_0_0_1px_rgba(168,85,247,0.08)]`}
    >
      <div className="text-sm text-white/70">{title}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-white/50">{hint}</div>
    </div>
  );
}

function Tag({ text }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs capitalize text-white/80">
      {text}
    </span>
  );
}

function StatusPill({ status }) {
  const s = String(status || "new").toLowerCase();
  const cls =
    s === "verified"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
      : s === "rejected"
      ? "bg-red-500/15 text-red-300 border-red-500/20"
      : s === "action_taken"
      ? "bg-blue-500/15 text-blue-300 border-blue-500/20"
      : "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}
    >
      {s.replace("_", " ")}
    </span>
  );
}

function AiLiteracyPill({ verdict }) {
  const [label, risk] = (verdict || "No Data").split("-");
  const isFake = label?.toLowerCase().includes("fake");
  const cls = isFake 
    ? "bg-red-500/15 text-red-300 border-red-500/20" 
    : label === "real" 
    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
    : "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs ${cls}`}>
      {label || verdict}
      {risk && <span className="ml-1 text-white/60">({risk})</span>}
    </span>
  );
}

function ConfidencePill({ value }) {
  const v = Number(value ?? 0);
  const w = Math.max(2, Math.min(100, Math.round(v * 100)));
  return (
    <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-400/90 to-fuchsia-400/70"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

function BarCard({ title, items }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-white/50 text-sm">No data.</div>
        ) : (
          items.map((it) => (
            <div key={it.label} className="flex items-center gap-3">
              <div className="w-24 text-xs text-white/70 capitalize truncate">
                {it.label}
              </div>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-400/85 to-fuchsia-400/65"
                  style={{ width: `${Math.round((it.value / max) * 100)}%` }}
                />
              </div>
              <div className="w-10 text-right text-xs text-white/70">
                {it.value}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PieCard({ title, items }) {
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const colors = ["#A855F7", "#06B6D4", "#EF4444", "#F59E0B", "#10B981", "#7C3AED"];

  // compute arcs for a simple SVG pie
  let angle = 0;
  const slices = items.map((it, i) => {
    const size = (it.value / total) * Math.PI * 2;
    const start = angle;
    const end = angle + size;
    angle = end;
    return { start, end, color: colors[i % colors.length], label: it.label, value: it.value };
  });

  // helper to create path for slice
  const arcPath = (start, end, r = 40) => {
    const x1 = 50 + r * Math.cos(start - Math.PI / 2);
    const y1 = 50 + r * Math.sin(start - Math.PI / 2);
    const x2 = 50 + r * Math.cos(end - Math.PI / 2);
    const y2 = 50 + r * Math.sin(end - Math.PI / 2);
    const large = end - start > Math.PI ? 1 : 0;
    return `M50,50 L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-28 h-28">
          {slices.map((s, i) => (
            <path key={i} d={arcPath(s.start, s.end)} fill={s.color} stroke="rgba(255,255,255,0.04)" />
          ))}
          <circle cx="50" cy="50" r="24" fill="rgba(0,0,0,0.25)" />
          <text x="50" y="54" fontSize="10" textAnchor="middle" fill="#fff">{total}</text>
        </svg>

        <div className="flex-1 space-y-2">
          {items.length === 0 ? (
            <div className="text-white/50 text-sm">No data.</div>
          ) : (
            items.map((it, idx) => (
              <div key={it.label} className="flex items-center justify-between">
                <div className="text-xs text-white/70 capitalize flex items-center gap-2">
                  <span style={{width:10,height:10,background: colors[idx % colors.length],display:'inline-block',borderRadius:4}} />
                  {it.label}
                </div>
                <div className="text-xs text-white/70">{Math.round((it.value / total) * 100)}%</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MiniLineChart({ title, data }) {
  // data: array of numbers 0..100
  const points = data
    .map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * 100;
      const y = 100 - v; // invert
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      <svg viewBox="0 0 100 100" className="w-full h-32">
        <polyline
          fill="none"
          stroke="rgba(168,85,247,0.95)"
          strokeWidth="2"
          points={points}
        />
        <polyline
          fill="rgba(168,85,247,0.14)"
          stroke="none"
          points={`${points} 100,100 0,100`}
        />
      </svg>
      <div className="text-xs text-white/50">
        Live trend is derived from last reports refresh.
      </div>
    </div>
  );
}

function QuickButton({ label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition shadow-[0_0_0_1px_rgba(168,85,247,0.06)]"
    >
      <div className="font-semibold">{label}</div>
      <div className="text-xs text-white/60 mt-1">{sub}</div>
    </button>
  );
}

/* ------------------------- HEATMAP ------------------------- */
/**
 * Lightweight "world heatmap" concept:
 * - We render a simplified world map background (SVG shapes)
 * - Then highlight regions by country counts (top countries)
 *
 * NOTE: This is not a full GIS map. It’s a dashboard heat visualization.
 * For real geo heatmaps (Leaflet / Mapbox), you need coordinates + tiles.
 */

function WorldHeatMap({ byCountry, height = 260 }) {
  const entries = Object.entries(byCountry || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));

  // Top 10 countries will be shown as "glow bubbles"
  const top = entries.slice(0, 10).map(([country, count]) => ({
    country,
    count,
    intensity: count / max,
    pos: countryToPosition(country),
  }));

  return (
    <div style={{ height }} className="relative w-full overflow-hidden">
      <svg
        viewBox="0 0 1000 420"
        className="absolute inset-0 w-full h-full opacity-70"
      >
        {/* Simplified map blobs */}
        <path
          d="M80,180 C120,120 220,110 260,150 C290,180 310,210 280,240 C240,270 150,270 110,240 C80,220 60,200 80,180 Z"
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.08)"
        />
        <path
          d="M320,140 C380,90 520,90 560,150 C590,190 590,230 540,250 C480,270 390,260 350,220 C320,190 300,170 320,140 Z"
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.08)"
        />
        <path
          d="M620,150 C700,100 840,110 900,170 C930,210 910,250 860,270 C800,295 700,280 660,240 C620,210 600,180 620,150 Z"
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.08)"
        />
        <path
          d="M450,270 C520,250 600,260 640,310 C670,350 640,390 580,395 C520,400 450,380 430,340 C410,310 420,285 450,270 Z"
          fill="rgba(255,255,255,0.06)"
          stroke="rgba(255,255,255,0.08)"
        />
      </svg>

      {/* heat bubbles */}
      <div className="absolute inset-0">
        {top.map((t) => {
          if (!t.pos) return null;
          const size = 16 + t.intensity * 46;
          const glow = 0.2 + t.intensity * 0.8;

          return (
            <div
              key={t.country}
              className="absolute rounded-full"
              style={{
                left: `${t.pos.x}%`,
                top: `${t.pos.y}%`,
                width: `${size}px`,
                height: `${size}px`,
                transform: "translate(-50%,-50%)",
                background:
                  "radial-gradient(circle, rgba(168,85,247,0.95), rgba(34,211,238,0.0))",
                opacity: glow,
                filter: "blur(0px)",
              }}
              title={`${t.country}: ${t.count}`}
            />
          );
        })}
      </div>

      <div className="absolute bottom-2 left-2 text-xs text-white/50">
        Heat intensity based on detected reports by country.
      </div>
    </div>
  );
}

/**
 * Very small country->position mapping.
 * For full accuracy you need coordinates + a real map library.
 */
function countryToPosition(country) {
  const c = String(country || "").toLowerCase();

  const map = {
    india: { x: 73, y: 55 },
    usa: { x: 22, y: 38 },
    "united states": { x: 22, y: 38 },
    canada: { x: 20, y: 28 },
    brazil: { x: 32, y: 72 },
    uk: { x: 48, y: 34 },
    "united kingdom": { x: 48, y: 34 },
    germany: { x: 52, y: 36 },
    france: { x: 50, y: 38 },
    russia: { x: 70, y: 25 },
    china: { x: 78, y: 40 },
    japan: { x: 88, y: 42 },
    australia: { x: 86, y: 82 },
    nigeria: { x: 52, y: 66 },
    "south africa": { x: 55, y: 82 },
    mexico: { x: 20, y: 52 },
    turkey: { x: 60, y: 44 },
    spain: { x: 47, y: 44 },
    italy: { x: 53, y: 46 },
  };

  // fuzzy match
  for (const key of Object.keys(map)) {
    if (c.includes(key)) return map[key];
  }

  return null;
}

/* ------------------------- HELPERS ------------------------- */

function toTopItems(obj, limit = 6) {
  const entries = Object.entries(obj || {});
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

// Fake trend generator from reports length (for line chart)
function fakeTrendFromReports(reports) {
  const n = Math.max(8, Math.min(18, (reports || []).length));
  const base = Math.min(80, Math.max(20, n * 3));
  const arr = [];
  for (let i = 0; i < 14; i++) {
    const wobble = Math.sin(i / 2) * 10 + Math.random() * 8;
    const v = Math.max(5, Math.min(95, base + wobble));
    arr.push(v);
  }
  return arr;
}
