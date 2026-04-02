import React, { useState, useEffect } from 'react';

function DetectionFilters({ value, onChange }) {
  const [localFilters, setLocalFilters] = useState(value);

  useEffect(() => {
    setLocalFilters(value);
  }, [value]);

  useEffect(() => {
    onChange(localFilters);
  }, [localFilters, onChange]);

  const set = (k, v) => setLocalFilters({ ...localFilters, [k]: v });

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
      <div className="text-white font-semibold mb-2">Filters</div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Media Type</label>
        <select className="w-full bg-black/40 text-white rounded px-3 py-2 border border-white/10" value={localFilters.media} onChange={e => set('media', e.target.value)}>
          <option value="">All</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="audio">Audio</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Window</label>
        <select className="w-full bg-black/40 text-white rounded px-3 py-2 border border-white/10" value={localFilters.window} onChange={e => set('window', e.target.value)}>
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7d</option>
          <option value="30d">Last 30d</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Country (ISO-2)</label>
        <input className="w-full bg-black/40 text-white rounded px-3 py-2 border border-white/10" placeholder="e.g., US, IN, DE" value={localFilters.country} onChange={e => set('country', e.target.value.toUpperCase())} />
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Confidence Range</label>
        <div className="flex gap-2">
          <input type="number" min="0" max="1" step="0.05" className="flex-1 bg-black/40 text-white rounded px-3 py-2 border border-white/10" value={localFilters.min_conf} onChange={e => set('min_conf', parseFloat(e.target.value || 0))} />
          <input type="number" min="0" max="1" step="0.05" className="flex-1 bg-black/40 text-white rounded px-3 py-2 border border-white/10" value={localFilters.max_conf} onChange={e => set('max_conf', parseFloat(e.target.value || 1))} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm text-gray-300">Verification Status</label>
        <select className="w-full bg-black/40 text-white rounded px-3 py-2 border border-white/10" value={localFilters.verification_status} onChange={e => set('verification_status', e.target.value)}>
          <option value="">All</option>
          <option value="unverified">Unverified</option>
          <option value="verified">Verified</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>
    </div>
  );
}

export default DetectionFilters;
