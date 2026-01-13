
export type Role = 'user' | 'model';

export type AppMode = 'sohbet' | 'konu' | 'topik' | 'hangul' | 'soru' | null;

export interface Message {
  role: Role;
  text: string;
  timestamp: number;
}

export interface SavedSession {
  id: string;
  mode: AppMode;
  messages: Message[];
  lastTimestamp: number;
}
