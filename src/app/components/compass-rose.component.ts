import { Component, computed } from '@angular/core';
import { TurtleEngineService } from '../services/turtle-engine.service';

@Component({
  selector: 'app-compass-rose',
  standalone: true,
  template: `
    <div class="compass-container">
      <div class="compass-rose">
        <!-- Compass circle -->
        <svg viewBox="0 0 240 240" class="compass-svg">
          <!-- Background circle -->
          <circle cx="120" cy="120" r="100" fill="#f8f9fa" stroke="#333" stroke-width="2"/>
          
          <!-- Main direction lines -->
          <g class="cardinal-directions">
            <!-- North -->
            <line x1="120" y1="30" x2="120" y2="210" stroke="#333" stroke-width="2"/>
            <!-- East -->
            <line x1="30" y1="120" x2="210" y2="120" stroke="#333" stroke-width="2"/>
          </g>
          
          <!-- Degree markings -->
          <g class="degree-marks">
            @for (angle of degreeMarks; track angle) {
              <g [attr.transform]="'rotate(' + angle + ' 120 120)'">
                <line 
                  x1="120" 
                  y1="35" 
                  x2="120" 
                  [attr.y2]="angle % 45 === 0 ? 45 : (angle % 15 === 0 ? 40 : 38)"
                  stroke="#666" 
                  [attr.stroke-width]="angle % 45 === 0 ? 2 : 1"/>
              </g>
            }
          </g>
          
          <!-- Direction labels -->
          <g class="direction-labels">
            <!-- North -->
            <text x="120" y="15" text-anchor="middle" class="cardinal-label">N</text>
            <text x="120" y="5" text-anchor="middle" class="degree-label">0°</text>
            
            <!-- Northeast -->
            <text x="190" y="55" text-anchor="middle" class="intercardinal-label">NE</text>
            <text x="200" y="45" text-anchor="middle" class="degree-label">45°</text>
            
            <!-- East -->
            <text x="225" y="125" text-anchor="middle" class="cardinal-label">E</text>
            <text x="235" y="115" text-anchor="middle" class="degree-label">90°</text>
            
            <!-- Southeast -->
            <text x="190" y="195" text-anchor="middle" class="intercardinal-label">SE</text>
            <text x="200" y="205" text-anchor="middle" class="degree-label">135°</text>
            
            <!-- South -->
            <text x="120" y="235" text-anchor="middle" class="cardinal-label">S</text>
            <text x="120" y="245" text-anchor="middle" class="degree-label">180°</text>
            
            <!-- Southwest -->
            <text x="50" y="195" text-anchor="middle" class="intercardinal-label">SW</text>
            <text x="40" y="205" text-anchor="middle" class="degree-label">225°</text>
            
            <!-- West -->
            <text x="15" y="125" text-anchor="middle" class="cardinal-label">W</text>
            <text x="5" y="115" text-anchor="middle" class="degree-label">270°</text>
            
            <!-- Northwest -->
            <text x="50" y="55" text-anchor="middle" class="intercardinal-label">NW</text>
            <text x="40" y="45" text-anchor="middle" class="degree-label">315°</text>
          </g>
          
          <!-- Turtle direction indicator -->
          <g class="turtle-indicator" [attr.transform]="turtleIndicatorTransform()">
            <path 
              d="M 120 120 L 115 105 L 120 95 L 125 105 Z" 
              fill="#FF4444" 
              stroke="#CC0000" 
              stroke-width="1"/>
            <circle cx="120" cy="120" r="3" fill="#FF4444"/>
          </g>
          
          <!-- Center point -->
          <circle cx="120" cy="120" r="2" fill="#333"/>
        </svg>
        
        <!-- Current angle display -->
        <div class="angle-display">
          <div class="current-angle">{{ normalizedAngle() }}°</div>
          <div class="angle-label">Turtle Direction</div>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="compass-legend">
        <h4>🧭 Compass Guide</h4>
        <div class="legend-items">
          <div class="legend-item">
            <span class="color-box cardinal"></span>
            <span>Cardinal Directions (N, E, S, W)</span>
          </div>
          <div class="legend-item">
            <span class="color-box intercardinal"></span>
            <span>Intercardinal Directions (NE, SE, SW, NW)</span>
          </div>
          <div class="legend-item">
            <span class="turtle-arrow">▲</span>
            <span>Turtle's Current Direction</span>
          </div>
        </div>
        <div class="compass-tips">
          <p><strong>Remember:</strong></p>
          <ul>
            <li>0° points North (up)</li>
            <li>90° points East (right)</li>
            <li>RIGHT turns clockwise ↻</li>
            <li>LEFT turns counter-clockwise ↺</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .compass-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 500px;
      margin: 0 auto;
    }
    
    .compass-rose {
      position: relative;
      display: inline-block;
      margin-bottom: 1rem;
    }
    
    .compass-svg {
      width: 280px;
      height: 280px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    
    .cardinal-label {
      font-size: 18px;
      font-weight: bold;
      fill: #2196F3;
    }
    
    .intercardinal-label {
      font-size: 14px;
      font-weight: bold;
      fill: #4CAF50;
    }
    
    .degree-label {
      font-size: 14px;
      font-weight: bold;
      fill: #333;
    }
    
    .turtle-indicator {
      transition: transform 0.3s ease-in-out;
    }
    
    .angle-display {
      position: absolute;
      bottom: -45px;
      left: 50%;
      transform: translateX(-50%);
      background: #2196F3;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
    }
    
    .current-angle {
      font-size: 1.4rem;
      font-weight: bold;
      line-height: 1;
    }
    
    .angle-label {
      font-size: 0.7rem;
      opacity: 0.9;
      margin-top: 0.25rem;
    }
    
    .compass-legend {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      text-align: left;
    }
    
    .compass-legend h4 {
      margin: 0 0 0.75rem 0;
      color: #333;
      text-align: center;
    }
    
    .legend-items {
      margin-bottom: 1rem;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    
    .color-box {
      width: 16px;
      height: 16px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    
    .color-box.cardinal {
      background: #2196F3;
    }
    
    .color-box.intercardinal {
      background: #4CAF50;
    }
    
    .turtle-arrow {
      color: #FF4444;
      font-size: 1.2rem;
      width: 16px;
      text-align: center;
      flex-shrink: 0;
    }
    
    .compass-tips {
      border-top: 1px solid #ddd;
      padding-top: 0.75rem;
      font-size: 0.85rem;
    }
    
    .compass-tips p {
      margin: 0 0 0.5rem 0;
      font-weight: bold;
      color: #333;
    }
    
    .compass-tips ul {
      margin: 0;
      padding-left: 1.25rem;
      color: #666;
    }
    
    .compass-tips li {
      margin-bottom: 0.25rem;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .compass-container {
        padding: 1rem;
      }
      
      .compass-svg {
        width: 240px;
        height: 240px;
      }
      
      .angle-display {
        bottom: -40px;
      }
      
      .current-angle {
        font-size: 1.2rem;
      }
    }
    
    @media (max-width: 480px) {
      .compass-svg {
        width: 200px;
        height: 200px;
      }
      
      .cardinal-label {
        font-size: 14px;
      }
      
      .intercardinal-label {
        font-size: 12px;
      }
      
      .degree-label {
        font-size: 9px;
      }
    }
  `]
})
export class CompassRoseComponent {
  
  // Generate degree marks for the compass (every 15 degrees)
  readonly degreeMarks = Array.from({ length: 24 }, (_, i) => i * 15);
  
  // Computed values based on turtle state
  readonly normalizedAngle = computed(() => {
    const angle = this.turtleEngine.turtle().position.angle;
    return ((angle % 360) + 360) % 360; // Normalize to 0-359
  });
  
  readonly turtleIndicatorTransform = computed(() => {
    const angle = this.normalizedAngle();
    return `rotate(${angle} 120 120)`;
  });

  constructor(private turtleEngine: TurtleEngineService) {}
}