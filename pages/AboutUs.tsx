
import React from 'react';

export const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="glass-card p-8 md:p-12 rounded-2xl border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-center relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-fuchsia-500/20 blur-3xl rounded-full"></div>

        <h1 className="font-display text-3xl md:text-5xl font-bold mb-8 text-white uppercase tracking-wider">
          Legal Notice
        </h1>

        <div className="space-y-8 text-slate-300 leading-relaxed font-body text-lg">
          <p className="font-bold text-cyan-400 tracking-widest uppercase">
            THIS IS A LEGAL DISTRIBUTION OF/BRANCH OF VISHWAJITH SOLUTIONS
          </p>
          
          <div className="w-16 h-px bg-white/20 mx-auto"></div>

          <p>
            HERE YOU WILL BE ABLE TO AVAIL DIFFERENT POPULAR COURSES IN <span className="text-fuchsia-400 font-bold text-2xl mx-2">50% OFF</span> RATE IN INR.
          </p>

          <p className="text-sm text-slate-500 max-w-2xl mx-auto pt-8">
            This platform is designed to provide accessible education to students across the region using a secure, verified code redemption system. All transactions are monitored and linked to specific user identities for security.
          </p>
        </div>
      </div>
    </div>
  );
};
