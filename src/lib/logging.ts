// src/lib/logging.ts
'use server';

import fs from 'fs/promises';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'webhook-events.json');
const MAX_LOG_ENTRIES = 200; // Limit the number of log entries to prevent the file from growing indefinitely.

type LogLevel = 'info' | 'success' | 'error';

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
};

/**
 * Ensures the data directory exists.
 */
async function ensureDirectoryExists() {
  try {
    await fs.mkdir(path.dirname(LOG_FILE_PATH), { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      console.error('Failed to create data directory for logs:', error);
      throw error; // Rethrow if it's not a "directory already exists" error
    }
  }
}

/**
 * Reads all events from the log file.
 * @returns An array of log entries.
 */
export async function readEvents(): Promise<LogEntry[]> {
  await ensureDirectoryExists();
  try {
    const data = await fs.readFile(LOG_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []; // File doesn't exist yet, return empty array.
    }
    console.error('Failed to read log file:', error);
    throw error;
  }
}

/**
 * Appends a new event to the log file, ensuring the log does not exceed a maximum size.
 * @param event The log entry to add.
 */
export async function logEvent(event: Omit<LogEntry, 'timestamp'>) {
  await ensureDirectoryExists();
  const newEntry: LogEntry = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  try {
    const currentEvents = await readEvents();
    
    // Add the new event and truncate the log if it's too long.
    const updatedEvents = [newEntry, ...currentEvents].slice(0, MAX_LOG_ENTRIES);

    await fs.writeFile(LOG_FILE_PATH, JSON.stringify(updatedEvents, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to log file:', error);
    // We don't rethrow here because a logging failure should not crash the main process.
  }
}
