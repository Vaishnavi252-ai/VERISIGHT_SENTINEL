import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, ScanLine, BrainCircuit } from 'lucide-react';

const ImageScan = () => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explanationShown, setExplanationShown] = useState(false);
  const [llmError, setLlmError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // handle upload from input
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setExplanation(null);
      setIsScanning(false);
    } else {
      alert('Please upload a valid image file.');
    }
  };

  // handle drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setExplanation(null);
      setIsScanning(false);
    } else {
      alert('Only image files are supported.');
    }
  };

  // start scanning
  const navigate = useNavigate();

  const handleStartAnalyzing = async () => {
    if (!image) return;
    const formData = new FormData();
    formData.append('image', image);

    setLoading(true);
    setResult(null);
    setExplanation(null);
    setIsScanning(true);

    try {
      const response = await fetch('/api/image-scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          label: data.result,
          confidence_score: data.confidence,
          detection_id: data.detection_id || null,
        });
        // store explanation but do not reveal until user clicks AI Literacy Mode
        setExplanation(data.explanation || null);
        setExplanationShown(false);
      } else {
        alert(data.error || 'Analysis failed');
      }
    } catch (error) {
      alert('Backend error: ' + error.message);
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  // Fetch explanation (called by AI Literacy Mode and retry)
  const fetchExplanation = async () => {
    setLoading(true);
    setLlmError(null);

    try {
      // Prefer retrieving an explanation for a saved detection (cached)
      if (result && result.detection_id) {
        const r = await fetch(`/api/detections/${result.detection_id}`);
        const j = await r.json();

        if (j.status === 'success') {
          const expl = j.explanation || null;
          setExplanation(expl);
        } else {
          // fallback to direct image explain endpoint
          const r2 = await fetch('/api/image-explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: result.label, confidence: Number(result.confidence_score) / 100, metrics: {} })
          });
          const j2 = await r2.json();
          if (j2.status === 'success') setExplanation(j2.explanation);
          else setExplanation(null);
        }
      } else {
        // No detection id available: call the image-explain endpoint directly with current result
        const r = await fetch('/api/image-explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: result?.label, confidence: Number(result?.confidence_score) / 100, metrics: {} })
        });
        const j = await r.json();
        if (j.status === 'success') setExplanation(j.explanation);
        else setExplanation(null);
      }

      // Use the explanation we just received (expl or j2/j) to decide errors
      const explObj = (typeof expl !== 'undefined' && expl) ? expl : (typeof j2 !== 'undefined' && j2?.explanation ? j2.explanation : (typeof j !== 'undefined' && j?.explanation ? j.explanation : null));
      const summary = ((explObj && explObj.summary) || '').toLowerCase();
      const reason = ((explObj && explObj.confidence_reasoning) || '').toLowerCase();
      if (summary.includes('llm unavailable') || reason.includes('openai api key') || reason.includes('authentication')) {
        setLlmError('LLM unavailable or authentication failed. Update keys.');
      } else {
        setLlmError(null);
      }

      setExplanationShown(true);
    } catch (e) {
      setLlmError('Something went wrong. Please reload the page.');
      setExplanationShown(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <Navbar />

      <main className="flex-grow px-6 pt-32 pb-16 max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-top-6 duration-700">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-purple-400 drop-shadow-md">
          Image Scan Mode
        </h1>
        <p className="mb-8 text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto">
          Upload or drag an image below. Preview and start analyzing. Get deep AI insights using
          GenAI-powered Literacy Mode.
        </p>

        {/* Upload box */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`rounded-2xl border-2 border-dashed transition-all duration-300 p-10 mb-8 ${
            isDragging
              ? 'bg-purple-900/30 border-purple-500'
              : 'bg-slate-800/50 border-purple-400 hover:bg-slate-800/70'
          }`}
        >
          <label className="cursor-pointer block">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div className="flex flex-col items-center gap-3 text-purple-300">
              <UploadCloud className="h-10 w-10" />
              <p className="text-lg font-semibold">Click or drag & drop your image</p>
              <p className="text-sm text-gray-400">(JPG, PNG, WEBP supported)</p>
            </div>
          </label>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mb-10 animate-in fade-in zoom-in duration-700">
            <h3 className="text-lg font-semibold mb-3 text-purple-300">Image Preview:</h3>
            <div className="relative mx-auto max-w-sm rounded-lg overflow-hidden border border-purple-500 shadow-xl">
              <img
                src={previewUrl}
                alt="Uploaded Preview"
                className={`w-full rounded-lg transition-all duration-500 ${
                  isScanning
                    ? 'animate-pulse saturate-150 blur-[1px] brightness-110 contrast-125'
                    : ''
                }`}
              />
              {isScanning && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-purple-300 font-bold text-lg animate-pulse">
                  Scanning...
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setImage(null);
                setPreviewUrl(null);
                setResult(null);
                setExplanation(null);
                setIsScanning(false);
              }}
              className="mt-4 text-sm text-red-400 underline hover:text-red-600"
            >
              Upload another image
            </button>
          </div>
        )}

        {/* Buttons */}
        {image && (
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <button
              onClick={handleStartAnalyzing}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full text-lg shadow-lg transition"
              disabled={loading}
            >
              <ScanLine className="h-5 w-5" />
              {loading ? 'Analyzing...' : 'Start Analyzing'}
            </button>
            {/* AI Literacy Mode now appears only after result is available */}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h3 className="text-2xl font-bold text-purple-400 mb-3">Scan Result:</h3>
            <p className="text-lg">
              <span className="font-semibold text-gray-300">Label:</span>{' '}
              <span
                className={`font-bold ${
                  result.label === 'REAL' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {result.label}
              </span>
            </p>
            <p className="text-lg mt-1">
              <span className="font-semibold text-gray-300">Confidence:</span>{' '}
              <span className="text-purple-300 font-bold">
                {result.confidence_score}%
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
                  // Otherwise attempt to fetch explanation (will set llmError on failure)
                  fetchExplanation();
                }}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-purple-300 border border-purple-500 px-6 py-3 rounded-full text-lg transition"
                disabled={loading}
              >
                <BrainCircuit className="h-5 w-5" />
                {loading ? 'Loading...' : 'AI Literacy Mode'}
              </button>

              {/* Show Report Content if explanation was revealed OR if we have an LLM error, and only for non-REAL results */}
              {(explanationShown || llmError) && result.label !== 'REAL' && (
                <button
                  onClick={() => {
                    if (result.detection_id) {
                      navigate(`/report/${result.detection_id}`);
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
              {result.label === 'REAL' && (
                <div className="text-sm text-gray-400 mt-3">No report needed for REAL content.</div>
              )}
            </div>

            {/* LLM status banner (explicit message when OpenAI key invalid or fetch failed) */}
            {llmError && (
              <div className="mt-4 p-3 rounded bg-yellow-900/80 text-yellow-100 text-sm flex items-center justify-center gap-3">
                <span>⚠️ {llmError}</span>
                <button
                  onClick={fetchExplanation}
                  className="underline text-yellow-200 hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Show explanation only after AI Literacy Mode clicked */}
            {explanationShown && (
              explanation ? (
                <div className="mt-6 text-left bg-slate-800/80 p-5 rounded-xl border border-purple-700 shadow">
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
                      onClick={fetchExplanation}
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

export default ImageScan;
