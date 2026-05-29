import { afterEach, describe, expect, it, vi } from 'vitest';
import { transcribeAudio } from './transcriptionService';
import { defaultSettings } from './storageService';

describe('transcribeAudio', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('turns browser fetch failures into an actionable Groq connection message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );

    await expect(
      transcribeAudio(new Blob(['audio'], { type: 'audio/webm' }), {
        ...defaultSettings,
        groqApiKey: 'gsk_test'
      })
    ).rejects.toThrow('Não foi possível conectar à Groq');
  });
});
