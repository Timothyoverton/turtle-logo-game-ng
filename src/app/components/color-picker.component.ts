import { Component, EventEmitter, Output, signal } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  template: `
    <div class="color-picker-container">
      <h4>🎨 Turtle Colors</h4>
      
      <!-- Preset Colors -->
      <div class="preset-colors">
        <div class="color-grid">
          @for (color of presetColors; track color.hex) {
            <button 
              class="color-button"
              [class.selected]="selectedColor() === color.hex"
              [style.background-color]="color.hex"
              [title]="color.name"
              (click)="selectColor(color.hex)">
              @if (selectedColor() === color.hex) {
                <span class="check-mark">✓</span>
              }
            </button>
          }
        </div>
      </div>
      
      <!-- Custom Color Input -->
      <div class="custom-color">
        <label for="color-input">Custom Color:</label>
        <div class="custom-color-input">
          <input 
            id="color-input"
            type="color" 
            [value]="selectedColor()"
            (input)="onCustomColorChange($event)"
            class="color-input">
          <span class="color-value">{{ selectedColor() }}</span>
        </div>
      </div>
      
      <!-- Color Preview -->
      <div class="color-preview">
        <div class="preview-label">Drawing Preview:</div>
        <div class="preview-line" [style.background-color]="selectedColor()"></div>
      </div>
    </div>
  `,
  styles: [`
    .color-picker-container {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-top: 1rem;
    }
    
    .color-picker-container h4 {
      margin: 0 0 1rem 0;
      color: #333;
      text-align: center;
    }
    
    .preset-colors {
      margin-bottom: 1rem;
    }
    
    .color-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.5rem;
      max-width: 300px;
      margin: 0 auto;
    }
    
    .color-button {
      width: 40px;
      height: 40px;
      border: 3px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .color-button:hover {
      transform: scale(1.1);
      border-color: #666;
    }
    
    .color-button.selected {
      border-color: #333;
      box-shadow: 0 0 0 2px #4CAF50;
    }
    
    .check-mark {
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
    }
    
    .custom-color {
      border-top: 1px solid #eee;
      padding-top: 1rem;
      margin-bottom: 1rem;
    }
    
    .custom-color label {
      display: block;
      font-weight: bold;
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    
    .custom-color-input {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .color-input {
      width: 50px;
      height: 40px;
      border: 2px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      background: none;
    }
    
    .color-input:hover {
      border-color: #4CAF50;
    }
    
    .color-value {
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      color: #666;
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    
    .color-preview {
      border-top: 1px solid #eee;
      padding-top: 1rem;
      text-align: center;
    }
    
    .preview-label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    
    .preview-line {
      height: 8px;
      border-radius: 4px;
      margin: 0 auto;
      max-width: 200px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    
    /* Responsive */
    @media (max-width: 480px) {
      .color-grid {
        grid-template-columns: repeat(5, 1fr);
      }
      
      .color-button {
        width: 35px;
        height: 35px;
      }
    }
  `]
})
export class ColorPickerComponent {
  @Output() colorChange = new EventEmitter<string>();
  
  selectedColor = signal('#00FF00'); // Default green
  
  readonly presetColors = [
    { name: 'Bright Green', hex: '#00FF00' },
    { name: 'Blue', hex: '#0066FF' },
    { name: 'Red', hex: '#FF3333' },
    { name: 'Orange', hex: '#FF8800' },
    { name: 'Purple', hex: '#8833FF' },
    { name: 'Pink', hex: '#FF33CC' },
    { name: 'Yellow', hex: '#FFDD00' },
    { name: 'Cyan', hex: '#00FFFF' },
    { name: 'Magenta', hex: '#FF00FF' },
    { name: 'Lime', hex: '#88FF00' },
    { name: 'Dark Blue', hex: '#003388' },
    { name: 'Dark Red', hex: '#880033' },
    { name: 'Forest Green', hex: '#228833' },
    { name: 'Brown', hex: '#8B4513' },
    { name: 'Gray', hex: '#666666' },
    { name: 'Black', hex: '#000000' }
  ];

  selectColor(color: string): void {
    this.selectedColor.set(color);
    this.colorChange.emit(color);
  }

  onCustomColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    this.selectedColor.set(color);
    this.colorChange.emit(color);
  }
}