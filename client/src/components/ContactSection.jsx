import React, { useState } from 'react';
import { Mail, Send, Shield, CheckCircle, Check, Zap, FileText } from 'lucide-react';

const ContactSection = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
    setEmail('');
  };

  return (

<section id="contact" className="py-12 lg:py-16 bg-slate-900">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
    
    <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Text */}
          <div className="order-2 lg:order-1 space-y-6">
            <div className="inline-flex items-center bg-gradient-to-r from-purple-500 to-violet-500 px-6 py-3 rounded-full border border-purple-500/50">
              <Shield className="w-5 h-5 mr-2" />
              <span className="font-semibold text-white">Join 10K+ Security Professionals</span>
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-100 to-gray-200 bg-clip-text text-transparent leading-tight">
              Newsletter: Stay Ahead of Threats
            </h2>
            <ul className="space-y-4 text-gray-300 text-lg max-w-lg">
              <li className="flex items-start space-x-3">
                <Zap className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Weekly threat reports & research</span>
              </li>
              <li className="flex items-start space-x-3">
                <FileText className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Exclusive VeriSight papers early</span>
              </li>
              <li className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>API updates & new features</span>
              </li>
            </ul>
          </div>
          
          {/* Right Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 max-w-md animate-in slide-in-from-right duration-700">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className="sr-only">Email address</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-900/80 border border-slate-700 rounded-2xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-lg pl-12"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  disabled={loading || submitted}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                >
                  {loading ? (
                    <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" pathLength="1" className="opacity-25" />
                      <path d="M12 2v6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="opacity-75" />
                    </svg>
                  ) : submitted ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Subscribed!
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Get Updates
                    </>
                  )}
                </button>
              </form>
              {submitted && (
                <p className="mt-6 text-emerald-400 text-sm font-medium flex items-center justify-center pt-4 border-t border-slate-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Thank you! You're subscribed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

