import React from 'react';
import { Card as CardType } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isPlayable?: boolean;
  isHidden?: boolean;
  className?: string;
}

const suitColors = {
  'Eichel': 'text-amber-900',
  'Gras': 'text-emerald-700',
  'Herz': 'text-red-600',
  'Schellen': 'text-amber-500',
};

const suitSymbols = {
  'Eichel': '🌰',
  'Gras': '🍃',
  'Herz': '❤️',
  'Schellen': '🔔',
};

export const Card: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  disabled, 
  isPlayable = true, 
  isHidden = false,
  className 
}) => {
  if (isHidden) {
    return (
      <div className={cn(
        "w-16 h-24 md:w-20 md:h-32 bg-amber-800 rounded-lg border-2 border-amber-900 shadow-md flex items-center justify-center",
        className
      )}>
        <div className="w-full h-full border-4 border-amber-700/30 rounded-md flex items-center justify-center">
          <div className="text-amber-600/20 text-4xl">🂠</div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || !isPlayable}
      className={cn(
        "w-16 h-24 md:w-20 md:h-32 bg-white rounded-lg border-2 shadow-md flex flex-col p-1 md:p-2 transition-all relative group",
        isPlayable ? "hover:-translate-y-2 cursor-pointer border-gray-300" : "opacity-60 grayscale-[0.5] border-gray-200",
        !isPlayable && !disabled && "cursor-not-allowed",
        className
      )}
    >
      <div className={cn("text-xs md:text-sm font-bold self-start", suitColors[card.suit])}>
        {card.rank}
      </div>
      <div className="flex-1 flex items-center justify-center text-2xl md:text-3xl">
        {suitSymbols[card.suit]}
      </div>
      <div className={cn("text-xs md:text-sm font-bold self-end rotate-180", suitColors[card.suit])}>
        {card.rank}
      </div>
      
      {isPlayable && (
        <div className="absolute inset-0 bg-blue-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
};
