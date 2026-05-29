import { beforeEach, describe, expect, it } from 'vitest';
import { BrowserStorageService } from './storageService';
import type { Note } from '../types';

describe('BrowserStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists notes and returns summaries sorted newest first', async () => {
    const storage = new BrowserStorageService('test');
    const oldNote: Note = {
      id: 'old',
      title: 'Antiga',
      summary: 'Resumo antigo',
      body: 'Antigo',
      rawTranscript: 'raw',
      tags: ['memoria'],
      connections: [],
      createdAt: '2026-05-28T10:00:00.000Z',
      updatedAt: '2026-05-28T10:00:00.000Z',
      wordCount: 1
    };
    const newNote: Note = {
      ...oldNote,
      id: 'new',
      title: 'Nova',
      summary: 'Resumo novo',
      createdAt: '2026-05-29T10:00:00.000Z',
      updatedAt: '2026-05-29T10:00:00.000Z'
    };

    await storage.saveNote(oldNote, []);
    await storage.saveNote(newNote, []);

    const summaries = await storage.getAllNotesSummaries();

    expect(summaries.map((note) => note.id)).toEqual(['new', 'old']);
    expect(await storage.getNote('new')).toMatchObject({ title: 'Nova' });
  });
});
