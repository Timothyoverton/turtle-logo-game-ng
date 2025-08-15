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
    
    
    .canvas-container:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  `]
})
export class TurtleCanvasComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  obstacles: Obstacle[] = [];
  

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

    // Draw turtle at current position
    this.drawTurtle(ctx);
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

  private drawTurtle(ctx: CanvasRenderingContext2D): void {
    const turtle = this.turtleEngine.turtle();
    const x = turtle.position.x;
    const y = turtle.position.y;
    const angle = turtle.position.angle;
    
    ctx.save();
    
    // Move to turtle position and rotate
    ctx.translate(x, y);
    // Rotate turtle to face current direction (negative for screen coordinates)
    ctx.rotate(-angle * Math.PI / 180); // Convert to radians, negative for screen coordinates
    
    // Draw turtle body (shell)
    ctx.fillStyle = '#228B22';
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 6, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw turtle head (pointing up - direction of movement)
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.ellipse(0, -8, 4, 3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw turtle eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-2, -8, 1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -8, 1, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw shell pattern
    ctx.strokeStyle = '#006400';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 4, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Shell cross pattern
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.lineTo(4, 2);
    ctx.moveTo(4, -2);
    ctx.lineTo(-4, 2);
    ctx.stroke();
    
    // Draw legs (adjusted for upward-facing turtle)
    ctx.fillStyle = '#32CD32';
    ctx.beginPath();
    ctx.arc(-6, -2, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -2, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-6, 2, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, 2, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
  }
}