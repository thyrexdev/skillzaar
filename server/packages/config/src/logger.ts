import { env } from "./env";

// Log levels for better control
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  timestamp: boolean;
  colors: boolean;
}

// Default configuration based on environment
const defaultConfig: LoggerConfig = {
  level: env.NODE_ENV === 'production' ? 'warn' : 'debug',
  timestamp: true,
  colors: env.NODE_ENV !== 'production',
};

// ANSI color codes for better visibility
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
};

// Log level priorities
const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Format timestamp
const formatTimestamp = (): string => {
  return new Date().toISOString();
};

// Format log message with colors and timestamp
const formatMessage = (
  level: LogLevel,
  args: any[],
  config: LoggerConfig = defaultConfig
): string[] => {
  const timestamp = config.timestamp ? `[${formatTimestamp()}]` : '';
  const levelColors = {
    debug: colors.gray,
    info: colors.blue,
    warn: colors.yellow,
    error: colors.red,
  };
  
  const levelColor = config.colors ? levelColors[level] : '';
  const resetColor = config.colors ? colors.reset : '';
  const levelTag = `${levelColor}[${level.toUpperCase()}]${resetColor}`;
  
  const prefix = [timestamp, levelTag].filter(Boolean).join(' ');
  return prefix ? [prefix, ...args] : args;
};

// Check if log level should be printed
const shouldLog = (level: LogLevel, configLevel: LogLevel): boolean => {
  return logLevels[level] >= logLevels[configLevel];
};

export const logger = {
  /**
   * Debug level logging - only shown in development
   * Use for detailed debugging information
   */
  debug: (...args: any[]) => {
    if (shouldLog('debug', defaultConfig.level)) {
      console.log(...formatMessage('debug', args));
    }
  },

  /**
   * Info level logging - general information
   * Use for normal application flow
   */
  info: (...args: any[]) => {
    if (shouldLog('info', defaultConfig.level)) {
      console.log(...formatMessage('info', args));
    }
  },

  /**
   * Warning level logging
   * Use for concerning but non-critical issues
   */
  warn: (...args: any[]) => {
    if (shouldLog('warn', defaultConfig.level)) {
      console.warn(...formatMessage('warn', args));
    }
  },

  /**
   * Error level logging - always shown
   * Use for errors and critical issues
   */
  error: (...args: any[]) => {
    console.error(...formatMessage('error', args));
  },

  /**
   * Create a child logger with context
   * Useful for adding consistent context to related logs
   */
  child: (context: Record<string, any>) => {
    const contextString = Object.entries(context)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    
    return {
      debug: (...args: any[]) => logger.debug(`[${contextString}]`, ...args),
      info: (...args: any[]) => logger.info(`[${contextString}]`, ...args),
      warn: (...args: any[]) => logger.warn(`[${contextString}]`, ...args),
      error: (...args: any[]) => logger.error(`[${contextString}]`, ...args),
    };
  },

  /**
   * Time a function execution
   */
  time: <T>(label: string, fn: () => T | Promise<T>): T | Promise<T> => {
    const start = Date.now();
    logger.debug(`Timer started: ${label}`);
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.then((res) => {
        const duration = Date.now() - start;
        logger.debug(`Timer finished: ${label} (${duration}ms)`);
        return res;
      }).catch((error) => {
        const duration = Date.now() - start;
        logger.error(`Timer failed: ${label} (${duration}ms)`, error);
        throw error;
      });
    } else {
      const duration = Date.now() - start;
      logger.debug(`Timer finished: ${label} (${duration}ms)`);
      return result;
    }
  },

  /**
   * Log with custom configuration
   */
  withConfig: (config: Partial<LoggerConfig>) => {
    const mergedConfig = { ...defaultConfig, ...config };
    
    return {
      debug: (...args: any[]) => {
        if (shouldLog('debug', mergedConfig.level)) {
          console.log(...formatMessage('debug', args, mergedConfig));
        }
      },
      info: (...args: any[]) => {
        if (shouldLog('info', mergedConfig.level)) {
          console.log(...formatMessage('info', args, mergedConfig));
        }
      },
      warn: (...args: any[]) => {
        if (shouldLog('warn', mergedConfig.level)) {
          console.warn(...formatMessage('warn', args, mergedConfig));
        }
      },
      error: (...args: any[]) => {
        console.error(...formatMessage('error', args, mergedConfig));
      },
    };
  },
};

