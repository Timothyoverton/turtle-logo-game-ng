import { Injectable, signal } from '@angular/core';

export interface SavedProgram {
  id: string;
  name: string;
  code: string;
  createdDate: Date;
  lastModified: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProgramStorageService {
  private readonly STORAGE_KEY = 'turtle-saved-programs';
  
  readonly savedPrograms = signal<SavedProgram[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  saveProgram(name: string, code: string): SavedProgram {
    const programs = this.savedPrograms();
    const existingIndex = programs.findIndex(p => p.name === name);
    const now = new Date();

    if (existingIndex >= 0) {
      // Update existing program
      const updatedProgram: SavedProgram = {
        ...programs[existingIndex],
        code,
        lastModified: now
      };
      programs[existingIndex] = updatedProgram;
      this.savedPrograms.set([...programs]);
      this.saveToStorage();
      return updatedProgram;
    } else {
      // Create new program
      const newProgram: SavedProgram = {
        id: this.generateId(),
        name,
        code,
        createdDate: now,
        lastModified: now
      };
      const updatedPrograms = [...programs, newProgram];
      this.savedPrograms.set(updatedPrograms);
      this.saveToStorage();
      return newProgram;
    }
  }

  loadProgram(id: string): SavedProgram | null {
    return this.savedPrograms().find(p => p.id === id) || null;
  }

  deleteProgram(id: string): boolean {
    const programs = this.savedPrograms();
    const filteredPrograms = programs.filter(p => p.id !== id);
    
    if (filteredPrograms.length !== programs.length) {
      this.savedPrograms.set(filteredPrograms);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  exportProgram(id: string): string | null {
    const program = this.loadProgram(id);
    if (!program) return null;

    const exportData = {
      name: program.name,
      code: program.code,
      exportDate: new Date().toISOString(),
      format: 'turtle-logo-program-v1'
    };

    return JSON.stringify(exportData, null, 2);
  }

  importProgram(jsonData: string): SavedProgram | null {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate format
      if (data.format !== 'turtle-logo-program-v1' || !data.name || !data.code) {
        throw new Error('Invalid program format');
      }

      // Generate unique name if needed
      let importName = data.name;
      const existing = this.savedPrograms().find(p => p.name === importName);
      if (existing) {
        importName = `${data.name} (imported)`;
      }

      return this.saveProgram(importName, data.code);
    } catch (error) {
      console.error('Failed to import program:', error);
      return null;
    }
  }

  exportAllPrograms(): string {
    const exportData = {
      programs: this.savedPrograms(),
      exportDate: new Date().toISOString(),
      format: 'turtle-logo-collection-v1'
    };

    return JSON.stringify(exportData, null, 2);
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const programs = JSON.parse(stored).map((p: any) => ({
          ...p,
          createdDate: new Date(p.createdDate),
          lastModified: new Date(p.lastModified)
        }));
        this.savedPrograms.set(programs);
      }
    } catch (error) {
      console.error('Failed to load programs from storage:', error);
      this.savedPrograms.set([]);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.savedPrograms()));
    } catch (error) {
      console.error('Failed to save programs to storage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }
}