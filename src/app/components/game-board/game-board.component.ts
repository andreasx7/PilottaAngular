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

  constructor(private gameService: GameService) { }

  ngOnInit(): void {
    // Setup only, no dealing cards yet
  }

  startGame() {
    this.isStarted = true;
    this.gameService.createDeck();
    this.gameService.shuffleDeck();
    this.gameService.dealCards(4, 8);  // Deal 8 cards each for 4 players
    this.players = this.gameService.getPlayers();  // Get initialized players

     this.animateDealingCards();  // Start card dealing
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
          this.triggerSortForPlayer(0);
          this.startRound()
        }
        animateRound(round + 1);
      }, delayBetweenDeals * players.length * numCards);
    };
  
    animateRound(0); // Start animating from the first round
  }

  onCardDrop(card: any) {
    this.playCard(card);
  }

  // Handle card play logic
  playCard(card: any) {
    this.boardCards.push(card);  // Add card to the board
    this.players[0].hand = this.players[0].hand.filter((c: any) => c.value !== card.value || c.suit !== card.suit);  // Remove from hand
    this.gameMessage = `You played ${card.value} of ${card.suit}`;
  }

  // Allow dragover
  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  // Handle desktop drop
  onDrop(event: DragEvent) {
    event.preventDefault();
    const cardData = event.dataTransfer?.getData('text');
    if (cardData) {
      const card = JSON.parse(cardData);
      this.playCard(card);
    }
  }

  startRound(){

  }

  triggerSortForPlayer(playerIndex: number) {
    const playerComponent = document.querySelectorAll('app-player')[playerIndex];
    if (playerComponent) {
      const componentInstance = playerComponent as any; // Casting as any to access the component instance
      if (componentInstance.triggerSortAnimation) {
        componentInstance.triggerSortAnimation();  // Trigger the sorting animation in the PlayerComponent
      }
    }
  }
  
}
