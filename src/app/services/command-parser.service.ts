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
    // Remove comments and normalize whitespace
    return input
      .split('\n')
      .map(line => line.replace(/#.*$/, '').trim()) // Remove comments
      .filter(line => line.length > 0) // Remove empty lines
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .toUpperCase();
  }

  private tokenize(input: string): string[] {
    // Split into tokens while preserving brackets
    const tokens: string[] = [];
    let current = '';
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      
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
    type: 'FORWARD' | 'LEFT' | 'RIGHT', 
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
FORWARD 50`,
      'Flower': 'REPEAT 8 [ REPEAT 20 [ FORWARD 8 RIGHT 18 ] RIGHT 45 ]',
      'Big Flower': 'REPEAT 12 [ REPEAT 15 [ FORWARD 12 RIGHT 24 ] RIGHT 30 ]',
      'Sunflower': `REPEAT 20 [
FORWARD 80
REPEAT 8 [ FORWARD 15 RIGHT 45 ]
PENUP
FORWARD 80
PENDOWN
RIGHT 18
]`,
      'Rainbow Spiral': 'REPEAT 360 [ FORWARD 3 RIGHT 91 ]'
    };
  }
}