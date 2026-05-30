import { describe, expect, it } from 'vitest';
import { encodeAudioBufferToWav } from './audioConversion';

describe('encodeAudioBufferToWav', () => {
  it('creates a WAV blob with a RIFF header', async () => {
    const buffer = {
      numberOfChannels: 1,
      sampleRate: 16000,
      length: 4,
      getChannelData: () => new Float32Array([0, 0.25, -0.25, 1])
    } as unknown as AudioBuffer;

    const wav = encodeAudioBufferToWav(buffer);
    const header = new TextDecoder().decode(await readBlobArrayBuffer(wav.slice(0, 4)));

    expect(wav.type).toBe('audio/wav');
    expect(wav.size).toBeGreaterThan(44);
    expect(header).toBe('RIFF');
  });
});

function readBlobArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('read failed')));
    reader.readAsArrayBuffer(blob);
  });
}
