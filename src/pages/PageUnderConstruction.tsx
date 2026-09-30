import React from 'react';
import { Wrench } from 'lucide-react';

export default function PageUnderConstruction({ title }: { title: string }) {
  return (
    <div className="max-w-4xl mx-auto py-32 px-6 text-center">
      <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
        <Wrench className="w-12 h-12" />
      </div>
      <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">{title}</h1>
      <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
        We are currently upgrading our platform. This section is under development and will be connected to the Admin Panel soon.
      </p>
      <button 
        onClick={() => window.history.back()} 
        className="px-6 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
}
