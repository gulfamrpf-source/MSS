import React from 'react';

export default function GlobalBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#f8fafc]">
      {/* Abstract background shapes */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-emerald-200/20 blur-3xl"></div>
      <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-amber-200/20 blur-3xl"></div>
      
      {/* SVG Vector Elements (Nodes & Connections) */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <path d="M 0 50 Q 25 30 50 60 T 100 40" fill="none" stroke="#059669" strokeWidth="0.2" strokeDasharray="1 1" />
        <path d="M 10 90 Q 40 70 60 90 T 100 70" fill="none" stroke="#059669" strokeWidth="0.1" strokeDasharray="0.5 1" />
        <path d="M 30 10 Q 60 30 80 10" fill="none" stroke="#059669" strokeWidth="0.15" strokeDasharray="1 1" />
        
        {/* Dots */}
        <circle cx="25" cy="40" r="0.5" fill="#10b981" />
        <circle cx="50" cy="60" r="0.8" fill="#10b981" />
        <circle cx="75" cy="50" r="0.6" fill="#10b981" />
        <circle cx="40" cy="78" r="0.4" fill="#10b981" />
        <circle cx="80" cy="20" r="0.5" fill="#10b981" />
        
        {/* Heart / NGO Icon Abstracted */}
        <path d="M 85 85 C 85 82 82 82 82 85 C 82 88 85 90 85 90 C 85 90 88 88 88 85 C 88 82 85 82 85 85" fill="#f59e0b" opacity="0.5" />
        <path d="M 15 20 C 15 18.5 13.5 18.5 13.5 20 C 13.5 21.5 15 22.5 15 22.5 C 15 22.5 16.5 21.5 16.5 20 C 16.5 18.5 15 18.5 15 20" fill="#10b981" opacity="0.4" />
      </svg>

      {/* Dotted map texture overlay */}
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(#059669 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      
      {/* Subtle overlay to ensure text contrast */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px]"></div>
    </div>
  );
}
