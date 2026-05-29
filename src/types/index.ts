export type ConnectionStrength = 'strong' | 'moderate' | 'weak';

export interface Connection {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  reason: string;
  strength: ConnectionStrength;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  summary: string;
  body: string;
  rawTranscript: string;
  markdown?: string;
  tags: string[];
  connections: Connection[];
  audioUrl?: string;
  audioDataUrl?: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export interface NoteSummary {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  createdAt: string;
}

export interface AiConnectionCandidate {
  noteId: string;
  noteTitle: string;
  reason: string;
  strength: ConnectionStrength;
}

export interface AiNoteResponse {
  title: string;
  summary: string;
  body: string;
  tags: string[];
  connections: AiConnectionCandidate[];
  wikilinks: string[];
}

export interface AppSettings {
  groqApiKey: string;
  language: 'pt' | 'en' | 'auto';
  keepAudio: boolean;
  model: 'llama-3.1-8b-instant' | 'llama-3.3-70b-versatile';
  theme: 'dark' | 'light';
}

export interface GraphNode {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  color: string;
  connectionCount: number;
}

export interface GraphLink {
  source: string;
  target: string;
  reason: string;
  strength: ConnectionStrength;
  width: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
