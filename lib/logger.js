/**
 * Centralized logging utility for the mobile app
 * Provides different log levels and environment-aware logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

class Logger {
  constructor(module = 'App') {
    this.module = module;
  }

  _shouldLog(level) {
    return level <= currentLogLevel;
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.module}]`;
    
    if (data) {
      return `${prefix} ${message}`, data;
    }
    return `${prefix} ${message}`;
  }

  error(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.ERROR)) {
      if (data) {
        console.error(this._formatMessage('ERROR', message), data);
      } else {
        console.error(this._formatMessage('ERROR', message));
      }
    }
  }

  warn(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.WARN)) {
      if (data) {
        console.warn(this._formatMessage('WARN', message), data);
      } else {
        console.warn(this._formatMessage('WARN', message));
      }
    }
  }

  info(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.INFO)) {
      if (data) {
        console.info(this._formatMessage('INFO', message), data);
      } else {
        console.info(this._formatMessage('INFO', message));
      }
    }
  }

  debug(message, data = null) {
    if (this._shouldLog(LOG_LEVELS.DEBUG)) {
      if (data) {
        console.log(this._formatMessage('DEBUG', message), data);
      } else {
        console.log(this._formatMessage('DEBUG', message));
      }
    }
  }

  // Specialized logging methods for common use cases
  apiCall(endpoint, method = 'GET', data = null) {
    this.debug(`API Call: ${method} ${endpoint}`, data);
  }

  apiError(endpoint, error, data = null) {
    this.error(`API Error: ${endpoint}`, { error: error.message, data });
  }

  userAction(action, data = null) {
    this.info(`User Action: ${action}`, data);
  }

  performance(operation, duration, data = null) {
    this.info(`Performance: ${operation} took ${duration}ms`, data);
  }
}

// Create logger instances for different modules
export const createLogger = (module) => new Logger(module);

// Default logger
export const logger = new Logger('App');

// Specialized loggers for common modules
export const apiLogger = new Logger('API');
export const authLogger = new Logger('Auth');
export const uiLogger = new Logger('UI');
export const dbLogger = new Logger('Database');

export default logger;
