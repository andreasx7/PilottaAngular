import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';  // Import your game service
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-game-board',
  templateUrl: './game-board.component.html',
  styleUrls: ['./game-board.component.scss']
})
export class GameBoardComponent {

  players: any = [];
  currentPlayer: any = [];
  currentPLayerIndex: any = 0;
  startingPlayerIndex = 0;
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
  koziSelectionInProgress = false; // Indicates if kozi selection/bidding is in progress
  currentBidder: any = null; // Current player making the bid
  selectedBidPoints = 8; // Human's bid points
  selectedBidSuit = ''; // Human's selected kozi (suit)
  minBidPoints = 8; // Minimum bid
  passCount = 0; // Track consecutive passes
  bidPlaced = false; // Track if any bid was placed during the round
  currentBidderIndex = 0
  showOverlay = false;
  biddingForm: FormGroup = this._fb.group({}); //Init FormGroup
  bidPointsArray: number[] = [];
  lastRoundWinner = null;


  constructor(private gameService: GameService,
    private _fb: FormBuilder,
  ) { }

  get roundKozi() {
    return this.gameService.getKozi()
  }
  ngOnInit(): void {
    
  }

  // startGame() {
  //   this.isStarted = true;
  //   this.gameService.createDeck();
  //   this.gameService.shuffleDeck();
  //   this.gameService.dealCards(4, 8);  // Deal 8 cards each for 4 players
  //   this.players = this.gameService.getPlayers();  // Get initialized players
  //   this.animateDealingCards();  // Show card dealing animation

  //   // After cards are dealt, begin kozi selection and bidding
  //   setTimeout(() => {
  //     this.startKoziSelection();
  //   }, 2000);  // 2-second delay for animation
  // }

  startKoziSelection() {
    this.passCount = 0;
    this.currentPLayerIndex = 0;
    this.promptNextBid();  // Start bidding
  }

  startGame() {
    this.resetRoundVars();
    this.biddingForm = this.initBiddingForm()
    this.bidPointsArray = Array.from({ length: 43 }, (_, i) => i + 8);
    this.isStarted = true;
    this.dealCardsForNewRound();
  }

  toggleOverlay() {
    this.showOverlay = !this.showOverlay;
  }

  initBiddingForm(accident?: any) {
    let NewfbGroup = this._fb.group({
      bidPoints: [8, [Validators.required, Validators.min(8), Validators.max(50)]],  // Default to 8 points, min 8, max 50
      bidSuit: ['', Validators.required]  // Suit selection is required
    });

    return NewfbGroup;
  }

  dealCardsForNewRound() {
    this.gameService.createDeck();
    this.gameService.shuffleDeck();
    this.gameService.dealCards(4, 8);  // Deal 8 cards each to 4 players
    this.players = this.gameService.getPlayers();
    this.animateDealingCards();

    this.passCount = 0;
    this.currentPLayerIndex = 0 // todo change to next index from prev round
    this.currentBidderIndex = 0 // todo change to next index from prev round
    this.roundNumber = 0;
    this.currentPlayer = this.players[this.currentPLayerIndex]
    setTimeout(() => this.promptNextBid(), 2000);  // Delay to simulate card dealing animation
  }

  promptNextBid() {
    // Check if bidding should end (3 passes)
    if (this.passCount >= 3) {

      this.startGameWithFinalBid(); // Start the game with the highest bid
      return;
    }

    // Move to the next bidder
    this.currentBidder = this.players[this.currentBidderIndex];
    this.currentPlayer = this.players[0]; // Assuming first player is main player

    // Player's Turn
    if (!this.currentBidder.isBot) {
      this.gameMessage = `Your turn to bid. Current highest bid: ${this.gameService.getCurrentBid()?.points || 0} with ${this.gameService.getCurrentBid()?.suit || 'none'}`;
    } else {
      this.botBid(this.currentBidder); // Bot makes a bid
    }
  }


  placeBid() {
    if (this.biddingForm.valid) {
      const bidPoints = this.biddingForm.get('bidPoints')?.value;
      const bidSuit = this.biddingForm.get('bidSuit')?.value;

      if (this.gameService.getCurrentBid() != null) {
        if (bidPoints <= this.gameService.getCurrentBid()!.points) {
          this.gameMessage = "You must bid higher than the current bid!";
          return;
        }
      }


      this.updateBid(bidPoints, bidSuit, this.currentBidder);
      this.moveToNextBidder();
    } else {
      this.gameMessage = "Invalid bid. Please select a valid suit and points.";
    }
  }

  passBid() {
    this.passCount++;

    // If 3 passes happen, end the bidding phase
    if (this.passCount >= 3) {
      this.startGameWithFinalBid();
    } else {
      this.moveToNextBidder();
    }
  }



  botBid(bot: any) {
    setTimeout(() => {
      // If bidding is already over, stop
      if (this.passCount >= 3) {
        this.moveToNextBidder()
      };

      const currentBid = this.gameService.getCurrentBid();
      const botHand = bot.hand;
      const strongSuit = this.gameService.evaluateBestSuit(botHand);
      const handStrength = this.gameService.evaluateHandStrength(botHand, strongSuit);

      const maxReasonableBid = this.gameService.calculateMaxBid(botHand, strongSuit); // New function
      const bidIncrement = 1; // Bots should raise by small increments
      const minStartBid = 8; // The lowest possible bid

      if (!currentBid) {
        // Scenario 1: First bid (bot is the first bidder)
        if (handStrength >= 7) {
          this.updateBid(minStartBid, strongSuit, bot);
          this.passCount = 0;
          this.moveToNextBidder();
        } else {
          this.passBid();
        }
      } else {
        // Scenario 2: Responding to an existing bid
        const shouldCompete = this.gameService.shouldRaiseBid(botHand, currentBid);

        if (shouldCompete && currentBid.points + bidIncrement <= maxReasonableBid) {
          const newPoints = Math.min(currentBid.points + bidIncrement, maxReasonableBid);
          this.updateBid(newPoints, strongSuit, bot);
          this.passCount = 0;
          this.moveToNextBidder();
        } else {
          this.passBid();
        }
      }
    }, 1000);
  }



  moveToNextBidder() {
    // Stop bidding if 3 players have passed
    if (this.passCount >= 3) {
      this.startGameWithFinalBid();
      return;
    }

    this.currentBidderIndex = (this.currentBidderIndex + 1) % this.players.length;
    this.promptNextBid();
  }


  updateBid(points: number, suit: string, player: any) {
    this.gameService.updateBid(points, suit, player);
    this.gameMessage = `${player.name} bids ${points} points with ${suit}`;
  }

  startGameWithFinalBid() {
    const finalBid = this.gameService.getCurrentBid();
    if (finalBid == null) {
      this.restartRound()
    } else {
      this.koziSelectionInProgress = false;
      this.gameMessage = `${finalBid!.player!.name} won the bid with ${finalBid!.points} points and ${finalBid!.suit}`;
      this.gameService.setKozi(finalBid!.suit);
      this.startRound();
    }

  }

  restartRound() {
    // Restart the round if no bid was placed
    this.gameMessage = "Dealing new cards for the round...";
    setTimeout(() => {
      this.dealCardsForNewRound();  // Deal new cards and start bidding again
    }, 2000);  // Add delay for round restart
  }

  getPlayerIndex(uiIndex: number): number {
    return this.currentPLayerIndex + 1
  }



  animateDealingCards() {
  const players = [
    this.players[0], // Bottom player (You)
    this.players[1], // Right player
    this.players[2], // Top player
    this.players[3], // Left player
  ];

  const cardSequence = [3, 2, 3]; // 3-2-3 dealing pattern
  const delayBetweenDeals = 200;

  let cardCount = 0;
  let startingPlayerIndex = 0; // New! Track who starts each round

  const animateRound = (round: number) => {
    if (round >= cardSequence.length) return;

    const numCards = cardSequence[round];

    // Rotate players based on the starting player index
    const rotatedPlayers = [
      players[startingPlayerIndex % 4],
      players[(startingPlayerIndex + 1) % 4],
      players[(startingPlayerIndex + 2) % 4],
      players[(startingPlayerIndex + 3) % 4],
    ];

    for (let i = 0; i < rotatedPlayers.length; i++) {
      setTimeout(() => {
        for (let j = 0; j < numCards; j++) {
          setTimeout(() => {
            const player = rotatedPlayers[i];
            const card = player.hand[j + cardCount];
            if (card) {
              card.dealt = true;
            }
          }, delayBetweenDeals * j);
        }
      }, delayBetweenDeals * i * numCards);
    }

    setTimeout(() => {
      cardCount += numCards;
      if (round === cardSequence.length - 1) {
        this.players[0].hand = this.gameService.sortHand(this.players[0].hand);
        this.koziSelectionInProgress = true;
      }
      startingPlayerIndex = (startingPlayerIndex + 1) % 4; // Rotate!
      animateRound(round + 1);
    }, delayBetweenDeals * rotatedPlayers.length * numCards);
  };

  animateRound(0);
}


  // Play the player's card and trigger bot turns
  playCard(card: any, player: any) {
    if (!this.dropAllowed) return;

    // Play the player's card
    console.log(this.startingPlayerIndex)
    this.boardCards.push({ card, player })
    player.hand = player.hand.filter((c: any) => c.value !== card.value || c.suit !== card.suit);
    this.gameMessage = `You played ${card.value} of ${card.suit}`;

    // Disable card dropping during bot turns
    this.dropAllowed = false;
    let nextIndex = (this.currentPLayerIndex + 1) % this.players.length;

    // Trigger bot turns sequentially
    this.playBotsTurn(nextIndex);
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
      this.boardCards.push({ card, player })
      this.gameMessage = `${player.name} played ${card.value} of ${card.suit}`;

      // Simulate delay before the next player plays
      let index = (currentPlayerIndex + 1) % this.players.length;
      setTimeout(() => {
        this.currentPLayerIndex = index
        this.currentPlayer = this.players[currentPlayerIndex]
        this.playBotsTurn(this.currentPLayerIndex); // Move to the next player
      }, 1000); // 1 second delay
    } else {
      // Allow the human player to play
      // this.currentPLayerIndex = (currentPlayerIndex + 1) % this.players.length;
      // this.currentPlayer = this.players[this.currentPLayerIndex]
      this.dropAllowed = true;  // Enable dropping a card for the human player
    }
  }


  botCardSelection(bot: any) {
    const leadSuit = this.boardCards.length > 0 ? this.boardCards[0].card.suit : null;
    const kozi = this.gameService.getKozi();

    // 1️⃣ **If the bot has cards of the leading suit, it MUST play one**
    const sameSuitCards = bot.hand.filter((card: any) => card.suit === leadSuit);
    if (sameSuitCards.length > 0) {
      return this.playCardFromBotHand(bot, this.gameService.getLowestValueCard(sameSuitCards));
    }

    // 2️⃣ **If the bot has no leading suit cards, it MUST play a kozi card**
    const koziCards = bot.hand.filter((card: any) => card.suit === kozi);
    if (koziCards.length > 0) {
      return this.playCardFromBotHand(bot, this.gameService.getLowestValueCard(koziCards));
    }

    // 3️⃣ **If neither rule applies, play any other card**
    return this.playCardFromBotHand(bot, this.gameService.getLowestValueCard(bot.hand));
  }


  determineRoundWinner() {
    const winningCard = this.gameService.determineWinningCard(this.boardCards);

    // Find the player who played the winning card
    const winningPlayer: any = winningCard.player

    // Add the winning hand to the winner's stack
    winningPlayer.winningHands = winningPlayer.winningHands || [];

    const playedCards = this.boardCards.map(item => ({ ...item.card }));  // Clone the cards
    winningPlayer.winningHands.push(playedCards);
    this.gameMessage = `${winningPlayer.name} won the round with ${winningCard.card.value} of ${winningCard.card.suit}`;

    if (this.roundNumber === 8) {
      this.lastRoundWinner = winningPlayer;
  }

    setTimeout(() => {
      this.boardCards = []; // Start the next game after a short delay
      this.roundNumber++;
      if (this.roundNumber >= 8) {
        this.storeRoundPoints()
      }
      else {
        this.startNextRound(winningPlayer);
      }
    }, 3000);


    // Start the next round with the winning player playing first

  }

  storeRoundPoints() {
    let team1Cards: any[] = [];
    let team2Cards: any[] = [];

    // Collect won cards for each team
    this.players.forEach((player: any) => {
        if (player.winningHands) {
            if (this.isTeam1(player)) {
                team1Cards.push(...player.winningHands);
            } else {
                team2Cards.push(...player.winningHands);
            }
        }
    });

    // Call storeRoundPoints with the last round winner
    this.gameService.storeRoundPoints([], team1Cards, team2Cards, this.lastRoundWinner);

    // Reset for next round
    this.roundNumber = 0;
    this.team1Points = this.gameService.teamPoints.team1;
    this.team2Points = this.gameService.teamPoints.team2;

    this.gameMessage += ` | Team 1: ${this.team1Points} points, Team 2: ${this.team2Points} points`;

    // Check if the game has ended
    if (this.team1Points >= this.winningScore || this.team2Points >= this.winningScore) {
        this.endGame();
    } else {
        setTimeout(() => {
            this.startGame(); // Start new game round
        }, 3000);
    }
}


  isTeam1(player: any): boolean {
    return this.players.indexOf(player) === 0 || this.players.indexOf(player) === 2;
  }

  resetRoundVars() {
    this.gameService.setKozi(null);
  }


  startNextRound(winningPlayer: any) {
    
    // Find the index of the winning player and adjust the play order so that they start
    const winningPlayerIndex = this.players.indexOf(winningPlayer);

    this.startingPlayerIndex = winningPlayerIndex;
    this.currentPLayerIndex = winningPlayerIndex
    this.currentPlayer = this.players[this.currentPLayerIndex]


    // Start the next round with the new order, starting with the winner
    this.playBotsTurn(this.startingPlayerIndex);  // Start with the first player in the updated order
  }


  playCardFromBotHand(bot: any, selectedCard: any) {
    // Remove the selected card from the bot's hand
    bot.hand = bot.hand.filter((card: any) => !(card.suit === selectedCard.suit && card.value === selectedCard.value));

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
  onDrop(event: DragEvent, playerIndex: any) {
    event.preventDefault();
    const cardData = event.dataTransfer?.getData('text');
    if (cardData) {
      const card = JSON.parse(cardData);
      this.onCardDrop(card, this.players[playerIndex]);
    }
  }

  // When a card is dropped, we play it
  onCardDrop(card: any, player: any) {
    if (this.dropAllowed) {
      let human = player
      if (!player.isBot) {
        this.players.forEach((p: any) => {
          if (p.isBot == false) {
            human = p
          }
        });
      }
      this.playCard(card, human);
    }
  }

  startRound() {
    this.dropAllowed = true;
  }
}
