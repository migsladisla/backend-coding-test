const winston = require('winston');
const fs = require('fs');
const path = require('path');
const logDirectory = 'logs';
const { createLogger, transports, format } = require('winston');
const { combine, timestamp, label, splat, simple, printf } = format;

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

module.exports = createLogger({
  level: 'info',
  format: combine(
    label({ label: 'Xendit Exam' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    splat(),
    simple(),
    logFormat,
  ),
  transports: [
    new transports.File({ 
      filename: path.join(logDirectory, 'error.log'), 
      level: 'error' 
    }),
    new transports.File({ 
      filename: path.join(logDirectory, 'combined.log')
    }),
  ]
});