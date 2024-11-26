export declare enum LogLevel {
    SYSTEM = 0,
    LOG = 1,
    DEBUG = 2,
    INFO = 3,
    WARN = 4,
    ERROR = 5
}
export declare class Logger {
    private static instance;
    currentLogLevel: LogLevel;
    lastLog: string;
    filter: string;
    history: string[];
    maxHistory: number;
    private constructor();
    static getInstance(): Logger;
    setLogLevel(level: LogLevel): void;
    private addHistory;
    private shouldLog;
    private formatMessage;
    system(message: string, ...args: any[]): void;
    log(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}
declare const _default: Logger;
export default _default;
//# sourceMappingURL=Logger.d.ts.map