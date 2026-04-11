import React from 'react';

export default function Bracket({ bracketData, currentUserId }) {
  if (!bracketData || !bracketData.rounds || bracketData.rounds.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-500 text-sm">🏗️ Bracket will appear once the tournament starts</p>
      </div>
    );
  }

  const { rounds, currentRound, status } = bracketData;

  return (
    <div className="w-full">
      {/* Tournament Status */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${status === 'completed' ? 'bg-emerald-400' : 'bg-gold-400 animate-pulse'}`} />
        <span className="text-xs font-medium text-slate-400">
          {status === 'completed' ? 'Tournament Complete' : `Round ${currentRound} in progress`}
        </span>
      </div>

      {/* Bracket Container - horizontally scrollable on mobile */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex gap-6 min-w-max">
          {rounds.map((round, roundIdx) => (
            <div key={round.round} className="flex flex-col items-center">
              {/* Round Header */}
              <div className={`mb-4 px-4 py-1.5 rounded-full text-xs font-bold ${
                round.round === currentRound && status !== 'completed'
                  ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
                  : round.round < currentRound || status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-navy-700/30 text-slate-500 border border-navy-700/30'
              }`}>
                {round.name}
              </div>

              {/* Matches in this round */}
              <div className="flex flex-col justify-around flex-1 gap-4" style={{ minWidth: 180 }}>
                {round.matches.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-44 p-3 rounded-xl border border-dashed border-navy-700/40 text-center">
                      <p className="text-xs text-slate-600">TBD</p>
                    </div>
                  </div>
                ) : (
                  round.matches.map((match, matchIdx) => (
                    <MatchCard
                      key={match.matchId || matchIdx}
                      match={match}
                      isCurrentRound={round.round === currentRound && status !== 'completed'}
                      currentUserId={currentUserId}
                    />
                  ))
                )}
              </div>
            </div>
          ))}

          {/* Champion display */}
          {status === 'completed' && (
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 px-4 py-1.5 rounded-full text-xs font-bold bg-gold-500/15 text-gold-400 border border-gold-500/20">
                Champion
              </div>
              <div className="w-44 p-4 rounded-xl bg-gradient-to-br from-gold-500/10 to-gold-600/5 border border-gold-500/30 text-center glow-gold">
                <span className="text-2xl mb-2 block">🏆</span>
                <p className="text-gold-400 font-bold text-sm">
                  {getChampion(rounds)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, isCurrentRound, currentUserId }) {
  const isPlaying = match.status === 'playing';
  const isCompleted = match.status === 'completed';
  const isBye = match.player1?.id?.toString() === match.player2?.id?.toString();

  return (
    <div
      className={`w-44 rounded-xl border overflow-hidden transition-all duration-300 ${
        isPlaying && isCurrentRound
          ? 'border-gold-500/40 shadow-lg shadow-gold-500/10 animate-pulse-gold'
          : isCompleted
          ? 'border-emerald-500/20 bg-navy-800/40'
          : 'border-navy-700/30 bg-navy-800/30'
      }`}
    >
      {/* Player 1 */}
      <PlayerSlot
        player={match.player1}
        isWinner={match.winner && match.player1 && match.winner.id?.toString() === match.player1.id?.toString()}
        isLoser={match.winner && match.player1 && match.winner.id?.toString() !== match.player1.id?.toString()}
        isCurrentUser={match.player1 && currentUserId && match.player1.id?.toString() === currentUserId}
        isBye={isBye}
        isCompleted={isCompleted}
      />

      {/* Divider */}
      <div className="h-px bg-navy-700/40 relative">
        {isPlaying && (
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-navy-800 border border-gold-500/30 flex items-center justify-center">
            <span className="text-[8px] text-gold-400 font-bold">VS</span>
          </div>
        )}
      </div>

      {/* Player 2 */}
      <PlayerSlot
        player={match.player2}
        isWinner={match.winner && match.player2 && match.winner.id?.toString() === match.player2.id?.toString()}
        isLoser={match.winner && match.player2 && match.winner.id?.toString() !== match.player2.id?.toString()}
        isCurrentUser={match.player2 && currentUserId && match.player2.id?.toString() === currentUserId}
        isBye={isBye}
        isCompleted={isCompleted}
      />
    </div>
  );
}

function PlayerSlot({ player, isWinner, isLoser, isCurrentUser, isBye, isCompleted }) {
  return (
    <div
      className={`px-3 py-2.5 flex items-center gap-2 transition-all ${
        isWinner
          ? 'bg-emerald-500/10'
          : isLoser
          ? 'bg-navy-900/30 opacity-50'
          : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
          isCurrentUser
            ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900'
            : isWinner
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-navy-700 text-slate-400'
        }`}
      >
        {player?.username?.charAt(0)?.toUpperCase() || '?'}
      </div>

      {/* Name */}
      <span
        className={`text-xs font-medium truncate flex-1 ${
          isCurrentUser
            ? 'text-gold-400'
            : isWinner
            ? 'text-emerald-400'
            : isLoser
            ? 'text-slate-600'
            : 'text-slate-300'
        }`}
      >
        {isBye && isCompleted ? `${player?.username || 'TBD'} (bye)` : player?.username || 'TBD'}
      </span>

      {/* Status icon */}
      {isWinner && (
        <span className="text-emerald-400 text-xs flex-shrink-0">✓</span>
      )}
      {isLoser && (
        <span className="text-red-400/50 text-xs flex-shrink-0">✗</span>
      )}
    </div>
  );
}

function getChampion(rounds) {
  if (!rounds || rounds.length === 0) return 'TBD';
  const lastRound = rounds[rounds.length - 1];
  if (!lastRound.matches || lastRound.matches.length === 0) return 'TBD';
  const finalMatch = lastRound.matches[0];
  return finalMatch?.winner?.username || 'TBD';
}
