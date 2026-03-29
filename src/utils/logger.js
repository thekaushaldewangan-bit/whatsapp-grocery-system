import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../logs');
fs.ensureDirSync(LOG_DIR);

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

class Logger {
  constructor() {
    this.logFile = path.join(LOG_DIR, `app-${new Date().toISOString().split('T')[0]}.log`);
  }

  log(level, message, data = '') {
    if (LOG_LEVELS[level] > CURRENT_LOG_LEVEL) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;

    // Console output
    console.log(logMessage.trim());

    // File output
    fs.appendFileSync(this.logFile, logMessage);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  get stream() {
    return fs.createWriteStream(this.logFile, { flags: 'a' });
  }
}

export default new Logger();

