import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '../types';

const isNativePlatformMock = vi.hoisted(() => vi.fn());

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: isNativePlatformMock
  }
}));

describe('exportNotes', () => {
  const notes: Note[] = [
    {
      id: 'note-1',
      title: 'Nota',
      summary: 'Resumo',
      body: 'Conteudo',
      rawTranscript: 'raw',
      tags: ['tag'],
      connections: [],
      createdAt: '2026-05-29T20:00:00.000Z',
      updatedAt: '2026-05-29T20:00:00.000Z',
      wordCount: 1
    }
  ];

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    isNativePlatformMock.mockReset();
    vi.resetModules();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined
    });
  });

  it('copies JSON to the clipboard on native platforms', async () => {
    isNativePlatformMock.mockReturnValue(true);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock
      }
    });
    const { exportNotes } = await import('./exportService');

    const result = await exportNotes(notes);

    expect(writeTextMock).toHaveBeenCalledWith(JSON.stringify(notes, null, 2));
    expect(result).toEqual({
      mode: 'copied',
      content: JSON.stringify(notes, null, 2),
      message: 'JSON copiado para a area de transferencia.'
    });
  });

  it('returns a copy fallback on native platforms when clipboard fails', async () => {
    isNativePlatformMock.mockReturnValue(true);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('clipboard unavailable'))
      }
    });
    const { exportNotes } = await import('./exportService');

    const result = await exportNotes(notes);

    expect(result).toEqual({
      mode: 'copy-fallback',
      content: JSON.stringify(notes, null, 2),
      message: 'JSON pronto para copiar.',
      error: 'Nao foi possivel copiar automaticamente.'
    });
  });

  it('downloads a JSON file in the browser', async () => {
    isNativePlatformMock.mockReturnValue(false);
    const clickMock = vi.fn();
    const anchor = {
      href: '',
      download: '',
      click: clickMock
    } as unknown as HTMLAnchorElement;
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn()
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn()
    });
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const { exportNotes } = await import('./exportService');

    const result = await exportNotes(notes);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(anchor.href).toBe('blob:export');
    expect(anchor.download).toBe('pensle-notas.json');
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:export');
    expect(result).toEqual({
      mode: 'download',
      content: JSON.stringify(notes, null, 2),
      message: 'Notas exportadas para download.'
    });
  });
});
