import React, { useState, useEffect, useRef } from 'react';
import { Upload, Headphones as AudioIcon, ArrowRight, X, BrainCircuit } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AudioScan = () => {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationShown, setExplanationShown] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [waveformData, setWaveformData] = useState(null);
  
  const audioRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location?.state?.file) {
      setFile(location.state.file);
      setAudioUrl(URL.createObjectURL(location.state.file));
    }
  }, [location]);

  // Generate mock waveform data for visualization
  const generateWaveform = () => {
    const bars = 50;
    const data = [];
    for (let i = 0; i < bars; i++) {
      data.push(Math.random() * 0.7 + 0.1);
    }
    setWaveformData(data);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
      setScanResult(null);
      setExplanation(null);
      setExplanationShown(false);
      setIsScanning(false);
      generateWaveform();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile && (selectedFile.type.startsWith('audio/') || 
        selectedFile.name.match(/\.(mp3|wav|m4a|aac|ogg)$/i))) {
      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
      setScanResult(null);
      setExplanation(null);
      setExplanationShown(false);
      setIsScanning(false);
      generateWaveform();
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setIsScanning(true);
    setScanResult(null);
    setExplanation(null);
    setExplanationShown(false);
    
    try {
      const formData = new FormData();
      formData.append('audio', file);

      const res = await fetch('/api/audio-scan', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (res.status === 401 || res.status === 403) {
        alert('Session expired. Please log in again.');
        navigate('/signin');
        return;
      }
      const data = await res.json();
      
      const confidenceValue = Number(data.confidence);
      const isFake = data.result === 'FAKE';
      
      setScanResult({
        status: isFake ? 'AI-Generated Voice Detected' : 'Authentic Audio',
        label: data.result,
        confidence: Number.isFinite(confidenceValue) ? Math.min(Math.max(confidenceValue, 0), 100) : 0,
        color: isFake ? 'text-red-400' : 'text-green-400',
        barColor: isFake ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500',
        detection_id: data.detection_id || null,
        message: data.message || 'Scan complete',
        features: data.features || {}
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setScanResult({
        status: 'Scan Failed',
        label: 'ERROR',
        confidence: 0,
        color: 'text-red-400',
        barColor: 'from-red-500 to-orange-500',
        message: 'Upload failed. Please try again.'
      });
    } finally {
      setIsUploading(false);
      setIsScanning(false);
    }
  };

  // AI Literacy Mode - fetch explanation
  const handleExplain = async () => {
    if (!scanResult) return;

    setLoadingExplain(true);
    setLlmError(null);

    try {
      const res = await fetch('/api/audio-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          label: scanResult.label,
          confidence: Number(scanResult.confidence) / 100,
          features: scanResult.features || {},
        }),
      });

      const data = await res.json();
      
      if (data.status === 'success') {
        setExplanation(data.explanation);
        setExplanationShown(true);

        const summary = (data.explanation && (data.explanation.summary || '')).toLowerCase();
        const reason = (data.explanation && (data.explanation.confidence_reasoning || '')).toLowerCase();
        if (summary.includes('llm unavailable') || reason.includes('openai api key') || reason.includes('authentication')) {
          setLlmError('LLM unavailable or authentication failed. Update keys.');
        }
      } else {
        setExplanation(null);
        setExplanationShown(true);
      }
    } catch (error) {
      console.error('Explain failed:', error);
      setLlmError('Something went wrong. Please reload the page.');
      setExplanationShown(true);
    } finally {
      setLoadingExplain(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="flex-grow px-6 pt-28 pb-16 max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-top-6 duration-700">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-green-400 drop-shadow-md">
          Audio Scan Mode
        </h1>
        <p className="mb-8 text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto">
          Upload or drag an audio file below. Preview and start analyzing. Get deep AI insights using
          GenAI-powered Literacy Mode.
        </p>

        {/* Upload box */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-green-900/30');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-green-900/30');
          }}
          className="rounded-2xl border-2 border-dashed transition-all duration-300 p-10 mb-8 bg-slate-800/50 border-green-400 hover:bg-slate-800/70"
        >
          <label className="cursor-pointer block">
            <input 
              type="file" 
              accept=".mp3,.wav,.m4a,audio/*" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <div className="flex flex-col items-center gap-3 text-green-300">
              <Upload className="h-10 w-10" />
              <p className="text-lg font-semibold">Click or drag & drop your audio</p>
              <p className="text-sm text-gray-400">(MP3, WAV, M4A supported)</p>
            </div>
          </label>
        </div>

        {/* Audio Preview with Waveform */}
        {audioUrl && (
          <div className="mb-10 animate-in fade-in zoom-in duration-700">
            <h3 className="text-lg font-semibold mb-3 text-green-300">Audio Preview:</h3>
            <div className="relative mx-auto max-w-lg rounded-lg overflow-hidden border border-green-500 shadow-xl bg-slate-800 p-4">
              {/* Audio Player */}
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="w-full mb-4"
              />
              
              {/* Waveform Visualization */}
              <div className="flex items-center justify-center gap-1 h-20 bg-slate-900/50 rounded-lg p-2">
                {waveformData && waveformData.map((value, index) => (
                  <div
                    key={index}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isScanning ? 'bg-green-400 animate-pulse' : 'bg-green-500'
                    }`}
                    style={{
                      height: `${value * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                ))}
              </div>
              
              {isScanning && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-green-300 font-bold text-lg animate-pulse">
                  Scanning...
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setFile(null);
                setAudioUrl(null);
                setScanResult(null);
                setExplanation(null);
                setExplanationShown(false);
                setIsScanning(false);
                setWaveformData(null);
              }}
              className="mt-4 text-sm text-red-400 underline hover:text-red-600"
            >
              Upload another audio
            </button>
          </div>
        )}

        {/* Buttons */}
        {file && (
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <button
              onClick={handleUpload}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full text-lg shadow-lg transition"
              disabled={isUploading}
            >
              <AudioIcon className="h-5 w-5" />
              {isUploading ? 'Analyzing...' : 'Start Analyzing'}
            </button>
          </div>
        )}

        {/* Result */}
        {scanResult && (
          <div className="mt-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h3 className="text-2xl font-bold text-green-400 mb-3">Scan Result:</h3>
            <p className="text-lg">
              <span className="font-semibold text-gray-300">Label:</span>{' '}
              <span
                className={`font-bold ${
                  scanResult.label === 'REAL' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {scanResult.label}
              </span>
            </p>
            <p className="text-lg mt-1">
              <span className="font-semibold text-gray-300">Confidence:</span>{' '}
              <span className="text-green-300 font-bold">
                {scanResult.confidence}%
              </span>
            </p>

            {/* Action buttons that appear after we have a result */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  // If we already have an explanation, reveal it immediately
                  if (explanation) {
                    setExplanationShown(true);
                    return;
                  }
                  // Otherwise attempt to fetch explanation
                  handleExplain();
                }}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-green-300 border border-green-500 px-6 py-3 rounded-full text-lg transition"
                disabled={loadingExplain}
              >
                <BrainCircuit className="h-5 w-5" />
                {loadingExplain ? 'Loading...' : 'AI Literacy Mode'}
              </button>

              {/* Show Report Content if explanation was revealed OR if we have an LLM error, and only for non-REAL results */}
              {(explanationShown || llmError) && scanResult.label !== 'REAL' && (
                <button
                  onClick={() => {
                    if (scanResult.detection_id) {
                      navigate(`/report/${scanResult.detection_id}`);
                    } else {
                      alert('No detection id for report');
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-lg shadow-lg transition"
                >
                  🚨 Report Content
                </button>
              )}

              {/* If result is REAL, show a helpful note (no report button) */}
              {scanResult.label === 'REAL' && (
                <div className="text-sm text-gray-400 mt-3">No report needed for REAL content.</div>
              )}
            </div>

            {/* LLM status banner */}
            {llmError && (
              <div className="mt-4 p-3 rounded bg-yellow-900/80 text-yellow-100 text-sm flex items-center justify-center gap-3">
                <span>⚠️ {llmError}</span>
                <button
                  onClick={handleExplain}
                  className="underline text-yellow-200 hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Show explanation only after AI Literacy Mode clicked */}
            {explanationShown && (
              explanation ? (
                <div className="mt-6 text-left bg-slate-800/80 p-5 rounded-xl border border-green-700 shadow">
                  <h4 className="text-lg font-bold text-green-300 mb-2">AI Explanation:</h4>
                  
                  {/* Render detailed 8-section AI Literacy Report */}
                  {explanation['1_final_verdict'] && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 rounded-lg border border-blue-500">
                      <h5 className="font-bold text-blue-300 mb-1">📌 FINAL VERDICT</h5>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div><span className="text-gray-300">Classification:</span> <span className="font-bold text-white">{explanation['1_final_verdict'].classification}</span></div>
                        <div><span className="text-gray-300">Confidence:</span> <span className="font-bold text-white">{explanation['1_final_verdict'].confidence_score}%</span></div>
                        <div><span className="text-gray-300">Risk:</span> <span className={`font-bold ${explanation['1_final_verdict'].risk_level === 'High' ? 'text-red-400' : explanation['1_final_verdict'].risk_level === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>{explanation['1_final_verdict'].risk_level}</span></div>
                      </div>
                    </div>
                  )}

                  {explanation['2_ai_literacy_explanation'] && (
                    <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
                      <h5 className="font-bold text-green-300 mb-1">🧠 AI Literacy Explanation</h5>
                      <p className="text-sm text-gray-200">{explanation['2_ai_literacy_explanation']}</p>
                    </div>
                  )}

                  {explanation['3_key_detection_indicators'] && (
                    <div className="mb-4">
                      <h5 className="font-bold text-green-300 mb-3">🎯 Key Detection Indicators</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(explanation['3_key_detection_indicators']).map(([cat, scores]) => (
                          <div key={cat} className="p-3 bg-slate-800 rounded-lg">
                            <h6 className="font-semibold text-green-400 mb-2 capitalize">{cat.replace(/_/g, ' ')}</h6>
                            <div className="space-y-1 text-xs">
                              {Object.entries(scores).map(([key, val]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span className="font-mono text-white">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {explanation['7_trust_score_breakdown'] && (
                    <div className="mb-4 p-3 bg-indigo-900/30 border border-indigo-500 rounded-lg">
                      <h5 className="font-bold text-indigo-300 mb-2">📈 Trust Score Breakdown</h5>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        {Object.entries(explanation['7_trust_score_breakdown']).map(([key, score]) => (
                          <div key={key} className="text-center">
                            <span className="text-gray-400 text-xs block">{key.replace(/_/g, ' ')}</span>
                            <span className="font-bold text-white text-lg">{score}</span>/10
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {explanation['8_final_summary'] && (
                    <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                      <h5 className="font-bold text-gray-200 mb-2">🧾 Final Summary</h5>
                      <p className="text-sm text-gray-300">{explanation['8_final_summary']}</p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="mt-6 text-left bg-slate-800/80 p-5 rounded-xl border border-yellow-700 shadow">
                  <h4 className="text-lg font-bold text-yellow-300 mb-2">AI Explanation unavailable</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">We couldn't generate a full AI explanation. You can still report this content by clicking <strong>Report Content</strong>.</p>
                  <div className="mt-3">
                    <button
                      onClick={handleExplain}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-yellow-100"
                    >
                      Retry explanation
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AudioScan;