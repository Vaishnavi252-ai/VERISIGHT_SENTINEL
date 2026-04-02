import React, { useEffect, useMemo, useRef, useState } from 'react';

const MODALITIES = [
  { key: 'image', label: 'Image', color: '#60a5fa' },
  { key: 'video', label: 'Video', color: '#a78bfa' },
  { key: 'audio', label: 'Audio', color: '#f59e0b' },
  { key: 'text', label: 'Text', color: '#22c55e' },
];

const COUNTRY_FLAG_MAP = {
  US: '🇺🇸', IN: '🇮🇳', BR: '🇧🇷', DE: '🇩🇪',
  ID: '🇮🇩', NG: '🇳🇬', GB: '🇬🇧', CA: '🇨🇦',
};
const DEFAULT_FLAG = '🌐';
const MEDIA_MAP = {
  image: { key: 'image', label: 'Image', color: '#60a5fa' },
  video: { key: 'video', label: 'Video', color: '#a78bfa' },
  audio: { key: 'audio', label: 'Audio', color: '#f59e0b' },
  text: { key: 'text', label: 'Text', color: '#22c55e' },
};
const RESULT_LABELS = {
  FAKE: 'Deepfake',
  REAL: 'Authentic',
};

function getCountryFlag(code) {
  if (!code) return DEFAULT_FLAG;
  return COUNTRY_FLAG_MAP[code.toUpperCase()] || DEFAULT_FLAG;
}

function formatSecondsAgo(timestamp) {
  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000));
  return `${seconds} seconds ago`;
}

function mapDetectionToEvent(det) {
  const media = MEDIA_MAP[det.media_type] || MEDIA_MAP.image;
  const confidence = Math.round((Number(det.confidence) || 0) * 100);
  const countryCode = det.country || 'Unknown';
  const platform = det.platform || det.upload_source || det.ip || 'unknown';
  const threat = RESULT_LABELS[det.result_label] || det.result_label || 'Unknown';
  return {
    id: det.id ? String(det.id) : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: det.created_at ? new Date(det.created_at).getTime() : Date.now(),
    modality: media.key,
    label: media.label,
    color: media.color,
    country: countryCode,
    flag: getCountryFlag(det.country),
    platform,
    threat,
    confidence,
    type: det.media_type || 'image',
    result_label: det.result_label,
  };
}

export default function OmniThreatPulse() {
  const canvasRef = useRef(null);
  const wavePointsRef = useRef([]);
  const animationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 80 });
  const [paused, setPaused] = useState(false);
  const [events, setEvents] = useState([]);
  const eventsRef = useRef([]);
  const [mediaCounts, setMediaCounts] = useState({ image: 0, video: 0, audio: 0, text: 0 });
  const [totalCount, setTotalCount] = useState(0);
  const [alertInfo, setAlertInfo] = useState(null);
  const [alertCount, setAlertCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    if (filter === 'high') return events.filter(event => event.confidence > 85);
    return events.filter(event => event.modality === filter);
  }, [events, filter]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const counts = useMemo(() => ({
    image: mediaCounts.image || 0,
    video: mediaCounts.video || 0,
    audio: mediaCounts.audio || 0,
    text: mediaCounts.text || 0,
  }), [mediaCounts]);

  const recentSpikeCounts = useMemo(() => {
    const cutoff = Date.now() - 60000;
    return MODALITIES.reduce((acc, modality) => {
      acc[modality.key] = events.filter(event => event.modality === modality.key && event.timestamp >= cutoff).length;
      return acc;
    }, {});
  }, [events]);

  useEffect(() => {
    const measure = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parentWidth = Math.max(320, Math.floor(canvas.parentElement?.offsetWidth || 640));
      canvas.width = parentWidth;
      canvas.height = 80;
      setDimensions({ width: parentWidth, height: 80 });
      if (wavePointsRef.current.length !== parentWidth) {
        wavePointsRef.current = Array.from({ length: parentWidth }, () => ({ value: 0, color: '#475569' }));
      }
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const pushWavePoint = (event) => {
    const width = dimensions.width || 640;
    const value = Math.max(0.02, Math.min(1, (event.confidence || 0) / 100));
    const amplitude = 0.05 + value * 0.65;
    const next = wavePointsRef.current.slice(1);
    next.push({ value: amplitude, color: event.color });
    wavePointsRef.current = next;
  };

  const registerEvent = (event) => {
    setEvents(prev => [event, ...prev].slice(0, 60));
    setTotalCount(prev => prev + 1);
    setMediaCounts(prev => ({
      ...prev,
      [event.modality]: (prev[event.modality] || 0) + 1,
    }));
    pushWavePoint(event);

    const windowEvents = [event, ...eventsRef.current].filter(item => Date.now() - item.timestamp <= 8000);
    const modalitiesSeen = [...new Set(windowEvents.map(item => item.modality))];
    if (modalitiesSeen.length >= 3) {
      const countries = [...new Set(windowEvents.map(item => item.country))];
      setAlertInfo({ modalities: modalitiesSeen, country: countries[0] || event.country });
      setAlertCount(prev => prev + 1);
      setDismissedAlert(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [recentRes, metricsRes] = await Promise.all([
          fetch('/api/detections/recent?limit=12'),
          fetch('/api/detections/metrics?window=24h'),
        ]);
        const recentJson = await recentRes.json();
        const metricsJson = await metricsRes.json();

        const mappedEvents = Array.isArray(recentJson)
          ? recentJson.map(mapDetectionToEvent)
          : [];

        setEvents(mappedEvents);
        setTotalCount(metricsJson.total || 0);
        setMediaCounts({
          image: metricsJson.by_media?.image || 0,
          video: metricsJson.by_media?.video || 0,
          audio: metricsJson.by_media?.audio || 0,
          text: metricsJson.by_media?.text || 0,
        });
      } catch (error) {
        console.error('Failed to load Omni Threat Pulse data', error);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const source = new EventSource('/api/detections/stream');
    source.addEventListener('detection', (e) => {
      if (paused) return;
      try {
        const data = JSON.parse(e.data || '{}');
        const event = mapDetectionToEvent({
          id: data.id,
          created_at: data.timestamp,
          media_type: data.media_type,
          result_label: data.result_label,
          confidence: data.confidence,
          country: data.country,
          upload_source: data.upload_source,
          ip: data.ip,
          platform: data.platform,
        });
        registerEvent(event);
      } catch (err) {
        console.error('OmniThreatPulse SSE parse error', err);
      }
    });

    source.onerror = (err) => {
      console.error('OmniThreatPulse SSE error', err);
    };

    return () => {
      source.close();
    };
  }, [paused]);

  useEffect(() => {
    if (wavePointsRef.current.length === 0 && dimensions.width > 0) {
      wavePointsRef.current = Array.from({ length: dimensions.width }, () => ({ value: 0, color: '#475569' }));
    }
  }, [dimensions.width]);

  const onRefresh = async () => {
    try {
      const [recentRes, metricsRes] = await Promise.all([
        fetch('/api/detections/recent?limit=12'),
        fetch('/api/detections/metrics?window=24h'),
      ]);
      const recentJson = await recentRes.json();
      const metricsJson = await metricsRes.json();
      setEvents(Array.isArray(recentJson) ? recentJson.map(mapDetectionToEvent) : []);
      setTotalCount(metricsJson.total || 0);
      setMediaCounts({
        image: metricsJson.by_media?.image || 0,
        video: metricsJson.by_media?.video || 0,
        audio: metricsJson.by_media?.audio || 0,
        text: metricsJson.by_media?.text || 0,
      });
      setDismissedAlert(false);
    } catch (error) {
      console.error('Failed to refresh Omni Threat Pulse', error);
    }
  };

  const selectedStats = MODALITIES.map(modality => ({
    ...modality,
    count: counts[modality.key] || 0,
    newCount: recentSpikeCounts[modality.key] || 0,
  }));

  const activeSelection = filter === 'all' ? null : filter;

  return (
    <div className="bg-[#0f1117] rounded-3xl border border-white/10 p-5 shadow-[0_18px_60px_-40px_rgba(0,0,0,0.8)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.25em] text-cyan-300 font-semibold">Omni Threat Pulse</div>
            <div className="mt-2 text-2xl font-semibold text-white">Live cross-modal detection</div>
            <div className="mt-1 text-sm text-slate-400">Total events: {totalCount}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPaused(prev => !prev)}
              className="rounded-full bg-slate-800 px-4 py-2 text-sm text-white border border-white/10 hover:border-cyan-400/40"
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-full bg-slate-800 px-4 py-2 text-sm text-white border border-white/10 hover:border-cyan-400/40"
            >
              ↻ Refresh
            </button>
            <div className="rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300">Alerts: {alertCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {selectedStats.map((stat) => {
            const active = filter === stat.key;
            const widthPercent = totalCount > 0 ? Math.max(12, Math.min(96, (stat.count / Math.max(1, totalCount)) * 100)) : 12;
            return (
              <button
                key={stat.key}
                onClick={() => setFilter(filter === stat.key ? 'all' : stat.key)}
                className={`rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-cyan-500/30'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: stat.color }}>{stat.label}</span>
                  <span className="text-xs text-slate-400">{active ? 'Filtered' : 'Tap to filter'}</span>
                </div>
                <div className="mt-4 text-3xl font-bold text-white">{stat.count}</div>
                <div className="mt-2 text-xs text-slate-400">+{stat.newCount} new</div>
                <div className="mt-4 h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${widthPercent}%`, backgroundColor: stat.color }} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl bg-slate-950/70 p-4 border border-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">Live ECG waveform</div>
              <div className="text-xs text-slate-500 mt-1">Spikes represent detection confidence and modality intensity.</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              {MODALITIES.map(modality => (
                <span key={modality.key} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: modality.color }} />
                  {modality.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-3xl bg-[#070b1a] p-2">
            <canvas ref={canvasRef} className="w-full h-20" />
          </div>
          {alertInfo && !dismissedAlert && (
            <div className="mt-4 rounded-2xl bg-red-600/15 border border-red-500/30 p-3 text-sm text-red-100 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Cross-modal coordinated attack detected</div>
                <div className="mt-1 text-slate-200">Modalities: {alertInfo.modalities.join(', ')} · Country: {alertInfo.country}</div>
              </div>
              <button
                type="button"
                onClick={() => setDismissedAlert(true)}
                className="text-red-200 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-slate-950/70 p-4 border border-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-slate-400">Incoming detection stream</div>
              <div className="mt-1 text-xs text-slate-500">Latest detections appear at the top.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'image', 'video', 'audio', 'text', 'high'].map((pill) => {
                const label = pill === 'all' ? 'All' : pill === 'high' ? 'High risk only' : pill.charAt(0).toUpperCase() + pill.slice(1);
                const active = filter === pill;
                return (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setFilter(pill)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active ? 'bg-cyan-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {filteredEvents.slice(0, 12).map((event) => (
              <div
                key={event.id}
                className={`group overflow-hidden rounded-2xl border border-white/10 p-3 transition duration-300 ${event.confidence > 85 ? 'bg-red-500/10' : 'bg-white/5'} ${activeSelection === event.modality ? 'ring-2 ring-cyan-400/30' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: event.color }} />
                  <span>{event.flag}</span>
                  <span>{event.type}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5">{event.platform}</span>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{event.threat}</div>
                    <div className="text-xs text-slate-400">{event.country} · {event.label}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{event.confidence}%</div>
                    <div className="text-xs text-slate-400">{formatSecondsAgo(event.timestamp)}</div>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${event.confidence}%`, backgroundColor: event.color }} />
                </div>
              </div>
            ))}
            {filteredEvents.length === 0 && (
              <div className="rounded-2xl bg-white/5 p-4 text-center text-sm text-slate-400">No events match the current filter.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
