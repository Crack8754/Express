export interface Event {
  id: string;
  title: string;
  date: string;
}

export class DataFileError extends Error {
  constructor(message: string, cause?: unknown);
  cause?: unknown;
}

export function readEvents(): Promise<Event[]>;

export function writeEvents(events: Event[]): Promise<void>;