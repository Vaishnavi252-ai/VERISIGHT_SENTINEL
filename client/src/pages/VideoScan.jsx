import React, { useState, useEffect } from "react";
import { Video as VideoIcon, ArrowRight, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE = "http://127.0.0.1:5000";

const VideoScan = () => {
  const [file, setFile] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [frames, setFrames] = useState([]);
  const [explanation, setExplanation] = useState(null);
  const [explanationShown, setExplanationShown] = useState(false);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [llmError, setLlmError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location?.state?.file) {
      setFile(location.state.file);
      setVideoURL(URL.createObjectURL(location.state.file));
    }
  }, [location]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setVideoURL(URL.createObjectURL(selectedFile));
    setScanResult(null);
    setFrames([]);
    setExplanation("");
  };

  // ==============================
  // VIDEO UPLOAD & SCAN
  // ==============================
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setScanResult(null);
    setFrames([]);
    setExplanation("");

    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await fetch('/api/video-scan', {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Server error");
      }

      const data = await res.json();

      if (data.status === "error") {
        throw new Error(data.detail || "Scan failed");
      }

      // Extract prediction information - compatible with backend response
      const resultLabel = (data.result || data.result_label || '').toUpperCase();
      const isFake = resultLabel === 'FAKE';
      
      // Parse confidence as number and convert 0-1 range to 0-100 range if needed
      let confVal = 0;
      if (data.confidence === undefined || data.confidence === null) {
        confVal = 0;
      } else if (typeof data.confidence === 'string') {
        confVal = parseFloat(data.confidence) || 0;
      } else {
        confVal = Number(data.confidence || 0);
      }

      if (confVal <= 1) {
        confVal = confVal * 100;
      }

      const statusText = isFake ? 'Deepfake Detected' : 'Authentic Content';
      const confidenceText = Number.isFinite(confVal) ? Math.min(Math.max(confVal, 0), 100) : 0;
      let confidenceLevel = 'Low';
      if (confidenceText >= 70) confidenceLevel = 'High';
      else if (confidenceText >= 50) confidenceLevel = 'Medium';

      setScanResult({
        status: statusText,
        label: resultLabel,
        confidence: confidenceText,
        confidence_level: confidenceLevel,
        detection_id: data.detection_id || null,
        color: isFake ? "text-red-500" : "text-green-500",
        barColor: isFake ? "from-red-500 to-orange-500" : "from-green-500 to-emerald-500",
        message: "Scan completed",
      });

      setFrames(data.frames || []);
    } catch (error) {
      console.error("Video scan failed:", error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ==============================
  // AI LITERACY MODE
  // ==============================
  const handleExplain = async () => {
    if (!scanResult) return;

    setLoadingExplain(true);
    setLlmError(null);

    try {
      const res = await fetch('/api/video-explain', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          status: scanResult.label,  // "FAKE" or "REAL"
          confidence: Number(scanResult.confidence) / 100,
          frames: scanResult.frame_probabilities || [],
          video_name: file?.name,
          avg_fake_score: scanResult.avg_fake_score,
          frame_count: scanResult.frame_count,
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
        setLlmError('AI explanation unavailable');
      }
    } catch (err) {
      console.error("Explain failed:", err);
      setLlmError('Something went wrong. Please try again.');
      setExplanationShown(true);
    } finally {
      setLoadingExplain(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <section className="max-w-4xl mx-auto px-4 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            Video
          </span>{" "}
          Detection Portal
        </h1>

        {/* Upload Area */}
        <div className="relative border-2 border-dashed border-slate-600 rounded-3xl p-12 text-center bg-slate-800/50">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".mp4,.mov,.avi,.webm"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <VideoIcon className="h-10 w-10 text-purple-400 mx-auto mb-4" />

          <p className="text-gray-300 mb-2 text-lg">
            <span className="font-semibold">Click to browse</span> or drag and drop your video
          </p>

          {file && (
            <div className="mt-6 p-3 bg-slate-700 rounded-lg flex items-center justify-between">
              <span className="text-sm text-white truncate">{file.name}</span>
              <button onClick={() => setFile(null)}>
                <X className="h-4 w-4 text-gray-300" />
              </button>
            </div>
          )}
        </div>

        {/* Video Preview */}
        {videoURL && (
          <div className="mt-8 rounded-xl overflow-hidden border border-slate-700">
            <video src={videoURL} controls className="w-full max-h-[360px] bg-black" />
          </div>
        )}

        {/* Scan Button */}
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`w-full mt-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-3 ${
            file && !isUploading
              ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white"
              : "bg-slate-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isUploading ? "Scanning..." : "Run Deepfake Scan"}
          <ArrowRight className="h-5 w-5" />
        </button>

        {/* Scan Result */}
        {scanResult && (
          <div className="mt-10 p-6 rounded-2xl bg-slate-800/70 border border-slate-700 max-w-2xl mx-auto overflow-hidden">
            <h3 className={`text-2xl font-bold ${scanResult.color} truncate`}>
              {scanResult.status}
            </h3>

            <div className="mt-6 space-y-3">
              {/* Label Display */}
              <div className="flex justify-between items-center gap-4">
                <span className="text-gray-400 text-sm font-medium">Result</span>
                <span className={`text-lg font-bold ${scanResult.color}`}>
                  {scanResult.label}
                </span>
              </div>

              {/* Confidence Score */}
              <div className="flex justify-between items-center gap-4">
                <span className="text-gray-400 text-sm font-medium">Confidence</span>
                <span className="text-white font-bold text-lg whitespace-nowrap">
                  {(scanResult.confidence).toFixed(2)}%
                </span>
              </div>

              {/* Confidence Level */}
              <div className="flex justify-between items-center gap-4">
                <span className="text-gray-400 text-sm font-medium">Confidence Level</span>
                <span className="text-sm font-semibold text-white">
                  {scanResult.confidence_level || 'Unknown'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-700 rounded-full h-3 mt-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${scanResult.barColor} transition-all duration-500`}
                  style={{ width: `${Math.min(Math.max(scanResult.confidence, 0), 100)}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleExplain}
                disabled={loadingExplain}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingExplain ? "Analyzing..." : "🧠 AI Literacy Mode"}
              </button>

              {/* Show Report Content if explanation was revealed OR if we have an LLM error, and only for non-REAL results */}
              {(explanationShown || llmError) && scanResult?.label === 'FAKE' && scanResult?.detection_id && (
                <button
                  onClick={() => navigate(`/report/${scanResult.detection_id}`)}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                >
                  🚨 Report Content
                </button>
              )}

              {/* If result is REAL, show a helpful note (no report button) */}
              {scanResult?.label === 'REAL' && (
                <div className="text-sm text-gray-400 mt-2">✅ No report needed for authentic content.</div>
              )}
            </div>
          </div>
        )}

        {/* Frame-by-Frame Analysis */}
        {frames.length > 0 && (
          <div className="mt-8 p-6 rounded-2xl bg-slate-800 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Frame-by-Frame Analysis
            </h3>

            <div className="max-h-80 overflow-y-auto space-y-3">
              {frames.map((f) => (
                <div
                  key={f.frame}
                  className="flex items-center gap-4 bg-slate-700 p-3 rounded-lg"
                >
                  <img
                    src={`${API_BASE}${f.image_url}`}
                    alt=""
                    className="w-28 rounded"
                  />

                  <div className="flex-1">
                    <p className="text-gray-200 text-sm">
                      Frame {f.frame}
                    </p>

                    <p
                      className={`font-semibold ${
                        f.label === "FAKE"
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {f.label}
                    </p>

                    <p className="text-xs text-gray-300">
                      Fake probability: {(f.fake_probability * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LLM status banner (explicit message when OpenAI key invalid or fetch failed) */}
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
            <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-xl text-gray-300 text-sm leading-relaxed">
              <h4 className="text-lg font-bold text-purple-300 mb-2">AI Explanation:</h4>
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
                  <h5 className="font-bold text-purple-300 mb-3">🎯 Key Detection Indicators</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(explanation['3_key_detection_indicators']).map(([cat, scores]) => (
                      <div key={cat} className="p-3 bg-slate-800 rounded-lg">
                        <h6 className="font-semibold text-purple-400 mb-2 capitalize">{cat}</h6>
                        <div className="space-y-1 text-xs">
                          {Object.entries(scores).map(([key, val]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
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
                        <span className="text-gray-400 text-xs block">{key.replace('_', ' ').replace('consistency', 'Cons.')}</span>
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
      </section>

      <Footer />
    </div>
  );
};

export default VideoScan;
