import { describe, expect, it } from 'vitest';
import { createFallbackAiResponse, parseAiNoteResponse, validateConnections } from './aiService';
import type { NoteSummary } from '../types';

describe('parseAiNoteResponse', () => {
  it('parses strict JSON surrounded by harmless whitespace', () => {
    const parsed = parseAiNoteResponse(` {
      "title": "Ritual de estudo",
      "summary": "Como estudar com consistencia.",
      "body": "## Ideia\\nCriar um ritual.",
      "tags": ["estudo", "ritual"],
      "connections": [],
      "wikilinks": []
    } `);

    expect(parsed.title).toBe('Ritual de estudo');
    expect(parsed.tags).toEqual(['estudo', 'ritual']);
  });
});

describe('validateConnections', () => {
  it('drops unknown notes, de-duplicates links, limits weak links, and caps at five', () => {
    const existing: NoteSummary[] = [
      { id: 'a', title: 'A', summary: 'A', tags: [], createdAt: '2026-05-29T10:00:00.000Z' },
      { id: 'b', title: 'B', summary: 'B', tags: [], createdAt: '2026-05-29T10:00:00.000Z' },
      { id: 'c', title: 'C', summary: 'C', tags: [], createdAt: '2026-05-29T10:00:00.000Z' },
      { id: 'd', title: 'D', summary: 'D', tags: [], createdAt: '2026-05-29T10:00:00.000Z' },
      { id: 'e', title: 'E', summary: 'E', tags: [], createdAt: '2026-05-29T10:00:00.000Z' },
      { id: 'f', title: 'F', summary: 'F', tags: [], createdAt: '2026-05-29T10:00:00.000Z' }
    ];

    const valid = validateConnections(
      [
        { noteId: 'missing', noteTitle: 'Nope', reason: 'none', strength: 'strong' },
        { noteId: 'a', noteTitle: 'A', reason: 'same project', strength: 'strong' },
        { noteId: 'a', noteTitle: 'A duplicate', reason: 'duplicate', strength: 'moderate' },
        { noteId: 'b', noteTitle: 'B', reason: 'same theme', strength: 'moderate' },
        { noteId: 'c', noteTitle: 'C', reason: 'minor overlap', strength: 'weak' },
        { noteId: 'd', noteTitle: 'D', reason: 'minor overlap', strength: 'weak' },
        { noteId: 'e', noteTitle: 'E', reason: 'same idea', strength: 'strong' },
        { noteId: 'f', noteTitle: 'F', reason: 'same idea', strength: 'strong' }
      ],
      existing
    );

    expect(valid.map((connection) => connection.noteId)).toEqual(['a', 'b', 'e', 'f']);
  });
});

describe('createFallbackAiResponse', () => {
  it('does not turn a transcription failure message into the raw transcript', () => {
    const fallback = createFallbackAiResponse('', 'Configure sua API key da Groq em Ajustes.');

    expect(fallback.title).toBe('Áudio salvo sem transcrição');
    expect(fallback.summary).toContain('Configure sua API key da Groq em Ajustes.');
    expect(fallback.body).toContain('## Status');
    expect(fallback.body).toContain('Configure sua API key da Groq em Ajustes.');
    expect(fallback.tags).toEqual(['captura', 'sem-transcricao']);
  });
});
