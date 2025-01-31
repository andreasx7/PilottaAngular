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

  constructor() { }

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
    // Define suits grouped by color
    const blackSuits = ['spades', 'clubs'];
    const redSuits = ['hearts', 'diamonds'];

    // Get the unique suits present in the hand
    const suitsInHand = [...new Set(hand.map(card => card.suit))];

    // Create the alternated suit order dynamically
    let orderedSuits: string[] = [];
    const availableBlacks = blackSuits.filter(suit => suitsInHand.includes(suit));
    const availableReds = redSuits.filter(suit => suitsInHand.includes(suit));

    // Start with the first color available and alternate
    if (availableReds.length > 0) {
      // At least one red suit exists, so start with black
      while (availableBlacks.length || availableReds.length) {
        if (availableBlacks.length) orderedSuits.push(availableBlacks.shift()!);
        if (availableReds.length) orderedSuits.push(availableReds.shift()!);
      }
    } else {
      // No red suits, just keep the black suits in normal order
      orderedSuits = availableBlacks;
    }

    // Create a mapping of suits to their order dynamically
    const suitOrder = Object.fromEntries(orderedSuits.map((suit, index) => [suit, index + 1]));

    // Value order (reversed)
    const valueOrder: any = { 'ace': 8, 'king': 7, 'queen': 6, 'jack': 5, '10': 4, '9': 3, '8': 2, '7': 1 };

    return hand.sort((a, b) => {
      // Compare by suit order first
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      // If suits are the same, compare by value order
      return valueOrder[a.value] - valueOrder[b.value];
    });
  }

  shouldRaiseBid(hand: Card[], currentBid: { points: number; suit: string }): boolean {
    const bestSuit = this.evaluateBestSuit(hand);
    const handStrength = this.evaluateHandStrength(hand, bestSuit);
    const maxBid = this.calculateMaxBid(hand, bestSuit);

    // If the bot's max bid is lower than the current bid, it should pass
    if (maxBid <= currentBid.points) {
        return false;
    }

    // If the bot has a strong hand and the current bid isn't too high, it should raise
    return handStrength >= 10 && currentBid.points < maxBid;
}


calculateMaxBid(hand: Card[], bestSuit: string): number {
  let strength = 0;
  const valueOrder: any = { 'ace': 8, 'king': 7, 'queen': 6, 'jack': 5, '10': 4, '9': 3, '8': 2, '7': 1 };

  hand.forEach(card => {
      if (card.suit === bestSuit) {
          strength += valueOrder[card.value];
      }
  });

  // **New Scaling for Max Bid** (ensures bots don't bid excessively)
  if (strength >= 20) return 14; // Strongest hands → Max bid ~140
  if (strength >= 16) return 13; // Very strong hands → Max bid ~130
  if (strength >= 12) return 12; // Strong hand → Max bid ~120
  if (strength >= 10) return 11; // Decent hand → Max bid ~110
  return 9; // Weak hand → Should not bid more than ~90
}



evaluateBestSuit(hand: Card[]): string {
  const suitCount: Record<string, number> = { hearts: 0, spades: 0, diamonds: 0, clubs: 0 };

  hand.forEach(card => suitCount[card.suit]++);

  return Object.entries(suitCount).sort((a, b) => b[1] - a[1])[0][0]; // Suit with highest count
}


evaluateHandStrength(hand: Card[], bestSuit: string): number {
  let strength = 0;
  const valueOrder: any = { 'ace': 8, 'king': 7, 'queen': 6, 'jack': 5, '10': 4, '9': 3, '8': 2, '7': 1 };

  hand.forEach(card => {
      if (card.suit === bestSuit) {
          strength += valueOrder[card.value];
      }
  });

  return strength;
}



  calculatePoints() {

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
    const cardOrder = ['7', '8', '9', 'jack', 'queen', 'king', '10', 'ace'];
    const koziCardOrder = ['7', '8', 'queen', 'king', '10', 'ace', '9', 'jack'];
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
