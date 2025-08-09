import { Injectable, signal, computed } from '@angular/core';
import { GameState, Level, LevelObjective, Obstacle } from '../types/turtle.types';
import { TurtleEngineService } from './turtle-engine.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  
  readonly gameState = signal<GameState>({
    mode: 'creativity',
    turtle: {
      position: { x: 400, y: 300, angle: 0 },
      penDown: true,
      color: '#00FF00',
      penSize: 2
    },
    drawing: [],
    isRunning: false,
    isPaused: false,
    commandQueue: [],
    currentCommandIndex: -1,
    score: 0
  });

  readonly currentMode = computed(() => this.gameState().mode);
  readonly currentLevel = computed(() => this.gameState().currentLevel);
  readonly score = computed(() => this.gameState().score);

  private readonly levels: Level[] = [
    {
      id: 'tutorial-1',
      title: 'First Steps',
      description: 'Draw a simple line. Use FORWARD 100 to move the turtle forward.',
      obstacles: [],
      startPosition: { x: 200, y: 300, angle: 0 },
      objectives: [
        {
          type: 'draw_shape',
          description: 'Draw a line at least 50 pixels long',
          target: { minLength: 50 },
          completed: false
        }
      ],
      hints: [
        'Type "FORWARD 100" to move the turtle forward',
        'The turtle draws as it moves when the pen is down'
      ]
    },
    {
      id: 'tutorial-2',
      title: 'Making Turns',
      description: 'Learn to turn! Draw an "L" shape using FORWARD and RIGHT commands.',
      obstacles: [],
      startPosition: { x: 200, y: 200, angle: 0 },
      objectives: [
        {
          type: 'draw_shape',
          description: 'Create an L-shape with two lines',
          target: { shape: 'L' },
          completed: false
        }
      ],
      hints: [
        'Use FORWARD to move, then RIGHT 90 to turn',
        'Try: FORWARD 100, then RIGHT 90, then FORWARD 100'
      ]
    },
    {
      id: 'challenge-1',
      title: 'The Perfect Square',
      description: 'Draw a square using the REPEAT command. Can you do it in just one line?',
      obstacles: [],
      startPosition: { x: 300, y: 350, angle: 0 },
      objectives: [
        {
          type: 'draw_shape',
          description: 'Draw a perfect square',
          target: { shape: 'square', sides: 4 },
          completed: false
        }
      ],
      hints: [
        'A square has 4 equal sides and 4 right angles',
        'Use REPEAT 4 [ FORWARD 100 RIGHT 90 ]',
        'Each turn is 90 degrees for a square'
      ]
    },
    {
      id: 'challenge-2',
      title: 'Triangle Challenge',
      description: 'Draw an equilateral triangle. Remember: interior angles add up to 180°!',
      obstacles: [],
      startPosition: { x: 400, y: 400, angle: 0 },
      objectives: [
        {
          type: 'draw_shape',
          description: 'Draw an equilateral triangle',
          target: { shape: 'triangle', sides: 3 },
          completed: false
        }
      ],
      hints: [
        'A triangle has 3 equal sides',
        'Each exterior angle is 120 degrees',
        'Try REPEAT 3 [ FORWARD 100 RIGHT 120 ]'
      ]
    },
    {
      id: 'maze-1',
      title: 'Simple Maze',
      description: 'Navigate through the maze to reach the golden goal!',
      obstacles: [
        { x: 100, y: 100, width: 200, height: 20, type: 'wall' },
        { x: 100, y: 120, width: 20, height: 100, type: 'wall' },
        { x: 120, y: 200, width: 180, height: 20, type: 'wall' },
        { x: 280, y: 220, width: 20, height: 100, type: 'wall' },
        { x: 500, y: 150, width: 50, height: 50, type: 'goal' }
      ],
      startPosition: { x: 50, y: 150, angle: 0 },
      objectives: [
        {
          type: 'reach_goal',
          description: 'Reach the golden goal without hitting walls',
          target: { x: 525, y: 175 },
          completed: false
        }
      ],
      hints: [
        'Plan your path carefully',
        'Use PENUP to move without drawing',
        'Hitting a wall will reset your position'
      ]
    },
    {
      id: 'pattern-1',
      title: 'Flower Power',
      description: 'Create a beautiful flower pattern using nested loops!',
      obstacles: [],
      startPosition: { x: 400, y: 300, angle: 0 },
      objectives: [
        {
          type: 'draw_pattern',
          description: 'Draw a flower with 8 petals',
          target: { pattern: 'flower', petals: 8 },
          completed: false
        }
      ],
      hints: [
        'Each petal can be a small circle or oval',
        'Rotate between petals: 360 ÷ 8 = 45 degrees',
        'Try nested REPEAT commands'
      ]
    }
  ];

  constructor(private turtleEngine: TurtleEngineService) {}

  setMode(mode: 'creativity' | 'challenge'): void {
    this.gameState.update(state => ({ ...state, mode }));
    
    if (mode === 'creativity') {
      this.gameState.update(state => ({ ...state, currentLevel: undefined }));
      this.turtleEngine.reset();
    }
  }

  loadLevel(levelId: string): boolean {
    const level = this.levels.find(l => l.id === levelId);
    if (!level) return false;

    // Reset level objectives
    const resetLevel = {
      ...level,
      objectives: level.objectives.map(obj => ({ ...obj, completed: false }))
    };

    this.gameState.update(state => ({
      ...state,
      mode: 'challenge',
      currentLevel: resetLevel
    }));

    // Reset turtle to level start position
    this.turtleEngine.reset(level.startPosition);
    
    return true;
  }

  getAvailableLevels(): Level[] {
    return this.levels;
  }

  getCurrentLevelObstacles(): Obstacle[] {
    return this.currentLevel()?.obstacles || [];
  }

  checkObjectiveCompletion(): void {
    const level = this.currentLevel();
    if (!level) return;

    const turtle = this.turtleEngine.turtle();
    const drawing = this.turtleEngine.drawing();

    level.objectives.forEach(objective => {
      if (objective.completed) return;

      switch (objective.type) {
        case 'draw_shape':
          if (this.checkShapeObjective(objective, drawing)) {
            objective.completed = true;
            this.addScore(100);
          }
          break;
          
        case 'reach_goal':
          if (this.checkGoalObjective(objective, turtle.position)) {
            objective.completed = true;
            this.addScore(200);
          }
          break;
          
        case 'draw_pattern':
          if (this.checkPatternObjective(objective, drawing)) {
            objective.completed = true;
            this.addScore(300);
          }
          break;
      }
    });

    // Update game state with modified objectives
    this.gameState.update(state => ({
      ...state,
      currentLevel: level
    }));

    // Check if level is complete
    if (level.objectives.every(obj => obj.completed)) {
      this.completeLevel();
    }
  }

  private checkShapeObjective(objective: LevelObjective, drawing: any[]): boolean {
    const target = objective.target;
    
    if (target?.minLength) {
      const totalLength = drawing
        .filter(inst => inst.type === 'line')
        .reduce((sum, inst) => sum + this.turtleEngine.calculateDistance(inst.from, inst.to), 0);
      return totalLength >= target.minLength;
    }
    
    if (target?.shape === 'square') {
      return drawing.filter(inst => inst.type === 'line').length >= 4;
    }
    
    if (target?.shape === 'triangle') {
      return drawing.filter(inst => inst.type === 'line').length >= 3;
    }
    
    return false;
  }

  private checkGoalObjective(objective: LevelObjective, position: { x: number; y: number }): boolean {
    const target = objective.target;
    if (!target) return false;
    
    const distance = Math.sqrt(
      Math.pow(position.x - target.x, 2) + Math.pow(position.y - target.y, 2)
    );
    
    return distance < 30; // Within 30 pixels of goal
  }

  private checkPatternObjective(objective: LevelObjective, drawing: any[]): boolean {
    const target = objective.target;
    
    if (target?.pattern === 'flower') {
      return drawing.filter(inst => inst.type === 'line').length >= 50; // Approximate flower complexity
    }
    
    return false;
  }

  private addScore(points: number): void {
    this.gameState.update(state => ({
      ...state,
      score: state.score + points
    }));
  }

  private completeLevel(): void {
    console.log('Level completed!');
    // Could show celebration, unlock next level, etc.
  }

  resetLevel(): void {
    const level = this.currentLevel();
    if (level) {
      this.loadLevel(level.id);
    }
  }
}