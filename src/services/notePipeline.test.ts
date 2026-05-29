import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canProcessNoteLater, processSavedNote } from './notePipeline';
import { defaultSettings, storageService } from './storageService';
import type { Note } from '../types';

const baseNote: Note = {
  id: 'note-1',
  title: 'Áudio salvo sem transcrição',
  summary: 'Resumo',
  body: 'Corpo',
  rawTranscript: '',
  tags: ['captura', 'sem-transcricao'],
  connections: [],
  createdAt: '2026-05-29T12:00:00.000Z',
  updatedAt: '2026-05-29T12:00:00.000Z',
  wordCount: 3
};

describe('canProcessNoteLater', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows later processing when a note has persistent audio', () => {
    expect(canProcessNoteLater({ ...baseNote, audioDataUrl: 'data:audio/webm;base64,YQ==' })).toBe(true);
  });

  it('does not rely on temporary blob URLs for later processing', () => {
    expect(canProcessNoteLater({ ...baseNote, audioUrl: 'blob:https://app.local/audio-id' })).toBe(false);
  });

  it('allows later treatment when a note has raw transcription', () => {
    expect(canProcessNoteLater({ ...baseNote, rawTranscript: 'texto bruto' })).toBe(true);
  });

  it('does not treat the legacy unavailable message as a usable transcription', () => {
    expect(
      canProcessNoteLater({
        ...baseNote,
        rawTranscript: 'Transcrição indisponível. O áudio foi capturado no navegador, mas não pôde ser enviado para IA.'
      })
    ).toBe(false);
  });

  it('does not allow processing when there is no audio or transcript', () => {
    expect(canProcessNoteLater(baseNote)).toBe(false);
  });

  it('does not claim later processing succeeded without a Groq API key', async () => {
    await storageService.saveNote({ ...baseNote, rawTranscript: 'texto bruto capturado' }, []);

    await expect(processSavedNote(baseNote.id, { ...defaultSettings, groqApiKey: '' })).rejects.toThrow(
      'Configure sua API key da Groq'
    );
  });

  it('returns an actionable message when later AI treatment cannot reach Groq', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );
    await storageService.saveNote({ ...baseNote, rawTranscript: 'texto bruto capturado' }, []);

    const result = await processSavedNote(baseNote.id, { ...defaultSettings, groqApiKey: 'gsk_test' });

    expect(result.usedFallback).toBe(true);
    expect(result.message).toContain('Não foi possível conectar à Groq');
  });
});
