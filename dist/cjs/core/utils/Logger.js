"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["SYSTEM"] = 0] = "SYSTEM";
    LogLevel[LogLevel["LOG"] = 1] = "LOG";
    LogLevel[LogLevel["DEBUG"] = 2] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 3] = "INFO";
    LogLevel[LogLevel["WARN"] = 4] = "WARN";
    LogLevel[LogLevel["ERROR"] = 5] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.currentLogLevel = LogLevel.LOG;
        this.filter = '';
        this.history = [];
        this.maxHistory = 20;
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setLogLevel(level) {
        this.currentLogLevel = level;
    }
    addHistory(message) {
        this.history.unshift(message);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    }
    shouldLog(level, message) {
        const enableLevel = level >= this.currentLogLevel;
        const enableFilter = this.filter === '' || message.includes(this.filter);
        return enableLevel && enableFilter;
    }
    formatMessage(level, message, ...args) {
        // const timestamp = new Date().toISOString();
        // return `[${timestamp}] [${level}] ${message} ${args.join(' ')}`;
        return `[${level}] ${message}`;
    }
    system(message, ...args) {
        if (this.shouldLog(LogLevel.SYSTEM, message)) {
            const msg = this.formatMessage('S', message);
            this.addHistory(msg);
            console.debug(msg, ...args);
        }
    }
    log(message, ...args) {
        if (this.shouldLog(LogLevel.LOG, message)) {
            const msg = this.formatMessage('L', message);
            this.addHistory(msg);
            console.debug(msg, ...args);
        }
    }
    debug(message, ...args) {
        if (this.shouldLog(LogLevel.DEBUG, message)) {
            const msg = this.formatMessage('D', message);
            this.addHistory(msg);
            console.debug(msg, ...args);
        }
    }
    info(message, ...args) {
        if (this.shouldLog(LogLevel.INFO, message)) {
            const msg = this.formatMessage('I', message);
            this.addHistory(msg);
            console.info(msg, ...args);
        }
    }
    warn(message, ...args) {
        if (this.shouldLog(LogLevel.WARN, message)) {
            const msg = this.formatMessage('W', message);
            this.addHistory(msg);
            console.warn(msg, ...args);
        }
    }
    error(message, ...args) {
        if (this.shouldLog(LogLevel.ERROR, message)) {
            const msg = this.formatMessage('E', message);
            this.addHistory(msg);
            console.error(msg, ...args);
        }
    }
}
exports.Logger = Logger;
// Export default instance
exports.default = Logger.getInstance();
