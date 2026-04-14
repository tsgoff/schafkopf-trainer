import { Card, Suit, Rank, GameState, Player } from '../types';

export const isTrump = (card: Card, trumpSuit: Suit | 'None'): boolean => {
  if (card.rank === 'Ober' || card.rank === 'Unter') return true;
  if (trumpSuit === 'Herz' && card.suit === 'Herz') return true;
  // In Wenz only Unter are trumps, but we'll stick to Sauspiel for the tutorial
  return false;
};

export const getCardPower = (card: Card, trumpSuit: Suit | 'None'): number => {
  // Higher number = stronger card
  if (card.rank === 'Ober') {
    const suitPower = { 'Eichel': 4, 'Gras': 3, 'Herz': 2, 'Schellen': 1 };
    return 1000 + suitPower[card.suit];
  }
  if (card.rank === 'Unter') {
    const suitPower = { 'Eichel': 4, 'Gras': 3, 'Herz': 2, 'Schellen': 1 };
    return 900 + suitPower[card.suit];
  }
  if (isTrump(card, trumpSuit)) {
    const rankPower = { 'Sau': 8, '10': 7, 'König': 6, '9': 5, '8': 4, '7': 3 };
    return 800 + rankPower[card.rank as keyof typeof rankPower];
  }
  
  const rankPower = { 'Sau': 8, '10': 7, 'König': 6, '9': 5, '8': 4, '7': 3 };
  return rankPower[card.rank as keyof typeof rankPower] || 0;
};

export const getTrickWinner = (trick: { playerIndex: number; card: Card }[], trumpSuit: Suit | 'None'): number => {
  if (trick.length === 0) return -1;
  
  const ledCard = trick[0].card;
  const ledIsTrump = isTrump(ledCard, trumpSuit);
  const ledSuit = ledCard.suit;
  
  let winnerIndex = trick[0].playerIndex;
  let bestCard = trick[0].card;
  let bestPower = getCardPower(bestCard, trumpSuit);
  
  for (let i = 1; i < trick.length; i++) {
    const currentCard = trick[i].card;
    const currentIsTrump = isTrump(currentCard, trumpSuit);
    const currentPower = getCardPower(currentCard, trumpSuit);
    
    if (currentIsTrump) {
      if (!isTrump(bestCard, trumpSuit) || currentPower > bestPower) {
        bestCard = currentCard;
        bestPower = currentPower;
        winnerIndex = trick[i].playerIndex;
      }
    } else if (!isTrump(bestCard, trumpSuit) && currentCard.suit === ledSuit) {
      if (currentPower > bestPower) {
        bestCard = currentCard;
        bestPower = currentPower;
        winnerIndex = trick[i].playerIndex;
      }
    }
  }
  
  return winnerIndex;
};

export const getPlayableCards = (hand: Card[], currentTrick: { playerIndex: number; card: Card }[], trumpSuit: Suit | 'None'): Card[] => {
  if (currentTrick.length === 0) return hand;
  
  const ledCard = currentTrick[0].card;
  const ledIsTrump = isTrump(ledCard, trumpSuit);
  
  if (ledIsTrump) {
    const trumpsInHand = hand.filter(c => isTrump(c, trumpSuit));
    if (trumpsInHand.length > 0) return trumpsInHand;
    return hand;
  } else {
    const suitInHand = hand.filter(c => c.suit === ledCard.suit && !isTrump(c, trumpSuit));
    if (suitInHand.length > 0) return suitInHand;
    return hand;
  }
};

export const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};
