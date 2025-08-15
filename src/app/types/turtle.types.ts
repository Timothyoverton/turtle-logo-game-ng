export interface TurtlePosition {
  x: number;
  y: number;
  angle: number; // degrees, 0 = right, 90 = up
}

export interface TurtleState {
  position: TurtlePosition;
  penDown: boolean;
  color: string;
  penSize: number;
}

export interface DrawingInstruction {
  type: 'line' | 'move';
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  penSize: number;
}

export interface Command {
  type: 'FORWARD' | 'LEFT' | 'RIGHT' | 'BACK' | 'PENUP' | 'PENDOWN' | 'CLEAR' | 'REPEAT' | 'COL';
  value?: number;
  commands?: Command[]; // for REPEAT loops
}

export interface ParsedProgram {
  commands: Command[];
  errors: ParseError[];
}

export interface ParseError {
  message: string;
  line?: number;
  column?: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'goal' | 'hazard';
}

export interface Level {
  id: string;
  title: string;
  description: string;
  obstacles: Obstacle[];
  startPosition: TurtlePosition;
  objectives: LevelObjective[];
  hints?: string[];
}

export interface LevelObjective {
  type: 'draw_shape' | 'reach_goal' | 'avoid_obstacles' | 'draw_pattern';
  description: string;
  target?: any; // shape coordinates, goal position, etc.
  completed: boolean;
}

export interface GameState {
  mode: 'creativity' | 'challenge';
  currentLevel?: Level;
  turtle: TurtleState;
  drawing: DrawingInstruction[];
  isRunning: boolean;
  isPaused: boolean;
  commandQueue: Command[];
  currentCommandIndex: number;
  score: number;
}