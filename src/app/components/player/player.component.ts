import { Component, ElementRef, EventEmitter, Input, Output, Renderer2 } from '@angular/core';
import { Player } from './player-interface';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent {
  @Input() player!: Player;
  @Input() position!: string;  // Position (top, bottom, left, right)
  @Output() cardDropped = new EventEmitter<any>();  // Custom event for card drop
  isDealing = true
  isSorted: boolean = false;
  draggingCard: any = null;
  originalX = 0;
  originalY = 0;
  currentCardElement: any;

  constructor(private renderer: Renderer2, private elRef: ElementRef) {}
  
  get isBottomPlayer() {
    return this.position === 'bottom';
  }

  onDragStart(event: DragEvent, card: any) {
    event.dataTransfer?.setData('text/plain', JSON.stringify(card));
    this.draggingCard = card;
  }

  // For mobile touch drag (start)
  onTouchStart(event: TouchEvent, card: any) {
    event.preventDefault();
    this.draggingCard = card;
    const touch = event.touches[0];
    this.currentCardElement = this.elRef.nativeElement.querySelector(`[data-card-id="${card.value}-${card.suit}"]`);
    
    if (this.currentCardElement) {
      const cardRect = this.currentCardElement.getBoundingClientRect();
      this.originalX = touch.clientX - cardRect.left;
      this.originalY = touch.clientY - cardRect.top;

      this.renderer.setStyle(this.currentCardElement, 'position', 'absolute');
      this.renderer.setStyle(this.currentCardElement, 'z-index', '1000');
      this.renderer.setStyle(this.currentCardElement, 'left', `${cardRect.left}px`);
      this.renderer.setStyle(this.currentCardElement, 'top', `${cardRect.top}px`);
    }
  }

  // Handle touch move (dragging the card)
  onTouchMove(event: TouchEvent) {
    if (!this.draggingCard) return;

    const touch = event.touches[0];
    
    if (this.currentCardElement) {
      const x = touch.clientX - this.originalX;
      const y = touch.clientY - this.originalY;
      
      this.renderer.setStyle(this.currentCardElement, 'left', `${x}px`);
      this.renderer.setStyle(this.currentCardElement, 'top', `${y}px`);
    }
  }

  // Handle touch end (drop the card)
  onTouchEnd(event: TouchEvent) {
    if (this.draggingCard) {
      const touch = event.changedTouches[0];
      const dropZone = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Check if dropped on the game board
      if (dropZone && dropZone.classList.contains('game-board')) {
        this.cardDropped.emit(this.draggingCard);  // Emit the dropped card data
      } else {
        // If dropped outside the board, revert to original position
        this.renderer.setStyle(this.currentCardElement, 'left', 'initial');
        this.renderer.setStyle(this.currentCardElement, 'top', 'initial');
        this.renderer.setStyle(this.currentCardElement, 'position', 'relative');
      }
    }
    this.draggingCard = null;
    this.currentCardElement = null;
  }


  getFlexDirection() {
    // Determine the flex direction based on the player's position
    return (this.position === 'top' || this.position === 'bottom') ? 'row' : 'column';
  }

  getCardStyles(index: number) {
    const offset = index * 20; // Adjust the horizontal offset per card
    const rotation = index * 5; // Adjust the rotation per card
    return {
      left: `${offset}px`,
      transform: `rotate(${rotation}deg)`
    };
  }

  getCardClasses(card: any) {
    return {
      dealt: card.dealt,
      [card.dealtClass]: !!card.dealtClass // Dynamically add the dealtClass (e.g., 'to-left', 'to-right')
    };
  }
  getHandRotation() {
    switch (this.position) {
      case 'top':
        return 'rotate(180deg)';
      case 'left':
        return 'rotate(90deg)';
      case 'right':
        return 'rotate(-90deg)';
      default:
        return 'none';
    }
  }

  triggerSortAnimation() {
    this.isSorted = true;
  }

  
}