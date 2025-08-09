import { Component, signal, ViewChild, effect } from '@angular/core';
import { TurtleCanvasComponent } from './components/turtle-canvas.component';
import { CommandInputComponent } from './components/command-input.component';
import { GameControlsComponent } from './components/game-controls.component';
import { TurtleEngineService } from './services/turtle-engine.service';
import { GameStateService } from './services/game-state.service';
import { ParsedProgram } from './types/turtle.types';

@Component({
  selector: 'app-root',
  imports: [TurtleCanvasComponent, CommandInputComponent, GameControlsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(TurtleCanvasComponent) canvasComponent!: TurtleCanvasComponent;
  
  readonly title = signal('Turtle Logo Game');

  constructor(
    private turtleEngine: TurtleEngineService,
    private gameState: GameStateService
  ) {
    // Effect to update canvas obstacles when level changes
    effect(() => {
      const obstacles = this.gameState.getCurrentLevelObstacles();
      if (this.canvasComponent) {
        this.canvasComponent.setObstacles(obstacles);
      }
    });
  }

  async onRunCommands(program: ParsedProgram): Promise<void> {
    const obstacles = this.gameState.getCurrentLevelObstacles();
    const success = await this.turtleEngine.executeProgram(program.commands, obstacles);
    
    if (!success) {
      // Handle collision - could show error message or reset turtle
      console.log('Collision detected!');
      if (this.gameState.currentLevel()) {
        // Reset turtle to start position for challenge mode
        this.turtleEngine.reset(this.gameState.currentLevel()!.startPosition);
      }
    } else {
      // Check if objectives are completed
      this.gameState.checkObjectiveCompletion();
    }
  }

  onStepCommands(program: ParsedProgram): void {
    // TODO: Implement step-by-step execution
    console.log('Step execution not yet implemented');
  }

  onClearCanvas(): void {
    this.turtleEngine.reset();
  }
}