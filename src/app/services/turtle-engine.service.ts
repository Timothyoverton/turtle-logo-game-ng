import { Injectable, signal } from '@angular/core';
import { TurtleState, TurtlePosition, DrawingInstruction, Command, Obstacle } from '../types/turtle.types';

@Injectable({
  providedIn: 'root'
})
export class TurtleEngineService {
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 600;
  private readonly CANVAS_CENTER_X = this.CANVAS_WIDTH / 2;
  private readonly CANVAS_CENTER_Y = this.CANVAS_HEIGHT / 2;

  // Reactive state using Angular signals
  readonly turtle = signal<TurtleState>({
    position: { x: this.CANVAS_CENTER_X, y: this.CANVAS_CENTER_Y, angle: 0 },
    penDown: true,
    color: '#00FF00',
    penSize: 2
  });

  readonly drawing = signal<DrawingInstruction[]>([]);
  readonly isRunning = signal(false);
  readonly currentCommandIndex = signal(0);
  readonly animationSpeed = signal(100); // ms between commands

  // Canvas dimensions
  readonly canvasWidth = this.CANVAS_WIDTH;
  readonly canvasHeight = this.CANVAS_HEIGHT;

  reset(startPosition?: TurtlePosition): void {
    const currentColor = this.turtle().color; // Preserve current color
    this.turtle.set({
      position: startPosition || { x: this.CANVAS_CENTER_X, y: this.CANVAS_CENTER_Y, angle: 0 },
      penDown: true,
      color: currentColor,
      penSize: 2
    });
    this.drawing.set([]);
    this.isRunning.set(false);
    this.currentCommandIndex.set(0);
  }

  setTurtleColor(color: string): void {
    this.turtle.update(turtle => ({ ...turtle, color }));
  }

  executeCommand(command: Command): boolean {
    const currentTurtle = this.turtle();
    let newTurtle = { ...currentTurtle };
    let newDrawing = [...this.drawing()];

    switch (command.type) {
      case 'FORWARD':
      case 'BACK':
        const distance = command.value || 0;
        const actualDistance = command.type === 'BACK' ? -distance : distance;
        const startPos = { x: newTurtle.position.x, y: newTurtle.position.y };
        
        // Calculate new position
        const radians = (newTurtle.position.angle * Math.PI) / 180;
        const newX = newTurtle.position.x + Math.cos(radians) * actualDistance;
        const newY = newTurtle.position.y - Math.sin(radians) * actualDistance; // Y inverted for screen coordinates
        
        const endPos = { x: newX, y: newY };
        
        // Check bounds
        if (this.isWithinBounds(endPos)) {
          newTurtle.position = { ...newTurtle.position, x: newX, y: newY };
          
          // Add drawing instruction if pen is down
          if (newTurtle.penDown) {
            newDrawing.push({
              type: 'line',
              from: startPos,
              to: endPos,
              color: newTurtle.color,
              penSize: newTurtle.penSize
            });
          } else {
            newDrawing.push({
              type: 'move',
              from: startPos,
              to: endPos,
              color: newTurtle.color,
              penSize: newTurtle.penSize
            });
          }
        } else {
          return false; // Collision with boundary
        }
        break;

      case 'LEFT':
        const leftAngle = command.value || 0;
        newTurtle.position.angle = (newTurtle.position.angle + leftAngle) % 360;
        break;

      case 'RIGHT':
        const rightAngle = command.value || 0;
        newTurtle.position.angle = (newTurtle.position.angle - rightAngle + 360) % 360;
        break;

      case 'PENUP':
        newTurtle.penDown = false;
        break;

      case 'PENDOWN':
        newTurtle.penDown = true;
        break;

      case 'CLEAR':
        newDrawing = [];
        break;

      case 'COL':
        const colorIndex = command.value || 0;
        newTurtle.color = this.getColorByIndex(Math.floor(colorIndex));
        break;
    }

    this.turtle.set(newTurtle);
    this.drawing.set(newDrawing);
    return true;
  }

  async executeProgram(commands: Command[], obstacles: Obstacle[] = []): Promise<boolean> {
    this.isRunning.set(true);
    this.currentCommandIndex.set(0);

    try {
      // Flatten all commands including REPEAT loops into a single execution queue
      const flattenedCommands = this.flattenCommands(commands);
      
      for (let i = 0; i < flattenedCommands.length; i++) {
        if (!this.isRunning()) break; // Allow stopping mid-execution
        
        this.currentCommandIndex.set(i);
        const command = flattenedCommands[i];
        
        // Check for collision before executing
        if (this.wouldCollideWithObstacle(command, obstacles)) {
          return false; // Collision detected
        }
        
        const success = this.executeCommand(command);
        if (!success) return false; // Boundary collision
        
        // Animation delay (much shorter for better performance)
        await this.delay(Math.max(1, this.animationSpeed() / 10));
      }
      
      return true;
    } finally {
      this.isRunning.set(false);
      this.currentCommandIndex.set(-1);
    }
  }

  private flattenCommands(commands: Command[]): Command[] {
    const flattened: Command[] = [];
    
    for (const command of commands) {
      if (command.type === 'REPEAT') {
        const repeatCount = command.value || 1;
        const repeatCommands = command.commands || [];
        
        // Recursively flatten the repeat commands and repeat them
        const flattenedRepeatCommands = this.flattenCommands(repeatCommands);
        for (let i = 0; i < repeatCount; i++) {
          flattened.push(...flattenedRepeatCommands);
        }
      } else {
        flattened.push(command);
      }
    }
    
    return flattened;
  }

  stopExecution(): void {
    this.isRunning.set(false);
  }

  setAnimationSpeed(speed: number): void {
    this.animationSpeed.set(Math.max(10, Math.min(1000, speed)));
  }

  checkCollisionWithObstacles(position: { x: number; y: number }, obstacles: Obstacle[]): boolean {
    return obstacles.some(obstacle => 
      position.x >= obstacle.x &&
      position.x <= obstacle.x + obstacle.width &&
      position.y >= obstacle.y &&
      position.y <= obstacle.y + obstacle.height
    );
  }

  private wouldCollideWithObstacle(command: Command, obstacles: Obstacle[]): boolean {
    if ((command.type !== 'FORWARD' && command.type !== 'BACK') || obstacles.length === 0) return false;
    
    const currentTurtle = this.turtle();
    const distance = command.value || 0;
    const actualDistance = command.type === 'BACK' ? -distance : distance;
    const radians = (currentTurtle.position.angle * Math.PI) / 180;
    const newX = currentTurtle.position.x + Math.cos(radians) * actualDistance;
    const newY = currentTurtle.position.y - Math.sin(radians) * actualDistance;
    
    return this.checkCollisionWithObstacles({ x: newX, y: newY }, obstacles);
  }

  private isWithinBounds(position: { x: number; y: number }): boolean {
    return position.x >= 0 && position.x <= this.CANVAS_WIDTH &&
           position.y >= 0 && position.y <= this.CANVAS_HEIGHT;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper methods for drawing calculations
  calculateDistance(from: { x: number; y: number }, to: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
  }

  calculateAngle(from: { x: number; y: number }, to: { x: number; y: number }): number {
    return Math.atan2(from.y - to.y, to.x - from.x) * 180 / Math.PI;
  }

  // Color palette for COL command (matches the color picker)
  private readonly colorPalette = [
    '#00FF00', // 0 - Bright Green (default)
    '#0066FF', // 1 - Blue
    '#FF3333', // 2 - Red
    '#FF8800', // 3 - Orange
    '#8833FF', // 4 - Purple
    '#FF33CC', // 5 - Pink
    '#FFDD00', // 6 - Yellow
    '#00FFFF', // 7 - Cyan
    '#FF00FF', // 8 - Magenta
    '#88FF00', // 9 - Lime
    '#003388', // 10 - Dark Blue
    '#880033', // 11 - Dark Red
    '#228833', // 12 - Forest Green
    '#8B4513', // 13 - Brown
    '#666666', // 14 - Gray
    '#000000'  // 15 - Black
  ];

  getColorByIndex(index: number): string {
    // Wrap around if index is out of bounds
    const safeIndex = ((index % this.colorPalette.length) + this.colorPalette.length) % this.colorPalette.length;
    return this.colorPalette[safeIndex];
  }

  getColorPalette(): Array<{ index: number; color: string; name: string }> {
    const names = [
      'Bright Green', 'Blue', 'Red', 'Orange', 'Purple', 'Pink',
      'Yellow', 'Cyan', 'Magenta', 'Lime', 'Dark Blue', 'Dark Red',
      'Forest Green', 'Brown', 'Gray', 'Black'
    ];
    
    return this.colorPalette.map((color, index) => ({
      index,
      color,
      name: names[index] || `Color ${index}`
    }));
  }
}