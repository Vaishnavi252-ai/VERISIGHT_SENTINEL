import React, { useState } from 'react';
// 1. Import new icon for "Key Features"
import {
  Upload, Image, Video, Headphones, FileText, ArrowRight,
  CheckCircle // <--- ADDED THIS
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

  // 2. New data structure to match the detailed UI from your video
  const detectionOptions = [
    {
      id: 'image',
      title: 'Image Detection',
      description: 'Analyze photos and images for deepfake manipulation, face swapping, and AI-generated content.',
      icon: Image,
      accuracy: '99.2%', // Added from video
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
      // UI Colors from video
      buttonColor: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700',
      borderColor: 'border-cyan-500/50',
      hoverBorderColor: 'hover:border-cyan-500',
      iconBg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    },
    {
      id: 'video',
      title: 'Video Detection',
      description: 'Detect deepfake videos, face swaps, and temporal inconsistencies in video content.',
      icon: Video,
      accuracy: '98.7%', // Added from video
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
    },
    {
      id: 'audio',
      title: 'Audio Detection',
      description: 'Analyze audio files for AI-generated voices, cloning, and synthetic patterns.',
      icon: Headphones,
      accuracy: '97.8%', // Added from video
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
    },
    {
      id: 'text',
      title: 'Text Detection',
      description: 'Detect AI-written text, check for linguistic patterns, and identify synthetic content.',
      icon: FileText,
      accuracy: '96.5%', // Added from video
      formats: ['.txt', '.doc', '.docx', '.pdf', '.rtf'],
      keyFeatures: [
        'AI writing detection',
        'Style analysis',
        'Linguistic patterns',
        'Semantic consistency'
      ],
      maxSize: '5MB',
      path: '/text-scan',
      buttonText: 'Start Text Detection',
      buttonColor: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
      borderColor: 'border-orange-500/50',
      hoverBorderColor: 'hover:border-orange-500',
      iconBg: 'bg-gradient-to-r from-orange-500 to-red-500',
    },
  ];

  // 3. Navigation and file handling logic (This is our working logic)
  const handleFileChange = (option, e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [option.id]: file }));
      // Navigate immediately after selecting a file
      // Only navigate if user is signed in
      if (currentUser) handleNavigateToScan(option, file);
    }
  };

  const handleNavigateToScan = (option, file = null) => {
    if (!file) return; // Only navigate if there's a file
    navigate(option.path, { state: { file: file } });
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      {/* Sign-in gate: require sign in before scanning */}
      {!currentUser && (
        <div className="max-w-4xl mx-auto px-4 mt-24 md:mt-32"> {/* add top margin so banner is below fixed navbar */}
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
          {/* Statistics Section (from video) */}
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

        {/* 4. New Card Grid Layout (matches video) */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-6">
          {detectionOptions.map((option) => (
            <div
              key={option.id}
              className={`
                rounded-3xl border ${option.borderColor} bg-slate-800/50 p-8 shadow-lg 
                transition-all duration-300 ${option.hoverBorderColor} hover:bg-slate-800/70
              `}
              // <-- NO onClick here, the card itself is not a button
            >
              {/* Card Header */}
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
              <p className="text-gray-300 mb-6" style={{ minHeight: '60px' }}> {/* Set min height for alignment */}
                {option.description}
              </p>

              {/* Key Features */}
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

              {/* Details */}
              <div className="flex justify-between text-sm text-gray-400 mb-6">
                <div className="flex-1 overflow-hidden pr-2">
                  <span className="font-semibold">Supported Formats</span>
                  <p className="text-gray-500 truncate" title={option.formats.join(', ')}>
                    {option.formats.join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-semibold">Max Size</span>
                  <p className="text-gray-500">{option.maxSize}</p>
                </div>
              </div>

              {/* Upload Area: This works by having the input *inside* the div */}
              <div
                className="relative border-2 border-dashed border-slate-600 rounded-xl p-6 text-center bg-slate-900/30 hover:border-cyan-400 transition cursor-pointer"
              >
                <input
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

              {/* Action Button: Navigates on click */}
              <button
                onClick={() => {
                  handleNavigateToScan(option, selectedFiles[option.id]);
                }}
                disabled={!selectedFiles[option.id]}
                className={`w-full mt-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all 
                  ${
                    selectedFiles[option.id]
                      ? `${option.buttonColor} text-white`
                      : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <span>{option.buttonText}</span>
                <ArrowRight className="h-5 w-5" />
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
