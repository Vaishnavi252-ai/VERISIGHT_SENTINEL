import React from 'react';
import { Shield, Github, FileText, Phone, Lock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold text-white">VeriSight Sentinel</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              AI-powered deepfake detection platform guarding the truth in every frame. 
              Protecting authenticity across audio, video, image, and text media.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors duration-200">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#detect" className="text-gray-400 hover:text-purple-400 transition-colors duration-200 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentation
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-purple-400 transition-colors duration-200 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#blog" className="text-gray-400 hover:text-purple-400 transition-colors duration-200">
                  Blog & Insights
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors duration-200 flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors duration-200 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 VeriSight Sentinel. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Powered by Advanced AI Detection Technology
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
