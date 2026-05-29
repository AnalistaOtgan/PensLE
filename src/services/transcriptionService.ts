import type { AppSettings } from '../types';

export async function transcribeAudio(audioBlob: Blob, settings: AppSettings): Promise<string> {
  if (!settings.groqApiKey) {
    throw new Error('Configure sua API key da Groq em Ajustes para transcrever áudio.');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
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
    throw new Error(`Falha na transcrição (${response.status}).`);
  }

  return response.text();
}
