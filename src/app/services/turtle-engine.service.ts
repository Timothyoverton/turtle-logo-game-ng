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
    this.turtle.set({
      position: startPosition || { x: this.CANVAS_CENTER_X, y: this.CANVAS_CENTER_Y, angle: 0 },
      penDown: true,
      color: '#00FF00',
      penSize: 2
    });
    this.drawing.set([]);
    this.isRunning.set(false);
    this.currentCommandIndex.set(0);
  }

  executeCommand(command: Command): boolean {
    const currentTurtle = this.turtle();
    let newTurtle = { ...currentTurtle };
    let newDrawing = [...this.drawing()];

    switch (command.type) {
      case 'FORWARD':
        const distance = command.value || 0;
        const startPos = { x: newTurtle.position.x, y: newTurtle.position.y };
        
        // Calculate new position
        const radians = (newTurtle.position.angle * Math.PI) / 180;
        const newX = newTurtle.position.x + Math.cos(radians) * distance;
        const newY = newTurtle.position.y - Math.sin(radians) * distance; // Y inverted for screen coordinates
        
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
    }

    this.turtle.set(newTurtle);
    this.drawing.set(newDrawing);
    return true;
  }

  async executeProgram(commands: Command[], obstacles: Obstacle[] = []): Promise<boolean> {
    this.isRunning.set(true);
    this.currentCommandIndex.set(0);

    try {
      for (let i = 0; i < commands.length; i++) {
        if (!this.isRunning()) break; // Allow stopping mid-execution
        
        this.currentCommandIndex.set(i);
        const command = commands[i];
        
        if (command.type === 'REPEAT') {
          const repeatCount = command.value || 1;
          const repeatCommands = command.commands || [];
          
          for (let j = 0; j < repeatCount; j++) {
            if (!this.isRunning()) break;
            
            const success = await this.executeProgram(repeatCommands, obstacles);
            if (!success) return false; // Collision or error
          }
        } else {
          // Check for collision before executing
          if (this.wouldCollideWithObstacle(command, obstacles)) {
            return false; // Collision detected
          }
          
          const success = this.executeCommand(command);
          if (!success) return false; // Boundary collision
        }
        
        // Animation delay
        await this.delay(this.animationSpeed());
      }
      
      return true;
    } finally {
      this.isRunning.set(false);
      this.currentCommandIndex.set(-1);
    }
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
    if (command.type !== 'FORWARD' || obstacles.length === 0) return false;
    
    const currentTurtle = this.turtle();
    const distance = command.value || 0;
    const radians = (currentTurtle.position.angle * Math.PI) / 180;
    const newX = currentTurtle.position.x + Math.cos(radians) * distance;
    const newY = currentTurtle.position.y - Math.sin(radians) * distance;
    
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
}