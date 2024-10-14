import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameBoardComponent } from '../../components/game-board/game-board.component';
import { PlayerComponent } from '../../components/player/player.component';
import { CardComponent } from '../../components/card/card.component';
import { MaterialModule } from '../../shared/material/material.module';

@NgModule({
  declarations: [
    GameBoardComponent,
    PlayerComponent,
    CardComponent
  ],
  imports: [
    CommonModule,
    MaterialModule // Import Angular Material here
  ],
  exports: [
    GameBoardComponent,
    PlayerComponent,
    CardComponent
  ]
})
export class GameModule { }
