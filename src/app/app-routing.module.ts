import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { AppComponent } from './app.component';
import { MainMenu } from './components/main-menu/main-menu.component';

const routes: Routes = [
  { path: '', component: MainMenu },
  { path: 'new-game', component: GameBoardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
