import { normalizeAudioForTranscription } from './audioConversion';
import type { AppSettings } from '../types';

function getAudioFileName(audioBlob: Blob): string {
  const mimeType = audioBlob.type.toLowerCase();

  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
    return 'recording.mp3';
  }
  if (mimeType.includes('wav')) {
    return 'recording.wav';
  }
  if (mimeType.includes('ogg')) {
    return 'recording.ogg';
  }

  return 'recording.webm';
}

export async function transcribeAudio(audioBlob: Blob, settings: AppSettings): Promise<string> {
  if (!settings.groqApiKey) {
    throw new Error('Configure sua API key da Groq em Ajustes para transcrever audio.');
  }

  const uploadBlob = await normalizeAudioForTranscription(audioBlob);
  const fileName = getAudioFileName(uploadBlob);
  const formData = new FormData();
  formData.append('file', uploadBlob, fileName);
  formData.append('model', 'whisper-large-v3');
  if (settings.language !== 'auto') {
    formData.append('language', settings.language);
  }
  formData.append('response_format', 'text');

  let response: Response;
  try {
    response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.groqApiKey}`
      },
      body: formData
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'erro de rede desconhecido';
    throw new Error(
      `Não foi possível conectar à Groq. Verifique a internet do celular, a VPN/Tailscale e tente novamente. Detalhe: ${detail}`
    );
  }

  if (!response.ok) {
    const detail = await readGroqError(response);
    const metadata = `arquivo: ${fileName}; tipo: ${uploadBlob.type || 'desconhecido'}; tamanho: ${uploadBlob.size} bytes`;
    throw new Error(`Falha na transcricao (${response.status}): ${detail} (${metadata})`);
  }

  return response.text();
}

async function readGroqError(response: Response): Promise<string> {
  const fallback = response.statusText || 'erro desconhecido';

  try {
    const text = await response.text();
    if (!text.trim()) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
      return parsed.error?.message || parsed.message || text;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
}
