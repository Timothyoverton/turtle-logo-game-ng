import { Injectable } from '@angular/core';
import { Command, ParsedProgram, ParseError } from '../types/turtle.types';

@Injectable({
  providedIn: 'root'
})
export class CommandParserService {

  parseCommands(input: string): ParsedProgram {
    const commands: Command[] = [];
    const errors: ParseError[] = [];
    
    try {
      // Normalize input and handle multi-line REPEAT commands
      const normalizedInput = this.normalizeInput(input);
      const tokens = this.tokenize(normalizedInput);
      const parsed = this.parseTokens(tokens);
      
      return {
        commands: parsed.commands,
        errors: parsed.errors
      };
    } catch (error) {
      errors.push({
        message: `Unexpected parsing error: ${error}`,
        line: 1
      });
      return { commands, errors };
    }
  }

  private normalizeInput(input: string): string {
    // Remove comments (both # and ;) and normalize whitespace
    return input
      .split('\n')
      .map(line => {
        // Remove comments that start with # or ;
        return line.replace(/[#;].*$/, '').trim();
      })
      .filter(line => line.length > 0) // Remove empty lines
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toUpperCase();
  }

  private tokenize(input: string): string[] {
    // Split into tokens while preserving brackets and handling comments
    const tokens: string[] = [];
    let current = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
      // Skip everything after ; or # (comments)
      if (char === ';' || char === '#') {
        if (current.trim()) {
          tokens.push(...current.trim().split(/\s+/));
          current = '';
        }
        // Skip to end of line or string
        while (i < input.length && input[i] !== '\n') {
          i++;
        }
        continue;
      }
      
      if (char === '[' || char === ']') {
        if (current.trim()) {
          tokens.push(...current.trim().split(/\s+/));
          current = '';
        }
        tokens.push(char);
      } else if (char === ' ') {
        if (current.trim()) {
          tokens.push(current.trim());
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      tokens.push(current.trim());
    }
    
    return tokens.filter(token => token.length > 0);
  }

  private parseTokens(tokens: string[]): ParsedProgram {
    const commands: Command[] = [];
    const errors: ParseError[] = [];
    
    let i = 0;
    while (i < tokens.length) {
      try {
        const result = this.parseCommand(tokens, i);
        if (result.error) {
          errors.push({ message: result.error, line: 1 });
        } else if (result.command) {
          commands.push(result.command);
        }
        i = result.nextIndex;
      } catch (error) {
        errors.push({ message: `Error parsing token '${tokens[i]}': ${error}`, line: 1 });
        i++;
      }
    }
    
    return { commands, errors };
  }

  private parseCommand(tokens: string[], startIndex: number): { 
    command?: Command, 
    error?: string, 
    nextIndex: number 
  } {
    if (startIndex >= tokens.length) {
      return { nextIndex: startIndex };
    }

    const token = tokens[startIndex];

    switch (token) {
      case 'FORWARD':
      case 'FD':
        return this.parseMovementCommand('FORWARD', tokens, startIndex);
        
      case 'BACK':
      case 'BK':
        return this.parseMovementCommand('BACK', tokens, startIndex);
        
      case 'LEFT':
      case 'LT':
        return this.parseMovementCommand('LEFT', tokens, startIndex);
        
      case 'RIGHT':
      case 'RT':
        return this.parseMovementCommand('RIGHT', tokens, startIndex);
        
      case 'PENUP':
      case 'PU':
        return { command: { type: 'PENUP' }, nextIndex: startIndex + 1 };
        
      case 'PENDOWN':
      case 'PD':
        return { command: { type: 'PENDOWN' }, nextIndex: startIndex + 1 };
        
      case 'CLEAR':
        return { command: { type: 'CLEAR' }, nextIndex: startIndex + 1 };
        
      case 'COL':
      case 'COLOR':
        return this.parseMovementCommand('COL', tokens, startIndex);
        
      case 'REPEAT':
        return this.parseRepeatCommand(tokens, startIndex);
        
      default:
        return { 
          error: `Unknown command: ${token}`, 
          nextIndex: startIndex + 1 
        };
    }
  }

  private parseMovementCommand(
    type: 'FORWARD' | 'LEFT' | 'RIGHT' | 'BACK' | 'COL', 
    tokens: string[], 
    startIndex: number
  ): { command?: Command, error?: string, nextIndex: number } {
    if (startIndex + 1 >= tokens.length) {
      return { 
        error: `${type} command requires a number`, 
        nextIndex: startIndex + 1 
      };
    }

    const valueToken = tokens[startIndex + 1];
    const value = this.parseNumber(valueToken);
    
    if (value === null) {
      return { 
        error: `${type} command requires a valid number, got '${valueToken}'`, 
        nextIndex: startIndex + 2 
      };
    }

    return { 
      command: { type, value }, 
      nextIndex: startIndex + 2 
    };
  }

  private parseRepeatCommand(tokens: string[], startIndex: number): {
    command?: Command,
    error?: string,
    nextIndex: number
  } {
    // REPEAT n [ commands ]
    if (startIndex + 2 >= tokens.length) {
      return {
        error: 'REPEAT command requires: REPEAT n [ commands ]',
        nextIndex: startIndex + 1
      };
    }

    const countToken = tokens[startIndex + 1];
    const repeatCount = this.parseNumber(countToken);
    
    if (repeatCount === null || repeatCount <= 0 || repeatCount > 1000) {
      return {
        error: 'REPEAT count must be a number between 1 and 1000',
        nextIndex: startIndex + 2
      };
    }

    // Find opening bracket
    if (tokens[startIndex + 2] !== '[') {
      return {
        error: 'REPEAT command requires opening bracket [',
        nextIndex: startIndex + 3
      };
    }

    // Find matching closing bracket
    let bracketCount = 0;
    let closeIndex = -1;
    
    for (let i = startIndex + 2; i < tokens.length; i++) {
      if (tokens[i] === '[') {
        bracketCount++;
      } else if (tokens[i] === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          closeIndex = i;
          break;
        }
      }
    }

    if (closeIndex === -1) {
      return {
        error: 'REPEAT command missing closing bracket ]',
        nextIndex: tokens.length
      };
    }

    // Extract tokens between brackets
    const innerTokens = tokens.slice(startIndex + 3, closeIndex);
    
    if (innerTokens.length === 0) {
      return {
        error: 'REPEAT command cannot be empty',
        nextIndex: closeIndex + 1
      };
    }

    // Parse inner commands
    const innerParsed = this.parseTokens(innerTokens);
    
    if (innerParsed.errors.length > 0) {
      return {
        error: `Error in REPEAT commands: ${innerParsed.errors[0].message}`,
        nextIndex: closeIndex + 1
      };
    }

    return {
      command: {
        type: 'REPEAT',
        value: repeatCount,
        commands: innerParsed.commands
      },
      nextIndex: closeIndex + 1
    };
  }

  private parseNumber(token: string): number | null {
    if (!token) return null;
    const num = parseFloat(token);
    return isNaN(num) ? null : num;
  }

  // Helper method to generate sample programs for kids
  generateSamplePrograms(): { [key: string]: string } {
    return {
      'Square': 'REPEAT 4 [ FORWARD 100 RIGHT 90 ]',
      'Triangle': 'REPEAT 3 [ FORWARD 100 RIGHT 120 ]',
      'Circle': 'REPEAT 36 [ FORWARD 10 RIGHT 10 ]',
      'Star': 'REPEAT 5 [ FORWARD 100 RIGHT 144 ]',
      'Spiral': 'REPEAT 50 [ FORWARD 5 RIGHT 91 ]',
      'House': `FORWARD 80
RIGHT 90
FORWARD 80
RIGHT 90
FORWARD 80
RIGHT 90
FORWARD 80
RIGHT 30
FORWARD 50
RIGHT 120
FORWARD 50
RIGHT 120
FORWARD 50`,
      'Flower': 'REPEAT 8 [ REPEAT 20 [ FORWARD 8 RIGHT 18 ] RIGHT 45 ]',
      'Big Flower': 'REPEAT 12 [ REPEAT 15 [ FORWARD 24 RIGHT 24 ] RIGHT 30 ]',
      'Sunflower': `REPEAT 12 [
FORWARD 25
REPEAT 4 [ FORWARD 6 RIGHT 90 ]
PENUP
FORWARD 25
PENDOWN
RIGHT 30
]`,
      'Rainbow Spiral': 'REPEAT 360 [ FORWARD 3 RIGHT 91 ]',
      'Rainbow Square': `COL 2
FORWARD 100
COL 6
RIGHT 90
FORWARD 100
COL 1
RIGHT 90
FORWARD 100
COL 4
RIGHT 90
FORWARD 100`,
      'Flow of Life': `; Draw center circle only once
REPEAT 60 [ FORWARD 5 RIGHT 6 ]

; Move to starting point for first outer circle
RIGHT 60

; Draw 5 surrounding circles using BACK (avoid drawing the last twice)
REPEAT 5 [
  PENUP
  FORWARD 10         ; Move to circumference
  PENDOWN
  REPEAT 60 [ FORWARD 5 RIGHT 6 ]  ; Draw outer circle
  PENUP
  BACK 10            ; Return to center
  RIGHT 60           ; Rotate to next position
]`,
      'Rainbow Flower of Life': `; Flower of Life cluster with explicit colors (COL takes literals only)
; COLORS: 0-15 available. Change the COL numbers below to tune colors.

PENUP
FORWARD 70

; ---- Center flower (color 1) ----
COL 1
; center circle
REPEAT 60 [ FORWARD 5 RIGHT 6 ]
RIGHT 60
; 5 surrounding circles for this flower
REPEAT 5 [
  PENUP
  FORWARD 10
  PENDOWN
  REPEAT 60 [ FORWARD 5 RIGHT 6 ]
  PENUP
  BACK 10
  RIGHT 60
]

; ---- Five flowers arranged around the center ----
; Each outer flower uses a different color and is placed 72 degrees apart.

; Flower A (color 2)
COL 2
PENUP
FORWARD 140
PENDOWN
REPEAT 60 [ FORWARD 5 RIGHT 6 ]
RIGHT 60
REPEAT 5 [ PENUP FORWARD 10 PENDOWN REPEAT 60 [ FORWARD 5 RIGHT 6 ] PENUP BACK 10 RIGHT 60 ]
PENUP
BACK 20
RIGHT 72

; Flower B (color 3)
COL 3
PENUP
FORWARD 140
PENDOWN
REPEAT 60 [ FORWARD 5 RIGHT 6 ]
RIGHT 60
REPEAT 5 [ PENUP FORWARD 10 PENDOWN REPEAT 60 [ FORWARD 5 RIGHT 6 ] PENUP BACK 10 RIGHT 60 ]
PENUP
BACK 20
RIGHT 72

; Flower C (color 4)
COL 4
PENUP
FORWARD 140
PENDOWN
REPEAT 60 [ FORWARD 5 RIGHT 6 ]
RIGHT 60
REPEAT 5 [ PENUP FORWARD 10 PENDOWN REPEAT 60 [ FORWARD 5 RIGHT 6 ] PENUP BACK 10 RIGHT 60 ]
PENUP
BACK 20
RIGHT 72

; Flower D (color 5)
COL 5
PENUP
FORWARD 140
PENDOWN
REPEAT 60 [ FORWARD 5 RIGHT 6 ]
RIGHT 60
REPEAT 5 [ PENUP FORWARD 10 PENDOWN REPEAT 60 [ FORWARD 5 RIGHT 6 ] PENUP BACK 10 RIGHT 60 ]
PENUP
BACK 20
RIGHT 72

; Flower E (color 6)
COL 6
PENUP
FORWARD 140
PENDOWN
REPEAT 60 [ FORWARD 5 RIGHT 6 ]
RIGHT 60
REPEAT 5 [ PENUP FORWARD 10 PENDOWN REPEAT 60 [ FORWARD 5 RIGHT 6 ] PENUP BACK 10 RIGHT 60 ]
PENUP
BACK 20
RIGHT 72`
    };
  }
}