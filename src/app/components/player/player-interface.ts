export interface Card {
        suit: string;
        value: string;
        dealt: boolean;
    }

export interface Player {
    name: string;
    hand: Card[];
    isBot: boolean;
  }
  