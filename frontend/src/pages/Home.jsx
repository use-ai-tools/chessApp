import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [showBotDifficulty, setShowBotDifficulty] = useState(false);

  return (
    <div className="w-full bg-hero px-4 py-8 pb-28 lg:pb-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black text-white mb-2">
          Welcome to <span className="text-gradient-green">Chess Arena</span>
        </h1>
        <p className="text-slate-400 text-sm mb-8">Choose how you want to play</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Play vs Bot */}
          <div
            className="contest-card p-6 cursor-pointer hover:-translate-y-1 transition-all border-purple-500/30 relative overflow-hidden"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl mb-4 border border-purple-500/20 shadow-lg shadow-purple-500/10">
              🤖
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Play vs Bot</h2>
            <p className="text-slate-400 text-sm mb-4">
              Practice against Stockfish engine at different difficulty levels.
            </p>

            {!showBotDifficulty ? (
              <button
                onClick={() => setShowBotDifficulty(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-violet-600 hover:shadow-lg hover:shadow-purple-500/30 text-white transition-all"
              >
                Choose Difficulty
              </button>
            ) : (
              <div className="flex flex-col gap-2 animate-fade-in">
                <button
                  onClick={() => navigate('/bot?difficulty=5')}
                  className="w-full py-2 rounded-xl text-sm font-bold bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-all"
                >
                  🟢 Easy (Depth 5)
                </button>
                <button
                  onClick={() => navigate('/bot?difficulty=10')}
                  className="w-full py-2 rounded-xl text-sm font-bold bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 transition-all"
                >
                  🟡 Medium (Depth 10)
                </button>
                <button
                  onClick={() => navigate('/bot?difficulty=15')}
                  className="w-full py-2 rounded-xl text-sm font-bold bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-all"
                >
                  🔴 Hard (Depth 15)
                </button>
              </div>
            )}
          </div>

          {/* Practice Puzzles */}
          <div 
            onClick={() => navigate('/puzzles')}
            className="contest-card p-6 cursor-pointer hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center text-3xl mb-4 border border-sky-500/20 shadow-lg shadow-sky-500/10">
              🧩
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Practice Puzzles</h2>
            <p className="text-slate-400 text-sm mb-4">
              Master your tactical vision with 100 checkmate puzzles.
            </p>
            <button className="w-full py-2.5 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white transition-colors">
              Play Puzzles
            </button>
          </div>

          {/* Cash Contests */}
          <div 
            onClick={() => navigate('/contests')}
            className="contest-card p-6 cursor-pointer hover:-translate-y-1 transition-all border-chess-green/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-chess-green text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
              POPULAR
            </div>
            <div className="w-14 h-14 rounded-2xl bg-chess-green/10 flex items-center justify-center text-3xl mb-4 border border-chess-green/20 shadow-lg shadow-chess-green/10">
              ⚔️
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Cash Contests</h2>
            <p className="text-slate-400 text-sm mb-4">
              Compete against players of similar skill and win real money.
            </p>
            <button className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-chess-green to-emerald-600 hover:shadow-lg hover:shadow-chess-green/30 text-white transition-all">
              View Contests
            </button>
          </div>

          {/* Tournaments */}
          <div 
            onClick={() => navigate('/tournaments')}
            className="contest-card p-6 cursor-pointer hover:-translate-y-1 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl mb-4 border border-amber-500/20 shadow-lg shadow-amber-500/10">
              🏆
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Tournaments</h2>
            <p className="text-slate-400 text-sm mb-4">
              Join scheduled multi-round tournaments for massive prize pools.
            </p>
            <button className="w-full py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white transition-colors">
              See Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
