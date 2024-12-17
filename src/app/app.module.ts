import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // Required for Angular Material
import { AppComponent } from './app.component';
import { GameModule } from './features/game/game.module';
import { MaterialModule } from './shared/material/material.module';
import { FlexLayoutModule } from '@angular/flex-layout'
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { MainMenu } from './components/main-menu/main-menu.component';

@NgModule({
  declarations: [
    AppComponent,
    MainMenu
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule, // Add this for Angular Material
    GameModule,
    MaterialModule,
    FlexLayoutModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
