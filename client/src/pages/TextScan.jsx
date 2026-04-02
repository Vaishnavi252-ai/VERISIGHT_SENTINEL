import React, { useState, useEffect } from 'react';
import { Upload, FileText as TextIcon, ArrowRight, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TextScan = () => {
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

  const handleUpload = () => {
    if (!file) return;
    setIsUploading(true);

    setTimeout(() => {
      const fakeDetected = Math.random() > 0.5;
      setScanResult({
        status: fakeDetected ? 'AI-Generated Text Detected' : 'Human-Written Text',
        confidence: fakeDetected ? 89.7 : 96.5,
        color: fakeDetected ? 'text-red-400' : 'text-green-400',
        barColor: fakeDetected ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500',
        message: fakeDetected
          ? 'Linguistic patterns consistent with large language models found.'
          : 'Text appears to be written by a human.',
      });
      setIsUploading(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 pt-28 pb-20">
        <h1 className="text-3xl font-bold text-center text-white mb-8">
          <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Text
          </span>{' '}
          Detection Portal
        </h1>

        {/* Upload Area */}
        <div
          className="relative border-2 border-dashed border-slate-600 rounded-3xl p-12 text-center transition-all duration-300 hover:border-orange-400/50 bg-slate-800/50"
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-700/50'); }}
          onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-slate-700/50'); }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-slate-700/50'); setFile(e.dataTransfer.files[0]); setScanResult(null); }}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".txt,.pdf,.doc,.docx"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <TextIcon className="h-10 w-10 text-orange-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2 text-lg">
            <span className="font-semibold">Click to browse</span> or drag and drop your document
          </p>
          <p className="text-gray-500 text-sm">Supported: .txt, .pdf, .docx | Max size: 10MB</p>

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
              ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white'
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
              <span>Run AI Text Scan</span>
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

export default TextScan;