import React from 'react';
import { Shield, Zap, FileText, CheckCircle } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Shield,
      title: 'Upload Your Media',
      desc: 'Securely upload images, videos, audio or text. Our system uses end-to-end encryption.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      desc: 'Advanced deepfake detection using multimodal AI models trained on millions of samples.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: FileText,
      title: 'Get Detailed Report',
      desc: 'Comprehensive analysis with confidence scores, anomaly highlights and forensic evidence.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: CheckCircle,
      title: 'Stay Protected',
      desc: 'Real-time monitoring, API access, and enterprise-grade security for your verification needs.',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-24 bg-gradient-to-b from-slate-900/80 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mb-6">
            How VeriSight Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Verify authenticity in seconds with our battle-tested AI. From upload to forensic report in under 5 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="group relative animate-in slide-in-from-bottom-6 duration-700"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 h-full hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-2">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

