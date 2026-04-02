import React from 'react';

const StepCard = ({ step, title, description, icon: Icon, isActive = false }) => {
  return (
    <div className={`relative p-6 rounded-2xl border transition-all duration-300 hover:transform hover:scale-105 group ${
      isActive 
        ? 'bg-gradient-to-br from-purple-600/20 to-violet-600/20 border-purple-500/50 shadow-lg shadow-purple-500/10' 
        : 'bg-slate-800/50 border-slate-700 hover:border-purple-500/30 hover:bg-slate-800/70'
    }`}>
      {/* Step Number */}
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 transition-all duration-300 ${
        isActive 
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
          : 'bg-slate-700 text-gray-300 group-hover:bg-purple-600/20 group-hover:text-purple-400'
      }`}>
        <span className="font-bold">{step}</span>
      </div>
      
      {/* Icon */}
      <div className="mb-4">
        <Icon className={`h-8 w-8 transition-all duration-300 ${
          isActive ? 'text-purple-400' : 'text-gray-400 group-hover:text-purple-400'
        }`} />
      </div>
      
      {/* Content */}
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-purple-100 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
        {description}
      </p>
      
      {/* Connector Line */}
      {step < 3 && (
        <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-px bg-gradient-to-r from-purple-500/50 to-transparent group-hover:from-purple-400 transition-all duration-300"></div>
      )}
    </div>
  );
};

export default StepCard;