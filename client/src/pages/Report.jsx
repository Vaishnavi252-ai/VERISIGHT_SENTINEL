import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReportQuestionSlider from '../components/QuestionForm';

export default function ReportPage() {
  const { detectionId } = useParams();
  const navigate = useNavigate();
  const [detection, setDetection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/detections/${detectionId}`)
      .then(r => r.json())
      .then(j => {
        if (j.status === 'success') {
          console.debug('Loaded detection:', j.detection, 'explanation:', j.explanation);
          setDetection(j.detection);
        } else setError(j.error || 'Unable to load detection');
      })
      .catch(e => setError(e.message || 'Unable to load detection'))
      .finally(() => setLoading(false));
  }, [detectionId]);

  // Helper to extract filename cross-platform
  const filenameFromPath = (p) => {
    if (!p) return null;
    const parts = p.split(/[/\\\\]/); // split on / or \\\\ for Windows
    return parts.pop();
  };


  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#070b1a] text-gray-200 px-6 pt-28 pb-16 flex items-start justify-center">
        <div className="max-w-5xl w-full">

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-cyan-400">Report Suspicious Content</h1>
            <p className="text-gray-400 mt-2">Answer a short set of questions to submit the report. Your input helps the community and powers admin analytics.</p>
          </div>

          {loading && (
            <div className="bg-white/5 p-6 rounded-lg text-center">Loading detection…</div>
          )}

          {error && (
            <div className="bg-yellow-900/10 p-6 rounded-lg">{error}</div>
          )}

          {detection && (
            <div className="grid md:grid-cols-3 gap-6 mb-8 items-start">
              <div className="col-span-1 bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-sm text-gray-300">Result</div>
                <div className={`mt-2 font-semibold ${detection.result_label === 'REAL' ? 'text-green-400' : 'text-red-400'}`}>{detection.result_label}</div>
                <div className="text-xs text-gray-400 mt-1">Confidence {(detection.confidence * 100).toFixed(2)}%</div>

                <div className="mt-4">
                  <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/5 rounded-md text-sm">← Back to Scan</button>
                </div>
              </div>

              <div className="col-span-2">
                <ReportQuestionSlider detectionId={detectionId} onClose={() => navigate(-1)} />
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}
