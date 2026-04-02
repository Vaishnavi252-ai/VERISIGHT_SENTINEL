import React from 'react';
import { Shield, Sparkles, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@google/model-viewer';

const HeroSection = () => {
  return (
    <section id="home" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Abstract Background Elements (omitted for brevity) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-violet-600/10 to-purple-600/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 animate-in fade-in duration-1000">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen">
          {/* Content (omitted for brevity) */}
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
            <div className="space-y-4 lg:space-y-6">
              <div className="inline-flex items-center space-x-2 bg-purple-600/10 border border-purple-500/20 rounded-full px-4 py-2 animate-in slide-in-from-top-4 duration-700">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">AI-Powered Detection</span>
                <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold text-white leading-tight animate-in slide-in-from-bottom-6 duration-700 delay-200">
                Your AI-Powered{' '}
                <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                  Deepfake Detection
                </span>{' '}
                Shield
              </h1>
              
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto lg:mx-0 animate-in slide-in-from-bottom-6 duration-700 delay-300">
                Guarding the truth in every frame — audio, video, image. 
                Advanced AI technology to detect and expose manipulated media with precision.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in slide-in-from-bottom-6 duration-700 delay-500">
              <Link to="/detection" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 group">
                <span className="font-semibold">Get Started Now</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              
              <button className="border border-gray-600 hover:border-purple-500 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 hover:bg-purple-600/10 hover:shadow-lg group">
                <Play className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-semibold">Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative animate-in slide-in-from-right-8 duration-700 delay-400">
            <div className="relative">
              {/* 3D Model Viewer */}
              <div className="relative h-[400px] sm:h-[450px] w-full rounded-2xl overflow-hidden">
                {/* Background gradient for fallback */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-violet-600/20"></div>
                
                {/* model-viewer component (use root public path) */}
                <model-viewer
                  src="/models/robot_playground.glb"
                  alt="3D model"
                  camera-controls
                  auto-rotate
                  // Centering the model by ensuring the camera starts in a good position
                  camera-orbit="0deg 90deg 1.5m" 
                  exposure="1"
                  shadow-intensity="1"
                  class="absolute inset-0 w-full h-full z-10"
                  style={{ width: '100%', height: '100%' }}
                >
                </model-viewer>
                
                {/* Overlay effects (omitted for brevity) */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent z-20 pointer-events-none"></div>
                
                {/* Corner Brackets for UI feel (omitted for brevity) */}
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-purple-400/60 z-30"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-purple-400/60 z-30"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-purple-400/60 z-30"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-purple-400/60 z-30"></div>
                
                {/* Floating Elements (omitted for brevity) */}
                <div className="absolute top-4 right-4 w-12 sm:w-16 h-12 sm:h-16 bg-purple-500/20 rounded-lg backdrop-blur-sm border border-purple-500/30 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-4 left-4 w-16 sm:w-20 h-16 sm:h-20 bg-violet-500/20 rounded-full backdrop-blur-sm border border-violet-500/30 animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 right-8 w-8 sm:w-12 h-8 sm:h-12 bg-blue-500/20 rounded-full backdrop-blur-sm border border-blue-500/30 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              </div>
              
              {/* Detection Interface (omitted for brevity) */}
              <div className="mt-4 lg:mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm">3D AI Model Active</span>
                </div>
                <div className="text-purple-400 text-sm font-medium animate-pulse">Analyzing...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection;