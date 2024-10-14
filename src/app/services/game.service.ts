import { Injectable } from '@angular/core';

interface Card {
  suit: string;
  value: string;
}

interface Player {
  name: string;
  hand: Card[];
  isBot: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private suits = ['hearts', 'diamonds', 'spades', 'clubs'];
  private values = ['7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];
  private deck: Card[] = [];
  public players: Player[] = [];

  constructor() {}

  createDeck() {
    this.deck = [];
    for (const suit of this.suits) {
      for (const value of this.values) {
        this.deck.push({ value, suit });
      }
    }
    return this.deck;
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCards(playersCount: number, cardsPerPlayer: number) {
    this.players = [];
    
    // Ensure human player is always the first in the list (You)
    this.players.push({ name: 'You', hand: [], isBot: false });  // Human player
  
    // Add bots in anti-clockwise order: Bot 1 (Right), Bot 2 (Top), Bot 3 (Left)
    this.players.push({ name: 'Bot 1', hand: [], isBot: true });  // Right
    this.players.push({ name: 'Bot 2', hand: [], isBot: true });  // Top
    this.players.push({ name: 'Bot 3', hand: [], isBot: true });  // Left
  
    // Deal cards
    this.players.forEach(player => {
      player.hand = this.deck.splice(0, cardsPerPlayer);
    });
  }
  
  getPlayers() {
    return this.players;
  }

  sortHand(hand: Card[]): Card[] {
    const suitOrder:any = { 'hearts': 1, 'spades': 2, 'diamonds': 3, 'clubs': 4 };
    const valueOrder:any = { 'ace': 1, 'king': 2, 'queen': 3, 'jack': 4, '10': 5, '9': 6, '8': 7, '7': 8 };
  
    return hand.sort((a, b) => {
      // First, compare by suit order
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      // If suits are the same, compare by value order
      return valueOrder[a.value] - valueOrder[b.value];
    });
  }
  
}
