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
  suits = ['hearts', 'diamonds', 'spades', 'clubs'];  // Available suits for Kozi selection
  koziSelected = false; // Track if kozi is selected

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    // Setup only, no dealing cards yet
  }

  selectKozi(suit: string) {
    this.gameService.setKozi(suit); // Set kozi in the game service
    this.koziSelected = true; // Hide the kozi selection dialog
    this.startGame(); // Start the game after kozi is selected
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

  playBotsTurn(currentPlayerIndex: number) {
    // Check if all players have played (i.e., 4 players)
    if (this.boardCards.length >= this.players.length) {
      // If all players have played, determine the round winner and proceed
      this.determineRoundWinner();
      return;
    }
  
    const player = this.players[currentPlayerIndex];
  
    // For bots, let them choose and play a card
    if (player.isBot) {
      const card = this.botCardSelection(player);
      this.boardCards.push(card);
      this.gameMessage = `${player.name} played ${card.value} of ${card.suit}`;
  
      // Simulate delay before the next player plays
      setTimeout(() => {
        this.playBotsTurn((currentPlayerIndex + 1) % this.players.length); // Move to the next player
      }, 1000); // 1 second delay
    } else {
      // Allow the human player to play
      this.dropAllowed = true;  // Enable dropping a card for the human player
    }
  }
  
  
  botCardSelection(bot: any) {
    const leadSuit = this.boardCards.length > 0 ? this.boardCards[0].suit : null;
    const kozi = this.gameService.getKozi();
  
    const sameSuitCards = bot.hand.filter((card: any) => card.suit === leadSuit);
    if (sameSuitCards.length > 0) {
      return this.playCardFromBotHand(bot, sameSuitCards);
    }
  
    const koziCards = bot.hand.filter((card: any) => card.suit === kozi);
    if (koziCards.length > 0) {
      return this.playCardFromBotHand(bot, koziCards);
    }
  
    return this.playCardFromBotHand(bot, bot.hand);
  }
  
  determineRoundWinner() {
    const winningCard = this.gameService.determineWinningCard(this.boardCards);
    const winningPlayer = this.players.find((player: any) =>
      player.hand.some((card: any) => card.value === winningCard.value && card.suit === winningCard.suit)
    );
  
    // Add the winning hand to the winner's stack
    winningPlayer.winningHands = winningPlayer.winningHands || [];
    winningPlayer.winningHands.push([...this.boardCards]);  // Save the cards played in the round
  
    this.gameMessage = `${winningPlayer.name} won the round with ${winningCard.value} of ${winningCard.suit}`;
  
    // After determining the winner, reset for the next round
    this.boardCards = [];  // Clear the board cards for the next round
  
    // Start the next round with the winning player playing first
    this.startNextRound(winningPlayer);
  }
  
  startNextRound(winningPlayer: any) {
    // Find the index of the winning player and adjust the play order so that they start
    const winningPlayerIndex = this.players.indexOf(winningPlayer);
  
    // Set the play order with the winner first
    const playOrder = [
      this.players[winningPlayerIndex],
      this.players[(winningPlayerIndex + 1) % this.players.length],
      this.players[(winningPlayerIndex + 2) % this.players.length],
      this.players[(winningPlayerIndex + 3) % this.players.length]
    ];
  
    this.players = playOrder;  // Update the players array with the new play order
  
    // Start the next round with the new order, starting with the winner
    this.playBotsTurn(0);  // Start with the first player in the updated order
  }
  

  playCardFromBotHand(bot: any, validCards: any[]) {
    // Select the first valid card to play (you can customize this selection strategy)
    const selectedCard = validCards[0];
    
    // Remove the selected card from the bot's hand
    bot.hand = bot.hand.filter((card: any) => card !== selectedCard);
  
    return selectedCard;
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
