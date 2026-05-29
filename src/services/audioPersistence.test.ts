import { describe, expect, it } from 'vitest';
import { blobToDataUrl, dataUrlToBlob } from './audioPersistence';

const readBlobText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsText(blob);
  });

describe('audio persistence helpers', () => {
  it('round-trips an audio blob through a data URL', async () => {
    const original = new Blob(['audio-bytes'], { type: 'audio/webm' });

    const dataUrl = await blobToDataUrl(original);
    const restored = dataUrlToBlob(dataUrl);

    expect(dataUrl).toMatch(/^data:audio\/webm;base64,/);
    expect(restored.type).toBe('audio/webm');
    expect(await readBlobText(restored)).toBe('audio-bytes');
  });
});
