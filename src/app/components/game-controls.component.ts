import { Component } from '@angular/core';
import { GameStateService } from '../services/game-state.service';
import { TurtleEngineService } from '../services/turtle-engine.service';

@Component({
  selector: 'app-game-controls',
  standalone: true,
  template: `
    <div class="game-controls">
      <div class="mode-selector">
        <h3>Game Mode</h3>
        <div class="mode-buttons">
          <button 
            (click)="setMode('creativity')"
            [class.active]="gameState.currentMode() === 'creativity'"
            class="mode-btn">
            🎨 Creative Mode
          </button>
          <button 
            (click)="setMode('challenge')"
            [class.active]="gameState.currentMode() === 'challenge'"
            class="mode-btn">
            🎯 Challenge Mode
          </button>
        </div>
      </div>

      @if (gameState.currentMode() === 'challenge') {
        <div class="level-selector">
          <h3>Levels</h3>
          <div class="levels-grid">
            @for (level of availableLevels; track level.id) {
              <button 
                (click)="loadLevel(level.id)"
                [class.active]="gameState.currentLevel()?.id === level.id"
                class="level-btn"
                [title]="level.description">
                {{ level.title }}
              </button>
            }
          </div>
        </div>

        @if (gameState.currentLevel(); as level) {
          <div class="level-info">
            <h4>{{ level.title }}</h4>
            <p class="level-description">{{ level.description }}</p>
            
            <div class="objectives">
              <h5>Objectives:</h5>
              @for (objective of level.objectives; track objective.description) {
                <div class="objective" [class.completed]="objective.completed">
                  <span class="objective-icon">{{ objective.completed ? '✅' : '🎯' }}</span>
                  <span class="objective-text">{{ objective.description }}</span>
                </div>
              }
            </div>

            @if (level.hints && level.hints.length > 0) {
              <details class="hints">
                <summary>💡 Hints</summary>
                <ul>
                  @for (hint of level.hints; track hint) {
                    <li>{{ hint }}</li>
                  }
                </ul>
              </details>
            }

            <div class="level-controls">
              <button 
                (click)="resetLevel()"
                class="btn btn-secondary">
                🔄 Reset Level
              </button>
            </div>
          </div>
        }
      }

      <div class="game-info">
        @if (gameState.currentMode() === 'challenge') {
          <div class="score">
            Score: {{ gameState.score() }}
          </div>
        }
        
        <div class="turtle-controls">
          <h4>Turtle Controls</h4>
          <div class="control-row">
            <label>Speed:</label>
            <input 
              type="range" 
              min="10" 
              max="1000" 
              step="10"
              [value]="turtleEngine.animationSpeed()"
              (input)="setAnimationSpeed($event)"
              class="speed-slider">
            <span>{{ turtleEngine.animationSpeed() }}ms</span>
          </div>
          
          @if (turtleEngine.isRunning()) {
            <button 
              (click)="stopExecution()"
              class="btn btn-danger">
              ⏹️ Stop
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-controls {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      min-width: 300px;
    }

    .mode-selector, .level-selector, .game-info {
      margin-bottom: 1.5rem;
    }

    .mode-selector h3, .level-selector h3, .game-info h4 {
      margin: 0 0 0.75rem 0;
      color: #333;
      font-size: 1.1rem;
    }

    .mode-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .mode-btn {
      padding: 0.75rem 1rem;
      border: 2px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }

    .mode-btn:hover {
      border-color: #4CAF50;
    }

    .mode-btn.active {
      border-color: #4CAF50;
      background: #e8f5e8;
    }

    .levels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.5rem;
    }

    .level-btn {
      padding: 0.5rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
      text-align: center;
    }

    .level-btn:hover {
      border-color: #2196F3;
      background: #f0f8ff;
    }

    .level-btn.active {
      border-color: #2196F3;
      background: #2196F3;
      color: white;
    }

    .level-info {
      background: #f8f9fa;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .level-info h4 {
      margin: 0 0 0.5rem 0;
      color: #2196F3;
    }

    .level-description {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .objectives h5 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 0.9rem;
    }

    .objective {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
      font-size: 0.85rem;
    }

    .objective.completed .objective-text {
      color: #4CAF50;
      text-decoration: line-through;
    }

    .hints {
      margin: 1rem 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
    }

    .hints summary {
      padding: 0.5rem;
      cursor: pointer;
      font-weight: bold;
      color: #666;
      background: #f8f9fa;
    }

    .hints ul {
      margin: 0.5rem 0;
      padding: 0.5rem 1.5rem;
    }

    .hints li {
      margin-bottom: 0.25rem;
      font-size: 0.8rem;
      color: #666;
    }

    .level-controls {
      margin-top: 1rem;
    }

    .score {
      font-weight: bold;
      font-size: 1.1rem;
      color: #4CAF50;
      margin-bottom: 1rem;
    }

    .turtle-controls {
      border-top: 1px solid #eee;
      padding-top: 1rem;
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .control-row label {
      min-width: 50px;
      color: #666;
    }

    .speed-slider {
      flex: 1;
      min-width: 100px;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
    }
  `]
})
export class GameControlsComponent {
  
  readonly availableLevels;

  constructor(
    protected readonly gameState: GameStateService,
    protected readonly turtleEngine: TurtleEngineService
  ) {
    this.availableLevels = this.gameState.getAvailableLevels();
  }

  setMode(mode: 'creativity' | 'challenge'): void {
    this.gameState.setMode(mode);
  }

  loadLevel(levelId: string): void {
    this.gameState.loadLevel(levelId);
  }

  resetLevel(): void {
    this.gameState.resetLevel();
  }

  setAnimationSpeed(event: Event): void {
    const target = event.target as HTMLInputElement;
    const speed = parseInt(target.value);
    this.turtleEngine.setAnimationSpeed(speed);
  }

  stopExecution(): void {
    this.turtleEngine.stopExecution();
  }
}