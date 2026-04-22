export type Suit = 'Eichel' | 'Gras' | 'Herz' | 'Schellen';
export type Rank = '7' | '8' | '9' | 'Unter' | 'Ober' | 'König' | '10' | 'Sau';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  points: number;
  image?: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  tricks: Card[][];
  score: number;
  isHuman: boolean;
}

export type GamePhase = 'Dealing' | 'Bidding' | 'Playing' | 'Scoring';

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  currentTrick: { playerIndex: number; card: Card }[];
  trumpSuit: Suit | 'None';
  gameType: 'Sauspiel' | 'Wenz' | 'Solo' | 'None';
  phase: GamePhase;
  tutorialStep: number;
  lastTrickWinnerIndex: number | null;
  lastTrickExplanation?: string;
  lastTrickTip?: string;
  declarerIndex: number | null; // Who called the game
  partnerIndex: number | null; // Partner in Sauspiel
}
