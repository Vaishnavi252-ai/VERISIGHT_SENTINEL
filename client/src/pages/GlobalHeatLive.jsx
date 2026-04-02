import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlobalHeatMap from '../components/Map/GlobalHeatMap';
import CountryBarChart from '../components/Charts/CountryBarChart';
import TrendLineChart from '../components/Charts/TrendLineChart';
import ConfidenceDonut from '../components/Charts/ConfidenceDonut';
import DetectionFilters from '../components/Filters/DetectionFilters';
import TopPlatforms from '../components/Charts/TopPlatforms';
import OmniThreatPulse from '../components/OmniThreatPulse';

function GlobalHeatLive() {
  const [metrics, setMetrics] = useState({ total: 0, window_total: 0, by_media: { image: 0, video: 0, audio: 0 } });
  const [topCountries, setTopCountries] = useState([]);
  const [trends, setTrends] = useState([]);
  const [confDist, setConfDist] = useState({ bins: [] });
  const [topPlatforms, setTopPlatforms] = useState([]);
  const [filters, setFilters] = useState({ media: '', country: '', window: '24h', min_conf: 0.0, max_conf: 1.0, verification_status: '' });
  const [chatInput, setChatInput] = useState('Explain spikes in last 7 days');
  const [chatLogs, setChatLogs] = useState([]);

  const evtSrcRef = useRef(null);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (filters.media) p.set('media', filters.media);
    if (filters.country) p.set('country', filters.country);
    if (filters.window) p.set('window', filters.window);
    if (filters.min_conf != null) p.set('min_conf', filters.min_conf);
    if (filters.max_conf != null) p.set('max_conf', filters.max_conf);
    if (filters.verification_status) p.set('verification_status', filters.verification_status);
    return p.toString();
  }, [filters]);

  const fetchAll = async () => {
    const [m, c, t, d, p] = await Promise.all([
      fetch(`/api/detections/metrics?${query}`).then(r => r.json()).catch(() => ({ total: 0, window_total: 0, by_media: { image: 0, video: 0, audio: 0 } })),
      fetch(`/api/detections/top-countries?${query}`).then(r => r.json()).catch(() => []),
      fetch(`/api/detections/trends?${query}`).then(r => r.json()).catch(() => []),
      fetch(`/api/detections/confidence-distribution?${query}`).then(r => r.json()).catch(() => ({ bins: [] })),
      fetch(`/api/detections/top-platforms?${query}`).then(r => r.json()).catch(() => []),
    ]);
    setMetrics(m);
    setTopCountries(Array.isArray(c) ? c : []);
    setTrends(Array.isArray(t) ? t : []);
    setConfDist(d);
    setTopPlatforms(Array.isArray(p) ? p : []);
  };

  useEffect(() => {
    fetchAll();
  }, [query]);

  useEffect(() => {
    if (evtSrcRef.current) {
      evtSrcRef.current.close();
      evtSrcRef.current = null;
    }
    const es = new EventSource('http://localhost:5000/api/detections/stream');
    es.onopen = () => console.log('SSE connected');
    es.onerror = (e) => console.log('SSE error', e);
    es.addEventListener('detection', (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('New detection received:', data); // Logging for debugging
        window.dispatchEvent(new CustomEvent('new-detection', { detail: data }));
        console.log('Detection confidence:', data.confidence); // Debug confidence
        // Update global counts for every detection
        setMetrics(prev => ({
          ...prev,
          total: prev.total + 1,
          window_total: prev.window_total + 1,
          by_media: {
            ...prev.by_media,
            [data.media_type]: (prev.by_media[data.media_type] || 0) + 1
          }
        }));
      } catch (err) {
        console.error('Error processing detection event:', err);
      }
    });
    evtSrcRef.current = es;
    return () => es.close();
  }, []);

  const onChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt) return;
    setChatLogs(prev => [...prev, { role: 'user', text: prompt }]);
    setChatInput('');

    try {
      const context = { filters, topCountries, trends, confDist };
      const res = await fetch('/api/analytics/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context })
      });
      const j = await res.json();
      const message = j.message || j.text || j.summary || (j.status === 'error' ? `Analytics error: ${j.error || 'Unknown error'}` : 'Analytics assistant returned an unexpected response.');
      setChatLogs(prev => [...prev, { role: 'assistant', text: message }]);
    } catch (e) {
      setChatLogs(prev => [...prev, { role: 'assistant', text: 'Error contacting analytics explain service.' }]);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#070b1a] text-gray-200 px-6 pt-28 pb-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">Global Deepfake Intelligence – Live</h1>

          {/* Top metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total Detections" value={metrics.total || 0} />
            <MetricCard label={`Window (${filters.window || '24h'})`} value={metrics.window_total || 0} />
            <MetricCard label="Images" value={metrics.by_media?.image || 0} />
            <MetricCard label="Videos" value={metrics.by_media?.video || 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Map + Alerts */}
            <div className="lg:col-span-3 space-y-6">
              <GlobalHeatMap filters={filters} />
              <OmniThreatPulse />
            </div>

            {/* Right: Filters + Charts */}
            <div className="lg:col-span-1 space-y-6">
              <DetectionFilters value={filters} onChange={setFilters} />
              <TopPlatforms data={topPlatforms} />
              <CountryBarChart data={topCountries} />
              <ConfidenceDonut data={confDist?.bins || []} />
            </div>
          </div>

          <div className="mt-8">
            <TrendLineChart data={trends} />
          </div>

          {/* Global Intelligence Analytics Section */}
          <div className="mt-8">
            <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6">Global Intelligence Analytics</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Analytics Chat */}
                  <div className="bg-black/30 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4">Analytics Chat</h3>
                    <div className="h-80 overflow-y-auto space-y-3 bg-black/40 p-3 rounded-lg mb-4">
                      {chatLogs.length === 0 && (
                        <div className="text-sm text-gray-400 italic">Ask questions about trends, spikes, or threats...</div>
                      )}
                      {chatLogs.map((m, i) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded-lg ${
                            m.role === 'user' 
                              ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-200' 
                              : 'bg-green-600/20 border border-green-500/30 text-green-200'
                          }`}
                        >
                          <div className="text-xs font-semibold mb-1 opacity-70">
                            {m.role === 'user' ? 'You' : 'AI Assistant'}
                          </div>
                          <div className="text-sm">{m.text}</div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={onChatSubmit} className="flex gap-2">
                      <input 
                        className="flex-1 bg-black/50 text-white rounded-lg px-4 py-3 outline-none border border-white/20 focus:border-cyan-500/50 transition-colors" 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)} 
                        placeholder="Ask about spikes, trends, threats..." 
                      />
                      <button 
                        type="submit"
                        className="px-5 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors"
                      >
                        Send
                      </button>
                    </form>
                  </div>

                  {/* Additional Charts for Intelligence */}
                  <div className="space-y-6">
                    <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-purple-300 mb-3">Intelligence Overview</h3>
                      <p className="text-sm text-gray-300 mb-4">
                        This section provides deeper insights into global deepfake detection patterns. 
                        Use the analytics chat to ask specific questions about trends, anomalies, or regional patterns.
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                          <div className="text-xs text-gray-400">Avg Confidence</div>
                          <div className="text-xl font-semibold text-white">{topCountries.length > 0 ? `${Math.round(topCountries.reduce((sum, c) => sum + (c.avg_confidence || 0), 0) / topCountries.length * 100)}%` : '0%'}</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                          <div className="text-xs text-gray-400">Active Regions</div>
                          <div className="text-xl font-semibold text-white">{topCountries.length}</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                          <div className="text-xs text-gray-400">Flagged Cases</div>
                          <div className="text-xl font-semibold text-white">{metrics.total - (topCountries.reduce((sum, c) => sum + c.count, 0) || 0)}</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                          <div className="text-xs text-gray-400">Verified</div>
                          <div className="text-xl font-semibold text-white">{topCountries.filter(c => c.threatLevel === 'High').reduce((sum, c) => sum + c.count, 0)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-green-300 mb-3">Quick Insights</h3>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Real-time detection stream is active</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Filter by media type, country, or confidence range</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>High-confidence alerts appear automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>Use analytics chat for custom data queries</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default GlobalHeatLive;
