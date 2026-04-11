import React from 'react';

export default function Tournaments() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <div className="w-20 h-20 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🏆</span>
      </div>
      <h1 className="text-4xl font-black text-white mb-2">Scheduled Tournaments</h1>
      <p className="text-slate-400 mb-8">Compete in massive 16-player bracket tournaments for grand prizes.</p>

      <div className="bg-navy-800/50 border border-navy-700/50 p-12 rounded-2xl">
        <p className="text-slate-500">No upcoming tournaments scheduled yet.<br/>Please check back later!</p>
      </div>
    </div>
  );
}
