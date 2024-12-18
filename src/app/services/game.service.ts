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
  private kozi: string | null = null; // Store selected kozi (trump suit)
  public currentBid: { points: number, suit: string, player: Player | null } | null = null; // Store the current bid

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
    this.players.push({ name: 'Player 2', hand: [], isBot: true });  // Right
    this.players.push({ name: 'Player 3', hand: [], isBot: true });  // Top
    this.players.push({ name: 'Player 4', hand: [], isBot: true });  // Left
  
    // Deal cards
    this.players.forEach(player => {
      player.hand = this.deck.splice(0, cardsPerPlayer);
    });
  }

  resetBidding() {
    this.currentBid = { points: 0, suit: '', player: null };  // Reset the bid at the start of each round
  }

  updateBid(points: number, suit: string, player: Player) {
    this.currentBid = { points, suit, player };  // Update the current highest bid
  }
  
  getCurrentBid() {
    return this.currentBid;
  }
  
  getPlayers() {
    return this.players;
  }

  setKozi(suit: string) {
    this.kozi = suit; // Store selected kozi (trump suit)
  }

  getKozi(): string | null {
    return this.kozi;
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

  determineWinningCard(boardCards: any[]): any {
    if (boardCards.length === 0) {
      return null; // No cards played, so no winner
    }
  
    let winningCard = boardCards[0];
  
    // Logic to determine the actual winning card (replace this with your game logic)
    for (let card of boardCards) {
      if (this.isWinningCard(card, winningCard)) {
        winningCard = card;
      }
    }
  
    return winningCard;
  }

  isWinningCard(card: any, currentWinner: any): boolean {
    let actualCard = card.card
    const cardOrder = ['7', '8', '9', 'jack', 'queen', 'king','10', 'ace'];
    const koziCardOrder = ['7', '8', 'queen', 'king', '10', 'ace','9','jack'];
    const cardValueIndex = cardOrder.indexOf(actualCard.value);
    const currentWinnerValueIndex = cardOrder.indexOf(currentWinner.card.value);
    const koziCardValueIndex = koziCardOrder.indexOf(actualCard.value);
    const koziCurrentWinnerValueIndex = koziCardOrder.indexOf(currentWinner.card.value);

    // If both cards are of the kozi suit, apply kozi-specific rules
    if (actualCard.suit === this.kozi && currentWinner.card.suit !== this.kozi) {
      return koziCardValueIndex > koziCurrentWinnerValueIndex; // Higher value kozi wins
    } 
    else if (actualCard.suit === this.kozi && currentWinner.card.suit === this.kozi) {
      return cardValueIndex > currentWinnerValueIndex; // Higher value kozi wins
    }

    // If neither card is a kozi, use normal rules
    return cardValueIndex > currentWinnerValueIndex;
  }
  
}
