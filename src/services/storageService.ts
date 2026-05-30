import type { AppSettings, Connection, Note, NoteSummary } from '../types';

interface StoredState {
  notes: Note[];
  connections: Connection[];
  settings: AppSettings;
}

const buildGroqApiKey = import.meta.env.DEV
  ? (import.meta.env.VITE_GROQ_API_KEY || import.meta.env.API_KEY_GROQ || '').trim()
  : '';

const defaultSettings: AppSettings = {
  groqApiKey: buildGroqApiKey,
  language: 'pt',
  keepAudio: true,
  model: 'llama-3.1-8b-instant',
  theme: 'dark'
};

const createEmptyState = (): StoredState => ({
  notes: [],
  connections: [],
  settings: defaultSettings
});

const mergeSettings = (settings?: Partial<AppSettings>): AppSettings => {
  const merged = { ...defaultSettings, ...(settings ?? {}) };

  if (!merged.groqApiKey.trim() && defaultSettings.groqApiKey) {
    merged.groqApiKey = defaultSettings.groqApiKey;
  }

  return merged;
};

export class BrowserStorageService {
  private readonly key: string;

  constructor(namespace = 'pensle') {
    this.key = `${namespace}:state`;
  }

  async getAllNotes(): Promise<Note[]> {
    return this.read().notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAllNotesSummaries(): Promise<NoteSummary[]> {
    const notes = await this.getAllNotes();
    return notes.map(({ id, title, summary, tags, createdAt }) => ({
      id,
      title,
      summary,
      tags,
      createdAt
    }));
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.read().notes.find((note) => note.id === id);
  }

  async getConnections(): Promise<Connection[]> {
    return this.read().connections;
  }

  async saveNote(note: Note, connections: Connection[]): Promise<void> {
    const state = this.read();
    const notes = state.notes.filter((saved) => saved.id !== note.id);
    const existingConnectionKeys = new Set(
      state.connections.map((connection) =>
        [connection.sourceNoteId, connection.targetNoteId].sort().join(':')
      )
    );
    const nextConnections = [...state.connections];

    connections.forEach((connection) => {
      const key = [connection.sourceNoteId, connection.targetNoteId].sort().join(':');
      if (!existingConnectionKeys.has(key)) {
        existingConnectionKeys.add(key);
        nextConnections.push(connection);
      }
    });

    this.write({
      ...state,
      notes: [note, ...notes],
      connections: nextConnections
    });
  }

  async deleteNote(id: string): Promise<void> {
    const state = this.read();
    this.write({
      ...state,
      notes: state.notes.filter((note) => note.id !== id),
      connections: state.connections.filter(
        (connection) => connection.sourceNoteId !== id && connection.targetNoteId !== id
      )
    });
  }

  async getSettings(): Promise<AppSettings> {
    return this.read().settings;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const state = this.read();
    this.write({ ...state, settings });
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key);
  }

  private read(): StoredState {
    const raw = localStorage.getItem(this.key);
    if (!raw) {
      return createEmptyState();
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      return {
        notes: parsed.notes ?? [],
        connections: parsed.connections ?? [],
        settings: mergeSettings(parsed.settings)
      };
    } catch {
      return createEmptyState();
    }
  }

  private write(state: StoredState): void {
    localStorage.setItem(this.key, JSON.stringify(state));
  }
}

export const storageService = new BrowserStorageService();
export { defaultSettings };
