import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';  // Import your game service

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent implements OnInit {

  players: any = [];
  gameMessage = '';
  isStarted = false;
  boardCards: any[] = [];  // Cards on the game board
  dropAllowed = false;
  roundNumber = 0; // Track the round number (max 8)
  team1Points = 0; // Points for Team 1
  team2Points = 0; // Points for Team 2
  winningScore = 301; // Winning score threshold

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    // Setup only, no dealing cards yet
  }

  startGame() {
    this.isStarted = true;
    this.roundNumber = 0; // Reset rounds
    this.boardCards = [];  // Clear board cards
    this.gameService.createDeck();
    this.gameService.shuffleDeck();
    this.gameService.dealCards(4, 8);  // Deal 8 cards each for 4 players
    this.players = this.gameService.getPlayers();  // Get initialized players

    this.animateDealingCards();  // Start card dealing
  }

  // When a card is dropped, we play it
  onCardDrop(card: any) {
    if (this.dropAllowed) {
      this.playCard(card);
    }
  }

  animateDealingCards() {
    const players = [
      this.players[0], // Bottom player (You)
      this.players[1], // Right player
      this.players[2], // Top player
      this.players[3], // Left player
    ];
  
    const cardSequence = [3, 2, 3]; // 3-2-3 dealing pattern
    const delayBetweenDeals = 200; // 500ms between each card deal
  
    let cardCount = 0; // To keep track of how many cards have been dealt
  
    const animateRound = (round: number) => {
      if (round >= cardSequence.length) return; // Stop when all rounds are done
  
      const numCards = cardSequence[round];
      for (let i = 0; i < players.length; i++) {
        setTimeout(() => {
          for (let j = 0; j < numCards; j++) {
            setTimeout(() => {
              const card = players[i].hand[j + cardCount];
              if (card) {
                card.dealt = true; // Mark the card as dealt to trigger the CSS animation
              }
            }, delayBetweenDeals * j); // Delay for each card
          }
        }, delayBetweenDeals * i * numCards); // Delay for each player's turn
      }
  
      // After the round is done, proceed to next round or sorting for the human player
      setTimeout(() => {
        cardCount += numCards; // Increment the cardCount to track dealt cards
        if (round === cardSequence.length - 1) {
          // After the final round of dealing, sort the bottom player's hand (You)
          this.players[0].hand = this.gameService.sortHand(this.players[0].hand); 
          this.startRound()
        }
        animateRound(round + 1);
      }, delayBetweenDeals * players.length * numCards);
    };
  
    animateRound(0); // Start animating from the first round
  }

  // Play the player's card and trigger bot turns
  playCard(card: any) {
    if (!this.dropAllowed) return; // Prevent dropping multiple cards

    // Play the player's card
    this.boardCards.push(card);
    this.players[0].hand = this.players[0].hand.filter((c: any) => c.value !== card.value || c.suit !== card.suit);
    this.gameMessage = `You played ${card.value} of ${card.suit}`;
    
    // Disable card dropping during bot turns
    this.dropAllowed = false;

    // Trigger bot turns sequentially
    this.playBotsTurn(1);
  }

  // Bot Turn Handling
  playBotsTurn(botIndex: number) {
    if (botIndex >= this.players.length) {
      // If all bots have played, determine the round winner and proceed
      this.determineRoundWinner();
      return;
    }

    // Get the bot's card and play it
    const bot = this.players[botIndex];
    const card = bot.hand.shift(); // Get the first card from the bot's hand
    this.boardCards.push(card);
    this.gameMessage = `${bot.name} played ${card.value} of ${card.suit}`;

    // Simulate delay before next bot plays
    setTimeout(() => {
      this.playBotsTurn(botIndex + 1); // Move to the next bot's turn
    }, 1000); // 1 second delay between bot moves
  }

  // Handle round winner determination (logic will be added)
  determineRoundWinner() {
    // Here you will implement the logic to determine the winning card
    const winningCard = this.gameService.determineWinningCard(this.boardCards);
    const winningPlayer = this.players.find((player: any) =>
      player.hand.some((card: any) => card.value === winningCard.value && card.suit === winningCard.suit)
    );
    
    this.gameMessage = `${winningPlayer.name} won the round with ${winningCard.value} of ${winningCard.suit}`;

    // Assign points to the winning team
    this.assignPoints(winningPlayer);

    // Check if the round has finished (8 rounds played)
    this.roundNumber++;
    if (this.roundNumber >= 8) {
      this.endGame();
    } else {
      // If not the final round, re-enable player to drop card for the next round
      this.boardCards = [];  // Clear board for the next round
      this.dropAllowed = true;
      this.gameMessage = "Your turn to play!";
    }
  }

  // Assign points based on which team won the round
  assignPoints(winningPlayer: any) {
    // Assuming Player 0 and 2 are on Team 1, and Player 1 and 3 are on Team 2
    if (winningPlayer === this.players[0] || winningPlayer === this.players[2]) {
      this.team1Points += 10;  // Assign 10 points to Team 1
    } else {
      this.team2Points += 10;  // Assign 10 points to Team 2
    }

    // Display updated points
    this.gameMessage += ` | Team 1: ${this.team1Points} points, Team 2: ${this.team2Points} points`;
  }

  // End game logic (after 8 rounds)
  endGame() {
    this.gameMessage = `End of game. Team 1: ${this.team1Points} points, Team 2: ${this.team2Points} points`;

    // Check if either team has reached the winning score
    if (this.team1Points >= this.winningScore) {
      this.gameMessage = "Team 1 wins the game!";
      this.isStarted = false;
    } else if (this.team2Points >= this.winningScore) {
      this.gameMessage = "Team 2 wins the game!";
      this.isStarted = false;
    } else {
      // Start a new game if no team has reached the winning score
      setTimeout(() => {
        this.startGame(); // Start the next game after a short delay
      }, 3000); // 3-second delay before starting the next game
    }
  }
  
  // Allow dragover to allow card dropping
  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  // Handle desktop drop
  onDrop(event: DragEvent) {
    event.preventDefault();
    const cardData = event.dataTransfer?.getData('text');
    if (cardData) {
      const card = JSON.parse(cardData);
      this.onCardDrop(card);
    }
  }

  startRound() {
    this.dropAllowed = true;
  }
}
