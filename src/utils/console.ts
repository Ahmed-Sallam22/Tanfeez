
// Check if we're in production
const isProduction = import.meta.env.PROD

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
}

// Override console methods in production (keep error for debugging)
if (isProduction) {
  console.log = () => {}
  // Keep console.error enabled for debugging
  // console.error = () => {}
  console.warn = () => {}
  console.info = () => {}
  console.debug = () => {}
  console.trace = () => {}
}

// Export original methods for critical logging if needed
export const devConsole = originalConsole

// Export a conditional logger
export const logger = {
  log: isProduction ? () => {} : originalConsole.log,
  error: isProduction ? () => {} : originalConsole.error,
  warn: isProduction ? () => {} : originalConsole.warn,
  info: isProduction ? () => {} : originalConsole.info,
  debug: isProduction ? () => {} : originalConsole.debug,
  trace: isProduction ? () => {} : originalConsole.trace,
}

export default logger
