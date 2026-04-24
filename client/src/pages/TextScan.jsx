import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Link2, Type, ArrowRight, X, BrainCircuit } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TextScan = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("text"); // text | url | file
  const [text, setText] = useState("");
  const [wasPasted, setWasPasted] = useState(false);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationShown, setExplanationShown] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  // -----------------------------
  // API CALL
  // -----------------------------
  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    setExplanation(null);
    setExplanationShown(false);
    setLlmError(null);
    
    // Add delay for natural loading feel
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    try {
      let response;
      if (mode === "text") {
        response = await fetch("/api/text-scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include',
          body: JSON.stringify({ text, input_source: wasPasted ? "paste" : "typed" }),
        });
      } else if (mode === "url") {
        response = await fetch("/api/url-scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: 'include',
          body: JSON.stringify({ url }),
        });
      } else if (mode === "file") {
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch("/api/txt-scan", {
          method: "POST",
          credentials: 'include',
          body: formData,
        });
      }
      if (response.status === 401 || response.status === 403) {
        alert('Session expired. Please log in again.');
        navigate('/signin');
        return;
      }
      const data = await response.json();
      if (response.ok) {
        const isFake = data.result === "FAKE";
        setResult({
          label: data.result,
          confidence: (data.confidence * 100).toFixed(2),
          detection_id: data.detection_id || null,
          reason: data.reason || "No reason provided.",
          color: isFake ? "text-red-400" : "text-green-400",
          barColor: isFake ? "from-red-500 to-orange-500" : "from-green-500 to-emerald-500",
          message: isFake ? "AI-generated or suspicious linguistic patterns detected." : "Text appears human-written and authentic.",
        });
      } else {
        alert(data.detail || "Scan failed");
      }
    } catch (err) {
      alert("Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // AI LITERACY MODE
  // -----------------------------
  const handleExplain = async () => {
    if (!result) return;
    setLoadingExplain(true);
    setLlmError(null);

    try {
      let expl;
      // Prefer retrieving explanation for saved detection
      if (result.detection_id) {
        const r = await fetch(`/api/detections/${result.detection_id}`, { credentials: 'include' });
        const j = await r.json();
        if (j.status === 'success') {
          expl = j.explanation || null;
        }
      }
      // Fallback to direct text-explain endpoint
      if (!expl) {
        const r2 = await fetch('/api/text-explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            label: result.label, 
            confidence: Number(result.confidence) / 100, 
            metrics: {} 
          })
        });
        const j2 = await r2.json();
        if (j2.status === 'success') expl = j2.explanation;
      }

      setExplanation(expl);
      setExplanationShown(true);

      // Check for LLM errors
      const summary = (expl && expl.summary || '').toLowerCase();
      const reason = (expl && expl.confidence_reasoning || '').toLowerCase();
      if (summary.includes('llm unavailable') || reason.includes('openai api key') || reason.includes('authentication')) {
        setLlmError('LLM unavailable or authentication failed. Update keys.');
      } else {
        setLlmError(null);
      }
    } catch (e) {
      setLlmError('Something went wrong. Please reload the page.');
      setExplanationShown(true);
    } finally {
      setLoadingExplain(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 pt-28 pb-20 text-center">
        <h1 className="text-4xl font-bold mb-6">
          <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
            Text Deepfake Detection
          </span>
        </h1>

        {/* MODE SWITCH */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setMode("text")}
            className={`px-4 py-2 rounded-full ${mode==="text"?"bg-orange-500":"bg-slate-700"}`}
          >
            <Type className="inline mr-2"/>
            Text
          </button>
          <button
            onClick={() => setMode("url")}
            className={`px-4 py-2 rounded-full ${mode==="url"?"bg-orange-500":"bg-slate-700"}`}
          >
            <Link2 className="inline mr-2"/>
            URL
          </button>
          <button
            onClick={() => setMode("file")}
            className={`px-4 py-2 rounded-full ${mode==="file"?"bg-orange-500":"bg-slate-700"}`}
          >
            <Upload className="inline mr-2"/>
            File
          </button>
        </div>

        {/* INPUT AREA */}
        <div className="bg-slate-800/60 p-8 rounded-2xl border border-slate-700">
          {/* TEXT INPUT */}
          {mode === "text" && (
            <textarea
              placeholder="Enter text to analyze..."
              value={text}
              onPaste={() => setWasPasted(true)}
              onChange={(e) => {
                setText(e.target.value);
                if (!e.target.value) setWasPasted(false);
              }}
              className="w-full p-4 rounded-lg bg-slate-900 border border-slate-600"
              rows={5}
            />
          )}

          {/* URL INPUT */}
          {mode === "url" && (
            <input
              type="text"
              placeholder="Enter article URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-4 rounded-lg bg-slate-900 border border-slate-600"
            />
          )}

          {/* FILE INPUT */}
          {mode === "file" && (
            <div className="border-2 border-dashed border-slate-600 p-6 rounded-xl">
              <input
                type="file"
                accept=".txt"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file && (
                <div className="mt-3 flex justify-between">
                  <span>{file.name}</span>
                  <X onClick={() => setFile(null)} className="cursor-pointer"/>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SCAN BUTTON */}
        <button
          onClick={handleScan}
          disabled={loading}
          className="mt-8 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-full"
        >
          {loading ? "Scanning..." : "Run Detection"}
          <ArrowRight className="inline ml-2"/>
        </button>

        {/* RESULT */}
        {result && (
          <div className="mt-10 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h2 className={`text-2xl font-bold ${result.color}`}>
              {result.label}
            </h2>
            <p className="mt-2 text-gray-300">{result.message}</p>
            <p className="mt-2 text-sm text-gray-400">{result.reason}</p>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>Confidence</span>
                <span>{result.confidence}%</span>
              </div>
              <div className="w-full bg-slate-700 h-2 mt-2 rounded">
                <div
                  className={`h-2 bg-gradient-to-r ${result.barColor}`}
                  style={{ width: `${result.confidence}%` }}
                ></div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {/* Report button for both REAL and FAKE */}
              {result.detection_id ? (
                <button
                  onClick={() => navigate(`/report/${result.detection_id}`)}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full text-white shadow-lg transition"
                >
                  🚨 Report Content
                </button>
              ) : null}
            </div>
          </div>
        )}

        {/* LLM ERROR BANNER */}
        {llmError && (
          <div className="mt-4 p-3 rounded bg-yellow-900/80 text-yellow-100 text-sm flex items-center justify-center gap-3 max-w-2xl mx-auto">
            <span>⚠️ {llmError}</span>
            <button
              onClick={handleExplain}
              className="underline text-yellow-200 hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* AI EXPLANATION */}
        {explanationShown && (
          explanation ? (
            <div className="mt-6 p-6 bg-slate-800/80 rounded-xl border border-orange-700 shadow-xl max-w-4xl mx-auto">
              <h4 className="text-xl font-bold text-orange-300 mb-4 text-center">AI Literacy Report</h4>
              {/* 8-Section Structured Report matching Image/Video */}
              {explanation['1_final_verdict'] && (
                <div className="mb-6 p-5 bg-gradient-to-r from-orange-900/50 to-red-900/50 rounded-xl border border-orange-500">
                  <h5 className="font-bold text-orange-300 mb-3 text-lg">📌 FINAL VERDICT</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-300">Classification:</span> <span className="font-bold text-white">{explanation['1_final_verdict'].classification}</span></div>
                    <div><span className="text-gray-300">Confidence:</span> <span className="font-bold text-white">{explanation['1_final_verdict'].confidence_score}%</span></div>
                    <div><span className="text-gray-300">Risk:</span> <span className={`font-bold ${explanation['1_final_verdict'].risk_level === 'High' ? 'text-red-400' : explanation['1_final_verdict'].risk_level === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>{explanation['1_final_verdict'].risk_level}</span></div>
                  </div>
                </div>
              )}

              {explanation['2_ai_literacy_explanation'] && (
                <div className="mb-6 p-4 bg-orange-900/30 border border-orange-500 rounded-xl">
                  <h5 className="font-bold text-orange-300 mb-2 text-lg">🧠 AI Literacy Explanation</h5>
                  <p className="text-gray-200 leading-relaxed">{explanation['2_ai_literacy_explanation']}</p>
                </div>
              )}

              {explanation['3_key_detection_indicators'] && (
                <div className="mb-6">
                  <h5 className="font-bold text-orange-300 mb-4 text-lg text-center">🎯 Key Detection Indicators</h5>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {Object.entries(explanation['3_key_detection_indicators']).map(([cat, scores]) => (
                      <div key={cat} className="p-4 bg-slate-800 rounded-lg border border-slate-600">
                        <h6 className="font-semibold text-orange-400 mb-3 capitalize">{cat}</h6>
                        <div className="space-y-2 text-sm">
                          {Object.entries(scores).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                              <span className="font-mono text-white font-semibold">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explanation['7_trust_score_breakdown'] && (
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500 rounded-xl">
                  <h5 className="font-bold text-orange-300 mb-3 text-lg">📈 Trust Score Breakdown</h5>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
                    {Object.entries(explanation['7_trust_score_breakdown']).map(([key, score]) => (
                      <div key={key} className="text-center p-2">
                        <span className="text-gray-400 text-xs block">{key.replace('_', ' ').replace('consistency', 'Cons.')}</span>
                        <span className="font-bold text-white text-xl">{score}</span>/10
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explanation['8_final_summary'] && (
                <div className="p-5 bg-slate-900/50 border border-slate-700 rounded-xl">
                  <h5 className="font-bold text-gray-200 mb-3 text-lg">🧾 Final Summary</h5>
                  <p className="text-gray-300 leading-relaxed">{explanation['8_final_summary']}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 p-6 bg-slate-800/80 rounded-xl border border-yellow-700 shadow max-w-2xl mx-auto">
              <h4 className="text-lg font-bold text-yellow-300 mb-3 text-center">AI Explanation unavailable</h4>
              <p className="text-gray-300 text-sm leading-relaxed text-center mb-4">We couldn't generate a full AI explanation. You can still report this content by clicking <strong>Report Content</strong>.</p>
              <div className="text-center">
                <button
                  onClick={handleExplain}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full border border-yellow-500 text-yellow-100"
                >
                  Retry explanation
                </button>
              </div>
            </div>
          )
        )}
      </section>
      <Footer />
    </div>
  );
};

export default TextScan;

