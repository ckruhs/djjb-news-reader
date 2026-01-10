import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly MAX_LOGS = 100;
  private readonly STORAGE_KEY = 'app_debug_logs';
  
  private _logs: LogEntry[] = [];
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);

  constructor() {
    // Load existing logs from localStorage
    this.loadLogsFromStorage();
    
    // Log service initialization
    this.info('Logger service initialized');
  }

  // Observable stream of logs
  get logs$(): Observable<LogEntry[]> {
    return this.logsSubject.asObservable();
  }
  
  // Get all logs (for initial display)
  getAllLogs(): LogEntry[] {
    return [...this._logs];
  }
  
  // Log an info message
  info(message: string): void {
    this.addLog('info', message);
  }
  
  // Log a warning message
  warn(message: string): void {
    this.addLog('warn', message);
  }
  
  // Log an error message
  error(message: string): void {
    this.addLog('error', message);
    console.error(message); // Also log to console for developer visibility
  }
  
  // Clear all logs
  clearLogs(): void {
    this._logs = [];
    localStorage.removeItem(this.STORAGE_KEY);
    this.logsSubject.next([]);
  }
  
  // Add a new log entry
  private addLog(level: 'info' | 'warn' | 'error', message: string): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message
    };
    
    // Add to in-memory logs
    this._logs.unshift(entry); // Add to beginning for chronological display
    
    // Trim logs if exceeding maximum
    if (this._logs.length > this.MAX_LOGS) {
      this._logs = this._logs.slice(0, this.MAX_LOGS);
    }
    
    // Save to localStorage
    this.saveLogsToStorage();
    
    // Notify subscribers
    this.logsSubject.next([...this._logs]);
  }
  
  // Load logs from localStorage
  private loadLogsFromStorage(): void {
    try {
      const storedLogs = localStorage.getItem(this.STORAGE_KEY);
      if (storedLogs) {
        this._logs = JSON.parse(storedLogs);
      }
    } catch (err) {
      console.error('Error loading logs from localStorage:', err);
      // If loading fails, reset logs
      this._logs = [];
    }
  }
  
  // Save logs to localStorage
  private saveLogsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._logs));
    } catch (err) {
      console.error('Error saving logs to localStorage:', err);
    }
  }
}