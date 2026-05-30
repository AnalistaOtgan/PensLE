import { afterEach, describe, expect, it, vi } from 'vitest';
import { transcribeAudio } from './transcriptionService';
import { defaultSettings } from './storageService';

describe('transcribeAudio', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

  it('keeps browser WebM recordings as WebM uploads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('transcricao', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await transcribeAudio(new Blob(['audio'], { type: 'audio/webm' }), {
      ...defaultSettings,
      groqApiKey: 'gsk_test'
    });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const file = (request.body as FormData).get('file') as File;

    expect(file.name).toBe('recording.webm');
    expect(file.type).toBe('audio/webm');
  });

  it('normalizes native AAC recordings to WAV uploads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('transcricao', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('AudioContext', FakeAudioContext);

    await transcribeAudio(new Blob(['audio'], { type: 'audio/aac' }), {
      ...defaultSettings,
      groqApiKey: 'gsk_test'
    });

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const file = (request.body as FormData).get('file') as File;

    expect(file.name).toBe('recording.wav');
    expect(file.type).toBe('audio/wav');
    expect(file.size).toBeGreaterThan(44);
  });

  it('includes Groq response details when transcription fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'Invalid file format' } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );

    await expect(
      transcribeAudio(new Blob(['audio'], { type: 'audio/webm' }), {
        ...defaultSettings,
        groqApiKey: 'gsk_test'
      })
    ).rejects.toThrow('Falha na transcricao (400): Invalid file format');
  });
});

class FakeAudioContext {
  async decodeAudioData() {
    return {
      numberOfChannels: 1,
      sampleRate: 16000,
      length: 4,
      getChannelData: () => new Float32Array([0, 0.25, -0.25, 1])
    } as unknown as AudioBuffer;
  }

  async close() {
    return undefined;
  }
}
