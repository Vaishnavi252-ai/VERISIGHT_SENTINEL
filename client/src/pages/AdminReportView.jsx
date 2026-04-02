import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function AdminReportView() {
  const { id } = useParams();
  const nav = useNavigate();

  const [report, setReport] = useState(null);
  const [detection, setDetection] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const r = await fetch(`/api/admin/reports/${id}`);
    const j = await r.json();
    if (j.status === "success") {
      setReport(j.report);
      setDetection(j.detection);
      setAiSummary(j.ai_summary);
    }
  }

  async function takeAction(action) {
    try {
      setBusy(true);
      const res = await fetch(`/api/admin/reports/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json();
      if (j.status === "success") load();
    } finally {
      setBusy(false);
    }
  }

  if (!report)
    return (
      <div className="min-h-screen bg-[#070A12] text-white p-6">
        <div className="text-white/60">Loading report...</div>
      </div>
    );

  const conf = Number(detection?.confidence ?? report?.confidence ?? 0);
  const country =
    report.location_country ||
    report.country ||
    report.geo_country ||
    report.ip_country ||
    "Unknown";

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      {/* TOP BAR */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#070A12]/90 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-white/60">VeriSight Sentinel</div>
            <h2 className="text-xl font-bold">Report Investigation</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => nav(-1)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              ← Back
            </button>

            <a
              className="rounded-xl border border-white/10 bg-gradient-to-r from-purple-500/30 to-cyan-500/20 px-4 py-2 text-sm hover:bg-white/10"
              href={`/api/admin/reports/${report.id}/download`}
            >
              ⬇ Download PDF
            </a>

            <button
              onClick={async () => {
                let email = report.reporter_email;
                if (!email || email.trim() === '') {
                  email = prompt('Enter reporter email to send PDF:');
                  if (!email || email.trim() === '') {
                    alert('Email is required to send PDF');
                    return;
                  }
                }
                try {
                  const res = await fetch(`/api/admin/reports/${report.id}/send-pdf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email.trim() })
                  });
                  const j = await res.json();
                  if (j.status === 'success') {
                    alert('PDF sent successfully to ' + email);
                  } else {
                    alert('Failed to send PDF: ' + (j.error || 'Unknown error'));
                  }
                } catch (e) {
                  alert('Failed to send PDF');
                }
              }}
              className="rounded-xl border border-white/10 bg-gradient-to-r from-green-500/30 to-blue-500/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              📧 Send PDF
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* HEADER SUMMARY */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-sm text-white/60">Report ID</div>
              <div className="text-2xl font-bold">#{report.id}</div>

              <div className="mt-2 flex flex-wrap gap-2">
                <StatusPill status={report.status || "new"} />
                <Tag text={report.media_type || detection?.media_type || "unknown"} />
                <Tag text={report.platform || "unknown"} />
                <Tag text={country} />
              </div>
            </div>

            <div className="min-w-[260px]">
              <div className="text-sm text-white/60">Detection Confidence</div>
              <div className="mt-2 flex items-center gap-3">
                <ConfidenceBar value={conf} />
                <div className="text-lg font-semibold">
                  {(conf * 100).toFixed(2)}%
                </div>
              </div>
              <div className="text-xs text-white/50 mt-1">
                Result:{" "}
                <span className="text-white/80">
                  {detection?.result_label || report?.result_label || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-4">
            <Panel title="Detection Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard
                  label="Media Type"
                  value={detection?.media_type || report.media_type || "unknown"}
                />
                <InfoCard
                  label="Platform"
                  value={report.platform || "unknown"}
                />
                <InfoCard
                  label="Country"
                  value={country}
                />
                <InfoCard
                  label="Status"
                  value={(report.status || "new").toUpperCase()}
                />
                <InfoCard
                  label="Reporter Email"
                  value={report.reporter_email || "Not provided"}
                />
                <InfoCard
                  label="Submitted On"
                  value={report.created_at ? new Date(report.created_at).toLocaleString() : "Unknown"}
                />
              </div>
            </Panel>

            <Panel title="AI Forensic Summary">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {aiSummary ? (
                  <div>
                    <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/5 border border-purple-500/20">
                      <div className="font-semibold text-purple-300 mb-1">Final Verdict</div>
                      <div className="text-lg">{aiSummary['1_final_verdict']?.classification || 'N/A'}</div>
                      <div className="text-sm text-white/70">
                        Confidence: {aiSummary['1_final_verdict']?.confidence_score || 'N/A'} | Risk: {aiSummary['1_final_verdict']?.risk_level || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="text-white/80 text-sm leading-relaxed mb-4">
                      {aiSummary['2_ai_literacy_explanation'] || "No explanation available."}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm font-semibold mb-2 text-emerald-300">Trust Scores (0-10)</div>
                        {aiSummary['7_trust_score_breakdown'] && Object.entries(aiSummary['7_trust_score_breakdown']).map(([key, val]) => (
                          <div key={key} className="text-xs mb-1">
                            <span className="font-medium">{key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {val}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-sm font-semibold mb-2 text-yellow-300">Key Indicators</div>
                        {aiSummary['3_key_detection_indicators'] && Object.entries(aiSummary['3_key_detection_indicators']).slice(0,3).map(([cat, items]) => (
                          <div key={cat} className="text-xs mb-1">
                            <span className="font-medium">{cat.replace('_', ' ')}:</span> {JSON.stringify(items).slice(0,50)}...
                          </div>
                        ))}
                      </div>
                    </div>

                    {aiSummary['8_final_summary'] && (
                      <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm font-semibold mb-1">Final Summary</div>
                        <div className="text-white/90">{aiSummary['8_final_summary']}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-yellow-400 text-sm">Generating AI Forensic Summary...</div>
                )}
              </div>
            </Panel>

            <Panel title="User Q&A">
              <div className="space-y-3">
                {(report.answers || []).length === 0 ? (
                  <div className="text-white/50 text-sm">
                    No answers submitted by user.
                  </div>
                ) : (
                  report.answers.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="text-sm font-semibold">
                        Q: {a.question}
                      </div>
                      <div className="text-sm text-white/70 mt-1">
                        A: {a.answer}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            <Panel title="Actions">
              <div className="grid grid-cols-1 gap-3">
                <ActionButton
                  disabled={busy}
                  onClick={() => takeAction("verify")}
                  className="from-emerald-500/40 to-lime-500/10"
                  label="✔ Verify"
                  sub="Mark as verified deepfake report"
                />
                <ActionButton
                  disabled={busy}
                  onClick={() => takeAction("investigate")}
                  className="from-yellow-500/40 to-orange-500/10"
                  label="🔎 Investigate"
                  sub="Start formal investigation"
                />
                <ActionButton
                  disabled={busy}
                  onClick={() => takeAction("cybercell_forward")}
                  className="from-purple-500/40 to-pink-500/10"
                  label="📤 Forward to CyberCell"
                  sub="Escalate and forward to CyberCell"
                />
                <ActionButton
                  disabled={busy}
                  onClick={() => takeAction("reject")}
                  className="from-red-500/40 to-orange-500/10"
                  label="❌ Reject"
                  sub="Reject as false report"
                />
                <ActionButton
                  disabled={busy}
                  onClick={() => takeAction("action_taken")}
                  className="from-blue-500/40 to-cyan-500/10"
                  label="📄 Action Taken"
                  sub="Mark mitigation action completed"
                />
              </div>

              <div className="mt-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-xs text-cyan-300 mb-1">📧 Email Notification</div>
                <div className="text-xs text-white/70">
                  {busy ? "Processing action..." : report.reporter_email ? `Action updates will be sent to: ${report.reporter_email}` : "No email provided - user won't receive notifications"}
                </div>
              </div>
            </Panel>

            <Panel title="Quick Overview">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                <Row label="Report ID" value={`#${report.id}`} />
                <Row label="Platform" value={report.platform || "unknown"} />
                <Row label="Media" value={report.media_type || "unknown"} />
                <Row
                  label="Confidence"
                  value={`${(conf * 100).toFixed(2)}%`}
                />
                <Row label="Country" value={country} />
                <Row label="Reporter Email" value={report.reporter_email || "Not provided"} />
                <Row label="Submitted" value={report.created_at ? new Date(report.created_at).toLocaleDateString() : "Unknown"} />
              </div>
            </Panel>

            <Panel title="Media Preview">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                {(() => {
                  const rawPath = detection?.file_path || report?.file_path || '';
                  if (!rawPath) return <div className="text-white/50 text-sm">No media attached</div>;
                  const normalized = rawPath.replaceAll('\\\\', '/').replace(/^\/+/, '');
                  const rel = normalized.includes('uploads/') ? normalized.split('uploads/').pop() : normalized;
                  const url = `/uploads/${rel}`;

                  if ((detection?.media_type || report?.media_type || '').includes('video')) {
                    return (
                      <video width="100%" controls className="rounded-md">
                        <source src={url} />
                        Your browser does not support the video tag.
                      </video>
                    );
                  }

                  return (
                    <img src={url} alt="preview" className="mx-auto max-h-48 rounded-md shadow" />
                  );
                })()}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI ---------------- */

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4">
      <div className="text-base font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-sm text-white/80">{value}</div>
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

function ConfidenceBar({ value }) {
  const v = Number(value ?? 0);
  const w = Math.max(2, Math.min(100, Math.round(v * 100)));
  return (
    <div className="w-40 h-2 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-purple-400/90 to-cyan-400/90"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

function ActionButton({ label, sub, onClick, className = "", disabled }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border border-white/10 bg-gradient-to-r ${className} p-4 text-left hover:bg-white/10 transition disabled:opacity-60`}
    >
      <div className="font-semibold">{label}</div>
      <div className="text-xs text-white/70 mt-1">{sub}</div>
    </button>
  );
}
