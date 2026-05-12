import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [showBotDifficulty, setShowBotDifficulty] = useState(false);

  return (
    <div className="w-full bg-hero px-4 py-8 flex-1">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-1">
          Welcome to <span className="text-chess-green">Chess Arena</span>
        </h1>
        <p className="text-slate-500 text-sm mb-8">Choose how you want to play</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Play vs Bot */}
          <div className="card-hover p-6 cursor-pointer flex flex-col">
            <div className="text-3xl mb-4">🤖</div>
            <h2 className="text-lg font-bold text-white mb-1">Play vs Bot</h2>
            <p className="text-slate-500 text-xs mb-4">Practice against Stockfish at various levels.</p>

            <div className="mt-auto">
            {!showBotDifficulty ? (
              <button
                onClick={() => setShowBotDifficulty(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-600 text-white transition-all hover:shadow-md hover:shadow-purple-500/15"
              >
                Choose Difficulty
              </button>
            ) : (
              <div className="flex flex-col gap-2 animate-fade-in">
                <button
                  onClick={() => navigate('/bot?difficulty=5')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  🟢 Easy
                </button>
                <button
                  onClick={() => navigate('/bot?difficulty=10')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                >
                  🟡 Medium
                </button>
                <button
                  onClick={() => navigate('/bot?difficulty=15')}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  🔴 Hard
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Practice Puzzles */}
          <div 
            onClick={() => navigate('/puzzles')}
            className="card-hover p-6 cursor-pointer flex flex-col"
          >
            <div className="text-3xl mb-4">🧩</div>
            <h2 className="text-lg font-bold text-white mb-1">Practice Puzzles</h2>
            <p className="text-slate-500 text-xs mb-4">Master tactical vision with 100 checkmate puzzles.</p>
            <button className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all">
              Play Puzzles
            </button>
          </div>

          {/* Cash Contests */}
          <div 
            onClick={() => navigate('/contests')}
            className="card-hover p-6 cursor-pointer flex flex-col"
          >
            <div className="text-3xl mb-4">⚔️</div>
            <h2 className="text-lg font-bold text-white mb-1">Cash Contests</h2>
            <p className="text-slate-500 text-xs mb-4">Compete and win real money.</p>
            <button className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-chess-green to-emerald-600 text-white transition-all hover:shadow-md hover:shadow-chess-green/15">
              View Contests
            </button>
          </div>

          {/* Tournaments */}
          <div 
            onClick={() => navigate('/tournaments')}
            className="card-hover p-6 cursor-pointer flex flex-col"
          >
            <div className="text-3xl mb-4">🏆</div>
            <h2 className="text-lg font-bold text-white mb-1">Tournaments</h2>
            <p className="text-slate-500 text-xs mb-4">Join multi-round tournaments for big prizes.</p>
            <button className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">
              See Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
