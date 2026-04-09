import React, { useState, useEffect } from 'react';
import { Upload, Headphones as AudioIcon, ArrowRight, X } from 'lucide-react'; // <-- Import AudioIcon
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const AudioScan = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location?.state?.file) {
      setFile(location.state.file);
    }
  }, [location]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setScanResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('audio', file);

      const res = await fetch('/api/audio-scan', {
        method: "POST",
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      const confidenceValue = Number(data.confidence);

      setScanResult({
        status: data.result === 'FAKE' ? 'AI-Generated Voice Detected' : 'Authentic Audio',
        label: data.result,
        confidence: Number.isFinite(confidenceValue) ? confidenceValue : 0,
        color: data.result === 'FAKE' ? 'text-red-400' : 'text-green-400',
        barColor: data.result === 'FAKE' ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500',
        detection_id: data.detection_id,
        message: data.message || 'Scan complete'
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
    }
  };

  const handleExplain = async () => {
    if (!scanResult?.detection_id) return;
    try {
      const res = await fetch('/api/audio-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detection_id: scanResult.detection_id }),
        credentials: 'include'
      });
      const data = await res.json();
      // Navigate or show explanation modal - for now, log and alert
      alert(data.explanation || 'Explanation loaded');
      console.log('Explanation:', data);
    } catch (error) {
      console.error('Explain failed:', error);
      alert('Failed to load explanation');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            Audio
          </span>{' '}
          Detection Portal
        </h1>

        {/* AI Literacy button after result */}
        {scanResult && (
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={handleExplain} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
              🧠 AI Literacy Mode
            </button>
          </div>
        )}


        {/* Upload Area */}
        <div
          className="relative border-2 border-dashed border-slate-600 rounded-3xl p-12 text-center transition-all duration-300 hover:border-green-400/50 bg-slate-800/50" // <-- Change
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-700/50'); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-slate-700/50'); }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-slate-700/50'); setFile(e.dataTransfer.files[0]); setScanResult(null); }}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".mp3,.wav,.m4a" // <-- Change
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <AudioIcon className="h-10 w-10 text-green-400 mx-auto mb-4" /> {/* <-- Change */}
          <p className="text-gray-300 mb-2 text-lg">
            <span className="font-semibold">Click to browse</span> or drag and drop your audio
          </p>
          <p className="text-gray-500 text-sm">Supported: .mp3, .wav, .m4a | Max size: 50MB</p> {/* <-- Change */}

          {file && (
            <div className="mt-6 p-3 bg-slate-700 rounded-lg flex items-center justify-between">
              <span className="text-sm text-white truncate">{file.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Scan Button */}
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className={`w-full mt-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 ${
            file && !isUploading
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' // <-- Change
              : 'bg-slate-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isUploading ? (
            <>
              <span className="animate-spin h-5 w-5 border-t-2 border-white rounded-full"></span>
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <span>Run Voice Scan</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {/* Scan Result */}
        {scanResult && (
          <div className="mt-10 p-6 rounded-2xl border border-slate-700 bg-slate-800/70">
            <h3 className={`text-2xl font-bold mb-3 ${scanResult.color}`}>{scanResult.status}</h3>
            <p className="text-gray-300 mb-4">{scanResult.message}</p>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Confidence Score</span>
              <span className="text-white font-bold">{scanResult.confidence}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${scanResult.barColor}`}
                style={{ width: `${scanResult.confidence}%` }}
              ></div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default AudioScan;