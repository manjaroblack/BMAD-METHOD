/**
 * Spinner service implementation for BMAD-METHOD
 * Provides consistent UI feedback for long-running operations
 */

import type {
  SpinnerConfig,
} from 'deps';

export interface ISpinner {
  text: string;
  start(): void;
  stop(): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  info(text?: string): void;
  warn(text?: string): void;
  update(text: string): void;
}

export interface SpinnerFrame {
  frames: string[];
  interval: number;
}

export class SpinnerService implements ISpinner {
  private config: SpinnerConfig;
  private isSpinning: boolean = false;
  private intervalId?: number;
  private currentFrameIndex: number = 0;
  private _text: string = '';
  
  private readonly spinnerStyles: Record<string, SpinnerFrame> = {
    dots: {
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      interval: 80
    },
    line: {
      frames: ['⎺', '⎻', '⎼', '⎽', '⎼', '⎻'],
      interval: 130
    },
    arrow: {
      frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
      interval: 120
    },
    bouncingBar: {
      frames: [
        '[    ]', '[=   ]', '[==  ]', '[=== ]', '[====]',
        '[ ===]', '[  ==]', '[   =]', '[    ]', '[   =]',
        '[  ==]', '[ ===]', '[====]', '[=== ]', '[==  ]', '[=   ]'
      ],
      interval: 80
    }
  };

  constructor(config: SpinnerConfig = {}) {
    this.config = {
      enabled: true,
      style: 'dots',
      color: 'cyan',
      text: '',
      ...config
    };
    this._text = this.config.text || '';
  }

  get text(): string {
    return this._text;
  }

  set text(value: string) {
    this._text = value;
    if (this.isSpinning) {
      this.render();
    }
  }

  start(): void {
    if (!this.config.enabled || this.isSpinning) {
      return;
    }

    this.isSpinning = true;
    this.currentFrameIndex = 0;

    const style = this.spinnerStyles[this.config.style || 'dots'];
    if (!style) return;
    
    this.intervalId = setInterval(() => {
      this.currentFrameIndex = (this.currentFrameIndex + 1) % style.frames.length;
      this.render();
    }, style.interval);

    this.render();
  }

  stop(): void {
    if (!this.isSpinning) {
      return;
    }

    this.isSpinning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.clearLine();
  }

  succeed(text?: string): void {
    this.stop();
    const message = text || this._text;
    this.printLine('✅', message, 'green');
  }

  fail(text?: string): void {
    this.stop();
    const message = text || this._text;
    this.printLine('❌', message, 'red');
  }

  info(text?: string): void {
    this.stop();
    const message = text || this._text;
    this.printLine('ℹ️', message, 'blue');
  }

  warn(text?: string): void {
    this.stop();
    const message = text || this._text;
    this.printLine('⚠️', message, 'yellow');
  }

  update(text: string): void {
    this.text = text;
  }

  private render(): void {
    if (!this.config.enabled) {
      return;
    }

    const style = this.spinnerStyles[this.config.style || 'dots'];
    if (!style) return;
    
    const frame = style.frames[this.currentFrameIndex];
    if (!frame) return;
    
    const coloredFrame = this.colorize(frame, (this.config.color || 'cyan') as string);
    
    this.clearLine();
    Deno.stdout.writeSync(new TextEncoder().encode(`${coloredFrame} ${this._text}`));
  }

  private clearLine(): void {
    // Move cursor to beginning of line and clear it
    Deno.stdout.writeSync(new TextEncoder().encode('\r\x1b[K'));
  }

  private printLine(symbol: string, text: string, color: string): void {
    this.clearLine();
    const coloredSymbol = this.colorize(symbol, color);
    console.log(`${coloredSymbol} ${text}`);
  }

  private colorize(text: string, color: string): string {
    const colors: Record<string, string> = {
      black: '\x1b[30m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m'
    };

    const reset = '\x1b[0m';
    const colorCode = colors[color] || colors.cyan;
    
    return `${colorCode}${text}${reset}`;
  }
}

// Factory function for creating spinners
export function createSpinner(text: string, config?: Partial<SpinnerConfig>): ISpinner {
  return new SpinnerService({ ...config, text });
}

// Export default instance
export const spinner = new SpinnerService();
