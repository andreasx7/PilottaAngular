import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input() card: any;

  getCardImageUrl() {
    // Construct the path to the image dynamically based on the card's value and suit
    const value = this.card.value.toLowerCase();  // Example: '7'
    const suit = this.card.suit.toLowerCase();    // Example: 'hearts'
    return `assets/cards/${value}_of_${suit}.png`;  // Example: 'assets/cards/7_of_hearts.png'
  }
}
