import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgramStorageService, SavedProgram } from '../services/program-storage.service';

@Component({
  selector: 'app-save-load-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="save-load-panel">
      <h4>💾 Save & Load Programs</h4>
      
      <!-- Save Section -->
      <div class="save-section">
        <div class="save-input">
          <input 
            type="text" 
            [(ngModel)]="programName"
            placeholder="Enter program name..."
            class="name-input"
            (keyup.enter)="saveCurrentProgram()">
          <button 
            (click)="saveCurrentProgram()"
            [disabled]="!canSave()"
            class="btn btn-save">
            💾 Save
          </button>
        </div>
        @if (saveMessage()) {
          <div class="save-message" [class.success]="saveSuccess()">
            {{ saveMessage() }}
          </div>
        }
      </div>

      <!-- Load Section -->
      @if (storageService.savedPrograms().length > 0) {
        <div class="load-section">
          <h5>📂 Saved Programs</h5>
          <div class="programs-list">
            @for (program of storageService.savedPrograms(); track program.id) {
              <div class="program-item">
                <div class="program-info">
                  <div class="program-name">{{ program.name }}</div>
                  <div class="program-date">{{ formatDate(program.lastModified) }}</div>
                </div>
                <div class="program-actions">
                  <button 
                    (click)="loadProgram(program)"
                    class="btn btn-load"
                    title="Load this program">
                    📥
                  </button>
                  <button 
                    (click)="exportProgram(program)"
                    class="btn btn-export"
                    title="Export to file">
                    📤
                  </button>
                  <button 
                    (click)="deleteProgram(program)"
                    class="btn btn-delete"
                    title="Delete this program">
                    🗑️
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Import Section -->
      <div class="import-section">
        <h5>📥 Import Program</h5>
        <div class="import-controls">
          <input 
            type="file" 
            accept=".json,.txt"
            (change)="onFileSelected($event)"
            class="file-input"
            #fileInput>
          <button 
            (click)="fileInput.click()"
            class="btn btn-import">
            📁 Choose File
          </button>
        </div>
        @if (importMessage()) {
          <div class="import-message" [class.success]="importSuccess()">
            {{ importMessage() }}
          </div>
        }
      </div>

      <!-- Export All -->
      @if (storageService.savedPrograms().length > 0) {
        <div class="export-all-section">
          <button 
            (click)="exportAllPrograms()"
            class="btn btn-export-all">
            📦 Export All Programs
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .save-load-panel {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-top: 1rem;
    }

    .save-load-panel h4 {
      margin: 0 0 1rem 0;
      color: #333;
      text-align: center;
    }

    .save-load-panel h5 {
      margin: 1rem 0 0.5rem 0;
      color: #555;
      font-size: 0.9rem;
      border-top: 1px solid #eee;
      padding-top: 1rem;
    }

    .save-section {
      margin-bottom: 1rem;
    }

    .save-input {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .name-input {
      flex: 1;
      padding: 0.5rem;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .name-input:focus {
      outline: none;
      border-color: #4CAF50;
    }

    .save-message, .import-message {
      margin-top: 0.5rem;
      padding: 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      background: #ffebee;
      color: #d32f2f;
    }

    .save-message.success, .import-message.success {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .programs-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .program-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .program-info {
      flex: 1;
      min-width: 0;
    }

    .program-name {
      font-weight: bold;
      color: #333;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .program-date {
      font-size: 0.75rem;
      color: #666;
    }

    .program-actions {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .import-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .file-input {
      display: none;
    }

    .export-all-section {
      border-top: 1px solid #eee;
      padding-top: 1rem;
      margin-top: 1rem;
      text-align: center;
    }

    .btn {
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-save {
      background: #4CAF50;
      color: white;
    }

    .btn-save:hover:not(:disabled) {
      background: #45a049;
    }

    .btn-load {
      background: #2196F3;
      color: white;
      padding: 0.3rem 0.5rem;
    }

    .btn-load:hover {
      background: #1976D2;
    }

    .btn-export {
      background: #FF9800;
      color: white;
      padding: 0.3rem 0.5rem;
    }

    .btn-export:hover {
      background: #F57C00;
    }

    .btn-delete {
      background: #f44336;
      color: white;
      padding: 0.3rem 0.5rem;
    }

    .btn-delete:hover {
      background: #d32f2f;
    }

    .btn-import {
      background: #9C27B0;
      color: white;
    }

    .btn-import:hover {
      background: #7B1FA2;
    }

    .btn-export-all {
      background: #607D8B;
      color: white;
      padding: 0.6rem 1.2rem;
    }

    .btn-export-all:hover {
      background: #455A64;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .save-input {
        flex-direction: column;
        align-items: stretch;
      }

      .program-item {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }

      .program-actions {
        justify-content: center;
      }
    }
  `]
})
export class SaveLoadPanelComponent {
  @Input() currentCode = '';
  @Output() programLoaded = new EventEmitter<string>();

  programName = signal('');
  saveMessage = signal('');
  saveSuccess = signal(false);
  importMessage = signal('');
  importSuccess = signal(false);

  constructor(protected readonly storageService: ProgramStorageService) {}

  canSave(): boolean {
    return this.programName().trim().length > 0 && this.currentCode.trim().length > 0;
  }

  saveCurrentProgram(): void {
    if (!this.canSave()) return;

    try {
      const program = this.storageService.saveProgram(this.programName().trim(), this.currentCode);
      this.saveMessage.set(`✅ Saved "${program.name}" successfully!`);
      this.saveSuccess.set(true);
      this.programName.set('');
      
      // Clear message after 3 seconds
      setTimeout(() => this.saveMessage.set(''), 3000);
    } catch (error) {
      this.saveMessage.set('❌ Failed to save program');
      this.saveSuccess.set(false);
      setTimeout(() => this.saveMessage.set(''), 3000);
    }
  }

  loadProgram(program: SavedProgram): void {
    this.programLoaded.emit(program.code);
  }

  deleteProgram(program: SavedProgram): void {
    if (confirm(`Are you sure you want to delete "${program.name}"?`)) {
      this.storageService.deleteProgram(program.id);
    }
  }

  exportProgram(program: SavedProgram): void {
    const exportData = this.storageService.exportProgram(program.id);
    if (exportData) {
      this.downloadFile(`${program.name}.json`, exportData);
    }
  }

  exportAllPrograms(): void {
    const exportData = this.storageService.exportAllPrograms();
    const timestamp = new Date().toISOString().split('T')[0];
    this.downloadFile(`turtle-programs-${timestamp}.json`, exportData);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const imported = this.storageService.importProgram(content);
        if (imported) {
          this.importMessage.set(`✅ Imported "${imported.name}" successfully!`);
          this.importSuccess.set(true);
        } else {
          this.importMessage.set('❌ Invalid file format');
          this.importSuccess.set(false);
        }
      } catch (error) {
        this.importMessage.set('❌ Failed to import file');
        this.importSuccess.set(false);
      }
      
      // Clear message after 3 seconds
      setTimeout(() => this.importMessage.set(''), 3000);
      
      // Reset file input
      (event.target as HTMLInputElement).value = '';
    };
    reader.readAsText(file);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private downloadFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}