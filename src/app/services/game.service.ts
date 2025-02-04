import { Injectable } from '@angular/core';

interface Card {
  suit: string;
  value: string;
}

interface Player {
  name: string;
  number: number;
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
  private biddingTeam: number;
  private bidAmount: number;
  public teamPoints: { team1: number, team2: number };

  constructor() {
    this.teamPoints = { team1: 0, team2: 0 };
    this.biddingTeam = 1; // Assume team 1 starts as the bidding team
    this.bidAmount = 0;
  }

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
    this.players.push({ name: 'You', hand: [], isBot: false, number: 1 });  // Human player

    // Add bots in anti-clockwise order: Bot 1 (Right), Bot 2 (Top), Bot 3 (Left)
    this.players.push({ name: 'Player 2', hand: [], isBot: true, number: 2 });  // Right
    this.players.push({ name: 'Player 3', hand: [], isBot: true, number: 3 });  // Top
    this.players.push({ name: 'Player 4', hand: [], isBot: true, number: 4 });  // Left

    // Deal cards
    this.players.forEach(player => {
      player.hand = this.deck.splice(0, cardsPerPlayer);
    });
  }

  resetBidding() {
    this.currentBid = { points: 0, suit: '', player: null };  // Reset the bid at the start of each round
    this.bidAmount = 0;
  }

  updateBid(points: number, suit: string, player: Player) {
    this.currentBid = { points, suit, player };  // Update the current highest bid
    this.bidAmount = this.currentBid.points
    let playerNum = this.currentBid.player?.number;
    this.biddingTeam = (playerNum == 1 || playerNum == 3) ? 1 : 2;
  }

  getCurrentBid() {
    return this.currentBid;
  }

  getPlayers() {
    return this.players;
  }

  setKozi(suit: string | null) {
    this.kozi = suit; // Store selected kozi (trump suit)
  }

  getKozi(): string | null {
    return this.kozi;
  }

  setCurrentBid(points: any, suit: any, player: any) {
    this.currentBid = {
      points: points,
      suit: suit,
      player: player
    };
  }

  sortHand(hand: Card[]): Card[] {
    // Define suits grouped by color
    const blackSuits = ['spades', 'clubs'];
    const redSuits = ['hearts', 'diamonds'];

    // Get the unique suits present in the hand
    const suitsInHand = [...new Set(hand.map(card => card.suit))];

    // Separate available suits into black and red groups
    const availableBlacks = blackSuits.filter(suit => suitsInHand.includes(suit));
    const availableReds = redSuits.filter(suit => suitsInHand.includes(suit));

    // Strictly alternate suits
    let orderedSuits: string[] = [];
    const maxLen = Math.max(availableBlacks.length, availableReds.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < availableBlacks.length) orderedSuits.push(availableBlacks[i]);
      if (i < availableReds.length) orderedSuits.push(availableReds[i]);
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

  getLowestValueCard(cards: any[]): any {
    const valueOrder: any = { '7': 1, '8': 2, '9': 3, 'jack': 4, 'queen': 5, 'king': 6, '10': 7, 'ace': 8 };
    return cards.reduce((lowest, card) => (valueOrder[card.value] < valueOrder[lowest.value] ? card : lowest), cards[0]);
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

  getCardPoints(card: any): number {
    const value = card.value;
    const suit = card.suit;

    if (value === 'ace') return 11;
    if (value === '10') return 10;
    if (value === 'king') return 4;
    if (value === 'queen') return 3;

    if (value === 'jack') {
      return suit === this.kozi ? 20 : 2; // Kozi Jack is worth 20 points
    }

    if (value === '9') {
      return suit === this.kozi ? 14 : 0; // Kozi 9 is worth 14 points
    }

    return 0; // 8 and 7 have no points
  }

  storeRoundPoints(roundCards: any[], team1WonCards: any[], team2WonCards: any[], lastRoundWinner: any) {
    let team1RoundPoints = 0;
    let team2RoundPoints = 0;

    // Calculate points for each team's won cards
    for (const wonHands of team1WonCards) {
        for (const card of wonHands) {
            team1RoundPoints += this.getCardPoints(card);
        }
    }

    // Since total game points must be 162, calculate team2 points automatically
    team2RoundPoints = 162 - team1RoundPoints;

    // Identify which team won the last round
    const lastRoundWinnerTeam = this.isTeam1(lastRoundWinner) ? 'team1' : 'team2';

    // Add the extra 10 points for the last round winner
    if (lastRoundWinnerTeam === 'team1') {
        team1RoundPoints += 10;
        team2RoundPoints -= 10; // Adjust to maintain total 162 points
    } else {
        team2RoundPoints += 10;
        team1RoundPoints -= 10; // Adjust accordingly
    }

    const nonBiddingTeam = this.biddingTeam === 1 ? 'team2' : 'team1';
    const bid = this.bidAmount * 10;

    // Convert points to base-10 and floor by default
    let team1BasePoints = Math.floor(team1RoundPoints / 10);
    let team2BasePoints = Math.floor(team2RoundPoints / 10);

    // If the score is at least 127, round up instead of floor
    if (team1RoundPoints % 10 >= 7) {
        team1BasePoints += 1;
    }
    if (team2RoundPoints % 10 >= 7) {
        team2BasePoints += 1;
    }

    // Ensure total points remain exactly 16 by adjusting the higher-scoring team
    if (team1BasePoints + team2BasePoints < 16) {
        if (team1RoundPoints > team2RoundPoints) {
            team1BasePoints += 1;
        } else {
            team2BasePoints += 1;
        }
    }

    // Assign points based on bidding success
    if (this.biddingTeam === 1 && team1RoundPoints >= bid) {
        this.teamPoints.team1 += team1BasePoints + this.bidAmount;
        this.teamPoints.team2 += team2BasePoints;
    } else if (this.biddingTeam === 2 && team2RoundPoints >= bid) {
        this.teamPoints.team2 += team2BasePoints + this.bidAmount;
        this.teamPoints.team1 += team1BasePoints;
    } else {
        // If bidding team fails, non-bidding team gets full 16 + bid, bidding team gets 0
        this.teamPoints[nonBiddingTeam] += 16 + this.bidAmount;
    }
}

// Helper function to check if a player belongs to Team 1
isTeam1(player: any): boolean {
    return this.players.indexOf(player) === 0 || this.players.indexOf(player) === 2;
}



  isWinningCard(card: any, currentWinner: any): boolean {
    let actualCard = card.card;
    const cardOrder = ['7', '8', '9', 'jack', 'queen', 'king', '10', 'ace'];
    const koziCardOrder = ['7', '8', 'queen', 'king', '10', 'ace', '9', 'jack'];

    const cardValueIndex = cardOrder.indexOf(actualCard.value);
    const currentWinnerValueIndex = cardOrder.indexOf(currentWinner.card.value);
    const koziCardValueIndex = koziCardOrder.indexOf(actualCard.value);
    const koziCurrentWinnerValueIndex = koziCardOrder.indexOf(currentWinner.card.value);

    // If the new card is a kozi and the current winner is not, the new card wins
    if (actualCard.suit === this.kozi && currentWinner.card.suit !== this.kozi) {
      return true;
    }

    // If the current winner is a kozi and the new card is not, the current winner remains
    if (actualCard.suit !== this.kozi && currentWinner.card.suit === this.kozi) {
      return false;
    }

    // If both are of the same suit, compare based on strength order
    if (actualCard.suit === currentWinner.card.suit) {
      if (actualCard.suit == this.kozi) {
        return koziCardValueIndex > koziCurrentWinnerValueIndex;
      }
      else {
        return cardValueIndex > currentWinnerValueIndex;
      }

    }

    // If neither card is a kozi and they are of different suits, the current winner remains
    return false;
  }


}
