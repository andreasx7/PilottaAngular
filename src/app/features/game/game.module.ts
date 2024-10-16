import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameBoardComponent } from '../../components/game-board/game-board.component';
import { PlayerComponent } from '../../components/player/player.component';
import { CardComponent } from '../../components/card/card.component';
import { MaterialModule } from '../../shared/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    GameBoardComponent,
    PlayerComponent,
    CardComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    GameBoardComponent,
    PlayerComponent,
    CardComponent
  ]
})
export class GameModule { }
