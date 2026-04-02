import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GlobalHeatMap from '../components/Map/GlobalHeatMap';
import CountryBarChart from '../components/Charts/CountryBarChart';
import TrendLineChart from '../components/Charts/TrendLineChart';
import ConfidenceDonut from '../components/Charts/ConfidenceDonut';
import DetectionFilters from '../components/Filters/DetectionFilters';

function GlobalIntel() {
  const [filters, setFilters] = useState({ media: '', country: '', window: '7d', min_conf: 0.0, max_conf: 1.0, verification_status: '' });
  const [topCountries, setTopCountries] = useState([]);
  const [trends, setTrends] = useState([]);
  const [confDist, setConfDist] = useState({ bins: [] });
  const [chatInput, setChatInput] = useState('Explain spikes in last 7 days');
  const [chatLogs, setChatLogs] = useState([]);

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
    const [c, t, d] = await Promise.all([
      fetch(`/api/detections/top-countries?${query}`).then(r => r.json()),
      fetch(`/api/detections/trends?${query}`).then(r => r.json()),
      fetch(`/api/detections/confidence-distribution?${query}`).then(r => r.json()),
    ]);
    setTopCountries(Array.isArray(c) ? c : []);
    setTrends(Array.isArray(t) ? t : []);
    setConfDist(d);
  };

  useEffect(() => { fetchAll(); }, [query]);

  const onChatSubmit = async (e) => {
    e.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt) return;
    setChatLogs(prev => [...prev, { role: 'user', text: prompt }]);

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
      setChatInput('');
    } catch (e) {
      setChatLogs(prev => [...prev, { role: 'assistant', text: 'Error contacting analytics explain service.' }]);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#070b1a] text-gray-200 px-6 py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-cyan-400">Global Intelligence</h1>
              <span className="text-gray-400 text-sm">World / Country toggle via filter</span>
            </div>
            <GlobalHeatMap />
            <CountryBarChart data={topCountries} />
            <TrendLineChart data={trends} />
            <ConfidenceDonut data={confDist?.bins || []} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <DetectionFilters value={filters} onChange={setFilters} />

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h2 className="text-lg font-semibold text-white mb-3">Analytics Chat</h2>
              <div className="h-64 overflow-y-auto space-y-2 bg-black/20 p-2 rounded">
                {chatLogs.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-cyan-300' : 'text-green-300'}>{m.role === 'user' ? 'You: ' : 'AI: '}{m.text}</div>
                ))}
              </div>
              <form onSubmit={onChatSubmit} className="mt-3 flex gap-2">
                <input className="flex-1 bg-black/40 text-white rounded px-3 py-2 outline-none border border-white/10" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about spikes, trends, threats..." />
                <button className="px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-700 text-white">Send</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default GlobalIntel;
