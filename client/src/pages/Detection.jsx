import React, { useState } from 'react';
import {
  Upload, Image, Video, Headphones, FileText, ArrowRight,
  CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Footer from '../components/Footer';

const Detection = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState({});
  const { currentUser } = useContext(AuthContext);

  const detectionOptions = [
    {
      id: 'image',
      title: 'Image Detection',
      description: 'Analyze photos and images for deepfake manipulation, face swapping, and AI-generated content.',
      icon: Image,
      accuracy: '99.2%',
      formats: ['.jpg', '.png', '.jpeg', '.webp', '.bmp'],
      keyFeatures: [
        'Face manipulation detection',
        'GAN artifact analysis',
        'Metadata examination',
        'Pixel-level analysis'
      ],
      maxSize: '10MB',
      path: '/image-scan',
      buttonText: 'Start Image Detection',
      buttonColor: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700',
      borderColor: 'border-cyan-500/50',
      hoverBorderColor: 'hover:border-cyan-500',
      iconBg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      hasUpload: true,
    },
    {
      id: 'video',
      title: 'Video Detection',
      description: 'Detect deepfake videos, face swaps, and temporal inconsistencies in video content.',
      icon: Video,
      accuracy: '98.7%',
      formats: ['.mp4', '.avi', '.mov', '.webm', '.mkv'],
      keyFeatures: [
        'Temporal analysis',
        'Frame-by-frame detection',
        'Motion inconsistency',
        'Lip-sync verification'
      ],
      maxSize: '100MB',
      path: '/video-scan',
      buttonText: 'Start Video Detection',
      buttonColor: 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700',
      borderColor: 'border-purple-500/50',
      hoverBorderColor: 'hover:border-purple-500',
      iconBg: 'bg-gradient-to-r from-purple-500 to-violet-500',
      hasUpload: true,
    },
    {
      id: 'audio',
      title: 'Audio Detection',
      description: 'Analyze audio files for AI-generated voices, cloning, and synthetic patterns.',
      icon: Headphones,
      accuracy: '97.8%',
      formats: ['.mp3', '.wav', '.m4a', '.flac', '.ogg'],
      keyFeatures: [
        'Voice cloning detection',
        'Spectral analysis',
        'Prosody examination',
        'Neural pattern recognition'
      ],
      maxSize: '50MB',
      path: '/audio-scan',
      buttonText: 'Start Audio Detection',
      buttonColor: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
      borderColor: 'border-green-500/50',
      hoverBorderColor: 'hover:border-green-500',
      iconBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
      hasUpload: true,
    },
    {
      id: 'text',
      title: 'Text Detection',
      description: 'Enter text, URLs, or upload documents for AI-generated content analysis.',
      icon: FileText,
      accuracy: '96.5%',
      formats: [], // No file upload
      keyFeatures: [
        'Live text analysis',
        'URL content scraping',
        'Document processing',
        'Linguistic pattern detection'
      ],
      maxSize: 'N/A',
      path: '/text-scan',
      buttonText: 'Start Text Detection',
      buttonColor: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
      borderColor: 'border-orange-500/50',
      hoverBorderColor: 'hover:border-orange-500',
      iconBg: 'bg-gradient-to-r from-orange-500 to-red-500',
      hasUpload: false, // No upload - direct to TextScan
    },
  ];

  const handleFileChange = (option, e) => {
    const file = e.target.files[0];
    if (file && option.hasUpload) {
      setSelectedFiles(prev => ({ ...prev, [option.id]: file }));
      if (currentUser) {
        navigate(option.path, { state: { file: file } });
      }
    }
  };

  const handleStartScan = (option) => {
    if (currentUser) {
      if (option.hasUpload) {
        // For upload types, trigger file input click
        document.getElementById(`file-input-${option.id}`)?.click();
      } else {
        // For text, direct navigate (no file needed)
        navigate(option.path);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      {!currentUser && (
        <div className="max-w-4xl mx-auto px-4 mt-24 md:mt-32">
          <div className="bg-yellow-600/10 border border-yellow-600 text-yellow-200 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <strong>Please sign in before scanning</strong>
                <div className="text-sm text-yellow-100">Create an account or sign in to access detection features.</div>
              </div>
              <div className="flex-shrink-0">
                <button onClick={() => navigate('/signin')} className="bg-yellow-600 text-slate-900 px-4 py-2 rounded mr-2">Sign In</button>
                <button onClick={() => navigate('/signup')} className="bg-yellow-500 text-white px-4 py-2 rounded">Create Account</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your <span className="text-cyan-400">Detection Method</span>
          </h1>
          <p className="text-gray-400 mb-12">
            Select the type of media you want to analyze. Our advanced AI algorithms are
            specifically trained for each media type to provide the most accurate deepfake
            detection results.
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-16 text-white">
            <div className="text-center">
              <p className="text-4xl font-bold text-cyan-400">2.4M+</p>
              <p className="text-gray-400">Files Analyzed</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-400">99.2%</p>
              <p className="text-gray-400">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-400">45K+</p>
              <p className="text-gray-400">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-400">24/7</p>
              <p className="text-gray-400">AI Protection</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-6">
          {detectionOptions.map((option) => (
            <div
              key={option.id}
              className={`
                rounded-3xl border ${option.borderColor} bg-slate-800/50 p-8 shadow-lg 
                transition-all duration-300 ${option.hoverBorderColor} hover:bg-slate-800/70 cursor-pointer
                group
              `}
              onClick={() => handleStartScan(option)}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl ${option.iconBg}`}>
                  <option.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Accuracy</p>
                  <p className="text-white font-bold">{option.accuracy}</p>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3">{option.title}</h3>
              <p className="text-gray-300 mb-6" style={{ minHeight: '60px' }}>
                {option.description}
              </p>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Key Features</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {option.keyFeatures.map((feature) => (
                    <li key={feature} className="flex items-center space-x-2 text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between text-sm text-gray-400 mb-6">
                <div className="flex-1 overflow-hidden pr-2">
                  <span className="font-semibold">Supported Formats</span>
                  <p className="text-gray-500 truncate" title={option.formats.join(', ')}>
                    {option.formats.length ? option.formats.join(', ') : 'Text, URLs, Documents'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-semibold">Max Size</span>
                  <p className="text-gray-500">{option.maxSize}</p>
                </div>
              </div>

              {option.hasUpload ? (
                <div className="relative border-2 border-dashed border-slate-600 rounded-xl p-6 text-center bg-slate-900/30 hover:border-cyan-400 transition">
                  <input
                    id={`file-input-${option.id}`}
                    type="file"
                    accept={option.formats.join(',')}
                    onChange={(e) => handleFileChange(option, e)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300">
                    <span className="font-semibold">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-gray-500 text-sm mt-1 truncate px-2" title={selectedFiles[option.id]?.name}>
                    {selectedFiles[option.id] ? `📁 ${selectedFiles[option.id].name}` : `...${option.formats.slice(0, 3).join(', ')}`}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-orange-500/50 rounded-xl p-6 text-center bg-gradient-to-r from-orange-500/5 to-red-500/5">
                  <FileText className="h-10 w-10 text-orange-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg font-semibold mb-2">Advanced Text Analysis</p>
                  <p className="text-gray-400 text-sm">Direct text input, URL scanning, and document upload available</p>
                </div>
              )}

              <button
                className={`w-full mt-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all group-hover:scale-[1.02]
                  ${
                    option.hasUpload && !selectedFiles[option.id]
                      ? 'bg-slate-700 text-gray-400 cursor-not-allowed'
                      : option.buttonColor
                  }`}
                disabled={option.hasUpload && !selectedFiles[option.id]}
              >
                <span>{option.buttonText}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Detection;

