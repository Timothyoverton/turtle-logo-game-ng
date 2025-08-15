import { Component, ElementRef, ViewChild, AfterViewInit, computed, effect } from '@angular/core';
import { TurtleEngineService } from '../services/turtle-engine.service';
import { Obstacle } from '../types/turtle.types';

@Component({
  selector: 'app-turtle-canvas',
  standalone: true,
  template: `
    <div class="canvas-container">
      <canvas 
        #canvas
        [width]="turtleEngine.canvasWidth"
        [height]="turtleEngine.canvasHeight"
        class="turtle-canvas">
      </canvas>
      <div class="turtle-sprite" [style]="turtleStyle()">
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <!-- Turtle body -->
          <ellipse cx="12" cy="14" rx="8" ry="6" fill="#228B22" stroke="#006400" stroke-width="1"/>
          <!-- Turtle head -->
          <ellipse cx="12" cy="8" rx="4" ry="3" fill="#32CD32" stroke="#006400" stroke-width="1"/>
          <!-- Turtle eyes -->
          <circle cx="10" cy="7" r="1" fill="#000"/>
          <circle cx="14" cy="7" r="1" fill="#000"/>
          <!-- Shell pattern -->
          <ellipse cx="12" cy="14" rx="6" ry="4" fill="none" stroke="#006400" stroke-width="1"/>
          <line x1="8" y1="12" x2="16" y2="16" stroke="#006400" stroke-width="0.5"/>
          <line x1="16" y1="12" x2="8" y2="16" stroke="#006400" stroke-width="0.5"/>
          <!-- Legs -->
          <circle cx="6" cy="12" r="1.5" fill="#32CD32" stroke="#006400" stroke-width="0.5"/>
          <circle cx="18" cy="12" r="1.5" fill="#32CD32" stroke="#006400" stroke-width="0.5"/>
          <circle cx="6" cy="16" r="1.5" fill="#32CD32" stroke="#006400" stroke-width="0.5"/>
          <circle cx="18" cy="16" r="1.5" fill="#32CD32" stroke="#006400" stroke-width="0.5"/>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .canvas-container {
      position: relative;
      display: inline-block;
      border: 2px solid #333;
      border-radius: 8px;
      background: #f0f8ff;
      overflow: hidden;
    }
    
    .turtle-canvas {
      display: block;
      cursor: crosshair;
    }
    
    .turtle-sprite {
      position: absolute;
      width: 24px;
      height: 24px;
      transform-origin: center center;
      pointer-events: none;
      transition: all 0.1s ease-in-out;
      z-index: 10;
      filter: drop-shadow(0 0 2px rgba(255,255,255,0.8));
    }
    
    .canvas-container:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  `]
})
export class TurtleCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  obstacles: Obstacle[] = [];
  
  // Computed style for turtle position and rotation
  readonly turtleStyle = computed(() => {
    const turtle = this.turtleEngine.turtle();
    return {
      'left.px': turtle.position.x - 12, // Center the emoji
      'top.px': turtle.position.y - 12,
      'transform': `rotate(${-turtle.position.angle}deg)`, // Negative for correct screen rotation
    };
  });

  constructor(protected readonly turtleEngine: TurtleEngineService) {
    // Effect to redraw canvas when drawing changes
    effect(() => {
      this.drawCanvas();
    });
  }

  ngAfterViewInit(): void {
    this.setupCanvas();
    this.drawCanvas();
  }

  setObstacles(obstacles: Obstacle[]): void {
    this.obstacles = obstacles;
    this.drawCanvas();
  }

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI support
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  private drawCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    this.drawGrid(ctx);
    
    // Draw obstacles
    this.drawObstacles(ctx);
    
    // Draw all the lines from the drawing instructions
    const drawing = this.turtleEngine.drawing();
    drawing.forEach(instruction => {
      if (instruction.type === 'line') {
        this.drawLine(ctx, instruction.from, instruction.to, instruction.color, instruction.penSize);
      }
    });

    // Draw center point
    this.drawCenter(ctx);
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const gridSize = 50;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical lines
    for (let x = 0; x <= this.turtleEngine.canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.turtleEngine.canvasHeight);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.turtleEngine.canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.turtleEngine.canvasWidth, y);
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset line dash
  }

  private drawObstacles(ctx: CanvasRenderingContext2D): void {
    this.obstacles.forEach(obstacle => {
      ctx.save();
      
      switch (obstacle.type) {
        case 'wall':
          ctx.fillStyle = '#8B4513';
          ctx.strokeStyle = '#654321';
          break;
        case 'goal':
          ctx.fillStyle = '#FFD700';
          ctx.strokeStyle = '#FFA500';
          break;
        case 'hazard':
          ctx.fillStyle = '#FF6B6B';
          ctx.strokeStyle = '#FF4444';
          break;
      }
      
      ctx.lineWidth = 2;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      
      ctx.restore();
    });
  }

  private drawLine(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    penSize: number
  ): void {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    
    ctx.restore();
  }

  private drawCenter(ctx: CanvasRenderingContext2D): void {
    const centerX = this.turtleEngine.canvasWidth / 2;
    const centerY = this.turtleEngine.canvasHeight / 2;
    
    ctx.save();
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}