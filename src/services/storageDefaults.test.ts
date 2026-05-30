import { afterEach, describe, expect, it, vi } from 'vitest';

describe('defaultSettings', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses a Groq API key from the build environment as the initial setting', async () => {
    vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_env_test');
    vi.resetModules();

    const { defaultSettings } = await import('./storageService');

    expect(defaultSettings.groqApiKey).toBe('gsk_env_test');
  });

  it('keeps the build Groq API key when stored settings contain an empty key', async () => {
    vi.stubEnv('VITE_GROQ_API_KEY', 'gsk_env_test');
    vi.resetModules();

    const { BrowserStorageService } = await import('./storageService');
    localStorage.setItem(
      'test-empty-settings:state',
      JSON.stringify({
        notes: [],
        connections: [],
        settings: {
          groqApiKey: '',
          language: 'pt',
          keepAudio: true,
          model: 'llama-3.1-8b-instant',
          theme: 'dark'
        }
      })
    );

    const settings = await new BrowserStorageService('test-empty-settings').getSettings();

    expect(settings.groqApiKey).toBe('gsk_env_test');
  });
});
