import { Injectable } from '@angular/core';
import { Command, ParsedProgram, ParseError } from '../types/turtle.types';

@Injectable({
  providedIn: 'root'
})
export class CommandParserService {

  parseCommands(input: string): ParsedProgram {
    const commands: Command[] = [];
    const errors: ParseError[] = [];
    
    // Normalize input: remove extra whitespace, convert to uppercase
    const lines = input.trim().split('\n').map(line => line.trim().toUpperCase());
    
    let lineNumber = 0;
    
    try {
      for (const line of lines) {
        lineNumber++;
        if (line === '' || line.startsWith('#')) continue; // Skip empty lines and comments
        
        const lineCommands = this.parseLine(line, lineNumber);
        if (lineCommands.errors.length > 0) {
          errors.push(...lineCommands.errors);
        } else {
          commands.push(...lineCommands.commands);
        }
      }
    } catch (error) {
      errors.push({
        message: `Unexpected error: ${error}`,
        line: lineNumber
      });
    }
    
    return { commands, errors };
  }

  private parseLine(line: string, lineNumber: number): ParsedProgram {
    const commands: Command[] = [];
    const errors: ParseError[] = [];
    
    // Handle REPEAT command with brackets
    if (line.includes('REPEAT')) {
      return this.parseRepeatCommand(line, lineNumber);
    }
    
    // Split by spaces and parse individual commands
    const tokens = line.split(/\s+/).filter(token => token.length > 0);
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      switch (token) {
        case 'FORWARD':
        case 'FD':
          const distance = this.parseNumber(tokens[i + 1]);
          if (distance === null) {
            errors.push({
              message: 'FORWARD command requires a number',
              line: lineNumber
            });
          } else {
            commands.push({ type: 'FORWARD', value: distance });
            i++; // Skip the number token
          }
          break;
          
        case 'LEFT':
        case 'LT':
          const leftAngle = this.parseNumber(tokens[i + 1]);
          if (leftAngle === null) {
            errors.push({
              message: 'LEFT command requires a number',
              line: lineNumber
            });
          } else {
            commands.push({ type: 'LEFT', value: leftAngle });
            i++; // Skip the number token
          }
          break;
          
        case 'RIGHT':
        case 'RT':
          const rightAngle = this.parseNumber(tokens[i + 1]);
          if (rightAngle === null) {
            errors.push({
              message: 'RIGHT command requires a number',
              line: lineNumber
            });
          } else {
            commands.push({ type: 'RIGHT', value: rightAngle });
            i++; // Skip the number token
          }
          break;
          
        case 'PENUP':
        case 'PU':
          commands.push({ type: 'PENUP' });
          break;
          
        case 'PENDOWN':
        case 'PD':
          commands.push({ type: 'PENDOWN' });
          break;
          
        case 'CLEAR':
          commands.push({ type: 'CLEAR' });
          break;
          
        default:
          errors.push({
            message: `Unknown command: ${token}`,
            line: lineNumber
          });
      }
    }
    
    return { commands, errors };
  }

  private parseRepeatCommand(line: string, lineNumber: number): ParsedProgram {
    const commands: Command[] = [];
    const errors: ParseError[] = [];
    
    // Extract REPEAT n [ ... ] pattern
    const repeatMatch = line.match(/REPEAT\s+(\d+)\s*\[\s*(.*?)\s*\]/);
    if (!repeatMatch) {
      errors.push({
        message: 'Invalid REPEAT syntax. Use: REPEAT n [ commands ]',
        line: lineNumber
      });
      return { commands, errors };
    }
    
    const repeatCount = parseInt(repeatMatch[1]);
    const repeatCommands = repeatMatch[2];
    
    if (repeatCount <= 0 || repeatCount > 1000) {
      errors.push({
        message: 'REPEAT count must be between 1 and 1000',
        line: lineNumber
      });
      return { commands, errors };
    }
    
    // Parse the commands inside the brackets
    const innerParsed = this.parseLine(repeatCommands, lineNumber);
    if (innerParsed.errors.length > 0) {
      errors.push(...innerParsed.errors);
    } else {
      commands.push({
        type: 'REPEAT',
        value: repeatCount,
        commands: innerParsed.commands
      });
    }
    
    return { commands, errors };
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
      'House': `FORWARD 100
RIGHT 90
FORWARD 100
RIGHT 90
FORWARD 100
RIGHT 90
FORWARD 100
RIGHT 30
FORWARD 60
RIGHT 120
FORWARD 60`,
      'Flower': `REPEAT 8 [ 
  REPEAT 36 [ FORWARD 2 RIGHT 10 ] 
  RIGHT 45 
]`
    };
  }
}