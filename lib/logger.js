/**
 * Centralized logging utility for the application
 * Provides different log levels and environment-aware logging
 * Works with Vite (uses import.meta.env instead of process.env)
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get environment mode (Vite uses import.meta.env.MODE)
const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD;
const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

// Set log level based on environment
// Production: Only ERROR and WARN
// Development: All levels (DEBUG, INFO, WARN, ERROR)
const currentLogLevel = isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

class Logger {
  constructor(module = 'App') {
    this.module = module;
  }

  _shouldLog(level) {
    return level <= currentLogLevel;
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.module}] ${message}`;
  }

  error(message, error = null) {
    if (this._shouldLog(LOG_LEVELS.ERROR)) {
      if (error) {
        console.error(this._formatMessage('ERROR', message), error);
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
        console.log(this._formatMessage('INFO', message), data);
      } else {
        console.log(this._formatMessage('INFO', message));
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

  apiError(endpoint, method, error) {
    this.error(`API Error: ${method} ${endpoint}`, error);
  }

  userAction(action, details = null) {
    this.info(`User Action: ${action}`, details);
  }

  performance(operation, duration) {
    if (duration > 1000) {
      this.warn(`Slow Operation: ${operation} took ${duration}ms`);
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`);
    }
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
export { Logger, LOG_LEVELS };
