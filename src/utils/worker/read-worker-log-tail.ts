import fs from 'fs';

const DEFAULT_MAX_BYTES = 16_384;

/**
 * Returns the last N lines of a worker log file (byte-capped from the end).
 */
export const readWorkerLogTail = (
  logPath: string,
  lineCount = 40,
  maxBytes = DEFAULT_MAX_BYTES,
): string => {
  if (!fs.existsSync(logPath)) {
    return '';
  }

  const stat = fs.statSync(logPath);
  if (stat.size === 0) {
    return '';
  }

  const readSize = Math.min(stat.size, maxBytes);
  const buffer = Buffer.alloc(readSize);
  const fd = fs.openSync(logPath, 'r');
  try {
    fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
  } finally {
    fs.closeSync(fd);
  }

  const text = buffer.toString('utf8');
  const lines = text.split('\n');
  if (readSize < stat.size && lines.length > 0) {
    lines.shift();
  }

  return lines.slice(-lineCount).join('\n').trim();
};
