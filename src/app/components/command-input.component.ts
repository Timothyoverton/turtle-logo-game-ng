import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommandParserService } from '../services/command-parser.service';
import { ParsedProgram } from '../types/turtle.types';

@Component({
  selector: 'app-command-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="command-input-container">
      <div class="input-header">
        <h3>Turtle Commands</h3>
        <div class="sample-programs">
          <label>Quick Start:</label>
          <select (change)="loadSample($event)" class="sample-select">
            <option value="">Choose a sample...</option>
            @for (sample of sampleProgramKeys; track sample) {
              <option [value]="sample">{{ sample }}</option>
            }
          </select>
        </div>
      </div>
      
      <div class="textarea-container">
        <textarea
          [(ngModel)]="commands"
          (input)="onCommandsChange()"
          placeholder="Enter turtle commands here...
Example:
FORWARD 100
RIGHT 90
REPEAT 4 [ FORWARD 50 RIGHT 90 ]"
          class="command-textarea"
          rows="10">
        </textarea>
        
        @if (errors().length > 0) {
          <div class="error-panel">
            <h4>Errors:</h4>
            @for (error of errors(); track error.message) {
              <div class="error-item">
                <span class="error-line">Line {{ error.line }}:</span>
                <span class="error-message">{{ error.message }}</span>
              </div>
            }
          </div>
        }
      </div>
      
      <div class="input-controls">
        <button 
          (click)="runProgram()" 
          [disabled]="!canRun()"
          class="btn btn-primary">
          🚀 Run
        </button>
        
        <button 
          (click)="stepProgram()" 
          [disabled]="!canRun()"
          class="btn btn-secondary">
          ⏯️ Step
        </button>
        
        <button 
          (click)="clearProgram()"
          class="btn btn-danger">
          🗑️ Clear
        </button>
      </div>
      
      <div class="help-panel">
        <details>
          <summary>📚 Command Help</summary>
          <div class="help-content">
            <div class="help-section">
              <strong>Movement:</strong>
              <ul>
                <li><code>FORWARD 100</code> - Move forward 100 pixels</li>
                <li><code>LEFT 90</code> - Turn left 90 degrees</li>
                <li><code>RIGHT 45</code> - Turn right 45 degrees</li>
              </ul>
            </div>
            <div class="help-section">
              <strong>Drawing:</strong>
              <ul>
                <li><code>PENUP</code> - Lift pen (stop drawing)</li>
                <li><code>PENDOWN</code> - Put pen down (start drawing)</li>
                <li><code>CLEAR</code> - Clear the canvas</li>
              </ul>
            </div>
            <div class="help-section">
              <strong>Loops:</strong>
              <ul>
                <li><code>REPEAT 4 [ FORWARD 50 RIGHT 90 ]</code> - Repeat commands</li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  `,
  styles: [`
    .command-input-container {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      min-width: 320px;
    }
    
    .input-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .input-header h3 {
      margin: 0;
      color: #333;
    }
    
    .sample-programs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    
    .sample-select {
      padding: 0.25rem 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    .textarea-container {
      position: relative;
      margin-bottom: 1rem;
    }
    
    .command-textarea {
      width: 100%;
      min-height: 200px;
      padding: 0.75rem;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      line-height: 1.4;
      resize: vertical;
      box-sizing: border-box;
    }
    
    .command-textarea:focus {
      outline: none;
      border-color: #4CAF50;
    }
    
    .error-panel {
      background: #ffebee;
      border: 1px solid #f44336;
      border-radius: 4px;
      padding: 0.75rem;
      margin-top: 0.5rem;
    }
    
    .error-panel h4 {
      margin: 0 0 0.5rem 0;
      color: #d32f2f;
      font-size: 0.9rem;
    }
    
    .error-item {
      margin-bottom: 0.25rem;
      font-size: 0.8rem;
    }
    
    .error-line {
      font-weight: bold;
      color: #d32f2f;
    }
    
    .error-message {
      color: #666;
      margin-left: 0.5rem;
    }
    
    .input-controls {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background: #4CAF50;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #45a049;
    }
    
    .btn-secondary {
      background: #2196F3;
      color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background: #1976D2;
    }
    
    .btn-danger {
      background: #f44336;
      color: white;
    }
    
    .btn-danger:hover:not(:disabled) {
      background: #d32f2f;
    }
    
    .help-panel {
      border-top: 1px solid #eee;
      padding-top: 1rem;
    }
    
    .help-panel summary {
      cursor: pointer;
      font-weight: bold;
      color: #666;
      padding: 0.5rem 0;
    }
    
    .help-content {
      padding: 0.5rem 0;
    }
    
    .help-section {
      margin-bottom: 1rem;
    }
    
    .help-section ul {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }
    
    .help-section li {
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }
    
    .help-section code {
      background: #f5f5f5;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
    }
  `]
})
export class CommandInputComponent {
  @Output() runCommands = new EventEmitter<ParsedProgram>();
  @Output() stepCommands = new EventEmitter<ParsedProgram>();
  @Output() clearCanvas = new EventEmitter<void>();

  commands = signal('');
  errors = signal<Array<{ message: string; line?: number }>>([]);
  samplePrograms: { [key: string]: string };
  sampleProgramKeys: string[];

  constructor(private parser: CommandParserService) {
    this.samplePrograms = this.parser.generateSamplePrograms();
    this.sampleProgramKeys = Object.keys(this.samplePrograms);
  }

  onCommandsChange(): void {
    const parsed = this.parser.parseCommands(this.commands());
    this.errors.set(parsed.errors);
  }

  loadSample(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const sampleName = select.value;
    if (sampleName && this.samplePrograms[sampleName]) {
      this.commands.set(this.samplePrograms[sampleName]);
      this.onCommandsChange();
    }
    select.value = ''; // Reset selection
  }

  runProgram(): void {
    const parsed = this.parser.parseCommands(this.commands());
    if (parsed.errors.length === 0) {
      this.runCommands.emit(parsed);
    }
  }

  stepProgram(): void {
    const parsed = this.parser.parseCommands(this.commands());
    if (parsed.errors.length === 0) {
      this.stepCommands.emit(parsed);
    }
  }

  clearProgram(): void {
    this.commands.set('');
    this.errors.set([]);
    this.clearCanvas.emit();
  }

  canRun(): boolean {
    return this.commands().trim().length > 0 && this.errors().length === 0;
  }
}