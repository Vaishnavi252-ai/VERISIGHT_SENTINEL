import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';

const CTASection = () => {
  return (
    <section id="contact" className="py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Background Elements (Existing) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Content (Left Side - Already matches image) */}
          <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
            <div className="space-y-4 lg:space-y-6">
              <div className="inline-flex items-center space-x-2 bg-purple-600/10 border border-purple-500/20 rounded-full px-4 py-2 animate-in slide-in-from-top-4 duration-700">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-medium">Start Your Detection Journey</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight animate-in slide-in-from-bottom-6 duration-700 delay-200">
                Start Your{' '}
                <span className="bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                  Detection Journey
                </span>{' '}
                Today
              </h2>
              
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 animate-in slide-in-from-bottom-6 duration-700 delay-300">
                Empower Truth. Expose Deepfakes. Join VeriSight Sentinel and experience the power of AI-driven 
                deepfake detection without any commitment.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in slide-in-from-bottom-6 duration-700 delay-500">
              <Link to="/detection" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 group">
                <span className="font-semibold">Start Detection Now</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              
              <button className="border border-gray-600 hover:border-purple-500 text-white px-8 py-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 hover:bg-purple-600/10 hover:shadow-lg">
                <span className="font-semibold">Learn More</span>
              </button>
            </div>

            {/* Trust Indicators (Existing) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-8 space-y-4 sm:space-y-0 pt-6 lg:pt-8 justify-center lg:justify-start animate-in slide-in-from-bottom-6 duration-700 delay-700">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">Free trial available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-300 text-sm">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* ⚠️ Updated Visual Element (Right Side) */}
          <div className="relative mt-12 lg:mt-0 animate-in slide-in-from-right-6 duration-700 delay-300">
            <div className="relative p-2 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-xl shadow-purple-900/30 overflow-hidden">
              {/* Image Container */}
              <div className="relative w-full h-80 rounded-2xl overflow-hidden">
                
                {/* Background Image (Placeholder) */}
                <img 
                  // NOTE: You must replace the 'https://...' URL with your actual image path or asset.
                  src="https://assets.weforum.org/article/image/jUiAI0Yip2gdXLjdNPuJXyomAwfhsmocMbRSuWkux6A.jpg" 
                  alt="Deepfake detection example" 
                  className="w-full h-full object-cover"
                />
                
                {/* Scanning Line Overlay */}
                <div className="absolute inset-0 bg-slate-900/10">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scan" style={{ top: '0%' }}></div>
                </div>
                
                {/* Scanning Text */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-200 text-sm bg-slate-900/50 px-4 py-1 rounded-full border border-green-500/50 font-medium">
                  Scanning AI identity...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;