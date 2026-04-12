import React from 'react';

export default function TournamentBracket({ bracket }) {
  if (!bracket || !bracket.rounds) return (
    <div className="p-8 text-center text-slate-500">
      No bracket data available yet.
    </div>
  );

  return (
    <div className="w-full overflow-x-auto pb-8">
      <div className="flex gap-12 min-w-max px-4">
        {bracket.rounds.map((round, rIndex) => (
          <div key={rIndex} className="flex flex-col gap-8 w-64">
            <h3 className="text-center text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
              {round.name}
            </h3>
            
            <div className={`flex flex-col justify-around flex-grow gap-8`}>
              {round.matches.map((match, mIndex) => {
                const isWinner1 = match.winner && match.player1 && match.winner.id === match.player1.id;
                const isWinner2 = match.winner && match.player2 && match.winner.id === match.player2.id;
                
                return (
                  <div key={match.matchId || mIndex} className="relative">
                    <div className="bg-navy-900 border border-navy-700/50 rounded-xl overflow-hidden shadow-lg">
                      {/* Player 1 */}
                      <div className={`flex items-center justify-between p-3 border-b border-navy-700/30 ${isWinner1 ? 'bg-chess-green/10' : ''}`}>
                        <span className={`text-sm font-bold truncate ${isWinner1 ? 'text-chess-green' : (match.winner ? 'text-slate-600' : 'text-slate-300')}`}>
                          {match.player1?.username || 'TBD'}
                        </span>
                        {isWinner1 && <span className="text-xs">🏆</span>}
                      </div>
                      
                      {/* Player 2 */}
                      <div className={`flex items-center justify-between p-3 ${isWinner2 ? 'bg-chess-green/10' : ''}`}>
                        <span className={`text-sm font-bold truncate ${isWinner2 ? 'text-chess-green' : (match.winner ? 'text-slate-600' : 'text-slate-300')}`}>
                          {match.player2?.username || 'TBD'}
                        </span>
                        {isWinner2 && <span className="text-xs">🏆</span>}
                      </div>
                    </div>
                    
                    {/* Connector lines (visual only) */}
                    {rIndex < bracket.rounds.length - 1 && (
                      <div className="absolute top-1/2 -right-12 w-12 h-px bg-navy-700"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
