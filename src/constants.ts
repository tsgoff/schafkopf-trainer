import { Suit, Rank, Card } from './types';

export const SUITS: Suit[] = ['Eichel', 'Gras', 'Herz', 'Schellen'];
export const RANKS: Rank[] = ['7', '8', '9', 'Unter', 'Ober', 'König', '10', 'Sau'];

export const RANK_POINTS: Record<Rank, number> = {
  '7': 0,
  '8': 0,
  '9': 0,
  'Unter': 2,
  'Ober': 3,
  'König': 4,
  '10': 10,
  'Sau': 11,
};

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        points: RANK_POINTS[rank],
      });
    }
  }
  return deck;
};

export const TUTORIAL_STEPS = [
  {
    title: 'Willkommen beim Schafkopf!',
    content: 'Schafkopf ist ein traditionelles bayerisches Kartenspiel. In diesem Tutorial lernst du die Grundlagen anhand eines Demo-Spiels.',
    action: 'Klicke auf "Starten", um die Karten zu geben.',
  },
  {
    title: 'Das Geben',
    content: 'Jeder Spieler erhält 8 Karten. Beim Schafkopf spielen normalerweise 4 Spieler. In diesem Demo spielen wir ein "Sauspiel", bei dem Herz Trumpf ist.',
    action: 'Schau dir deine Karten an.',
  },
  {
    title: 'Die Trümpfe',
    content: 'In diesem Spiel sind alle Ober, alle Unter und alle Herz-Karten Trümpfe. Die Reihenfolge ist: Ober (Eichel > Gras > Herz > Schellen), dann Unter (Eichel > Gras > Herz > Schellen), dann Herz (Sau > 10 > K > 9 > 8 > 7).',
    action: 'Wähle eine Karte zum Ausspielen.',
  },
  {
    title: 'Farbzwang',
    content: 'Du musst die angespielte Farbe "bedienen". Wenn Eichel angespielt wird, musst du Eichel legen, sofern du eine hast. Wenn du keine hast, kannst du stechen (Trumpf) oder abwerfen.',
    action: 'Versuche, den Stich zu gewinnen!',
  },
  {
    title: 'Punkte zählen',
    content: 'Das Ziel ist es, mehr als 60 Punkte (Augen) zu sammeln. Die Karten haben folgende Werte: Sau (11), 10 (10), König (4), Ober (3), Unter (2). 7, 8 und 9 zählen 0 Punkte.',
    action: 'Spiele die Runde zu Ende.',
  },
  {
    title: 'Taktik-Tipp',
    content: 'Versuche, deine hohen Karten (Sauen, Zehner) in Stichen unterzubringen, die du oder dein Partner sicher gewinnen. Trümpfe sind wertvoll, um Stiche zu stehlen.',
    action: 'Viel Erfolg!',
  },
];
