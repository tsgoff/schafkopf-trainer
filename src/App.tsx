import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Card as CardComponent } from './components/Card';
import { 
  Card, 
  GameState, 
  Player, 
  Suit 
} from './types';
import { 
  createDeck, 
  RANK_POINTS,
  TUTORIAL_STEPS 
} from './constants';
import { 
  shuffle, 
  getPlayableCards, 
  getTrickWinner, 
  isTrump,
  getTrickAnalysis,
  getCardPower
} from './lib/gameLogic';
import { 
  Trophy, 
  Info, 
  ChevronRight, 
  RotateCcw, 
  Play,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

const INITIAL_STATE: GameState = {
  players: [],
  currentPlayerIndex: 0,
  currentTrick: [],
  trumpSuit: 'Herz',
  gameType: 'Sauspiel',
  phase: 'Dealing',
  tutorialStep: 0,
  lastTrickWinnerIndex: null,
  lastTrickExplanation: '',
  lastTrickTip: '',
  declarerIndex: 0,
  partnerIndex: null,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [showTutorial, setShowTutorial] = useState(true);
  const [message, setMessage] = useState<string>('Willkommen zum Schafkopf Trainer!');

  // Track the human's hand at the start of their turn in a trick
  const [humanHandBeforePlay, setHumanHandBeforePlay] = useState<Card[]>([]);
  const [trickAtHumanPlay, setTrickAtHumanPlay] = useState<{ playerIndex: number; card: Card }[]>([]);

  const startNewGame = useCallback(() => {
    const deck = shuffle(createDeck());
    const players: Player[] = [
      { id: '0', name: 'Du', hand: deck.slice(0, 8), tricks: [], score: 0, isHuman: true },
      { id: '1', name: 'Sepp (KI)', hand: deck.slice(8, 16), tricks: [], score: 0, isHuman: false },
      { id: '2', name: 'Hans (KI)', hand: deck.slice(16, 24), tricks: [], score: 0, isHuman: false },
      { id: '3', name: 'Wasti (KI)', hand: deck.slice(24, 32), tricks: [], score: 0, isHuman: false },
    ];

    setGameState({
      ...INITIAL_STATE,
      players,
      phase: 'Playing',
      tutorialStep: 1,
    });
    setMessage('Die Karten wurden gemischt und gegeben. Du bist an der Reihe!');
    setHumanHandBeforePlay([]);
    setTrickAtHumanPlay([]);
  }, []);

  const playCard = (playerIndex: number, card: Card) => {
    if (playerIndex === 0) {
      setHumanHandBeforePlay(gameState.players[0].hand);
      setTrickAtHumanPlay(gameState.currentTrick);
    }

    setGameState(prev => {
      const newPlayers = prev.players.map((p, idx) => {
        if (idx === playerIndex) {
          return { ...p, hand: p.hand.filter(c => c.id !== card.id) };
        }
        return p;
      });

      const newTrick = [...prev.currentTrick, { playerIndex, card }];
      
      // If trick is full
      if (newTrick.length === 4) {
        const analysis = getTrickAnalysis(newTrick, prev.trumpSuit);
        const winnerIdx = analysis.winnerIndex;
        const trickPoints = newTrick.reduce((sum, t) => sum + t.card.points, 0);
        
        const updatedPlayers = newPlayers.map((p, idx) => {
          if (idx === winnerIdx) {
            return { 
              ...p, 
              tricks: [...p.tricks, newTrick.map(t => t.card)],
              score: p.score + trickPoints 
            };
          }
          return p;
        });

        // Generate Tip for human
        let trickTip = "";
        const humanPlay = newTrick.find(t => t.playerIndex === 0);
        if (humanPlay) {
          if (winnerIdx === 0) {
            trickTip = "Glückwunsch! Du hast den Stich gewonnen. Das war die richtige Karte.";
          } else {
            // Find if any card in humanHandBeforePlay would have won
            // We need to simulate the trick with that card instead of current humanPlay
            const playableAtStart = getPlayableCards(
              playerIndex === 0 ? prev.players[0].hand : humanHandBeforePlay, 
              playerIndex === 0 ? prev.currentTrick : trickAtHumanPlay, 
              prev.trumpSuit
            );
            
            const winningCards = playableAtStart.filter(c => {
               // Simulate: card c beats all other cards actually played in this trick
               const others = newTrick.filter(t => t.playerIndex !== 0).map(t => t.card);
               const powerC = getCardPower(c, prev.trumpSuit);
               const isTrumpC = isTrump(c, prev.trumpSuit);
               
               return others.every(other => {
                 const powerO = getCardPower(other, prev.trumpSuit);
                 const isTrumpO = isTrump(other, prev.trumpSuit);
                 
                 if (isTrumpC && !isTrumpO) return true;
                 if (!isTrumpC && isTrumpO) return false;
                 if (isTrumpC && isTrumpO) return powerC > powerO;
                 
                 // Both not trump
                 const ledCard = newTrick[0].card;
                 if (c.suit === ledCard.suit && other.suit !== ledCard.suit) return true;
                 if (c.suit !== ledCard.suit && other.suit === ledCard.suit) return false;
                 if (c.suit === ledCard.suit && other.suit === ledCard.suit) return powerC > powerO;
                 
                 return true; // neither is trump or led suit, so they don't beat each other anyway
               });
            });

            if (winningCards.length > 0) {
              const best = winningCards.sort((a,b) => getCardPower(a, prev.trumpSuit) - getCardPower(b, prev.trumpSuit))[0];
              trickTip = `Schade. Hättest du ${best.suit} ${best.rank} gespielt, hättest du gewinnen können.`;
            } else {
              trickTip = "Keine Sorge, in diesem Stich hattest du keine Karte, die hätte gewinnen können.";
            }
          }
        }

        // Check if game is over
        const isGameOver = updatedPlayers.every(p => p.hand.length === 0);

        return {
          ...prev,
          players: updatedPlayers,
          currentTrick: [],
          currentPlayerIndex: winnerIdx,
          lastTrickWinnerIndex: winnerIdx,
          lastTrickExplanation: analysis.explanation,
          lastTrickTip: trickTip,
          phase: isGameOver ? 'Scoring' : 'Playing',
        };
      }

      return {
        ...prev,
        players: newPlayers,
        currentTrick: newTrick,
        currentPlayerIndex: (playerIndex + 1) % 4,
      };
    });
  };

  // AI Logic
  useEffect(() => {
    if (gameState.phase === 'Playing' && gameState.players.length > 0 && !gameState.players[gameState.currentPlayerIndex].isHuman) {
      const timer = setTimeout(() => {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const playable = getPlayableCards(currentPlayer.hand, gameState.currentTrick, gameState.trumpSuit);
        // Simple AI: play a random playable card
        const cardToPlay = playable[Math.floor(Math.random() * playable.length)];
        playCard(gameState.currentPlayerIndex, cardToPlay);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayerIndex, gameState.phase, gameState.players]);

  // Tutorial messages
  useEffect(() => {
    if (gameState.phase === 'Scoring') {
      const userScore = gameState.players[0].score;
      if (userScore > 60) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        setMessage(`Glückwunsch! Du hast mit ${userScore} Punkten gewonnen!`);
      } else {
        setMessage(`Schade! Du hast nur ${userScore} Punkte erreicht. (61 zum Sieg nötig)`);
      }
    }
  }, [gameState.phase, gameState.players]);

  const nextTutorialStep = () => {
    setGameState(prev => ({ ...prev, tutorialStep: Math.min(prev.tutorialStep + 1, TUTORIAL_STEPS.length - 1) }));
  };

  return (
    <div className="min-h-screen bg-[#1a3a1a] text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="p-4 bg-black/20 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
            <HelpCircle className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Schafkopf Trainer</h1>
            <p className="text-xs text-emerald-400 font-medium uppercase tracking-widest">Bayerisches Kulturgut</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={startNewGame}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-full text-sm font-bold transition-all shadow-lg active:scale-95"
          >
            <RotateCcw size={16} />
            Neues Spiel
          </button>
        </div>
      </header>

      <main className="container mx-auto p-4 flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-80px)]">
        {/* Game Area */}
        <div className="flex-1 relative bg-black/10 rounded-3xl border border-white/5 overflow-hidden flex flex-col min-h-[600px]">
          {gameState.phase === 'Dealing' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-4"
              >
                <h2 className="text-4xl font-bold">Bereit für eine Runde?</h2>
                <p className="text-emerald-200/70 max-w-md">Lerne die Regeln des bayerischen Nationalspiels in einer geführten Demo-Runde.</p>
                <button 
                  onClick={startNewGame}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-xl font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <Play fill="currentColor" />
                  Spiel Starten
                </button>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="flex-1 relative flex items-center justify-center p-8">
                {/* Opponents */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                    <span className="text-xs font-bold">H</span>
                  </div>
                  <div className="flex gap-1">
                    {gameState.players[2].hand.map((_, i) => (
                      <div key={i} className="w-4 h-6 bg-amber-900/50 rounded-sm border border-amber-900/30" />
                    ))}
                  </div>
                  <span className="text-xs opacity-60">Hans (KI)</span>
                </div>

                <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-row items-center gap-2">
                  <div className="flex flex-col gap-1">
                    {gameState.players[1].hand.map((_, i) => (
                      <div key={i} className="w-6 h-4 bg-amber-900/50 rounded-sm border border-amber-900/30" />
                    ))}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                      <span className="text-xs font-bold">S</span>
                    </div>
                    <span className="text-xs opacity-60">Sepp</span>
                  </div>
                </div>

                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-row-reverse items-center gap-2">
                  <div className="flex flex-col gap-1">
                    {gameState.players[3].hand.map((_, i) => (
                      <div key={i} className="w-6 h-4 bg-amber-900/50 rounded-sm border border-amber-900/30" />
                    ))}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                      <span className="text-xs font-bold">W</span>
                    </div>
                    <span className="text-xs opacity-60">Wasti</span>
                  </div>
                </div>

                {/* Current Trick */}
                <div className="relative w-64 h-64 bg-emerald-900/30 rounded-full border border-white/5 flex items-center justify-center">
                  <AnimatePresence>
                    {gameState.currentTrick.map((t, i) => {
                      const positions = [
                        "bottom-4 left-1/2 -translate-x-1/2", // Player 0
                        "left-4 top-1/2 -translate-y-1/2",    // Player 1
                        "top-4 left-1/2 -translate-x-1/2",    // Player 2
                        "right-4 top-1/2 -translate-y-1/2",   // Player 3
                      ];
                      return (
                        <motion.div
                          key={`${t.playerIndex}-${t.card.id}`}
                          initial={{ scale: 0, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          className={cn("absolute", positions[t.playerIndex])}
                        >
                          <CardComponent card={t.card} disabled className="scale-75 md:scale-90 shadow-2xl" />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  
                  {gameState.currentTrick.length === 0 && gameState.lastTrickWinnerIndex !== null && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-emerald-400/50 text-sm font-medium italic"
                    >
                      {gameState.players[gameState.lastTrickWinnerIndex].name} hat den Stich gemacht
                    </motion.div>
                  )}
                </div>
              </div>

              {/* User Hand */}
              <div className="p-6 bg-black/20 border-t border-white/5">
                <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto pb-2">
                  {gameState.players[0].hand.map((card) => {
                    const playable = getPlayableCards(
                      gameState.players[0].hand, 
                      gameState.currentTrick, 
                      gameState.trumpSuit
                    );
                    const isCardPlayable = playable.some(c => c.id === card.id) && 
                                          gameState.currentPlayerIndex === 0 && 
                                          gameState.phase === 'Playing';
                    
                    return (
                      <CardComponent 
                        key={card.id} 
                        card={card} 
                        isPlayable={isCardPlayable}
                        onClick={() => playCard(0, card)}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Info/Tutorial Panel */}
        <aside className="w-full lg:w-96 flex flex-col gap-4 lg:overflow-y-auto custom-scrollbar lg:pr-2">
          {/* Last Trick Analysis */}
          {gameState.lastTrickWinnerIndex !== null && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 rounded-3xl p-6 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Play className="text-amber-400 rotate-90" size={20} />
                </div>
                <h3 className="font-bold">Letzter Stich</h3>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="font-bold text-emerald-400 mb-1">Erklärung:</p>
                  <p className="text-emerald-100/80 leading-snug">{gameState.lastTrickExplanation}</p>
                </div>

                {gameState.lastTrickTip && (
                  <div className="text-sm p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-3">
                    <Lightbulb className="text-amber-400 shrink-0" size={18} />
                    <div>
                      <p className="font-bold text-amber-400 mb-1">Tipp:</p>
                      <p className="text-amber-100/90 leading-snug">{gameState.lastTrickTip}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Status Card */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Info className="text-emerald-400" size={20} />
              </div>
              <h3 className="font-bold">Spiel-Status</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Trumpf:</span>
                <span className="font-bold text-red-400">Herz (Sauspiel)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Deine Punkte:</span>
                <span className="font-bold text-emerald-400">{gameState.players[0]?.score || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-60">Am Zug:</span>
                <span className={cn("font-bold", gameState.currentPlayerIndex === 0 ? "text-emerald-400" : "text-white")}>
                  {gameState.players[gameState.currentPlayerIndex]?.name || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Tutorial Card */}
          <div className="flex-1 bg-emerald-950/40 rounded-3xl p-6 border border-emerald-500/20 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <HelpCircle className="text-emerald-400" size={20} />
              </div>
              <h3 className="font-bold">Anleitung</h3>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              <h4 className="text-xl font-bold text-emerald-300">
                {TUTORIAL_STEPS[gameState.tutorialStep].title}
              </h4>
              <p className="text-emerald-100/80 leading-relaxed text-sm">
                {TUTORIAL_STEPS[gameState.tutorialStep].content}
              </p>
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Nächster Schritt:</p>
                <p className="text-sm italic">{TUTORIAL_STEPS[gameState.tutorialStep].action}</p>
              </div>
            </div>

            <button 
              onClick={nextTutorialStep}
              className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            >
              Weiterlesen
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Message Toast */}
          <div className="bg-emerald-600 p-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Info size={16} />
            </div>
            <p className="text-sm font-medium">{message}</p>
          </div>
        </aside>
      </main>

      {/* Scoring Overlay */}
      <AnimatePresence>
        {gameState.phase === 'Scoring' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a3a1a] border border-white/10 p-8 rounded-[40px] max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                <Trophy className="text-white" size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Spiel Beendet!</h2>
              <p className="text-emerald-200/60 mb-8">Hier ist die Punkteverteilung:</p>
              
              <div className="space-y-4 mb-8">
                {gameState.players.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                    <span className="font-bold">{p.name}</span>
                    <span className="text-xl font-mono">{p.score} <span className="text-xs opacity-50">PKT</span></span>
                  </div>
                ))}
              </div>

              <button 
                onClick={startNewGame}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-lg font-bold shadow-lg transition-all active:scale-95"
              >
                Nochmal Spielen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
