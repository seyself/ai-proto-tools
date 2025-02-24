export enum LogLevel {
  SYSTEM = 0,
  LOG = 1,
  DEBUG = 2,
  INFO = 3,
  WARN = 4,
  ERROR = 5,
}

export class Logger {
  private static instance: Logger;

  public currentLogLevel: LogLevel = LogLevel.LOG;
  public lastLog: string = '';
  public filter: string = '';
  public history: string[] = [];
  public maxHistory: number = 20;

  private callback: ((message: string) => void) | null = null;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  private addHistory(message: string): void {
    this.lastLog = message;
    this.history.unshift(message);
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
    if (this.callback) {
      this.callback(message);
    }
  }

  listen(callback: (message: string) => void): void {
    this.callback = callback;
  }

  private shouldLog(level: LogLevel, message: string): boolean {
    const enableLevel = level >= this.currentLogLevel;
    const enableFilter = this.filter === '' || message.includes(this.filter);
    return enableLevel && enableFilter;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    return `[${timestamp}] [${level}] ${message}`;
  }

  system(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.SYSTEM, message)) {
      const msg = this.formatMessage('S', message);
      this.addHistory(msg);
      console.debug(msg, ...args);
    }
  }

  log(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.LOG, message)) {
      const msg = this.formatMessage('L', message);
      this.addHistory(msg);
      console.debug(msg, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG, message)) {
      const msg = this.formatMessage('D', message);
      this.addHistory(msg);
      console.debug(msg, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO, message)) {
      const msg = this.formatMessage('I', message);
      this.addHistory(msg);
      console.info(msg, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN, message)) {
      const msg = this.formatMessage('W', message);
      this.addHistory(msg);
      console.warn(msg, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR, message)) {
      const msg = this.formatMessage('E', message);
      this.addHistory(msg);
      console.error(msg, ...args);
    }
  }

}

// Export default instance
export default Logger.getInstance();
